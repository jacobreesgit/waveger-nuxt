<template>
  <div class="max-w-6xl mx-auto p-8">
    <div class="mb-8">
      <NuxtLink
        to="/"
        class="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >← Back to Home</NuxtLink
      >
      <h1 class="text-3xl font-bold mb-2">
        {{ chartData?.title || formatChartName(chartId) }}
      </h1>
      <p class="text-gray-600" v-if="chartData">
        Week of {{ chartData.week }}
        <span v-if="chartData.cached" class="text-green-600 ml-2"
          >• Cached</span
        >
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
