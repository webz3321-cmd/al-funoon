import { useMemo, useState } from 'react'
import { RESULT_CATEGORIES, teamPoints, toppers } from '../lib/store'
import type { ResultCategory, ResultItem, SiteData } from '../lib/store'

type CategoryFilter = ResultCategory | 'All'

const PENTAGON_CLIP = 'polygon(50% 0%, 100% 37%, 81% 100%, 19% 100%, 0% 37%)'

function TopographicBg() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 h-full w-full opacity-[0.16]"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g fill="none" stroke="#c2b59b" strokeWidth="1.4">
        <path d="M-40 120 Q120 40 240 140 T520 110 T840 160" />
        <path d="M-40 190 Q140 110 270 210 T560 180 T840 230" />
        <path d="M-40 265 Q160 190 300 285 T600 250 T840 300" />
        <path d="M-40 345 Q170 280 330 365 T620 330 T840 370" />
        <path d="M-40 430 Q180 365 360 450 T640 420 T840 460" />
        <path d="M-40 520 Q190 460 380 540 T670 510 T840 545" />
        <ellipse cx="145" cy="210" rx="90" ry="55" transform="rotate(-14 145 210)" />
        <ellipse cx="145" cy="210" rx="54" ry="32" transform="rotate(-14 145 210)" />
        <ellipse cx="640" cy="360" rx="115" ry="68" transform="rotate(16 640 360)" />
        <ellipse cx="640" cy="360" rx="70" ry="40" transform="rotate(16 640 360)" />
      </g>
    </svg>
  )
}

/** Architectural campus / dome illustration inside Image 3 stepped arch window. */
function ArchBuildingIllustration({ photo }: { photo?: string }) {
  if (photo) {
    return <img src={photo} alt="" className="h-full w-full object-cover" />
  }
  return (
    <svg viewBox="0 0 360 150" className="h-full w-full bg-gradient-to-b from-[#bae6fd] to-[#e0f2fe]" preserveAspectRatio="xMidYMax slice" aria-hidden>
      {/* Left wing */}
      <rect x="12" y="58" width="95" height="92" fill="#e2e8f0" />
      <rect x="20" y="70" width="16" height="22" rx="8" fill="#1e3a8a" />
      <rect x="46" y="70" width="16" height="22" rx="8" fill="#1e3a8a" />
      <rect x="72" y="70" width="16" height="22" rx="8" fill="#1e3a8a" />
      <rect x="20" y="106" width="16" height="28" rx="2" fill="#334155" />
      <rect x="46" y="106" width="16" height="28" rx="2" fill="#334155" />
      <rect x="72" y="106" width="16" height="28" rx="2" fill="#334155" />

      {/* Center dome hall */}
      <path d="M138 42 C138 14 222 14 222 42 Z" fill="#ffffff" />
      <line x1="180" y1="8" x2="180" y2="20" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      <rect x="116" y="42" width="128" height="108" fill="#ffffff" />
      <rect x="126" y="42" width="108" height="10" fill="#1d4ed8" />
      <rect x="132" y="62" width="22" height="32" rx="11" fill="#0f172a" />
      <rect x="168" y="60" width="24" height="34" rx="12" fill="#1d4ed8" />
      <rect x="206" y="62" width="22" height="32" rx="11" fill="#0f172a" />
      <rect x="164" y="106" width="32" height="44" rx="16" fill="#0f172a" />

      {/* Right wing */}
      <rect x="252" y="54" width="96" height="96" fill="#cbd5e1" />
      <rect x="264" y="68" width="16" height="22" rx="8" fill="#0f766e" />
      <rect x="290" y="68" width="16" height="22" rx="8" fill="#0f766e" />
      <rect x="316" y="68" width="16" height="22" rx="8" fill="#0f766e" />
      <rect x="264" y="106" width="22" height="30" rx="2" fill="#334155" />
      <rect x="300" y="106" width="22" height="30" rx="2" fill="#334155" />
    </svg>
  )
}

/** Floating open books illustration on the left of Image 2 terracotta result cards. */
function FlyingBooksSvg() {
  return (
    <svg viewBox="0 0 180 280" className="pointer-events-none h-full w-full" aria-hidden>
      <path d="M40 0 C95 70, 15 150, 110 210 C145 232, 70 265, 55 280" fill="none" stroke="#1e293b" strokeWidth="1.2" opacity="0.65" />
      {/* Purple open book top-left */}
      <g transform="translate(14, 48) rotate(-14)">
        <path d="M4 22 L38 6 L44 36 L10 48 Z" fill="#7e22ce" />
        <path d="M38 6 L72 16 L66 44 L44 36 Z" fill="#f8fafc" />
        <path d="M10 44 L44 36 L66 44 L36 56 Z" fill="#e2e8f0" />
      </g>
      {/* Green open book top-right */}
      <g transform="translate(88, 62) rotate(16)">
        <path d="M0 16 L44 4 L48 36 L8 46 Z" fill="#10b981" />
        <path d="M44 4 L86 20 L78 52 L48 36 Z" fill="#fefce8" />
        <path d="M8 44 L48 36 L78 52 L38 60 Z" fill="#cbd5e1" />
      </g>
      {/* Blue open book mid-left */}
      <g transform="translate(34, 134) rotate(-8)">
        <path d="M2 18 L34 6 L38 34 L8 44 Z" fill="#2563eb" />
        <path d="M34 6 L66 16 L58 42 L38 34 Z" fill="#ffffff" />
      </g>
      {/* Red/cream flying book lower-center */}
      <g transform="translate(86, 178) rotate(12)">
        <path d="M0 24 L42 6 L48 40 L10 54 Z" fill="#dc2626" />
        <path d="M42 6 L84 22 L76 54 L48 40 Z" fill="#fffbeb" />
      </g>
    </svg>
  )
}

/** Rainbow geometric burst on bottom-right corner of Image 2 terracotta result cards. */
function RainbowEyeCornerSvg() {
  const colors = ['#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#ec4899', '#f97316', '#fde047']
  return (
    <svg viewBox="0 0 220 220" className="pointer-events-none h-full w-full" aria-hidden>
      <g transform="translate(185, 195)">
        {Array.from({ length: 42 }).map((_, i) => {
          const a = (i / 42) * Math.PI * 2
          const x2 = Math.cos(a) * 210
          const y2 = Math.sin(a) * 210
          return (
            <line
              key={i}
              x1="0"
              y1="0"
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
              stroke={colors[i % colors.length]}
              strokeWidth="9"
            />
          )
        })}
        <ellipse cx="-26" cy="-20" rx="92" ry="62" transform="rotate(-38 -26 -20)" fill="#08144a" />
        <ellipse cx="-2" cy="-42" rx="34" ry="22" transform="rotate(-32 -2 -42)" fill="#ffffff" />
      </g>
    </svg>
  )
}

function PentagonPortrait({
  photo,
  name,
  bgColor,
  sizeClass = 'h-32 w-32 sm:h-36 sm:w-36',
}: {
  photo?: string
  name: string
  bgColor: string
  sizeClass?: string
}) {
  const initial = (name.trim()[0] || '?').toUpperCase()
  return (
    <div
      className={`relative flex items-end justify-center overflow-hidden shadow-md ${sizeClass}`}
      style={{ clipPath: PENTAGON_CLIP, backgroundColor: bgColor }}
    >
      {photo ? (
        <img src={photo} alt={name} className="h-[88%] w-[86%] object-cover object-top" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-hand text-5xl font-bold text-white/95">
          {initial}
        </div>
      )}
    </div>
  )
}

function parseRank(pos: string): number {
  const m = pos.match(/\d+/)
  return m ? Number(m[0]) : 99
}

function sortProgramWinners(items: ResultItem[]): ResultItem[] {
  return [...items].sort((a, b) => {
    const ra = parseRank(a.position)
    const rb = parseRank(b.position)
    if (ra !== rb) return ra - rb
    return (Number(b.points) || 0) - (Number(a.points) || 0)
  })
}

export default function ResultsShowcase({
  data,
  onHome,
}: {
  data: SiteData
  onHome: () => void
}) {
  // Null = Image 3 category gateway cards (Bidaya, Ula, Thaniya, Overall)
  // Set = UP: Image 2 published program results + DOWN: Image 1 toppers & scoreboard
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter | null>(null)
  const [showAllTeams, setShowAllTeams] = useState(false)
  const [showAllToppers, setShowAllToppers] = useState(false)

  const categoryCounts = useMemo(() => {
    const counts: Record<ResultCategory, number> = { Bidaya: 0, Ula: 0, Thaniya: 0 }
    for (const r of data.results) {
      if (r.category === 'Bidaya' || r.category === 'Ula' || r.category === 'Thaniya') {
        counts[r.category] += 1
      }
    }
    return counts
  }, [data.results])

  // Group results by program/variety for Image 2 showcase cards
  const programGroups = useMemo(() => {
    const filtered =
      selectedCategory && selectedCategory !== 'All'
        ? data.results.filter((r) => r.category === selectedCategory)
        : data.results

    const map = new Map<string, { title: string; category: string; items: ResultItem[] }>()
    for (const r of filtered) {
      const progTitle = (r.variety || 'General Program').trim()
      const key = `${progTitle.toLowerCase()}__${r.category || ''}`
      const existing = map.get(key)
      if (existing) {
        existing.items.push(r)
      } else {
        map.set(key, {
          title: progTitle,
          category: r.category || '',
          items: [r],
        })
      }
    }

    return [...map.values()].map((g) => ({
      ...g,
      items: sortProgramWinners(g.items),
    }))
  }, [data.results, selectedCategory])

  // Real Toppers for Image 1 bottom showcase
  const topperBidaya = useMemo(() => toppers(data, 'Bidaya')[0], [data])
  const topperUla = useMemo(() => toppers(data, 'Ula')[0], [data])
  const topperThaniya = useMemo(() => toppers(data, 'Thaniya')[0], [data])
  const allOverallToppers = useMemo(() => toppers(data, 'All'), [data])
  const topperOverall = allOverallToppers[0]

  const allTeamBoard = useMemo(
    () => teamPoints(data, selectedCategory ?? 'All'),
    [data, selectedCategory],
  )
  const visibleTeams = showAllTeams ? allTeamBoard : allTeamBoard.slice(0, 5)

  const totalProgramTarget = Math.max(data.programs.length, data.results.length, 1)

  // ---- VIEW 1: Image 3 Gateway Cards (Bidaya, Ula, Thaniya, Overall) ----
  if (selectedCategory === null) {
    const gatewayCards: {
      id: CategoryFilter
      title: string
      subtitle: string
      cardBg: string
      archColor: string
      sparkleColor: string
      rotate: string
      count: number
      galleryPhoto?: string
    }[] = [
      {
        id: 'Bidaya',
        title: 'Bidaya',
        subtitle: 'Junior Category Results',
        cardBg: '#1cb5a7',
        archColor: '#2563eb',
        sparkleColor: '#2563eb',
        rotate: '-rotate-2',
        count: categoryCounts.Bidaya,
        galleryPhoto: data.gallery[0]?.image,
      },
      {
        id: 'Ula',
        title: 'Ula',
        subtitle: 'Sub-Senior Category Results',
        cardBg: '#d93829',
        archColor: '#f5b726',
        sparkleColor: '#f5b726',
        rotate: 'rotate-2',
        count: categoryCounts.Ula,
        galleryPhoto: data.gallery[1]?.image,
      },
      {
        id: 'Thaniya',
        title: 'Thaniya',
        subtitle: 'Senior Category Results',
        cardBg: '#5a4cb8',
        archColor: '#d946ef',
        sparkleColor: '#d946ef',
        rotate: '-rotate-1',
        count: categoryCounts.Thaniya,
        galleryPhoto: data.gallery[2]?.image,
      },
      {
        id: 'All',
        title: 'Overall',
        subtitle: 'All Categories & Toppers',
        cardBg: '#dc4e22',
        archColor: '#eab308',
        sparkleColor: '#facc15',
        rotate: 'rotate-1',
        count: data.results.length,
        galleryPhoto: data.gallery[3]?.image,
      },
    ]

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#fbf8f2] pb-20">
        <TopographicBg />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-5">
          <div className="flex items-center justify-between">
            <button
              onClick={onHome}
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow hover:bg-slate-50"
            >
              ← Home
            </button>
            <div className="text-center">
              <p className="font-hand text-xl font-bold italic text-[#e64e24]">select category</p>
              <h1 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">Results</h1>
            </div>
            <span className="w-20" />
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:gap-10">
            {gatewayCards.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`group relative overflow-hidden rounded-[2rem] text-left shadow-xl transition-all duration-200 hover:scale-[1.03] hover:rotate-0 ${c.rotate}`}
                style={{ backgroundColor: c.cardBg }}
              >
                {/* Decorative dark palm-leaf silhouette on left edge */}
                <svg viewBox="0 0 60 120" className="pointer-events-none absolute -left-2 top-8 w-10 opacity-35" aria-hidden>
                  <path d="M0 10 Q38 18 46 38 Q22 34 0 42 Z" fill="#064e3b" />
                  <path d="M0 44 Q42 52 50 74 Q22 68 0 76 Z" fill="#064e3b" />
                </svg>

                {/* Sparkle stars */}
                <svg viewBox="0 0 40 40" className="pointer-events-none absolute left-10 top-6 w-10" aria-hidden>
                  <path d="M16 2 Q18 14 30 16 Q18 18 16 30 Q14 18 2 16 Q14 14 16 2 Z" fill={c.sparkleColor} />
                </svg>
                <svg viewBox="0 0 28 28" className="pointer-events-none absolute left-20 top-14 w-6" aria-hidden>
                  <path d="M12 2 Q14 10 22 12 Q14 14 12 22 Q10 14 2 12 Q10 10 12 2 Z" fill={c.sparkleColor} />
                </svg>

                {/* Top-right handwritten category heading */}
                <div className="relative z-10 flex items-start justify-end px-7 pt-6">
                  <div className="text-right">
                    <h2 className="font-hand text-4xl font-bold text-white drop-shadow sm:text-5xl">
                      {c.title}
                    </h2>
                    <span className="mt-1 inline-block rounded-full bg-black/20 px-3 py-0.5 text-xs font-bold text-white/95">
                      {c.count} {c.count === 1 ? 'result' : 'results'}
                    </span>
                  </div>
                </div>

                {/* Triple-arch heritage cutout frame + architectural/gallery visual */}
                <div className="relative mx-4 mt-3 pt-10">
                  {/* Outer colored triple arch silhouette */}
                  <div
                    className="relative overflow-hidden rounded-t-[1.5rem] px-3 pt-4"
                    style={{ backgroundColor: c.archColor }}
                  >
                    <div className="grid grid-cols-3 items-end gap-2">
                      <div className="h-24 overflow-hidden rounded-t-full border-4 border-b-0 bg-sky-100" style={{ borderColor: c.archColor }}>
                        <ArchBuildingIllustration photo={c.galleryPhoto} />
                      </div>
                      <div className="-mt-8 h-32 overflow-hidden rounded-t-full border-4 border-b-0 bg-sky-100" style={{ borderColor: c.archColor }}>
                        <ArchBuildingIllustration photo={c.galleryPhoto} />
                      </div>
                      <div className="h-24 overflow-hidden rounded-t-full border-4 border-b-0 bg-sky-100" style={{ borderColor: c.archColor }}>
                        <ArchBuildingIllustration photo={c.galleryPhoto} />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ---- VIEW 2: Pressed Result Category -> UP: Published Results (Image 2) + DOWN: Toppers & Scoreboard (Image 1) ----
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fbf8f2] pb-20">
      <TopographicBg />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-5">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className="rounded-full bg-[#e64e24] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#cf4018]"
            >
              ← Categories
            </button>
            <button
              onClick={onHome}
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow hover:bg-slate-50"
            >
              Home
            </button>
          </div>

          {/* Quick category tabs: All / Bidaya / Ula / Thaniya */}
          <div className="flex flex-wrap gap-1.5 rounded-full bg-white/90 p-1 shadow">
            {(['All', ...RESULT_CATEGORIES] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3.5 py-1 text-sm font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-[#e64e24] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-orange-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================
            UP SECTION: Recent Published Results Showcase (Image 2 model)
           ============================================================ */}
        <section className="mt-6 space-y-6" aria-label="Published program results">
          {programGroups.length > 0 ? (
            programGroups.map((group, groupIdx) => {
              const first = group.items[0]
              const second = group.items[1]
              const third = group.items[2]
              const extras = group.items.slice(3)

              return (
                <article
                  key={`${group.title}-${group.category}-${groupIdx}`}
                  className="relative overflow-hidden rounded-[2rem] bg-[#d64319] px-5 py-8 text-white shadow-2xl sm:px-10 sm:py-10"
                >
                  {/* Floating colorful open books illustration (left edge) */}
                  <div className="pointer-events-none absolute -left-3 bottom-0 top-0 hidden w-44 md:block">
                    <FlyingBooksSvg />
                  </div>

                  {/* Rainbow radial burst + dark navy oval (bottom-right corner) */}
                  <div className="pointer-events-none absolute -bottom-2 -right-2 h-44 w-44 sm:h-56 sm:w-56">
                    <RainbowEyeCornerSvg />
                  </div>

                  {/* Header: Program / Variety Serif Title + Category Badge */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 md:pl-36">
                    <h2 className="font-serif text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
                      {group.title}
                    </h2>
                    {group.category && (
                      <span className="rounded-full bg-white/20 px-4 py-1 font-hand text-xl font-bold text-[#fef08a] backdrop-blur-sm">
                        {group.category}
                      </span>
                    )}
                  </div>

                  {/* Podium Pentagon Winners (2nd left teal, 1st center elevated orange, 3rd right plum) */}
                  <div className="relative z-10 mt-6 flex flex-wrap items-end justify-center gap-5 sm:gap-8 md:pl-24 md:pr-24">
                    {/* 2nd Place (Left Teal Pentagon) */}
                    {second && (
                      <div className="flex flex-col items-center text-center">
                        <PentagonPortrait
                          photo={second.photo}
                          name={second.candidateName}
                          bgColor="#1cb5a7"
                          sizeClass="h-28 w-28 sm:h-32 sm:w-32"
                        />
                        <p className="mt-2 font-hand text-xl font-bold leading-tight text-white">
                          {second.candidateName}
                        </p>
                        <p className="text-xs font-bold text-white/90">
                          {second.admissionNo} {second.position && `• ${second.position}`} • {second.points} pts
                        </p>
                      </div>
                    )}

                    {/* 1st Place (Center Elevated Amber-Orange Pentagon) */}
                    {first && (
                      <div className="-mt-4 flex flex-col items-center text-center sm:-translate-y-4">
                        <PentagonPortrait
                          photo={first.photo}
                          name={first.candidateName}
                          bgColor="#f59e0b"
                          sizeClass="h-36 w-36 sm:h-40 sm:w-40"
                        />
                        <p className="mt-2 font-hand text-2xl font-bold leading-tight text-white">
                          {first.candidateName}
                        </p>
                        <p className="text-xs font-bold text-[#fef08a]">
                          {first.admissionNo} {first.position && `• ${first.position}`} • {first.points} pts
                        </p>
                      </div>
                    )}

                    {/* 3rd Place (Right Plum Pentagon) */}
                    {third && (
                      <div className="flex flex-col items-center text-center">
                        <PentagonPortrait
                          photo={third.photo}
                          name={third.candidateName}
                          bgColor="#9d4375"
                          sizeClass="h-28 w-28 sm:h-32 sm:w-32"
                        />
                        <p className="mt-2 font-hand text-xl font-bold leading-tight text-white">
                          {third.candidateName}
                        </p>
                        <p className="text-xs font-bold text-white/90">
                          {third.admissionNo} {third.position && `• ${third.position}`} • {third.points} pts
                        </p>
                      </div>
                    )}
                  </div>

                  {extras.length > 0 && (
                    <div className="relative z-10 mt-5 flex flex-wrap justify-center gap-2 md:pl-24 md:pr-24">
                      {extras.map((ex) => (
                        <span
                          key={ex.id}
                          className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-white"
                        >
                          {ex.candidateName} ({ex.admissionNo}) • {ex.position || 'Participant'} • {ex.points} pts
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              )
            })
          ) : (
            <div className="rounded-[2rem] bg-[#d64319] p-10 text-center text-white shadow-xl">
              <p className="font-hand text-3xl font-bold">No results in {selectedCategory} yet</p>
              <p className="mt-1 text-sm text-white/85">
                Results published by the admin under {selectedCategory} will appear here automatically.
              </p>
            </div>
          )}
        </section>

        {/* ============================================================
            DOWN SECTION: Toppers & Team Leaderboard Showcase (Image 1 model)
           ============================================================ */}
        <section
          className="relative mt-10 overflow-hidden rounded-3xl border-b-2 border-l-2 border-r-2 border-slate-700/70 bg-[#fbf8f2]/90 px-4 pb-24 pt-8 shadow-sm sm:px-8"
          aria-label="Category toppers and team leaderboard"
        >
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Left Side (7 cols): Pentagon Toppers */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between">
                <h2 className="font-hand text-2xl font-bold text-slate-800 sm:text-3xl">Category Toppers</h2>
                <button
                  onClick={() => setShowAllToppers((v) => !v)}
                  className="rounded-full bg-[#f97316] px-4 py-1 text-xs font-bold text-white shadow hover:bg-[#ea580c]"
                >
                  {showAllToppers ? 'Show featured' : 'View all'}
                </button>
              </div>

              {/* Image 1 Pentagon Grid Layout: Thaniya, Ula, Bidaya + Large Overall */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-8">
                {/* THANIYA Topper */}
                <div className="relative flex flex-col items-center">
                  <span className="-mb-3 -ml-14 -rotate-[32deg] font-hand text-lg font-extrabold tracking-wide text-[#292524]">
                    THĀNIYA
                  </span>
                  <PentagonPortrait
                    photo={topperThaniya?.photo}
                    name={topperThaniya?.name || 'Thaniya'}
                    bgColor="#f97316"
                    sizeClass="h-28 w-28 sm:h-32 sm:w-32"
                  />
                  <p className="mt-1.5 font-hand text-lg font-bold text-slate-800">
                    {topperThaniya ? `${topperThaniya.name} (${topperThaniya.points})` : 'No result yet'}
                  </p>
                </div>

                {/* ULA Topper */}
                <div className="relative flex flex-col items-center">
                  <span className="-mb-3 -ml-14 -rotate-[32deg] font-hand text-lg font-extrabold tracking-wide text-[#292524]">
                    ŪLĀ
                  </span>
                  <PentagonPortrait
                    photo={topperUla?.photo}
                    name={topperUla?.name || 'Ula'}
                    bgColor="#9d4375"
                    sizeClass="h-28 w-28 sm:h-32 sm:w-32"
                  />
                  <p className="mt-1.5 font-hand text-lg font-bold text-slate-800">
                    {topperUla ? `${topperUla.name} (${topperUla.points})` : 'No result yet'}
                  </p>
                </div>

                {/* OVERALL Large Teal Pentagon with thin orange outer line */}
                <div className="relative flex flex-col items-center">
                  <span className="-mb-4 -ml-20 -rotate-[32deg] font-hand text-2xl font-extrabold tracking-wide text-[#292524]">
                    overall
                  </span>
                  <div className="relative p-1.5">
                    <svg
                      viewBox="0 0 100 100"
                      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                      aria-hidden
                    >
                      <polygon
                        points="50,1 99,37 80.5,99 19.5,99 1,37"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2.2"
                      />
                    </svg>
                    <PentagonPortrait
                      photo={topperOverall?.photo}
                      name={topperOverall?.name || 'Overall'}
                      bgColor="#1cb5a7"
                      sizeClass="h-40 w-40 sm:h-44 sm:w-44"
                    />
                  </div>
                  <p className="mt-1.5 font-hand text-xl font-bold text-slate-900">
                    {topperOverall ? `${topperOverall.name} (${topperOverall.points} pts)` : 'Awaiting topper'}
                  </p>
                </div>

                {/* BIDAYA Topper */}
                <div className="relative flex flex-col items-center">
                  <span className="-mb-3 -ml-14 -rotate-[32deg] font-hand text-lg font-extrabold tracking-wide text-[#292524]">
                    BIDĀYAH
                  </span>
                  <PentagonPortrait
                    photo={topperBidaya?.photo}
                    name={topperBidaya?.name || 'Bidaya'}
                    bgColor="#1cb5a7"
                    sizeClass="h-28 w-28 sm:h-32 sm:w-32"
                  />
                  <p className="mt-1.5 font-hand text-lg font-bold text-slate-800">
                    {topperBidaya ? `${topperBidaya.name} (${topperBidaya.points})` : 'No result yet'}
                  </p>
                </div>
              </div>

              {/* Optional expanded list when View All Toppers is clicked */}
              {showAllToppers && allOverallToppers.length > 0 && (
                <ol className="mt-6 grid gap-2 sm:grid-cols-2">
                  {allOverallToppers.map((t, i) => (
                    <li
                      key={`${t.admissionNo}-${t.name}-${i}`}
                      className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-white px-3 py-2 shadow-sm"
                    >
                      <span className="font-hand text-xl font-bold text-[#e64e24]">#{i + 1}</span>
                      {t.photo ? (
                        <img src={t.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm">👤</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{t.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {t.team} {t.category && `• ${t.category}`}
                        </p>
                      </div>
                      <span className="font-serif text-sm font-bold text-[#dc2626]">{t.points} pts</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Right Side (5 cols): Team Leaderboard with golden teardrop badges & red-outlined cards */}
            <div className="lg:col-span-5">
              <div className="flex items-center justify-between">
                <h2 className="font-hand text-2xl font-bold text-slate-800 sm:text-3xl">Team Points</h2>
                <button
                  onClick={() => setShowAllTeams((v) => !v)}
                  className="rounded-full bg-[#f97316] px-4 py-1 text-xs font-bold text-white shadow hover:bg-[#ea580c]"
                >
                  {showAllTeams ? 'Top 5' : 'View all'}
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {visibleTeams.map((b, idx) => (
                  <div
                    key={b.team}
                    className="relative flex items-center justify-between rounded-2xl border border-[#dc2626]/70 bg-white/95 py-3 pl-5 pr-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-10 items-center justify-center rounded-[55%_45%_60%_40%/60%_50%_50%_40%] bg-[#facc15] font-hand text-lg font-extrabold text-slate-900 shadow-sm"
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-hand text-xl font-bold uppercase tracking-wide text-[#292524] sm:text-2xl">
                        {b.team}
                      </span>
                    </div>
                    <span className="font-serif text-2xl font-extrabold text-[#dc2626]">{b.points}</span>
                  </div>
                ))}
                {!visibleTeams.length && (
                  <p className="rounded-2xl border border-dashed border-orange-300 bg-white/70 p-4 text-center text-sm text-slate-600">
                    No team scores in {selectedCategory} yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Green Hill, Bright Magenta Tree & Result Published Milestone Marker (Image 1 bottom artwork) */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-center">
            <svg viewBox="0 0 900 130" className="h-24 w-full sm:h-28" preserveAspectRatio="none" aria-hidden>
              <path
                d="M0 130 L0 105 Q120 75 230 98 T480 86 T720 108 T900 94 L900 130 Z"
                fill="#84cc16"
                opacity="0.7"
              />
              <path
                d="M0 130 L0 118 Q180 95 360 112 T680 98 T900 120 L900 130 Z"
                fill="#4d7c0f"
              />
            </svg>

            {/* Center Milestone Tree + Result Published Stone */}
            <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-end gap-2">
              <svg viewBox="0 0 70 115" className="h-24 w-14 sm:h-28" aria-hidden>
                <path d="M35 112 L35 28 M35 76 L16 42 M35 60 L54 34 M35 44 L22 24" stroke="#e11d48" strokeWidth="7" strokeLinecap="round" fill="none" />
              </svg>

              <div className="mb-1 flex w-20 flex-col items-center overflow-hidden rounded-t-3xl border-2 border-slate-700 bg-white shadow">
                <div className="w-full bg-[#facc15] py-1 text-center text-[9px] font-extrabold leading-tight text-slate-900">
                  Result
                  <br />
                  Published
                </div>
                <div className="my-1.5 flex h-11 w-11 flex-col items-center justify-center rounded-full border border-slate-700 text-center">
                  <span className="text-xs font-extrabold leading-none text-[#dc2626]">{data.results.length}</span>
                  <span className="my-0.5 h-[1px] w-7 bg-slate-700" />
                  <span className="text-xs font-bold leading-none text-slate-800">{totalProgramTarget}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
