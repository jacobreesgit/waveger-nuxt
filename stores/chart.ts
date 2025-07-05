export const useChartStore = defineStore('chart', () => {
  // Persistent state with VueUse
  const selectedChartId = useLocalStorage('waveger-chart-id', 'hot-100')
  const selectedDate = useLocalStorage('waveger-date', new Date().toISOString().split('T')[0])
  const favorites = useLocalStorage<number[]>('waveger-favorites', [])

  // Audio management
  const { playingTrackId, volume, playPreview, getAudioInfo } = useAudio()

  // Chart data with TanStack Query
  const { useChartQuery, prefetchChart } = useCharts()

  const chartQuery = useChartQuery(selectedChartId, {
    week: computed(() => selectedDate.value !== new Date().toISOString().split('T')[0] ? selectedDate.value : undefined)
  })

  // Computed properties
  const chartData = computed(() => chartQuery.data.value)
  const isLoading = computed(() => chartQuery.isLoading.value)
  const error = computed(() => chartQuery.error.value)

  // Actions
  const changeChart = (id: string) => {
    selectedChartId.value = id
  }

  const setDate = (date: string) => {
    selectedDate.value = date
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
    volume,
    playPreview,
    getAudioInfo,
    
    // Actions
    changeChart,
    setDate,
    setToday,
    toggleFavorite,
    isFavorite,
    prefetchChart
  }
})