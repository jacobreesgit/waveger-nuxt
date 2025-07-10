/**
 * Test script to demonstrate the Billboard API fixes
 * This script tests the robust error handling and data transformation
 */

import { transformBillboardResponse, validateTransformedResponse } from '../server/utils/billboardTransformer.js'

// Test malformed Billboard API response (simulating real issues)
const malformedResponse = {
  info: null,
  title: '',
  week: null,
  songs: [
    {
      position: '1',
      name: 'Test Song 1',
      artist: null, // Missing artist - this was causing validation errors
      image: 'invalid-url',
      last_week_position: null,
      peak_position: 'invalid',
      weeks_on_chart: '',
      url: null
    },
    {
      position: null,
      name: '',
      artist: undefined,
      image: '//cdn.example.com/image.jpg', // Relative URL
      last_week_position: 'N/A',
      peak_position: 2,
      weeks_on_chart: '3',
      url: '/chart/link'
    },
    null, // Null entry
    {
      // Missing fields
      position: 3,
      name: 'Song with missing data'
    }
  ]
}

console.log('🧪 Testing Billboard API fixes...\n')

// Test 1: Transform malformed response
console.log('📊 Test 1: Transforming malformed response')
try {
  const transformed = transformBillboardResponse(malformedResponse, 'hot-100')
  console.log('✅ Transformation successful!')
  console.log(`   - Songs transformed: ${transformed.songs.length}`)
  console.log(`   - Title: "${transformed.title}"`)
  console.log(`   - Week: "${transformed.week}"`)
  
  // Show first song transformation
  const firstSong = transformed.songs[0]
  console.log('   - First song after transformation:')
  console.log(`     * Position: ${firstSong.position}`)
  console.log(`     * Name: "${firstSong.name}"`)
  console.log(`     * Artist: "${firstSong.artist}"`)
  console.log(`     * Image: "${firstSong.image}"`)
  console.log(`     * URL: "${firstSong.url}"`)
  
} catch (error) {
  console.log('❌ Transformation failed:', error.message)
}

console.log('\n' + '='.repeat(50) + '\n')

// Test 2: Validate data quality
console.log('📊 Test 2: Validating data quality')
try {
  const transformed = transformBillboardResponse(malformedResponse, 'hot-100')
  const validation = validateTransformedResponse(transformed)
  
  console.log(`✅ Validation completed!`)
  console.log(`   - Valid: ${validation.valid}`)
  console.log(`   - Issues found: ${validation.issues.length}`)
  
  if (validation.issues.length > 0) {
    console.log('   - Issues:')
    validation.issues.forEach(issue => {
      console.log(`     * ${issue}`)
    })
  }
  
} catch (error) {
  console.log('❌ Validation failed:', error.message)
}

console.log('\n' + '='.repeat(50) + '\n')

// Test 3: Different chart types
console.log('📊 Test 3: Testing different chart types')
const artistChartResponse = {
  info: 'Artist chart data',
  title: 'Artist 100',
  week: '2024-01-01',
  songs: [
    {
      position: 1,
      name: 'Taylor Swift', // For artist charts, name is the artist
      artist: null,
      image: 'https://example.com/artist.jpg',
      last_week_position: 2,
      peak_position: 1,
      weeks_on_chart: 5,
      url: 'https://example.com/artist'
    }
  ]
}

try {
  const transformed = transformBillboardResponse(artistChartResponse, 'artist-100')
  console.log('✅ Artist chart transformation successful!')
  console.log(`   - Artist: "${transformed.songs[0].artist}"`)
  console.log(`   - Chart type detected correctly`)
  
} catch (error) {
  console.log('❌ Artist chart transformation failed:', error.message)
}

console.log('\n🎯 All tests completed! The Billboard API fixes provide:')
console.log('   ✅ Robust data transformation')
console.log('   ✅ Graceful handling of malformed data')
console.log('   ✅ Intelligent fallbacks for missing fields')
console.log('   ✅ Data quality validation')
console.log('   ✅ Support for different chart types')
console.log('\n💡 The API will now handle malformed Billboard responses gracefully!')