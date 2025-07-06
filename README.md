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

## API Health Monitoring

Access the health endpoint to monitor all external service connections:

```bash
curl http://localhost:3000/api/health
```

The health endpoint provides:
- **Service Status**: Real-time health checks for Redis, Billboard API, and Apple Music
- **Latency Monitoring**: Response times for each service
- **Memory Usage**: Current application memory consumption
- **Error Reporting**: Detailed error messages for failed services
- **System Info**: Environment, uptime, and version information

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
