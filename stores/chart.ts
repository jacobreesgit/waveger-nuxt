export const useChartStore = defineStore('chart', () => {
  // Persistent state with VueUse
  const selectedChartId = useLocalStorage('waveger-chart-id', 'hot-100')
  const selectedDate = useLocalStorage('waveger-date', new Date().toISOString().split('T')[0])
  const favorites = useLocalStorage<number[]>('waveger-favorites', [])

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

  const toggleFavorite = (position: number) => {
    const index = favorites.value.indexOf(position)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push(position)
    }
  }

  const isFavorite = (position: number) => favorites.value.includes(position)

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
    
    // Computed
    chartData,
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
    
    // Week navigation
    isCurrentWeek,
    goToPreviousWeek,
    goToNextWeek
  }
})