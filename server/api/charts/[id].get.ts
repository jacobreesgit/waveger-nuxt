import { z } from 'zod'
import { ChartDataSchema } from '~/types'
import { CACHE_KEYS, CACHE_TTL } from '~/utils/constants'

// Input validation schema
const QuerySchema = z.object({
  week: z.string().optional(),
  refresh: z.string().transform(val => val === 'true').optional(),
  apple_music: z.string().transform(val => val !== 'false').optional()
})

export default defineEventHandler(async (event) => {
  const chartId = getRouterParam(event, 'id') || 'hot-100'
  
  // Modern query validation
  const queryResult = QuerySchema.safeParse(getQuery(event))
  if (!queryResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameters'
    })
  }
  
  const { week, refresh, apple_music: includeAppleMusic } = queryResult.data
  
  // Create cache key
  const cacheKey = `${CACHE_KEYS.CHART}:${chartId}:${week || 'current'}:${includeAppleMusic ? 'enriched' : 'basic'}`

  // Check cache first (unless refresh requested)
  if (!refresh) {
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }
  }

  try {
    // Fetch from Billboard API
    let data = await fetchBillboardChart(chartId, week)

    // Validate response
    const validationResult = ChartDataSchema.safeParse(data)
    if (!validationResult.success) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Invalid data from Billboard API'
      })
    }

    // Enrich with Apple Music if requested
    if (includeAppleMusic) {
      data = await enrichWithAppleMusic(data)
    }

    // Determine cache TTL
    const ttl = week ? CACHE_TTL.HISTORICAL_CHART : CACHE_TTL.CURRENT_CHART
    
    // Cache the result
    await cacheSet(cacheKey, data, ttl)

    return { ...data, cached: false }

  } catch (error) {
    console.error('Chart fetch error:', error)
    
    // Try to serve from cache as fallback
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return {
        ...cached,
        cached: true,
        note: 'API error, serving cached data'
      }
    }

    // If no cache available, throw the error
    throw error
  }
})

// Modern Billboard API utility
async function fetchBillboardChart(chartId: string, week?: string) {
  const config = useRuntimeConfig()
  
  if (!config.rapidApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Billboard API key not configured'
    })
  }

  const params = new URLSearchParams({ id: chartId })
  if (week) params.append('week', week)

  try {
    const response = await fetch(`https://billboard-charts-api.p.rapidapi.com/chart.php?${params}`, {
      headers: {
        'X-RapidAPI-Key': config.rapidApiKey,
        'X-RapidAPI-Host': 'billboard-charts-api.p.rapidapi.com'
      },
      signal: AbortSignal.timeout(10000) // Modern timeout
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Billboard API error: ${response.statusText}`
      })
    }

    return await response.json()
  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      throw createError({
        statusCode: 504,
        statusMessage: 'Billboard API timeout'
      })
    }
    throw error
  }
}