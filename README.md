# Waveger 🎵

A modern music charts explorer with real-time data and audio previews. Built with Nuxt 3, Waveger fetches Billboard chart data and enriches it with Apple Music integration for seamless audio previews.

## Features

- 🎯 **Real-time Billboard Charts** - Browse current and historical chart data
- 🎧 **Audio Previews** - Listen to song previews via Apple Music integration
- ⭐ **Favorites System** - Save and manage your favorite tracks
- 📱 **Responsive Design** - Modern UI with Nuxt UI and TailwindCSS
- ⚡ **Performance Optimized** - Multi-layer caching with Redis and TanStack Query
- 🔍 **Health Monitoring** - Comprehensive API health checks and service monitoring
- 🧪 **Full Test Coverage** - Unit, integration, and API connection testing

## Tech Stack

- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Styling**: Nuxt UI (@nuxt/ui) with TailwindCSS
- **State Management**: Pinia stores with VueUse composables
- **Data Fetching**: TanStack Query (@tanstack/vue-query)
- **Audio**: Howler.js via @vueuse/sound
- **Validation**: Zod schemas for runtime type safety
- **Caching**: Redis (Upstash) for API response caching
- **Testing**: Vitest with comprehensive test coverage
- **Monitoring**: Custom health checks and service monitoring

## Setup

Install dependencies:

```bash
npm install
```

## Development

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Generate static site:

```bash
npm run generate
```

## Testing

Run all tests:

```bash
npx vitest
```

Run tests with coverage:

```bash
npx vitest --coverage
```

Run tests in watch mode:

```bash
npx vitest --watch
```

Run specific test suites:

```bash
# API connection tests
npx vitest run tests/api/

# Unit tests
npx vitest run tests/unit/

# Integration tests
npx vitest run tests/integration/
```

## Architecture

### Core Components

- **stores/chart.ts** - Main application state management
- **composables/useCharts.ts** - Chart data fetching with caching
- **composables/useAudio.ts** - Audio playback management
- **server/api/charts/[id].get.ts** - API endpoint with Apple Music enrichment
- **server/api/health.get.ts** - Comprehensive health monitoring endpoint

### Data Flow

1. Client selects chart → Pinia store updates → TanStack Query fetches data
2. API checks Redis cache → Falls back to Billboard API → Enriches with Apple Music
3. Audio previews managed through Howler.js with progress tracking
4. User preferences persisted via VueUse localStorage composables
5. Health monitoring tracks all external service connections in real-time

## API Endpoints

### Charts API

**GET `/api/charts/[id]`**

Fetch Billboard chart data with optional Apple Music enrichment.

**Parameters:**
- `id` (path) - Chart identifier (e.g., `hot-100`, `billboard-200`)
- `week` (query, optional) - Specific week in YYYY-MM-DD format for historical data
- `refresh` (query, optional) - Set to `true` to bypass cache
- `apple_music` (query, optional) - Set to `false` to disable Apple Music enrichment (enabled by default)

**Examples:**
```bash
# Get current Hot 100 chart with Apple Music previews
curl http://localhost:3000/api/charts/hot-100

# Get historical chart data for specific week
curl http://localhost:3000/api/charts/hot-100?week=2024-01-01

# Get chart data without Apple Music enrichment
curl http://localhost:3000/api/charts/hot-100?apple_music=false

# Force refresh cache
curl http://localhost:3000/api/charts/hot-100?refresh=true
```

**Response:**
```json
{
  "chart": {
    "name": "Billboard Hot 100",
    "week": "2024-07-07",
    "entries": [
      {
        "rank": 1,
        "title": "Song Title",
        "artist": "Artist Name",
        "preview_url": "https://...",
        "artwork_url": "https://..."
      }
    ]
  },
  "cached": false
}
```

### Health Monitoring

**GET `/api/health`**

Comprehensive health check endpoint for monitoring all external service connections.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-07-07T12:00:00.000Z",
  "environment": "development",
  "uptime": 3600,
  "memory": {
    "rss": 52428800,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1441792
  },
  "services": {
    "redis": {
      "status": "healthy",
      "latency": 15,
      "error": null
    },
    "billboard": {
      "status": "healthy", 
      "latency": 245,
      "error": null
    },
    "appleMusic": {
      "status": "healthy",
      "latency": 156,
      "error": null
    }
  },
  "version": "1.0.0",
  "responseTime": 423
}
```

**Service Status Values:**
- `healthy` - Service is operational
- `degraded` - Service is slow but functional
- `unhealthy` - Service is not responding
- `misconfigured` - Missing required credentials
- `rate_limited` - API rate limits exceeded

**HTTP Status Codes:**
- `200` - All services healthy or degraded
- `503` - Critical services unhealthy

### Caching Strategy

All API endpoints implement multi-layer caching:

- **Current Charts**: 30-minute TTL
- **Historical Charts**: 7-day TTL  
- **Health Checks**: No caching (real-time)
- **Fallback**: Serves cached data when external APIs fail

## Configuration

API credentials and Redis connection are configured in `nuxt.config.ts`. For production, these should be moved to environment variables.

### Required Environment Variables

```bash
# Billboard API
RAPID_API_KEY=your_rapid_api_key

# Redis
REDIS_URL=redis://your_redis_url

# Apple Music
APPLE_MUSIC_KEY_ID=your_key_id
APPLE_MUSIC_TEAM_ID=your_team_id
APPLE_MUSIC_AUTH_KEY=your_private_key
```

## License

MIT
