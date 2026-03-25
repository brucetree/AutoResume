'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/resume/upload', icon: 'analytics', label: 'Analyze' },
  { href: '/resumes', icon: 'description', label: 'Resumes' },
  { href: '/settings', icon: 'settings', label: 'Settings' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pt-3 pb-8 bg-white/80 backdrop-blur-xl z-50 rounded-t-3xl shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.08)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center active:scale-90 transition-all duration-200 ${
              isActive
                ? 'text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
            {isActive && (
              <span className="w-1 h-1 bg-emerald-500 rounded-[9999px] mt-1" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
