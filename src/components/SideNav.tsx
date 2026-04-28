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
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-golf-900 border-r border-golf-700 fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-golf-700">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⛳</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Golf Yardage</h1>
            <p className="text-golf-500 text-xs">Smart caddie</p>
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
                  ? 'bg-golf-700 text-white'
                  : 'text-golf-500 hover:bg-golf-800 hover:text-golf-200'
              }`}
            >
              <span className="text-xl w-7 text-center">{tab.icon}</span>
              <div>
                <p className={`font-semibold text-sm leading-tight ${active ? 'text-white' : ''}`}>{tab.label}</p>
                <p className="text-golf-600 text-xs group-hover:text-golf-500">{tab.desc}</p>
              </div>
              {active && <span className="ml-auto w-1.5 h-6 bg-golf-400 rounded-full" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-golf-700">
        <p className="text-golf-700 text-xs">Golf Yardage v1.0</p>
      </div>
    </aside>
  )
}
