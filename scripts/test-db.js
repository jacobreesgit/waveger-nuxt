import postgres from 'postgres'
import { readFileSync } from 'fs'

const DATABASE_URL = 'postgresql://waveger_user:eakOvbNXgScUbEjTleAFdxGFzGHQURRo@dpg-d1n6ie3e5dus73c7oilg-a.frankfurt-postgres.render.com/waveger?sslmode=require'

async function testDatabase() {
  const sql = postgres(DATABASE_URL, {
    ssl: { rejectUnauthorized: false }
  })

  try {
    // Test basic connection
    const result = await sql`SELECT 1 as test, NOW() as timestamp`
    console.log('✅ Database connection successful:', result[0])

    // Create tables
    const createTablesSql = readFileSync('./scripts/create-tables.sql', 'utf8')
    await sql.unsafe(createTablesSql)
    console.log('✅ Tables created successfully')

    // Test table existence
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'favorite_songs', 'user_sessions', 'chart_snapshots')
    `
    console.log('✅ Tables found:', tables.map(t => t.table_name))

  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await sql.end()
  }
}

testDatabase()