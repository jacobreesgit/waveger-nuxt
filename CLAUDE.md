# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 application called **Waveger** - a modern music charts explorer with real-time data and audio previews. The app fetches Billboard chart data via API and enriches it with Apple Music integration for audio previews.

## Key Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run generate` - Generate static site
- `npm install` - Install dependencies

## Architecture

### Tech Stack
- **Framework**: Nuxt 3 with Vue 3 composition API
- **Styling**: Nuxt UI (@nuxt/ui) with TailwindCSS
- **State Management**: Pinia stores with VueUse composables
- **Data Fetching**: TanStack Query (@tanstack/vue-query) for server state management
- **Audio**: Howler.js for audio playback via @vueuse/sound
- **Validation**: Zod schemas for runtime type safety
- **Caching**: Redis (Upstash) for API response caching
- **Icons**: Nuxt Icon with Heroicons, Lucide, and Simple Icons

### Key Architecture Patterns

1. **Composables-First**: Business logic organized in composables (`useCharts`, `useAudio`)
2. **Type Safety**: Zod schemas for runtime validation alongside TypeScript interfaces
3. **Modern State Management**: Pinia with VueUse for reactive persistence
4. **API Caching Strategy**: Multi-layer caching with Redis and TanStack Query
5. **Error Handling**: Graceful fallbacks to cached data when APIs fail

### Core Components Structure

- **stores/chart.ts**: Main application state with chart selection, favorites, and audio integration
- **composables/useCharts.ts**: Chart data fetching with TanStack Query integration
- **composables/useAudio.ts**: Audio playback management using Howler.js
- **server/api/charts/[id].get.ts**: Main API endpoint with caching and Apple Music enrichment
- **types/index.ts**: Type definitions with corresponding Zod schemas

### Data Flow

1. Client selects chart → Pinia store updates → TanStack Query fetches data
2. API endpoint checks Redis cache → Falls back to Billboard API → Enriches with Apple Music
3. Audio previews managed through Howler.js with progress tracking
4. User preferences persisted via VueUse localStorage composables

### Configuration Notes

- **TypeScript**: Strict mode enabled with type checking
- **Runtime Config**: API keys and Redis connection stored in nuxt.config.ts
- **Image Optimization**: WebP format with responsive breakpoints
- **Performance**: WASM experimental support enabled

### Testing

- **Framework**: Vitest configured with @nuxt/test-utils
- **Testing**: No test scripts in package.json yet - tests should be run with `npx vitest`

## Development Notes

- All API credentials are configured in nuxt.config.ts (should be moved to environment variables)
- The app uses modern Nuxt 3 patterns with auto-imports
- Audio playback requires user interaction due to browser autoplay policies
- Chart data is cached with different TTLs for current vs historical data