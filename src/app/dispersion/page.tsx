'use client'
import { useEffect, useState } from 'react'
import { getBag, getSettings, getShots } from '@/lib/db'
import { BagEntry, Settings, Shot } from '@/lib/types'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

export default function DispersionPage() {
  const [bag, setBag] = useState<BagEntry[]>([])
  const [shots, setShots] = useState<Shot[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selectedClub, setSelectedClub] = useState<string>('')
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

  if (loading) return <div className="flex-1 flex items-center justify-center text-golf-400">Loading...</div>
  if (!settings) return null

  if (!settings.track_dispersion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-5xl mb-4">🎯</p>
        <h2 className="text-xl font-bold text-white mb-2">Dispersion Tracking Off</h2>
        <p className="text-golf-500 text-sm">Enable dispersion tracking in Settings to use this feature.</p>
      </div>
    )
  }

  const clubShots = shots.filter(s =>
    s.club_id === selectedClub &&
    s.dispersion_left !== null &&
    s.dispersion_right !== null
  )

  const unit = settings.units === 'meters' ? 'm' : 'yds'

  const chartData = clubShots.map(s => ({
    x: (s.dispersion_right ?? 0) - (s.dispersion_left ?? 0),
    y: settings.units === 'meters' ? Math.round(s.distance_yards * 0.9144) : Math.round(s.distance_yards),
    left: s.dispersion_left,
    right: s.dispersion_right,
  }))

  const avgLeft = clubShots.length > 0
    ? (clubShots.reduce((a, s) => a + (s.dispersion_left ?? 0), 0) / clubShots.length).toFixed(1)
    : '–'
  const avgRight = clubShots.length > 0
    ? (clubShots.reduce((a, s) => a + (s.dispersion_right ?? 0), 0) / clubShots.length).toFixed(1)
    : '–'

  return (
    <div className="p-4 md:p-0">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dispersion</h1>
        <p className="text-golf-500 text-sm">Shot spread by club</p>
      </div>

      {/* Club selector */}
      <div className="mb-5">
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

      {/* Stats */}
      {clubShots.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-golf-900 border border-golf-700 rounded-2xl p-3 text-center">
            <p className="text-golf-500 text-xs mb-1">Avg Left</p>
            <p className="text-white font-bold">{avgLeft} {unit}</p>
          </div>
          <div className="bg-golf-900 border border-golf-700 rounded-2xl p-3 text-center">
            <p className="text-golf-500 text-xs mb-1">Shots</p>
            <p className="text-white font-bold">{clubShots.length}</p>
          </div>
          <div className="bg-golf-900 border border-golf-700 rounded-2xl p-3 text-center">
            <p className="text-golf-500 text-xs mb-1">Avg Right</p>
            <p className="text-white font-bold">{avgRight} {unit}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {clubShots.length === 0 ? (
        <div className="text-center py-16 text-golf-600">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-golf-400 font-semibold">No dispersion data yet</p>
          <p className="text-sm mt-1">Log shots with left/right values to see your pattern</p>
        </div>
      ) : (
        <div className="bg-golf-900 border border-golf-700 rounded-2xl p-4">
          <p className="text-golf-400 text-xs font-bold uppercase tracking-wider mb-4 text-center">
            Lateral Spread (← Left / Right →)
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#164a1a" />
              <XAxis
                type="number"
                dataKey="x"
                name="Lateral"
                unit={unit}
                tick={{ fill: '#3da648', fontSize: 11 }}
                label={{ value: `← Left / Right → (${unit})`, position: 'insideBottom', offset: -5, fill: '#3da648', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Distance"
                unit={unit}
                tick={{ fill: '#3da648', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: '#0d2e10', border: '1px solid #267d2e', borderRadius: 8, color: '#fff' }}
                formatter={(val, name) => [`${val} ${unit}`, name === 'x' ? 'Lateral' : 'Distance']}
              />
              <ReferenceLine x={0} stroke="#267d2e" strokeDasharray="4 4" />
              <Scatter data={chartData} fill="#f0c040" opacity={0.85} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
