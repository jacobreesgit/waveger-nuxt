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

### 1. Environment Configuration

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```bash
# Required API Keys
NUXT_RAPID_API_KEY=your_rapidapi_key_here
DATABASE_URL=postgresql://username:password@host:port/database
NUXT_REDIS_URL=redis://default:your_password@your_host:6379
NUXT_APPLE_MUSIC_KEY_ID=your_key_id_here
NUXT_APPLE_MUSIC_TEAM_ID=your_team_id_here
NUXT_APPLE_MUSIC_AUTH_KEY="-----BEGIN PRIVATE KEY-----
your_private_key_here
-----END PRIVATE KEY-----"

# Optional Configuration
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Where to get credentials:**
- **RapidAPI Key**: Sign up at [RapidAPI](https://rapidapi.com/marketplace) and subscribe to the Billboard API
- **Database**: PostgreSQL database (e.g., [Render](https://render.com/), [Supabase](https://supabase.com/), or [Railway](https://railway.app/))
- **Redis**: Create a database at [Upstash](https://upstash.com/) and get your Redis URL
- **Apple Music**: Set up MusicKit at [Apple Developer Console](https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens)

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

The application uses PostgreSQL with Drizzle ORM. After setting up your database credentials:

```bash
# Generate database schema
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# OR use migration files (recommended for production)
npm run db:migrate
```

**Database Commands:**
- `npm run db:generate` - Generate migration files from schema
- `npm run db:push` - Push schema directly to database
- `npm run db:migrate` - Run migration files
- `npm run db:studio` - Open Drizzle Studio (database GUI)

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

### Environment Variables

Waveger uses a secure environment variable system with validation powered by Zod. All sensitive configuration is loaded from environment variables at build time.

**Environment Validation:**
- All required environment variables are validated using Zod schemas
- The application will fail to start if any required variables are missing or invalid
- Environment validation occurs in `utils/env.ts`

**Security Features:**
- No hardcoded secrets in the codebase
- Runtime validation ensures all environment variables are properly formatted
- Separate validation for server-side and client-side variables

**Configuration Files:**
- `.env` - Your actual environment variables (never commit this file)
- `.env.example` - Template with all required variables
- `utils/env.ts` - Environment validation schema
- `nuxt.config.ts` - Loads validated environment variables

### Database Architecture

**Database Layer:**
- **ORM**: Drizzle ORM with PostgreSQL
- **Connection**: Connection pooling with automatic reconnection
- **Schema**: Type-safe database schema definitions
- **Migrations**: Version-controlled database migrations
- **Health Checks**: Real-time database connectivity monitoring

**Database Tables:**
- `users` - User account information
- `favorite_songs` - User's favorite tracks from charts
- `user_sessions` - Authentication sessions
- `chart_snapshots` - Historical chart data for caching

**Key Features:**
- Automatic connection pooling and reconnection
- Type-safe queries with Drizzle ORM
- Migration system for schema changes
- Health monitoring integration
- Backwards compatibility with localStorage

### Production Deployment

For production environments, set these environment variables in your hosting platform:

```bash
NODE_ENV=production
NUXT_RAPID_API_KEY=your_production_rapidapi_key
DATABASE_URL=your_production_postgresql_url
NUXT_REDIS_URL=your_production_redis_url
NUXT_APPLE_MUSIC_KEY_ID=your_production_key_id
NUXT_APPLE_MUSIC_TEAM_ID=your_production_team_id
NUXT_APPLE_MUSIC_AUTH_KEY=your_production_private_key
NUXT_PUBLIC_SITE_URL=https://your-domain.com
```

## License

MIT
