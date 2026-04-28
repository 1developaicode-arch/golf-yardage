export type ClubType = 'wood' | 'hybrid' | 'iron' | 'wedge'
export type ShotType = 'full' | '3/4' | '1/2' | '1/4'
export type Units = 'yards' | 'meters'
export type AveragingMethod = 'all' | 'last_n' | 'longest_n'

export interface Club {
  id: string
  name: string
  type: ClubType
  sort_order: number
}

export interface BagEntry {
  id: string
  user_id: string | null
  club_id: string
  is_active: boolean
  created_at: string
  club?: Club
}

export interface Shot {
  id: string
  user_id: string | null
  club_id: string
  shot_type: ShotType
  distance_yards: number
  dispersion_left: number | null
  dispersion_right: number | null
  created_at: string
  club?: Club
}

export interface Settings {
  id: string
  user_id: string | null
  units: Units
  track_dispersion: boolean
  averaging_method: AveragingMethod
  averaging_count: number
  min_shots_threshold: number
}

export interface YardageSummary {
  club: Club
  averages: Partial<Record<ShotType, number>>
}
