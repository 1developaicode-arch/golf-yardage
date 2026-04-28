'use client'
import { useEffect, useState } from 'react'
import { getBag, getSettings, getShots } from '@/lib/db'
import { BagEntry, Settings, Shot, ShotType } from '@/lib/types'
import { calcAverage, convertDistance, SHOT_TYPES, unitLabel } from '@/lib/utils'

const SHOT_LABELS: Record<ShotType, string> = { 'full': 'Full', '3/4': '3/4', '1/2': '1/2', '1/4': '1/4' }

export default function BagView() {
  const [bag, setBag] = useState<BagEntry[]>([])
  const [shots, setShots] = useState<Shot[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [finder, setFinder] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getBag(), getShots(), getSettings()]).then(([b, s, cfg]) => {
      setBag(b)
      setShots(s)
      setSettings(cfg)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex-1 flex items-center justify-center text-golf-400">Loading...</div>
  if (!settings) return null

  const unit = unitLabel(settings.units)
  const finderVal = parseFloat(finder)

  function isMatch(avg: number | null): boolean {
    if (!avg || isNaN(finderVal) || finder === '') return false
    const converted = settings!.units === 'meters' ? avg * 0.9144 : avg
    return Math.abs(converted - finderVal) <= 10
  }

  function getAvg(clubId: string, shotType: ShotType): number | null {
    const avg = calcAverage(shots, clubId, shotType, settings!.averaging_method, settings!.averaging_count)
    if (avg === null) return null
    const count = shots.filter(s => s.club_id === clubId && s.shot_type === shotType).length
    if (count < settings!.min_shots_threshold) return null
    return avg
  }

  const clubs = bag.filter(b => b.club?.type !== 'wedge')
  const wedges = bag.filter(b => b.club?.type === 'wedge')

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-golf-950 z-50 overflow-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">My Bag</h1>
            <p className="text-golf-500 text-sm">{bag.length}/13 clubs</p>
          </div>
          <button onClick={() => setFullscreen(false)} className="text-golf-400 text-sm border border-golf-700 rounded-xl px-4 py-2">
            ✕ Exit Fullscreen
          </button>
        </div>
        <FullscreenTable entries={bag} shots={shots} settings={settings} getAvg={getAvg} isMatch={isMatch} unit={unit} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Bag</h1>
          <p className="text-golf-500 text-sm">{bag.length}/13 clubs</p>
        </div>
        <button onClick={() => setFullscreen(true)} className="bg-golf-800 border border-golf-600 text-golf-300 text-sm rounded-xl px-3 py-2 font-medium hover:bg-golf-700 transition-colors">
          ⛶ Fullscreen
        </button>
      </div>

      {/* Desktop: side-by-side layout */}
      <div className="md:flex md:gap-6">
        {/* Left: Distance Finder */}
        <div className="md:w-72 md:flex-shrink-0">
          <div className="bg-golf-900 border border-golf-700 rounded-2xl p-4 mb-5">
            <label className="text-golf-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Distance Finder</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={finder}
                onChange={e => setFinder(e.target.value)}
                placeholder={`Enter ${unit}…`}
                className="flex-1 bg-golf-800 border border-golf-600 rounded-xl px-4 py-2.5 text-white text-lg font-semibold placeholder:text-golf-600 outline-none focus:border-golf-400"
              />
              {finder && <button onClick={() => setFinder('')} className="text-golf-500 px-2">✕</button>}
            </div>
            {finder && !isNaN(finderVal) && (
              <p className="text-golf-400 text-xs mt-2">Showing matches within ±10 {unit} of {finder}</p>
            )}
          </div>

          {/* Desktop stats summary */}
          <div className="hidden md:block bg-golf-900 border border-golf-700 rounded-2xl p-4">
            <p className="text-golf-400 text-xs font-bold uppercase tracking-wider mb-3">Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-golf-500">Total shots logged</span>
                <span className="text-white font-semibold">{shots.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-golf-500">Clubs in bag</span>
                <span className="text-white font-semibold">{bag.length}/13</span>
              </div>
              <div className="flex justify-between">
                <span className="text-golf-500">Units</span>
                <span className="text-white font-semibold capitalize">{settings.units}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Club cards */}
        <div className="flex-1">
          {bag.length === 0 ? (
            <div className="text-center py-16 text-golf-600">
              <p className="text-4xl mb-3">🏌️</p>
              <p className="font-semibold text-golf-400">No clubs in your bag yet</p>
              <p className="text-sm mt-1">Go to Clubs tab to add clubs</p>
            </div>
          ) : (
            <>
              <ClubGroup label="Clubs" entries={clubs} shots={shots} settings={settings} getAvg={getAvg} isMatch={isMatch} unit={unit} />
              <ClubGroup label="Wedges" entries={wedges} shots={shots} settings={settings} getAvg={getAvg} isMatch={isMatch} unit={unit} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ClubGroup({ label, entries, getAvg, isMatch, unit, settings }: {
  label: string
  entries: BagEntry[]
  shots: Shot[]
  settings: Settings
  getAvg: (id: string, type: ShotType) => number | null
  isMatch: (avg: number | null) => boolean
  unit: string
}) {
  if (entries.length === 0) return null
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-golf-400 text-xs font-bold uppercase tracking-widest">{label}</span>
        <div className="flex-1 h-px bg-golf-800" />
      </div>
      {/* Mobile: stacked cards / Desktop: table-style grid */}
      <div className="hidden md:block">
        <div className="bg-golf-900 border border-golf-700 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-golf-700">
                <th className="text-left px-4 py-3 text-golf-500 text-xs font-bold uppercase tracking-wider">Club</th>
                {SHOT_TYPES.map(st => (
                  <th key={st} className="text-center px-4 py-3 text-golf-500 text-xs font-bold uppercase tracking-wider">{SHOT_LABELS[st]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const club = entry.club!
                const anyMatch = SHOT_TYPES.some(st => isMatch(getAvg(club.id, st)))
                return (
                  <tr key={entry.id} className={`border-b border-golf-800 last:border-0 transition-colors ${anyMatch ? 'bg-gold-400/10' : i % 2 === 0 ? 'bg-transparent' : 'bg-golf-900/50'}`}>
                    <td className={`px-4 py-3.5 font-bold ${anyMatch ? 'text-gold-400' : 'text-white'}`}>{club.name}</td>
                    {SHOT_TYPES.map(st => {
                      const avg = getAvg(club.id, st)
                      const match = isMatch(avg)
                      const display = avg !== null ? convertDistance(avg, settings.units) : null
                      return (
                        <td key={st} className={`px-4 py-3.5 text-center font-semibold text-base ${match ? 'text-gold-400' : display ? 'text-white' : 'text-golf-700'}`}>
                          {display ? `${display} ${unit}` : '–'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {entries.map(entry => (
          <ClubCard key={entry.id} entry={entry} getAvg={getAvg} isMatch={isMatch} unit={unit} settings={settings} />
        ))}
      </div>
    </div>
  )
}

function ClubCard({ entry, getAvg, isMatch, unit, settings }: {
  entry: BagEntry
  getAvg: (id: string, type: ShotType) => number | null
  isMatch: (avg: number | null) => boolean
  unit: string
  settings: Settings
}) {
  const club = entry.club!
  const anyMatch = SHOT_TYPES.some(st => isMatch(getAvg(club.id, st)))
  return (
    <div className={`rounded-2xl border p-3 transition-all ${anyMatch ? 'bg-gold-400/10 border-gold-400' : 'bg-golf-900 border-golf-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-bold text-base ${anyMatch ? 'text-gold-400' : 'text-white'}`}>{club.name}</span>
        <span className="text-golf-600 text-xs capitalize">{club.type}</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {SHOT_TYPES.map(st => {
          const avg = getAvg(club.id, st)
          const match = isMatch(avg)
          const display = avg !== null ? convertDistance(avg, settings.units) : null
          return (
            <div key={st} className={`rounded-xl p-2 text-center ${match ? 'bg-gold-400/20 border border-gold-400' : 'bg-golf-800'}`}>
              <div className="text-golf-500 text-xs mb-1">{SHOT_LABELS[st]}</div>
              <div className={`font-bold text-sm ${match ? 'text-gold-400' : display ? 'text-white' : 'text-golf-700'}`}>{display ?? '–'}</div>
              {display && <div className="text-golf-600 text-xs">{unit}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FullscreenTable({ entries, getAvg, isMatch, unit, settings }: {
  entries: BagEntry[]
  shots: Shot[]
  settings: Settings
  getAvg: (id: string, type: ShotType) => number | null
  isMatch: (avg: number | null) => boolean
  unit: string
}) {
  const clubs = entries.filter(b => b.club?.type !== 'wedge')
  const wedges = entries.filter(b => b.club?.type === 'wedge')

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {[{ label: 'Clubs', list: clubs }, { label: 'Wedges', list: wedges }].map(({ label, list }) =>
        list.length > 0 ? (
          <div key={label}>
            <p className="text-golf-400 text-xs font-bold uppercase tracking-widest mb-3">{label}</p>
            <div className="bg-golf-900 border border-golf-700 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-golf-700">
                    <th className="text-left px-5 py-3 text-golf-500 text-xs font-bold uppercase tracking-wider">Club</th>
                    {SHOT_TYPES.map(st => <th key={st} className="text-center px-5 py-3 text-golf-500 text-xs font-bold uppercase tracking-wider">{SHOT_LABELS[st]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {list.map(entry => {
                    const club = entry.club!
                    const anyMatch = SHOT_TYPES.some(st => isMatch(getAvg(club.id, st)))
                    return (
                      <tr key={entry.id} className={`border-b border-golf-800 last:border-0 ${anyMatch ? 'bg-gold-400/10' : ''}`}>
                        <td className={`px-5 py-4 font-bold text-lg ${anyMatch ? 'text-gold-400' : 'text-white'}`}>{club.name}</td>
                        {SHOT_TYPES.map(st => {
                          const avg = getAvg(club.id, st)
                          const match = isMatch(avg)
                          const display = avg !== null ? convertDistance(avg, settings.units) : null
                          return (
                            <td key={st} className={`px-5 py-4 text-center font-bold text-2xl ${match ? 'text-gold-400' : display ? 'text-white' : 'text-golf-800'}`}>
                              {display ?? '–'}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null
      )}
      <p className="text-golf-600 text-xs text-center">All distances in {unit}</p>
    </div>
  )
}
