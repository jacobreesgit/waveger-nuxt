/**
 * Robust Billboard API Client
 * 
 * Provides comprehensive Billboard chart data fetching with retry logic,
 * error handling, data transformation, and fallback mechanisms.
 */

import { withRetry, RETRY_CONFIGS, circuitBreakers } from './retryUtils'
import { transformBillboardResponse, validateTransformedResponse } from './billboardTransformer'
import type { RawBillboardResponse, TransformedBillboardResponse } from './billboardTransformer'

export interface BillboardClientOptions {
  /** API key for Billboard API */
  apiKey: string
  /** Base URL for Billboard API */
  baseUrl?: string
  /** Enable comprehensive logging */
  debug?: boolean
  /** Cache implementation */
  cache?: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any, ttl?: number) => Promise<void>
  }
}

export interface BillboardFetchOptions {
  /** Specific week to fetch (YYYY-MM-DD format) */
  week?: string
  /** Force refresh cache */
  refresh?: boolean
  /** Maximum time to wait for response in milliseconds */
  timeout?: number
  /** Skip cache and force API call */
  skipCache?: boolean
}

export interface BillboardResponse {
  /** Chart data */
  data: TransformedBillboardResponse
  /** Whether response came from cache */
  cached: boolean
  /** Response metadata */
  metadata: {
    /** Response time in milliseconds */
    responseTime: number
    /** Number of retry attempts */
    attempts: number
    /** Whether transformation was applied */
    transformed: boolean
    /** Data quality score (0-1) */
    quality: number
  }
}

export class BillboardApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'BillboardApiError'
  }
}

export class BillboardClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly debug: boolean
  private readonly cache?: BillboardClientOptions['cache']

  constructor(options: BillboardClientOptions) {
    this.apiKey = options.apiKey
    this.baseUrl = options.baseUrl || 'https://billboard-charts-api.p.rapidapi.com'
    this.debug = options.debug || false
    this.cache = options.cache
  }

  /**
   * Fetch chart data for a specific chart ID
   */
  async fetchChart(
    chartId: string,
    options: BillboardFetchOptions = {}
  ): Promise<BillboardResponse> {
    const startTime = Date.now()
    const cacheKey = this.getCacheKey(chartId, options.week)

    // Check cache first unless refresh is requested
    if (!options.refresh && !options.skipCache && this.cache) {
      const cached = await this.getCachedData(cacheKey)
      if (cached) {
        this.log(`Cache hit for chart ${chartId}`)
        return {
          data: cached,
          cached: true,
          metadata: {
            responseTime: Date.now() - startTime,
            attempts: 0,
            transformed: false,
            quality: 1
          }
        }
      }
    }

    // Fetch from API with retry logic
    const result = await withRetry(
      () => this.fetchFromApi(chartId, options),
      {
        ...RETRY_CONFIGS.BILLBOARD_API,
        timeoutMs: options.timeout || RETRY_CONFIGS.BILLBOARD_API.timeoutMs,
        onRetry: (error, attempt, delay) => {
          this.log(`Retry ${attempt} for chart ${chartId} after ${delay}ms:`, error)
        }
      }
    )

    // Transform raw API response
    const transformedData = transformBillboardResponse(result.data, chartId)
    
    // Validate transformed data quality
    const validation = validateTransformedResponse(transformedData)
    if (!validation.valid) {
      this.log(`Data quality issues for chart ${chartId}:`, validation.issues)
    }

    // Cache the result
    if (this.cache) {
      const ttl = options.week ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000 // 7 days vs 1 hour
      await this.setCachedData(cacheKey, transformedData, ttl)
    }

    return {
      data: transformedData,
      cached: false,
      metadata: {
        responseTime: Date.now() - startTime,
        attempts: result.attempts,
        transformed: true,
        quality: validation.valid ? 1 : Math.max(0, 1 - validation.issues.length * 0.2)
      }
    }
  }

  /**
   * Fetch chart data with fallback to cache on failure
   */
  async fetchChartWithFallback(
    chartId: string,
    options: BillboardFetchOptions = {}
  ): Promise<BillboardResponse> {
    try {
      return await this.fetchChart(chartId, options)
    } catch (error) {
      this.log(`API fetch failed for chart ${chartId}, trying cache fallback:`, error)
      
      // Try to get any cached data as fallback
      if (this.cache) {
        const cacheKey = this.getCacheKey(chartId, options.week)
        const cached = await this.getCachedData(cacheKey)
        if (cached) {
          this.log(`Serving stale cache for chart ${chartId}`)
          return {
            data: cached,
            cached: true,
            metadata: {
              responseTime: 0,
              attempts: 0,
              transformed: false,
              quality: 0.5 // Reduced quality for stale data
            }
          }
        }
      }

      // No cache available, re-throw the error
      throw error
    }
  }

  /**
   * Fetch raw data from Billboard API
   */
  private async fetchFromApi(
    chartId: string,
    options: BillboardFetchOptions
  ): Promise<RawBillboardResponse> {
    // Use circuit breaker to prevent cascading failures
    return circuitBreakers.billboard.execute(async () => {
      const params = new URLSearchParams({ id: chartId })
      if (options.week) {
        params.append('week', options.week)
      }

      const url = `${this.baseUrl}/chart.php?${params}`
      this.log(`Fetching from Billboard API: ${url}`)

      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'billboard-charts-api.p.rapidapi.com',
          'User-Agent': 'Waveger-API/1.0'
        },
        signal: AbortSignal.timeout(options.timeout || 15000)
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new BillboardApiError(
          `Billboard API error: ${response.status} ${response.statusText}`,
          response.status,
          errorText
        )
      }

      const data = await response.json()
      this.log(`Billboard API response for ${chartId}:`, {
        songsCount: data.songs?.length || 0,
        title: data.title,
        week: data.week
      })

      return data
    })
  }

  /**
   * Get data from cache
   */
  private async getCachedData(key: string): Promise<TransformedBillboardResponse | null> {
    if (!this.cache) return null

    try {
      return await this.cache.get(key)
    } catch (error) {
      this.log(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set data in cache
   */
  private async setCachedData(
    key: string,
    data: TransformedBillboardResponse,
    ttl: number
  ): Promise<void> {
    if (!this.cache) return

    try {
      await this.cache.set(key, data, ttl)
    } catch (error) {
      this.log(`Cache set error for key ${key}:`, error)
    }
  }

  /**
   * Generate cache key for chart data
   */
  private getCacheKey(chartId: string, week?: string): string {
    return `billboard:chart:${chartId}:${week || 'current'}`
  }

  /**
   * Internal logging method
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[BillboardClient] ${message}`, data || '')
    }
  }

  /**
   * Get client health information
   */
  getHealthInfo(): {
    circuitBreakerState: string
    baseUrl: string
    hasApiKey: boolean
    hasCache: boolean
  } {
    return {
      circuitBreakerState: circuitBreakers.billboard.getState(),
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      hasCache: !!this.cache
    }
  }
}

/**
 * Create a billboard client instance with cache integration
 */
export function createBillboardClient(options: BillboardClientOptions): BillboardClient {
  return new BillboardClient(options)
}

/**
 * Singleton billboard client instance
 */
let billboardClient: BillboardClient | null = null

/**
 * Get or create the global billboard client instance
 */
export function getBillboardClient(): BillboardClient {
  if (!billboardClient) {
    const config = useRuntimeConfig()
    
    if (!config.rapidApiKey) {
      throw new Error('Billboard API key not configured')
    }

    billboardClient = createBillboardClient({
      apiKey: config.rapidApiKey,
      debug: process.env.NODE_ENV === 'development',
      cache: {
        get: cacheGet,
        set: cacheSet
      }
    })
  }

  return billboardClient
}