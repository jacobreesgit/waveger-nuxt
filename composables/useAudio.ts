import { Howl } from 'howler'

export const useAudio = () => {
  const sounds = ref<Record<number, Howl>>({})
  const playingTrackId = ref<number | null>(null)
  const lastPlayedTrackId = ref<number | null>(null)
  const selectedTrackId = ref<number | null>(null) // Track shown in Now Playing bar
  const volume = ref(1.0) // Always 100% volume
  const audioProgress = ref<Record<number, number>>({})

  // Check for audio support manually
  const isAudioSupported = ref(typeof window !== 'undefined' && 'Audio' in window)

  const pauseCurrentAudio = () => {
    if (playingTrackId.value !== null && sounds.value[playingTrackId.value]) {
      const currentTrackId = playingTrackId.value
      sounds.value[currentTrackId].pause()
      // Don't reset progress when pausing - keep current position
      lastPlayedTrackId.value = currentTrackId
      playingTrackId.value = null
      // Keep selected track for Now Playing bar
      selectedTrackId.value = currentTrackId
      console.log('⏸️ Paused audio, selectedTrackId kept as:', currentTrackId)
    }
  }

  const stopCurrentAudio = () => {
    if (playingTrackId.value !== null && sounds.value[playingTrackId.value]) {
      const currentTrackId = playingTrackId.value
      sounds.value[currentTrackId].stop()
      audioProgress.value[currentTrackId] = 0
      lastPlayedTrackId.value = null // Clear last played when stopping completely
      playingTrackId.value = null
    }
  }

  const closeNowPlaying = () => {
    // Close Now Playing bar completely
    selectedTrackId.value = null
    if (playingTrackId.value !== null) {
      stopCurrentAudio()
    }
  }

  const playPreview = async (previewUrl: string | null, trackId: number) => {
    if (!isAudioSupported.value || !previewUrl) return

    console.log('playPreview called:', { trackId, currentlyPlaying: playingTrackId.value })

    // Check if this track is currently playing - if so, pause it
    if (playingTrackId.value === trackId) {
      console.log('Pausing currently playing track:', trackId)
      pauseCurrentAudio()
      return // Toggle off
    }

    // Stop any other currently playing audio
    if (playingTrackId.value !== null) {
      console.log('Stopping other track:', playingTrackId.value)
      stopCurrentAudio()
    }

    try {
      // Create or reuse Howl instance
      if (!sounds.value[trackId]) {
        console.log('Creating new Howl instance for track:', trackId)
        sounds.value[trackId] = new Howl({
          src: [previewUrl],
          html5: true,
          volume: volume.value,
          onplay: () => {
            console.log('Howl onplay fired for track:', trackId)
            playingTrackId.value = trackId
            lastPlayedTrackId.value = trackId
            selectedTrackId.value = trackId // Show in Now Playing bar
            console.log('🎯 selectedTrackId set to:', trackId)
            audioProgress.value[trackId] = 0
            updateProgress(trackId)
          },
          onend: () => {
            console.log('Howl onend fired for track:', trackId)
            audioProgress.value[trackId] = 0
            playingTrackId.value = null
          },
          onstop: () => {
            console.log('Howl onstop fired for track:', trackId)
            audioProgress.value[trackId] = 0
          },
          onloaderror: (id: number, error: unknown) => {
            console.error('Audio load error:', error)
            playingTrackId.value = null
          },
          onplayerror: (id: number, error: unknown) => {
            console.error('Audio playback error:', error)
            playingTrackId.value = null
          }
        })
      } else {
        console.log('Reusing existing Howl instance for track:', trackId)
        sounds.value[trackId].volume(volume.value)
      }

      console.log('Starting playback for track:', trackId)
      // Check if the sound is paused and resume, or start fresh
      if (sounds.value[trackId].playing()) {
        console.log('Sound is already playing, stopping first')
        sounds.value[trackId].stop()
      }
      
      sounds.value[trackId].play()
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const updateProgress = (trackId: number) => {
    const updateLoop = () => {
      if (playingTrackId.value === trackId && sounds.value[trackId]) {
        const progress = sounds.value[trackId].seek() / sounds.value[trackId].duration()
        audioProgress.value[trackId] = progress
        
        if (progress < 1 && playingTrackId.value === trackId) {
          requestAnimationFrame(updateLoop)
        }
      }
    }
    requestAnimationFrame(updateLoop)
  }

  // Volume is fixed at 100% - no need to watch for changes

  const getAudioInfo = (trackId: number) => ({
    isPlaying: playingTrackId.value === trackId,
    isLastPlayed: lastPlayedTrackId.value === trackId,
    progress: audioProgress.value[trackId] || 0,
    isSupported: isAudioSupported.value
  })

  // Cleanup on unmount
  onUnmounted(() => {
    Object.values(sounds.value).forEach(sound => {
      sound.stop()
      sound.unload()
    })
  })

  return {
    playingTrackId: readonly(playingTrackId),
    selectedTrackId: readonly(selectedTrackId),
    playPreview,
    getAudioInfo,
    stopCurrentAudio,
    pauseCurrentAudio,
    closeNowPlaying,
    isAudioSupported: readonly(isAudioSupported)
  }
}