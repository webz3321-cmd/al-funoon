import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import firebaseConfig from '../../firebase-applet-config.json'
import { emptySettings, uid } from './store'
import type {
  AdminPassRecord,
  Candidate,
  DownloadItem,
  GalleryItem,
  Program,
  ResultCategory,
  ResultItem,
  Settings,
  SiteData,
  Team,
  UpdateItem,
} from './store'

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId)
export const auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const BOOTSTRAP_ADMIN_EMAIL = 'webz3321@gmail.com'

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string
  operationType: OperationType
  path: string | null
  authInfo: {
    userId?: string | null
    email?: string | null
    emailVerified?: boolean | null
    isAnonymous?: boolean | null
    tenantId?: string | null
    providerInfo?: {
      providerId?: string | null
      email?: string | null
    }[]
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  }
  const serialized = JSON.stringify(errInfo)
  console.error('Firestore Error: ', serialized)
  throw new Error(serialized)
}

/** Validate Firestore connectivity on app startup. */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'))
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.')
    }
  }
}
void testConnection()

export async function signInAdminWithGoogle(): Promise<User> {
  const res = await signInWithPopup(auth, googleProvider)
  return res.user
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth)
}

export function subscribeAuth(cb: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, cb)
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false
  if (user.email === BOOTSTRAP_ADMIN_EMAIL) return true
  const path = `admins/${user.uid}`
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid))
    return snap.exists()
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path)
  }
}

export async function getAdminSecurityFromFirestore(): Promise<AdminPassRecord | null> {
  const path = 'adminSecurity/main'
  try {
    const snap = await getDoc(doc(db, 'adminSecurity', 'main'))
    if (!snap.exists()) return null
    const d = snap.data() as Partial<AdminPassRecord>
    if (typeof d.salt === 'string' && typeof d.passHash === 'string' && d.salt.length >= 16 && d.passHash.length >= 64) {
      return { salt: d.salt, passHash: d.passHash }
    }
    return null
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path)
  }
}

export async function saveAdminSecurityToFirestore(rec: AdminPassRecord): Promise<void> {
  const path = 'adminSecurity/main'
  try {
    await setDoc(doc(db, 'adminSecurity', 'main'), {
      salt: clamp(rec.salt, 64),
      passHash: clamp(rec.passHash, 128),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path)
  }
}

/** Trim string cleanly to match firebase-blueprint.json maxLength limits. */
function clamp(value: string, max: number): string {
  return String(value ?? '').slice(0, max)
}

function validId(raw?: string): string {
  const candidate = (raw || uid()).replace(/[^a-zA-Z0-9_-]/g, '')
  return (candidate || uid()).slice(0, 128)
}

function normalizeCategory(raw: unknown): ResultCategory | '' {
  const s = String(raw ?? '').trim()
  if (s === 'Bidaya' || s === 'Ula' || s === 'Thaniya') return s
  return ''
}

/** Subscribe to all public fest collections in real time. */
export function subscribeFestData(
  onUpdate: (updater: (prev: SiteData) => SiteData) => void,
  onError?: (err: Error) => void,
): () => void {
  const report = (err: unknown, op: OperationType, path: string) => {
    try {
      handleFirestoreError(err, op, path)
    } catch (wrapped) {
      if (onError && wrapped instanceof Error) onError(wrapped)
    }
  }

  const unsubs: Unsubscribe[] = []

  unsubs.push(
    onSnapshot(
      doc(db, 'settings', 'main'),
      (snap) => {
        if (!snap.exists()) return
        const d = snap.data() as Partial<Settings>
        onUpdate((prev) => ({
          ...prev,
          settings: {
            ...emptySettings,
            institutionName: String(d.institutionName ?? ''),
            programName: String(d.programName ?? ''),
            themeLine: String(d.themeLine ?? 'MAKE YOUR MAGIC'),
            date: String(d.date ?? ''),
            time: String(d.time ?? ''),
            venue: String(d.venue ?? ''),
            about: String(d.about ?? ''),
            showCountdown: Boolean(d.showCountdown ?? true),
            gameEnabled: Boolean(d.gameEnabled ?? true),
            launchEnabled: Boolean(d.launchEnabled ?? false),
            themeSongUrl: String(d.themeSongUrl || '/assets/aistudio/__________2__73a6848a.mp3'),
          },
        }))
      },
      (err) => report(err, OperationType.GET, 'settings/main'),
    ),
  )

  const bindList = <K extends keyof Omit<SiteData, 'settings'>>(
    colName: K,
    mapDoc: (id: string, data: Record<string, unknown>) => SiteData[K][number],
  ) => {
    const q = query(collection(db, colName), orderBy('createdAt', 'asc'))
    unsubs.push(
      onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((docSnap) => mapDoc(docSnap.id, docSnap.data()))
          onUpdate((prev) => ({ ...prev, [colName]: items }))
        },
        (err) => report(err, OperationType.LIST, colName),
      ),
    )
  }

  bindList('programs', (id, d) => ({
    id,
    title: String(d.title ?? ''),
    variety: String(d.variety ?? ''),
    date: String(d.date ?? ''),
    venue: String(d.venue ?? ''),
    description: String(d.description ?? ''),
  }))

  bindList('candidates', (id, d) => ({
    id,
    name: String(d.name ?? ''),
    admissionNo: String(d.admissionNo ?? ''),
    team: String(d.team ?? ''),
    photo: String(d.photo ?? ''),
  }))

  bindList('teams', (id, d) => ({
    id,
    name: String(d.name ?? ''),
    colour: String(d.colour ?? '#e64e24'),
  }))

  bindList('results', (id, d) => ({
    id,
    admissionNo: String(d.admissionNo ?? ''),
    candidateName: String(d.candidateName ?? ''),
    photo: String(d.photo ?? ''),
    team: String(d.team ?? ''),
    variety: String(d.variety ?? ''),
    category: normalizeCategory(d.category),
    points: Number(d.points ?? 0),
    position: String(d.position ?? ''),
  }))

  bindList('gallery', (id, d) => ({
    id,
    title: String(d.title ?? ''),
    image: String(d.image ?? ''),
  }))

  bindList('updates', (id, d) => ({
    id,
    title: String(d.title ?? ''),
    date: String(d.date ?? ''),
    text: String(d.text ?? ''),
  }))

  bindList('downloads', (id, d) => ({
    id,
    title: String(d.title ?? ''),
    url: String(d.url ?? ''),
    note: String(d.note ?? ''),
  }))

  return () => {
    for (const u of unsubs) u()
  }
}

export async function saveSettingsToFirestore(s: Settings): Promise<void> {
  const path = 'settings/main'
  try {
    await setDoc(doc(db, 'settings', 'main'), {
      institutionName: clamp(s.institutionName, 150),
      programName: clamp(s.programName, 150),
      themeLine: clamp(s.themeLine || 'MAKE YOUR MAGIC', 80),
      date: clamp(s.date, 30),
      time: clamp(s.time, 30),
      venue: clamp(s.venue, 200),
      about: clamp(s.about, 2000),
      showCountdown: Boolean(s.showCountdown),
      gameEnabled: Boolean(s.gameEnabled),
      launchEnabled: Boolean(s.launchEnabled),
      themeSongUrl: clamp(s.themeSongUrl, 1000000),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path)
  }
}

export async function addProgramToFirestore(p: Omit<Program, 'id'>, id?: string): Promise<void> {
  const docId = validId(id)
  const path = `programs/${docId}`
  try {
    await setDoc(doc(db, 'programs', docId), {
      title: clamp(p.title.trim(), 150),
      variety: clamp(p.variety, 100),
      date: clamp(p.date, 30),
      venue: clamp(p.venue, 200),
      description: clamp(p.description, 2000),
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path)
  }
}

export async function updateProgramInFirestore(id: string, p: Omit<Program, 'id'>): Promise<void> {
  const docId = validId(id)
  const path = `programs/${docId}`
  try {
    await updateDoc(doc(db, 'programs', docId), {
      title: clamp(p.title.trim(), 150),
      variety: clamp(p.variety, 100),
      date: clamp(p.date, 30),
      venue: clamp(p.venue, 200),
      description: clamp(p.description, 2000),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path)
  }
}

export async function deleteProgramFromFirestore(id: string): Promise<void> {
  const docId = validId(id)
  try {
    await deleteDoc(doc(db, 'programs', docId))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `programs/${docId}`)
  }
}

export async function addCandidateToFirestore(c: Omit<Candidate, 'id'>, id?: string): Promise<void> {
  const docId = validId(id)
  const path = `candidates/${docId}`
  try {
    await setDoc(doc(db, 'candidates', docId), {
      name: clamp(c.name.trim(), 150),
      admissionNo: clamp(c.admissionNo.trim(), 60),
      team: clamp(c.team, 120),
      photo: clamp(c.photo, 350000),
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path)
  }
}

export async function updateCandidateInFirestore(id: string, c: Omit<Candidate, 'id'>): Promise<void> {
  const docId = validId(id)
  const path = `candidates/${docId}`
  try {
    await updateDoc(doc(db, 'candidates', docId), {
      name: clamp(c.name.trim(), 150),
      admissionNo: clamp(c.admissionNo.trim(), 60),
      team: clamp(c.team, 120),
      photo: clamp(c.photo, 350000),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path)
  }
}

export async function deleteCandidateFromFirestore(id: string): Promise<void> {
  const docId = validId(id)
  try {
    await deleteDoc(doc(db, 'candidates', docId))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `candidates/${docId}`)
  }
}

export async function addTeamToFirestore(t: Omit<Team, 'id'>, id?: string): Promise<void> {
  const docId = validId(id)
  const path = `teams/${docId}`
  const hex = /^#[0-9a-fA-F]{3,8}$/.test(t.colour) ? t.colour : '#e64e24'
  try {
    await setDoc(doc(db, 'teams', docId), {
      name: clamp(t.name.trim(), 120),
      colour: hex,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path)
  }
}

export async function updateTeamInFirestore(id: string, t: Omit<Team, 'id'>): Promise<void> {
  const docId = validId(id)
  const path = `teams/${docId}`
  const hex = /^#[0-9a-fA-F]{3,8}$/.test(t.colour) ? t.colour : '#e64e24'
  try {
    await updateDoc(doc(db, 'teams', docId), {
      name: clamp(t.name.trim(), 120),
      colour: hex,
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path)
  }
}

export async function deleteTeamFromFirestore(id: string): Promise<void> {
  const docId = validId(id)
  try {
    await deleteDoc(doc(db, 'teams', docId))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `teams/${docId}`)
  }
}

export async function addResultToFirestore(r: Omit<ResultItem, 'id'>, id?: string): Promise<void> {
  const docId = validId(id)
  const path = `results/${docId}`
  const pts = Math.max(0, Math.min(10000, Number(r.points) || 0))
  const cat = normalizeCategory(r.category)
  try {
    await setDoc(doc(db, 'results', docId), {
      admissionNo: clamp(r.admissionNo.trim(), 60),
      candidateName: clamp(r.candidateName.trim(), 150),
      photo: clamp(r.photo, 350000),
      team: clamp(r.team, 120),
      variety: clamp(r.variety, 120),
      category: cat,
      points: pts,
      position: clamp(r.position, 50),
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path)
  }
}

export async function updateResultInFirestore(id: string, r: Omit<ResultItem, 'id'>): Promise<void> {
  const docId = validId(id)
  const path = `results/${docId}`
  const pts = Math.max(0, Math.min(10000, Number(r.points) || 0))
  const cat = normalizeCategory(r.category)
  try {
    await updateDoc(doc(db, 'results', docId), {
      admissionNo: clamp(r.admissionNo.trim(), 60),
      candidateName: clamp(r.candidateName.trim(), 150),
      photo: clamp(r.photo, 350000),
      team: clamp(r.team, 120),
      variety: clamp(r.variety, 120),
      category: cat,
      points: pts,
      position: clamp(r.position, 50),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path)
  }
}

export async function deleteResultFromFirestore(id: string): Promise<void> {
  const docId = validId(id)
  try {
    await deleteDoc(doc(db, 'results', docId))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `results/${docId}`)
  }
}

export async function addGalleryToFirestore(g: Omit<GalleryItem, 'id'>, id?: string): Promise<void> {
  const docId = validId(id)
  const path = `gallery/${docId}`
  try {
    await setDoc(doc(db, 'gallery', docId), {
      title: clamp(g.title.trim() || 'Photo', 150),
      image: clamp(g.image, 500000),
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path)
  }
}

export async function updateGalleryInFirestore(id: string, g: Omit<GalleryItem, 'id'>): Promise<void> {
  const docId = validId(id)
  const path = `gallery/${docId}`
  try {
    await updateDoc(doc(db, 'gallery', docId), {
      title: clamp(g.title.trim() || 'Photo', 150),
      image: clamp(g.image, 500000),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path)
  }
}

export async function deleteGalleryFromFirestore(id: string): Promise<void> {
  const docId = validId(id)
  try {
    await deleteDoc(doc(db, 'gallery', docId))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `gallery/${docId}`)
  }
}

export async function addUpdateToFirestore(u: Omit<UpdateItem, 'id'>, id?: string): Promise<void> {
  const docId = validId(id)
  const path = `updates/${docId}`
  try {
    await setDoc(doc(db, 'updates', docId), {
      title: clamp(u.title.trim(), 150),
      date: clamp(u.date, 30),
      text: clamp(u.text, 2000),
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path)
  }
}

export async function updateUpdateInFirestore(id: string, u: Omit<UpdateItem, 'id'>): Promise<void> {
  const docId = validId(id)
  const path = `updates/${docId}`
  try {
    await updateDoc(doc(db, 'updates', docId), {
      title: clamp(u.title.trim(), 150),
      date: clamp(u.date, 30),
      text: clamp(u.text, 2000),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path)
  }
}

export async function deleteUpdateFromFirestore(id: string): Promise<void> {
  const docId = validId(id)
  try {
    await deleteDoc(doc(db, 'updates', docId))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `updates/${docId}`)
  }
}

export async function addDownloadToFirestore(d: Omit<DownloadItem, 'id'>, id?: string): Promise<void> {
  const docId = validId(id)
  const path = `downloads/${docId}`
  try {
    await setDoc(doc(db, 'downloads', docId), {
      title: clamp(d.title.trim(), 150),
      url: clamp(d.url, 1000),
      note: clamp(d.note, 500),
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path)
  }
}

export async function updateDownloadInFirestore(id: string, d: Omit<DownloadItem, 'id'>): Promise<void> {
  const docId = validId(id)
  const path = `downloads/${docId}`
  try {
    await updateDoc(doc(db, 'downloads', docId), {
      title: clamp(d.title.trim(), 150),
      url: clamp(d.url, 1000),
      note: clamp(d.note, 500),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path)
  }
}

export async function deleteDownloadFromFirestore(id: string): Promise<void> {
  const docId = validId(id)
  try {
    await deleteDoc(doc(db, 'downloads', docId))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `downloads/${docId}`)
  }
}

export async function importLocalDataToFirestore(local: SiteData): Promise<void> {
  await saveSettingsToFirestore(local.settings)
  for (const p of local.programs) {
    if (p.title?.trim()) await addProgramToFirestore(p, p.id)
  }
  for (const t of local.teams) {
    if (t.name?.trim()) await addTeamToFirestore(t, t.id)
  }
  for (const c of local.candidates) {
    if (c.name?.trim() && c.admissionNo?.trim()) await addCandidateToFirestore(c, c.id)
  }
  for (const r of local.results) {
    if (r.candidateName?.trim() && r.admissionNo?.trim()) await addResultToFirestore(r, r.id)
  }
  for (const g of local.gallery) {
    if (g.image?.trim()) await addGalleryToFirestore(g, g.id)
  }
  for (const u of local.updates) {
    if (u.title?.trim()) await addUpdateToFirestore(u, u.id)
  }
  for (const d of local.downloads) {
    if (d.title?.trim()) await addDownloadToFirestore(d, d.id)
  }
}
