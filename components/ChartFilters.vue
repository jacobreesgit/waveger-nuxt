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
        <div class="relative">
          <button
            :class="[
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            ]"
            @click="toggleSortDropdown"
          >
            <Icon 
              name="heroicons:bars-arrow-down-20-solid"
              class="w-4 h-4 text-gray-400"
            />
            <span>Sort: {{ getSortLabel(selectedSortOption) }}</span>
            <Icon 
              name="heroicons:chevron-down-20-solid"
              :class="['w-4 h-4 text-gray-400 transition-transform', showSortDropdown ? 'rotate-180' : '']"
            />
          </button>
          
          <!-- Sort Dropdown -->
          <div v-if="showSortDropdown" class="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg min-w-full">
            <div class="py-1">
              <button
                v-for="option in sortOptions"
                :key="option.value"
                :class="[
                  'flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                  selectedSortOption === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                ]"
                @click="selectSortOption(option.value)"
              >
                <Icon 
                  :name="option.icon"
                  class="w-4 h-4"
                />
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
        
        <button
          :class="[
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            sortOrder === 'asc' 
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          ]"
          :title="sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'"
          @click="toggleSortOrder"
        >
          <Icon 
            :name="sortOrder === 'asc' ? 'heroicons:arrow-up-20-solid' : 'heroicons:arrow-down-20-solid'"
            :class="['w-4 h-4', sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400']"
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
  return showFavoritesOnly.value || showNewSongsOnly.value || selectedSortOption.value !== "position" || sortOrder.value !== "asc";
});

// Sort dropdown state
const showSortDropdown = ref(false);
const sortOptions = [
  { value: 'position', label: 'Position', icon: 'heroicons:hashtag-20-solid' },
  { value: 'alphabetical', label: 'Alphabetical', icon: 'heroicons:language-20-solid' },
  { value: 'weeks', label: 'Weeks on Chart', icon: 'heroicons:calendar-days-20-solid' }
];

const getSortLabel = (sortValue: string) => {
  const option = sortOptions.find(opt => opt.value === sortValue);
  return option ? option.label : 'Position';
};

const toggleSortDropdown = () => {
  showSortDropdown.value = !showSortDropdown.value;
};

const selectSortOption = (value: string) => {
  selectedSortOption.value = value;
  showSortDropdown.value = false;
  emitFiltersChanged();
};

// Close dropdown when clicking outside
const closeDropdown = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    showSortDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
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
  selectedSortOption.value = "position";
  sortOrder.value = "asc";
  emitFiltersChanged();
};

const emitFiltersChanged = () => {
  emit('filtersChanged', {
    showFavoritesOnly: showFavoritesOnly.value,
    showNewSongsOnly: showNewSongsOnly.value,
    positionRange: 'all',
    weeksRange: 'all',
    sortBy: selectedSortOption.value,
    sortOrder: sortOrder.value
  });
};

// Initialize filters on mount
onMounted(() => {
  emitFiltersChanged();
});
</script>