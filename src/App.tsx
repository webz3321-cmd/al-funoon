import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Pencil } from 'lucide-react'
import Hero from './components/Hero'
import Admin from './components/Admin'
import CreativityStudio from './components/CreativityStudio'
import LaunchPage from './components/LaunchPage'
import { FestLogo } from './components/FestLogo'
import { LogoZoomIntro } from './components/LogoZoomIntro'
import { CandidatesPage, DownloadsPage, GalleryPage, ProgramsPage, ResultsPage, TeamsPage, UpdatesPage } from './components/Pages'
import { RESULT_CATEGORIES, loadData, saveData } from './lib/store'
import type { SiteData } from './lib/store'
import { subscribeFestData } from './lib/firebase'
import { ThemeSong } from './lib/audio'

type View = 'home' | 'programs' | 'results' | 'candidates' | 'teams' | 'gallery' | 'updates' | 'downloads' | 'admin'

const MENU: { id: Exclude<View, 'admin'>; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'programs', label: 'Programs' },
  { id: 'results', label: 'Results' },
  { id: 'candidates', label: 'Candidates' },
  { id: 'teams', label: 'Teams' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'updates', label: 'Updates' },
  { id: 'downloads', label: 'Downloads' },
]

function useCountdown(dateStr: string) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  return useMemo(() => {
    if (!dateStr) return null
    const target = new Date(dateStr + 'T00:00:00').getTime()
    if (!Number.isFinite(target)) return null
    const diff = target - now
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }, [dateStr, now])
}

function SingingMan({ noteTint = 'text-[#d9f99d]' }: { noteTint?: string }) {
  return (
    <div className="anim-pop relative flex flex-col items-center select-none" aria-label="Singing along character">
      {/* Floating musical notes */}
      <span className="anim-note pointer-events-none absolute left-0 top-6 text-sm font-bold text-white drop-shadow" aria-hidden>
        ♪
      </span>
      <span
        className={`anim-note pointer-events-none absolute right-2 top-0 text-base font-bold drop-shadow ${noteTint}`}
        style={{ animationDelay: '.55s' }}
        aria-hidden
      >
        ♫
      </span>
      <span
        className={`anim-note pointer-events-none absolute right-0 top-12 text-xs font-bold drop-shadow ${noteTint}`}
        style={{ animationDelay: '1.1s' }}
        aria-hidden
      >
        ♪
      </span>

      <svg viewBox="0 0 130 142" className="anim-sway h-28 w-28 overflow-visible drop-shadow-md sm:h-32 sm:w-32">
        {/* dark blue legs */}
        <line x1="50" y1="95" x2="43" y2="128" stroke="#1e3a6d" strokeWidth="10.5" strokeLinecap="round" />
        <line x1="68" y1="95" x2="73" y2="128" stroke="#1e3a6d" strokeWidth="10.5" strokeLinecap="round" />
        {/* black shoes */}
        <ellipse cx="40" cy="130" rx="9" ry="4.5" fill="#1e293b" />
        <ellipse cx="75" cy="130" rx="9" ry="4.5" fill="#1e293b" />

        {/* raised left arm */}
        <path d="M 44 56 L 23 27" stroke="#8a542c" strokeWidth="9.5" strokeLinecap="round" />

        {/* orange-red tunic shirt + sleeves */}
        <path d="M 38 50 L 30 44 L 40 36 L 52 46 Z" fill="#ea580c" />
        <path d="M 39 46 Q 58 40 77 46 L 79 84 Q 77 101 58 101 Q 39 101 39 84 Z" fill="#ea580c" />

        {/* bright lime-green curved neck scarf / collar ribbons */}
        <path d="M 43 56 Q 68 58 94 42" fill="none" stroke="#a3e635" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M 43 60 Q 65 62 84 51" fill="none" stroke="#84cc16" strokeWidth="4" strokeLinecap="round" />

        {/* head + black rounded hair cap */}
        <circle cx="58" cy="30" r="15.5" fill="#8a542c" />
        <path d="M 42.5 27 C 44 10 72 10 73.5 27 C 64 24 52 24 42.5 27 Z" fill="#1e1b18" />

        {/* cheek accents */}
        <circle cx="46" cy="34" r="2.2" fill="#ea580c" opacity="0.85" />
        <circle cx="69" cy="34" r="2.2" fill="#ea580c" opacity="0.85" />

        {/* animated singing mouth */}
        <ellipse cx="58" cy="36" rx="4.8" ry="3.8" fill="#7f1d1d" className="anim-sing-mouth" />

        {/* handheld microphone right by mouth */}
        <g className="anim-mic-groove" style={{ transformOrigin: '76px 52px' }}>
          <line x1="77" y1="50" x2="66" y2="39" stroke="#1e293b" strokeWidth="3.6" strokeLinecap="round" />
          <circle cx="63" cy="36" r="6" fill="#334155" stroke="#cbd5e1" strokeWidth="1.5" />
        </g>

        {/* curved sound wave arcs */}
        <g className="anim-sound-wave" stroke="#dbeafe" strokeWidth="1.8" fill="none" strokeLinecap="round">
          <path d="M 74 26 Q 82 35 76 44" opacity="0.9" />
          <path d="M 80 23 Q 89 35 82 47" opacity="0.55" />
        </g>
      </svg>

      {/* "singing along!" charcoal pill badge */}
      <span className="-mt-2 whitespace-nowrap rounded-full bg-[#1e293b] px-3 py-0.5 font-hand text-sm font-bold italic text-[#fde047] shadow-lg">
        singing along!
      </span>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState<SiteData>(() => loadData())
  const [view, setView] = useState<View>(() => (window.location.hash === '#admin' ? 'admin' : 'home'))
  const [menuOpen, setMenuOpen] = useState(false)
  const [studioOpen, setStudioOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const songRef = useRef<ThemeSong | null>(null)
  const [syncError, setSyncError] = useState<Error | null>(null)
  const countdown = useCountdown(data.settings.date)

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#admin') setView('admin')
      else setView((cur) => (cur === 'admin' ? 'home' : cur))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    return subscribeFestData(setData, (err) => setSyncError(err))
  }, [])
  useEffect(() => {
    const hasRecords =
      data.programs.length +
        data.candidates.length +
        data.teams.length +
        data.results.length +
        data.gallery.length +
        data.updates.length +
        data.downloads.length >
      0
    if (hasRecords) saveData(data)
  }, [data])
  useEffect(() => () => { songRef.current?.stop() }, [])

  if (syncError) throw syncError

  const toggleSong = () => {
    songRef.current ??= new ThemeSong()
    if (playing) { songRef.current.stop(); setPlaying(false) }
    else { songRef.current.start(s.themeSongUrl); setPlaying(true) }
  }

  const go = (v: View) => {
    setView(v)
    setMenuOpen(false)
    if (v === 'admin') {
      if (window.location.hash !== '#admin') window.history.replaceState(null, '', '#admin')
    } else if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    window.scrollTo({ top: 0 })
  }
  const s = data.settings

  if (view === 'admin') {
    return <Admin data={data} onClose={() => go('home')} onNavigate={(v) => go(v)} />
  }

  // Launch page (admin-controlled, default OFF)
  if (s.launchEnabled && !launched) {
    return <LaunchPage programName={s.programName} onLaunch={() => setLaunched(true)} />
  }

  const stats = [
    { label: 'PROGRAMS', value: data.programs.length, shape: 'rounded-[56%_44%_48%_52%/58%_48%_52%_42%]' },
    { label: 'CANDIDATES', value: data.candidates.length, shape: 'rounded-[48%_52%_54%_46%/52%_58%_42%_48%]' },
    { label: 'CATEGORIES', value: RESULT_CATEGORIES.length, shape: 'rounded-[52%_48%_44%_56%/46%_54%_46%_54%]' },
    { label: 'RESULTS OUT', value: data.results.length, shape: 'rounded-[46%_54%_52%_48%/54%_46%_54%_46%]' },
  ]

  return (
    <div className="min-h-screen bg-[#fdf6e3]">
      {showIntro && <LogoZoomIntro onComplete={() => setShowIntro(false)} />}

      {/* round Menu button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed right-4 top-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#e64e24] font-hand text-xl font-bold italic text-white shadow-xl transition-transform hover:scale-105"
        aria-label="Open menu"
      >
        Menu
      </button>

      {/* Menu panel — small rounded deep-blue box, Sibaq-style */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-[#0f2a6b]/70" onClick={() => setMenuOpen(false)} />
          <div className="anim-pop absolute right-3 top-3 w-72 rounded-3xl bg-[#1d4ed8] p-5 text-white shadow-2xl md:right-6">
            <div className="flex justify-end"><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div>
            <nav className="mt-2 space-y-1">
              {MENU.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => go(m.id)}
                  className={`flex w-full items-baseline gap-3 rounded-xl px-3 py-2 text-left font-hand text-2xl hover:bg-white/10 ${view === m.id ? 'text-lime-400 underline' : ''}`}
                >
                  <span className="text-base">0{i + 1}</span><span>{m.label.toUpperCase()}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {view === 'home' && (
        <>
          <Hero programName={s.programName} themeLine={s.themeLine} />

          {/* countdown in lantern bubbles */}
          {s.showCountdown && countdown && (
            <section className="bg-[#0f766e] py-8 text-center text-white">
              <p className="font-hand text-3xl">Countdown to the fest</p>
              <div className="mt-3 flex justify-center gap-3">
                {[['Days', countdown.days], ['Hours', countdown.hours], ['Minutes', countdown.minutes], ['Seconds', countdown.seconds]].map(([label, v]) => (
                  <div key={label} className="rounded-full border-2 border-white/40 bg-white/10 px-4 py-3">
                    <p className="text-2xl font-bold">{v}</p>
                    <p className="text-xs">{label}</p>
                  </div>
                ))}
              </div>
              {(s.date || s.venue) && <p className="mt-3 text-white/80">{s.date} {s.time && `• ${s.time}`} {s.venue && `• ${s.venue}`}</p>}
            </section>
          )}

          {/* welcome to the garden / About the Fest */}
          <section className="relative overflow-hidden bg-gradient-to-b from-[#e6efd7] via-[#d7e6c4] to-[#cce0b8] px-4 pb-28 pt-16 text-center sm:pb-32 sm:pt-20">
            <div className="relative z-10 mx-auto max-w-4xl">
              <p className="font-hand -rotate-1 text-2xl font-bold italic text-[#e65224] sm:text-3xl">
                welcome to the garden
              </p>
              <h2 className="mt-1 font-serif text-4xl font-bold tracking-tight text-[#1a2332] sm:text-5xl">
                About the Fest
              </h2>
              {s.institutionName && (
                <p className="mt-2 font-hand text-xl font-semibold text-[#556b47]">{s.institutionName}</p>
              )}

              {s.about.trim() && (
                <p className="mx-auto mt-6 max-w-2xl font-hand text-2xl italic leading-snug text-[#344354] sm:text-[1.65rem]">
                  {s.about}
                </p>
              )}

              <div className="mt-10 flex flex-wrap items-center justify-center gap-5 sm:gap-7">
                {stats.map((st) => (
                  <div
                    key={st.label}
                    className={`flex h-28 w-36 flex-col items-center justify-center bg-[#7b946a] text-white shadow-sm transition-transform hover:scale-105 sm:h-32 sm:w-44 ${st.shape}`}
                  >
                    <p className="font-serif text-3xl font-bold leading-none sm:text-4xl">{st.value}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/95">
                      {st.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* soft wavy sage-green hill at bottom */}
            <svg
              viewBox="0 0 1440 90"
              preserveAspectRatio="none"
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 w-full sm:h-14"
              aria-hidden
            >
              <path
                d="M0,48 C220,12 420,72 720,42 C1020,14 1240,66 1440,32 L1440,90 L0,90 Z"
                fill="#789468"
              />
            </svg>
          </section>

          {/* Creativity Corner */}
          <section className="relative overflow-hidden bg-gradient-to-b from-[#ea8b3b] via-[#df6226] to-[#d94d20] px-4 py-16 text-center text-white sm:py-24">
            {/* faint background swirl bottom-left + tiny sparkle bottom-right */}
            <svg viewBox="0 0 60 60" className="pointer-events-none absolute bottom-4 left-12 w-12 opacity-20" aria-hidden>
              <path
                d="M30 30 C33 26 38 30 35 35 C31 41 21 39 19 31 C17 20 29 12 40 17 C51 22 50 40 38 48 C25 55 10 45 10 30"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="pointer-events-none absolute bottom-3 right-[38%] text-sm text-[#fde68a]/60" aria-hidden>
              ✦
            </span>

            <div className="relative z-10 mx-auto max-w-xl">
              <h2 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Creativity Corner
              </h2>

              {/* Centerpiece: big sticker-outlined tilted pencil (+ SingingMan when theme song plays) */}
              <div className="mt-8 flex items-center justify-center gap-6">
                <button
                  onClick={() => setStudioOpen(true)}
                  className="group transition-transform hover:scale-105"
                  aria-label="Open drawing studio"
                >
                  <svg
                    viewBox="0 0 90 190"
                    className="h-44 w-24 -rotate-[14deg] drop-shadow-xl sm:h-52 sm:w-28"
                    aria-hidden
                  >
                    {/* crisp white sticker outline */}
                    <g stroke="#ffffff" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
                      <rect x="30" y="14" width="30" height="22" rx="5" fill="#ffffff" />
                      <rect x="30" y="34" width="30" height="12" fill="#ffffff" />
                      <rect x="30" y="46" width="30" height="90" fill="#ffffff" />
                      <polygon points="30,136 60,136 45,174" fill="#ffffff" />
                    </g>
                    {/* pink eraser */}
                    <rect x="30" y="14" width="30" height="22" rx="5" fill="#f472b6" />
                    <rect x="34" y="16" width="8" height="18" rx="2" fill="#f9a8d4" opacity="0.6" />
                    {/* gold ferrule */}
                    <rect x="30" y="34" width="30" height="12" fill="#e2a84b" />
                    <line x1="37" y1="34" x2="37" y2="46" stroke="#b47b22" strokeWidth="1.8" />
                    <line x1="45" y1="34" x2="45" y2="46" stroke="#b47b22" strokeWidth="1.8" />
                    <line x1="53" y1="34" x2="53" y2="46" stroke="#b47b22" strokeWidth="1.8" />
                    {/* striped reddish-brown wooden barrel */}
                    <rect x="30" y="46" width="30" height="90" fill="#8c3114" />
                    <rect x="38" y="46" width="14" height="90" fill="#a84320" />
                    <rect x="43" y="46" width="4" height="90" fill="#c25934" />
                    {/* cream wood cone */}
                    <polygon points="30,136 60,136 45,174" fill="#fde6c4" />
                    <polygon points="45,136 60,136 45,174" fill="#f5d0a1" opacity="0.7" />
                    {/* graphite tip */}
                    <polygon points="39,159 51,159 45,174" fill="#1e293b" />
                  </svg>
                </button>

                {playing && <SingingMan />}
              </div>

              <p className="mt-7 font-hand text-2xl font-bold italic text-[#fef3c7] sm:text-[1.75rem]">
                press play on the theme song — a singer pops in here to sing along!
              </p>

              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/95">
                This is where the pencil lives. Tap it open and the fest scene itself becomes your
                canvas — write and draw right over it with the pencil, eraser and fill bucket, then
                Export it as a poster with your name on it.
              </p>

              <button
                onClick={() => setStudioOpen(true)}
                className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-base font-bold text-[#c2410c] shadow-lg transition-transform hover:scale-105"
              >
                <Pencil size={17} />
                <span>Start creating</span>
              </button>

              <p className="mt-6 font-hand text-2xl font-bold italic text-[#fde68a]">
                make your magic, your way
              </p>
            </div>
          </section>

          <footer className="bg-[#0f2a6b] px-4 py-8 text-center text-white">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 p-1.5 shadow-md">
              <FestLogo className="h-full w-full" />
            </div>
            <p className="font-hand text-3xl">MAKE YOUR MAGIC</p>
            {s.institutionName && <p className="mt-1">{s.institutionName}</p>}
            {s.venue && <p className="text-white/70">{s.venue}</p>}
            <p className="mt-2 text-sm text-white/50">© Institution Program Website — made with MAKE YOUR MAGIC</p>
          </footer>
        </>
      )}

      {view === 'programs' && <ProgramsPage data={data} onHome={() => go('home')} />}
      {view === 'results' && <ResultsPage data={data} onHome={() => go('home')} />}
      {view === 'candidates' && <CandidatesPage data={data} onHome={() => go('home')} />}
      {view === 'teams' && <TeamsPage data={data} onHome={() => go('home')} />}
      {view === 'gallery' && <GalleryPage data={data} onHome={() => go('home')} />}
      {view === 'updates' && <UpdatesPage data={data} onHome={() => go('home')} />}
      {view === 'downloads' && <DownloadsPage data={data} onHome={() => go('home')} />}

      {/* Theme Song circular button + popup singing character directly above it when playing */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col items-center">
        {playing && (
          <div className="pointer-events-none mb-2">
            <SingingMan noteTint="text-[#93c5fd]" />
          </div>
        )}

        <button
          onClick={toggleSong}
          aria-label={playing ? 'Pause theme song' : 'Play theme song'}
          className="group relative flex flex-col items-center justify-center rounded-full bg-[#1e293b]/55 px-2.5 pb-1.5 pt-2 backdrop-blur-[3px] shadow-2xl ring-1 ring-white/15 transition-transform hover:scale-105"
        >
          {/* Floating white musical notes around the symbol */}
          <span
            className="pointer-events-none absolute -top-2 right-1 text-[11px] font-bold text-white/90 drop-shadow"
            aria-hidden
          >
            ♫
          </span>
          <span
            className="pointer-events-none absolute -bottom-2 left-2 text-[11px] font-bold text-white/85 drop-shadow"
            aria-hidden
          >
            ♪
          </span>

          {/* Coral gradient circle + hand-drawn wavy white outline + bright yellow Play/Pause icon */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-[#e8532a] via-[#ed6d4f] to-[#eb8c82] shadow-inner sm:h-14 sm:w-14">
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
              <path
                d="M 50 7 C 66 5 83 14 90 29 C 96 44 93 62 85 76 C 75 90 57 95 41 92 C 24 89 11 77 8 60 C 5 43 13 25 25 15 C 34 8 42 8 50 7 Z"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="2.4"
              />
              {playing ? (
                <g fill="#ffd000">
                  <rect x="37" y="34" width="9" height="32" rx="2.5" />
                  <rect x="54" y="34" width="9" height="32" rx="2.5" />
                </g>
              ) : (
                <polygon points="40,32 40,68 71,50" fill="#ffd000" stroke="#ffd000" strokeWidth="2" strokeLinejoin="round" />
              )}
            </svg>
          </div>

          <span className="mt-0.5 whitespace-nowrap font-hand text-[11px] font-bold leading-none text-white/95 drop-shadow">
            {playing ? 'Pause Themesong' : 'Play Themesong'}
          </span>
        </button>
      </div>

      {/* tilted pencil + "create!" pill, fixed bottom-right */}
      {(view === 'home' || view === 'results') && (
        <button
          onClick={() => setStudioOpen(true)}
          className="group fixed bottom-5 right-3 z-40 flex flex-col items-center transition-transform hover:scale-105"
          aria-label="Open drawing studio"
        >
          <span className="anim-sparkle pointer-events-none absolute -left-5 top-5 text-base text-[#e5c158]" aria-hidden>
            ✦
          </span>
          <span
            className="anim-sparkle pointer-events-none absolute -right-1 bottom-6 text-lg text-white"
            style={{ animationDelay: '.8s' }}
            aria-hidden
          >
            ✦
          </span>
          <svg viewBox="0 0 64 80" className="w-10 rotate-[24deg] drop-shadow-md sm:w-12" aria-hidden>
            <rect x="24" y="4" width="16" height="11" rx="3" fill="#ec4899" />
            <rect x="24" y="13" width="16" height="6" fill="#cbd5e1" />
            <rect x="24" y="19" width="16" height="40" fill="#ea580c" />
            <rect x="29" y="19" width="6" height="40" fill="#fb923c" />
            <polygon points="24,59 40,59 32,76" fill="#fed7aa" />
            <polygon points="29,70 35,70 32,76" fill="#1e293b" />
          </svg>
          <span className="-mt-1.5 rounded-full bg-[#1f2937] px-3 py-0.5 font-hand text-sm font-bold italic text-[#fde047] shadow-lg">
            create!
          </span>
        </button>
      )}

      {/* gold admin dot */}
      <button
        onClick={() => go('admin')}
        className="fixed bottom-1 right-1 z-50 h-3 w-3 rounded-full bg-yellow-400 shadow ring-1 ring-yellow-200 transition-transform hover:scale-125"
        aria-label="Open admin panel"
        title="Admin Panel"
      />

      {studioOpen && <CreativityStudio onClose={() => setStudioOpen(false)} />}
    </div>
  )
}
