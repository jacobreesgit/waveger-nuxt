/**
 * Billboard API Data Transformation and Sanitization Layer
 * 
 * This module provides robust data transformation for Billboard API responses,
 * handling malformed data, missing fields, and inconsistent formats.
 */

export interface RawBillboardEntry {
  position?: number | string
  name?: string
  artist?: string | null
  image?: string | null
  last_week_position?: number | string | null
  peak_position?: number | string | null
  weeks_on_chart?: number | string | null
  url?: string | null
  [key: string]: unknown
}

export interface RawBillboardResponse {
  info?: string
  songs?: RawBillboardEntry[]
  title?: string
  week?: string
  [key: string]: unknown
}

export interface TransformedBillboardEntry {
  position: number
  name: string
  artist: string
  image: string
  last_week_position: number
  peak_position: number
  weeks_on_chart: number
  url: string
}

export interface TransformedBillboardResponse {
  info: string
  songs: TransformedBillboardEntry[]
  title: string
  week: string
}

/**
 * Safely converts a value to a positive integer with fallback
 */
function safeNumber(value: unknown, fallback: number = 0, min: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return Math.max(fallback, min)
  }
  
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  
  if (isNaN(num) || !isFinite(num)) {
    return Math.max(fallback, min)
  }
  
  return Math.max(num, min)
}

/**
 * Safely converts a value to a non-empty string with fallback
 */
function safeString(value: unknown, fallback: string = 'Unknown'): string {
  if (value === null || value === undefined) {
    return fallback
  }
  
  const str = String(value).trim()
  return str || fallback
}

/**
 * Validates and normalizes a URL, returns a fallback if invalid
 */
function safeUrl(value: unknown, fallback: string = 'https://placeholder.com/image.jpg'): string {
  const str = safeString(value, fallback)
  
  try {
    // Handle relative URLs by making them absolute
    if (str.startsWith('//')) {
      return `https:${str}`
    }
    if (str.startsWith('/')) {
      return `https://www.billboard.com${str}`
    }
    
    // Validate URL format
    new URL(str)
    return str
  } catch {
    return fallback
  }
}

/**
 * Transforms a raw Billboard entry into a clean, validated format
 */
export function transformBillboardEntry(
  rawEntry: RawBillboardEntry,
  index: number,
  chartType: 'song' | 'artist' | 'album' = 'song'
): TransformedBillboardEntry {
  const position = safeNumber(rawEntry.position, index + 1, 1)
  const name = safeString(rawEntry.name, `Track ${position}`)
  
  // Handle artist field based on chart type and data availability
  let artist: string
  if (chartType === 'artist') {
    // For artist charts, prefer the name field, fallback to artist field
    artist = safeString(rawEntry.name || rawEntry.artist, `Artist ${position}`)
  } else {
    // For song/album charts, prefer artist field, fallback to various strategies
    artist = safeString(
      rawEntry.artist || 
      (typeof rawEntry.name === 'string' && rawEntry.name.includes(' - ') 
        ? rawEntry.name.split(' - ')[1] // Extract artist from "Song - Artist" format
        : undefined),
      `Unknown Artist`
    )
  }
  
  const image = safeUrl(rawEntry.image)
  const url = safeUrl(rawEntry.url, `https://www.billboard.com/charts/`)
  
  // Handle chart position data with smart fallbacks
  const lastWeekPosition = safeNumber(rawEntry.last_week_position, 0, 0)
  const peakPosition = safeNumber(rawEntry.peak_position, position, 1)
  const weeksOnChart = safeNumber(rawEntry.weeks_on_chart, 1, 1)
  
  return {
    position,
    name,
    artist,
    image,
    last_week_position: lastWeekPosition,
    peak_position: peakPosition,
    weeks_on_chart: weeksOnChart,
    url
  }
}

/**
 * Transforms a raw Billboard API response into a clean, validated format
 */
export function transformBillboardResponse(
  rawResponse: RawBillboardResponse,
  chartId: string = 'unknown'
): TransformedBillboardResponse {
  // Determine chart type from chartId
  const chartType = getChartType(chartId)
  
  // Safely extract basic response fields
  const info = safeString(rawResponse.info, `Chart information for ${chartId}`)
  const title = safeString(rawResponse.title, `Billboard ${chartId.replace('-', ' ').toUpperCase()}`)
  const week = safeString(rawResponse.week, new Date().toISOString().split('T')[0])
  
  // Transform songs array with robust error handling
  const songs: TransformedBillboardEntry[] = []
  const rawSongs = Array.isArray(rawResponse.songs) ? rawResponse.songs : []
  
  for (let i = 0; i < rawSongs.length; i++) {
    try {
      const rawEntry = rawSongs[i]
      if (rawEntry && typeof rawEntry === 'object') {
        const transformedEntry = transformBillboardEntry(rawEntry, i, chartType)
        songs.push(transformedEntry)
      }
    } catch (error) {
      console.warn(`Failed to transform entry ${i} for chart ${chartId}:`, error)
      // Continue processing other entries instead of failing completely
    }
  }
  
  // Ensure we have at least some data
  if (songs.length === 0) {
    console.warn(`No valid songs found in Billboard response for chart ${chartId}`)
    // Create a minimal placeholder entry to prevent total failure
    songs.push({
      position: 1,
      name: 'No Data Available',
      artist: 'Billboard',
      image: 'https://placeholder.com/image.jpg',
      last_week_position: 0,
      peak_position: 1,
      weeks_on_chart: 1,
      url: 'https://www.billboard.com'
    })
  }
  
  return {
    info,
    songs,
    title,
    week
  }
}

/**
 * Determines chart type from chart ID
 */
function getChartType(chartId: string): 'song' | 'artist' | 'album' {
  if (chartId.includes('artist')) return 'artist'
  if (chartId.includes('album') || chartId.includes('200')) return 'album'
  return 'song'
}

/**
 * Validates that a transformed response meets minimum quality standards
 */
export function validateTransformedResponse(response: TransformedBillboardResponse): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Check basic structure
  if (!response.title || response.title === 'Unknown') {
    issues.push('Missing or invalid chart title')
  }
  
  if (!response.songs || response.songs.length === 0) {
    issues.push('No songs in response')
  }
  
  // Check song quality
  const validSongs = response.songs.filter(song => 
    song.name !== 'No Data Available' && 
    song.artist !== 'Unknown Artist'
  )
  
  if (validSongs.length < response.songs.length * 0.5) {
    issues.push('More than 50% of songs have placeholder data')
  }
  
  // Check for duplicate positions
  const positions = response.songs.map(s => s.position)
  const uniquePositions = new Set(positions)
  if (positions.length !== uniquePositions.size) {
    issues.push('Duplicate chart positions detected')
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}