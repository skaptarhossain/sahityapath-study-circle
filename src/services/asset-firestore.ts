import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { 
  AssetSubject, 
  AssetTopic, 
  AssetSubtopic, 
  AnyAsset,
  AssetUsageRef
} from '@/types'

// Collection names
const COLLECTIONS = {
  SUBJECTS: 'asset-subjects',
  TOPICS: 'asset-topics',
  SUBTOPICS: 'asset-subtopics',
  ASSETS: 'assets',
}

// ==========================================
// SUBJECTS
// ==========================================

export async function createAssetSubject(subject: AssetSubject): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.SUBJECTS, subject.id), subject)
}

export async function updateAssetSubject(id: string, data: Partial<AssetSubject>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SUBJECTS, id)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    await setDoc(docRef, { ...docSnap.data(), ...data }, { merge: true })
  }
}

export async function deleteAssetSubject(id: string): Promise<void> {
  // Delete subject
  await deleteDoc(doc(db, COLLECTIONS.SUBJECTS, id))
  
  // Delete related topics
  const topicsQuery = query(
    collection(db, COLLECTIONS.TOPICS),
    where('subjectId', '==', id)
  )
  const topicsSnap = await getDocs(topicsQuery)
  const batch = writeBatch(db)
  
  for (const topicDoc of topicsSnap.docs) {
    batch.delete(topicDoc.ref)
    
    // Delete related subtopics
    const subtopicsQuery = query(
      collection(db, COLLECTIONS.SUBTOPICS),
      where('topicId', '==', topicDoc.id)
    )
    const subtopicsSnap = await getDocs(subtopicsQuery)
    subtopicsSnap.docs.forEach(st => batch.delete(st.ref))
  }
  
  await batch.commit()
}

export async function getAssetSubjectsByUser(userId: string): Promise<AssetSubject[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBJECTS),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const subjects = snap.docs.map(d => d.data() as AssetSubject)
  return subjects.sort((a, b) => (a.order || 0) - (b.order || 0))
}

export function subscribeToAssetSubjects(
  userId: string, 
  callback: (subjects: AssetSubject[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.SUBJECTS),
    where('userId', '==', userId)
  )
  return onSnapshot(q, (snap) => {
    const subjects = snap.docs.map(d => d.data() as AssetSubject)
    callback(subjects.sort((a, b) => (a.order || 0) - (b.order || 0)))
  })
}

// ==========================================
// TOPICS
// ==========================================

export async function createAssetTopic(topic: AssetTopic): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.TOPICS, topic.id), topic)
}

export async function updateAssetTopic(id: string, data: Partial<AssetTopic>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TOPICS, id)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    await setDoc(docRef, { ...docSnap.data(), ...data }, { merge: true })
  }
}

export async function deleteAssetTopic(id: string): Promise<void> {
  // Delete topic
  await deleteDoc(doc(db, COLLECTIONS.TOPICS, id))
  
  // Delete related subtopics
  const subtopicsQuery = query(
    collection(db, COLLECTIONS.SUBTOPICS),
    where('topicId', '==', id)
  )
  const subtopicsSnap = await getDocs(subtopicsQuery)
  const batch = writeBatch(db)
  subtopicsSnap.docs.forEach(st => batch.delete(st.ref))
  await batch.commit()
}

export async function getAssetTopicsByUser(userId: string): Promise<AssetTopic[]> {
  const q = query(
    collection(db, COLLECTIONS.TOPICS),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const topics = snap.docs.map(d => d.data() as AssetTopic)
  return topics.sort((a, b) => (a.order || 0) - (b.order || 0))
}

export function subscribeToAssetTopics(
  userId: string, 
  callback: (topics: AssetTopic[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.TOPICS),
    where('userId', '==', userId)
  )
  return onSnapshot(q, (snap) => {
    const topics = snap.docs.map(d => d.data() as AssetTopic)
    callback(topics.sort((a, b) => (a.order || 0) - (b.order || 0)))
  })
}

// ==========================================
// SUBTOPICS
// ==========================================

export async function createAssetSubtopic(subtopic: AssetSubtopic): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.SUBTOPICS, subtopic.id), subtopic)
}

export async function updateAssetSubtopic(id: string, data: Partial<AssetSubtopic>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SUBTOPICS, id)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    await setDoc(docRef, { ...docSnap.data(), ...data }, { merge: true })
  }
}

export async function deleteAssetSubtopic(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.SUBTOPICS, id))
}

export async function getAssetSubtopicsByUser(userId: string): Promise<AssetSubtopic[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBTOPICS),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const subtopics = snap.docs.map(d => d.data() as AssetSubtopic)
  return subtopics.sort((a, b) => (a.order || 0) - (b.order || 0))
}

export function subscribeToAssetSubtopics(
  userId: string, 
  callback: (subtopics: AssetSubtopic[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.SUBTOPICS),
    where('userId', '==', userId)
  )
  return onSnapshot(q, (snap) => {
    const subtopics = snap.docs.map(d => d.data() as AssetSubtopic)
    callback(subtopics.sort((a, b) => (a.order || 0) - (b.order || 0)))
  })
}

// ==========================================
// ASSETS
// ==========================================

export async function createAsset(asset: AnyAsset): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.ASSETS, asset.id), asset)
}

export async function updateAsset(id: string, data: Partial<AnyAsset>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.ASSETS, id)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    await setDoc(docRef, { ...docSnap.data(), ...data, updatedAt: Date.now() }, { merge: true })
  }
}

export async function deleteAsset(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.ASSETS, id))
}

export async function getAsset(id: string): Promise<AnyAsset | null> {
  const docSnap = await getDoc(doc(db, COLLECTIONS.ASSETS, id))
  return docSnap.exists() ? docSnap.data() as AnyAsset : null
}

export async function getAssetsByUser(userId: string): Promise<AnyAsset[]> {
  const q = query(
    collection(db, COLLECTIONS.ASSETS),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const assets = snap.docs.map(d => d.data() as AnyAsset)
  return assets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export function subscribeToAssets(
  userId: string, 
  callback: (assets: AnyAsset[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.ASSETS),
    where('userId', '==', userId)
  )
  return onSnapshot(q, (snap) => {
    const assets = snap.docs.map(d => d.data() as AnyAsset)
    callback(assets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
  })
}

// ==========================================
// USAGE TRACKING
// ==========================================

export async function addAssetUsage(assetId: string, usage: AssetUsageRef): Promise<void> {
  const docRef = doc(db, COLLECTIONS.ASSETS, assetId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    const asset = docSnap.data() as AnyAsset
    const usedIn = asset.usedIn || []
    // Check if already exists
    const exists = usedIn.some(
      u => u.deskType === usage.deskType && u.deskId === usage.deskId
    )
    if (!exists) {
      await setDoc(docRef, { 
        ...asset, 
        usedIn: [...usedIn, usage],
        updatedAt: Date.now()
      })
    }
  }
}

export async function removeAssetUsage(
  assetId: string, 
  deskType: string, 
  deskId: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.ASSETS, assetId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    const asset = docSnap.data() as AnyAsset
    const usedIn = (asset.usedIn || []).filter(
      u => !(u.deskType === deskType && u.deskId === deskId)
    )
    await setDoc(docRef, { ...asset, usedIn, updatedAt: Date.now() })
  }
}

// ==========================================
// BULK OPERATIONS
// ==========================================

export async function createAssetsInBulk(assets: AnyAsset[]): Promise<void> {
  const batch = writeBatch(db)
  assets.forEach(asset => {
    batch.set(doc(db, COLLECTIONS.ASSETS, asset.id), asset)
  })
  await batch.commit()
}

export async function deleteAssetsBySubject(userId: string, subjectId: string): Promise<void> {
  const q = query(
    collection(db, COLLECTIONS.ASSETS),
    where('userId', '==', userId),
    where('subjectId', '==', subjectId)
  )
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

export async function deleteAssetsByTopic(userId: string, topicId: string): Promise<void> {
  const q = query(
    collection(db, COLLECTIONS.ASSETS),
    where('userId', '==', userId),
    where('topicId', '==', topicId)
  )
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

// ==========================================
// INIT - Load all user data
// ==========================================

export async function loadAllAssetData(userId: string): Promise<{
  subjects: AssetSubject[]
  topics: AssetTopic[]
  subtopics: AssetSubtopic[]
  assets: AnyAsset[]
}> {
  const [subjects, topics, subtopics, assets] = await Promise.all([
    getAssetSubjectsByUser(userId),
    getAssetTopicsByUser(userId),
    getAssetSubtopicsByUser(userId),
    getAssetsByUser(userId),
  ])
  
  return { subjects, topics, subtopics, assets }
}

// Subscribe to all asset data with real-time updates
export function subscribeToAllAssetData(
  userId: string,
  callbacks: {
    onSubjects: (subjects: AssetSubject[]) => void
    onTopics: (topics: AssetTopic[]) => void
    onSubtopics: (subtopics: AssetSubtopic[]) => void
    onAssets: (assets: AnyAsset[]) => void
  }
): () => void {
  const unsubscribers: Unsubscribe[] = []
  
  unsubscribers.push(subscribeToAssetSubjects(userId, callbacks.onSubjects))
  unsubscribers.push(subscribeToAssetTopics(userId, callbacks.onTopics))
  unsubscribers.push(subscribeToAssetSubtopics(userId, callbacks.onSubtopics))
  unsubscribers.push(subscribeToAssets(userId, callbacks.onAssets))
  
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}
