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
  // Explicit cookie config overrides NextAuth's automatic __Host-/__Secure-
  // prefix names. Background: in production (HTTPS) NextAuth defaults to
  // __Host-next-auth.* and __Secure-next-auth.* names. These prefixes carry
  // extra browser-side validation, and we have been observing that the
  // pkce.code_verifier + state cookies set during /api/auth/signin/google
  // were not being sent back on the cross-site Google → callback redirect,
  // producing "[OAUTH_CALLBACK_ERROR] State cookie was missing." on the
  // first attempt for every user. Localhost (no prefix names) was unaffected.
  // Dropping the prefixes and keeping Secure + SameSite=Lax matches the
  // behaviour that works on localhost while still requiring HTTPS transport.
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: true },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: { sameSite: 'lax', path: '/', secure: true },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: true },
    },
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: true, maxAge: 60 * 15 },
    },
    state: {
      name: 'next-auth.state',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: true, maxAge: 60 * 15 },
    },
    nonce: {
      name: 'next-auth.nonce',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: true },
    },
  },
}
