/**
 * Asset Sync Utility
 * Handles two-way synchronization between Asset Library and Desks
 * 
 * Flow:
 * 1. Library → Desks: When MCQ edited in Library, update all desks with assetRef
 * 2. Desks → Library: When MCQ edited in Desk, update Library entry
 */

import { useAssetStore } from '@/stores/asset-store'
import { usePersonalStore } from '@/stores/personal-store'
import { useGroupStore } from '@/stores/group-store'
import { useCoachingStore } from '@/stores/coaching-store'
import { db } from '@/config/firebase'
import { doc, setDoc } from 'firebase/firestore'
import type { AssetMCQ } from '@/types'

/**
 * Parse assetRef string to get assetId and questionId
 * Format: "assetId:questionId"
 */
export function parseAssetRef(assetRef: string): { assetId: string; questionId: string } | null {
  if (!assetRef || !assetRef.includes(':')) return null
  const [assetId, questionId] = assetRef.split(':')
  return { assetId, questionId }
}

/**
 * Get MCQ data from Asset Library by assetRef
 */
export function getMCQFromLibrary(assetRef: string) {
  const parsed = parseAssetRef(assetRef)
  if (!parsed) return null
  
  const { getMCQById } = useAssetStore.getState()
  const asset = getMCQById(parsed.assetId)
  if (!asset) return null
  
  const question = asset.quizQuestions?.find(q => q.id === parsed.questionId)
  return question || null
}

/**
 * Sync Library MCQ to Personal Desk
 * Called when Library MCQ is updated
 */
export function syncLibraryToPersonal(assetId: string, questionId: string) {
  const assetRef = `${assetId}:${questionId}`
  const { courseMCQs, updateCourseMCQ } = usePersonalStore.getState()
  const libraryMCQ = getMCQFromLibrary(assetRef)
  
  if (!libraryMCQ) return 0
  
  let syncedCount = 0
  courseMCQs.forEach(mcq => {
    if (mcq.assetRef === assetRef) {
      updateCourseMCQ({
        ...mcq,
        question: libraryMCQ.question,
        options: libraryMCQ.options,
        correctIndex: libraryMCQ.correctIndex,
        explanation: libraryMCQ.explanation,
        difficulty: libraryMCQ.difficulty,
      })
      syncedCount++
    }
  })
  
  return syncedCount
}

/**
 * Sync Library MCQ to Group Desk
 * Called when Library MCQ is updated
 */
export function syncLibraryToGroup(assetId: string, questionId: string) {
  const assetRef = `${assetId}:${questionId}`
  const { groupMCQs, updateGroupMCQ } = useGroupStore.getState()
  const libraryMCQ = getMCQFromLibrary(assetRef)
  
  if (!libraryMCQ) return 0
  
  let syncedCount = 0
  groupMCQs.forEach(mcq => {
    if ((mcq as any).assetRef === assetRef) {
      updateGroupMCQ({
        ...mcq,
        question: libraryMCQ.question,
        options: libraryMCQ.options,
        correctIndex: libraryMCQ.correctIndex,
        explanation: libraryMCQ.explanation,
        difficulty: libraryMCQ.difficulty,
      })
      syncedCount++
    }
  })
  
  return syncedCount
}

/**
 * Sync Library MCQ to Coaching Desk
 * Called when Library MCQ is updated
 */
export function syncLibraryToCoaching(assetId: string, questionId: string) {
  const assetRef = `${assetId}:${questionId}`
  const { mcqs, updateMCQ } = useCoachingStore.getState()
  const libraryMCQ = getMCQFromLibrary(assetRef)
  
  if (!libraryMCQ) return 0
  
  let syncedCount = 0
  mcqs.forEach(mcq => {
    if ((mcq as any).assetRef === assetRef) {
      const updated = {
        ...mcq,
        question: libraryMCQ.question,
        options: libraryMCQ.options,
        correctIndex: libraryMCQ.correctIndex,
        explanation: libraryMCQ.explanation,
        difficulty: libraryMCQ.difficulty as 'easy' | 'medium' | 'hard',
      }
      updateMCQ(updated)
      // Also update in Firebase
      setDoc(doc(db, 'coaching-mcqs', mcq.id), updated).catch(console.error)
      syncedCount++
    }
  })
  
  return syncedCount
}

/**
 * Sync Personal Desk MCQ to Library
 * Called when Personal MCQ is updated
 */
export function syncPersonalToLibrary(mcqId: string) {
  const { courseMCQs } = usePersonalStore.getState()
  const { updateSingleMCQ } = useAssetStore.getState()
  
  const mcq = courseMCQs.find(m => m.id === mcqId)
  if (!mcq || !mcq.assetRef) return false
  
  const parsed = parseAssetRef(mcq.assetRef)
  if (!parsed) return false
  
  updateSingleMCQ(parsed.assetId, parsed.questionId, {
    question: mcq.question,
    options: mcq.options,
    correctIndex: mcq.correctIndex,
    explanation: mcq.explanation,
    difficulty: mcq.difficulty,
  })
  
  return true
}

/**
 * Sync Group Desk MCQ to Library
 * Called when Group MCQ is updated
 */
export function syncGroupToLibrary(mcqId: string) {
  const { groupMCQs } = useGroupStore.getState()
  const { updateSingleMCQ } = useAssetStore.getState()
  
  const mcq = groupMCQs.find(m => m.id === mcqId)
  if (!mcq || !(mcq as any).assetRef) return false
  
  const parsed = parseAssetRef((mcq as any).assetRef)
  if (!parsed) return false
  
  updateSingleMCQ(parsed.assetId, parsed.questionId, {
    question: mcq.question,
    options: mcq.options,
    correctIndex: mcq.correctIndex,
    explanation: mcq.explanation,
    difficulty: mcq.difficulty,
  })
  
  return true
}

/**
 * Sync Coaching Desk MCQ to Library
 * Called when Coaching MCQ is updated
 */
export function syncCoachingToLibrary(mcqId: string) {
  const { mcqs } = useCoachingStore.getState()
  const { updateSingleMCQ } = useAssetStore.getState()
  
  const mcq = mcqs.find(m => m.id === mcqId)
  if (!mcq || !(mcq as any).assetRef) return false
  
  const parsed = parseAssetRef((mcq as any).assetRef)
  if (!parsed) return false
  
  updateSingleMCQ(parsed.assetId, parsed.questionId, {
    question: mcq.question,
    options: mcq.options,
    correctIndex: mcq.correctIndex,
    explanation: (mcq as any).explanation,
    difficulty: mcq.difficulty,
  })
  
  return true
}

/**
 * Sync all desks from Library
 * Called when a Library MCQ is updated
 */
export function syncAllDesksFromLibrary(assetId: string, questionId: string) {
  const personalSynced = syncLibraryToPersonal(assetId, questionId)
  const groupSynced = syncLibraryToGroup(assetId, questionId)
  const coachingSynced = syncLibraryToCoaching(assetId, questionId)
  
  return {
    personal: personalSynced,
    group: groupSynced,
    coaching: coachingSynced,
    total: personalSynced + groupSynced + coachingSynced
  }
}

/**
 * Get all MCQs from Library that match search query
 */
export function searchLibraryMCQs(query: string, limit = 50) {
  const { assets } = useAssetStore.getState()
  const mcqAssets = assets.filter(a => a.type === 'mcq') as AssetMCQ[]
  
  const lowerQuery = query.toLowerCase()
  const results: Array<{
    assetId: string
    questionId: string
    question: string
    options: string[]
    correctIndex: number
    explanation?: string
    difficulty?: string
  }> = []
  
  for (const asset of mcqAssets) {
    if (results.length >= limit) break
    
    for (const q of asset.quizQuestions || []) {
      if (results.length >= limit) break
      
      const matchesQuery = 
        q.question.toLowerCase().includes(lowerQuery) ||
        q.options.some(o => o.toLowerCase().includes(lowerQuery)) ||
        q.explanation?.toLowerCase().includes(lowerQuery)
      
      if (matchesQuery) {
        results.push({
          assetId: asset.id,
          questionId: q.id,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })
      }
    }
  }
  
  return results
}

/**
 * Import MCQ from Library to Personal Desk
 */
export function importToPersonal(
  assetId: string, 
  questionId: string, 
  courseId: string, 
  categoryId: string,
  userId: string
) {
  const { addCourseMCQ } = usePersonalStore.getState()
  const libraryMCQ = getMCQFromLibrary(`${assetId}:${questionId}`)
  
  if (!libraryMCQ) return null
  
  const newMCQ = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    courseId,
    categoryId,
    userId,
    question: libraryMCQ.question,
    options: libraryMCQ.options,
    correctIndex: libraryMCQ.correctIndex,
    explanation: libraryMCQ.explanation,
    difficulty: libraryMCQ.difficulty,
    assetRef: `${assetId}:${questionId}`,
    createdAt: Date.now(),
  }
  
  addCourseMCQ(newMCQ as any)
  return newMCQ
}

/**
 * Import MCQ from Library to Group Desk
 */
export function importToGroup(
  assetId: string,
  questionId: string,
  groupId: string,
  categoryId: string,
  userId: string,
  userName: string
) {
  const { addGroupMCQ } = useGroupStore.getState()
  const libraryMCQ = getMCQFromLibrary(`${assetId}:${questionId}`)
  
  if (!libraryMCQ) return null
  
  const newMCQ = {
    id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    groupId,
    categoryId,
    question: libraryMCQ.question,
    options: libraryMCQ.options,
    correctIndex: libraryMCQ.correctIndex,
    explanation: libraryMCQ.explanation,
    difficulty: libraryMCQ.difficulty,
    createdBy: userId,
    createdByName: userName,
    assetRef: `${assetId}:${questionId}`,
    createdAt: Date.now(),
  }
  
  addGroupMCQ(newMCQ as any)
  return newMCQ
}

/**
 * Import MCQ from Library to Coaching Desk
 */
export function importToCoaching(
  assetId: string,
  questionId: string,
  courseId: string,
  categoryId: string,
  userId: string,
  userName: string
) {
  const { addMCQ } = useCoachingStore.getState()
  const libraryMCQ = getMCQFromLibrary(`${assetId}:${questionId}`)
  
  if (!libraryMCQ) return null
  
  const newMCQ = {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    courseId,
    lessonId: '',
    question: libraryMCQ.question,
    options: libraryMCQ.options,
    correctIndex: libraryMCQ.correctIndex,
    marks: 1,
    negativeMarks: 0,
    difficulty: (libraryMCQ.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
    order: 0,
    categoryId,
    explanation: libraryMCQ.explanation,
    createdBy: userId,
    createdByName: userName,
    assetRef: `${assetId}:${questionId}`,
    createdAt: Date.now(),
  }
  
  addMCQ(newMCQ as any)
  // Also save to Firebase
  setDoc(doc(db, 'coaching-mcqs', newMCQ.id), newMCQ).catch(console.error)
  return newMCQ
}
