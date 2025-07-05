import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    const config = useRuntimeConfig()
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    })
  }
  return redis
}

// Modern async cache utilities
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient()
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

export async function cacheSet(key: string, value: any, ttl: number = 3600): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.del(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

// Modern health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const redis = getRedisClient()
    await redis.ping()
    return true
  } catch {
    return false
  }
}