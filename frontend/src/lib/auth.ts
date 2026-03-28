import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })
          if (!res.ok) return null
          const data = await res.json()
          return {
            id: data.user._id,
            email: data.user.email,
            name: data.user.name,
            accessToken: data.token,
          } as any
        } catch {
          return null
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Credentials login: accessToken comes from Express /api/auth/login
      if (user && account?.provider === 'credentials') {
        token.id = user.id
        token.accessToken = (user as any).accessToken
      }

      // Google OAuth: call Express to find-or-create user and get JWT
      if (account?.provider === 'google') {
        try {
          const res = await fetch(`${API_URL}/api/auth/oauth-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: token.email,
              name: token.name,
              provider: 'google',
            }),
          })
          if (res.ok) {
            const data = await res.json()
            token.id = data.user._id
            token.accessToken = data.token
          }
        } catch (err) {
          console.error('OAuth login sync error:', err)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
      }
      ;(session as any).accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
