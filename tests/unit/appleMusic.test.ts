import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateAppleMusicToken, searchAppleMusic, enrichWithAppleMusic } from '~/server/utils/appleMusic'
import { SignJWT, importPKCS8 } from 'jose'

// Mock dependencies
vi.mock('jose')
vi.mock('~/server/utils/redis')
vi.mock('#nitro', () => ({
  useRuntimeConfig: () => ({
    appleMusicKeyId: 'test-key-id',
    appleMusicTeamId: 'test-team-id',
    appleMusicAuthKey: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----'
  })
}))

global.fetch = vi.fn()

const mockSignJWT = vi.mocked(SignJWT)
const mockImportPKCS8 = vi.mocked(importPKCS8)
const mockFetch = vi.mocked(fetch)

describe('Apple Music Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('generateAppleMusicToken', () => {
    const mockPrivateKey = 'mock-private-key'
    const mockToken = 'mock.jwt.token'

    beforeEach(() => {
      mockImportPKCS8.mockResolvedValue(mockPrivateKey as unknown as CryptoKey)
      
      const mockJWT = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setIssuer: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue(mockToken)
      }
      
      mockSignJWT.mockReturnValue(mockJWT as unknown as SignJWT)
    })

    it('should generate valid Apple Music token', async () => {
      const token = await generateAppleMusicToken()
      
      expect(mockImportPKCS8).toHaveBeenCalledWith(
        '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----',
        'ES256'
      )
      expect(token).toBe(mockToken)
    })

    it('should return cached token if still valid', async () => {
      // Generate initial token
      await generateAppleMusicToken()
      
      // Advance time by 1 hour (should still be valid)
      vi.advanceTimersByTime(3600 * 1000)
      
      // Request token again
      const token = await generateAppleMusicToken()
      
      expect(mockSignJWT).toHaveBeenCalledTimes(1)
      expect(token).toBe(mockToken)
    })

    it('should generate new token after expiry', async () => {
      // Generate initial token
      await generateAppleMusicToken()
      
      // Advance time by 12 hours (should expire)
      vi.advanceTimersByTime(12 * 3600 * 1000)
      
      // Request token again
      await generateAppleMusicToken()
      
      expect(mockSignJWT).toHaveBeenCalledTimes(2)
    })

    it('should handle missing credentials', async () => {
      vi.doMock('#nitro', () => ({
        useRuntimeConfig: () => ({
          appleMusicKeyId: null,
          appleMusicTeamId: 'test-team-id',
          appleMusicAuthKey: 'test-key'
        })
      }))
      
      const token = await generateAppleMusicToken()
      
      expect(token).toBeNull()
    })

    it('should handle JWT generation errors', async () => {
      mockImportPKCS8.mockRejectedValue(new Error('Invalid private key'))
      
      const token = await generateAppleMusicToken()
      
      expect(token).toBeNull()
    })
  })

  describe('searchAppleMusic', () => {
    const mockSearchResponse = {
      results: {
        songs: {
          data: [
            {
              id: '123456789',
              attributes: {
                name: 'Test Song',
                artistName: 'Test Artist',
                url: 'https://music.apple.com/song/123456789',
                previews: [{ url: 'https://example.com/preview.m4a' }],
                artwork: { url: 'https://example.com/artwork/{w}x{h}.jpg' }
              }
            }
          ]
        }
      }
    }

    beforeEach(() => {
      // Mock token generation
      mockImportPKCS8.mockResolvedValue('mock-key' as unknown as CryptoKey)
      const mockJWT = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setIssuer: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue('mock.token')
      }
      mockSignJWT.mockReturnValue(mockJWT as unknown as SignJWT)
    })

    it('should successfully search Apple Music', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse)
      } as Response)
      
      const result = await searchAppleMusic('Test Song', 'Test Artist')
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.music.apple.com/v1/catalog/us/search?term=Test%20Song%20Test%20Artist&types=songs&limit=1',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer mock.token',
            'Accept': 'application/json'
          }
        })
      )
      
      expect(result).toEqual({
        id: '123456789',
        url: 'https://music.apple.com/song/123456789',
        preview_url: 'https://example.com/preview.m4a',
        artwork_url: 'https://example.com/artwork/1000x1000.jpg'
      })
    })

    it('should handle no search results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: {} })
      } as Response)
      
      const result = await searchAppleMusic('Unknown Song', 'Unknown Artist')
      
      expect(result).toBeNull()
    })

    it('should handle Apple Music API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as Response)
      
      const result = await searchAppleMusic('Test Song', 'Test Artist')
      
      expect(result).toBeNull()
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const result = await searchAppleMusic('Test Song', 'Test Artist')
      
      expect(result).toBeNull()
    })

    it('should handle malformed responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      } as Response)
      
      const result = await searchAppleMusic('Test Song', 'Test Artist')
      
      expect(result).toBeNull()
    })

    it('should handle special characters in search terms', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse)
      } as Response)
      
      await searchAppleMusic('Song with "quotes" & symbols', 'Artist (feat. Someone)')
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Song%20with%20%22quotes%22%20%26%20symbols%20Artist%20(feat.%20Someone)'),
        expect.any(Object)
      )
    })
  })

  describe('enrichWithAppleMusic', () => {
    const mockChartData = {
      songs: [
        { name: 'Song 1', artist: 'Artist 1' },
        { name: 'Song 2', artist: 'Artist 2' },
        { name: 'Song 3', artist: 'Artist 3' }
      ]
    }

    beforeEach(() => {
      // Mock token generation and API responses
      mockImportPKCS8.mockResolvedValue('mock-key' as unknown as CryptoKey)
      const mockJWT = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setIssuer: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue('mock.token')
      }
      mockSignJWT.mockReturnValue(mockJWT as unknown as SignJWT)
    })

    it('should enrich all songs with Apple Music data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          results: {
            songs: {
              data: [{
                id: '123',
                attributes: {
                  url: 'https://music.apple.com/song/123',
                  previews: [{ url: 'https://preview.com/song.m4a' }],
                  artwork: { url: 'https://artwork.com/{w}x{h}.jpg' }
                }
              }]
            }
          }
        })
      } as Response)
      
      const result = await enrichWithAppleMusic(mockChartData)
      
      expect(result.songs).toHaveLength(3)
      const songs = result.songs as Record<string, unknown>[]
      songs.forEach((song: Record<string, unknown>) => {
        expect(song).toHaveProperty('apple_music')
        expect(song.apple_music).toEqual({
          id: '123',
          url: 'https://music.apple.com/song/123',
          preview_url: 'https://preview.com/song.m4a',
          artwork_url: 'https://artwork.com/1000x1000.jpg'
        })
      })
    })

    it('should handle partial enrichment failures', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            results: {
              songs: { data: [{ id: '123', attributes: { url: 'test' } }] }
            }
          })
        } as Response)
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: {} })
        } as Response)
      
      const result = await enrichWithAppleMusic(mockChartData)
      
      const songs = result.songs as Record<string, unknown>[]
      expect(songs[0].apple_music).toBeDefined()
      expect(songs[1].apple_music).toBeNull()
      expect(songs[2].apple_music).toBeNull()
    })

    it('should handle invalid chart data gracefully', async () => {
      const invalidData = { songs: null }
      
      const result = await enrichWithAppleMusic(invalidData)
      
      expect(result).toEqual(invalidData)
    })

    it('should process songs in batches', async () => {
      const largeSongList = Array.from({ length: 12 }, (_, i) => ({
        name: `Song ${i}`,
        artist: `Artist ${i}`
      }))
      
      const largeChartData = { songs: largeSongList }
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: {} })
      } as Response)
      
      await enrichWithAppleMusic(largeChartData)
      
      // Should make calls in batches of 5
      expect(mockFetch).toHaveBeenCalledTimes(12)
    })
  })

  describe('Performance and Rate Limiting', () => {
    it('should respect API rate limits', async () => {
      const startTime = Date.now()
      
      // Mock multiple enrichment calls
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: {} })
      } as Response)
      
      await enrichWithAppleMusic({
        songs: Array.from({ length: 10 }, (_, i) => ({
          name: `Song ${i}`,
          artist: `Artist ${i}`
        }))
      })
      
      const endTime = Date.now()
      
      // Should include delays between batches
      expect(endTime - startTime).toBeGreaterThan(100)
    })

    it('should handle concurrent token requests', async () => {
      const promises = Array.from({ length: 5 }, () => generateAppleMusicToken())
      
      const tokens = await Promise.all(promises)
      
      // Should generate token only once due to caching
      expect(mockSignJWT).toHaveBeenCalledTimes(1)
      tokens.forEach(token => expect(token).toBe('mock.jwt.token'))
    })
  })
})