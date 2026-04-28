'use client'
import { useEffect, useState } from 'react'
import { addClubToBag, getBag, getClubs, getCustomClubs, removeClubFromBag } from '@/lib/db'
import { Club } from '@/lib/types'

interface CustomClub { id: string; name: string; type: string }

const TYPE_LABELS: Record<string, string> = { wood: 'Woods', hybrid: 'Hybrids', iron: 'Irons', wedge: 'Wedges', custom: 'My Custom Clubs' }
const TYPE_ORDER = ['wood', 'hybrid', 'iron', 'wedge', 'custom']

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [customClubs, setCustomClubs] = useState<CustomClub[]>([])
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getClubs(), getCustomClubs(), getBag()]).then(([allClubs, cc, bag]) => {
      setClubs(allClubs)
      setCustomClubs(cc)
      setActiveIds(new Set(bag.map((b: { club_id: string }) => b.club_id)))
      setLoading(false)
    })
  }, [])

  async function toggle(id: string) {
    if (saving) return
    setSaving(id)
    if (activeIds.has(id)) {
      await removeClubFromBag(id)
      setActiveIds(prev => { const s = new Set(prev); s.delete(id); return s })
    } else {
      if (activeIds.size >= 13) { setSaving(null); return }
      await addClubToBag(id)
      setActiveIds(prev => new Set([...prev, id]))
    }
    setSaving(null)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading...</div>

  // Standard clubs grouped by type
  const grouped = TYPE_ORDER.filter(t => t !== 'custom').map(type => ({
    type,
    label: TYPE_LABELS[type],
    items: clubs.filter(c => c.type === type).map(c => ({ id: c.id, name: c.name })),
  }))

  // Add custom clubs group if any exist
  if (customClubs.length > 0) {
    grouped.push({
      type: 'custom',
      label: TYPE_LABELS['custom'],
      items: customClubs.map(c => ({ id: c.id, name: c.name })),
    })
  }

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
        {grouped.map(({ type, label, items }) => (
          items.length === 0 ? null :
          <div key={type} className="mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">{label}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.map(item => {
                const active = activeIds.has(item.id)
                const disabled = !active && activeIds.size >= 13
                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    disabled={disabled || saving === item.id}
                    className={`rounded-2xl border-2 p-4 text-left transition-all shadow-sm ${
                      active
                        ? 'bg-golf-600 border-golf-600 text-white'
                        : disabled
                        ? 'bg-surface-2 border-border text-text-muted cursor-not-allowed'
                        : 'bg-white border-border text-text-primary hover:border-golf-400 hover:bg-golf-50 active:scale-95'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{item.name}</span>
                      <span className={`text-lg font-bold ${active ? 'text-white' : 'text-border-dark'}`}>
                        {saving === item.id ? '…' : active ? '✓' : '+'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {customClubs.length === 0 && (
        <p className="text-text-muted text-xs text-center mt-6">
          Add custom clubs in <span className="font-semibold text-text-secondary">Settings → Custom Clubs</span>
        </p>
      )}
    </div>
  )
}
