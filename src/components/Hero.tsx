import { useEffect, useMemo, useRef } from 'react'

const DEFAULT_WORDS = ['MAKE', 'YOUR', 'MAGIC']

/** Classic black-and-white pentagonal soccer ball SVG group (centered at 0,0, radius 24). */
function BallGraphic() {
  return (
    <g>
      <circle cx="0" cy="0" r="24" fill="#ffffff" stroke="#1e293b" strokeWidth="3.2" />
      <polygon points="0,-10 10,-2.6 6,8.6 -6,8.6 -10,-2.6" fill="#1e293b" />
      <line x1="0" y1="-10" x2="0" y2="-22.5" stroke="#1e293b" strokeWidth="2.2" />
      <line x1="10" y1="-2.6" x2="21.5" y2="-10" stroke="#1e293b" strokeWidth="2.2" />
      <line x1="6" y1="8.6" x2="16" y2="20" stroke="#1e293b" strokeWidth="2.2" />
      <line x1="-6" y1="8.6" x2="-16" y2="20" stroke="#1e293b" strokeWidth="2.2" />
      <line x1="-10" y1="-2.6" x2="-21.5" y2="-10" stroke="#1e293b" strokeWidth="2.2" />
      <polygon points="-4.8,-24 4.8,-24 0,-18" fill="#1e293b" />
      <polygon points="20,-14 24,-5.5 16.5,-7.5" fill="#1e293b" />
      <polygon points="-20,-14 -24,-5.5 -16.5,-7.5" fill="#1e293b" />
      <polygon points="12.5,21.5 20,15.5 14,14" fill="#1e293b" />
      <polygon points="-12.5,21.5 -20,15.5 -14,14" fill="#1e293b" />
    </g>
  )
}

/** 4-pointed diamond sparkle SVG. */
function Sparkle({
  className = '',
  fill = '#ffffff',
  delay = '0s',
}: {
  className?: string
  fill?: string
  delay?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`anim-sparkle pointer-events-none ${className}`}
      style={{ animationDelay: delay }}
      aria-hidden
    >
      <path d="M12 0 Q13.5 10.5 24 12 Q13.5 13.5 12 24 Q10.5 13.5 0 12 Q10.5 10.5 12 0 Z" fill={fill} />
    </svg>
  )
}

/** Fluffy cartoon cloud SVG. */
function Cloud({
  className = '',
  fill = '#d9927a',
  delay = '0s',
}: {
  className?: string
  fill?: string
  delay?: string
}) {
  return (
    <svg
      viewBox="0 0 180 70"
      className={`anim-cloud pointer-events-none ${className}`}
      style={{ animationDelay: delay }}
      aria-hidden
    >
      <path
        d="M28 58 H152 C166 58 175 49 175 38 C175 27 165 19 152 20 C148 9 135 3 120 6 C110 -1 92 -1 81 8 C69 4 54 9 48 20 C34 19 22 27 20 38 C12 40 8 46 10 52 C12 56 19 58 28 58 Z"
        fill={fill}
      />
    </svg>
  )
}

export default function Hero({
  programName,
  themeLine,
}: {
  programName: string
  themeLine: string
}) {
  const words = useMemo(() => {
    const parts = themeLine.trim() ? themeLine.trim().split(/\s+/).slice(0, 3) : DEFAULT_WORDS
    return [parts[0] || 'MAKE', parts[1] || 'YOUR', parts[2] || 'MAGIC']
  }, [themeLine])

  const kickLegRef = useRef<SVGGElement>(null)
  const ballGroupRef = useRef<SVGGElement>(null)
  const trailGroupRef = useRef<SVGGElement>(null)
  const maskPathRef = useRef<SVGPathElement>(null)
  const arcGlowRef = useRef<SVGPathElement>(null)
  const arcCircleRef = useRef<SVGPathElement>(null)
  const arcUnderlineRef = useRef<SVGPathElement>(null)

  // Synchronized choreography:
  // 1) Orange hand enters top-left -> 2) 5 threads draw down -> 3) Footballer & singer land on exact thread joints
  // 4) Footballer kicks ball -> 5) Ball flies along sweeping circled arc, writing "MAKE YOUR MAGIC" letter-by-letter right behind it
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Exact curve matching #heroWriteArc so the ball literally writes each letter out of its trailing rim
    const P0 = { x: 662, y: 548 }
    const P1 = { x: 828, y: 232 }
    const P2 = { x: 1070, y: 332 }

    const bezier = (t: number) => {
      const mt = 1 - t
      return {
        x: mt * mt * P0.x + 2 * mt * t * P1.x + t * t * P2.x,
        y: mt * mt * P0.y + 2 * mt * t * P1.y + t * t * P2.y,
      }
    }

    const maskLen = maskPathRef.current?.getTotalLength() || 500
    const glowLen = arcGlowRef.current?.getTotalLength() || 500
    const circleLen = arcCircleRef.current?.getTotalLength() || 820
    const underLen = arcUnderlineRef.current?.getTotalLength() || 400

    if (reduced) {
      if (maskPathRef.current) {
        maskPathRef.current.style.strokeDasharray = `${maskLen}`
        maskPathRef.current.style.strokeDashoffset = '0'
      }
      if (arcGlowRef.current) {
        arcGlowRef.current.style.strokeDasharray = `${glowLen}`
        arcGlowRef.current.style.strokeDashoffset = '0'
      }
      if (arcCircleRef.current) {
        arcCircleRef.current.style.strokeDasharray = `${circleLen}`
        arcCircleRef.current.style.strokeDashoffset = '0'
      }
      if (arcUnderlineRef.current) {
        arcUnderlineRef.current.style.strokeDasharray = `${underLen}`
        arcUnderlineRef.current.style.strokeDashoffset = '0'
      }
      if (ballGroupRef.current) {
        ballGroupRef.current.setAttribute('transform', `translate(${P2.x}, ${P2.y})`)
        ballGroupRef.current.style.opacity = '1'
      }
      if (trailGroupRef.current) {
        trailGroupRef.current.style.opacity = '1'
      }
      return
    }

    let raf = 0
    const start = performance.now()
    const ENTRANCE_DELAY = 1600
    const CYCLE = 4800

    const frame = (now: number) => {
      const elapsed = now - start

      // Phase A: Wait calmly while hand -> threads -> marionettes land on joints
      if (elapsed < ENTRANCE_DELAY) {
        if (kickLegRef.current) {
          kickLegRef.current.setAttribute('transform', 'rotate(0 565 672)')
        }
        const preOpacity = elapsed < 1200 ? 0 : Math.min(1, (elapsed - 1200) / 300)
        if (ballGroupRef.current) {
          ballGroupRef.current.setAttribute('transform', `translate(${P0.x}, ${P0.y})`)
          ballGroupRef.current.style.opacity = preOpacity.toFixed(2)
        }
        if (trailGroupRef.current) {
          trailGroupRef.current.style.opacity = '0'
        }
        if (arcGlowRef.current) {
          arcGlowRef.current.style.opacity = '0'
        }
        raf = requestAnimationFrame(frame)
        return
      }

      const cycleElapsed = elapsed - ENTRANCE_DELAY
      const phase = (cycleElapsed % CYCLE) / CYCLE

      // 1. Kicking leg motion: wind back (0..0.11), snap kick impact (0.11..0.20), follow-through & settle
      let legAngle = 0
      if (phase < 0.11) {
        legAngle = (phase / 0.11) * 26
      } else if (phase < 0.2) {
        const k = (phase - 0.11) / 0.09
        const ease = 1 - Math.pow(1 - k, 3)
        legAngle = 26 - ease * 36
      } else if (phase < 0.88) {
        legAngle = -10 + Math.sin(((phase - 0.2) / 0.68) * Math.PI) * 6
      } else {
        const r = (phase - 0.88) / 0.12
        legAngle = -10 * (1 - r)
      }
      if (kickLegRef.current) {
        kickLegRef.current.setAttribute('transform', `rotate(${legAngle.toFixed(2)} 565 672)`)
      }

      // 2. Ball flight: sits at boot (0..0.16), flies along arc writing MAKE YOUR MAGIC (0.16..0.64), holds clearly (0.64..0.90), fades for next kick
      let u = 0
      let groupOpacity = 1
      if (phase < 0.16) {
        u = 0
        groupOpacity = phase < 0.05 ? phase / 0.05 : 1
      } else if (phase >= 0.16 && phase < 0.64) {
        const raw = (phase - 0.16) / 0.48
        u = 1 - Math.pow(1 - raw, 1.85)
        groupOpacity = 1
      } else if (phase >= 0.64 && phase < 0.9) {
        u = 1
        groupOpacity = 1
      } else {
        u = 1
        groupOpacity = Math.max(0, 1 - (phase - 0.9) / 0.08)
      }

      const pos = bezier(u)
      const spin = u * 720
      const bob = phase >= 0.64 && phase < 0.9 ? Math.sin(((phase - 0.64) / 0.26) * Math.PI * 2) * 5 : 0

      if (ballGroupRef.current) {
        ballGroupRef.current.setAttribute(
          'transform',
          `translate(${pos.x.toFixed(1)}, ${(pos.y + bob).toFixed(1)}) rotate(${spin.toFixed(1)})`,
        )
        ballGroupRef.current.style.opacity = groupOpacity.toFixed(2)
      }

      // 3. Reveal MAKE YOUR MAGIC + circled loop + underline directly behind the moving ball on every kick
      const writeReveal = u >= 0.98 ? 1 : Math.max(0, Math.min(1, u - 0.03))
      const circleReveal = Math.max(0, Math.min(1, (u - 0.18) / 0.78))
      const underReveal = Math.max(0, Math.min(1, (u - 0.36) / 0.62))

      if (trailGroupRef.current) {
        trailGroupRef.current.style.opacity = phase >= 0.15 ? groupOpacity.toFixed(2) : '0'
      }
      if (maskPathRef.current) {
        maskPathRef.current.style.strokeDasharray = `${maskLen}`
        maskPathRef.current.style.strokeDashoffset = `${(maskLen * (1 - writeReveal)).toFixed(1)}`
      }
      if (arcGlowRef.current) {
        arcGlowRef.current.style.strokeDasharray = `${glowLen}`
        arcGlowRef.current.style.strokeDashoffset = `${(glowLen * (1 - u)).toFixed(1)}`
        arcGlowRef.current.style.opacity = phase >= 0.15 ? (0.45 * groupOpacity).toFixed(2) : '0'
      }
      if (arcCircleRef.current) {
        arcCircleRef.current.style.strokeDasharray = `${circleLen}`
        arcCircleRef.current.style.strokeDashoffset = `${(circleLen * (1 - circleReveal)).toFixed(1)}`
      }
      if (arcUnderlineRef.current) {
        arcUnderlineRef.current.style.strokeDasharray = `${underLen}`
        arcUnderlineRef.current.style.strokeDashoffset = `${(underLen * (1 - underReveal)).toFixed(1)}`
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#1e52cf] text-white select-none">
      {/* Ambient sky clouds, sparkles, seagulls & subtle swirl */}
      <Cloud className="absolute left-[36%] top-[12%] z-10 w-24 opacity-85 md:w-32" fill="#d9927a" />
      <Cloud className="absolute right-[24%] top-[24%] z-10 w-28 opacity-75 md:w-36" fill="#d9927a" delay="1.2s" />
      <Cloud className="absolute left-[3%] top-[52%] z-10 w-20 opacity-70 md:w-28" fill="#707dae" delay="2s" />

      <Sparkle className="absolute left-[42%] top-[19%] z-10 h-5 w-5 md:h-6 md:w-6" fill="#ffffff" />
      <Sparkle className="absolute right-[29%] top-[15%] z-10 h-5 w-5 md:h-6 md:w-6" fill="#e5c158" delay="0.6s" />
      <Sparkle className="absolute left-[28%] top-[36%] z-10 h-4 w-4 md:h-5 md:w-5" fill="#e5c158" delay="1.1s" />
      <Sparkle className="absolute right-[22%] top-[44%] z-10 h-4 w-4 md:h-5 md:w-5" fill="#ffffff" delay="0.4s" />
      <Sparkle className="absolute left-[11%] top-[66%] z-10 h-3.5 w-3.5" fill="#a5b4fc" delay="1.5s" />

      {/* Tiny seagulls */}
      <svg viewBox="0 0 36 16" className="pointer-events-none absolute left-[28%] top-[27%] z-10 w-6 opacity-90" aria-hidden>
        <path d="M2 12 Q9 2 18 10 Q27 2 34 12" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 36 16" className="pointer-events-none absolute left-[35%] top-[33%] z-10 w-4 opacity-80" aria-hidden>
        <path d="M2 12 Q9 2 18 10 Q27 2 34 12" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>

      {/* Background Corner Logo: MAKE YOUR MAGIC placed cleanly in top-right side corner of sky */}
      <div className="pointer-events-none absolute right-5 top-20 z-20 flex flex-col items-center text-center sm:right-8 sm:top-22 md:right-10">
        <div
          className="font-hand font-bold italic uppercase tracking-tight drop-shadow-md"
          aria-label={words.join(' ')}
        >
          <span className="block -rotate-3 text-3xl leading-[0.82] text-white sm:text-4xl md:text-5xl">
            {words[0]}
          </span>
          <span className="block -rotate-2 text-2xl leading-[0.86] text-[#9be03a] sm:text-3xl md:text-4xl">
            {words[1]}
          </span>
          <span className="block -rotate-3 text-3xl leading-[0.82] text-white sm:text-4xl md:text-5xl">
            {words[2]}
          </span>
        </div>
        <svg viewBox="0 0 180 12" className="mt-0.5 w-24 sm:w-28 md:w-32" aria-hidden>
          <path d="M 6 7 Q 90 3 174 7" fill="none" stroke="#9be03a" strokeWidth="5" strokeLinecap="round" />
        </svg>
        {programName && (
          <p className="mt-1.5 rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-semibold tracking-wide backdrop-blur-sm sm:text-xs">
            {programName}
          </p>
        )}
      </div>

      {/* Unified Puppet Stage SVG: guarantees 100% exact joints from hand fingertips -> threads -> footballer & singer */}
      <svg
        viewBox="0 0 1440 810"
        preserveAspectRatio="xMidYMax meet"
        className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
        aria-label="Puppeteer hand with threads controlling a kicking footballer writing Al Funoon in Arabic and a singing marionette"
      >
        <defs>
          <mask id="heroWriteMask" maskUnits="userSpaceOnUse">
            <rect x="560" y="130" width="620" height="470" fill="black" />
            <path
              ref={maskPathRef}
              d="M 662 548 Q 828 232 1070 332"
              fill="none"
              stroke="white"
              strokeWidth="175"
              strokeLinecap="round"
            />
          </mask>
        </defs>

        {/* 1. Giant orange puppeteer hand sliding in from top-left */}
        <g className="anim-hand-in">
          {/* shadow hand */}
          <g transform="translate(14, 16)" fill="#783556" stroke="#783556" opacity="0.55">
            <path
              d="M -380 -380 L 180 -380 C 200 -80 190 40 155 110 C 115 160 25 150 -40 85 L -380 -220 Z"
              stroke="none"
            />
            <line x1="42" y1="118" x2="18" y2="232" strokeWidth="36" strokeLinecap="round" />
            <line x1="78" y1="132" x2="96" y2="268" strokeWidth="36" strokeLinecap="round" />
            <line x1="120" y1="126" x2="174" y2="258" strokeWidth="36" strokeLinecap="round" />
            <line x1="152" y1="106" x2="244" y2="214" strokeWidth="36" strokeLinecap="round" />
            <line x1="172" y1="78" x2="286" y2="148" strokeWidth="34" strokeLinecap="round" />
          </g>
          {/* main orange hand */}
          <g fill="#e65324" stroke="#e65324">
            <path
              d="M -380 -380 L 180 -380 C 200 -80 190 40 155 110 C 115 160 25 150 -40 85 L -380 -220 Z"
              stroke="none"
            />
            <line x1="42" y1="118" x2="18" y2="232" strokeWidth="36" strokeLinecap="round" />
            <line x1="78" y1="132" x2="96" y2="268" strokeWidth="36" strokeLinecap="round" />
            <line x1="120" y1="126" x2="174" y2="258" strokeWidth="36" strokeLinecap="round" />
            <line x1="152" y1="106" x2="244" y2="214" strokeWidth="36" strokeLinecap="round" />
            <line x1="172" y1="78" x2="286" y2="148" strokeWidth="34" strokeLinecap="round" />
          </g>
          {/* palm highlight */}
          <ellipse cx="92" cy="64" rx="44" ry="28" transform="rotate(28 92 64)" fill="#f4844c" opacity="0.65" />
        </g>

        {/* 2. Five crisp white puppet threads locked exactly from the 5 fingertips to the marionette joints */}
        <g stroke="rgba(255,255,255,0.78)" strokeWidth="2.1" strokeLinecap="round">
          <line x1="18" y1="232" x2="480" y2="526" className="string-line" pathLength={100} style={{ animationDelay: '.55s' }} />
          <line x1="96" y1="268" x2="550" y2="514" className="string-line" pathLength={100} style={{ animationDelay: '.7s' }} />
          <line x1="174" y1="258" x2="622" y2="542" className="string-line" pathLength={100} style={{ animationDelay: '.85s' }} />
          <line x1="244" y1="214" x2="1082" y2="546" className="string-line" pathLength={100} style={{ animationDelay: '1.0s' }} />
          <line x1="286" y1="148" x2="1145" y2="538" className="string-line" pathLength={100} style={{ animationDelay: '1.15s' }} />
        </g>

        {/* 3. Marionette Footballer hanging squarely on threads 1, 2 & 3 */}
        <g className="anim-marionette-foot" style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.28))' }}>
          {/* attachment joint knots */}
          <circle cx="480" cy="526" r="4.5" fill="#ffffff" />
          <circle cx="550" cy="514" r="4" fill="#ffffff" />
          <circle cx="622" cy="542" r="4.5" fill="#ffffff" />

          {/* left raised arm to joint 1 */}
          <line x1="534" y1="584" x2="480" y2="526" stroke="#966133" strokeWidth="18" strokeLinecap="round" />
          {/* right extended arm to joint 3 */}
          <line x1="566" y1="588" x2="622" y2="542" stroke="#966133" strokeWidth="17" strokeLinecap="round" />

          {/* standing left leg */}
          <line x1="542" y1="682" x2="512" y2="770" stroke="#966133" strokeWidth="20" strokeLinecap="round" />
          <ellipse cx="508" cy="773" rx="14" ry="7" fill="#1e1b18" />

          {/* kicking right leg (animated synchronously with ball kick around hip 565, 672) */}
          <g ref={kickLegRef}>
            <line x1="565" y1="672" x2="606" y2="616" stroke="#966133" strokeWidth="20" strokeLinecap="round" />
            <line x1="602" y1="622" x2="648" y2="560" stroke="#ffffff" strokeWidth="18.5" strokeLinecap="round" />
            <line x1="604" y1="619" x2="609" y2="612" stroke="#1e293b" strokeWidth="19" strokeLinecap="butt" />
            <path d="M 640 565 L 661 544 C 669 538 675 546 668 556 L 651 574 Z" fill="#1e1b18" />
          </g>

          {/* navy shorts */}
          <path d="M 520 644 L 575 642 L 596 680 L 555 702 L 512 692 Z" fill="#1b3a7a" />

          {/* yellow jersey */}
          <path
            d="M 526 572 C 538 564 564 566 576 578 L 590 598 L 572 612 L 574 648 L 524 648 L 526 608 L 508 594 Z"
            fill="#f7c82b"
          />

          {/* head + black hair cap (crown at 550, 514) */}
          <circle cx="550" cy="542" r="25" fill="#966133" />
          <path d="M 525 536 C 528 511 572 511 575 536 C 561 532 539 532 525 536 Z" fill="#1e1b18" />
        </g>

        {/* 4. Comet arc trail & circled Arabic "الفنون" (Al Funoon) written visibly right behind the ball */}
        <path
          ref={arcGlowRef}
          d="M 662 548 Q 828 232 1070 332"
          fill="none"
          stroke="rgba(163, 230, 53, 0.48)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        <g ref={trailGroupRef} style={{ opacity: 0 }}>
          {/* Sweeping circled swoosh loop framing الفنون */}
          <path
            ref={arcCircleRef}
            d="M 684 468 C 660 330, 815 215, 975 245 C 1075 264, 1106 356, 1020 400 C 915 448, 760 448, 694 494"
            fill="none"
            stroke="rgba(255, 255, 255, 0.42)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <g mask="url(#heroWriteMask)">
            <text
              transform="translate(824, 358) rotate(-28) skewX(-8)"
              textAnchor="middle"
              dominantBaseline="central"
              direction="rtl"
              lang="ar"
              className="font-arabic font-bold"
              fontSize="82"
              fill="#ffffff"
              style={{
                fontFamily: '"Marhey", "Caveat", cursive',
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
              }}
            >
              الفنون
            </text>
          </g>

          {/* Lime underline stroke sweeping cleanly beneath the written الفنون */}
          <path
            ref={arcUnderlineRef}
            d="M 718 446 Q 836 392 950 326"
            fill="none"
            stroke="#9be03a"
            strokeWidth="7"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.28))' }}
          />
        </g>

        {/* 5. Flying soccer ball launching from the kicking boot */}
        <g ref={ballGroupRef} style={{ opacity: 0, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))' }}>
          <BallGraphic />
        </g>

        {/* 6. Marionette Singer hanging squarely on threads 4 & 5 (clean silhouette: NO nose and NO mouth!) */}
        <g className="anim-marionette-singer" style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.28))' }}>
          {/* attachment joint knots */}
          <circle cx="1082" cy="546" r="4.5" fill="#ffffff" />
          <circle cx="1145" cy="538" r="4" fill="#ffffff" />

          {/* legs standing cleanly above bottom tilted ribbon */}
          <line x1="1132" y1="686" x2="1122" y2="766" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
          <line x1="1158" y1="686" x2="1168" y2="766" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
          <ellipse cx="1117" cy="769" rx="13" ry="6.5" fill="#0f172a" />
          <ellipse cx="1173" cy="769" rx="13" ry="6.5" fill="#0f172a" />

          {/* raised left puppet arm connected directly to joint 4 */}
          <line x1="1125" y1="608" x2="1082" y2="546" stroke="#8a542c" strokeWidth="14" strokeLinecap="round" />

          {/* navy pants */}
          <path d="M 1120 676 L 1170 676 L 1176 706 L 1114 706 Z" fill="#1e293b" />

          {/* hot pink tunic */}
          <path d="M 1120 598 L 1170 598 L 1186 622 L 1172 634 L 1174 680 L 1118 680 L 1118 634 L 1104 622 Z" fill="#ec4899" />

          {/* neck */}
          <rect x="1137" y="586" width="16" height="14" rx="5" fill="#8a542c" />

          {/* clean head + black hair cap (NO nose, NO mouth) */}
          <circle cx="1145" cy="566" r="24" fill="#8a542c" />
          <path d="M 1121 561 C 1124 536 1166 536 1169 561 C 1155 556 1135 556 1121 561 Z" fill="#1e1b18" />

          {/* grooving right arm holding microphone */}
          <g className="anim-mic-groove">
            <line x1="1166" y1="616" x2="1198" y2="590" stroke="#8a542c" strokeWidth="13.5" strokeLinecap="round" />
            <line x1="1196" y1="589" x2="1181" y2="574" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="1176" cy="569" r="10" fill="#475569" stroke="#0f172a" strokeWidth="2.4" />
            <line x1="1169" y1="566" x2="1183" y2="572" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.7" />
          </g>

          {/* singing sound wave ripples */}
          <g className="anim-sound-wave" stroke="#fef08a" strokeWidth="2.8" fill="none" strokeLinecap="round">
            <path d="M 1196 552 Q 1206 562 1199 573" />
            <path d="M 1206 547 Q 1218 562 1209 578" opacity="0.7" />
          </g>

          {/* floating musical notes near singer */}
          <text x="1064" y="646" fontSize="24" fontWeight="bold" fill="#d9f99d" className="anim-note">
            ♪
          </text>
          <text
            x="1224"
            y="580"
            fontSize="28"
            fontWeight="bold"
            fill="#d9f99d"
            className="anim-note"
            style={{ animationDelay: '.7s' }}
          >
            ♫
          </text>
          <text
            x="1196"
            y="516"
            fontSize="22"
            fontWeight="bold"
            fill="#fde047"
            className="anim-note"
            style={{ animationDelay: '1.35s' }}
          >
            ♩
          </text>
        </g>
      </svg>

      {/* Bottom tilted orange marquee strip */}
      <div className="relative z-30 mt-auto">
        <div className="-mb-1 -ml-[2%] -mr-[2%] -rotate-[1.1deg] overflow-hidden bg-[#e64e24] py-1.5 shadow-lg">
          <div className="anim-marquee flex w-max gap-6 whitespace-nowrap font-hand text-base text-white/95 sm:text-lg">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k}>
                ✦ home ✦ programs ✦ results ✦ candidates ✦ teams ✦ gallery ✦ updates ✦ downloads ✦ {words.join(' ')} ✦&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
