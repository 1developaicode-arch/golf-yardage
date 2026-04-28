'use client'
import { useEffect, useState } from 'react'
import { getSettings, saveSettings } from '@/lib/db'
import { Settings } from '@/lib/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings().then(s => { setSettings(s); setLoading(false) })
  }, [])

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    await saveSettings(settings)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function update(patch: Partial<Settings>) {
    setSettings(prev => prev ? { ...prev, ...patch } : prev)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">Loading...</div>
  if (!settings) return null

  return (
    <div className="p-4 md:p-0 md:max-w-2xl">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted text-sm">Configure your preferences</p>
      </div>

      <div className="space-y-4">
        <Section label="Units">
          <div className="grid grid-cols-2 gap-2">
            {(['yards', 'meters'] as const).map(u => (
              <button key={u} onClick={() => update({ units: u })}
                className={`py-3 rounded-xl font-semibold capitalize border-2 transition-all ${
                  settings.units === u
                    ? 'bg-golf-600 border-golf-600 text-white'
                    : 'bg-white border-border text-text-primary hover:border-golf-400'
                }`}>
                {u}
              </button>
            ))}
          </div>
        </Section>

        <Section label="Dispersion Tracking">
          <div className="flex items-center justify-between">
            <span className="text-text-primary font-medium">Track left/right dispersion</span>
            <button onClick={() => update({ track_dispersion: !settings.track_dispersion })}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.track_dispersion ? 'bg-golf-500' : 'bg-border'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.track_dispersion ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </Section>

        <Section label="Averaging Method">
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All shots ever' },
              { value: 'last_n', label: 'Last N shots' },
              { value: 'longest_n', label: 'Longest N shots' },
            ].map(opt => (
              <button key={opt.value} onClick={() => update({ averaging_method: opt.value as Settings['averaging_method'] })}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium border-2 transition-all ${
                  settings.averaging_method === opt.value
                    ? 'bg-golf-600 border-golf-600 text-white'
                    : 'bg-white border-border text-text-primary hover:border-golf-400'
                }`}>
                {opt.label}
                {settings.averaging_method === opt.value && <span className="float-right">✓</span>}
              </button>
            ))}
          </div>

          {settings.averaging_method !== 'all' && (
            <div className="mt-4">
              <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 block">N = {settings.averaging_count} shots</label>
              <input type="range" min={3} max={50} value={settings.averaging_count}
                onChange={e => update({ averaging_count: parseInt(e.target.value) })}
                className="w-full accent-golf-600" />
              <div className="flex justify-between text-text-muted text-xs mt-1"><span>3</span><span>50</span></div>
            </div>
          )}
        </Section>

        <Section label="Minimum Shots to Show Yardage">
          <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 block">
            {settings.min_shots_threshold} shot{settings.min_shots_threshold !== 1 ? 's' : ''} required before yardage shows
          </label>
          <input type="range" min={1} max={20} value={settings.min_shots_threshold}
            onChange={e => update({ min_shots_threshold: parseInt(e.target.value) })}
            className="w-full accent-golf-600" />
          <div className="flex justify-between text-text-muted text-xs mt-1"><span>1</span><span>20</span></div>
        </Section>
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-sm ${
          saved ? 'bg-golf-500 text-white' : 'bg-golf-600 text-white hover:bg-golf-700 active:scale-95'
        }`}>
        {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
      <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-3">{label}</p>
      {children}
    </div>
  )
}
