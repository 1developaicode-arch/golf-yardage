'use client'
import { useEffect, useState } from 'react'
import { getBag, getSettings, getShots, logShot } from '@/lib/db'
import { BagEntry, Settings, Shot, ShotType } from '@/lib/types'
import { convertDistance, unitLabel } from '@/lib/utils'

const SHOT_TYPES: ShotType[] = ['full', '3/4', '1/2', '1/4']

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getBag(), getSettings(), getShots()]).then(([b, s, sh]) => {
      setBag(b)
      setSettings(s)
      setShots(sh)
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
      club_id: selectedClub,
      shot_type: selectedType,
      distance_yards: yards,
      dispersion_left: dispLeft ? parseFloat(dispLeft) : null,
      dispersion_right: dispRight ? parseFloat(dispRight) : null,
    })

    const newShots = await getShots()
    setShots(newShots)
    setDistance('')
    setDispLeft('')
    setDispRight('')
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-golf-400">Loading...</div>
  if (!settings) return null

  const unit = unitLabel(settings.units)

  return (
    <div className="flex-1 p-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Log a Shot</h1>
        <p className="text-golf-500 text-sm">Record your distance</p>
      </div>

      {bag.length === 0 ? (
        <div className="text-center py-16 text-golf-600">
          <p className="text-4xl mb-3">🏌️</p>
          <p className="text-golf-400 font-semibold">No clubs in your bag</p>
          <p className="text-sm mt-1">Add clubs first from the Clubs tab</p>
        </div>
      ) : (
        <>
          {/* Club selector */}
          <div className="mb-4">
            <label className="text-golf-400 text-xs font-bold uppercase tracking-wider mb-2 block">Club</label>
            <div className="flex flex-wrap gap-2">
              {bag.map(entry => (
                <button
                  key={entry.club_id}
                  onClick={() => setSelectedClub(entry.club_id)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                    selectedClub === entry.club_id
                      ? 'bg-golf-600 text-white border border-golf-400'
                      : 'bg-golf-900 text-golf-400 border border-golf-700'
                  }`}
                >
                  {entry.club?.name}
                </button>
              ))}
            </div>
          </div>

          {/* Shot type */}
          <div className="mb-4">
            <label className="text-golf-400 text-xs font-bold uppercase tracking-wider mb-2 block">Shot Type</label>
            <div className="grid grid-cols-4 gap-2">
              {SHOT_TYPES.map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedType(st)}
                  className={`rounded-xl py-3 font-bold transition-all ${
                    selectedType === st
                      ? 'bg-golf-600 text-white border border-golf-400'
                      : 'bg-golf-900 text-golf-400 border border-golf-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Distance input */}
          <div className="mb-4">
            <label className="text-golf-400 text-xs font-bold uppercase tracking-wider mb-2 block">Distance ({unit})</label>
            <input
              type="number"
              value={distance}
              onChange={e => setDistance(e.target.value)}
              placeholder={`e.g. 150`}
              className="w-full bg-golf-900 border border-golf-700 rounded-2xl px-4 py-4 text-white text-2xl font-bold placeholder:text-golf-700 outline-none focus:border-golf-400 text-center"
            />
          </div>

          {/* Dispersion */}
          {settings.track_dispersion && (
            <div className="mb-4 bg-golf-900 border border-golf-700 rounded-2xl p-4">
              <label className="text-golf-400 text-xs font-bold uppercase tracking-wider mb-3 block">Dispersion ({unit})</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-golf-500 text-xs mb-1">← Left</p>
                  <input
                    type="number"
                    value={dispLeft}
                    onChange={e => setDispLeft(e.target.value)}
                    placeholder="0"
                    className="w-full bg-golf-800 border border-golf-700 rounded-xl px-3 py-2.5 text-white font-semibold outline-none focus:border-golf-400 text-center"
                  />
                </div>
                <div>
                  <p className="text-golf-500 text-xs mb-1">Right →</p>
                  <input
                    type="number"
                    value={dispRight}
                    onChange={e => setDispRight(e.target.value)}
                    placeholder="0"
                    className="w-full bg-golf-800 border border-golf-700 rounded-xl px-3 py-2.5 text-white font-semibold outline-none focus:border-golf-400 text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={saving || !distance}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all mb-6 ${
              success
                ? 'bg-golf-500 text-white'
                : saving || !distance
                ? 'bg-golf-800 text-golf-600 cursor-not-allowed'
                : 'bg-golf-600 text-white active:scale-95'
            }`}
          >
            {success ? '✓ Shot Added!' : saving ? 'Saving…' : 'Add Shot'}
          </button>

          {/* History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-golf-400 text-xs font-bold uppercase tracking-widest">History</span>
              <div className="flex-1 h-px bg-golf-800" />
            </div>
            {shots.length === 0 ? (
              <p className="text-golf-600 text-sm text-center py-4">No shots logged yet</p>
            ) : (
              <div className="space-y-2">
                {shots.slice(0, 30).map(shot => (
                  <div key={shot.id} className="bg-golf-900 border border-golf-800 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold">{shot.club?.name}</span>
                      <span className="text-golf-500 text-sm ml-2">{shot.shot_type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-golf-300 font-bold">{convertDistance(shot.distance_yards, settings.units)} {unit}</span>
                      <p className="text-golf-600 text-xs">{new Date(shot.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
