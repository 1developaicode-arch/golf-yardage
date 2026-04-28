'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/',           label: 'Bag',       icon: '🏌️' },
  { href: '/log',        label: 'Log Shot',  icon: '📍' },
  { href: '/clubs',      label: 'Clubs',     icon: '🏒' },
  { href: '/dispersion', label: 'Dispersion',icon: '🎯' },
  { href: '/settings',   label: 'Settings',  icon: '⚙️' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-golf-900 border-t border-golf-700 z-50">
      <div className="max-w-md mx-auto flex">
        {tabs.map(tab => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                active ? 'text-golf-300' : 'text-golf-600'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
