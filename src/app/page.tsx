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

  const woods = bag.filter(b => b.club?.type === 'wood' || b.club?.type === 'hybrid' || b.club?.type === 'iron')
  const wedges = bag.filter(b => b.club?.type === 'wedge')

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-golf-950 z-50 overflow-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">My Bag</h1>
          <button onClick={() => setFullscreen(false)} className="text-golf-400 text-sm border border-golf-700 rounded-lg px-3 py-1.5">
            Exit
          </button>
        </div>
        <FullscreenTable entries={bag} shots={shots} settings={settings} getAvg={getAvg} isMatch={isMatch} unit={unit} />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">My Bag</h1>
          <p className="text-golf-500 text-sm">{bag.length}/13 clubs</p>
        </div>
        <button onClick={() => setFullscreen(true)} className="bg-golf-800 border border-golf-600 text-golf-300 text-sm rounded-xl px-3 py-2 font-medium">
          ⛶ Fullscreen
        </button>
      </div>

      {/* Distance Finder */}
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
          {finder && <button onClick={() => setFinder('')} className="text-golf-500 text-sm px-2">✕</button>}
        </div>
        {finder && !isNaN(finderVal) && (
          <p className="text-golf-400 text-xs mt-2">Highlighting clubs within ±10 {unit} of {finder}</p>
        )}
      </div>

      {bag.length === 0 ? (
        <div className="text-center py-16 text-golf-600">
          <p className="text-4xl mb-3">🏌️</p>
          <p className="font-semibold text-golf-400">No clubs in your bag yet</p>
          <p className="text-sm mt-1">Go to Clubs tab to add clubs</p>
        </div>
      ) : (
        <>
          <ClubGroup label="Clubs" entries={woods} shots={shots} settings={settings} getAvg={getAvg} isMatch={isMatch} unit={unit} />
          <ClubGroup label="Wedges" entries={wedges} shots={shots} settings={settings} getAvg={getAvg} isMatch={isMatch} unit={unit} />
        </>
      )}
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
      <div className="space-y-2">
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
        <span className="text-golf-600 text-xs">{club.type}</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {SHOT_TYPES.map(st => {
          const avg = getAvg(club.id, st)
          const match = isMatch(avg)
          const display = avg !== null ? convertDistance(avg, settings.units) : null
          return (
            <div key={st} className={`rounded-xl p-2 text-center ${match ? 'bg-gold-400/20 border border-gold-400' : 'bg-golf-800'}`}>
              <div className="text-golf-500 text-xs mb-1">{SHOT_LABELS[st]}</div>
              <div className={`font-bold text-sm ${match ? 'text-gold-400' : display ? 'text-white' : 'text-golf-700'}`}>
                {display ?? '–'}
              </div>
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
  const woods = entries.filter(b => b.club?.type !== 'wedge')
  const wedges = entries.filter(b => b.club?.type === 'wedge')

  return (
    <div className="space-y-6">
      {[{ label: 'Clubs', list: woods }, { label: 'Wedges', list: wedges }].map(({ label, list }) =>
        list.length > 0 ? (
          <div key={label}>
            <p className="text-golf-400 text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-golf-500 text-xs">
                    <th className="text-left py-1 pr-3 font-semibold">Club</th>
                    {SHOT_TYPES.map(st => <th key={st} className="text-center py-1 px-1 font-semibold">{SHOT_LABELS[st]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {list.map(entry => {
                    const club = entry.club!
                    const anyMatch = SHOT_TYPES.some(st => isMatch(getAvg(club.id, st)))
                    return (
                      <tr key={entry.id} className={`border-t border-golf-800 ${anyMatch ? 'bg-gold-400/10' : ''}`}>
                        <td className={`py-2.5 pr-3 font-bold ${anyMatch ? 'text-gold-400' : 'text-white'}`}>{club.name}</td>
                        {SHOT_TYPES.map(st => {
                          const avg = getAvg(club.id, st)
                          const match = isMatch(avg)
                          const display = avg !== null ? convertDistance(avg, settings.units) : null
                          return (
                            <td key={st} className={`text-center py-2.5 px-1 font-semibold text-base ${match ? 'text-gold-400' : display ? 'text-white' : 'text-golf-700'}`}>
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
      <p className="text-golf-600 text-xs text-center pt-2">All distances in {unit}</p>
    </div>
  )
}
