import { useEffect, useMemo, useRef, useState } from 'react'

type Shot = 'goal' | 'saved' | 'miss'
const SHOTS = 5

// Goal mouth boundaries in pitch percentage coordinates
const GOAL_LEFT = 14
const GOAL_RIGHT = 86
const GOAL_TOP = 13
const GOAL_BOTTOM = 55

function keeperRead(level: number): number {
  return Math.min(0.84, 0.38 + (level - 1) * 0.115)
}

let sharedAudioCtx: AudioContext | null = null

/** Synthesize crisp WebAudio football kick, save thud, whistle, and goal cheer using a single shared AudioContext. */
function playSfx(type: 'kick' | 'goal' | 'save' | 'miss') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx()
    }
    const ctx = sharedAudioCtx
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined)
    }
    const now = ctx.currentTime

    if (type === 'kick') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(160, now)
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.12)
      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.14)
    } else if (type === 'goal') {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + i * 0.07)
        gain.gain.setValueAtTime(0.18, now + i * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now + i * 0.07)
        osc.stop(now + i * 0.07 + 0.3)
      })
    } else if (type === 'save') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(240, now)
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.14)
      gain.gain.setValueAtTime(0.14, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.17)
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.linearRampToValueAtTime(140, now + 0.25)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.27)
    }
  } catch {
    // ignore audio restrictions
  }
}

/** Illustrated cyclist riding along the sweeping tracks on the WE'RE MAKING IT intro screen. */
function Cyclist({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 64" className={className} aria-hidden>
      <circle cx="20" cy="46" r="13" fill="none" stroke="#4f46e5" strokeWidth="3.5" />
      <circle cx="20" cy="46" r="3" fill="#ec4899" />
      <circle cx="68" cy="46" r="13" fill="none" stroke="#4f46e5" strokeWidth="3.5" />
      <circle cx="68" cy="46" r="3" fill="#ec4899" />
      <path d="M20 46 L40 28 L60 28 L68 46 M40 28 L46 46 L20 46" fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="60" y1="28" x2="64" y2="21" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 28 L48 38 L42 46" fill="none" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 16 L46 28" stroke="#84cc16" strokeWidth="8" strokeLinecap="round" />
      <path d="M38 18 L58 24" stroke="#8d5524" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="34" cy="11" r="6" fill="#8d5524" />
      <path d="M28 10 C29 4 39 4 40 10 Z" fill="#1e1b18" />
    </svg>
  )
}

/** Illustrated SVG goalkeeper with dynamic eye tracking, raised/diving arms, gold gloves, and mood reactions. */
function GoalkeeperSvg({
  mood,
  lookX,
  lookY,
  diving,
}: {
  mood: 'ready' | 'saved' | 'sad'
  lookX: number
  lookY: number
  diving: boolean
}) {
  // Arms stretch higher/wider when diving or celebrating a save, droop slightly when beaten
  const armLeft = mood === 'saved' ? { x: 20, y: 26 } : mood === 'sad' ? { x: 34, y: 82 } : diving ? { x: 18, y: 34 } : { x: 26, y: 42 }
  const armRight = mood === 'saved' ? { x: 160, y: 26 } : mood === 'sad' ? { x: 146, y: 82 } : diving ? { x: 162, y: 34 } : { x: 154, y: 42 }

  return (
    <svg viewBox="0 0 180 145" className="w-36 drop-shadow-lg sm:w-44" aria-label="Goalkeeper">
      {/* navy sleeves / arms */}
      <line x1="62" y1="62" x2={armLeft.x} y2={armLeft.y} stroke="#173a7a" strokeWidth="13" strokeLinecap="round" />
      <line x1="118" y1="62" x2={armRight.x} y2={armRight.y} stroke="#173a7a" strokeWidth="13" strokeLinecap="round" />

      {/* big round gold gloves */}
      <g transform={`translate(${armLeft.x - 6}, ${armLeft.y - 2})`}>
        <circle cx="0" cy="0" r="16" fill="#d97706" />
        <circle cx="0" cy="0" r="12" fill="#f59e0b" />
        <circle cx="0" cy="0" r="7.5" fill="#fde68a" />
      </g>
      <g transform={`translate(${armRight.x + 6}, ${armRight.y - 2})`}>
        <circle cx="0" cy="0" r="16" fill="#d97706" />
        <circle cx="0" cy="0" r="12" fill="#f59e0b" />
        <circle cx="0" cy="0" r="7.5" fill="#fde68a" />
      </g>

      {/* legs + white socks with orange bands + black boots */}
      <line x1="76" y1="104" x2="70" y2="128" stroke="#966133" strokeWidth="11" strokeLinecap="round" />
      <line x1="104" y1="104" x2="110" y2="128" stroke="#966133" strokeWidth="11" strokeLinecap="round" />
      <rect x="64" y="114" width="12" height="16" rx="3" fill="#ffffff" />
      <rect x="64" y="118" width="12" height="3.5" fill="#e65324" />
      <rect x="104" y="114" width="12" height="16" rx="3" fill="#ffffff" />
      <rect x="104" y="118" width="12" height="3.5" fill="#e65324" />
      <ellipse cx="66" cy="131" rx="10" ry="5" fill="#1e1b18" />
      <ellipse cx="114" cy="131" rx="10" ry="5" fill="#1e1b18" />

      {/* navy shorts */}
      <path d="M68 92 L112 92 L116 112 L64 112 Z" fill="#173a7a" />

      {/* orange #1 jersey */}
      <path d="M68 54 L112 54 L114 94 L66 94 Z" fill="#e65324" />
      <text x="90" y="83" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="bold" fontFamily="sans-serif">
        1
      </text>

      {/* head + black hair + yellow headband */}
      <circle cx="90" cy="36" r="18" fill="#966133" />
      <path d="M72 33 C73 16 107 16 108 33 Z" fill="#1e1b18" />
      <rect x="72" y="27" width="36" height="5" rx="2.5" fill="#fde047" />

      {/* tracking eyes */}
      <circle cx="83" cy="36" r="3.4" fill="#ffffff" />
      <circle cx="97" cy="36" r="3.4" fill="#ffffff" />
      <circle cx={83 + lookX} cy={36 + lookY} r="1.7" fill="#1e1b18" />
      <circle cx={97 + lookX} cy={36 + lookY} r="1.7" fill="#1e1b18" />

      {/* mouth expression */}
      {mood === 'sad' ? (
        <path d="M83 47 Q90 41 97 47" fill="none" stroke="#1e1b18" strokeWidth="2.5" strokeLinecap="round" />
      ) : mood === 'saved' ? (
        <ellipse cx="90" cy="45" rx="5" ry="4" fill="#1e1b18" />
      ) : (
        <path d="M83 43 Q90 49 97 43" fill="none" stroke="#1e1b18" strokeWidth="2.4" strokeLinecap="round" />
      )}
    </svg>
  )
}

/** Classic black-and-white pentagonal football icon. */
function PenaltyBall({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="29" fill="#ffffff" stroke="#1e293b" strokeWidth="3.5" />
      <polygon points="32,20 43,28 39,41 25,41 21,28" fill="#1e293b" />
      <circle cx="32" cy="11" r="3.5" fill="#1e293b" />
      <circle cx="13" cy="24" r="3.5" fill="#1e293b" />
      <circle cx="51" cy="24" r="3.5" fill="#1e293b" />
      <circle cx="19" cy="49" r="3.5" fill="#1e293b" />
      <circle cx="45" cy="49" r="3.5" fill="#1e293b" />
    </svg>
  )
}

export default function PenaltyGame({ onHome }: { onHome?: () => void }) {
  const [started, setStarted] = useState(false)
  const [shots, setShots] = useState<Shot[]>([])
  const [goals, setGoals] = useState(0)
  const [soundOn, setSoundOn] = useState(true)

  // Ball position & spin in pitch % coordinates
  const [ballState, setBallState] = useState<{ x: number; y: number; scale: number; spin: number }>({
    x: 50,
    y: 84,
    scale: 1,
    spin: 0,
  })

  // Keeper live position (idle patrol + active dive)
  const [patrolX, setPatrolX] = useState(50)
  const [keeper, setKeeper] = useState<{
    x: number
    y: number
    rot: number
    saved: boolean
    mood: 'ready' | 'saved' | 'sad'
    diving: boolean
  }>({
    x: 50,
    y: 38,
    rot: 0,
    saved: false,
    mood: 'ready',
    diving: false,
  })

  const [netShake, setNetShake] = useState(false)
  const [message, setMessage] = useState('')
  const [aimTarget, setAimTarget] = useState<{ x: number; y: number } | null>(null)
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null)

  const pitchRef = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false)
  const [shooting, setShooting] = useState(false)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
  }

  useEffect(() => () => clearTimers(), [])

  const level = Math.min(5, goals + 1)
  const finished = shots.length >= SHOTS

  // Smooth idle keeper patrol swaying left-right along the goal line
  useEffect(() => {
    if (!started || finished) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      if (!busyRef.current) {
        const speed = 1.4 + level * 0.38
        const amp = 8 + level * 2.4
        const offset = Math.sin(((now - t0) / 1000) * speed) * amp
        setPatrolX(50 + offset)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, finished, level])

  // Convert pointer event into a clear target coordinate (supports both direct aim AND slingshot pull-back from the ball!)
  const computeAimFromPointer = (clientX: number, clientY: number, origin: { x: number; y: number } | null) => {
    if (!pitchRef.current) return { x: 50, y: 34 }
    const rect = pitchRef.current.getBoundingClientRect()
    const px = ((clientX - rect.left) / rect.width) * 100
    const py = ((clientY - rect.top) / rect.height) * 100

    // If pointer started near the ball at the bottom and pulled downward (slingshot)
    if (origin && origin.y > 62 && py > origin.y + 4) {
      const dx = px - origin.x
      const dy = py - origin.y
      const targetX = Math.max(8, Math.min(92, 50 - dx * 1.45))
      const targetY = Math.max(8, Math.min(56, 52 - dy * 1.55))
      return { x: targetX, y: targetY }
    }

    // Direct aim anywhere on the pitch/goal
    return {
      x: Math.max(8, Math.min(92, px)),
      y: Math.max(8, Math.min(60, py)),
    }
  }

  const executeShot = (targetX: number, targetY: number) => {
    if (!started || finished || busyRef.current) return
    clearTimers()
    busyRef.current = true
    setShooting(true)
    setMessage('')
    if (soundOn) playSfx('kick')

    // Launch ball toward target
    setBallState({ x: targetX, y: targetY, scale: 0.56, spin: (targetX - 50) * 10 + 360 })

    // Keeper AI decision (reads shot based on level, optional feint from Lv 2)
    const reads = Math.random() < keeperRead(level)
    const zone: 'left' | 'right' | 'centre' = targetX < 38 ? 'left' : targetX > 62 ? 'right' : 'centre'
    const feint = level >= 2 && Math.random() < 0.25

    const chooseDive = (): { x: number; y: number; rot: number } => {
      const diveSide = reads
        ? zone
        : (['left', 'right', 'centre'] as const)[Math.floor(Math.random() * 3)]
      const diveX = diveSide === 'left' ? 26 : diveSide === 'right' ? 74 : 50
      const diveY = reads ? Math.max(22, Math.min(44, targetY)) : targetY < 28 ? 26 : 38
      const rot = diveSide === 'left' ? -38 : diveSide === 'right' ? 38 : 0
      return { x: diveX, y: diveY, rot }
    }

    const finalDive = chooseDive()

    // Optional Lv 2+ quick fake step before diving
    if (feint) {
      const fakeX = zone === 'left' ? 60 : 40
      setKeeper({ x: fakeX, y: 38, rot: zone === 'left' ? 14 : -14, saved: false, mood: 'ready', diving: true })
    }

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms)
      timersRef.current.push(id)
    }

    const reactionDelay = Math.max(55, 165 - (level - 1) * 26)
    schedule(() => {
      setKeeper({
        x: finalDive.x,
        y: finalDive.y,
        rot: finalDive.rot,
        saved: false,
        mood: 'ready',
        diving: true,
      })

      // Check goal bounds & 2D glove reach collision
      const inGoal =
        targetX >= GOAL_LEFT + 1.5 &&
        targetX <= GOAL_RIGHT - 1.5 &&
        targetY >= GOAL_TOP + 1.5 &&
        targetY <= GOAL_BOTTOM - 1.5

      const dx = targetX - finalDive.x
      const dy = targetY - finalDive.y
      const dist = Math.hypot(dx * 0.9, dy * 1.15)
      const gloveReach = 13.5 + level * 1.6
      const saved = inGoal && dist < gloveReach

      schedule(() => {
        if (!inGoal) {
          if (soundOn) playSfx('miss')
          setShots((s) => [...s, 'miss'])
          setMessage(targetY < GOAL_TOP ? 'OVER THE BAR!' : 'OFF TARGET!')
          // Ball rebounds past goal
          setBallState((b) => ({ ...b, y: Math.max(3, b.y - 10), scale: 0.45 }))
        } else if (saved) {
          if (soundOn) playSfx('save')
          setKeeper((k) => ({ ...k, saved: true, mood: 'saved' }))
          setShots((s) => [...s, 'saved'])
          setMessage('SAVED! What a keeper!')
          // Ball deflects off the keeper's gold gloves
          const bounceX = Math.max(8, Math.min(92, targetX + (targetX < finalDive.x ? -16 : 16)))
          setBallState({ x: bounceX, y: 66, scale: 0.78, spin: 720 })
        } else {
          if (soundOn) playSfx('goal')
          setNetShake(true)
          setKeeper((k) => ({ ...k, mood: 'sad' }))
          setShots((s) => [...s, 'goal'])
          setGoals((g) => g + 1)
          setMessage('GOAL!!')
          schedule(() => setNetShake(false), 550)
        }

        schedule(() => {
          setBallState({ x: 50, y: 84, scale: 1, spin: 0 })
          setKeeper({ x: 50, y: 38, rot: 0, saved: false, mood: 'ready', diving: false })
          setAimTarget(null)
          busyRef.current = false
          setShooting(false)
        }, 1150)
      }, 240)
    }, reactionDelay)
  }

  const reset = () => {
    clearTimers()
    busyRef.current = false
    setShooting(false)
    setNetShake(false)
    setShots([])
    setGoals(0)
    setMessage('')
    setAimTarget(null)
    setDragOrigin(null)
    setBallState({ x: 50, y: 84, scale: 1, spin: 0 })
    setKeeper({ x: 50, y: 38, rot: 0, saved: false, mood: 'ready', diving: false })
    setStarted(true)
  }

  const hint = useMemo(() => {
    if (finished) return ''
    return level >= 4
      ? 'Keeper Lv ' + level + ' is lightning fast — aim for the top corners!'
      : level >= 2
        ? `Keeper Lv ${level} — he watches your aim & feints. Place it sharp!`
        : 'Drag from the ball (or tap inside the goal) to shoot!'
  }, [level, finished])

  // Eye pupil offset follows aim target or patrolling direction
  const activeKeeperX = keeper.diving ? keeper.x : patrolX
  const lookSourceX = aimTarget ? aimTarget.x : ballState.x
  const lookSourceY = aimTarget ? aimTarget.y : ballState.y
  const lookX = Math.max(-1.4, Math.min(1.4, (lookSourceX - activeKeeperX) * 0.04))
  const lookY = Math.max(-1.2, Math.min(1.2, (lookSourceY - keeper.y) * 0.03))

  // Intro screen: Full-screen burnt-orange "WE'RE MAKING IT" with sweeping tracks & cyclists
  if (!started) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#e85a24] px-4 text-center text-white select-none">
        {onHome && (
          <button
            onClick={onHome}
            className="fixed left-3 top-4 z-40 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-lg transition-transform hover:scale-105"
          >
            ← Home
          </button>
        )}

        <svg viewBox="0 0 1440 800" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <ellipse cx="720" cy="400" rx="640" ry="520" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
          <path d="M-40 210 Q 540 340 1480 -20" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
          <path d="M-40 690 Q 720 560 1480 790" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
        </svg>

        <div className="anim-cloud pointer-events-none absolute left-[8%] top-[20%] w-16 sm:w-20"><Cyclist className="w-full" /></div>
        <div className="anim-cloud pointer-events-none absolute right-[8%] top-[7%] w-12 sm:w-16" style={{ animationDelay: '0.8s' }}><Cyclist className="w-full" /></div>
        <div className="anim-cloud pointer-events-none absolute right-[2%] top-[44%] w-14 sm:w-20" style={{ animationDelay: '1.4s' }}><Cyclist className="w-full" /></div>
        <div className="anim-cloud pointer-events-none absolute bottom-[12%] left-[2%] w-14 opacity-90 sm:w-16" style={{ animationDelay: '0.4s' }}><Cyclist className="w-full" /></div>

        <span className="anim-sparkle pointer-events-none absolute left-[14%] bottom-[34%] text-base text-amber-200/70">✦</span>
        <span className="anim-sparkle pointer-events-none absolute right-[31%] bottom-[22%] text-xl text-[#fde047]" style={{ animationDelay: '.9s' }}>✦</span>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <span className="anim-sparkle absolute -left-2 -top-2 text-lg text-white">✦</span>
            <p className="font-hand -rotate-2 text-5xl font-bold italic text-[#fcd34d] drop-shadow sm:text-7xl">
              WE&apos;RE
            </p>
          </div>
          <h1 className="font-hand -mt-2 -rotate-1 text-6xl font-bold italic tracking-tight text-white drop-shadow-md sm:text-8xl md:text-9xl">
            MAKING IT
          </h1>
          <p className="mt-4 max-w-md font-hand text-2xl italic leading-snug text-white/95 sm:text-3xl">
            the results are still cooking — take five shots at the keeper while you wait!
          </p>
          <button
            onClick={() => setStarted(true)}
            className="mt-7 rounded-full bg-[#fbc531] px-10 py-3 font-hand text-3xl font-bold italic text-white shadow-xl transition-transform hover:scale-105 hover:bg-[#f5b91a]"
          >
            Play Now
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdf6e3] pb-16 pt-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
        {onHome ? (
          <button onClick={onHome} className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow hover:bg-slate-50">
            ← Home
          </button>
        ) : (
          <span className="w-20" />
        )}
        <h1 className="font-serif text-3xl font-bold text-slate-900 md:text-4xl">Results</h1>
        <button
          onClick={() => setSoundOn((s) => !s)}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow hover:bg-slate-50"
          aria-label="Toggle game sound"
        >
          {soundOn ? '🔊 Sound' : '🔇 Muted'}
        </button>
      </div>

      <div className="mx-auto mt-4 max-w-3xl px-4">
        {/* Live Scoreboard */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: SHOTS }).map((_, i) => (
            <span
              key={i}
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-transform ${
                shots[i] === 'goal'
                  ? 'scale-105 border-green-500 bg-green-100 text-green-700'
                  : shots[i] === 'saved'
                    ? 'border-amber-500 bg-amber-100 text-amber-700'
                    : shots[i] === 'miss'
                      ? 'border-red-400 bg-red-100 text-red-600'
                      : 'border-slate-300 bg-white text-slate-400'
              }`}
            >
              {shots[i] === 'goal' ? '⚽' : shots[i] === 'saved' ? '🧤' : shots[i] ? '✕' : '•'}
            </span>
          ))}
          <span className="ml-2 font-bold text-slate-800">
            Goals: {goals}/{SHOTS}
          </span>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#e64e24]">
            Keeper Lv {level}
          </span>
        </div>

        {/* Interactive Pitch */}
        <div
          ref={pitchRef}
          className="relative h-[440px] cursor-crosshair overflow-hidden rounded-3xl shadow-2xl select-none touch-none sm:h-[500px]"
          onPointerDown={(e) => {
            if (busyRef.current || finished || !pitchRef.current) return
            const rect = pitchRef.current.getBoundingClientRect()
            const ox = ((e.clientX - rect.left) / rect.width) * 100
            const oy = ((e.clientY - rect.top) / rect.height) * 100
            const origin = { x: ox, y: oy }
            setDragOrigin(origin)
            setAimTarget(computeAimFromPointer(e.clientX, e.clientY, origin))
            try {
              ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            } catch {
              // ignore pointer capture issues on synthetic pointer events
            }
          }}
          onPointerMove={(e) => {
            if (!dragOrigin || busyRef.current || finished) return
            setAimTarget(computeAimFromPointer(e.clientX, e.clientY, dragOrigin))
          }}
          onPointerUp={(e) => {
            if (!dragOrigin) return
            const target = computeAimFromPointer(e.clientX, e.clientY, dragOrigin)
            setDragOrigin(null)
            executeShot(target.x, target.y)
          }}
          onPointerCancel={() => {
            setDragOrigin(null)
            setAimTarget(null)
          }}
        >
          {/* Sky */}
          <div className="absolute inset-x-0 top-0 h-[35%] bg-[#2258d6]">
            <span className="anim-sparkle absolute right-10 top-5 text-2xl text-white">✦</span>
          </div>

          {/* Striped green grass */}
          <div
            className="absolute inset-x-0 bottom-0 h-[65%]"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #3c8f41 0px, #3c8f41 48px, #459b49 48px, #459b49 96px)',
            }}
          />

          {/* White penalty box markings */}
          <div className="pointer-events-none absolute left-1/2 top-[55%] h-[28%] w-[86%] -translate-x-1/2 border-2 border-t-0 border-white/35" />
          <div className="pointer-events-none absolute left-1/2 top-[84%] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />

          {/* Goalpost & Net (shakes on Goal!) */}
          <div
            className={`absolute left-[14%] top-[13%] h-[42%] w-[72%] border-[5px] border-white bg-white/10 shadow-md transition-transform duration-150 ${
              netShake ? 'scale-[1.02] rotate-[0.5deg]' : ''
            }`}
          >
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.32) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
          </div>

          {/* Live Trajectory Curve & Aim Reticle when dragging */}
          {aimTarget && !shooting && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-20 h-full w-full">
              <path
                d={`M 50 84 Q ${(50 + aimTarget.x) / 2} ${Math.min(60, aimTarget.y + 18)} ${aimTarget.x} ${aimTarget.y}`}
                fill="none"
                stroke="rgba(253, 224, 71, 0.9)"
                strokeWidth="0.7"
                strokeDasharray="2 2"
              />
              <circle
                cx={aimTarget.x}
                cy={aimTarget.y}
                r="3"
                fill="rgba(253, 224, 71, 0.25)"
                stroke="#fde047"
                strokeWidth="0.6"
              />
              <circle cx={aimTarget.x} cy={aimTarget.y} r="0.9" fill="#fde047" />
            </svg>
          )}

          {/* Goalkeeper (smoothly patrols, then dives dynamically to target) */}
          <div
            className={`pointer-events-none absolute z-10 ${keeper.diving ? 'transition-all ease-out' : ''}`}
            style={{
              left: `${activeKeeperX}%`,
              top: `${keeper.y}%`,
              transform: `translate(-50%, -50%) rotate(${keeper.rot}deg)`,
              transitionDuration: keeper.diving ? `${Math.max(190, 320 - (level - 1) * 30)}ms` : '0ms',
            }}
          >
            <GoalkeeperSvg mood={keeper.mood} lookX={lookX} lookY={lookY} diving={keeper.diving} />
          </div>

          {/* Prompt */}
          <p className="pointer-events-none absolute left-0 right-0 top-[58%] text-center font-hand text-2xl font-bold italic text-white drop-shadow">
            drag &amp; release — or tap — to shoot!
          </p>

          {/* Animated Banner Inside Pitch on Goal / Save / Miss */}
          {message && (
            <div className="anim-pop pointer-events-none absolute left-1/2 top-[48%] z-30 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900/80 px-6 py-2 shadow-2xl backdrop-blur-sm">
              <p
                className={`font-hand text-3xl font-bold italic whitespace-nowrap sm:text-4xl ${
                  message.includes('GOAL')
                    ? 'text-[#a3e635]'
                    : message.includes('SAVED')
                      ? 'text-[#fde047]'
                      : 'text-orange-300'
                }`}
              >
                {message}
              </p>
            </div>
          )}

          {/* Pentagonal Soccer Ball */}
          <div
            className="pointer-events-none absolute z-20 transition-all duration-300 ease-out"
            style={{
              left: `${ballState.x}%`,
              top: `${ballState.y}%`,
              transform: `translate(-50%, -50%) scale(${ballState.scale}) rotate(${ballState.spin}deg)`,
            }}
          >
            <PenaltyBall className="h-14 w-14 drop-shadow-lg sm:h-16 sm:w-16" />
          </div>

          {/* Save sparkle burst */}
          {keeper.saved && (
            <span
              className="anim-pop pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 text-5xl"
              style={{ left: `${keeper.x}%`, top: `${keeper.y - 6}%` }}
            >
              ✨
            </span>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          The game stays only until the first results are published — then the winners take this page.
        </p>

        {!finished && <p className="mt-1 text-center text-xs text-slate-500">{hint}</p>}

        {finished && (
          <div className="anim-pop mt-5 rounded-3xl bg-white p-6 text-center shadow-xl">
            <h3 className="font-serif text-3xl font-bold">Full time!</h3>
            <p className="mt-2 text-lg">
              You scored <b>{goals}</b> out of {SHOTS} against a Lv {level} keeper.
            </p>
            <p className="text-slate-600">
              {goals >= 4
                ? 'Superstar finishing! Nothing gets past your strikes.'
                : goals >= 2
                  ? 'Great shooting — the keeper made some big dives!'
                  : 'The keeper was unbeatable this round. Try aiming for the top corners!'}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-full bg-[#e64e24] px-6 py-2.5 font-bold text-white shadow hover:bg-[#cf4018]"
              >
                Play again
              </button>
              <button
                onClick={() => setStarted(false)}
                className="rounded-full bg-slate-100 px-5 py-2.5 font-bold text-slate-700 hover:bg-slate-200"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
