'use client'
import { useEffect, useState } from 'react'
import { getBag, getSettings, getShots } from '@/lib/db'
import { BagEntry, Settings, Shot, ShotType } from '@/lib/types'
import { calcAverage, convertDistance, SHOT_TYPES, unitLabel } from '@/lib/utils'
import { shotLabels } from '@/lib/types'

export default function BagView() {
  const [bag, setBag] = useState<BagEntry[]>([])
  const [shots, setShots] = useState<Shot[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [finder, setFinder] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getBag(), getShots(), getSettings()]).then(([b, s, cfg]) => {
      setBag(b); setShots(s); setSettings(cfg); setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading...</div>
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
  const labels = shotLabels(settings)

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto p-4 md:p-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">My Bag</h1>
            <p className="text-text-muted text-sm">{bag.length}/13 clubs</p>
          </div>
          <button onClick={() => setFullscreen(false)} className="text-text-secondary text-sm border border-border rounded-xl px-4 py-2 hover:bg-surface-2 transition-colors">
            ✕ Exit Fullscreen
          </button>
        </div>
        <FullscreenTable entries={bag} shots={shots} settings={settings} getAvg={getAvg} isMatch={isMatch} unit={unit} labels={labels} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-0">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">My Bag</h1>
          <p className="text-text-muted text-sm">{bag.length}/13 clubs</p>
        </div>
        <button onClick={() => setFullscreen(true)} className="bg-white border border-border text-text-secondary text-sm rounded-xl px-3 py-2 font-medium hover:bg-surface-3 transition-colors shadow-sm">
          ⛶ Fullscreen
        </button>
      </div>

      <div className="md:flex md:gap-6 md:items-start">
        {/* Left panel */}
        <div className="md:w-64 md:flex-shrink-0">
          {/* Distance Finder */}
          <div className="bg-white border border-border rounded-2xl p-4 mb-4 shadow-sm">
            <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 block">Distance Finder</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={finder}
                onChange={e => setFinder(e.target.value)}
                placeholder={`Enter ${unit}…`}
                className="w-full bg-white border-2 border-border rounded-xl px-3 py-2.5 text-text-primary text-lg font-bold placeholder:text-text-muted outline-none focus:border-golf-500"
              />
              {finder && <button onClick={() => setFinder('')} className="text-text-muted px-1 text-lg">✕</button>}
            </div>
            {finder && !isNaN(finderVal) && (
              <p className="text-text-muted text-xs mt-2">Matches within ±10 {unit} of {finder}</p>
            )}
          </div>

          {/* Summary — desktop only */}
          <div className="hidden md:block bg-white border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-3">Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Shots logged</span>
                <span className="text-text-primary font-bold">{shots.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Clubs in bag</span>
                <span className="text-text-primary font-bold">{bag.length}/13</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Units</span>
                <span className="text-text-primary font-bold capitalize">{settings.units}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: clubs */}
        <div className="flex-1 min-w-0 mt-4 md:mt-0">
          {bag.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🏌️</p>
              <p className="font-semibold text-text-primary">No clubs in your bag yet</p>
              <p className="text-sm mt-1 text-text-muted">Go to Clubs tab to add clubs</p>
            </div>
          ) : (
            <>
              <ClubGroup label="Clubs" entries={clubs} shots={shots} settings={settings} getAvg={getAvg} isMatch={isMatch} unit={unit} labels={labels} />
              <ClubGroup label="Wedges" entries={wedges} shots={shots} settings={settings} getAvg={getAvg} isMatch={isMatch} unit={unit} labels={labels} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ClubGroup({ label, entries, getAvg, isMatch, unit, settings, labels }: {
  label: string; entries: BagEntry[]; shots: Shot[]; settings: Settings
  getAvg: (id: string, type: ShotType) => number | null
  isMatch: (avg: number | null) => boolean; unit: string
  labels: Record<ShotType, string>
}) {
  if (entries.length === 0) return null
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">{label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="text-left px-5 py-3 text-text-secondary text-xs font-bold uppercase tracking-wider">Club</th>
              {SHOT_TYPES.map(st => <th key={st} className="text-center px-5 py-3 text-text-secondary text-xs font-bold uppercase tracking-wider">{labels[st]}</th>)}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const club = entry.club!
              const anyMatch = SHOT_TYPES.some(st => isMatch(getAvg(club.id, st)))
              return (
                <tr key={entry.id} className={`border-b border-border last:border-0 ${anyMatch ? 'bg-gold-100' : i % 2 === 0 ? 'bg-white' : 'bg-surface-2'}`}>
                  <td className={`px-5 py-3.5 font-bold ${anyMatch ? 'text-gold-500' : 'text-text-primary'}`}>{club.name}</td>
                  {SHOT_TYPES.map(st => {
                    const avg = getAvg(club.id, st)
                    const match = isMatch(avg)
                    const display = avg !== null ? convertDistance(avg, settings.units) : null
                    return (
                      <td key={st} className={`px-5 py-3.5 text-center font-bold text-base ${match ? 'text-gold-500' : display ? 'text-text-primary' : 'text-border-dark'}`}>
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

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {entries.map(entry => <ClubCard key={entry.id} entry={entry} getAvg={getAvg} isMatch={isMatch} unit={unit} settings={settings} labels={labels} />)}
      </div>
    </div>
  )
}

function ClubCard({ entry, getAvg, isMatch, unit, settings, labels }: {
  entry: BagEntry; getAvg: (id: string, type: ShotType) => number | null
  isMatch: (avg: number | null) => boolean; unit: string; settings: Settings
  labels: Record<ShotType, string>
}) {
  const club = entry.club!
  const anyMatch = SHOT_TYPES.some(st => isMatch(getAvg(club.id, st)))
  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${anyMatch ? 'bg-gold-100 border-gold-400' : 'bg-white border-border'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-bold text-base ${anyMatch ? 'text-gold-500' : 'text-text-primary'}`}>{club.name}</span>
        <span className="text-text-muted text-xs capitalize">{club.type}</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {SHOT_TYPES.map(st => {
          const avg = getAvg(club.id, st)
          const match = isMatch(avg)
          const display = avg !== null ? convertDistance(avg, settings.units) : null
          return (
            <div key={st} className={`rounded-xl p-2 text-center border ${match ? 'bg-gold-100 border-gold-400' : 'bg-surface-2 border-border'}`}>
              <div className="text-text-muted text-xs mb-1">{labels[st]}</div>
              <div className={`font-bold text-sm ${match ? 'text-gold-500' : display ? 'text-text-primary' : 'text-border-dark'}`}>{display ?? '–'}</div>
              {display && <div className="text-text-muted text-xs">{unit}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FullscreenTable({ entries, getAvg, isMatch, unit, settings, labels }: {
  entries: BagEntry[]; shots: Shot[]; settings: Settings
  getAvg: (id: string, type: ShotType) => number | null
  isMatch: (avg: number | null) => boolean; unit: string
  labels: Record<ShotType, string>
}) {
  const clubs = entries.filter(b => b.club?.type !== 'wedge')
  const wedges = entries.filter(b => b.club?.type === 'wedge')
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {[{ label: 'Clubs', list: clubs }, { label: 'Wedges', list: wedges }].map(({ label, list }) =>
        list.length > 0 ? (
          <div key={label}>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-3">{label}</p>
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="text-left px-5 py-3 text-text-secondary text-xs font-bold uppercase tracking-wider">Club</th>
                    {SHOT_TYPES.map(st => <th key={st} className="text-center px-5 py-3 text-text-secondary text-xs font-bold uppercase tracking-wider">{labels[st]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {list.map(entry => {
                    const club = entry.club!
                    const anyMatch = SHOT_TYPES.some(st => isMatch(getAvg(club.id, st)))
                    return (
                      <tr key={entry.id} className={`border-b border-border last:border-0 ${anyMatch ? 'bg-gold-100' : 'bg-white'}`}>
                        <td className={`px-5 py-4 font-bold text-xl ${anyMatch ? 'text-gold-500' : 'text-text-primary'}`}>{club.name}</td>
                        {SHOT_TYPES.map(st => {
                          const avg = getAvg(club.id, st)
                          const match = isMatch(avg)
                          const display = avg !== null ? convertDistance(avg, settings.units) : null
                          return (
                            <td key={st} className={`px-5 py-4 text-center font-bold text-3xl ${match ? 'text-gold-500' : display ? 'text-text-primary' : 'text-border'}`}>
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
      <p className="text-text-muted text-xs text-center">All distances in {unit}</p>
    </div>
  )
}
