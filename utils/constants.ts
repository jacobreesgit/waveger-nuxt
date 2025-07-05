import type { ChartOption } from '~/types'

export const CHART_OPTIONS: ChartOption[] = [
  { 
    id: 'hot-100', 
    title: 'Billboard Hot 100™',
    description: 'The premier weekly music chart'
  },
  { 
    id: 'billboard-200', 
    title: 'Billboard 200™',
    description: 'Top albums and EPs chart'
  },
  { 
    id: 'artist-100', 
    title: 'Artist 100',
    description: 'Most popular artists'
  },
  { 
    id: 'streaming-songs', 
    title: 'Streaming Songs',
    description: 'Most streamed tracks'
  },
  { 
    id: 'radio-songs', 
    title: 'Radio Songs',
    description: 'Most played on radio'
  },
  { 
    id: 'digital-song-sales', 
    title: 'Digital Song Sales',
    description: 'Top digital downloads'
  }
] as const

export const CACHE_KEYS = {
  CHART: 'billboard:chart',
  APPLE_MUSIC: 'apple_music:search',
  HEALTH: 'health:check'
} as const

export const CACHE_TTL = {
  CURRENT_CHART: 3600, // 1 hour
  HISTORICAL_CHART: 604800, // 1 week  
  APPLE_MUSIC: 86400, // 24 hours
  HEALTH: 300 // 5 minutes
} as const

// Modern styling utilities
export const getPositionBadgeClass = (position: number): string => {
  if (position === 1) return 'bg-yellow-500 text-black'
  if (position === 2) return 'bg-gray-300 text-black'  
  if (position === 3) return 'bg-amber-700 text-white'
  if (position <= 10) return 'bg-red-600 text-white'
  if (position <= 20) return 'bg-purple-600 text-white'
  if (position <= 50) return 'bg-blue-600 text-white'
  return 'bg-slate-600 text-white'
}

export const formatPositionChange = (current: number, last: number | undefined): string => {
  if (!last || last === 0) return 'NEW'
  const diff = last - current
  if (diff === 0) return '='
  return diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`
}

export const getPositionChangeClass = (current: number, last: number | undefined): string => {
  if (!last || last === 0) return 'text-blue-600'
  const diff = last - current
  if (diff === 0) return 'text-slate-500'
  return diff > 0 ? 'text-green-600' : 'text-red-600'
}