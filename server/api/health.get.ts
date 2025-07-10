import { generateAppleMusicToken } from '~/server/utils/appleMusic'
import { checkDatabaseHealth } from '~/server/database/connection'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const startTime = Date.now()
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: { status: 'unknown', latency: 0, error: null as string | null },
      redis: { status: 'unknown', latency: 0, error: null as string | null },
      billboard: { 
        status: 'unknown', 
        latency: 0, 
        error: null as string | null,
        circuitBreaker: undefined as string | undefined,
        dataQuality: undefined as string | undefined
      },
      appleMusic: { status: 'unknown', latency: 0, error: null as string | null }
    },
    version: '1.0.0',
    responseTime: 0
  }

  // Detailed Database health check
  try {
    const dbHealthResult = await checkDatabaseHealth()
    health.services.database = dbHealthResult
  } catch (error) {
    health.services.database = {
      status: 'unhealthy',
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }

  // Detailed Redis health check
  try {
    const redisStart = Date.now()
    const isHealthy = await checkRedisHealth()
    const redisLatency = Date.now() - redisStart
    
    health.services.redis = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      latency: redisLatency,
      error: isHealthy ? null : 'Redis ping failed'
    }
  } catch (error) {
    health.services.redis = {
      status: 'unhealthy',
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Detailed Billboard API health check with circuit breaker info
  try {
    const billboardStart = Date.now()
    
    if (!config.rapidApiKey) {
      health.services.billboard = {
        status: 'misconfigured',
        latency: 0,
        error: 'RapidAPI key not configured',
        circuitBreaker: undefined,
        dataQuality: undefined
      }
    } else {
      try {
        // Import the Billboard client
        const { getBillboardClient } = await import('~/server/utils/billboardClient')
        const billboardClient = getBillboardClient()
        
        // Get client health info
        const clientHealth = billboardClient.getHealthInfo()
        
        // Test a quick chart fetch to verify connectivity
        const testResult = await billboardClient.fetchChart('hot-100', {
          timeout: 5000,
          skipCache: true
        })
        
        const billboardLatency = Date.now() - billboardStart
        health.services.billboard = {
          status: clientHealth.circuitBreakerState === 'OPEN' ? 'degraded' : 'healthy',
          latency: billboardLatency,
          error: null,
          circuitBreaker: clientHealth.circuitBreakerState,
          dataQuality: testResult.metadata.quality >= 0.8 ? 'high' : 
                       testResult.metadata.quality >= 0.5 ? 'medium' : 'low'
        }
      } catch (apiError: unknown) {
        const billboardLatency = Date.now() - billboardStart
        
        // Determine status based on error type
        let status = 'unhealthy'
        if (apiError instanceof Error) {
          if (apiError.message.includes('Circuit breaker is OPEN')) {
            status = 'degraded'
          } else if (apiError.message.includes('429') || apiError.message.includes('rate limit')) {
            status = 'rate_limited'
          }
        }
        
        health.services.billboard = {
          status,
          latency: billboardLatency,
          error: apiError instanceof Error ? apiError.message : 'Unknown API error',
          circuitBreaker: undefined,
          dataQuality: undefined
        }
      }
    }
  } catch (error) {
    health.services.billboard = {
      status: 'unhealthy',
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      circuitBreaker: undefined,
      dataQuality: undefined
    }
  }

  // Detailed Apple Music health check
  try {
    const appleMusicStart = Date.now()
    
    if (!config.appleMusicKeyId || !config.appleMusicTeamId || !config.appleMusicAuthKey) {
      health.services.appleMusic = {
        status: 'misconfigured',
        latency: 0,
        error: 'Apple Music credentials not configured'
      }
    } else {
      const token = await generateAppleMusicToken()
      const appleMusicLatency = Date.now() - appleMusicStart
      
      if (token) {
        // Test actual Apple Music API call
        try {
          await $fetch('https://api.music.apple.com/v1/catalog/us/search', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            query: {
              term: 'test',
              types: 'songs',
              limit: 1
            },
            timeout: 5000,
            retry: 0
          })
          
          health.services.appleMusic = {
            status: 'healthy',
            latency: appleMusicLatency,
            error: null
          }
        } catch (apiError: unknown) {
          health.services.appleMusic = {
            status: 'unhealthy',
            latency: appleMusicLatency,
            error: `API test failed: ${(apiError && typeof apiError === 'object' && 'status' in apiError) ? (apiError as {status: number}).status : 'Unknown'}`
          }
        }
      } else {
        health.services.appleMusic = {
          status: 'unhealthy',
          latency: appleMusicLatency,
          error: 'Token generation failed'
        }
      }
    }
  } catch (error) {
    health.services.appleMusic = {
      status: 'unhealthy',
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Calculate overall system status
  const _serviceStatuses = Object.values(health.services).map(service => service.status)
  const criticalServices = [health.services.database.status, health.services.redis.status, health.services.billboard.status]
  
  if (criticalServices.every(status => status === 'healthy')) {
    health.status = 'healthy'
  } else if (criticalServices.some(status => status === 'healthy' || status === 'degraded')) {
    health.status = 'degraded'
  } else {
    health.status = 'unhealthy'
  }

  // Add response time
  health.responseTime = Date.now() - startTime

  // Set appropriate HTTP status
  if (health.status === 'unhealthy') {
    setResponseStatus(event, 503)
  } else if (health.status === 'degraded') {
    setResponseStatus(event, 200) // Still operational
  }

  return health
})