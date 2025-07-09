export const useChartStore = defineStore('chart', () => {
  // Persistent state with VueUse
  const selectedChartId = useLocalStorage('waveger-chart-id', 'hot-100')
  const selectedDate = useLocalStorage('waveger-date', new Date().toISOString().split('T')[0])
  const localFavorites = useLocalStorage<number[]>('waveger-favorites', [])
  
  // Database-backed favorites
  const { favorites: dbFavorites, loadFavorites, toggleFavorite: dbToggleFavorite, isFavorite: dbIsFavorite } = useFavorites()
  
  // Computed favorites that combines local and database favorites
  const favorites = computed(() => {
    // Combine local favorites with database favorites
    const combined = [...localFavorites.value, ...dbFavorites.value]
    return [...new Set(combined)] // Remove duplicates
  })
  
  // Load favorites when chart changes
  watchEffect(() => {
    if (selectedChartId.value) {
      loadFavorites(selectedChartId.value)
    }
  })
  
  // Filter state
  const filters = ref({
    showFavoritesOnly: false,
    showNewSongsOnly: false,
    positionRange: 'all',
    weeksRange: 'all',
    sortBy: 'position',
    sortOrder: 'asc' as 'asc' | 'desc'
  })

  // Audio management
  const { playingTrackId, selectedTrackId, playPreview, getAudioInfo, stopCurrentAudio, pauseCurrentAudio, closeNowPlaying } = useAudio()

  // Chart data with TanStack Query
  const { useChartQuery, prefetchChart } = useCharts()

  const chartQuery = useChartQuery(selectedChartId, {
    week: computed(() => selectedDate.value !== new Date().toISOString().split('T')[0] ? selectedDate.value : undefined)
  })

  // Computed properties
  const chartData = computed(() => {
    const data = chartQuery.data.value
    if (data) {
      console.log('📊 Chart data updated:', {
        title: data.title,
        songCount: data.songs?.length,
        firstSong: data.songs?.[0] ? {
          position: data.songs[0].position,
          name: data.songs[0].name,
          artist: data.songs[0].artist
        } : null
      })
    }
    return data
  })

  // Filtered songs based on current filters
  const filteredSongs = computed(() => {
    if (!chartData.value?.songs) return []
    
    let songs = [...chartData.value.songs]
    
    // Apply favorites filter
    if (filters.value.showFavoritesOnly) {
      songs = songs.filter(song => favorites.value.includes(song.position))
    }
    
    // Apply new songs filter
    if (filters.value.showNewSongsOnly) {
      songs = songs.filter(song => song.last_week_position === 0)
    }
    
    // Apply position range filter
    if (filters.value.positionRange !== 'all') {
      const [min, max] = filters.value.positionRange.split('-').map(Number)
      songs = songs.filter(song => song.position >= min && song.position <= max)
    }
    
    // Apply weeks on chart filter
    if (filters.value.weeksRange !== 'all') {
      const weeksRange = filters.value.weeksRange
      
      if (weeksRange === '1') {
        songs = songs.filter(song => song.weeks_on_chart === 1)
      } else if (weeksRange === '21+') {
        songs = songs.filter(song => song.weeks_on_chart >= 21)
      } else if (weeksRange.includes('-')) {
        const [min, max] = weeksRange.split('-').map(Number)
        songs = songs.filter(song => song.weeks_on_chart >= min && song.weeks_on_chart <= max)
      }
    }
    
    // Apply sorting
    const sortBy = filters.value.sortBy
    const sortOrder = filters.value.sortOrder
    
    songs.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'position':
          comparison = a.position - b.position
          break
        case 'alphabetical':
          comparison = a.name.localeCompare(b.name)
          break
        case 'weeks':
          comparison = a.weeks_on_chart - b.weeks_on_chart
          break
        default:
          comparison = a.position - b.position
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return songs
  })
  const isLoading = computed(() => chartQuery.isLoading.value)
  const error = computed(() => chartQuery.error.value)

  // Actions
  const changeChart = (id: string) => {
    selectedChartId.value = id
    // Clear audio state when changing charts
    stopCurrentAudio()
    closeNowPlaying()
    console.log('📊 Chart changed to:', id, '- Audio state cleared')
  }

  const setDate = (date: string) => {
    selectedDate.value = date
    // Clear audio state when changing dates
    stopCurrentAudio()
    closeNowPlaying()
    console.log('📅 Date changed to:', date, '- Audio state cleared')
  }

  const setToday = () => {
    selectedDate.value = new Date().toISOString().split('T')[0]
  }

  const toggleFavorite = async (position: number) => {
    const song = chartData.value?.songs?.find(s => s.position === position)
    if (!song) return
    
    try {
      // Toggle in database
      await dbToggleFavorite(position, selectedChartId.value, song.name, song.artist)
      
      // Also update local storage for backwards compatibility
      const index = localFavorites.value.indexOf(position)
      if (index > -1) {
        localFavorites.value.splice(index, 1)
      } else {
        localFavorites.value.push(position)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      // Fallback to local storage only
      const index = localFavorites.value.indexOf(position)
      if (index > -1) {
        localFavorites.value.splice(index, 1)
      } else {
        localFavorites.value.push(position)
      }
    }
  }

  const isFavorite = (position: number) => favorites.value.includes(position)

  // Filter actions
  const updateFilters = (newFilters: {
    showFavoritesOnly: boolean;
    showNewSongsOnly: boolean;
    positionRange: string;
    weeksRange: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) => {
    filters.value = { ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      showFavoritesOnly: false,
      showNewSongsOnly: false,
      positionRange: 'all',
      weeksRange: 'all',
      sortBy: 'position',
      sortOrder: 'asc'
    }
  }

  // Week navigation functionality
  const isCurrentWeek = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return selectedDate.value === today
  })

  const goToPreviousWeek = () => {
    const currentDate = new Date(selectedDate.value)
    currentDate.setDate(currentDate.getDate() - 7)
    const newDate = currentDate.toISOString().split('T')[0]
    selectedDate.value = newDate
    console.log('🔄 Previous week:', newDate)
  }

  const goToNextWeek = () => {
    if (!isCurrentWeek.value) {
      const currentDate = new Date(selectedDate.value)
      currentDate.setDate(currentDate.getDate() + 7)
      const newDate = currentDate.toISOString().split('T')[0]
      const today = new Date().toISOString().split('T')[0]
      
      // Don't go beyond current week
      if (newDate <= today) {
        selectedDate.value = newDate
        console.log('🔄 Next week:', newDate)
      }
    }
  }

  return {
    // State
    selectedChartId,
    selectedDate,
    favorites,
    filters,
    
    // Computed
    chartData,
    filteredSongs,
    isLoading,
    error,
    
    // Audio
    playingTrackId,
    selectedTrackId,
    playPreview,
    getAudioInfo,
    stopCurrentAudio,
    pauseCurrentAudio,
    closeNowPlaying,
    
    // Actions
    changeChart,
    setDate,
    setToday,
    toggleFavorite,
    isFavorite,
    prefetchChart,
    
    // Filter actions
    updateFilters,
    clearFilters,
    
    // Week navigation
    isCurrentWeek,
    goToPreviousWeek,
    goToNextWeek
  }
})