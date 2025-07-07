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
          :src="currentSong.image"
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
          
          <!-- Stop button -->
          <button
            @click="stopAudio"
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

// Find the currently playing song
const currentSong = computed(() => {
  if (!chartStore.playingTrackId || !chartStore.chartData?.songs) return null
  
  return chartStore.chartData.songs.find(song => 
    song.position === chartStore.playingTrackId
  )
})

// Get progress for the currently playing song
const progress = computed(() => {
  if (!chartStore.playingTrackId) return 0
  return chartStore.getAudioInfo(chartStore.playingTrackId).progress
})

const stopAudio = () => {
  chartStore.stopCurrentAudio()
}
</script>