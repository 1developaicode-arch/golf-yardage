'use client'
import { useEffect, useState } from 'react'
import { addClubToBag, getBag, getClubs, removeClubFromBag } from '@/lib/db'
import { Club } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  wood: 'Woods',
  hybrid: 'Hybrids',
  iron: 'Irons',
  wedge: 'Wedges',
}

const TYPE_ORDER = ['wood', 'hybrid', 'iron', 'wedge']

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getClubs(), getBag()]).then(([allClubs, bag]) => {
      setClubs(allClubs)
      setActiveIds(new Set(bag.map((b: { club_id: string }) => b.club_id)))
      setLoading(false)
    })
  }, [])

  async function toggle(club: Club) {
    if (saving) return
    setSaving(club.id)
    const isActive = activeIds.has(club.id)
    if (isActive) {
      await removeClubFromBag(club.id)
      setActiveIds(prev => { const s = new Set(prev); s.delete(club.id); return s })
    } else {
      if (activeIds.size >= 13) { setSaving(null); return }
      await addClubToBag(club.id)
      setActiveIds(prev => new Set([...prev, club.id]))
    }
    setSaving(null)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-golf-400">Loading...</div>

  const grouped = TYPE_ORDER.map(type => ({
    type,
    label: TYPE_LABELS[type],
    clubs: clubs.filter(c => c.type === type),
  }))

  return (
    <div className="flex-1 p-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Select Clubs</h1>
        <p className="text-golf-500 text-sm mt-1">
          <span className={activeIds.size >= 13 ? 'text-gold-400 font-semibold' : 'text-golf-400'}>
            {activeIds.size}/13
          </span>
          {' '}clubs selected
        </p>
      </div>

      {grouped.map(({ type, label, clubs: list }) => (
        <div key={type} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-golf-400 text-xs font-bold uppercase tracking-widest">{label}</span>
            <div className="flex-1 h-px bg-golf-800" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {list.map(club => {
              const active = activeIds.has(club.id)
              const disabled = !active && activeIds.size >= 13
              return (
                <button
                  key={club.id}
                  onClick={() => toggle(club)}
                  disabled={disabled || saving === club.id}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? 'bg-golf-700 border-golf-400 text-white'
                      : disabled
                      ? 'bg-golf-900 border-golf-800 text-golf-700 cursor-not-allowed'
                      : 'bg-golf-900 border-golf-700 text-golf-300 active:scale-95'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{club.name}</span>
                    <span className={`text-lg ${active ? 'text-golf-300' : 'text-golf-700'}`}>
                      {active ? '✓' : '+'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
