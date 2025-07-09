<template>
  <div
    class="group p-6 bg-white rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300 ease-in-out"
    :data-song-position="song.position"
  >
    <div class="flex items-center gap-4">
      <div class="flex-shrink-0">
        <span class="text-2xl font-bold">#{{ song.position }}</span>
      </div>

      <img
        :src="song.apple_music?.artwork_url || song.image"
        :alt="`${song.name} cover`"
        class="w-16 h-16 rounded object-cover"
      >

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="font-semibold text-lg truncate">{{ song.name }}</h3>
          <!-- Position Change Indicator -->
          <span
            v-if="positionChange.show"
            class="flex items-center text-xs font-medium px-1.5 py-0.5 rounded"
            :class="positionChange.colorClass"
          >
            <Icon :name="positionChange.icon" class="w-3 h-3 mr-0.5" />
            {{ positionChange.text }}
          </span>
        </div>
        <p class="truncate">{{ song.artist }}</p>

        <div class="flex gap-4 text-sm mt-1">
          <span>Weeks: {{ song.weeks_on_chart }}</span>
          <span>Peak: #{{ song.peak_position }}</span>
          <span v-if="song.last_week_position > 0">
            Last: #{{ song.last_week_position }}
          </span>
        </div>
      </div>

      <!-- Controls Container -->
      <div class="flex-shrink-0 flex items-center gap-3">
        <!-- Favorite Button -->
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer group-hover:text-white"
          :class="
            isFavorite
              ? 'text-red-500 hover:text-red-600 group-hover:text-red-400 group-hover:hover:text-red-300'
              : 'text-gray-400 hover:text-gray-600 group-hover:text-white group-hover:hover:text-gray-300'
          "
          :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
          @click="toggleFavorite"
        >
          <Icon
            :name="
              isFavorite
                ? 'heroicons:heart-20-solid'
                : 'heroicons:heart-20-solid'
            "
            class="w-5 h-5"
          />
        </button>

        <!-- Audio Preview Controls -->
        <div v-if="song.apple_music?.preview_url" class="flex items-center">
          <!-- Play/Pause Button -->
          <button
            class="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-400"
            :class="
              audioInfo.isSupported ? 'cursor-pointer' : 'cursor-not-allowed'
            "
            :disabled="!audioInfo.isSupported"
            :title="audioInfo.isPlaying ? 'Pause preview' : 'Play preview'"
            @click="handlePlayToggle"
          >
            <Icon
              :name="
                audioInfo.isPlaying
                  ? 'heroicons:pause-20-solid'
                  : 'heroicons:play-20-solid'
              "
              class="w-5 h-5"
            />
          </button>
        </div>

        <!-- No Preview Available -->
        <div v-else class="text-sm">No Preview</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Song } from "~/types";

const props = defineProps<{
  song: Song;
}>();

// Get chart store for audio functionality
const chartStore = useChartStore();

// Get audio info for this specific song
const audioInfo = computed(() => chartStore.getAudioInfo(props.song.position));

// Favorites functionality
const isFavorite = computed(() => chartStore.isFavorite(props.song.position));

// Position change calculation
const positionChange = computed(() => {
  const current = props.song.position;
  const lastWeek = props.song.last_week_position;

  // New song (no previous position)
  if (lastWeek === 0) {
    return {
      show: true,
      icon: "heroicons:star-20-solid",
      text: "NEW",
      colorClass: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    };
  }

  // Position went up (lower number = higher rank)
  if (lastWeek > current) {
    const change = lastWeek - current;
    return {
      show: true,
      icon: "heroicons:arrow-up-20-solid",
      text: `${change}`,
      colorClass: "bg-green-100 text-green-800 hover:bg-green-200",
    };
  }

  // Position went down (higher number = lower rank)
  if (lastWeek < current) {
    const change = current - lastWeek;
    return {
      show: true,
      icon: "heroicons:arrow-down-20-solid",
      text: `${change}`,
      colorClass: "bg-red-100 text-red-800 hover:bg-red-200",
    };
  }

  // No change - don't show indicator
  return {
    show: false,
    icon: "",
    text: "",
    colorClass: "",
  };
});

// Handle play/pause toggle
const handlePlayToggle = () => {
  if (props.song.apple_music?.preview_url) {
    console.log("🎵 Play button clicked for song:", {
      position: props.song.position,
      name: props.song.name,
      artist: props.song.artist,
    });
    chartStore.playPreview(
      props.song.apple_music.preview_url,
      props.song.position
    );
  }
};

// Handle favorite toggle
const toggleFavorite = () => {
  chartStore.toggleFavorite(props.song.position);
};
</script>
