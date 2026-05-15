'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import BottomNav from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  // `required: true` defers the redirect decision until NextAuth confirms the
  // session state, avoiding a transient 'unauthenticated' flash right after
  // the Google OAuth callback (which was causing first-login → bounce to
  // /login → user has to click Google a second time).
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login')
    },
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="bg-surface min-h-screen font-body text-on-surface antialiased">
      <Sidebar />
      <TopNav />
      <main className="md:ml-64 pt-24 pb-28 md:pb-20 px-6 md:px-12 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
