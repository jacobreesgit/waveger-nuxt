import { ref, computed } from 'vue'

export const useFavorites = () => {
  const favorites = ref<number[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load favorites for a specific chart
   */
  const loadFavorites = async (chartId: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      const { positions } = await $fetch<{ positions: number[] }>('/api/favorites', {
        query: { chartId }
      })
      
      favorites.value = positions || []
    } catch (err) {
      error.value = 'Failed to load favorites'
      console.error('Error loading favorites:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Toggle favorite status for a song
   */
  const toggleFavorite = async (
    position: number,
    chartId: string,
    songName: string,
    artistName: string
  ) => {
    const isCurrentlyFavorited = favorites.value.includes(position)
    const action = isCurrentlyFavorited ? 'remove' : 'add'
    
    try {
      await $fetch('/api/favorites', {
        method: 'POST',
        body: {
          action,
          chartId,
          songPosition: position,
          songName,
          artistName
        }
      })
      
      // Update local state
      if (action === 'add') {
        favorites.value.push(position)
      } else {
        const index = favorites.value.indexOf(position)
        if (index > -1) {
          favorites.value.splice(index, 1)
        }
      }
    } catch (err) {
      error.value = 'Failed to update favorite'
      console.error('Error toggling favorite:', err)
    }
  }

  /**
   * Check if a song is favorited
   */
  const isFavorite = (position: number) => {
    return favorites.value.includes(position)
  }

  /**
   * Get all favorite positions
   */
  const getFavoritePositions = computed(() => {
    return favorites.value
  })

  return {
    favorites: readonly(favorites),
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadFavorites,
    toggleFavorite,
    isFavorite,
    getFavoritePositions
  }
}