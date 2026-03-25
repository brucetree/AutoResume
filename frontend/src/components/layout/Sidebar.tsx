'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/resume/upload', icon: 'analytics', label: 'Analysis' },
  { href: '/resumes', icon: 'description', label: 'Resume Management' },
  { href: '/settings', icon: 'settings', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 flex-col py-8 px-4 bg-slate-50 font-headline tracking-tight z-50">
      <div className="mb-12 px-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-slate-900 text-2xl">widgets</span>
          <h1 className="text-xl font-bold tracking-tighter text-slate-900">AutoResume</h1>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-medium">High-End Analysis</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 ${
                isActive
                  ? 'border-l-4 border-slate-900 font-semibold text-slate-900 bg-slate-100'
                  : 'hover:bg-slate-200/50 text-slate-500 hover:text-slate-700'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}

        <div className="pt-4 px-2">
          <Link
            href="/resume/upload"
            className="w-full obsidian-gradient text-white py-3 rounded-xl text-sm font-semibold shadow-ambient hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Analyze New Resume
          </Link>
        </div>
      </nav>
    </aside>
  )
}
