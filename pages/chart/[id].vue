<template>
  <div class="max-w-6xl mx-auto p-8">
    <div class="mb-8">
      <NuxtLink
        to="/"
        class="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >← Back to Home</NuxtLink
      >
      <div class="flex items-center justify-between mb-2">
        <!-- Previous Week Button -->
        <button
          @click="goToPreviousWeek"
          class="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          title="Previous week"
        >
          <Icon name="heroicons:chevron-left-20-solid" class="w-5 h-5" />
        </button>

        <!-- Chart Title -->
        <h1 class="text-3xl font-bold text-center">
          {{ chartData?.title || formatChartName(chartId) }}
        </h1>

        <!-- Next Week Button -->
        <button
          @click="goToNextWeek"
          :disabled="isCurrentWeek"
          class="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors disabled:text-gray-300 disabled:hover:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          title="Next week"
        >
          <Icon name="heroicons:chevron-right-20-solid" class="w-5 h-5" />
        </button>
      </div>
      
      <p class="text-gray-600 text-center" v-if="chartData">
        Week of {{ chartData.week }}
      </p>
    </div>

    <!-- Search Bar -->
    <div v-if="chartData?.songs" class="mb-8">
      <SearchBar
        :songs="chartData.songs"
        @search="handleSearch"
        @select="handleSongSelect"
        @clear="handleSearchClear"
      />
    </div>

    <ClientOnly>
      <div v-if="chartData" class="space-y-4">
        <ChartCard
          v-for="song in displayedSongs"
          :key="`${song.position}-${song.name}`"
          :song="song"
        />
      </div>

      <div v-else-if="isLoading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"
        ></div>
        <p class="mt-4 text-gray-600">Loading chart...</p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600">Failed to load chart data</p>
        <button
          @click="() => refetch()"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>

      <template #fallback>
        <div class="text-center py-12">
          <div
            class="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"
          ></div>
          <p class="mt-4 text-gray-600">Loading chart...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { Song } from '~/types'

const route = useRoute();
const chartId = computed(() => {
  const id = route.params.id;
  return Array.isArray(id) ? id[0] : String(id);
});

// Chart store for week navigation
const chartStore = useChartStore()
const { isCurrentWeek, goToPreviousWeek, goToNextWeek } = chartStore

const { useChartQuery } = useCharts();
const { data: chartData, isLoading, error, refetch } = useChartQuery(chartId, {
  includeAppleMusic: ref(true) // Enable Apple Music enrichment for audio previews
});

// Search functionality
const searchQuery = ref('')
const isSearchActive = ref(false)

// Computed songs list for display (filtered or full list)
const displayedSongs = computed(() => {
  if (!chartData.value?.songs) return []
  
  if (!isSearchActive.value || !searchQuery.value.trim()) {
    return chartData.value.songs
  }

  // Filter songs based on search query
  const query = searchQuery.value.toLowerCase().trim()
  return chartData.value.songs.filter((song: Song) =>
    song.name.toLowerCase().includes(query) ||
    song.artist.toLowerCase().includes(query)
  )
})

// Search handlers
const handleSearch = (query: string) => {
  searchQuery.value = query
  isSearchActive.value = !!query.trim()
}

const handleSongSelect = (song: Song) => {
  // Scroll to selected song
  nextTick(() => {
    const element = document.querySelector(`[data-song-position="${song.position}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

const handleSearchClear = () => {
  searchQuery.value = ''
  isSearchActive.value = false
}

const formatChartName = (id: string) => {
  return id
    .toString()
    .split("-")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
</script>
