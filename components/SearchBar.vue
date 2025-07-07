<template>
  <div class="relative w-full max-w-md" ref="searchContainer">
    <!-- Search Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon 
          name="heroicons:magnifying-glass-20-solid" 
          class="h-5 w-5 text-gray-400"
          :class="{ 'text-blue-500': isFocused }"
        />
      </div>
      
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Search songs and artists..."
        class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        :class="{
          'ring-2 ring-blue-500 border-blue-500': isFocused,
          'border-gray-300': !isFocused
        }"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        autocomplete="off"
        spellcheck="false"
      />
      
      <!-- Clear Button -->
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          v-if="searchQuery"
          @click="handleClear"
          class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
          type="button"
        >
          <Icon name="heroicons:x-mark-20-solid" class="h-5 w-5" />
        </button>
        
        <!-- Loading Spinner -->
        <div
          v-else-if="isSearching"
          class="animate-spin h-4 w-4 border-2 border-gray-200 border-t-blue-500 rounded-full"
        />
      </div>
    </div>

    <!-- Search Results Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="showResultsDropdown"
        class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
      >
        <!-- Search Results -->
        <div v-if="searchQuery && searchResults.length > 0" class="py-2">
          <div class="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            {{ searchResults.length }} Results
          </div>
          
          <button
            v-for="(song, index) in searchResults"
            :key="`${song.position}-${song.name}`"
            @click="handleSelectResult(song)"
            @mouseenter="setHighlightedIndex(index)"
            class="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
            :class="{
              'bg-blue-50 border-l-2 border-l-blue-500': highlightedIndex === index
            }"
          >
            <div class="flex items-center space-x-3">
              <img
                :src="song.image"
                :alt="`${song.name} cover`"
                class="w-10 h-10 rounded object-cover flex-shrink-0"
              />
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p 
                    class="text-sm font-medium text-gray-900 truncate"
                    v-html="highlightMatches(song.name, song._searchMatches?.find(m => m.key === 'name'))"
                  />
                  <span class="text-xs text-gray-500">#{{ song.position }}</span>
                </div>
                <p 
                  class="text-sm text-gray-500 truncate"
                  v-html="highlightMatches(song.artist, song._searchMatches?.find(m => m.key === 'artist'))"
                />
              </div>
              
              <div class="flex-shrink-0">
                <Icon name="heroicons:arrow-right-20-solid" class="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </button>
        </div>

        <!-- No Results -->
        <div v-else-if="searchQuery && !isSearching && searchResults.length === 0" class="py-4 text-center">
          <Icon name="heroicons:musical-note-20-solid" class="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p class="text-sm text-gray-500">No songs found for "{{ searchQuery }}"</p>
        </div>

        <!-- Search History -->
        <div v-else-if="!searchQuery && searchHistory.length > 0" class="py-2">
          <div class="flex items-center justify-between px-3 py-1">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Recent Searches
            </span>
            <button
              @click="handleClearHistory"
              class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
          
          <button
            v-for="(query, index) in searchHistory.slice(0, 5)"
            :key="`history-${index}`"
            @click="handleHistorySelect(query)"
            @mouseenter="setHighlightedIndex(index)"
            class="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
            :class="{
              'bg-blue-50 border-l-2 border-l-blue-500': highlightedIndex === index
            }"
          >
            <div class="flex items-center space-x-3">
              <Icon name="heroicons:clock-20-solid" class="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span class="text-sm text-gray-700 truncate">{{ query }}</span>
            </div>
          </button>
        </div>

        <!-- Search Suggestions -->
        <div v-else-if="!searchQuery" class="py-4 text-center">
          <Icon name="heroicons:magnifying-glass-20-solid" class="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p class="text-sm text-gray-500">Start typing to search songs and artists</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Song } from '~/types'

interface Props {
  songs?: Song[]
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  songs: () => [],
  placeholder: 'Search songs and artists...'
})

interface Emits {
  (e: 'search', query: string): void
  (e: 'select', song: Song): void
  (e: 'clear'): void
}

const emit = defineEmits<Emits>()

// Search functionality
const {
  searchQuery,
  searchResults,
  searchHistory,
  isSearching,
  showResults,
  highlightedIndex,
  search,
  clearSearch,
  clearHistory,
  addToHistory,
  navigateResults,
  getHighlightedResult,
  selectResult,
  highlightMatches,
  setShowResults,
  setHighlightedIndex,
  initializeSearch
} = useSearch()

// Component state
const searchInput = ref<HTMLInputElement>()
const searchContainer = ref<HTMLElement>()
const isFocused = ref(false)

// Computed
const showResultsDropdown = computed(() => {
  return isFocused.value && showResults.value
})

// Initialize search when songs change
watch(() => props.songs, (newSongs) => {
  if (newSongs && newSongs.length > 0) {
    initializeSearch(newSongs)
  }
}, { immediate: true })

// Handle input
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const query = target.value
  
  search(query, props.songs)
  emit('search', query)
  
  if (!query) {
    setShowResults(false)
  }
}

// Handle focus
const handleFocus = () => {
  isFocused.value = true
  setShowResults(true)
}

// Handle blur with delay to allow for clicks
let blurTimeout: NodeJS.Timeout
const handleBlur = () => {
  blurTimeout = setTimeout(() => {
    isFocused.value = false
    setShowResults(false)
  }, 150)
}

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      navigateResults('down')
      break
      
    case 'ArrowUp':
      event.preventDefault()
      navigateResults('up')
      break
      
    case 'Enter':
      event.preventDefault()
      const highlighted = getHighlightedResult()
      if (highlighted) {
        handleSelectResult(highlighted)
      } else if (searchQuery.value && searchResults.value.length > 0) {
        handleSelectResult(searchResults.value[0])
      }
      break
      
    case 'Escape':
      event.preventDefault()
      handleClear()
      searchInput.value?.blur()
      break
  }
}

// Handle result selection
const handleSelectResult = (song: any) => {
  clearTimeout(blurTimeout)
  selectResult(song as Song)
  emit('select', song as Song)
  searchInput.value?.blur()
}

// Handle history selection
const handleHistorySelect = (query: string) => {
  clearTimeout(blurTimeout)
  searchInput.value!.value = query
  search(query, props.songs)
  emit('search', query)
}

// Handle clear
const handleClear = () => {
  clearSearch()
  emit('clear')
  setShowResults(false)
}

// Handle clear history
const handleClearHistory = () => {
  clearHistory()
}

// Click outside to close
onClickOutside(searchContainer, () => {
  setShowResults(false)
  isFocused.value = false
})

// Focus method for external use
const focusInput = () => {
  searchInput.value?.focus()
}

// Expose methods
defineExpose({
  focusInput,
  clearSearch: handleClear
})
</script>