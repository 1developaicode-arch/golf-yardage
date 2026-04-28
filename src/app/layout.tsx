import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import SideNav from '@/components/SideNav'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Golf Yardage',
  description: 'Track your golf club distances',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full bg-golf-950 font-outfit antialiased">
        <SideNav />
        {/* Desktop: offset content by sidebar width */}
        <div className="md:ml-64 min-h-screen flex flex-col bg-surface-2">
          <div className="max-w-md mx-auto w-full pb-20 md:max-w-none md:pb-0 md:p-8 flex-1">
            {children}
          </div>
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
