# Waveger 🎵

A modern music charts explorer with real-time data and audio previews. Built with Nuxt 3, Waveger fetches Billboard chart data and enriches it with Apple Music integration for seamless audio previews.

## Features

- 🎯 **Real-time Billboard Charts** - Browse current and historical chart data
- 🎧 **Audio Previews** - Listen to song previews via Apple Music integration
- ⭐ **Favorites System** - Save and manage your favorite tracks
- 📱 **Responsive Design** - Modern UI with Nuxt UI and TailwindCSS
- ⚡ **Performance Optimized** - Multi-layer caching with Redis and TanStack Query

## Tech Stack

- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Styling**: Nuxt UI (@nuxt/ui) with TailwindCSS
- **State Management**: Pinia stores with VueUse composables
- **Data Fetching**: TanStack Query (@tanstack/vue-query)
- **Audio**: Howler.js via @vueuse/sound
- **Validation**: Zod schemas for runtime type safety
- **Caching**: Redis (Upstash) for API response caching

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

Run tests with Vitest:

```bash
npx vitest
```

## Architecture

### Core Components

- **stores/chart.ts** - Main application state management
- **composables/useCharts.ts** - Chart data fetching with caching
- **composables/useAudio.ts** - Audio playbook management
- **server/api/charts/[id].get.ts** - API endpoint with Apple Music enrichment

### Data Flow

1. Client selects chart → Pinia store updates → TanStack Query fetches data
2. API checks Redis cache → Falls back to Billboard API → Enriches with Apple Music
3. Audio previews managed through Howler.js with progress tracking
4. User preferences persisted via VueUse localStorage composables

## Configuration

API credentials and Redis connection are configured in `nuxt.config.ts`. For production, these should be moved to environment variables.

## License

MIT
