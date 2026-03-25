'use client'

import { useSession } from 'next-auth/react'
import UserMenu from '@/components/UserMenu'

export default function TopNav() {
  const { data: session } = useSession()

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex fixed top-0 right-0 w-[calc(100%-16rem)] h-16 justify-end items-center px-8 z-40 bg-white/80 backdrop-blur-xl text-sm">
        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-all">
              notifications
            </span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-all">
              help_outline
            </span>
          </div>
          {session?.user && <UserMenu />}
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-slate-100/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-slate-900 cursor-pointer active:scale-95 duration-200">
            menu
          </span>
          <h1 className="text-xl font-extrabold tracking-tighter text-slate-900 font-headline">AutoResume</h1>
        </div>
        {session?.user && <UserMenu />}
      </header>
    </>
  )
}
