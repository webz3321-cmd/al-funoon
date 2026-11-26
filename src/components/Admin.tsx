import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  ArrowLeft,
  Calendar,
  Check,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Megaphone,
  Pencil,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sliders,
  Trash2,
  Trophy,
  UploadCloud,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import {
  addCandidateToFirestore,
  addDownloadToFirestore,
  addGalleryToFirestore,
  addProgramToFirestore,
  addResultToFirestore,
  addTeamToFirestore,
  addUpdateToFirestore,
  checkIsAdmin,
  deleteCandidateFromFirestore,
  deleteDownloadFromFirestore,
  deleteGalleryFromFirestore,
  deleteProgramFromFirestore,
  deleteResultFromFirestore,
  deleteTeamFromFirestore,
  deleteUpdateFromFirestore,
  getAdminSecurityFromFirestore,
  importLocalDataToFirestore,
  saveAdminSecurityToFirestore,
  saveSettingsToFirestore,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeAuth,
  updateCandidateInFirestore,
  updateDownloadInFirestore,
  updateGalleryInFirestore,
  updateProgramInFirestore,
  updateResultInFirestore,
  updateTeamInFirestore,
  updateUpdateInFirestore,
} from '../lib/firebase'
import {
  RESULT_CATEGORIES,
  createSaltedPassRecord,
  loadData,
  saveLocalPassRecord,
  teamPoints,
  toppers,
  verifyPasscodeAgainstRecord,
} from '../lib/store'
import type {
  AdminPassRecord,
  Candidate,
  DownloadItem,
  GalleryItem,
  Program,
  ResultCategory,
  ResultItem,
  SiteData,
  Team,
  UpdateItem,
} from '../lib/store'

export type PublicView = 'home' | 'programs' | 'results' | 'candidates' | 'teams' | 'gallery' | 'updates' | 'downloads'
type Tab = 'overview' | 'settings' | 'programs' | 'results' | 'candidates' | 'teams' | 'gallery' | 'updates' | 'downloads' | 'security'

/** Compress uploaded image files to fit cleanly inside Firestore document byte/char limits. */
function compressImageFile(file: File, maxDim: number, quality = 0.8, maxChars = 340000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read selected image file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Unsupported or corrupted image format. Please pick a JPG, PNG, or WebP file.'))
      img.onload = () => {
        let dim = maxDim
        let q = quality
        for (let attempt = 0; attempt < 6; attempt++) {
          const scale = Math.min(1, dim / Math.max(img.width || 1, img.height || 1))
          const w = Math.max(1, Math.round((img.width || 1) * scale))
          const h = Math.max(1, Math.round((img.height || 1) * scale))
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas compression unavailable in this browser.'))
            return
          }
          ctx.drawImage(img, 0, 0, w, h)
          const dataUrl = canvas.toDataURL('image/jpeg', q)
          if (dataUrl.length <= maxChars || attempt === 5) {
            resolve(dataUrl)
            return
          }
          q = Math.max(0.42, q - 0.12)
          dim = Math.max(200, Math.round(dim * 0.78))
        }
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function parseErr(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  try {
    const parsed = JSON.parse(msg) as { error?: string }
    if (parsed.error) return parsed.error
  } catch {
    // not JSON
  }
  return msg
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e64e24] focus:outline-none focus:ring-2 focus:ring-[#e64e24]/15'

const cardCls = 'rounded-xl border border-slate-200 bg-white p-5'

type RunAction = (fn: () => Promise<void>, okMsg?: string) => Promise<void>

export default function Admin({
  data,
  onClose,
  onNavigate,
}: {
  data: SiteData
  onClose: () => void
  onNavigate?: (view: PublicView) => void
}) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState<Tab>('overview')

  // Passcode gate state (prompts whenever Admin panel opens)
  const [passcodeUnlocked, setPasscodeUnlocked] = useState(false)
  const [passInput, setPassInput] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [passErr, setPassErr] = useState('')
  const [passBusy, setPassBusy] = useState(false)
  const [failedTries, setFailedTries] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [remotePass, setRemotePass] = useState<AdminPassRecord | null>(null)
  const [remotePassLoaded, setRemotePassLoaded] = useState(false)

  const unlockedRef = useRef(false)
  const pendingEnteredPassRef = useRef('')

  useEffect(() => {
    unlockedRef.current = passcodeUnlocked
  }, [passcodeUnlocked])

  useEffect(() => {
    if (lockUntil <= Date.now()) return
    const timer = window.setInterval(() => {
      const t = Date.now()
      setNowMs(t)
      if (t >= lockUntil) {
        setLockUntil(0)
        window.clearInterval(timer)
      }
    }, 500)
    return () => window.clearInterval(timer)
  }, [lockUntil])

  useEffect(() => {
    let active = true
    const unsub = subscribeAuth(async (u) => {
      if (!active) return
      setUser(u)
      if (!u) {
        setIsAdmin(false)
        setAuthLoading(false)
        return
      }
      try {
        const ok = await checkIsAdmin(u)
        if (active) setIsAdmin(ok)
      } catch {
        if (active) setIsAdmin(false)
      } finally {
        if (active) setAuthLoading(false)
      }
    })
    return () => {
      active = false
      unsub()
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!user || !isAdmin) {
      setRemotePass(null)
      setRemotePassLoaded(false)
      return
    }
    void (async () => {
      try {
        const rec = await getAdminSecurityFromFirestore()
        if (!active) return
        setRemotePass(rec)
        setRemotePassLoaded(true)
        if (rec) saveLocalPassRecord(rec)
        if (unlockedRef.current && rec && pendingEnteredPassRef.current) {
          const ok = await verifyPasscodeAgainstRecord(pendingEnteredPassRef.current, rec)
          if (!active) return
          if (!ok) {
            setPasscodeUnlocked(false)
            setPassErr('Enter your updated admin password to continue.')
          }
          pendingEnteredPassRef.current = ''
        }
      } catch {
        if (active) setRemotePassLoaded(true)
      }
    })()
    return () => {
      active = false
    }
  }, [user, isAdmin])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const handleUnlockPasscode = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    if (now < lockUntil) {
      setNowMs(now)
      return
    }
    if (!passInput) {
      setPassErr('Enter your passcode.')
      return
    }
    setPassErr('')
    setPassBusy(true)
    try {
      const authoritativeRecord = user && isAdmin && remotePassLoaded ? remotePass : undefined
      const ok = await verifyPasscodeAgainstRecord(passInput, authoritativeRecord)
      if (!ok) {
        const nextTries = failedTries + 1
        if (nextTries >= 5) {
          const until = Date.now() + 15000
          setFailedTries(0)
          setNowMs(Date.now())
          setLockUntil(until)
          setPassErr('Too many incorrect attempts. Please wait 15 seconds.')
        } else {
          setFailedTries(nextTries)
          setPassErr('Incorrect passcode. Please try again.')
        }
        return
      }
      pendingEnteredPassRef.current = user && isAdmin && remotePassLoaded ? '' : passInput
      setPassInput('')
      setPassErr('')
      setFailedTries(0)
      setPasscodeUnlocked(true)
    } finally {
      setPassBusy(false)
    }
  }

  const handleLogin = async () => {
    setErr('')
    setBusy(true)
    try {
      await signInAdminWithGoogle()
    } catch (e) {
      setErr(parseErr(e))
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = async () => {
    setErr('')
    pendingEnteredPassRef.current = ''
    setPasscodeUnlocked(false)
    await signOutAdmin()
  }

  const handleLock = () => {
    pendingEnteredPassRef.current = ''
    setPassInput('')
    setPassErr('')
    setPasscodeUnlocked(false)
  }

  const runAction: RunAction = async (fn, okMsg) => {
    setErr('')
    setNotice('')
    setBusy(true)
    try {
      await fn()
      if (okMsg) setNotice(okMsg)
    } catch (e) {
      setErr(parseErr(e))
    } finally {
      setBusy(false)
    }
  }

  const cooldownSec = Math.max(0, Math.ceil((lockUntil - nowMs) / 1000))

  if (!passcodeUnlocked) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <span className="font-serif text-lg font-bold tracking-tight text-slate-900">MAKE YOUR MAGIC · Admin</span>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            <span>Back to Website</span>
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center p-6">
          <form onSubmit={(e) => void handleUnlockPasscode(e)} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e64e24]/10 text-[#e64e24]">
                <Lock size={20} />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-slate-900">Admin Passcode</h1>
                <p className="text-xs text-slate-500">Enter passcode to open the control center</p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-xs font-semibold text-slate-700">
                Passcode / Password
                <div className="relative mt-1.5">
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoFocus
                    autoComplete="current-password"
                    className={`${inputCls} pr-10 font-mono tracking-widest`}
                    placeholder="Enter passcode"
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    disabled={passBusy || cooldownSec > 0}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                    aria-label={showPass ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            {passErr && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {cooldownSec > 0 ? `Too many attempts. Try again in ${cooldownSec}s.` : passErr}
              </p>
            )}

            <button
              type="submit"
              disabled={passBusy || cooldownSec > 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#e64e24] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#cf4018] disabled:opacity-50"
            >
              {passBusy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              <span>{cooldownSec > 0 ? `Locked (${cooldownSec}s)` : 'Unlock Admin Panel'}</span>
            </button>
          </form>
        </main>
      </div>
    )
  }

  if (authLoading || (user && isAdmin && !remotePassLoaded)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-900">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4">
          <Loader2 className="animate-spin text-[#e64e24]" size={20} />
          <span className="text-sm font-semibold">Checking Firebase admin session…</span>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <span className="font-serif text-lg font-bold tracking-tight text-slate-900">MAKE YOUR MAGIC · Admin</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLock}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Lock size={14} />
              <span>Lock</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              <span>Back to Website</span>
            </button>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8">
            <h1 className="font-serif text-2xl font-bold text-slate-900">Admin Console Sign In</h1>
            {!user ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Passcode verified. Sign in with your Google admin account to manage programs, publish results, register candidates, manage teams, and update website settings in real time.
                </p>
                {err && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
                <button
                  onClick={() => void handleLogin()}
                  disabled={busy}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#e64e24] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#cf4018] disabled:opacity-50"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                  <span>Sign in with Google</span>
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Signed in as <b className="text-slate-900">{user.email}</b>, which does not have admin permission on this database.
                </p>
                <p className="mt-2 break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-500">
                  UID: {user.uid}
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => void handleLogout()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    <LogOut size={16} />
                    <span>Switch Account</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Exit
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    )
  }

  const navItems: { id: Tab; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'settings', label: 'Website Settings', icon: <SettingsIcon size={17} /> },
    { id: 'programs', label: 'Programs', count: data.programs.length, icon: <Calendar size={17} /> },
    { id: 'results', label: 'Results', count: data.results.length, icon: <Trophy size={17} /> },
    { id: 'candidates', label: 'Candidates', count: data.candidates.length, icon: <Users size={17} /> },
    { id: 'teams', label: 'Teams', count: data.teams.length, icon: <UsersRound size={17} /> },
    { id: 'gallery', label: 'Gallery', count: data.gallery.length, icon: <ImageIcon size={17} /> },
    { id: 'updates', label: 'Updates', count: data.updates.length, icon: <Megaphone size={17} /> },
    { id: 'downloads', label: 'Downloads', count: data.downloads.length, icon: <Download size={17} /> },
    { id: 'security', label: 'Password', icon: <KeyRound size={17} /> },
  ]

  const activeNav = navItems.find((n) => n.id === tab) ?? navItems[0]

  const localBackup = loadData()
  const hasLocalToImport =
    localBackup.programs.length +
      localBackup.candidates.length +
      localBackup.teams.length +
      localBackup.results.length +
      localBackup.gallery.length >
      0 &&
    data.programs.length + data.candidates.length + data.teams.length + data.results.length === 0

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="font-serif text-lg font-bold tracking-tight text-slate-900">MAKE YOUR MAGIC</p>
          <p className="mt-0.5 text-xs text-slate-500">Admin Control Center</p>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Admin sections">
          {navItems.map((item) => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#e64e24]/10 font-semibold text-[#c23b16]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {typeof item.count === 'number' && (
                  <span className={`font-mono text-xs tabular-nums ${active ? 'text-[#c23b16]' : 'text-slate-400'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 text-xs">
          <p className="truncate font-semibold text-slate-800" title={user.email || undefined}>
            {user.email}
          </p>
          <p className="mt-0.5 text-slate-500">Firebase synced</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleLock}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              title="Lock Admin Panel"
            >
              <Lock size={13} />
              <span>Lock</span>
            </button>
            <button
              onClick={() => void handleLogout()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={13} />
              <span>Sign out</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft size={13} />
            <span>View Live Website</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={onClose}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 lg:hidden"
              >
                <ArrowLeft size={14} />
                <span>Site</span>
              </button>
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <span className="hidden text-slate-400 sm:inline">Admin</span>
                <span className="hidden text-slate-300 sm:inline">/</span>
                <h1 className="truncate font-serif text-xl font-bold text-slate-900">{activeNav.label}</h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              {busy && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Loader2 size={14} className="animate-spin text-[#e64e24]" />
                  <span>Saving…</span>
                </span>
              )}
              {notice && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Check size={14} />
                  <span>{notice}</span>
                </span>
              )}
              <button
                onClick={() => setTab('security')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <KeyRound size={14} />
                <span className="hidden sm:inline">Change Password</span>
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
              >
                <ExternalLink size={14} />
                <span>View Live Website</span>
              </button>
            </div>
          </div>

          {/* Mobile/Tablet Horizontal Section Tabs */}
          <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {navItems.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                    active ? 'bg-[#e64e24] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && <span className="font-mono tabular-nums">({item.count})</span>}
                </button>
              )
            })}
          </div>
        </header>

        {/* Workspace Viewport */}
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
          {err && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{err}</span>
              <button onClick={() => setErr('')} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}

          {hasLocalToImport && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>Found earlier browser data. Want to copy it into your Firebase database?</span>
              <button
                onClick={() => void runAction(() => importLocalDataToFirestore(localBackup), 'Imported to Firebase!')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700"
              >
                <UploadCloud size={15} />
                <span>Import to Firebase</span>
              </button>
            </div>
          )}

          {tab === 'overview' && (
            <OverviewPanel data={data} runAction={runAction} busy={busy} onTab={setTab} onNavigate={onNavigate} />
          )}
          {tab === 'settings' && <SettingsForm data={data} runAction={runAction} busy={busy} />}
          {tab === 'programs' && <ProgramsForm data={data} runAction={runAction} busy={busy} />}
          {tab === 'results' && <ResultsForm data={data} runAction={runAction} busy={busy} />}
          {tab === 'candidates' && <CandidatesForm data={data} runAction={runAction} busy={busy} />}
          {tab === 'teams' && <TeamsForm data={data} runAction={runAction} busy={busy} />}
          {tab === 'gallery' && <GalleryForm data={data} runAction={runAction} busy={busy} />}
          {tab === 'updates' && <UpdatesForm data={data} runAction={runAction} busy={busy} />}
          {tab === 'downloads' && <DownloadsForm data={data} runAction={runAction} busy={busy} />}
          {tab === 'security' && (
            <SecurityForm
              remotePass={remotePass}
              runAction={runAction}
              busy={busy}
              onSaved={(rec) => {
                setRemotePass(rec)
                saveLocalPassRecord(rec)
              }}
              onLock={handleLock}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function OverviewPanel({
  data,
  runAction,
  busy,
  onTab,
  onNavigate,
}: {
  data: SiteData
  runAction: RunAction
  busy: boolean
  onTab: (t: Tab) => void
  onNavigate?: (view: PublicView) => void
}) {
  const s = data.settings
  const teamStanding = useMemo(() => teamPoints(data, 'All'), [data])
  const topList = useMemo(() => toppers(data, 'All').slice(0, 5), [data])

  const catCounts = useMemo(() => {
    const out: Record<ResultCategory, number> = { Bidaya: 0, Ula: 0, Thaniya: 0 }
    for (const r of data.results) {
      if (r.category === 'Bidaya' || r.category === 'Ula' || r.category === 'Thaniya') out[r.category] += 1
    }
    return out
  }, [data.results])

  const toggleSetting = (patch: Partial<typeof s>, label: string) => {
    void runAction(() => saveSettingsToFirestore({ ...s, ...patch }), `${label} updated`)
  }

  const kpis: { label: string; value: number; tab: Tab; publicView: PublicView }[] = [
    { label: 'Programs', value: data.programs.length, tab: 'programs', publicView: 'programs' },
    { label: 'Results Published', value: data.results.length, tab: 'results', publicView: 'results' },
    { label: 'Candidates', value: data.candidates.length, tab: 'candidates', publicView: 'candidates' },
    { label: 'Teams', value: data.teams.length, tab: 'teams', publicView: 'teams' },
  ]

  return (
    <div className="space-y-6">
      {/* 4-column KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={cardCls}>
            <p className="text-xs font-medium text-slate-500">{k.label}</p>
            <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-slate-900">{k.value}</p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <button onClick={() => onTab(k.tab)} className="font-semibold text-[#e64e24] hover:underline">
                Manage
              </button>
              {onNavigate && (
                <button onClick={() => onNavigate(k.publicView)} className="text-slate-500 hover:text-slate-900">
                  Preview page
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Site Mode Controls */}
      <section className={cardCls}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900">
              <Sliders size={18} className="text-[#e64e24]" />
              <span>Quick Website Controls</span>
            </h2>
            <p className="text-xs text-slate-500">Toggle live site features immediately in Firebase.</p>
          </div>
          <button onClick={() => onTab('settings')} className="text-xs font-semibold text-[#e64e24] hover:underline">
            Edit full fest details
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => toggleSetting({ showCountdown: !s.showCountdown }, 'Countdown banner')}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
              s.showCountdown ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Countdown Banner</p>
              <p className="text-xs text-slate-500">{s.date || 'Set fest date in Settings'}</p>
            </div>
            <span className={`font-mono text-xs font-bold ${s.showCountdown ? 'text-emerald-700' : 'text-slate-400'}`}>
              {s.showCountdown ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => toggleSetting({ gameEnabled: !s.gameEnabled }, 'Penalty game')}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
              s.gameEnabled ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Results Football Game</p>
              <p className="text-xs text-slate-500">Shown when no results exist</p>
            </div>
            <span className={`font-mono text-xs font-bold ${s.gameEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
              {s.gameEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => toggleSetting({ launchEnabled: !s.launchEnabled }, 'Launch page')}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
              s.launchEnabled ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Rocket Launch Page</p>
              <p className="text-xs text-slate-500">Intro launch curtain</p>
            </div>
            <span className={`font-mono text-xs font-bold ${s.launchEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
              {s.launchEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </section>

      {/* Two-Column Breakdown: Results Categories + Team Standings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardCls}>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-slate-900">Results by Category</h2>
            <button onClick={() => onTab('results')} className="text-xs font-semibold text-[#e64e24] hover:underline">
              Publish result
            </button>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {RESULT_CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-800">{cat}</span>
                <span className="font-mono font-semibold tabular-nums text-slate-700">{catCounts[cat]} published</span>
              </div>
            ))}
          </div>

          <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">Top Scorers</h3>
          {topList.length ? (
            <div className="mt-2 divide-y divide-slate-100">
              {topList.map((t, idx) => (
                <div key={`${t.admissionNo}-${t.name}-${idx}`} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate text-slate-800">
                    <span className="mr-2 font-mono text-xs text-slate-400">#{idx + 1}</span>
                    <b>{t.name}</b>
                    {t.team ? <span className="text-slate-500"> · {t.team}</span> : null}
                  </span>
                  <span className="ml-3 shrink-0 font-mono font-bold tabular-nums text-[#e64e24]">{t.points} pts</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No results published yet.</p>
          )}
        </section>

        <section className={cardCls}>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-slate-900">Live Team Points & Media</h2>
            <button onClick={() => onTab('teams')} className="text-xs font-semibold text-[#e64e24] hover:underline">
              Manage teams
            </button>
          </div>
          {teamStanding.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {teamStanding.map((b, i) => (
                <div key={b.team} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-slate-800">
                    <span className="mr-2 font-mono text-xs text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                    {b.team}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-slate-900">{b.points} pts</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500">Add teams and publish results to see live standings.</p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
            <button onClick={() => onTab('gallery')} className="rounded-lg bg-slate-50 p-3 hover:bg-slate-100">
              <p className="font-mono text-lg font-bold tabular-nums text-slate-900">{data.gallery.length}</p>
              <p className="text-xs text-slate-500">Gallery</p>
            </button>
            <button onClick={() => onTab('updates')} className="rounded-lg bg-slate-50 p-3 hover:bg-slate-100">
              <p className="font-mono text-lg font-bold tabular-nums text-slate-900">{data.updates.length}</p>
              <p className="text-xs text-slate-500">Updates</p>
            </button>
            <button onClick={() => onTab('downloads')} className="rounded-lg bg-slate-50 p-3 hover:bg-slate-100">
              <p className="font-mono text-lg font-bold tabular-nums text-slate-900">{data.downloads.length}</p>
              <p className="text-xs text-slate-500">Downloads</p>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <span className="mt-1.5 block font-normal">{children}</span>
    </label>
  )
}

function SettingsForm({ data, runAction, busy }: { data: SiteData; runAction: RunAction; busy: boolean }) {
  const [draft, setDraft] = useState(data.settings)
  useEffect(() => {
    setDraft(data.settings)
  }, [data.settings])

  const patch = (p: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...p }))

  return (
    <div className={cardCls}>
      <h2 className="font-serif text-xl font-bold text-slate-900">Website Identity & Fest Details</h2>
      <p className="mt-1 text-xs text-slate-500">Changes sync directly to every visitor viewing the website.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Institution name">
          <input className={inputCls} value={draft.institutionName} onChange={(e) => patch({ institutionName: e.target.value })} placeholder="Institution name" />
        </Field>
        <Field label="Program / fest name">
          <input className={inputCls} value={draft.programName} onChange={(e) => patch({ programName: e.target.value })} placeholder="e.g. Arts and Sports Programme" />
        </Field>
        <Field label="Hero theme line">
          <input className={inputCls} value={draft.themeLine} onChange={(e) => patch({ themeLine: e.target.value })} placeholder="MAKE YOUR MAGIC" />
        </Field>
        <Field label="Fest date">
          <input type="date" className={inputCls} value={draft.date} onChange={(e) => patch({ date: e.target.value })} />
        </Field>
        <Field label="Start time">
          <input className={inputCls} value={draft.time} onChange={(e) => patch({ time: e.target.value })} placeholder="e.g. 6:45 AM" />
        </Field>
        <Field label="Venue">
          <input className={inputCls} value={draft.venue} onChange={(e) => patch({ venue: e.target.value })} placeholder="Campus Auditorium" />
        </Field>
        <div className="md:col-span-2">
          <Field label="About the fest">
            <textarea className={inputCls} value={draft.about} onChange={(e) => patch({ about: e.target.value })} rows={4} placeholder="Write the welcome story for the home page..." />
          </Field>
        </div>

        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3 md:col-span-2">
          <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-3 text-sm">
            <input type="checkbox" checked={draft.showCountdown} onChange={(e) => patch({ showCountdown: e.target.checked })} />
            <span>Show countdown banner</span>
          </label>
          <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-3 text-sm">
            <input type="checkbox" checked={draft.gameEnabled} onChange={(e) => patch({ gameEnabled: e.target.checked })} />
            <span>Penalty game on empty Results</span>
          </label>
          <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-3 text-sm">
            <input type="checkbox" checked={draft.launchEnabled} onChange={(e) => patch({ launchEnabled: e.target.checked })} />
            <span>Show Launch page first</span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
        <button
          onClick={() => void runAction(() => saveSettingsToFirestore(draft), 'Settings saved!')}
          disabled={busy}
          className="rounded-lg bg-[#e64e24] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#cf4018] disabled:opacity-50"
        >
          Save Settings to Firebase
        </button>
      </div>
    </div>
  )
}

function ProgramsForm({ data, runAction, busy }: { data: SiteData; runAction: RunAction; busy: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [variety, setVariety] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [desc, setDesc] = useState('')
  const [search, setSearch] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setVariety('')
    setDate('')
    setVenue('')
    setDesc('')
  }

  const startEdit = (p: Program) => {
    setEditingId(p.id)
    setTitle(p.title)
    setVariety(p.variety)
    setDate(p.date)
    setVenue(p.venue)
    setDesc(p.description)
  }

  const submit = async () => {
    if (!title.trim()) return
    const payload = { title: title.trim(), variety, date, venue, description: desc }
    await runAction(async () => {
      if (editingId) {
        await updateProgramInFirestore(editingId, payload)
      } else {
        await addProgramToFirestore(payload)
      }
      resetForm()
    }, editingId ? 'Program updated!' : 'Program added!')
  }

  const filtered = data.programs.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return p.title.toLowerCase().includes(q) || p.variety.toLowerCase().includes(q) || p.venue.toLowerCase().includes(q)
  })

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className={`${cardCls} h-fit lg:col-span-5`}>
        <h2 className="font-serif text-lg font-bold text-slate-900">{editingId ? 'Edit Program' : 'Add Program'}</h2>
        <div className="mt-4 space-y-3">
          <Field label="Program title *">
            <input className={inputCls} placeholder="e.g. LENGUA" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Variety / category">
            <input className={inputCls} placeholder="e.g. Stage / Off-Stage" value={variety} onChange={(e) => setVariety(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Venue">
              <input className={inputCls} placeholder="Stage 1" value={venue} onChange={(e) => setVenue(e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className={inputCls} placeholder="Rules, duration or details..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </Field>
          <div className="flex gap-2 pt-1">
            <button onClick={() => void submit()} disabled={busy || !title.trim()} className="flex-1 rounded-lg bg-[#e64e24] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#cf4018] disabled:opacity-40">
              {editingId ? 'Update Program' : 'Add Program'}
            </button>
            {editingId && (
              <button onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`${cardCls} lg:col-span-7`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-slate-900">All Programs ({data.programs.length})</h2>
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-8`} placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{p.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[p.variety, p.date, p.venue].filter(Boolean).join(' · ') || 'No schedule metadata'}
                </p>
                {p.description && <p className="mt-1 text-xs text-slate-600">{p.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => startEdit(p)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit ${p.title}`}>
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => void runAction(() => deleteProgramFromFirestore(p.id), 'Program deleted')}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                  aria-label={`Delete ${p.title}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {!filtered.length && <p className="py-8 text-center text-sm text-slate-500">No programs match yet — add one on the left.</p>}
        </div>
      </div>
    </div>
  )
}

function ResultsForm({ data, runAction, busy }: { data: SiteData; runAction: RunAction; busy: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [admissionNo, setAdmissionNo] = useState('')
  const [variety, setVariety] = useState('')
  const [category, setCategory] = useState<ResultCategory>('Bidaya')
  const [team, setTeam] = useState('')
  const [points, setPoints] = useState('')
  const [position, setPosition] = useState('')
  const [filterCat, setFilterCat] = useState<ResultCategory | 'All'>('All')
  const [search, setSearch] = useState('')

  const found = data.candidates.find((c) => c.admissionNo.trim().toLowerCase() === admissionNo.trim().toLowerCase())

  const resetForm = () => {
    setEditingId(null)
    setAdmissionNo('')
    setVariety('')
    setTeam('')
    setPoints('')
    setPosition('')
  }

  const startEdit = (r: ResultItem) => {
    setEditingId(r.id)
    setAdmissionNo(r.admissionNo)
    setVariety(r.variety)
    setCategory(r.category === 'Bidaya' || r.category === 'Ula' || r.category === 'Thaniya' ? r.category : 'Bidaya')
    setTeam(r.team)
    setPoints(String(r.points))
    setPosition(r.position)
  }

  const submit = async () => {
    const editingTarget = editingId ? data.results.find((r) => r.id === editingId) : undefined
    const candidateName = found?.name ?? editingTarget?.candidateName
    const candidatePhoto = found?.photo ?? editingTarget?.photo ?? ''
    const resolvedAdm = found?.admissionNo ?? editingTarget?.admissionNo
    if (!candidateName || !resolvedAdm) return

    const payload = {
      admissionNo: resolvedAdm,
      candidateName,
      photo: candidatePhoto,
      team: team || found?.team || editingTarget?.team || '',
      variety,
      category,
      points: Number(points) || 0,
      position,
    }

    await runAction(async () => {
      if (editingId) {
        await updateResultInFirestore(editingId, payload)
      } else {
        await addResultToFirestore(payload)
      }
      resetForm()
    }, editingId ? 'Result updated!' : 'Result published!')
  }

  const filteredResults = data.results.filter((r) => {
    if (filterCat !== 'All' && r.category !== filterCat) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      r.candidateName.toLowerCase().includes(q) ||
      r.admissionNo.toLowerCase().includes(q) ||
      r.variety.toLowerCase().includes(q) ||
      r.team.toLowerCase().includes(q)
    )
  })

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Publish / Edit Result Form */}
      <div className={`${cardCls} h-fit lg:col-span-5`}>
        <h2 className="font-serif text-lg font-bold text-slate-900">{editingId ? 'Edit Published Result' : 'Publish Result'}</h2>
        <p className="mt-1 text-xs text-slate-500">
          Pick a registered candidate or type their admission number — photo, name and team fill in automatically.
        </p>

        {/* Category segmented buttons */}
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-slate-700">Category *</p>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
            {RESULT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-md py-1.5 text-xs font-bold transition ${
                  category === cat ? 'bg-[#e64e24] text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {data.candidates.length > 0 && (
            <Field label="Quick pick registered candidate">
              <select
                className={inputCls}
                value={found?.admissionNo || ''}
                onChange={(e) => {
                  const chosen = data.candidates.find((c) => c.admissionNo === e.target.value)
                  if (chosen) {
                    setAdmissionNo(chosen.admissionNo)
                    if (!team) setTeam(chosen.team)
                  }
                }}
              >
                <option value="">Select candidate (or type admission no. below)</option>
                {data.candidates.map((c) => (
                  <option key={c.id} value={c.admissionNo}>
                    {c.admissionNo} — {c.name} ({c.team || 'No team'})
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Admission number *">
            <input className={inputCls} placeholder="e.g. N5033" value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} />
          </Field>

          {admissionNo && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
              {found ? (
                <>
                  {found.photo ? (
                    <img src={found.photo} alt={found.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm">👤</span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{found.name}</p>
                    <p className="text-slate-500">
                      Adm. {found.admissionNo} · {found.team || 'No team'}
                    </p>
                  </div>
                </>
              ) : (
                <span className="text-red-600">No candidate with admission number “{admissionNo}” — register them in Candidates first.</span>
              )}
            </div>
          )}

          <Field label="Program / variety">
            <input className={inputCls} placeholder="e.g. LENGUA" value={variety} onChange={(e) => setVariety(e.target.value)} list="program-names-admin" />
            <datalist id="program-names-admin">{data.programs.map((p) => <option key={p.id} value={p.title} />)}</datalist>
          </Field>

          <Field label="Team name (auto from candidate if blank)">
            <input className={inputCls} placeholder={found?.team || 'Team name'} value={team} onChange={(e) => setTeam(e.target.value)} list="team-names-admin" />
            <datalist id="team-names-admin">{data.teams.map((t) => <option key={t.id} value={t.name} />)}</datalist>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Points">
              <input className={inputCls} placeholder="10" type="number" min="0" max="10000" value={points} onChange={(e) => setPoints(e.target.value)} />
            </Field>
            <Field label="Position">
              <input className={inputCls} placeholder="1st, 2nd, 3rd" value={position} onChange={(e) => setPosition(e.target.value)} />
            </Field>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => void submit()}
              disabled={busy || (!found && !editingId)}
              className="flex-1 rounded-lg bg-[#e64e24] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#cf4018] disabled:opacity-40"
            >
              {editingId ? `Update Result (${category})` : `Publish Result (${category})`}
            </button>
            {editingId && (
              <button onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Directory */}
      <div className={`${cardCls} lg:col-span-7`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-slate-900">Published Results ({data.results.length})</h2>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['All', ...RESULT_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  filterCat === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputCls} pl-8`}
            placeholder="Search by candidate, admission no., program or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {filteredResults.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                {r.photo ? (
                  <img src={r.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs">👤</span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {r.candidateName}
                    {r.position ? <span className="ml-2 font-mono text-xs font-bold text-[#e64e24]">{r.position}</span> : null}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {[r.category, r.variety || 'General', r.team, `Adm. ${r.admissionNo}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-sm font-bold tabular-nums text-slate-900">{r.points} pts</span>
                <button onClick={() => startEdit(r)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit result for ${r.candidateName}`}>
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => void runAction(() => deleteResultFromFirestore(r.id), 'Result deleted')}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                  aria-label={`Delete result for ${r.candidateName}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {!filteredResults.length && (
            <p className="py-8 text-center text-sm text-slate-500">
              No published results yet — the penalty shootout game remains active on the public Results page until you publish one.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function CandidatesForm({ data, runAction, busy }: { data: SiteData; runAction: RunAction; busy: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [admissionNo, setAdmissionNo] = useState('')
  const [team, setTeam] = useState('')
  const [photo, setPhoto] = useState('')
  const [search, setSearch] = useState('')
  const [filterTeam, setFilterTeam] = useState('All')

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setAdmissionNo('')
    setTeam('')
    setPhoto('')
  }

  const startEdit = (c: Candidate) => {
    setEditingId(c.id)
    setName(c.name)
    setAdmissionNo(c.admissionNo)
    setTeam(c.team)
    setPhoto(c.photo)
  }

  const submit = async () => {
    if (!name.trim() || !admissionNo.trim()) return
    const payload = { name: name.trim(), admissionNo: admissionNo.trim(), team, photo }
    await runAction(async () => {
      if (editingId) {
        await updateCandidateInFirestore(editingId, payload)
      } else {
        await addCandidateToFirestore(payload)
      }
      resetForm()
    }, editingId ? 'Candidate updated!' : 'Candidate registered!')
  }

  const filtered = data.candidates.filter((c) => {
    if (filterTeam !== 'All' && c.team !== filterTeam) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.admissionNo.toLowerCase().includes(q) || c.team.toLowerCase().includes(q)
  })

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className={`${cardCls} h-fit lg:col-span-5`}>
        <h2 className="font-serif text-lg font-bold text-slate-900">{editingId ? 'Edit Candidate' : 'Register Candidate'}</h2>
        <div className="mt-4 space-y-3">
          <Field label="Candidate name *">
            <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Admission number *">
            <input className={inputCls} placeholder="e.g. N5033" value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} />
          </Field>
          <Field label="Team name">
            <input className={inputCls} placeholder="Select or type team name" value={team} onChange={(e) => setTeam(e.target.value)} list="team-names-cand" />
            <datalist id="team-names-cand">{data.teams.map((t) => <option key={t.id} value={t.name} />)}</datalist>
          </Field>
          <Field label="Candidate photo">
            <input
              type="file"
              accept="image/*"
              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  void runAction(async () => {
                    setPhoto(await compressImageFile(f, 360, 0.78, 340000))
                  })
                }
              }}
            />
          </Field>
          {photo && (
            <div className="flex items-center gap-3">
              <img src={photo} alt="Candidate preview" className="h-14 w-14 rounded-full border border-slate-200 object-cover" />
              <button type="button" onClick={() => setPhoto('')} className="text-xs font-semibold text-red-600 hover:underline">
                Remove photo
              </button>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={() => void submit()} disabled={busy || !name.trim() || !admissionNo.trim()} className="flex-1 rounded-lg bg-[#e64e24] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#cf4018] disabled:opacity-40">
              {editingId ? 'Update Candidate' : 'Register Candidate'}
            </button>
            {editingId && (
              <button onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`${cardCls} lg:col-span-7`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-slate-900">Candidates ({data.candidates.length})</h2>
          <div className="flex flex-wrap gap-2">
            <select className={`${inputCls} w-auto`} value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} aria-label="Filter by team">
              <option value="All">All teams</option>
              {data.teams.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
            <div className="relative w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={`${inputCls} pl-8`} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                {c.photo ? (
                  <img src={c.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs">👤</span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    Adm. {c.admissionNo} · {c.team || 'No team'}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => startEdit(c)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit ${c.name}`}>
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => void runAction(() => deleteCandidateFromFirestore(c.id), 'Candidate deleted')}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {!filtered.length && <p className="py-8 text-center text-sm text-slate-500">No candidates registered yet.</p>}
        </div>
      </div>
    </div>
  )
}

function TeamsForm({ data, runAction, busy }: { data: SiteData; runAction: RunAction; busy: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [colour, setColour] = useState('#e64e24')

  const board = useMemo(() => teamPoints(data, 'All'), [data])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setColour('#e64e24')
  }

  const startEdit = (t: Team) => {
    setEditingId(t.id)
    setName(t.name)
    setColour(t.colour)
  }

  const submit = async () => {
    if (!name.trim()) return
    const payload = { name: name.trim(), colour }
    await runAction(async () => {
      if (editingId) {
        await updateTeamInFirestore(editingId, payload)
      } else {
        await addTeamToFirestore(payload)
      }
      resetForm()
    }, editingId ? 'Team updated!' : 'Team added!')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className={`${cardCls} h-fit lg:col-span-5`}>
        <h2 className="font-serif text-lg font-bold text-slate-900">{editingId ? 'Edit Team' : 'Add Team'}</h2>
        <div className="mt-4 space-y-3">
          <Field label="Team / campus name *">
            <input className={inputCls} placeholder="e.g. DHUG-NIICS" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Team colour">
            <div className="flex items-center gap-3">
              <input type="color" value={colour} onChange={(e) => setColour(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-slate-300" aria-label="Team colour" />
              <span className="font-mono text-xs text-slate-500">{colour}</span>
            </div>
          </Field>
          <div className="flex gap-2 pt-1">
            <button onClick={() => void submit()} disabled={busy || !name.trim()} className="flex-1 rounded-lg bg-[#e64e24] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#cf4018] disabled:opacity-40">
              {editingId ? 'Update Team' : 'Add Team'}
            </button>
            {editingId && (
              <button onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`${cardCls} lg:col-span-7`}>
        <h2 className="font-serif text-lg font-bold text-slate-900">Teams ({data.teams.length})</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {data.teams.map((t) => {
            const membersCount = data.candidates.filter((c) => c.team === t.name).length
            const pts = board.find((b) => b.team === t.name)?.points ?? 0
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-5 w-5 shrink-0 rounded-full border border-black/10" style={{ background: t.colour }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {membersCount} candidate{membersCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-sm font-bold tabular-nums text-slate-900">{pts} pts</span>
                  <button onClick={() => startEdit(t)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit ${t.name}`}>
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => void runAction(() => deleteTeamFromFirestore(t.id), 'Team deleted')}
                    className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${t.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
          {!data.teams.length && <p className="py-8 text-center text-sm text-slate-500">No teams added yet.</p>}
        </div>
      </div>
    </div>
  )
}

function GalleryForm({ data, runAction, busy }: { data: SiteData; runAction: RunAction; busy: boolean }) {
  const [title, setTitle] = useState('')
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)

  const add = async (f: File | undefined) => {
    if (!f) return
    await runAction(async () => {
      const image = await compressImageFile(f, 960, 0.78, 480000)
      await addGalleryToFirestore({ title: title || f.name, image })
      setTitle('')
    }, 'Photo uploaded!')
  }

  const saveTitle = async () => {
    if (!editingItem || !title.trim()) return
    await runAction(async () => {
      await updateGalleryInFirestore(editingItem.id, { title: title.trim(), image: editingItem.image })
      setEditingItem(null)
      setTitle('')
    }, 'Photo updated!')
  }

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h2 className="font-serif text-lg font-bold text-slate-900">{editingItem ? 'Rename Photo' : 'Upload Gallery Photo'}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className={`${inputCls} min-w-[220px] flex-1`}
            placeholder="Photo title or caption"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {editingItem ? (
            <>
              <button
                onClick={() => void saveTitle()}
                disabled={busy || !title.trim()}
                className="rounded-lg bg-[#e64e24] px-5 py-2 text-sm font-bold text-white hover:bg-[#cf4018] disabled:opacity-40"
              >
                Save Title
              </button>
              <button
                onClick={() => { setEditingItem(null); setTitle('') }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            </>
          ) : (
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#e64e24] px-5 py-2 text-sm font-bold text-white hover:bg-[#cf4018] ${busy ? 'pointer-events-none opacity-50' : ''}`}>
              <UploadCloud size={16} />
              <span>Choose & Upload Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void add(e.target.files?.[0])} />
            </label>
          )}
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="font-serif text-lg font-bold text-slate-900">Gallery Photos ({data.gallery.length})</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.gallery.map((g) => (
            <div key={g.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={g.image} alt={g.title} className="h-36 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 p-2.5">
                <p className="truncate text-xs font-semibold text-slate-800">{g.title}</p>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => { setEditingItem(g); setTitle(g.title) }}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    aria-label={`Rename ${g.title}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => void runAction(() => deleteGalleryFromFirestore(g.id), 'Photo deleted')}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${g.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!data.gallery.length && <p className="py-8 text-center text-sm text-slate-500">No gallery photos uploaded yet.</p>}
      </div>
    </div>
  )
}

function UpdatesForm({ data, runAction, busy }: { data: SiteData; runAction: RunAction; busy: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [text, setText] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setDate('')
    setText('')
  }

  const startEdit = (u: UpdateItem) => {
    setEditingId(u.id)
    setTitle(u.title)
    setDate(u.date)
    setText(u.text)
  }

  const submit = async () => {
    if (!title.trim()) return
    const payload = { title: title.trim(), date, text }
    await runAction(async () => {
      if (editingId) {
        await updateUpdateInFirestore(editingId, payload)
      } else {
        await addUpdateToFirestore(payload)
      }
      resetForm()
    }, editingId ? 'Update saved!' : 'Update posted!')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className={`${cardCls} h-fit lg:col-span-5`}>
        <h2 className="font-serif text-lg font-bold text-slate-900">{editingId ? 'Edit Announcement' : 'Post Announcement'}</h2>
        <div className="mt-4 space-y-3">
          <Field label="Headline *">
            <input className={inputCls} placeholder="Update title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Date">
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Details">
            <textarea className={inputCls} placeholder="Write the announcement details..." value={text} onChange={(e) => setText(e.target.value)} rows={4} />
          </Field>
          <div className="flex gap-2 pt-1">
            <button onClick={() => void submit()} disabled={busy || !title.trim()} className="flex-1 rounded-lg bg-[#e64e24] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#cf4018] disabled:opacity-40">
              {editingId ? 'Save Update' : 'Post Update'}
            </button>
            {editingId && (
              <button onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`${cardCls} lg:col-span-7`}>
        <h2 className="font-serif text-lg font-bold text-slate-900">Posted Updates ({data.updates.length})</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {data.updates.map((u) => (
            <div key={u.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{u.title}</p>
                {u.date && <p className="mt-0.5 text-xs text-slate-500">{u.date}</p>}
                {u.text && <p className="mt-1 text-xs text-slate-600">{u.text}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => startEdit(u)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit ${u.title}`}>
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => void runAction(() => deleteUpdateFromFirestore(u.id), 'Update deleted')}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                  aria-label={`Delete ${u.title}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {!data.updates.length && <p className="py-8 text-center text-sm text-slate-500">No updates posted yet.</p>}
        </div>
      </div>
    </div>
  )
}

function DownloadsForm({ data, runAction, busy }: { data: SiteData; runAction: RunAction; busy: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setUrl('')
    setNote('')
  }

  const startEdit = (d: DownloadItem) => {
    setEditingId(d.id)
    setTitle(d.title)
    setUrl(d.url)
    setNote(d.note)
  }

  const submit = async () => {
    if (!title.trim()) return
    const payload = { title: title.trim(), url, note }
    await runAction(async () => {
      if (editingId) {
        await updateDownloadInFirestore(editingId, payload)
      } else {
        await addDownloadToFirestore(payload)
      }
      resetForm()
    }, editingId ? 'Download updated!' : 'Download added!')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className={`${cardCls} h-fit lg:col-span-5`}>
        <h2 className="font-serif text-lg font-bold text-slate-900">{editingId ? 'Edit Download' : 'Add Download'}</h2>
        <div className="mt-4 space-y-3">
          <Field label="File / resource title *">
            <input className={inputCls} placeholder="e.g. Official Fest Brochure PDF" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Download URL">
            <input className={inputCls} placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          </Field>
          <Field label="Short note">
            <input className={inputCls} placeholder="Optional file description" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex gap-2 pt-1">
            <button onClick={() => void submit()} disabled={busy || !title.trim()} className="flex-1 rounded-lg bg-[#e64e24] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#cf4018] disabled:opacity-40">
              {editingId ? 'Save Download' : 'Add Download'}
            </button>
            {editingId && (
              <button onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`${cardCls} lg:col-span-7`}>
        <h2 className="font-serif text-lg font-bold text-slate-900">Downloads ({data.downloads.length})</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {data.downloads.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{d.title}</p>
                {d.note && <p className="mt-0.5 text-xs text-slate-500">{d.note}</p>}
                {d.url && <p className="mt-0.5 truncate font-mono text-xs text-slate-400">{d.url}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => startEdit(d)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit ${d.title}`}>
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => void runAction(() => deleteDownloadFromFirestore(d.id), 'Download deleted')}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                  aria-label={`Delete ${d.title}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {!data.downloads.length && <p className="py-8 text-center text-sm text-slate-500">No downloads added yet.</p>}
        </div>
      </div>
    </div>
  )
}

function SecurityForm({
  remotePass,
  runAction,
  busy,
  onSaved,
  onLock,
}: {
  remotePass: AdminPassRecord | null
  runAction: RunAction
  busy: boolean
  onSaved: (rec: AdminPassRecord) => void
  onLock: () => void
}) {
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [localErr, setLocalErr] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalErr('')
    if (!currentPass) {
      setLocalErr('Enter your current passcode or password.')
      return
    }
    if (newPass.length < 4 || newPass.length > 64) {
      setLocalErr('New passcode/password must be between 4 and 64 characters.')
      return
    }
    if (newPass !== confirmPass) {
      setLocalErr('New password and confirmation do not match.')
      return
    }

    const valid = await verifyPasscodeAgainstRecord(currentPass, remotePass)
    if (!valid) {
      setLocalErr('Current passcode/password is incorrect.')
      return
    }

    await runAction(async () => {
      const rec = await createSaltedPassRecord(newPass)
      await saveAdminSecurityToFirestore(rec)
      onSaved(rec)
      setCurrentPass('')
      setNewPass('')
      setConfirmPass('')
    }, 'Admin password updated! Next login requires your new password.')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <form onSubmit={(e) => void handleSubmit(e)} className={`${cardCls} lg:col-span-7`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e64e24]/10 text-[#e64e24]">
            <KeyRound size={20} />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-slate-900">Change Admin Passcode / Password</h2>
            <p className="text-xs text-slate-500">Update the passcode required whenever someone opens the Admin Panel.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Field label="Current passcode / password *">
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${inputCls} pr-10`}
                placeholder="Enter current passcode"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                aria-label={showCurrent ? 'Hide current passcode' : 'Show current passcode'}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Field label="New passcode / password * (min 4 characters)">
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${inputCls} pr-10`}
                placeholder="Enter new passcode or password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Field label="Confirm new passcode / password *">
            <input
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              className={inputCls}
              placeholder="Re-enter new passcode or password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </Field>

          {localErr && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{localErr}</p>}

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#e64e24] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#cf4018] disabled:opacity-50"
            >
              Save New Password
            </button>
          </div>
        </div>
      </form>

      <div className={`${cardCls} flex h-fit flex-col justify-between gap-4 lg:col-span-5`}>
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck size={18} />
            <h3 className="font-serif text-lg font-bold text-slate-900">Admin Lock Status</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Your admin passcode is stored as a salted SHA-256 hash in Firebase and synced across devices. Closing the Admin Console or clicking Lock below requires entering the passcode again.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Status: <b className="text-slate-800">{remotePass ? 'Custom password active (Firebase synced)' : 'Initial default passcode active'}</b>
          </p>
        </div>

        <button
          type="button"
          onClick={onLock}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <Lock size={15} />
          <span>Lock Admin Panel Now</span>
        </button>
      </div>
    </div>
  )
}
