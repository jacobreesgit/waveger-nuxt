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
  _searchMatches?: any[]
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

// Schema for raw Billboard API response
export const BillboardResponseSchema = z.object({
  info: z.string(),
  songs: z.array(SongSchema),
  title: z.string(),
  week: z.string()
})

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

