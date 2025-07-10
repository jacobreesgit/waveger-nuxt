import { z } from 'zod'
import { getBillboardClient } from '~/server/utils/billboardClient'
import { enrichWithAppleMusic } from '~/server/utils/appleMusic'

// Input validation schema
const QuerySchema = z.object({
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  refresh: z.string().transform(val => val === 'true').optional(),
  apple_music: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const chartId = getRouterParam(event, 'id') || 'hot-100'
  
  // Modern query validation
  const queryResult = QuerySchema.safeParse(getQuery(event))
  if (!queryResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameters',
      data: queryResult.error.issues
    })
  }
  
  const { week, refresh, apple_music } = queryResult.data
  
  // Enable Apple Music by default, disable only if explicitly set to 'false'
  const includeAppleMusic = apple_music !== 'false'

  try {
    // Get the robust Billboard client
    const billboardClient = getBillboardClient()
    
    // Fetch chart data with comprehensive error handling
    const result = await billboardClient.fetchChartWithFallback(chartId, {
      week,
      refresh,
      timeout: 20000 // 20 second timeout
    })

    let { data } = result

    // Enrich with Apple Music if requested
    if (includeAppleMusic && data.songs.length > 0) {
      try {
        data = await enrichWithAppleMusic(data)
      } catch (appleMusicError) {
        console.warn(`Apple Music enrichment failed for chart ${chartId}:`, appleMusicError)
        // Continue without Apple Music data rather than failing completely
      }
    }

    // Add metadata to response
    const response = {
      ...data,
      cached: result.cached,
      metadata: {
        ...result.metadata,
        chartId,
        includeAppleMusic,
        quality: result.metadata.quality >= 0.8 ? 'high' : 
                 result.metadata.quality >= 0.5 ? 'medium' : 'low'
      }
    }

    // Log successful fetch
    console.log(`📊 Chart ${chartId} (${week || 'current'}) - ` +
      `${result.cached ? 'cached' : 'fresh'} - ` +
      `${data.songs.length} songs - ` +
      `quality: ${response.metadata.quality}`)

    return response

  } catch (error) {
    console.error(`Chart fetch error for ${chartId}:`, error)
    
    // Map different error types to appropriate HTTP status codes
    if (error instanceof Error) {
      if (error.message.includes('API key not configured')) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Billboard API not configured'
        })
      }
      
      if (error.message.includes('timeout')) {
        throw createError({
          statusCode: 504,
          statusMessage: 'Billboard API timeout'
        })
      }
      
      if (error.message.includes('Circuit breaker is OPEN')) {
        throw createError({
          statusCode: 503,
          statusMessage: 'Billboard API temporarily unavailable'
        })
      }
    }

    // Default error response
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to fetch chart data for ${chartId}`
    })
  }
})