/**
 * Retry Utilities with Exponential Backoff
 * 
 * Provides robust retry mechanisms for API calls with intelligent backoff strategies,
 * circuit breaker patterns, and comprehensive error handling.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number
  /** Initial delay in milliseconds */
  initialDelay?: number
  /** Maximum delay in milliseconds */
  maxDelay?: number
  /** Backoff multiplier */
  backoffMultiplier?: number
  /** Jitter factor (0-1) to add randomness */
  jitter?: number
  /** Timeout for each attempt in milliseconds */
  timeoutMs?: number
  /** Function to determine if an error should trigger a retry */
  shouldRetry?: (error: unknown, attempt: number) => boolean
  /** Function called before each retry attempt */
  onRetry?: (error: unknown, attempt: number, delay: number) => void
}

export interface RetryResult<T> {
  /** The successful result */
  data: T
  /** Number of attempts made */
  attempts: number
  /** Total time taken in milliseconds */
  totalTime: number
  /** Whether any retries were performed */
  retried: boolean
}

export class RetryError extends Error {
  public readonly attempts: number
  public readonly totalTime: number
  public readonly lastError: unknown

  constructor(message: string, attempts: number, totalTime: number, lastError: unknown) {
    super(message)
    this.name = 'RetryError'
    this.attempts = attempts
    this.totalTime = totalTime
    this.lastError = lastError
  }
}

/**
 * Default retry configuration for different types of operations
 */
export const RETRY_CONFIGS = {
  /** Configuration for Billboard API calls */
  BILLBOARD_API: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: 0.1,
    timeoutMs: 15000,
    shouldRetry: (error: unknown, attempt: number) => {
      // Don't retry on authentication errors or client errors
      if (isHttpError(error)) {
        const status = getHttpErrorStatus(error)
        if (status >= 400 && status < 500) {
          return false // Client errors shouldn't be retried
        }
        if (status === 429) {
          return attempt < 3 // Retry rate limits a few times
        }
        return status >= 500 // Retry server errors
      }
      
      // Retry on network errors, timeouts, and unknown errors
      return isNetworkError(error) || isTimeoutError(error)
    }
  },
  
  /** Configuration for Apple Music API calls */
  APPLE_MUSIC_API: {
    maxAttempts: 2,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: 0.1,
    timeoutMs: 10000,
    shouldRetry: (error: unknown) => {
      if (isHttpError(error)) {
        const status = getHttpErrorStatus(error)
        return status >= 500 || status === 429
      }
      return isNetworkError(error) || isTimeoutError(error)
    }
  },
  
  /** Configuration for database operations */
  DATABASE: {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 2000,
    backoffMultiplier: 1.5,
    jitter: 0.2,
    timeoutMs: 5000,
    shouldRetry: (error: unknown) => {
      // Retry on connection errors but not on syntax errors
      return isNetworkError(error) || isDatabaseConnectionError(error)
    }
  }
} as const

/**
 * Executes a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const config = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: 0.1,
    timeoutMs: 10000,
    shouldRetry: () => true,
    onRetry: () => {},
    ...options
  }

  const startTime = Date.now()
  let lastError: unknown
  let attempt = 0

  while (attempt < config.maxAttempts) {
    attempt++

    try {
      // Execute operation with timeout
      const result = await executeWithTimeout(operation, config.timeoutMs)
      
      return {
        data: result,
        attempts: attempt,
        totalTime: Date.now() - startTime,
        retried: attempt > 1
      }
    } catch (error) {
      lastError = error
      
      // Don't retry if we've exhausted attempts
      if (attempt >= config.maxAttempts) {
        break
      }
      
      // Check if we should retry this error
      if (!config.shouldRetry(error, attempt)) {
        break
      }
      
      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      )
      
      const jitterAmount = baseDelay * config.jitter * (Math.random() * 2 - 1)
      const delay = Math.max(0, baseDelay + jitterAmount)
      
      // Call retry callback
      config.onRetry(error, attempt, delay)
      
      // Wait before next attempt
      await sleep(delay)
    }
  }

  // All attempts failed
  throw new RetryError(
    `Operation failed after ${attempt} attempts`,
    attempt,
    Date.now() - startTime,
    lastError
  )
}

/**
 * Executes a promise with a timeout
 */
async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Operation timeout'))
    }, timeoutMs)
  })

  return Promise.race([operation(), timeoutPromise])
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Error type detection utilities
 */
function isHttpError(error: unknown): boolean {
  return error instanceof Error && 'statusCode' in error
}

function getHttpErrorStatus(error: unknown): number {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return Number(error.statusCode) || 0
  }
  return 0
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  
  const networkErrorMessages = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    'Network request failed',
    'fetch failed'
  ]
  
  return networkErrorMessages.some(msg => 
    error.message.includes(msg) || error.name.includes(msg)
  )
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  
  return error.name === 'TimeoutError' || 
         error.message.includes('timeout') ||
         error.message.includes('Timeout')
}

function isDatabaseConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  
  const dbErrorMessages = [
    'connection terminated',
    'connection lost',
    'connection refused',
    'database is not available'
  ]
  
  return dbErrorMessages.some(msg => 
    error.message.toLowerCase().includes(msg)
  )
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime < this.recoveryTimeout) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'HALF_OPEN'
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailTime = Date.now()
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state
  }
}

/**
 * Global circuit breaker instances for different services
 */
export const circuitBreakers = {
  billboard: new CircuitBreaker(3, 30000),
  appleMusic: new CircuitBreaker(5, 60000),
  database: new CircuitBreaker(2, 10000)
}