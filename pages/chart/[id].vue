<template>
  <div class="min-h-screen flex flex-col">
    <div class="max-w-6xl mx-auto p-8 flex-1 flex flex-col w-full">
      <div class="mb-8">
        <NuxtLink
          to="/"
          class="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >← Back to Home</NuxtLink
        >
        <!-- Chart Title -->
        <h1 class="text-3xl font-bold text-center mb-4">
          {{ getChartTitle(chartId) }}
        </h1>

        <!-- Date Navigation -->
        <div class="flex items-center justify-center mb-2">
          <ChartDatePicker :is-loading="isLoading" />
        </div>

        <p class="text-gray-600 text-center">
          {{ weekDisplay }}
        </p>
      </div>

      <!-- Search Bar -->
      <div v-if="chartData?.songs" class="mb-6">
        <SearchBar
          :songs="chartData.songs"
          @search="handleSearch"
          @select="handleSongSelect"
          @clear="handleSearchClear"
        />
      </div>

      <!-- Filter Toggles -->
      <div v-if="chartData?.songs && !isSearchActive">
        <ChartFilters
          :songs="chartData.songs"
          :filtered-count="displayedSongs.length"
          @filters-changed="handleFiltersChanged"
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

        <div
          v-else-if="isLoading"
          class="flex-1 flex items-center justify-center"
        >
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"
            />
            <p class="mt-4 text-gray-600">Loading chart...</p>
          </div>
        </div>

        <div v-else-if="error" class="text-center py-12">
          <p class="text-red-600">Failed to load chart data</p>
          <button
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
            @click="() => refetch()"
          >
            Retry
          </button>
        </div>

        <template #fallback>
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div
                class="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"
              />
              <p class="mt-4 text-gray-600">Loading chart...</p>
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Song } from "~/types";

const route = useRoute();
const chartId = computed(() => {
  const id = route.params.id;
  return Array.isArray(id) ? id[0] : String(id);
});

// Chart store for week navigation and data
const chartStore = useChartStore();
const { chartData, isLoading, error } = storeToRefs(chartStore);

// Set the chart in the store when the route changes
watch(
  chartId,
  (newChartId) => {
    chartStore.changeChart(newChartId);
  },
  { immediate: true }
);

// Create a refetch function that works with the store
const refetch = () => {
  // We can trigger a refetch by temporarily changing the date and then setting it back
  // This will invalidate the query cache
  const currentDate = chartStore.selectedDate;
  chartStore.setDate(currentDate);
};

// Search functionality
const searchQuery = ref("");
const isSearchActive = ref(false);

// Computed songs list for display (filtered or full list)
const displayedSongs = computed(() => {
  if (!chartData.value?.songs) return [];

  // If search is active, use search results
  if (isSearchActive.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    return chartData.value.songs.filter(
      (song: Song) =>
        song.name.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );
  }

  // Otherwise use filtered songs from store
  return chartStore.filteredSongs;
});

// Search handlers
const handleSearch = (query: string) => {
  searchQuery.value = query;
  isSearchActive.value = !!query.trim();
};

const handleSongSelect = (song: Song) => {
  // Scroll to selected song
  nextTick(() => {
    const element = document.querySelector(
      `[data-song-position="${song.position}"]`
    );
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
};

const handleSearchClear = () => {
  searchQuery.value = "";
  isSearchActive.value = false;
};

// Filter handlers
const handleFiltersChanged = (filters: {
  showFavoritesOnly: boolean;
  showNewSongsOnly: boolean;
  positionRange: string;
  weeksRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) => {
  chartStore.updateFilters(filters);
};

const formatChartName = (id: string) => {
  return id
    .toString()
    .split("-")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Hardcoded chart titles to match page titles
const chartTitleMap: Record<string, string> = {
  'hot-100': 'Hot 100',
  'billboard-200': 'Billboard 200',
  'artist-100': 'Artist 100'
};

const getChartTitle = (id: string) => {
  return chartTitleMap[id] || formatChartName(id);
};

// Chart-specific week offset mapping (based on API analysis)
// Hot 100: shows July 5 when today is July 8 = -3 days
// Billboard 200: shows July 12 when today is July 8 = +4 days  
// Artist 100: shows July 12 when today is July 8 = +4 days
const chartWeekOffsets: Record<string, number> = {
  'hot-100': -3,       // Hot 100 week is 3 days behind current date
  'billboard-200': 4,   // Billboard 200 week is 4 days ahead of current date  
  'artist-100': 4      // Artist 100 week is 4 days ahead of current date
};

// Format week display to match Billboard API format with chart-specific offsets
const formatWeekDisplay = (dateString: string, chartId: string) => {
  const date = new Date(dateString);
  const offset = chartWeekOffsets[chartId] || 0;
  
  // Apply chart-specific offset (subtract days to match API format)
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() + offset);
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  };
  return `Week of ${adjustedDate.toLocaleDateString('en-US', options)}`;
};

// Computed week display - always shows formatted week, never placeholder
const weekDisplay = computed(() => {
  if (chartData.value?.week) {
    return chartData.value.week;
  }
  // Show formatted week based on selected date and chart-specific offset even while loading
  return formatWeekDisplay(chartStore.selectedDate, chartId.value);
});

// Set page title based on chart ID
useSeoMeta({
  title: () => `${getChartTitle(chartId.value)} - Waveger`,
  description: () => `View the latest ${getChartTitle(chartId.value)} chart with real-time data and audio previews`
});
</script>
