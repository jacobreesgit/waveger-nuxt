import { vi } from 'vitest'

// Mock Nuxt runtime config
vi.mock('#nitro', () => ({
  useRuntimeConfig: vi.fn(() => ({
    rapidApiKey: 'test-rapid-api-key',
    redisUrl: 'redis://localhost:6379',
    appleMusicKeyId: 'test-key-id',
    appleMusicTeamId: 'test-team-id',
    appleMusicAuthKey: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----',
    public: {
      siteUrl: 'http://localhost:3000'
    }
  }))
}))

// Mock global fetch
global.fetch = vi.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
}

// Mock process.env for tests
process.env.NODE_ENV = 'test'

// Mock Redis cache functions
vi.mock('~/server/utils/redis', () => ({
  getRedisClient: vi.fn(),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDelete: vi.fn().mockResolvedValue(undefined),
  checkRedisHealth: vi.fn().mockResolvedValue(true)
}))

// Mock Apple Music functions
vi.mock('~/server/utils/appleMusic', () => ({
  generateAppleMusicToken: vi.fn().mockResolvedValue('mock.jwt.token'),
  searchAppleMusic: vi.fn().mockResolvedValue(null),
  enrichWithAppleMusic: vi.fn().mockImplementation(data => Promise.resolve(data))
}))

// Mock ofetch
vi.mock('ofetch', () => ({
  $fetch: vi.fn()
}))

// Setup DOM globals for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Increase timeout for integration tests
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000
})