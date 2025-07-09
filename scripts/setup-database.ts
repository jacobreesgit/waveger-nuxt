import { getDatabase, testDatabaseConnection } from '../server/database/connection'

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...')
    
    // Test connection
    const connectionTest = await testDatabaseConnection()
    console.log('✅ Database connection successful:', connectionTest)
    
    console.log('✅ Database setup completed successfully!')
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()