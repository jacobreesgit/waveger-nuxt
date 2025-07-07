import Fuse from 'fuse.js'
import type { Song } from '~/types'

export const useSearch = () => {
  const searchQuery = ref('')
  const searchHistory = useLocalStorage<string[]>('waveger-search-history', [])
  const isSearching = ref(false)
  const searchResults = ref<Song[]>([])
  const highlightedIndex = ref(-1)
  const showResults = ref(false)

  // Fuse.js configuration for fuzzy search
  const fuseOptions = {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'artist', weight: 0.3 }
    ],
    threshold: 0.4, // Lower = more strict matching
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2
  }

  let fuse: Fuse<Song> | null = null

  // Initialize Fuse with songs data
  const initializeSearch = (songs: Song[]) => {
    fuse = new Fuse(songs, fuseOptions)
  }

  // Perform search
  const performSearch = (query: string, songs: Song[]) => {
    if (!query.trim() || query.length < 2) {
      searchResults.value = []
      return []
    }

    if (!fuse) {
      initializeSearch(songs)
    }

    const results = fuse!.search(query)
    const processedResults: Song[] = results.map(result => ({
      ...result.item,
      _searchScore: result.score,
      _searchMatches: result.matches ? [...result.matches] : undefined
    }))

    searchResults.value = processedResults
    return processedResults
  }

  // Debounced search
  const debouncedSearch = useDebounceFn((query: string, songs: Song[]) => {
    isSearching.value = true
    performSearch(query, songs)
    isSearching.value = false
  }, 300)

  // Search with real-time updates
  const search = (query: string, songs: Song[]) => {
    searchQuery.value = query
    highlightedIndex.value = -1
    
    if (!query.trim()) {
      searchResults.value = []
      showResults.value = false
      return
    }

    showResults.value = true
    debouncedSearch(query, songs)
  }

  // Add to search history
  const addToHistory = (query: string) => {
    if (!query.trim() || query.length < 2) return

    const normalizedQuery = query.trim().toLowerCase()
    
    // Remove if already exists
    const existingIndex = searchHistory.value.findIndex(
      item => item.toLowerCase() === normalizedQuery
    )
    if (existingIndex > -1) {
      searchHistory.value.splice(existingIndex, 1)
    }

    // Add to beginning
    searchHistory.value.unshift(query.trim())
    
    // Keep only last 10 searches
    if (searchHistory.value.length > 10) {
      searchHistory.value = searchHistory.value.slice(0, 10)
    }
  }

  // Clear search
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    highlightedIndex.value = -1
    showResults.value = false
  }

  // Clear search history
  const clearHistory = () => {
    searchHistory.value = []
  }

  // Keyboard navigation
  const navigateResults = (direction: 'up' | 'down') => {
    if (!showResults.value || searchResults.value.length === 0) return

    if (direction === 'down') {
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        searchResults.value.length - 1
      )
    } else {
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
    }
  }

  // Get highlighted result
  const getHighlightedResult = () => {
    if (highlightedIndex.value >= 0 && highlightedIndex.value < searchResults.value.length) {
      return searchResults.value[highlightedIndex.value]
    }
    return null
  }

  // Select result
  const selectResult = (song: Song) => {
    addToHistory(searchQuery.value)
    clearSearch()
    return song
  }

  // Highlight matching text
  const highlightMatches = (text: string, matches: any[] = []) => {
    if (!matches || matches.length === 0) return text

    let highlightedText = text
    const sortedMatches = matches
      .filter(match => match.value === text)
      .sort((a, b) => b.indices[0][0] - a.indices[0][0]) // Sort by position descending

    for (const match of sortedMatches) {
      for (const [start, end] of match.indices) {
        const before = highlightedText.slice(0, start)
        const matched = highlightedText.slice(start, end + 1)
        const after = highlightedText.slice(end + 1)
        highlightedText = `${before}<mark class="bg-yellow-200 dark:bg-yellow-600 px-0.5 rounded">${matched}</mark>${after}`
      }
    }

    return highlightedText
  }

  // Get search suggestions based on history and popular terms
  const getSearchSuggestions = (songs: Song[], limit = 5) => {
    if (searchQuery.value.length >= 2) {
      return searchResults.value.slice(0, limit)
    }

    // Return recent searches if no query
    return searchHistory.value.slice(0, limit).map(query => ({ query, type: 'history' }))
  }

  return {
    // State
    searchQuery: readonly(searchQuery),
    searchResults: readonly(searchResults),
    searchHistory: readonly(searchHistory),
    isSearching: readonly(isSearching),
    showResults: readonly(showResults),
    highlightedIndex: readonly(highlightedIndex),

    // Methods
    search,
    clearSearch,
    clearHistory,
    addToHistory,
    navigateResults,
    getHighlightedResult,
    selectResult,
    highlightMatches,
    getSearchSuggestions,
    initializeSearch,

    // Setters
    setShowResults: (show: boolean) => { showResults.value = show },
    setHighlightedIndex: (index: number) => { highlightedIndex.value = index }
  }
}