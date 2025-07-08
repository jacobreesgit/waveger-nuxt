<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Debug Now Playing</h1>
    
    <div class="bg-yellow-50 p-4 rounded-lg mb-4">
      <h2 class="font-semibold mb-2">Audio State:</h2>
      <div class="space-y-1 text-sm">
        <div>Selected Track ID: {{ chartStore.selectedTrackId }}</div>
        <div>Playing Track ID: {{ chartStore.playingTrackId }}</div>
        <div>Chart Title: {{ chartStore.chartData?.title }}</div>
        <div>Total Songs: {{ chartStore.chartData?.songs?.length }}</div>
      </div>
    </div>
    
    <div class="bg-blue-50 p-4 rounded-lg mb-4">
      <h2 class="font-semibold mb-2">First Few Songs:</h2>
      <div v-for="song in chartStore.chartData?.songs?.slice(0, 5)" :key="song.position" class="text-sm">
        Position {{ song.position }}: {{ song.name }} by {{ song.artist }}
      </div>
    </div>
    
    <div class="bg-green-50 p-4 rounded-lg mb-4">
      <h2 class="font-semibold mb-2">Now Playing Lookup:</h2>
      <div class="text-sm">
        <div v-if="currentSong">
          Found: {{ currentSong.name }} by {{ currentSong.artist }} (Position {{ currentSong.position }})
        </div>
        <div v-else class="text-red-600">
          No song found for selectedTrackId: {{ chartStore.selectedTrackId }}
        </div>
      </div>
    </div>
    
    <div class="space-y-2">
      <button 
        @click="testSong1" 
        class="bg-blue-500 text-white px-4 py-2 rounded mr-2"
      >
        Test Song 1
      </button>
      <button 
        @click="testSong2" 
        class="bg-green-500 text-white px-4 py-2 rounded mr-2"
      >
        Test Song 2
      </button>
      <button 
        @click="clearAudio" 
        class="bg-red-500 text-white px-4 py-2 rounded"
      >
        Clear Audio
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const chartStore = useChartStore()

// Same logic as NowPlaying.vue
const currentSong = computed(() => {
  if (!chartStore.selectedTrackId || !chartStore.chartData?.songs) return null
  
  return chartStore.chartData.songs.find(song => 
    song.position === chartStore.selectedTrackId
  )
})

const testSong1 = () => {
  const song = chartStore.chartData?.songs?.[0]
  if (song?.apple_music?.preview_url) {
    chartStore.playPreview(song.apple_music.preview_url, song.position)
  }
}

const testSong2 = () => {
  const song = chartStore.chartData?.songs?.[1]
  if (song?.apple_music?.preview_url) {
    chartStore.playPreview(song.apple_music.preview_url, song.position)
  }
}

const clearAudio = () => {
  chartStore.closeNowPlaying()
}
</script>