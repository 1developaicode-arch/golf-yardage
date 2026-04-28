'use client'
import { useEffect, useState } from 'react'
import { getSettings, saveSettings, getCustomClubs, addCustomClub, deleteCustomClub } from '@/lib/db'
import { Settings } from '@/lib/types'

interface CustomClub { id: string; name: string; type: string }

const CLUB_TYPES = [
  { value: 'wood',   label: 'Wood' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'iron',   label: 'Iron' },
  { value: 'wedge',  label: 'Wedge' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [customClubs, setCustomClubs] = useState<CustomClub[]>([])
  const [newClubName, setNewClubName] = useState('')
  const [newClubType, setNewClubType] = useState('iron')
  const [addingClub, setAddingClub] = useState(false)

  useEffect(() => {
    Promise.all([getSettings(), getCustomClubs()]).then(([s, cc]) => {
      setSettings(s)
      setCustomClubs(cc)
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    await saveSettings(settings)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAddClub() {
    if (!newClubName.trim()) return
    setAddingClub(true)
    const club = await addCustomClub(newClubName, newClubType)
    if (club) setCustomClubs(prev => [...prev, club])
    setNewClubName('')
    setAddingClub(false)
  }

  async function handleDeleteClub(id: string) {
    await deleteCustomClub(id)
    setCustomClubs(prev => prev.filter(c => c.id !== id))
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
              { value: 'all',       label: 'All shots ever' },
              { value: 'last_n',    label: 'Last N shots' },
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

        {/* Shot Type Labels */}
        <Section label="Shot Type Labels">
          <p className="text-text-muted text-xs mb-3">
            Rename the 4 shot types to match your system — clock, percentage, or any text you prefer.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'shot_label_full', placeholder: 'e.g. Full, 12 o\'clock, 100%' },
              { key: 'shot_label_3q',   placeholder: 'e.g. 3/4, 9 o\'clock, 75%' },
              { key: 'shot_label_half', placeholder: 'e.g. 1/2, 7:30, 50%' },
              { key: 'shot_label_1q',   placeholder: 'e.g. 1/4, 6 o\'clock, 25%' },
            ] as { key: keyof Settings; placeholder: string }[]).map(({ key, placeholder }) => (
              <div key={key}>
                <p className="text-text-muted text-xs mb-1">Shot {['1','2','3','4'][(['shot_label_full','shot_label_3q','shot_label_half','shot_label_1q'] as const).indexOf(key as never)]}</p>
                <input
                  type="text"
                  value={settings[key] as string}
                  onChange={e => update({ [key]: e.target.value })}
                  placeholder={placeholder}
                  maxLength={20}
                  className="w-full bg-white border-2 border-border rounded-xl px-3 py-2.5 text-text-primary font-semibold outline-none focus:border-golf-500 placeholder:text-text-muted text-sm"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => update({ shot_label_full: 'Full', shot_label_3q: '3/4', shot_label_half: '1/2', shot_label_1q: '1/4' })}
            className="mt-3 text-text-muted text-xs underline hover:text-text-secondary transition-colors"
          >
            Reset to defaults
          </button>
        </Section>

        {/* Custom Clubs */}
        <Section label="Custom Clubs">
          <p className="text-text-muted text-xs mb-3">Add clubs not in the standard list — they'll appear in Club Selection.</p>

          {/* Add form */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newClubName}
              onChange={e => setNewClubName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddClub()}
              placeholder="Club name (e.g. 4 Hybrid)"
              className="flex-1 bg-white border-2 border-border rounded-xl px-3 py-2.5 text-text-primary font-medium outline-none focus:border-golf-500 placeholder:text-text-muted text-sm"
            />
            <select
              value={newClubType}
              onChange={e => setNewClubType(e.target.value)}
              className="bg-white border-2 border-border rounded-xl px-3 py-2.5 text-text-primary font-medium outline-none focus:border-golf-500 text-sm"
            >
              {CLUB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button
              onClick={handleAddClub}
              disabled={addingClub || !newClubName.trim()}
              className="bg-golf-600 text-white rounded-xl px-4 py-2.5 font-bold text-sm disabled:opacity-40 hover:bg-golf-700 transition-colors whitespace-nowrap"
            >
              {addingClub ? '…' : '+ Add'}
            </button>
          </div>

          {/* List */}
          {customClubs.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-3">No custom clubs added yet</p>
          ) : (
            <div className="space-y-2">
              {customClubs.map(club => (
                <div key={club.id} className="flex items-center justify-between bg-surface-2 border border-border rounded-xl px-4 py-3">
                  <div>
                    <span className="text-text-primary font-semibold">{club.name}</span>
                    <span className="text-text-muted text-xs ml-2 capitalize">{club.type}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteClub(club.id)}
                    className="text-red-400 hover:text-red-600 font-bold text-lg px-1 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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
