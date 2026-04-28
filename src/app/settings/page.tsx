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
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function update(patch: Partial<Settings>) {
    setSettings(prev => prev ? { ...prev, ...patch } : prev)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-golf-400">Loading...</div>
  if (!settings) return null

  return (
    <div className="flex-1 p-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-golf-500 text-sm">Configure your preferences</p>
      </div>

      <div className="space-y-4">
        {/* Units */}
        <Section label="Units">
          <div className="grid grid-cols-2 gap-2">
            {(['yards', 'meters'] as const).map(u => (
              <button
                key={u}
                onClick={() => update({ units: u })}
                className={`py-3 rounded-xl font-semibold capitalize transition-all ${
                  settings.units === u
                    ? 'bg-golf-600 text-white border border-golf-400'
                    : 'bg-golf-800 text-golf-400 border border-golf-700'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Section>

        {/* Dispersion */}
        <Section label="Dispersion Tracking">
          <div className="flex items-center justify-between">
            <span className="text-golf-300 text-sm">Track left/right dispersion</span>
            <button
              onClick={() => update({ track_dispersion: !settings.track_dispersion })}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.track_dispersion ? 'bg-golf-500' : 'bg-golf-800'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.track_dispersion ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </Section>

        {/* Averaging method */}
        <Section label="Averaging Method">
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All shots' },
              { value: 'last_n', label: `Last N shots` },
              { value: 'longest_n', label: `Longest N shots` },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => update({ averaging_method: opt.value as Settings['averaging_method'] })}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                  settings.averaging_method === opt.value
                    ? 'bg-golf-700 text-white border border-golf-400'
                    : 'bg-golf-800 text-golf-400 border border-golf-700'
                }`}
              >
                <span>{opt.label}</span>
                {settings.averaging_method === opt.value && <span className="float-right text-golf-300">✓</span>}
              </button>
            ))}
          </div>

          {settings.averaging_method !== 'all' && (
            <div className="mt-3">
              <label className="text-golf-400 text-xs font-semibold uppercase tracking-wider mb-2 block">N = {settings.averaging_count}</label>
              <input
                type="range"
                min={3}
                max={50}
                value={settings.averaging_count}
                onChange={e => update({ averaging_count: parseInt(e.target.value) })}
                className="w-full accent-golf-500"
              />
              <div className="flex justify-between text-golf-600 text-xs mt-1">
                <span>3</span><span>50</span>
              </div>
            </div>
          )}
        </Section>

        {/* Min shots threshold */}
        <Section label="Minimum Shots to Show Yardage">
          <label className="text-golf-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
            {settings.min_shots_threshold} shots required
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={settings.min_shots_threshold}
            onChange={e => update({ min_shots_threshold: parseInt(e.target.value) })}
            className="w-full accent-golf-500"
          />
          <div className="flex justify-between text-golf-600 text-xs mt-1">
            <span>1</span><span>20</span>
          </div>
        </Section>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all ${
          saved
            ? 'bg-golf-500 text-white'
            : 'bg-golf-600 text-white active:scale-95'
        }`}
      >
        {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-golf-900 border border-golf-700 rounded-2xl p-4">
      <p className="text-golf-400 text-xs font-bold uppercase tracking-widest mb-3">{label}</p>
      {children}
    </div>
  )
}
