import { Howl } from 'howler'

export const useAudio = () => {
  const sounds = ref<Record<number, Howl>>({})
  const playingTrackId = ref<number | null>(null)
  const volume = useLocalStorage('waveger-volume', 0.8)
  const audioProgress = ref<Record<number, number>>({})

  // Check for audio support manually
  const isAudioSupported = ref(typeof window !== 'undefined' && 'Audio' in window)

  const stopCurrentAudio = () => {
    if (playingTrackId.value !== null && sounds.value[playingTrackId.value]) {
      sounds.value[playingTrackId.value].stop()
      playingTrackId.value = null
    }
  }

  const playPreview = async (previewUrl: string | null, trackId: number) => {
    if (!isAudioSupported.value || !previewUrl) return

    // Stop current audio
    if (playingTrackId.value !== null) {
      stopCurrentAudio()
      if (playingTrackId.value === trackId) return // Toggle off
    }

    try {
      // Create or reuse Howl instance
      if (!sounds.value[trackId]) {
        sounds.value[trackId] = new Howl({
          src: [previewUrl],
          html5: true,
          volume: volume.value,
          onplay: () => {
            playingTrackId.value = trackId
            audioProgress.value[trackId] = 0
            updateProgress(trackId)
          },
          onend: () => {
            audioProgress.value[trackId] = 0
            playingTrackId.value = null
          },
          onstop: () => {
            audioProgress.value[trackId] = 0
          },
          onloaderror: (id: any, error: any) => {
            console.error('Audio load error:', error)
            playingTrackId.value = null
          },
          onplayerror: (id: any, error: any) => {
            console.error('Audio playback error:', error)
            playingTrackId.value = null
          }
        })
      } else {
        sounds.value[trackId].volume(volume.value)
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

  // Update volume for all sounds when changed
  watch(volume, (newVolume) => {
    Object.values(sounds.value).forEach(sound => {
      sound.volume(newVolume)
    })
  })

  const getAudioInfo = (trackId: number) => ({
    isPlaying: playingTrackId.value === trackId,
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
    volume,
    playPreview,
    getAudioInfo,
    stopCurrentAudio,
    isAudioSupported: readonly(isAudioSupported)
  }
}