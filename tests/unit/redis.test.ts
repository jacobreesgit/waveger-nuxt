import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Redis from 'ioredis'
import { getRedisClient, cacheGet, cacheSet, cacheDelete, checkRedisHealth } from '~/server/utils/redis'

// Mock Redis
vi.mock('ioredis')
vi.mock('#nitro', () => ({
  useRuntimeConfig: () => ({
    redisUrl: 'redis://localhost:6379'
  })
}))

const MockRedis = vi.mocked(Redis)
const mockRedisInstance = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  ping: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn()
}

describe('Redis Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    MockRedis.mockImplementation(() => mockRedisInstance as unknown as Redis)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getRedisClient', () => {
    it('should create Redis client with correct configuration', () => {
      const _client = getRedisClient()
      
      expect(MockRedis).toHaveBeenCalledWith('redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })
    })

    it('should return same instance on subsequent calls', () => {
      const client1 = getRedisClient()
      const client2 = getRedisClient()
      
      expect(MockRedis).toHaveBeenCalledTimes(1)
      expect(client1).toBe(client2)
    })
  })

  describe('cacheGet', () => {
    it('should retrieve and parse cached data', async () => {
      const testData = { message: 'test' }
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(testData))
      
      const result = await cacheGet<typeof testData>('test-key')
      
      expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key')
      expect(result).toEqual(testData)
    })

    it('should return null for non-existent key', async () => {
      mockRedisInstance.get.mockResolvedValue(null)
      
      const result = await cacheGet('non-existent')
      
      expect(result).toBeNull()
    })

    it('should handle Redis connection errors gracefully', async () => {
      mockRedisInstance.get.mockRejectedValue(new Error('Connection failed'))
      
      const result = await cacheGet('test-key')
      
      expect(result).toBeNull()
    })

    it('should handle invalid JSON gracefully', async () => {
      mockRedisInstance.get.mockResolvedValue('invalid-json')
      
      const result = await cacheGet('test-key')
      
      expect(result).toBeNull()
    })
  })

  describe('cacheSet', () => {
    it('should store data with default TTL', async () => {
      const testData = { message: 'test' }
      mockRedisInstance.setex.mockResolvedValue('OK')
      
      await cacheSet('test-key', testData)
      
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify(testData)
      )
    })

    it('should store data with custom TTL', async () => {
      const testData = { message: 'test' }
      mockRedisInstance.setex.mockResolvedValue('OK')
      
      await cacheSet('test-key', testData, 7200)
      
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'test-key',
        7200,
        JSON.stringify(testData)
      )
    })

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.setex.mockRejectedValue(new Error('Storage failed'))
      
      await expect(cacheSet('test-key', { data: 'test' })).resolves.toBeUndefined()
    })

    it('should handle circular JSON structures', async () => {
      const circularObj: Record<string, unknown> = { message: 'test' }
      circularObj.self = circularObj
      
      await expect(cacheSet('test-key', circularObj)).resolves.toBeUndefined()
    })
  })

  describe('cacheDelete', () => {
    it('should delete cache key', async () => {
      mockRedisInstance.del.mockResolvedValue(1)
      
      await cacheDelete('test-key')
      
      expect(mockRedisInstance.del).toHaveBeenCalledWith('test-key')
    })

    it('should handle deletion errors gracefully', async () => {
      mockRedisInstance.del.mockRejectedValue(new Error('Deletion failed'))
      
      await expect(cacheDelete('test-key')).resolves.toBeUndefined()
    })
  })

  describe('checkRedisHealth', () => {
    it('should return true when Redis is healthy', async () => {
      mockRedisInstance.ping.mockResolvedValue('PONG')
      
      const result = await checkRedisHealth()
      
      expect(mockRedisInstance.ping).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false when Redis ping fails', async () => {
      mockRedisInstance.ping.mockRejectedValue(new Error('Connection failed'))
      
      const result = await checkRedisHealth()
      
      expect(result).toBe(false)
    })

    it('should return false when Redis ping times out', async () => {
      mockRedisInstance.ping.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )
      
      const result = await checkRedisHealth()
      
      expect(result).toBe(false)
    })
  })

  describe('Error Recovery', () => {
    it('should handle network interruptions', async () => {
      // Simulate network failure then recovery
      mockRedisInstance.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(JSON.stringify({ recovered: true }))
      
      const result1 = await cacheGet('test-key')
      const result2 = await cacheGet('test-key')
      
      expect(result1).toBeNull()
      expect(result2).toEqual({ recovered: true })
    })

    it('should handle Redis memory pressure', async () => {
      mockRedisInstance.setex.mockRejectedValue(new Error('OOM command not allowed'))
      
      await expect(cacheSet('test-key', { data: 'test' })).resolves.toBeUndefined()
    })
  })
})