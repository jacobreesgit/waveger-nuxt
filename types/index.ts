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

// Base schema for all chart entries
const BaseChartEntrySchema = z.object({
  position: z.number().positive(),
  name: z.string().min(1),
  image: z.string().url(),
  last_week_position: z.number().nonnegative(),
  peak_position: z.number().positive(),
  weeks_on_chart: z.number().positive(),
  url: z.string().url()
})

// Song-based chart schema (Hot 100, Country Songs, etc.)
export const RawSongSchema = BaseChartEntrySchema.extend({
  artist: z.string().min(1)
})

// Artist-based chart schema (Artist 100, etc.)
export const RawArtistSchema = BaseChartEntrySchema.extend({
  artist: z.string().min(1).optional() // Artist field is optional, will be derived from name
})

// Album-based chart schema (Billboard 200, etc.)
export const RawAlbumSchema = BaseChartEntrySchema.extend({
  artist: z.string().min(1)
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
export const BillboardResponseSchema = z.object({
  info: z.string(),
  songs: z.array(z.union([RawSongSchema, RawArtistSchema, RawAlbumSchema])),
  title: z.string(),
  week: z.string()
})

// Chart-specific response schemas
export const createBillboardResponseSchema = (chartId: string) => {
  const config = CHART_CONFIG[chartId as keyof typeof CHART_CONFIG]
  if (!config) {
    // Default to song schema for unknown charts
    return z.object({
      info: z.string(),
      songs: z.array(RawSongSchema),
      title: z.string(),
      week: z.string()
    })
  }
  
  return z.object({
    info: z.string(),
    songs: z.array(config.schema),
    title: z.string(),
    week: z.string()
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

