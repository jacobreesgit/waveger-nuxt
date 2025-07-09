import { z } from 'zod'

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // API Keys
  NUXT_RAPID_API_KEY: z.string().min(1, 'RapidAPI key is required'),
  
  // Database Configuration
  DATABASE_URL: z.string().url('Database URL must be a valid PostgreSQL URL'),
  
  // Redis Configuration
  NUXT_REDIS_URL: z.string().url('Redis URL must be a valid URL'),
  
  // Apple Music Configuration
  NUXT_APPLE_MUSIC_KEY_ID: z.string().min(1, 'Apple Music Key ID is required'),
  NUXT_APPLE_MUSIC_TEAM_ID: z.string().min(1, 'Apple Music Team ID is required'),
  NUXT_APPLE_MUSIC_AUTH_KEY: z.string().min(1, 'Apple Music Auth Key is required'),
  
  // Public Configuration
  NUXT_PUBLIC_SITE_URL: z.string().url('Site URL must be a valid URL').default('http://localhost:3000'),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type EnvConfig = z.infer<typeof envSchema>

/**
 * Validates environment variables at startup
 * @throws {Error} If validation fails
 */
export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`❌ Environment validation failed:\n${missingVars}`)
    }
    throw error
  }
}

/**
 * Get validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  return validateEnv()
}