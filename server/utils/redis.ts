import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      url: 'https://premium-humpback-55463.upstash.io',
      token: 'AdinAAIjcDFmYTM3OTM0Y2I1ZmI0NmNkODkyMWM4ODBlYjA2MWQwN3AxMA',
    })
  }
  return redis
}

// Modern async cache utilities
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient()
    const cached = await redis.get(key)
    return cached as T | null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number = 3600): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.set(key, value, { ex: ttl })
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