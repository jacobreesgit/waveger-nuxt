export default defineNuxtConfig({
  compatibilityDate: '2025-07-04',
  devtools: { enabled: true },
  
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
    // Private (server-side only) - your real credentials
    rapidApiKey: 'e07425d972msh24a5be687176d40p1b01b6jsn4425e49aba7a',
    redisUrl: 'redis://default:AdinAAIjcDFmYTM3OTM0Y2I1ZmI0NmNkODkyMWM4ODBlYjA2MWQwN7AxMA@premium-humpback-55463.upstash.io:6379',
    appleMusicKeyId: '2H884KN5CZ',
    appleMusicTeamId: '5RP4WRQ9V2',
    appleMusicAuthKey: `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgi0Gm6sOeQWwoC76t
lTQmS9bIJhSoZJFKhBw1qjDueEegCgYIKoZIzj0DAQehRANCAAQPVy5Hb82C5mlz
An+C9pm+ZBuMpzstnCVW6NoTEJpcP9cyRjnDS2SfDF7xC3X8Wzwfc6LOVXCzHk7T
o5xk98gT
-----END PRIVATE KEY-----`,
    
    // Public (client-side)
    public: {
      siteUrl: 'http://localhost:3000'
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
        connectionString: 'redis://default:AdinAAIjcDFmYTM3OTM0Y2I1ZmI0NmNkODkyMWM4ODBlYjA2MWQwN7AxMA@premium-humpback-55463.upstash.io:6379'
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