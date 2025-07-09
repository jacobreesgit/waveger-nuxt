import { validateEnv } from './utils/env'

// Validate environment variables at build time
const env = validateEnv()

export default defineNuxtConfig({
  compatibilityDate: '2025-07-04',
  devtools: { enabled: false },
  
  modules: [
    '@nuxt/ui',
    '@nuxt/icon', 
    '@nuxt/image',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@pinia/nuxt'
  ],
  
  css: ['~/assets/css/main.css'],
  
  typescript: {
    typeCheck: true,
    strict: true
  },
  
  runtimeConfig: {
    // Private (server-side only) - loaded from environment variables
    rapidApiKey: env.NUXT_RAPID_API_KEY,
    redisUrl: env.NUXT_REDIS_URL,
    appleMusicKeyId: env.NUXT_APPLE_MUSIC_KEY_ID,
    appleMusicTeamId: env.NUXT_APPLE_MUSIC_TEAM_ID,
    appleMusicAuthKey: env.NUXT_APPLE_MUSIC_AUTH_KEY,
    
    // Public (client-side)
    public: {
      siteUrl: env.NUXT_PUBLIC_SITE_URL
    }
  },
  
  
  // Modern image optimization
  image: {
    quality: 85,
    formats: ['webp', 'jpg'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    }
  },
  
  // Performance optimizations
  nitro: {
    experimental: {
      wasm: true
    },
    storage: {
      redis: {
        driver: 'redis',
        connectionString: env.NUXT_REDIS_URL
      }
    }
  },
  
  app: {
    head: {
      title: 'Waveger - Modern Music Charts',
      meta: [
        { name: 'description', content: 'Modern music charts explorer with real-time data and audio previews' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#3b82f6' }
      ]
    }
  }
})