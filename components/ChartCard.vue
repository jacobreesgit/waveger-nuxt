<template>
  <div class="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center gap-4">
      <div class="flex-shrink-0">
        <span class="text-2xl font-bold text-gray-500">#{{ song.position }}</span>
      </div>
      
      <img 
        :src="song.image" 
        :alt="`${song.name} cover`"
        class="w-16 h-16 rounded object-cover"
      />
      
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-lg truncate">{{ song.name }}</h3>
        <p class="text-gray-600 truncate">{{ song.artist }}</p>
        
        <div class="flex gap-4 text-sm text-gray-500 mt-1">
          <span>Weeks: {{ song.weeks_on_chart }}</span>
          <span>Peak: #{{ song.peak_position }}</span>
          <span v-if="song.last_week_position > 0">
            Last: #{{ song.last_week_position }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Song } from '~/types'

defineProps<{
  song: Song
}>()
</script>