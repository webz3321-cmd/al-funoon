import { useEffect, useRef, useState } from 'react'

function CloudSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 70" className={className} aria-hidden>
      <path
        d="M28 58 H152 C166 58 175 49 175 38 C175 27 165 19 152 20 C148 9 135 3 120 6 C110 -1 92 -1 81 8 C69 4 54 9 48 20 C34 19 22 27 20 38 C12 40 8 46 10 52 C12 56 19 58 28 58 Z"
        fill="#c88278"
      />
    </svg>
  )
}

function SparkleSvg({ className = '', fill = '#ffffff' }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 0 Q13.5 10.5 24 12 Q13.5 13.5 12 24 Q10.5 13.5 0 12 Q10.5 10.5 12 0 Z" fill={fill} />
    </svg>
  )
}

function RocketSvg({ launching }: { launching: boolean }) {
  return (
    <svg viewBox="0 0 180 310" className="h-60 w-36 overflow-visible drop-shadow-xl sm:h-72 sm:w-44" aria-hidden>
      <defs>
        <linearGradient id="rocketCone" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97338" />
          <stop offset="55%" stopColor="#ea4d1d" />
          <stop offset="100%" stopColor="#cf3d14" />
        </linearGradient>
        <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fffdf5" />
          <stop offset="72%" stopColor="#fbf4e1" />
          <stop offset="100%" stopColor="#ebdcb9" />
        </linearGradient>
        <linearGradient id="rocketFin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f97338" />
          <stop offset="100%" stopColor="#dc4417" />
        </linearGradient>
      </defs>

      {/* Left & Right Swept Orange Fins */}
      <path
        d="M52 178 C30 194 22 214 26 238 C38 228 48 224 58 224 Z"
        fill="url(#rocketFin)"
      />
      <path
        d="M52 184 C36 196 29 212 31 229"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M128 178 C150 194 158 214 154 238 C142 228 132 224 122 224 Z"
        fill="url(#rocketFin)"
      />
      <path
        d="M128 184 C144 196 151 212 149 229"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Main Rocket Silhouette Clip */}
      <g>
        {/* Cream Fuselage */}
        <path
          d="M90 22 C60 66 47 118 52 190 C55 212 61 226 68 236 L112 236 C119 226 125 212 128 190 C133 118 120 66 90 22 Z"
          fill="url(#rocketBody)"
        />

        {/* Orange-Red Nose Cone */}
        <path
          d="M90 22 C73 46 62 68 57 90 Q90 96 123 90 C118 68 107 46 90 22 Z"
          fill="url(#rocketCone)"
        />

        {/* Nose Neck Golden Trim Band */}
        <path
          d="M57 88 Q90 94 123 88 L122 95 Q90 101 58 95 Z"
          fill="#f5b82e"
        />

        {/* Subtle Rivet Dots */}
        <circle cx="90" cy="107" r="2.1" fill="#d9cbb0" />
        <circle cx="71" cy="112" r="1.8" fill="#e2d4ba" />
        <circle cx="109" cy="112" r="1.8" fill="#e2d4ba" />

        {/* Blue Porthole Window with Golden Frame */}
        <circle cx="90" cy="136" r="22" fill="#f59e0b" />
        <circle cx="90" cy="136" r="16.5" fill="#1e40af" />
        <path
          d="M78 130 A13 13 0 0 1 97 122"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.8"
        />
        <circle cx="82" cy="136" r="2.2" fill="#ffffff" opacity="0.9" />

        {/* Lower Golden Band */}
        <path
          d="M52 178 Q90 183 128 178 L127 187 Q90 192 53 187 Z"
          fill="#fcd34d"
        />

        {/* Coral-Red 5-Point Star */}
        <polygon
          points="90,196 93,204 101.5,204 94.8,209 97.2,217.5 90,212.5 82.8,217.5 85.2,209 78.5,204 87,204"
          fill="#ea4d1d"
        />

        {/* Bottom Nose/Fuselage Rim Highlight */}
        <circle cx="90" cy="227" r="2" fill="#d9cbb0" />
      </g>

      {/* Dark Slate Nozzle Base */}
      <path d="M72 236 L108 236 L102 248 L78 248 Z" fill="#1e293b" />
      <rect x="75" y="246" width="30" height="4" rx="2" fill="#334155" />

      {/* Exhaust Flame */}
      <g className="anim-flame" style={{ transformOrigin: '90px 250px' }}>
        <path
          d={
            launching
              ? 'M78 250 Q90 330 102 250 Q95 278 90 315 Q85 278 78 250 Z'
              : 'M81 250 C81 268 85 282 90 290 C95 282 99 268 99 250 Z'
          }
          fill="#f97316"
        />
        <path
          d={
            launching
              ? 'M84 250 Q90 306 96 250 Z'
              : 'M85 250 C85 262 87 272 90 278 C93 272 95 262 95 250 Z'
          }
          fill="#fde047"
        />
      </g>
    </svg>
  )
}

export default function LaunchPage({
  onLaunch,
  programName,
}: {
  onLaunch: () => void
  programName?: string
}) {
  const [launching, setLaunching] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
  }, [])

  const launch = () => {
    if (launching) return
    setLaunching(true)
    timerRef.current = window.setTimeout(onLaunch, 1850)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#071645] via-[#133cb2] to-[#326ef8] text-center text-white select-none">
      {/* Ambient Clouds */}
      <CloudSvg className="anim-cloud pointer-events-none absolute left-[24%] top-[16%] w-24 opacity-90 sm:w-28" />
      <CloudSvg
        className="anim-cloud pointer-events-none absolute right-[4%] top-[28%] w-28 opacity-90 sm:w-36"
      />

      {/* Twinkling Sparkles & Subtle Sky Dots */}
      <SparkleSvg className="anim-sparkle pointer-events-none absolute left-[3%] top-[32%] h-3.5 w-3.5" fill="#ffffff" />
      <SparkleSvg
        className="anim-sparkle pointer-events-none absolute left-[9.5%] top-[11%] h-2.5 w-2.5 opacity-60"
        fill="#93c5fd"
      />
      <span className="anim-sparkle pointer-events-none absolute right-[16.5%] top-[17.5%]" style={{ animationDelay: '0.6s' }} aria-hidden>
        <SparkleSvg className="h-3.5 w-3.5" fill="#fbbf24" />
      </span>
      <span className="anim-sparkle pointer-events-none absolute right-[8%] top-[47%]" style={{ animationDelay: '1.1s' }} aria-hidden>
        <SparkleSvg className="h-3.5 w-3.5" fill="#ffffff" />
      </span>
      <span className="anim-sparkle pointer-events-none absolute right-[35%] top-[26%]" style={{ animationDelay: '1.6s' }} aria-hidden>
        <SparkleSvg className="h-2.5 w-2.5 opacity-50" fill="#93c5fd" />
      </span>
      <span className="pointer-events-none absolute left-[19.8%] top-[43%] h-1.5 w-1.5 rounded-full bg-white/85" aria-hidden />
      <span className="pointer-events-none absolute left-[42.5%] top-[21.5%] h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden />
      <span className="pointer-events-none absolute left-[56.5%] top-[10%] h-1 w-1 rounded-full bg-white/50" aria-hidden />

      {/* Top Centered Tilted Golden Title */}
      <header className="relative z-10 pt-10 sm:pt-12">
        <h1 className="font-hand -rotate-2 text-3xl font-bold italic tracking-wide text-[#fbbf24] drop-shadow sm:text-4xl">
          {programName?.trim() || 'Our Grand Fest'}
        </h1>
      </header>

      {/* Centerpiece Rocket + Ground Shadow */}
      <main className="relative z-20 flex flex-1 flex-col items-center justify-center px-4">
        <div className="relative flex flex-col items-center">
          {/* Soft bokeh orbs near the pad */}
          <span
            className="pointer-events-none absolute -left-8 bottom-16 h-10 w-10 rounded-full bg-white/15 blur-sm"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute -right-10 bottom-12 h-16 w-16 rounded-full bg-white/20 blur-md"
            aria-hidden
          />

          <div className={launching ? 'anim-rocket relative z-10' : 'relative z-10 transition-transform duration-300 hover:-translate-y-1'}>
            <RocketSvg launching={launching} />
          </div>

          {launching && (
            <p className="anim-pop font-hand -mt-4 text-2xl font-bold italic text-[#fde047] drop-shadow">
              Blast off!
            </p>
          )}

          {/* Ground oval shadow beneath rocket */}
          <div
            className={`mt-2 h-3.5 w-52 rounded-full bg-[#091c52]/45 blur-[1px] transition-opacity duration-500 sm:w-64 ${
              launching ? 'scale-75 opacity-10' : 'opacity-100'
            }`}
            aria-hidden
          />
        </div>
      </main>

      {/* Rolling Dark Brown Hill + Floating Glossy "Launch" Pill + Bottom Caption */}
      <div className="relative z-20 w-full pt-7">
        {/* Rolling Brown Hill SVG */}
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="pointer-events-none block h-24 w-full sm:h-28"
          aria-hidden
        >
          <path
            d="M0,44 C260,8 520,66 840,38 C1100,14 1280,22 1440,42 L1440,120 L0,120 Z"
            fill="#4d2e14"
          />
        </svg>

        {/* Glossy 3D Coral-Orange "Launch" Button */}
        <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2">
          <button
            onClick={launch}
            disabled={launching}
            className="relative cursor-pointer rounded-full bg-gradient-to-b from-[#fa7742] via-[#ea5322] to-[#c73c12] px-14 py-2.5 font-hand text-3xl font-bold italic text-white shadow-[0_8px_22px_rgba(0,0,0,0.38),inset_0_2px_3px_rgba(255,255,255,0.45)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-75 sm:px-16 sm:text-4xl"
          >
            {launching ? 'Launching…' : 'Launch'}
          </button>
        </div>

        {/* Bottom Instructional Copy Seated on the Hill */}
        <p className="absolute bottom-2.5 left-0 right-0 z-30 px-4 text-xs font-bold tracking-wide text-white/95 sm:bottom-3 sm:text-sm">
          Tap Launch — the rocket blasts off, and the fest begins!
        </p>
      </div>
    </div>
  )
}
