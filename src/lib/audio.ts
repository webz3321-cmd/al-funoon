// WebAudio synth melody + custom MP3 audio support.
const NOTES: [number, number][] = [
  [523.25, 1], [659.25, 1], [783.99, 1], [659.25, 1],
  [587.33, 1], [698.46, 1], [880.0, 2],
  [783.99, 1], [698.46, 1], [659.25, 1], [587.33, 1], [523.25, 2],
]

export class ThemeSong {
  private ctx: AudioContext | null = null
  private timer: number | null = null
  private step = 0
  private gain: GainNode | null = null
  private audioElement: HTMLAudioElement | null = null

  playing(): boolean {
    return this.timer !== null || (this.audioElement !== null && !this.audioElement.paused)
  }

  start(audioUrl?: string) {
    if (this.playing()) return

    if (audioUrl && audioUrl.trim()) {
      this.audioElement = new Audio(audioUrl.trim())
      this.audioElement.loop = true
      this.audioElement.play().catch(() => {
        // Fallback to synth melody if custom audio playback fails
        this.startSynth()
      })
      return
    }

    this.startSynth()
  }

  private startSynth() {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    this.ctx = this.ctx ?? new AC()
    void this.ctx.resume()
    this.gain = this.ctx.createGain()
    this.gain.gain.value = 0.12
    this.gain.connect(this.ctx.destination)
    this.step = 0
    const beatMs = 300
    const playStep = () => {
      if (!this.ctx || !this.gain) return
      const [freq, beats] = NOTES[this.step % NOTES.length]
      const osc = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t = this.ctx.currentTime
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + beats * (beatMs / 1000) * 0.9)
      osc.connect(g)
      g.connect(this.gain)
      osc.start(t)
      osc.stop(t + beats * (beatMs / 1000))
      this.step += 1
    }
    playStep()
    this.timer = window.setInterval(playStep, beatMs)
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
      this.audioElement = null
    }
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
  }
}
