<template>
  <div class="bg-white rounded-lg p-4 mb-6 shadow-sm">
    <div class="flex flex-wrap items-center gap-4">
      <h3 class="text-sm font-medium text-gray-700">Filters:</h3>
      
      <!-- Favorites Filter -->
      <button
        :class="[
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          showFavoritesOnly
            ? 'bg-red-100 text-red-700 border border-red-300'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
        ]"
        @click="toggleFavoritesFilter"
      >
        <Icon 
          :name="showFavoritesOnly ? 'heroicons:heart-20-solid' : 'heroicons:heart-20-solid'"
          :class="['w-4 h-4', showFavoritesOnly ? 'text-red-600' : 'text-gray-400']"
        />
        <span>Favorites Only</span>
        <span v-if="showFavoritesOnly && favoritesCount > 0" class="text-xs bg-red-200 text-red-800 px-1.5 py-0.5 rounded-full">
          {{ favoritesCount }}
        </span>
      </button>

      <!-- Position Range Filter -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600">Position:</label>
        <select
          v-model="selectedPositionRange"
          class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="updatePositionRange"
        >
          <option value="all">All Positions</option>
          <option value="1-10">1-10</option>
          <option value="11-25">11-25</option>
          <option value="26-50">26-50</option>
          <option value="51-100">51-100</option>
        </select>
      </div>

      <!-- Weeks on Chart Filter -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600">Weeks:</label>
        <select
          v-model="selectedWeeksRange"
          class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="updateWeeksRange"
        >
          <option value="all">All</option>
          <option value="1">1 Week</option>
          <option value="2-5">2-5 Weeks</option>
          <option value="6-10">6-10 Weeks</option>
          <option value="11-20">11-20 Weeks</option>
          <option value="21+">21+ Weeks</option>
        </select>
      </div>

      <!-- New Songs Filter -->
      <button
        :class="[
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          showNewSongsOnly
            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
        ]"
        @click="toggleNewSongsFilter"
      >
        <Icon 
          name="heroicons:star-20-solid"
          :class="['w-4 h-4', showNewSongsOnly ? 'text-yellow-600' : 'text-gray-400']"
        />
        <span>New Songs Only</span>
        <span v-if="showNewSongsOnly && newSongsCount > 0" class="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full">
          {{ newSongsCount }}
        </span>
      </button>

      <!-- Sort Options -->
      <div class="flex items-center gap-2 border-l pl-4 ml-2">
        <label class="text-sm text-gray-600">Sort by:</label>
        <select
          v-model="selectedSortOption"
          class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="updateSortOption"
        >
          <option value="position">Position</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="weeks">Weeks on Chart</option>
        </select>
        <button
          class="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
          :class="sortOrder === 'asc' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          :title="sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'"
          @click="toggleSortOrder"
        >
          <Icon 
            :name="sortOrder === 'asc' ? 'heroicons:arrow-up-20-solid' : 'heroicons:arrow-down-20-solid'"
            class="w-3 h-3"
          />
          {{ sortOrder === 'asc' ? 'ASC' : 'DESC' }}
        </button>
      </div>

      <!-- Clear Filters -->
      <button
        v-if="hasActiveFilters"
        class="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        @click="clearAllFilters"
      >
        <Icon name="heroicons:x-mark-20-solid" class="w-3 h-3" />
        Clear All
      </button>

      <!-- Results Count -->
      <span v-if="hasActiveFilters" class="text-sm text-gray-500 ml-auto">
        {{ filteredCount }} of {{ totalCount }} songs
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Song } from "~/types";

const props = defineProps<{
  songs: Song[];
  filteredCount: number;
}>();

const emit = defineEmits<{
  filtersChanged: [filters: {
    showFavoritesOnly: boolean;
    showNewSongsOnly: boolean;
    positionRange: string;
    weeksRange: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }];
}>();

const chartStore = useChartStore();

// Filter state
const showFavoritesOnly = ref(false);
const showNewSongsOnly = ref(false);
const selectedPositionRange = ref("all");
const selectedWeeksRange = ref("all");
const selectedSortOption = ref("position");
const sortOrder = ref<'asc' | 'desc'>('asc');

// Computed properties
const totalCount = computed(() => props.songs.length);

const favoritesCount = computed(() => {
  return props.songs.filter(song => chartStore.isFavorite(song.position)).length;
});

const newSongsCount = computed(() => {
  return props.songs.filter(song => song.last_week_position === 0).length;
});

const hasActiveFilters = computed(() => {
  return showFavoritesOnly.value || showNewSongsOnly.value || selectedPositionRange.value !== "all" || selectedWeeksRange.value !== "all" || selectedSortOption.value !== "position" || sortOrder.value !== "asc";
});

// Filter methods
const toggleFavoritesFilter = () => {
  showFavoritesOnly.value = !showFavoritesOnly.value;
  emitFiltersChanged();
};

const toggleNewSongsFilter = () => {
  showNewSongsOnly.value = !showNewSongsOnly.value;
  emitFiltersChanged();
};

const updatePositionRange = () => {
  emitFiltersChanged();
};

const updateWeeksRange = () => {
  emitFiltersChanged();
};

const updateSortOption = () => {
  emitFiltersChanged();
};

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  emitFiltersChanged();
};

const clearAllFilters = () => {
  showFavoritesOnly.value = false;
  showNewSongsOnly.value = false;
  selectedPositionRange.value = "all";
  selectedWeeksRange.value = "all";
  selectedSortOption.value = "position";
  sortOrder.value = "asc";
  emitFiltersChanged();
};

const emitFiltersChanged = () => {
  emit('filtersChanged', {
    showFavoritesOnly: showFavoritesOnly.value,
    showNewSongsOnly: showNewSongsOnly.value,
    positionRange: selectedPositionRange.value,
    weeksRange: selectedWeeksRange.value,
    sortBy: selectedSortOption.value,
    sortOrder: sortOrder.value
  });
};

// Initialize filters on mount
onMounted(() => {
  emitFiltersChanged();
});
</script>