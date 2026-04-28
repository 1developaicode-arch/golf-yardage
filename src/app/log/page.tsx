'use client'
import { useEffect, useState } from 'react'
import { getBag, getSettings, getShots, logShot, deleteShot } from '@/lib/db'
import { BagEntry, Settings, Shot, ShotType, shotLabels } from '@/lib/types'
import { convertDistance, unitLabel, SHOT_TYPES } from '@/lib/utils'

export default function LogPage() {
  const [bag, setBag] = useState<BagEntry[]>([])
  const [shots, setShots] = useState<Shot[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selectedClub, setSelectedClub] = useState<string>('')
  const [selectedType, setSelectedType] = useState<ShotType>('full')
  const [distance, setDistance] = useState('')
  const [dispLeft, setDispLeft] = useState('')
  const [dispRight, setDispRight] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getBag(), getSettings(), getShots()]).then(([b, s, sh]) => {
      setBag(b); setSettings(s); setShots(sh)
      if (b.length > 0) setSelectedClub(b[0].club_id)
      setLoading(false)
    })
  }, [])

  async function handleAdd() {
    if (!selectedClub || !distance || isNaN(parseFloat(distance))) return
    setSaving(true)
    let yards = parseFloat(distance)
    if (settings?.units === 'meters') yards = yards / 0.9144
    await logShot({
      club_id: selectedClub, shot_type: selectedType, distance_yards: yards,
      dispersion_left: dispLeft ? parseFloat(dispLeft) : null,
      dispersion_right: dispRight ? parseFloat(dispRight) : null,
    })
    const newShots = await getShots()
    setShots(newShots)
    setDistance(''); setDispLeft(''); setDispRight('')
    setSaving(false); setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteShot(id)
    setShots(prev => prev.filter(s => s.id !== id))
    setDeleting(null)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading...</div>
  if (!settings) return null
  const unit = unitLabel(settings.units)
  const labels = shotLabels(settings)

  const selectedEntry = bag.find(b => b.club_id === selectedClub)
  const isWedge = selectedEntry?.club?.type === 'wedge'
  const availableTypes = (!settings.partial_shots && !isWedge) ? (['full'] as ShotType[]) : SHOT_TYPES

  // History filtered to selected club; hide partial shots for non-wedge clubs when setting is off
  const clubHistory = shots.filter(s => {
    if (s.club_id !== selectedClub) return false
    if (!settings.partial_shots && !isWedge && s.shot_type !== 'full') return false
    return true
  })

  return (
    <div className="p-4 md:p-0">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Log a Shot</h1>
        <p className="text-text-muted text-sm">Record your distance</p>
      </div>

      {bag.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🏌️</p>
          <p className="font-semibold text-text-primary">No clubs in your bag</p>
          <p className="text-sm mt-1 text-text-muted">Add clubs first from the Clubs tab</p>
        </div>
      ) : (
        <div className="md:flex md:gap-6 md:items-start">
          {/* Form */}
          <div className="md:flex-1">
            {/* Club selector */}
            <div className="mb-4">
              <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 block">Club</label>
              <div className="flex flex-wrap gap-2">
                {bag.map(entry => (
                  <button key={entry.club_id} onClick={() => {
                    setSelectedClub(entry.club_id)
                    if (!settings.partial_shots && entry.club?.type !== 'wedge') setSelectedType('full')
                  }}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold border-2 transition-all ${
                      selectedClub === entry.club_id
                        ? 'bg-golf-600 border-golf-600 text-white'
                        : 'bg-white border-border text-text-primary hover:border-golf-400'
                    }`}>
                    {entry.club?.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Shot type */}
            <div className="mb-4">
              <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 block">Shot Type</label>
              <div className={`grid gap-2 ${availableTypes.length === 1 ? 'grid-cols-1' : availableTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
                {availableTypes.map(st => (
                  <button key={st} onClick={() => setSelectedType(st)}
                    className={`rounded-xl py-3 font-bold border-2 transition-all ${
                      selectedType === st
                        ? 'bg-golf-600 border-golf-600 text-white'
                        : 'bg-white border-border text-text-primary hover:border-golf-400'
                    }`}>
                    {labels[st]}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div className="mb-4">
              <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 block">Distance ({unit})</label>
              <input type="number" value={distance} onChange={e => setDistance(e.target.value)}
                placeholder="e.g. 150"
                className="w-full bg-white border-2 border-border rounded-2xl px-4 py-4 text-text-primary text-3xl font-bold placeholder:text-border-dark outline-none focus:border-golf-500 text-center shadow-sm"
              />
            </div>

            {/* Dispersion */}
            {settings.track_dispersion && (
              <div className="mb-4 bg-white border border-border rounded-2xl p-4 shadow-sm">
                <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-3 block">Dispersion ({unit})</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-text-muted text-xs mb-1">← Left</p>
                    <input type="number" value={dispLeft} onChange={e => setDispLeft(e.target.value)} placeholder="0"
                      className="w-full bg-white border-2 border-border rounded-xl px-3 py-2.5 text-text-primary font-bold outline-none focus:border-golf-500 text-center"
                    />
                  </div>
                  <div>
                    <p className="text-text-muted text-xs mb-1">Right →</p>
                    <input type="number" value={dispRight} onChange={e => setDispRight(e.target.value)} placeholder="0"
                      className="w-full bg-white border-2 border-border rounded-xl px-3 py-2.5 text-text-primary font-bold outline-none focus:border-golf-500 text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Add button */}
            <button onClick={handleAdd} disabled={saving || !distance}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all mb-4 shadow-sm ${
                success ? 'bg-golf-500 text-white'
                : saving || !distance ? 'bg-surface-3 text-text-muted cursor-not-allowed'
                : 'bg-golf-600 text-white hover:bg-golf-700 active:scale-95'
              }`}>
              {success ? '✓ Shot Added!' : saving ? 'Saving…' : 'Add Shot'}
            </button>
          </div>

          {/* History — filtered to selected club */}
          <div className="md:w-96 md:flex-shrink-0 mt-2 md:mt-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">
                {bag.find(b => b.club_id === selectedClub)?.club?.name ?? ''} History
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-text-muted text-xs">{clubHistory.length} shots</span>
            </div>
            {clubHistory.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-6">No shots logged for this club yet</p>
            ) : (
              <div className="space-y-2 md:max-h-[calc(100vh-160px)] md:overflow-y-auto">
                {clubHistory.map(shot => (
                  <div key={shot.id} className="bg-white border border-border rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-text-secondary font-semibold text-sm">{labels[shot.shot_type]}</span>
                      {shot.dispersion_left != null && (
                        <span className="text-text-muted text-xs ml-2">←{convertDistance(shot.dispersion_left, settings.units)}</span>
                      )}
                      {shot.dispersion_right != null && (
                        <span className="text-text-muted text-xs ml-1">{convertDistance(shot.dispersion_right, settings.units)}→</span>
                      )}
                      <p className="text-text-muted text-xs">{new Date(shot.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-golf-700 font-bold text-lg">{convertDistance(shot.distance_yards, settings.units)} {unit}</span>
                      <button
                        onClick={() => handleDelete(shot.id)}
                        disabled={deleting === shot.id}
                        className="text-red-400 hover:text-red-600 font-bold text-xl leading-none transition-colors disabled:opacity-40"
                      >
                        {deleting === shot.id ? '…' : '×'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
