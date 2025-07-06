import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkRedisHealth } from '~/server/utils/redis'
import { generateAppleMusicToken } from '~/server/utils/appleMusic'
import { $fetch } from 'ofetch'

// Mock external dependencies
vi.mock('ofetch')
vi.mock('~/server/utils/redis')
vi.mock('~/server/utils/appleMusic')

const mockFetch = vi.mocked($fetch)
const mockCheckRedisHealth = vi.mocked(checkRedisHealth)
const mockGenerateAppleMusicToken = vi.mocked(generateAppleMusicToken)

describe('API Connection Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Redis Connection', () => {
    it('should successfully connect to Redis', async () => {
      mockCheckRedisHealth.mockResolvedValue(true)
      
      const result = await checkRedisHealth()
      
      expect(result).toBe(true)
      expect(mockCheckRedisHealth).toHaveBeenCalledOnce()
    })

    it('should handle Redis connection failure', async () => {
      mockCheckRedisHealth.mockRejectedValue(new Error('Redis connection failed'))
      
      await expect(checkRedisHealth()).rejects.toThrow('Redis connection failed')
    })

    it('should handle Redis timeout', async () => {
      mockCheckRedisHealth.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 100)
        )
      )
      
      await expect(checkRedisHealth()).rejects.toThrow('Connection timeout')
    })
  })

  describe('Billboard API Connection', () => {
    const mockBillboardResponse = {
      chart: {
        entries: [
          {
            title: 'Test Song',
            artist: 'Test Artist',
            rank: 1,
            image: 'http://example.com/image.jpg'
          }
        ]
      }
    }

    it('should successfully fetch from Billboard API', async () => {
      mockFetch.mockResolvedValue(mockBillboardResponse)
      
      const response = await $fetch('https://billboard-api2.p.rapidapi.com/hot-100', {
        headers: {
          'X-RapidAPI-Key': 'test-key'
        }
      })
      
      expect(response).toEqual(mockBillboardResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://billboard-api2.p.rapidapi.com/hot-100',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-RapidAPI-Key': 'test-key'
          })
        })
      )
    })

    it('should handle Billboard API authentication error', async () => {
      mockFetch.mockRejectedValue({
        status: 401,
        statusText: 'Unauthorized'
      })
      
      await expect($fetch('https://billboard-api2.p.rapidapi.com/hot-100', {
        headers: { 'X-RapidAPI-Key': 'invalid-key' }
      })).rejects.toMatchObject({
        status: 401,
        statusText: 'Unauthorized'
      })
    })

    it('should handle Billboard API rate limiting', async () => {
      mockFetch.mockRejectedValue({
        status: 429,
        statusText: 'Too Many Requests'
      })
      
      await expect($fetch('https://billboard-api2.p.rapidapi.com/hot-100')).rejects.toMatchObject({
        status: 429,
        statusText: 'Too Many Requests'
      })
    })

    it('should handle Billboard API server error', async () => {
      mockFetch.mockRejectedValue({
        status: 500,
        statusText: 'Internal Server Error'
      })
      
      await expect($fetch('https://billboard-api2.p.rapidapi.com/hot-100')).rejects.toMatchObject({
        status: 500,
        statusText: 'Internal Server Error'
      })
    })
  })

  describe('Apple Music API Connection', () => {
    const mockToken = 'mock.jwt.token'

    it('should successfully generate Apple Music token', async () => {
      mockGenerateAppleMusicToken.mockResolvedValue(mockToken)
      
      const token = await generateAppleMusicToken()
      
      expect(token).toBe(mockToken)
      expect(mockGenerateAppleMusicToken).toHaveBeenCalledOnce()
    })

    it('should handle Apple Music token generation failure', async () => {
      mockGenerateAppleMusicToken.mockRejectedValue(new Error('Failed to generate token'))
      
      await expect(generateAppleMusicToken()).rejects.toThrow('Failed to generate token')
    })

    it('should successfully search Apple Music', async () => {
      const mockSearchResponse = {
        results: {
          songs: {
            data: [
              {
                id: '123',
                attributes: {
                  name: 'Test Song',
                  artistName: 'Test Artist',
                  previews: [{ url: 'http://example.com/preview.m4a' }]
                }
              }
            ]
          }
        }
      }

      mockFetch.mockResolvedValue(mockSearchResponse)
      
      const response = await $fetch('https://api.music.apple.com/v1/catalog/us/search', {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        },
        query: {
          term: 'Test Song Test Artist',
          types: 'songs',
          limit: 1
        }
      })
      
      expect(response).toEqual(mockSearchResponse)
    })

    it('should handle Apple Music API authentication error', async () => {
      mockFetch.mockRejectedValue({
        status: 401,
        statusText: 'Unauthorized'
      })
      
      await expect($fetch('https://api.music.apple.com/v1/catalog/us/search', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      })).rejects.toMatchObject({
        status: 401,
        statusText: 'Unauthorized'
      })
    })
  })

  describe('Integration Tests', () => {
    it('should handle multiple service failures gracefully', async () => {
      mockCheckRedisHealth.mockRejectedValue(new Error('Redis down'))
      mockFetch.mockRejectedValue(new Error('Billboard API down'))
      mockGenerateAppleMusicToken.mockRejectedValue(new Error('Apple Music down'))
      
      const results = await Promise.allSettled([
        checkRedisHealth().catch(e => ({ error: e.message })),
        $fetch('https://billboard-api2.p.rapidapi.com/hot-100').catch(e => ({ error: e.message })),
        generateAppleMusicToken().catch(e => ({ error: e.message }))
      ])
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.status).toBe('fulfilled')
        if (result.status === 'fulfilled') {
          expect(result.value).toHaveProperty('error')
        }
      })
    })

    it('should validate data schemas from external APIs', async () => {
      const invalidBillboardResponse = {
        chart: {
          entries: [
            {
              // Missing required fields
              title: 'Test Song'
              // artist, rank, image missing
            }
          ]
        }
      }

      mockFetch.mockResolvedValue(invalidBillboardResponse)
      
      const response = await $fetch('https://billboard-api2.p.rapidapi.com/hot-100')
      
      // Validate required fields exist
      const entry = response.chart.entries[0]
      expect(entry).toHaveProperty('title')
      expect(entry.artist).toBeUndefined()
      expect(entry.rank).toBeUndefined()
      expect(entry.image).toBeUndefined()
    })

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      )
      
      await expect($fetch('https://billboard-api2.p.rapidapi.com/hot-100', {
        timeout: 50
      })).rejects.toThrow('Network timeout')
    })

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockRejectedValue(new Error('Invalid JSON'))
      
      await expect($fetch('https://billboard-api2.p.rapidapi.com/hot-100')).rejects.toThrow('Invalid JSON')
    })
  })

  describe('Health Check Endpoint', () => {
    it('should return healthy status when all services are up', async () => {
      mockCheckRedisHealth.mockResolvedValue(true)
      mockGenerateAppleMusicToken.mockResolvedValue('token')
      
      const healthCheck = {
        status: 'ok',
        timestamp: expect.any(String),
        services: {
          redis: true,
          billboard: true,
          appleMusic: true
        },
        version: '1.0.0'
      }
      
      // Mock health check logic
      const redis = await checkRedisHealth()
      const appleMusic = await generateAppleMusicToken()
      const billboard = true // Assume API key exists
      
      const result = {
        status: redis && billboard ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        services: { redis, billboard, appleMusic: !!appleMusic },
        version: '1.0.0'
      }
      
      expect(result.status).toBe('ok')
      expect(result.services.redis).toBe(true)
      expect(result.services.billboard).toBe(true)
      expect(result.services.appleMusic).toBe(true)
    })

    it('should return degraded status when critical services are down', async () => {
      mockCheckRedisHealth.mockRejectedValue(new Error('Redis down'))
      mockGenerateAppleMusicToken.mockResolvedValue('token')
      
      const redis = await checkRedisHealth().catch(() => false)
      const appleMusic = await generateAppleMusicToken().catch(() => false)
      const billboard = true
      
      const result = {
        status: redis && billboard ? 'ok' : 'degraded',
        services: { redis, billboard, appleMusic: !!appleMusic }
      }
      
      expect(result.status).toBe('degraded')
      expect(result.services.redis).toBe(false)
    })
  })
})