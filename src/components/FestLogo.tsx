export function FestLogo({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 500" className={className} aria-hidden>
      <g>
        {/* Red turban/cap shape */}
        <path
          d="M 60 310 C 60 170, 160 50, 330 30 C 370 25, 410 40, 410 40 C 410 40, 340 180, 410 320 C 415 330, 412 345, 400 348 C 300 365, 140 360, 60 310 Z"
          fill="#e63946"
        />
        {/* Three white curved swooshes on top */}
        <path
          d="M 90 285 C 160 180, 260 120, 405 110 C 370 145, 270 190, 105 270 Z"
          fill="#ffffff"
        />
        <path
          d="M 105 305 C 180 220, 275 180, 410 185 C 380 215, 290 250, 120 300 Z"
          fill="#ffffff"
        />
        <path
          d="M 115 328 C 190 270, 280 245, 412 260 C 390 282, 305 310, 130 332 Z"
          fill="#ffffff"
        />
        {/* Bottom left small decorative fold */}
        <path
          d="M 60 310 L 98 335 L 102 398 L 60 350 Z"
          fill="#c52233"
        />
        {/* Bottom Arabic Calligraphy framing & text */}
        <rect x="120" y="370" width="260" height="95" rx="8" fill="none" stroke="#000000" strokeWidth="16" />
        <polygon points="315,382 330,397 315,412 300,397" fill="#f59e0b" />
        <polygon points="175,392 190,407 175,422 160,407" fill="#f59e0b" />
        <text
          x="250"
          y="442"
          textAnchor="middle"
          className="font-arabic font-bold"
          fontSize="72"
          fill="#000000"
        >
          الفنون
        </text>
      </g>
    </svg>
  )
}
