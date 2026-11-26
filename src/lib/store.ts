export interface Settings {
  institutionName: string
  programName: string
  themeLine: string
  date: string
  time: string
  venue: string
  about: string
  showCountdown: boolean
  gameEnabled: boolean
  launchEnabled: boolean
  themeSongUrl: string
}

export interface Program {
  id: string
  title: string
  variety: string
  date: string
  venue: string
  description: string
}

export interface Candidate {
  id: string
  name: string
  admissionNo: string
  team: string
  photo: string
}

export interface Team {
  id: string
  name: string
  colour: string
}

export type ResultCategory = 'Bidaya' | 'Ula' | 'Thaniya'
export const RESULT_CATEGORIES: ResultCategory[] = ['Bidaya', 'Ula', 'Thaniya']

export interface ResultItem {
  id: string
  admissionNo: string
  candidateName: string
  photo: string
  team: string
  variety: string
  category?: ResultCategory | ''
  points: number
  position: string
}

export interface GalleryItem { id: string; title: string; image: string }
export interface UpdateItem { id: string; title: string; date: string; text: string }
export interface DownloadItem { id: string; title: string; url: string; note: string }

export interface SiteData {
  settings: Settings
  programs: Program[]
  results: ResultItem[]
  candidates: Candidate[]
  teams: Team[]
  gallery: GalleryItem[]
  updates: UpdateItem[]
  downloads: DownloadItem[]
}

export const emptySettings: Settings = {
  institutionName: '',
  programName: '',
  themeLine: 'MAKE YOUR MAGIC',
  date: '',
  time: '',
  venue: '',
  about: '',
  showCountdown: true,
  gameEnabled: true,
  launchEnabled: false,
  themeSongUrl: '/assets/aistudio/__________2__73a6848a.mp3',
}

export const emptyData: SiteData = {
  settings: emptySettings,
  programs: [],
  results: [],
  candidates: [],
  teams: [],
  gallery: [],
  updates: [],
  downloads: [],
}

const KEY = 'institution-program-website-v1'

export function loadData(): SiteData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(emptyData)
    const parsed = JSON.parse(raw) as Partial<SiteData>
    return {
      ...structuredClone(emptyData),
      ...parsed,
      settings: { ...emptySettings, ...(parsed.settings ?? {}) },
    }
  } catch {
    return structuredClone(emptyData)
  }
}

export function saveData(data: SiteData) {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* storage full / unavailable */ }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** Points per team, summed from real published results (optionally filtered by category). */
export function teamPoints(data: SiteData, category?: ResultCategory | 'All'): { team: string; points: number }[] {
  const map = new Map<string, number>()
  const list =
    category && category !== 'All'
      ? data.results.filter((r) => r.category === category)
      : data.results
  for (const r of list) {
    const t = r.team || '—'
    map.set(t, (map.get(t) ?? 0) + (Number(r.points) || 0))
  }
  if (!category || category === 'All') {
    for (const t of data.teams) if (!map.has(t.name)) map.set(t.name, 0)
  }
  return [...map.entries()]
    .map(([team, points]) => ({ team, points }))
    .sort((a, b) => b.points - a.points)
}

/** Topper list: candidates ranked by total points from real results (optionally filtered by category). */
export function toppers(
  data: SiteData,
  category?: ResultCategory | 'All',
): { name: string; admissionNo: string; photo: string; team: string; points: number; category?: ResultCategory | '' }[] {
  const map = new Map<
    string,
    { name: string; admissionNo: string; photo: string; team: string; points: number; category?: ResultCategory | '' }
  >()
  const list =
    category && category !== 'All'
      ? data.results.filter((r) => r.category === category)
      : data.results
  for (const r of list) {
    const key = r.admissionNo || r.candidateName
    const cur = map.get(key) ?? {
      name: r.candidateName,
      admissionNo: r.admissionNo,
      photo: r.photo,
      team: r.team,
      points: 0,
      category: r.category,
    }
    cur.points += Number(r.points) || 0
    if (!cur.category && r.category) cur.category = r.category
    map.set(key, cur)
  }
  return [...map.values()].sort((a, b) => b.points - a.points)
}

export interface AdminPassRecord {
  salt: string
  passHash: string
}

const DEFAULT_PASS_RECORD: AdminPassRecord = {
  salt: 'mym_admin_default_v1',
  passHash: 'b1a5bec24cea812a592774043c3341eb97d9fa05f0ee53185aa321ecfc306418',
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashWithSalt(salt: string, passcode: string): Promise<string> {
  return sha256(`${salt}:${passcode}`)
}

export async function createSaltedPassRecord(passcode: string): Promise<AdminPassRecord> {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const salt = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  const passHash = await hashWithSalt(salt, passcode)
  return { salt, passHash }
}

const PASS_KEY = 'institution-program-website-passcode-v2'
const LEGACY_PASS_KEY = 'institution-program-website-passcode'

export function loadLocalPassRecord(): AdminPassRecord | null {
  try {
    localStorage.removeItem(LEGACY_PASS_KEY)
    const raw = localStorage.getItem(PASS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AdminPassRecord>
    if (typeof parsed.salt === 'string' && typeof parsed.passHash === 'string' && parsed.salt.length >= 16 && parsed.passHash.length >= 64) {
      return { salt: parsed.salt, passHash: parsed.passHash }
    }
    return null
  } catch {
    return null
  }
}

export function saveLocalPassRecord(rec: AdminPassRecord): void {
  try {
    localStorage.setItem(PASS_KEY, JSON.stringify({ salt: rec.salt, passHash: rec.passHash }))
  } catch {
    /* storage unavailable */
  }
}

export async function verifyPasscodeAgainstRecord(entered: string, remote?: AdminPassRecord | null): Promise<boolean> {
  const target = remote ?? loadLocalPassRecord() ?? DEFAULT_PASS_RECORD
  const digest = await hashWithSalt(target.salt, entered)
  return digest === target.passHash
}
