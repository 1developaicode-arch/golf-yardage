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
      setBag(b); setSettings(s); setShots(sh)
      if (b.length > 0) setSelectedClub(b[0].club_id)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading...</div>
  if (!settings) return null

  if (!settings.track_dispersion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-5xl mb-4">🎯</p>
        <h2 className="text-xl font-bold text-text-primary mb-2">Dispersion Tracking Off</h2>
        <p className="text-text-muted text-sm">Enable dispersion tracking in Settings to use this feature.</p>
      </div>
    )
  }

  const unit = settings.units === 'meters' ? 'm' : 'yds'
  const clubShots = shots.filter(s => s.club_id === selectedClub && s.dispersion_left !== null && s.dispersion_right !== null)
  const chartData = clubShots.map(s => ({
    x: (s.dispersion_right ?? 0) - (s.dispersion_left ?? 0),
    y: settings.units === 'meters' ? Math.round(s.distance_yards * 0.9144) : Math.round(s.distance_yards),
  }))
  const avgLeft = clubShots.length > 0 ? (clubShots.reduce((a, s) => a + (s.dispersion_left ?? 0), 0) / clubShots.length).toFixed(1) : '–'
  const avgRight = clubShots.length > 0 ? (clubShots.reduce((a, s) => a + (s.dispersion_right ?? 0), 0) / clubShots.length).toFixed(1) : '–'

  return (
    <div className="p-4 md:p-0">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Dispersion</h1>
        <p className="text-text-muted text-sm">Shot spread by club</p>
      </div>

      <div className="mb-5">
        <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 block">Club</label>
        <div className="flex flex-wrap gap-2">
          {bag.map(entry => (
            <button key={entry.club_id} onClick={() => setSelectedClub(entry.club_id)}
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

      {clubShots.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Avg Left', value: `${avgLeft} ${unit}` },
            { label: 'Shots', value: clubShots.length },
            { label: 'Avg Right', value: `${avgRight} ${unit}` },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-border rounded-2xl p-3 text-center shadow-sm">
              <p className="text-text-muted text-xs mb-1">{stat.label}</p>
              <p className="text-text-primary font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {clubShots.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold text-text-primary">No dispersion data yet</p>
          <p className="text-sm mt-1 text-text-muted">Log shots with left/right values to see your pattern</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-4 text-center">
            Lateral Spread (← Left / Right →)
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#c8deca" />
              <XAxis type="number" dataKey="x" name="Lateral" unit={unit}
                tick={{ fill: '#3a6b42', fontSize: 11 }}
                label={{ value: `← Left / Right → (${unit})`, position: 'insideBottom', offset: -10, fill: '#3a6b42', fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Distance" unit={unit} tick={{ fill: '#3a6b42', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #c8deca', borderRadius: 8, color: '#0a1f0d' }}
                formatter={(val, name) => [`${val} ${unit}`, name === 'x' ? 'Lateral' : 'Distance']}
              />
              <ReferenceLine x={0} stroke="#019428" strokeDasharray="4 4" />
              <Scatter data={chartData} fill="#d4900a" opacity={0.85} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
