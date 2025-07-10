import { z } from 'zod'

// Core data types
export interface Song {
  position: number
  name: string
  artist: string
  image: string
  last_week_position: number
  peak_position: number
  weeks_on_chart: number
  apple_music?: AppleMusicData | null
  url: string
  // Search-specific properties (added by Fuse.js)
  _searchScore?: number
  _searchMatches?: unknown[]
}

export interface AppleMusicData {
  id: string
  url: string
  preview_url: string | null
  artwork_url: string
}

export interface ChartData {
  cached: boolean
  info: string
  note?: string
  songs: Song[]
  title: string
  week: string
}

export interface ChartOption {
  id: string
  title: string
  description?: string
}

// Runtime validation schemas (modern practice)
export const AppleMusicSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  preview_url: z.string().url().nullable(),
  artwork_url: z.string().url()
})

// Lenient base schema for all chart entries - handles malformed Billboard API data
const BaseChartEntrySchema = z.object({
  position: z.number().positive(),
  name: z.string().min(1),
  image: z.string().url(),
  last_week_position: z.number().nonnegative(),
  peak_position: z.number().positive(),
  weeks_on_chart: z.number().positive(),
  url: z.string().url()
})

// Strict validation schema for transformed/cleaned data
export const ValidatedChartEntrySchema = BaseChartEntrySchema.extend({
  artist: z.string().min(1)
})

// Raw schemas for Billboard API - more lenient to handle malformed data
export const RawSongSchema = z.object({
  position: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 1 : Math.max(1, num)
  }),
  name: z.string().transform(val => val.trim() || 'Unknown Song'),
  artist: z.string().nullish().transform(val => val?.trim() || 'Unknown Artist'),
  image: z.string().nullish().transform(val => val || 'https://via.placeholder.com/300x300'),
  last_week_position: z.union([z.number(), z.string(), z.null()]).transform(val => {
    if (val === null || val === undefined) return 0
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 0 : Math.max(0, num)
  }),
  peak_position: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 1 : Math.max(1, num)
  }),
  weeks_on_chart: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 1 : Math.max(1, num)
  }),
  url: z.string().nullish().transform(val => val || 'https://www.billboard.com')
})

// Artist-based chart schema (Artist 100, etc.)
export const RawArtistSchema = z.object({
  position: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 1 : Math.max(1, num)
  }),
  name: z.string().transform(val => val.trim() || 'Unknown Artist'),
  artist: z.string().nullish().default('Unknown Artist').transform(val => val?.trim() || 'Unknown Artist'),
  image: z.string().nullish().transform(val => val || 'https://via.placeholder.com/300x300'),
  last_week_position: z.union([z.number(), z.string(), z.null()]).transform(val => {
    if (val === null || val === undefined) return 0
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 0 : Math.max(0, num)
  }),
  peak_position: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 1 : Math.max(1, num)
  }),
  weeks_on_chart: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 1 : Math.max(1, num)
  }),
  url: z.string().nullish().transform(val => val || 'https://www.billboard.com')
})

// Album-based chart schema (Billboard 200, etc.)
export const RawAlbumSchema = z.object({
  position: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 1 : Math.max(1, num)
  }),
  name: z.string().transform(val => val.trim() || 'Unknown Album'),
  artist: z.string().nullish().transform(val => val?.trim() || 'Unknown Artist'),
  image: z.string().nullish().transform(val => val || 'https://via.placeholder.com/300x300'),
  last_week_position: z.union([z.number(), z.string(), z.null()]).transform(val => {
    if (val === null || val === undefined) return 0
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 0 : Math.max(0, num)
  }),
  peak_position: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 1 : Math.max(1, num)
  }),
  weeks_on_chart: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 1 : Math.max(1, num)
  }),
  url: z.string().nullish().transform(val => val || 'https://www.billboard.com')
})

// Enriched song schema (with optional Apple Music data)
export const SongSchema = z.object({
  position: z.number().positive(),
  name: z.string().min(1),
  artist: z.string().min(1),
  image: z.string().url(),
  last_week_position: z.number().nonnegative(),
  peak_position: z.number().positive(),
  weeks_on_chart: z.number().positive(),
  apple_music: AppleMusicSchema.nullable().optional(),
  url: z.string().url()
})

// Chart type mapping
export const CHART_TYPES = {
  SONG: 'song',
  ARTIST: 'artist',
  ALBUM: 'album'
} as const

// Chart configuration
export const CHART_CONFIG = {
  'hot-100': { type: CHART_TYPES.SONG, schema: RawSongSchema },
  'billboard-200': { type: CHART_TYPES.ALBUM, schema: RawAlbumSchema },
  'artist-100': { type: CHART_TYPES.ARTIST, schema: RawArtistSchema },
  'country-songs': { type: CHART_TYPES.SONG, schema: RawSongSchema },
  'r-b-hip-hop-songs': { type: CHART_TYPES.SONG, schema: RawSongSchema },
  'rock-songs': { type: CHART_TYPES.SONG, schema: RawSongSchema },
  'pop-songs': { type: CHART_TYPES.SONG, schema: RawSongSchema },
  'alternative-songs': { type: CHART_TYPES.SONG, schema: RawSongSchema },
  'country-albums': { type: CHART_TYPES.ALBUM, schema: RawAlbumSchema },
  'r-b-hip-hop-albums': { type: CHART_TYPES.ALBUM, schema: RawAlbumSchema },
  'rock-albums': { type: CHART_TYPES.ALBUM, schema: RawAlbumSchema },
  'dance-electronic-songs': { type: CHART_TYPES.SONG, schema: RawSongSchema },
  'latin-songs': { type: CHART_TYPES.SONG, schema: RawSongSchema },
  'christian-songs': { type: CHART_TYPES.SONG, schema: RawSongSchema },
  'gospel-songs': { type: CHART_TYPES.SONG, schema: RawSongSchema }
} as const

// Schema for raw Billboard API response (before Apple Music enrichment)
// More lenient to handle malformed API responses
export const BillboardResponseSchema = z.object({
  info: z.string().nullish().transform(val => val || 'Chart information'),
  songs: z.array(z.unknown()).transform(val => {
    // Filter out null/undefined entries and ensure array format
    return Array.isArray(val) ? val.filter(item => item != null) : []
  }),
  title: z.string().nullish().transform(val => val || 'Billboard Chart'),
  week: z.string().nullish().transform(val => val || new Date().toISOString().split('T')[0])
})

// Chart-specific response schemas with better error handling
export const createBillboardResponseSchema = (chartId: string) => {
  const config = CHART_CONFIG[chartId as keyof typeof CHART_CONFIG]
  
  return z.object({
    info: z.string().nullish().transform(val => val || `Chart information for ${chartId}`),
    songs: z.array(z.unknown()).transform((val, ctx) => {
      if (!Array.isArray(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Songs must be an array'
        })
        return []
      }
      
      const validSongs = []
      for (let i = 0; i < val.length; i++) {
        const song = val[i]
        if (song && typeof song === 'object') {
          try {
            const schema = config?.schema || RawSongSchema
            const result = schema.safeParse(song)
            if (result.success) {
              validSongs.push(result.data)
            } else {
              console.warn(`Invalid song at index ${i} for chart ${chartId}:`, result.error)
            }
          } catch (error) {
            console.warn(`Error parsing song at index ${i} for chart ${chartId}:`, error)
          }
        }
      }
      
      return validSongs
    }),
    title: z.string().nullish().transform(val => val || `Billboard ${chartId.replace('-', ' ')}`),
    week: z.string().nullish().transform(val => val || new Date().toISOString().split('T')[0])
  })
}

// Schema for processed chart data (includes cached field)
export const ChartDataSchema = z.object({
  cached: z.boolean(),
  info: z.string(),
  note: z.string().optional(),
  songs: z.array(SongSchema),
  title: z.string(),
  week: z.string()
})

// API response types
export interface ApiResponse<T> {
  data: T
  cached: boolean
  note?: string
  error?: string
}

