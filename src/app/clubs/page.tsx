'use client'
import { useEffect, useState } from 'react'
import { addClubToBag, getBag, getClubs, removeClubFromBag } from '@/lib/db'
import { Club } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = { wood: 'Woods', hybrid: 'Hybrids', iron: 'Irons', wedge: 'Wedges' }
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
    if (activeIds.has(club.id)) {
      await removeClubFromBag(club.id)
      setActiveIds(prev => { const s = new Set(prev); s.delete(club.id); return s })
    } else {
      if (activeIds.size >= 13) { setSaving(null); return }
      await addClubToBag(club.id)
      setActiveIds(prev => new Set([...prev, club.id]))
    }
    setSaving(null)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading...</div>

  const grouped = TYPE_ORDER.map(type => ({
    type, label: TYPE_LABELS[type],
    clubs: clubs.filter(c => c.type === type),
  }))

  return (
    <div className="p-4 md:p-0">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Select Clubs</h1>
        <p className="text-text-muted text-sm mt-1">
          <span className={activeIds.size >= 13 ? 'text-gold-500 font-bold' : 'text-text-secondary'}>
            {activeIds.size}/13
          </span>
          {' '}clubs selected · tap to add or remove
        </p>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-6">
        {grouped.map(({ type, label, clubs: list }) => (
          <div key={type} className="mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">{label}</span>
              <div className="flex-1 h-px bg-border" />
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
                    className={`rounded-2xl border-2 p-4 text-left transition-all shadow-sm ${
                      active
                        ? 'bg-golf-600 border-golf-600 text-white'
                        : disabled
                        ? 'bg-surface-2 border-border text-text-muted cursor-not-allowed'
                        : 'bg-white border-border text-text-primary hover:border-golf-400 hover:bg-golf-50 active:scale-95'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{club.name}</span>
                      <span className={`text-lg font-bold ${active ? 'text-white' : 'text-border-dark'}`}>
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
    </div>
  )
}
