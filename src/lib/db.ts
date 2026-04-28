import { supabase } from './supabase'
import { Settings } from './types'

export async function getClubs() {
  const { data } = await supabase.from('clubs').select('*').order('sort_order')
  return data ?? []
}

export async function getBag() {
  const { data } = await supabase
    .from('bag')
    .select('*, club:clubs(*)')
    .eq('is_active', true)
  const sorted = (data ?? []).sort((a, b) => (a.club?.sort_order ?? 0) - (b.club?.sort_order ?? 0))
  return sorted
}

export async function getShots() {
  const { data } = await supabase
    .from('shots')
    .select('*, club:clubs(*)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getSettings(): Promise<Settings> {
  const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle()
  if (data) return data
  // Create default settings row if none exists
  const { data: created } = await supabase
    .from('settings')
    .insert({ user_id: null })
    .select()
    .single()
  return created
}

export async function saveSettings(settings: Partial<Settings>) {
  const existing = await getSettings()
  await supabase.from('settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', existing.id)
}

export async function addClubToBag(clubId: string) {
  await supabase.from('bag').upsert({ club_id: clubId, is_active: true }, { onConflict: 'club_id' })
}

export async function removeClubFromBag(clubId: string) {
  await supabase.from('bag').update({ is_active: false }).eq('club_id', clubId)
}

export async function getCustomClubs() {
  const { data } = await supabase.from('custom_clubs').select('*').order('created_at')
  return data ?? []
}

export async function addCustomClub(name: string, type: string) {
  const { data } = await supabase.from('custom_clubs').insert({ name: name.trim(), type }).select().single()
  return data
}

export async function deleteCustomClub(id: string) {
  await supabase.from('custom_clubs').delete().eq('id', id)
}

export async function deleteShot(id: string) {
  await supabase.from('shots').delete().eq('id', id)
}

export async function logShot(shot: {
  club_id: string
  shot_type: string
  distance_yards: number
  dispersion_left?: number | null
  dispersion_right?: number | null
}) {
  await supabase.from('shots').insert(shot)
}
