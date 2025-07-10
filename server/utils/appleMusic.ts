import { SignJWT, importPKCS8 } from 'jose'
import type { AppleMusicData } from '~/types'
import { CACHE_KEYS, CACHE_TTL } from '~/utils/constants'

let cachedToken: string | null = null
let tokenExpiry: number = 0

export async function generateAppleMusicToken(): Promise<string | null> {
  const config = useRuntimeConfig()
  
  if (!config.appleMusicKeyId || !config.appleMusicTeamId || !config.appleMusicAuthKey) {
    console.warn('Apple Music credentials not configured')
    return null
  }

  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  try {
    // Modern JWT generation with JOSE
    const privateKey = await importPKCS8(config.appleMusicAuthKey, 'ES256')
    
    const token = await new SignJWT({})
      .setProtectedHeader({
        alg: 'ES256',
        kid: config.appleMusicKeyId
      })
      .setIssuer(config.appleMusicTeamId)
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(privateKey)

    cachedToken = token
    tokenExpiry = Date.now() + (11 * 3600 * 1000) // 11 hours
    
    return token
  } catch (error) {
    console.error('Apple Music token generation error:', error)
    return null
  }
}

export async function searchAppleMusic(title: string, artist: string): Promise<AppleMusicData | null> {
  const cacheKey = `${CACHE_KEYS.APPLE_MUSIC}:${title}:${artist}`
  
  // Check cache first
  const cached = await cacheGet<AppleMusicData>(cacheKey)
  if (cached !== null) {
    return cached
  }

  const token = await generateAppleMusicToken()
  if (!token) {
    await cacheSet(cacheKey, null, 300) // Cache failure briefly
    return null
  }

  try {
    const searchTerm = encodeURIComponent(`${title} ${artist}`)
    const response = await fetch(
      `https://api.music.apple.com/v1/catalog/us/search?term=${searchTerm}&types=songs&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Apple Music API error: ${response.status}`)
    }

    const data = await response.json()
    const song = data.results?.songs?.data?.[0]
    
    let result: AppleMusicData | null = null

    if (song) {
      result = {
        id: song.id,
        url: song.attributes.url,
        preview_url: song.attributes.previews?.[0]?.url || null,
        artwork_url: song.attributes.artwork?.url?.replace('{w}x{h}', '1000x1000') || ''
      }
    }

    // Cache result
    await cacheSet(cacheKey, result, CACHE_TTL.APPLE_MUSIC)
    return result

  } catch (error) {
    console.error('Apple Music search error:', error)
    await cacheSet(cacheKey, null, 300) // Cache failure briefly
    return null
  }
}

// Modern parallel enrichment
export async function enrichWithAppleMusic(chartData: any): Promise<any> {
  if (!chartData.songs || !Array.isArray(chartData.songs)) {
    return chartData
  }

  try {
    // Process in batches to avoid overwhelming the API
    const batchSize = 5
    const batches = []
    
    for (let i = 0; i < chartData.songs.length; i += batchSize) {
      batches.push(chartData.songs.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const enrichPromises = batch.map(async (song: Record<string, unknown>) => {
        const appleMusicData = await searchAppleMusic((song.name as string) || (song.title as string), song.artist as string)
        return { ...song, apple_music: appleMusicData }
      })

      const enrichedBatch = await Promise.allSettled(enrichPromises)
      
      // Update original songs array
      enrichedBatch.forEach((result, index) => {
        const songs = chartData.songs as Record<string, unknown>[]
        const originalIndex = songs.indexOf(batch[index])
        if (result.status === 'fulfilled') {
          songs[originalIndex] = result.value
        } else {
          console.error(`Failed to enrich song ${originalIndex}:`, result.reason)
          songs[originalIndex] = { ...batch[index], apple_music: null }
        }
      })

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return chartData
  } catch (error) {
    console.error('Batch Apple Music enrichment error:', error)
    return chartData
  }
}