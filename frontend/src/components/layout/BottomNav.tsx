'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: 'grid_view', label: 'Dashboard' },
  { href: '/resume/upload', icon: 'analytics', label: 'Analyze' },
  { href: '/resumes', icon: 'description', label: 'Resumes' },
  { href: '/settings', icon: 'settings', label: 'Settings' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-2xl bg-white/80 backdrop-blur-xl border-t border-slate-200/15 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] flex justify-around items-center px-4 h-20">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center pt-2 transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-slate-900 font-bold border-t-2 border-slate-900'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl mb-1"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
