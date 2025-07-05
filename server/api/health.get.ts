export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis: false,
      billboard: false,
      appleMusic: false
    },
    version: '1.0.0'
  }

  // Check Redis
  try {
    health.services.redis = await checkRedisHealth()
  } catch (error) {
    console.error('Redis health check failed:', error)
  }

  // Check Billboard API
  try {
    health.services.billboard = !!config.rapidApiKey
  } catch (error) {
    console.error('Billboard health check failed:', error)
  }

  // Check Apple Music
  try {
    const token = await generateAppleMusicToken()
    health.services.appleMusic = !!token
  } catch (error) {
    console.error('Apple Music health check failed:', error)
  }

  // Set status based on critical services
  const criticalServices = [health.services.redis, health.services.billboard]
  health.status = criticalServices.every(Boolean) ? 'ok' : 'degraded'

  return health
})