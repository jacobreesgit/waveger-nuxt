<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-full"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-full"
  >
    <div
      v-if="currentSong"
      class="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
    >
      <div class="flex items-center gap-4">
        <img
          :src="currentSong.apple_music?.artwork_url || currentSong.image"
          :alt="`${currentSong.name} cover`"
          class="w-12 h-12 rounded object-cover"
        />
        
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold truncate">{{ currentSong.name }}</h4>
          <p class="text-sm text-gray-600 truncate">{{ currentSong.artist }}</p>
        </div>
        
        <div class="flex items-center gap-2">
          <!-- Progress indicator -->
          <div class="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-600 transition-all duration-100"
              :style="{ width: `${progress * 100}%` }"
            />
          </div>
          
          <!-- Close button -->
          <button
            @click="closeNowPlaying"
            class="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Icon name="heroicons:x-mark-20-solid" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const chartStore = useChartStore()

// Find the currently selected song (for Now Playing bar)
const currentSong = computed(() => {
  if (!chartStore.selectedTrackId || !chartStore.chartData?.songs) return null
  
  console.log('🔍 Now Playing Debug:', {
    selectedTrackId: chartStore.selectedTrackId,
    totalSongs: chartStore.chartData?.songs?.length,
    songPositions: chartStore.chartData?.songs?.map(s => s.position),
    chartTitle: chartStore.chartData?.title
  })
  
  const foundSong = chartStore.chartData.songs.find(song => 
    song.position === chartStore.selectedTrackId
  )
  
  console.log('🎵 Found song:', foundSong ? {
    position: foundSong.position,
    name: foundSong.name,
    artist: foundSong.artist
  } : 'NOT FOUND')
  
  return foundSong
})

// Get progress for the currently selected song
const progress = computed(() => {
  if (!chartStore.selectedTrackId) return 0
  return chartStore.getAudioInfo(chartStore.selectedTrackId).progress
})

const closeNowPlaying = () => {
  chartStore.closeNowPlaying()
}
</script>