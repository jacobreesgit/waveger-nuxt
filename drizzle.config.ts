import { defineConfig } from 'drizzle-kit'
import { getEnvConfig } from './utils/env'

const env = getEnvConfig()

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: 'timestamp',
  },
})