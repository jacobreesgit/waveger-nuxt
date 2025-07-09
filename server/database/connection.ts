import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { getEnvConfig } from '../../utils/env'
import * as schema from './schema'

// Global connection instances
let db: ReturnType<typeof drizzle> | null = null
let connection: postgres.Sql | null = null

/**
 * Create a new database connection with optimized settings
 */
function createConnection(): postgres.Sql {
  const env = getEnvConfig()
  
  return postgres(env.DATABASE_URL, {
    // Connection pool configuration
    max: 10,                    // Maximum number of connections
    idle_timeout: 20,           // Close idle connections after 20 seconds
    connect_timeout: 10,        // Connection timeout in seconds
    
    // Performance optimizations
    prepare: false,             // Disable prepared statements for better compatibility
    transform: {
      undefined: null,          // Transform undefined to null for PostgreSQL
    },
    
    // Error handling
    onnotice: (notice) => {
      console.warn('[Database Notice]', notice)
    },
    
    // SSL configuration - always use SSL for remote databases
    ssl: env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    
    // Connection retry configuration
    max_lifetime: 60 * 30,      // 30 minutes max connection lifetime
    connection: {
      application_name: 'waveger-nuxt',
    },
  })
}

/**
 * Get or create database connection instance
 */
export function getDatabase() {
  if (!db || !connection) {
    try {
      connection = createConnection()
      db = drizzle(connection, { schema })
      
      console.log('[Database] Connection established successfully')
    } catch (error) {
      console.error('[Database] Failed to establish connection:', error)
      throw error
    }
  }
  
  return db
}

/**
 * Get the raw PostgreSQL connection for health checks
 */
export function getConnection() {
  if (!connection) {
    connection = createConnection()
  }
  return connection
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (connection) {
    try {
      await connection.end()
      connection = null
      db = null
      console.log('[Database] Connection closed successfully')
    } catch (error) {
      console.error('[Database] Error closing connection:', error)
    }
  }
}

/**
 * Health check function - tests database connectivity and measures latency
 */
export async function checkDatabaseHealth() {
  const startTime = Date.now()
  
  try {
    const conn = getConnection()
    
    // Simple health check query
    const result = await conn`SELECT 1 as health_check, NOW() as timestamp`
    
    const latency = Date.now() - startTime
    
    if (result.length > 0) {
      return {
        status: 'healthy' as const,
        latency,
        error: null,
      }
    } else {
      return {
        status: 'unhealthy' as const,
        latency,
        error: 'No response from database',
      }
    }
  } catch (error) {
    const latency = Date.now() - startTime
    
    return {
      status: 'unhealthy' as const,
      latency,
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }
}

/**
 * Run database migrations
 */
export async function runMigrations() {
  try {
    const db = getDatabase()
    const conn = getConnection()
    
    console.log('[Database] Running migrations...')
    await migrate(db, { migrationsFolder: './server/database/migrations' })
    console.log('[Database] Migrations completed successfully')
  } catch (error) {
    console.error('[Database] Migration failed:', error)
    throw error
  }
}

/**
 * Test database connection with detailed diagnostics
 */
export async function testDatabaseConnection() {
  try {
    const db = getDatabase()
    const conn = getConnection()
    
    // Test basic connectivity
    const healthCheck = await checkDatabaseHealth()
    
    // Test table existence (will fail if migrations haven't run)
    const tableCheck = await conn`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'favorite_songs', 'user_sessions', 'chart_snapshots')
    `
    
    return {
      connection: healthCheck,
      tables: tableCheck.map(t => t.table_name),
      tablesExist: tableCheck.length === 4,
    }
  } catch (error) {
    console.error('[Database] Connection test failed:', error)
    throw error
  }
}

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('[Database] Received SIGINT, closing database connection...')
    await closeDatabase()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    console.log('[Database] Received SIGTERM, closing database connection...')
    await closeDatabase()
    process.exit(0)
  })
}