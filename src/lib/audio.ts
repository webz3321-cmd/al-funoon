export const DEFAULT_THEME_SONG_URL = '/assets/aistudio/__________2__73a6848a.mp3'

// Audio controller for Al Funoon Fest official theme song. Plays strictly real audio (no synthesized beeps).
export class ThemeSong {
  private audioElement: HTMLAudioElement | null = null
  private onStateChange?: (playing: boolean) => void

  constructor(onStateChange?: (playing: boolean) => void) {
    this.onStateChange = onStateChange
  }

  playing(): boolean {
    return this.audioElement !== null && !this.audioElement.paused
  }

  start(audioUrl?: string) {
    if (this.playing()) return
    const url = audioUrl && audioUrl.trim() ? audioUrl.trim() : DEFAULT_THEME_SONG_URL

    try {
      if (this.audioElement) {
        this.stop()
      }
      const audio = new Audio()
      audio.setAttribute('playsinline', 'true')
      ;(audio as unknown as { playsInline?: boolean }).playsInline = true
      audio.crossOrigin = 'anonymous'
      audio.preload = 'auto'
      audio.loop = true
      audio.src = url
      this.audioElement = audio

      audio.onended = () => {
        this.stop()
      }

      audio.onerror = (e) => {
        console.warn('Theme song failed to load from primary path:', url, e)
        if (url !== '/audio/theme-song.mp3') {
          // Fallback to secondary copied path
          audio.src = '/audio/theme-song.mp3'
          audio
            .play()
            .then(() => this.onStateChange?.(true))
            .catch(() => this.stop())
        } else {
          this.stop()
        }
      }

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.onStateChange?.(true)
          })
          .catch((err) => {
            console.warn('Playback interrupted or prevented by browser:', err)
            this.stop()
          })
      }
    } catch (err) {
      console.warn('Audio element error:', err)
      this.stop()
    }
  }

  stop() {
    if (this.audioElement) {
      try {
        this.audioElement.pause()
        this.audioElement.currentTime = 0
      } catch {
        // ignore
      }
      this.audioElement = null
    }
    this.onStateChange?.(false)
  }
}
