import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Golf Yardage',
  description: 'Track your golf club distances',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full bg-golf-950 font-outfit antialiased">
        <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
