'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/',           label: 'My Bag',     icon: '🏌️', desc: 'Yardage overview' },
  { href: '/log',        label: 'Log Shot',   icon: '📍', desc: 'Record a distance' },
  { href: '/clubs',      label: 'Clubs',      icon: '🏒', desc: 'Manage your bag' },
  { href: '/dispersion', label: 'Dispersion', icon: '🎯', desc: 'Shot spread chart' },
  { href: '/settings',   label: 'Settings',   icon: '⚙️', desc: 'Preferences' },
]

export default function SideNav() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-border fixed top-0 left-0 z-40 shadow-sm">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⛳</span>
          <div>
            <h1 className="text-text-primary font-bold text-lg leading-tight">Golf Yardage</h1>
            <p className="text-text-muted text-xs">Smart caddie</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map(tab => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                active
                  ? 'bg-golf-50 text-golf-900'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              <span className="text-xl w-7 text-center">{tab.icon}</span>
              <div>
                <p className={`font-semibold text-sm leading-tight ${active ? 'text-golf-900' : ''}`}>{tab.label}</p>
                <p className="text-text-muted text-xs">{tab.desc}</p>
              </div>
              {active && <span className="ml-auto w-1.5 h-6 bg-golf-600 rounded-full" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t border-border">
        <p className="text-text-muted text-xs">Golf Yardage v1.0</p>
      </div>
    </aside>
  )
}
