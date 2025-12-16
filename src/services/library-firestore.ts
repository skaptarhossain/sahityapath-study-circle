/**
 * Firebase Firestore Service for Online Library
 * Handles all CRUD operations for library content
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { 
  LibrarySubject, 
  LibraryTopic, 
  LibrarySubtopic,
  LibraryContentPack, 
  LibraryMCQ, 
  LibraryNote,
  UserLibraryDownload 
} from '@/types'

// Collection names
const LIBRARY_SUBJECTS = 'library-subjects'
const LIBRARY_TOPICS = 'library-topics'
const LIBRARY_SUBTOPICS = 'library-subtopics'
const LIBRARY_PACKS = 'library-packs'
const LIBRARY_MCQS = 'library-mcqs'
const LIBRARY_NOTES = 'library-notes'
const LIBRARY_DOWNLOADS = 'library-downloads'

// ==================== SUBJECTS ====================

export async function createLibrarySubject(subject: LibrarySubject): Promise<void> {
  await setDoc(doc(db, LIBRARY_SUBJECTS, subject.id), subject)
}

export async function getLibrarySubjects(): Promise<LibrarySubject[]> {
  const snapshot = await getDocs(collection(db, LIBRARY_SUBJECTS))
  const subjects = snapshot.docs.map(doc => doc.data() as LibrarySubject)
  return subjects.sort((a, b) => (a.order || 0) - (b.order || 0))
}

export async function deleteLibrarySubject(id: string): Promise<void> {
  await deleteDoc(doc(db, LIBRARY_SUBJECTS, id))
}

export function subscribeToLibrarySubjects(
  callback: (subjects: LibrarySubject[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, LIBRARY_SUBJECTS), (snapshot) => {
    const subjects = snapshot.docs.map(doc => doc.data() as LibrarySubject)
    callback(subjects.sort((a, b) => (a.order || 0) - (b.order || 0)))
  })
}

// ==================== TOPICS ====================

export async function createLibraryTopic(topic: LibraryTopic): Promise<void> {
  await setDoc(doc(db, LIBRARY_TOPICS, topic.id), topic)
}

export async function getLibraryTopics(): Promise<LibraryTopic[]> {
  const snapshot = await getDocs(collection(db, LIBRARY_TOPICS))
  const topics = snapshot.docs.map(doc => doc.data() as LibraryTopic)
  return topics.sort((a, b) => (a.order || 0) - (b.order || 0))
}

export async function deleteLibraryTopic(id: string): Promise<void> {
  await deleteDoc(doc(db, LIBRARY_TOPICS, id))
}

export function subscribeToLibraryTopics(
  callback: (topics: LibraryTopic[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, LIBRARY_TOPICS), (snapshot) => {
    const topics = snapshot.docs.map(doc => doc.data() as LibraryTopic)
    callback(topics.sort((a, b) => (a.order || 0) - (b.order || 0)))
  })
}

// ==================== SUBTOPICS ====================

export async function createLibrarySubtopic(subtopic: LibrarySubtopic): Promise<void> {
  await setDoc(doc(db, LIBRARY_SUBTOPICS, subtopic.id), subtopic)
}

export async function getLibrarySubtopics(): Promise<LibrarySubtopic[]> {
  const snapshot = await getDocs(collection(db, LIBRARY_SUBTOPICS))
  const subtopics = snapshot.docs.map(doc => doc.data() as LibrarySubtopic)
  return subtopics.sort((a, b) => (a.order || 0) - (b.order || 0))
}

export async function deleteLibrarySubtopic(id: string): Promise<void> {
  await deleteDoc(doc(db, LIBRARY_SUBTOPICS, id))
}

export function subscribeToLibrarySubtopics(
  callback: (subtopics: LibrarySubtopic[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, LIBRARY_SUBTOPICS), (snapshot) => {
    const subtopics = snapshot.docs.map(doc => doc.data() as LibrarySubtopic)
    callback(subtopics.sort((a, b) => (a.order || 0) - (b.order || 0)))
  })
}

// ==================== CONTENT PACKS ====================

export async function createLibraryPack(pack: LibraryContentPack): Promise<void> {
  await setDoc(doc(db, LIBRARY_PACKS, pack.id), pack)
}

export async function updateLibraryPack(packId: string, updates: Partial<LibraryContentPack>): Promise<void> {
  const ref = doc(db, LIBRARY_PACKS, packId)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    await setDoc(ref, { ...existing.data(), ...updates, updatedAt: Date.now() })
  }
}

export async function getLibraryPacks(): Promise<LibraryContentPack[]> {
  const q = query(collection(db, LIBRARY_PACKS))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => doc.data() as LibraryContentPack)
}

export async function deleteLibraryPack(id: string): Promise<void> {
  await deleteDoc(doc(db, LIBRARY_PACKS, id))
}

export function subscribeToLibraryPacks(
  callback: (packs: LibraryContentPack[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, LIBRARY_PACKS), (snapshot) => {
    const packs = snapshot.docs.map(doc => doc.data() as LibraryContentPack)
    callback(packs)
  })
}

// ==================== MCQs ====================

export async function createLibraryMCQ(mcq: LibraryMCQ): Promise<void> {
  await setDoc(doc(db, LIBRARY_MCQS, mcq.id), mcq)
}

export async function createLibraryMCQsBulk(mcqs: LibraryMCQ[]): Promise<void> {
  const batch = writeBatch(db)
  mcqs.forEach(mcq => {
    batch.set(doc(db, LIBRARY_MCQS, mcq.id), mcq)
  })
  await batch.commit()
}

export async function getLibraryMCQs(): Promise<LibraryMCQ[]> {
  const snapshot = await getDocs(collection(db, LIBRARY_MCQS))
  return snapshot.docs.map(doc => doc.data() as LibraryMCQ)
}

export async function getMCQsByPack(packId: string): Promise<LibraryMCQ[]> {
  const q = query(collection(db, LIBRARY_MCQS), where('packId', '==', packId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => doc.data() as LibraryMCQ)
}

export async function deleteLibraryMCQ(id: string): Promise<void> {
  await deleteDoc(doc(db, LIBRARY_MCQS, id))
}

export function subscribeToLibraryMCQs(
  callback: (mcqs: LibraryMCQ[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, LIBRARY_MCQS), (snapshot) => {
    const mcqs = snapshot.docs.map(doc => doc.data() as LibraryMCQ)
    callback(mcqs)
  })
}

// ==================== NOTES ====================

export async function createLibraryNote(note: LibraryNote): Promise<void> {
  await setDoc(doc(db, LIBRARY_NOTES, note.id), note)
}

export async function createLibraryNotesBulk(notes: LibraryNote[]): Promise<void> {
  const batch = writeBatch(db)
  notes.forEach(note => {
    batch.set(doc(db, LIBRARY_NOTES, note.id), note)
  })
  await batch.commit()
}

export async function getLibraryNotes(): Promise<LibraryNote[]> {
  const snapshot = await getDocs(collection(db, LIBRARY_NOTES))
  return snapshot.docs.map(doc => doc.data() as LibraryNote)
}

export async function getNotesByPack(packId: string): Promise<LibraryNote[]> {
  const q = query(collection(db, LIBRARY_NOTES), where('packId', '==', packId))
  const snapshot = await getDocs(q)
  const notes = snapshot.docs.map(doc => doc.data() as LibraryNote)
  return notes.sort((a, b) => (a.order || 0) - (b.order || 0))
}

export async function deleteLibraryNote(id: string): Promise<void> {
  await deleteDoc(doc(db, LIBRARY_NOTES, id))
}

export function subscribeToLibraryNotes(
  callback: (notes: LibraryNote[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, LIBRARY_NOTES), (snapshot) => {
    const notes = snapshot.docs.map(doc => doc.data() as LibraryNote)
    callback(notes)
  })
}

// ==================== USER DOWNLOADS ====================

export async function createLibraryDownload(download: UserLibraryDownload): Promise<void> {
  await setDoc(doc(db, LIBRARY_DOWNLOADS, download.id), download)
}

export async function getUserDownloads(userId: string): Promise<UserLibraryDownload[]> {
  const snapshot = await getDocs(collection(db, LIBRARY_DOWNLOADS))
  const downloads = snapshot.docs.map(doc => doc.data() as UserLibraryDownload)
  return downloads.filter(d => d.userId === userId)
}

export function subscribeToUserDownloads(
  userId: string,
  callback: (downloads: UserLibraryDownload[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, LIBRARY_DOWNLOADS), (snapshot) => {
    const allDownloads = snapshot.docs.map(doc => doc.data() as UserLibraryDownload)
    callback(allDownloads.filter(d => d.userId === userId))
  })
}

// ==================== SUBSCRIBE TO ALL LIBRARY DATA ====================

export function subscribeToAllLibraryData(callbacks: {
  onSubjects: (subjects: LibrarySubject[]) => void
  onTopics: (topics: LibraryTopic[]) => void
  onSubtopics?: (subtopics: LibrarySubtopic[]) => void
  onPacks: (packs: LibraryContentPack[]) => void
  onMcqs: (mcqs: LibraryMCQ[]) => void
  onNotes: (notes: LibraryNote[]) => void
}): Unsubscribe {
  const unsubscribers: Unsubscribe[] = []
  
  unsubscribers.push(subscribeToLibrarySubjects(callbacks.onSubjects))
  unsubscribers.push(subscribeToLibraryTopics(callbacks.onTopics))
  if (callbacks.onSubtopics) {
    unsubscribers.push(subscribeToLibrarySubtopics(callbacks.onSubtopics))
  }
  unsubscribers.push(subscribeToLibraryPacks(callbacks.onPacks))
  unsubscribers.push(subscribeToLibraryMCQs(callbacks.onMcqs))
  unsubscribers.push(subscribeToLibraryNotes(callbacks.onNotes))
  
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}

// ==================== INITIALIZE SAMPLE DATA TO FIREBASE ====================

export async function initializeLibrarySampleData(): Promise<void> {
  // Check if packs already exist (more reliable check)
  const existingPacks = await getLibraryPacks()
  if (existingPacks.length > 0) {
    console.log('Library data already exists in Firebase')
    return
  }
  
  console.log('Initializing library sample data to Firebase...')
  
  const now = Date.now()
  
  // Subjects
  const subjects: LibrarySubject[] = [
    { id: 'sub1', name: 'বাংলা', nameEn: 'Bengali', icon: '📚', order: 1, isActive: true, createdAt: now },
    { id: 'sub2', name: 'English', nameEn: 'English', icon: '📖', order: 2, isActive: true, createdAt: now },
    { id: 'sub3', name: 'গণিত', nameEn: 'Mathematics', icon: '🔢', order: 3, isActive: true, createdAt: now },
    { id: 'sub4', name: 'সাধারণ জ্ঞান', nameEn: 'General Knowledge', icon: '🌍', order: 4, isActive: true, createdAt: now },
    { id: 'sub5', name: 'বিজ্ঞান', nameEn: 'Science', icon: '🔬', order: 5, isActive: true, createdAt: now },
  ]
  
  // Topics
  const topics: LibraryTopic[] = [
    { id: 'top1', subjectId: 'sub1', name: 'ব্যাকরণ', nameEn: 'Grammar', order: 1, isActive: true, createdAt: now },
    { id: 'top2', subjectId: 'sub1', name: 'সাহিত্য', nameEn: 'Literature', order: 2, isActive: true, createdAt: now },
    { id: 'top3', subjectId: 'sub1', name: 'রচনা', nameEn: 'Essay', order: 3, isActive: true, createdAt: now },
    { id: 'top4', subjectId: 'sub2', name: 'Grammar', order: 1, isActive: true, createdAt: now },
    { id: 'top5', subjectId: 'sub2', name: 'Vocabulary', order: 2, isActive: true, createdAt: now },
    { id: 'top6', subjectId: 'sub3', name: 'পাটিগণিত', nameEn: 'Arithmetic', order: 1, isActive: true, createdAt: now },
    { id: 'top7', subjectId: 'sub3', name: 'বীজগণিত', nameEn: 'Algebra', order: 2, isActive: true, createdAt: now },
    { id: 'top8', subjectId: 'sub4', name: 'ভারতের ইতিহাস', nameEn: 'Indian History', order: 1, isActive: true, createdAt: now },
    { id: 'top9', subjectId: 'sub4', name: 'ভূগোল', nameEn: 'Geography', order: 2, isActive: true, createdAt: now },
  ]
  
  // Batch 1: Subjects and Topics
  const batch1 = writeBatch(db)
  subjects.forEach(s => batch1.set(doc(db, LIBRARY_SUBJECTS, s.id), s))
  topics.forEach(t => batch1.set(doc(db, LIBRARY_TOPICS, t.id), t))
  await batch1.commit()
  console.log('Subjects and Topics uploaded')
  
  // Content Packs
  const contentPacks: LibraryContentPack[] = [
    {
      id: 'pack1',
      subjectId: 'sub1',
      topicId: 'top1',
      title: 'সন্ধি বিচ্ছেদ - সম্পূর্ণ',
      description: 'স্বরসন্ধি, ব্যঞ্জনসন্ধি, বিসর্গ সন্ধি সহ ১০০+ MCQ',
      tags: ['সন্ধি', 'ব্যাকরণ', 'SSC', 'WBCS'],
      contentType: 'mcq',
      mcqCount: 50,
      notesCount: 0,
      pricing: 'free',
      downloadCount: 1250,
      rating: 4.5,
      isActive: true,
      isFeatured: true,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pack2',
      subjectId: 'sub1',
      topicId: 'top1',
      title: 'সমাস - MCQ ব্যাংক',
      description: 'দ্বন্দ্ব, কর্মধারয়, তৎপুরুষ, বহুব্রীহি সমাস',
      tags: ['সমাস', 'ব্যাকরণ'],
      contentType: 'mcq',
      mcqCount: 40,
      notesCount: 0,
      pricing: 'free',
      downloadCount: 890,
      isActive: true,
      isFeatured: false,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pack3',
      subjectId: 'sub1',
      topicId: 'top2',
      title: 'রবীন্দ্রনাথ ঠাকুর - সাহিত্য',
      description: 'রবীন্দ্রনাথের জীবন ও সাহিত্যকর্ম নিয়ে MCQ ও নোটস',
      tags: ['রবীন্দ্রনাথ', 'সাহিত্য', 'নোবেল'],
      contentType: 'both',
      mcqCount: 30,
      notesCount: 5,
      pricing: 'paid',
      price: 49,
      downloadCount: 450,
      rating: 4.8,
      isActive: true,
      isFeatured: true,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pack4',
      subjectId: 'sub2',
      topicId: 'top4',
      title: 'Tense - Complete Guide',
      description: 'All tenses with rules and 100+ MCQs',
      tags: ['Tense', 'Grammar', 'SSC'],
      contentType: 'both',
      mcqCount: 60,
      notesCount: 3,
      pricing: 'free',
      downloadCount: 2100,
      rating: 4.7,
      isActive: true,
      isFeatured: true,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pack5',
      subjectId: 'sub4',
      topicId: 'top8',
      title: 'স্বাধীনতা আন্দোলন',
      description: 'ভারতের স্বাধীনতা আন্দোলনের গুরুত্বপূর্ণ MCQ',
      tags: ['ইতিহাস', 'স্বাধীনতা', 'WBCS'],
      contentType: 'mcq',
      mcqCount: 80,
      notesCount: 0,
      pricing: 'paid',
      price: 29,
      downloadCount: 670,
      isActive: true,
      isFeatured: false,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    },
  ]
  
  // Batch 2: Content Packs
  const batch2 = writeBatch(db)
  contentPacks.forEach(p => batch2.set(doc(db, LIBRARY_PACKS, p.id), p))
  await batch2.commit()
  console.log('Content Packs uploaded')
  
  // Batch 3: MCQs
  const mcqBatch = writeBatch(db)
  
  const mcqs: LibraryMCQ[] = [
    {
      id: 'lmcq1',
      packId: 'pack1',
      subjectId: 'sub1',
      topicId: 'top1',
      question: '"হিমালয়" শব্দের সন্ধি বিচ্ছেদ কোনটি?',
      options: ['হিম + আলয়', 'হিম + অলয়', 'হিমা + লয়', 'হি + মালয়'],
      correctIndex: 0,
      explanation: 'হিম + আলয় = হিমালয় (স্বরসন্ধি)',
      difficulty: 'easy',
      createdAt: now,
    },
    {
      id: 'lmcq2',
      packId: 'pack1',
      subjectId: 'sub1',
      topicId: 'top1',
      question: '"বিদ্যালয়" শব্দের সন্ধি বিচ্ছেদ কোনটি?',
      options: ['বিদ্য + আলয়', 'বিদ্যা + আলয়', 'বিদ্যা + লয়', 'বিদ + আলয়'],
      correctIndex: 1,
      explanation: 'বিদ্যা + আলয় = বিদ্যালয় (স্বরসন্ধি: আ + আ = আ)',
      difficulty: 'easy',
      createdAt: now,
    },
    {
      id: 'lmcq3',
      packId: 'pack1',
      subjectId: 'sub1',
      topicId: 'top1',
      question: '"সংস্কার" শব্দের সন্ধি বিচ্ছেদ কোনটি?',
      options: ['সং + কার', 'সম + কার', 'সম্ + কার', 'সং + স্কার'],
      correctIndex: 2,
      explanation: 'সম্ + কার = সংস্কার (ব্যঞ্জনসন্ধি)',
      difficulty: 'medium',
      createdAt: now,
    },
    {
      id: 'lmcq4',
      packId: 'pack1',
      subjectId: 'sub1',
      topicId: 'top1',
      question: '"দুর্গা" শব্দের সন্ধি বিচ্ছেদ কোনটি?',
      options: ['দুঃ + গা', 'দুর + গা', 'দুঃ + গা', 'দু + র্গা'],
      correctIndex: 2,
      explanation: 'দুঃ + গা = দুর্গা (বিসর্গ সন্ধি)',
      difficulty: 'medium',
      createdAt: now,
    },
    {
      id: 'lmcq5',
      packId: 'pack1',
      subjectId: 'sub1',
      topicId: 'top1',
      question: '"পরীক্ষা" শব্দের সন্ধি বিচ্ছেদ কোনটি?',
      options: ['পরি + ঈক্ষা', 'পরী + ক্ষা', 'পরি + ইক্ষা', 'পর + ঈক্ষা'],
      correctIndex: 0,
      explanation: 'পরি + ঈক্ষা = পরীক্ষা (স্বরসন্ধি: ই + ঈ = ঈ)',
      difficulty: 'medium',
      createdAt: now,
    },
    {
      id: 'lmcq6',
      packId: 'pack4',
      subjectId: 'sub2',
      topicId: 'top4',
      question: 'Which tense is used: "She has been working here since 2010"?',
      options: ['Present Perfect', 'Present Perfect Continuous', 'Past Perfect', 'Past Continuous'],
      correctIndex: 1,
      explanation: 'Present Perfect Continuous is used for actions started in past and continuing.',
      difficulty: 'medium',
      createdAt: now,
    },
    {
      id: 'lmcq7',
      packId: 'pack4',
      subjectId: 'sub2',
      topicId: 'top4',
      question: 'Choose the correct form: "By next year, I ___ here for 5 years."',
      options: ['will work', 'will be working', 'will have been working', 'would work'],
      correctIndex: 2,
      explanation: 'Future Perfect Continuous for duration up to a point in future.',
      difficulty: 'hard',
      createdAt: now,
    },
  ]
  
  mcqs.forEach(m => mcqBatch.set(doc(db, LIBRARY_MCQS, m.id), m))
  
  // Notes
  const notes: LibraryNote[] = [
    {
      id: 'lnote1',
      packId: 'pack4',
      subjectId: 'sub2',
      topicId: 'top4',
      title: 'Introduction to Tenses',
      content: `<h2>What is Tense?</h2>
<p>Tense tells us about the <strong>time of an action</strong>. In English, there are three main tenses:</p>
<ul>
  <li><strong>Present Tense</strong> - Action happening now</li>
  <li><strong>Past Tense</strong> - Action that happened before</li>
  <li><strong>Future Tense</strong> - Action that will happen</li>
</ul>
<p>Each tense has 4 forms: Simple, Continuous, Perfect, and Perfect Continuous.</p>`,
      order: 1,
      createdAt: now,
    },
    {
      id: 'lnote2',
      packId: 'pack3',
      subjectId: 'sub1',
      topicId: 'top2',
      title: 'রবীন্দ্রনাথ ঠাকুর - জীবনী',
      content: `<h2>রবীন্দ্রনাথ ঠাকুর (১৮৬১-১৯৪১)</h2>
<p>রবীন্দ্রনাথ ঠাকুর বাংলা সাহিত্যের অন্যতম শ্রেষ্ঠ কবি। তিনি <strong>১৯১৩ সালে</strong> গীতাঞ্জলি কাব্যগ্রন্থের জন্য সাহিত্যে নোবেল পুরস্কার পান।</p>
<h3>গুরুত্বপূর্ণ তথ্য:</h3>
<ul>
  <li>জন্ম: ৭ মে ১৮৬১, জোড়াসাঁকো, কলকাতা</li>
  <li>মৃত্যু: ৭ আগস্ট ১৯৪১</li>
  <li>উপাধি: বিশ্বকবি, গুরুদেব</li>
</ul>`,
      order: 1,
      createdAt: now,
    },
  ]
  
  notes.forEach(n => mcqBatch.set(doc(db, LIBRARY_NOTES, n.id), n))
  
  await mcqBatch.commit()
  
  console.log('Library sample data initialized to Firebase!')
}
