import { AveragingMethod, Shot, ShotType, Units } from './types'

export const YARDS_TO_METERS = 0.9144

export function convertDistance(yards: number, units: Units): number {
  if (units === 'meters') return Math.round(yards * YARDS_TO_METERS)
  return Math.round(yards)
}

export function unitLabel(units: Units): string {
  return units === 'meters' ? 'm' : 'yds'
}

export function calcAverage(
  shots: Shot[],
  clubId: string,
  shotType: ShotType,
  method: AveragingMethod,
  count: number
): number | null {
  let filtered = shots.filter(s => s.club_id === clubId && s.shot_type === shotType)
  if (filtered.length === 0) return null

  if (method === 'last_n') {
    filtered = filtered.slice(-count)
  } else if (method === 'longest_n') {
    filtered = [...filtered].sort((a, b) => b.distance_yards - a.distance_yards).slice(0, count)
  }

  const sum = filtered.reduce((acc, s) => acc + s.distance_yards, 0)
  return sum / filtered.length
}

export const SHOT_TYPES: ShotType[] = ['full', '3/4', '1/2', '1/4']

export const SHOT_LABELS: Record<ShotType, string> = {
  'full': 'Full',
  '3/4': '3/4',
  '1/2': '1/2',
  '1/4': '1/4',
}
