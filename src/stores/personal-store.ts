import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/config/firebase'
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'
import type {
  PersonalCourse,
  PersonalTopic,
  PersonalSubTopic,
  PersonalContentItem,
  PersonalQuestionCategory,
  PersonalMCQ,
  PersonalQuizResult,
  PersonalLiveTest,
  PersonalLiveTestResult,
  PersonalAutoLiveTestConfig
} from '@/types'

// Legacy types for backward compatibility (will be migrated)
export type Subject = {
  id: string
  name: string
}

export type Category = {
  id: string
  name: string
  subjectId: string
  parentId?: string
}

export type MCQ = {
  id: string
  categoryId: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export type Note = {
  id: string
  categoryId: string
  title: string
  content: string
}

export type TestResult = {
  id: string
  date: number
  testType: 'live' | 'mock'
  totalQuestions: number
  correct: number
  wrong: number
  skipped: number
  score: number
}

type TestSettings = {
  liveCategories: string[]
  liveCount: number
  mockCount: number
}

interface PersonalState {
  // ===============================
  // New Course-based Structure
  // ===============================
  courses: PersonalCourse[]
  topics: PersonalTopic[]
  subTopics: PersonalSubTopic[]
  contentItems: PersonalContentItem[]
  questionCategories: PersonalQuestionCategory[]
  courseMCQs: PersonalMCQ[]
  quizResults: PersonalQuizResult[]
  liveTests: PersonalLiveTest[]
  liveTestResults: PersonalLiveTestResult[]
  autoLiveTestConfigs: PersonalAutoLiveTestConfig[]
  
  activeCourseId: string | null
  
  // Course Actions
  setActiveCourse: (courseId: string | null) => void
  addCourse: (course: PersonalCourse) => void
  updateCourse: (course: PersonalCourse) => void
  removeCourse: (courseId: string) => void
  
  // Topic Actions
  addTopic: (topic: PersonalTopic) => void
  updateTopic: (topic: PersonalTopic) => void
  removeTopic: (topicId: string) => void
  
  // SubTopic Actions
  addSubTopic: (subTopic: PersonalSubTopic) => void
  updateSubTopic: (subTopic: PersonalSubTopic) => void
  removeSubTopic: (subTopicId: string) => void
  
  // Content Actions
  addContentItem: (item: PersonalContentItem) => void
  updateContentItem: (item: PersonalContentItem) => void
  removeContentItem: (itemId: string) => void
  
  // Question Category Actions
  addQuestionCategory: (category: PersonalQuestionCategory) => void
  removeQuestionCategory: (categoryId: string) => void
  
  // MCQ Actions (Course-based)
  addCourseMCQ: (mcq: PersonalMCQ) => void
  updateCourseMCQ: (mcq: PersonalMCQ) => void
  removeCourseMCQ: (mcqId: string) => void
  
  // Quiz Result Actions
  addQuizResult: (result: PersonalQuizResult) => void
  getQuizResultsByQuiz: (quizItemId: string) => PersonalQuizResult[]
  
  // Live Test Actions
  addLiveTest: (test: PersonalLiveTest) => void
  updateLiveTest: (test: PersonalLiveTest) => void
  removeLiveTest: (testId: string) => void
  getLiveTestsByCourse: (courseId: string) => PersonalLiveTest[]
  
  // Live Test Result Actions
  addLiveTestResult: (result: PersonalLiveTestResult) => void
  getLiveTestResultsByTest: (testId: string) => PersonalLiveTestResult[]
  
  // Auto Live Test Config Actions
  setAutoLiveTestConfig: (config: PersonalAutoLiveTestConfig) => void
  getAutoLiveTestConfig: (courseId: string) => PersonalAutoLiveTestConfig | undefined
  
  // Helper Functions
  getActiveCourse: () => PersonalCourse | undefined
  getTopicsByCourse: (courseId: string) => PersonalTopic[]
  getSubTopicsByTopic: (topicId: string) => PersonalSubTopic[]
  getContentBySubTopic: (subTopicId: string) => PersonalContentItem[]
  getContentByTopic: (topicId: string) => PersonalContentItem[]
  getMCQsByCourse: (courseId: string) => PersonalMCQ[]
  getMCQsByCategory: (categoryId: string) => PersonalMCQ[]
  getCategoriesByCourse: (courseId: string) => PersonalQuestionCategory[]
  
  // Firebase Sync Functions
  loadFromFirebase: (userId: string) => Promise<void>
  subscribeToFirebase: (userId: string) => () => void
  
  // ===============================
  // Legacy (for backward compatibility)
  // ===============================
  subjects: Subject[]
  categories: Category[]
  mcqs: MCQ[]
  notes: Note[]
  testResults: TestResult[]
  settings: TestSettings
  selectedSubjectId?: string
  
  // Legacy actions
  addSubject: (s: Subject) => void
  removeSubject: (id: string) => void
  setSelectedSubject: (id?: string) => void
  addCategory: (c: Category) => void
  removeCategory: (id: string) => void
  addMCQ: (q: MCQ) => void
  updateMCQ: (q: MCQ) => void
  removeMCQ: (id: string) => void
  addNote: (n: Note) => void
  updateNote: (n: Note) => void
  removeNote: (id: string) => void
  addTestResult: (r: TestResult) => void
  updateSettings: (s: Partial<TestSettings>) => void
}

export const usePersonalStore = create<PersonalState>()(
  persist(
    (set, get) => ({
      // ===============================
      // New Course-based State
      // ===============================
      courses: [],
      topics: [],
      subTopics: [],
      contentItems: [],
      questionCategories: [],
      courseMCQs: [],
      quizResults: [],
      liveTests: [],
      liveTestResults: [],
      autoLiveTestConfigs: [],
      activeCourseId: null,
      
      // Course Actions
      setActiveCourse: (courseId) => set({ activeCourseId: courseId }),
      
      addCourse: async (course) => {
        set(state => ({ courses: [...state.courses, course] }))
        try {
          await setDoc(doc(db, 'personal-courses', course.id), course)
        } catch (e) { console.error('Error saving course:', e) }
      },
      
      updateCourse: async (course) => {
        set(state => ({
          courses: state.courses.map(c => c.id === course.id ? course : c)
        }))
        try {
          await setDoc(doc(db, 'personal-courses', course.id), course)
        } catch (e) { console.error('Error updating course:', e) }
      },
      
      removeCourse: async (courseId) => {
        const state = get()
        // Get all related data to delete
        const topicsToDelete = state.topics.filter(t => t.courseId === courseId)
        const contentToDelete = state.contentItems.filter(ci => ci.courseId === courseId)
        const mcqsToDelete = state.courseMCQs.filter(m => m.courseId === courseId)
        const catsToDelete = state.questionCategories.filter(qc => qc.courseId === courseId)
        
        set(state => ({
          courses: state.courses.filter(c => c.id !== courseId),
          topics: state.topics.filter(t => t.courseId !== courseId),
          subTopics: state.subTopics.filter(st => st.courseId !== courseId),
          contentItems: state.contentItems.filter(ci => ci.courseId !== courseId),
          questionCategories: state.questionCategories.filter(qc => qc.courseId !== courseId),
          courseMCQs: state.courseMCQs.filter(m => m.courseId !== courseId),
          quizResults: state.quizResults.filter(qr => qr.courseId !== courseId),
        liveTests: state.liveTests.filter(lt => lt.courseId !== courseId),
        liveTestResults: state.liveTestResults.filter(ltr => ltr.courseId !== courseId),
        activeCourseId: state.activeCourseId === courseId ? null : state.activeCourseId,
      }))
        
        // Delete from Firebase
        try {
          const batch = writeBatch(db)
          batch.delete(doc(db, 'personal-courses', courseId))
          topicsToDelete.forEach(t => batch.delete(doc(db, 'personal-topics', t.id)))
          contentToDelete.forEach(c => batch.delete(doc(db, 'personal-content', c.id)))
          mcqsToDelete.forEach(m => batch.delete(doc(db, 'personal-mcqs', m.id)))
          catsToDelete.forEach(cat => batch.delete(doc(db, 'personal-categories', cat.id)))
          await batch.commit()
        } catch (e) { console.error('Error deleting course:', e) }
      },
      
      // Topic Actions
      addTopic: async (topic) => {
        set(state => ({ topics: [...state.topics, topic] }))
        try {
          await setDoc(doc(db, 'personal-topics', topic.id), topic)
        } catch (e) { console.error('Error saving topic:', e) }
      },
      
      updateTopic: async (topic) => {
        set(state => ({
          topics: state.topics.map(t => t.id === topic.id ? topic : t)
        }))
        try {
          await setDoc(doc(db, 'personal-topics', topic.id), topic)
        } catch (e) { console.error('Error updating topic:', e) }
      },
      
      removeTopic: async (topicId) => {
        const contentToDelete = get().contentItems.filter(ci => ci.topicId === topicId)
        set(state => ({
          topics: state.topics.filter(t => t.id !== topicId),
          subTopics: state.subTopics.filter(st => st.topicId !== topicId),
          contentItems: state.contentItems.filter(ci => ci.topicId !== topicId),
        }))
        try {
          const batch = writeBatch(db)
          batch.delete(doc(db, 'personal-topics', topicId))
          contentToDelete.forEach(c => batch.delete(doc(db, 'personal-content', c.id)))
          await batch.commit()
        } catch (e) { console.error('Error deleting topic:', e) }
      },
      
      // SubTopic Actions (legacy - not using Firebase)
      addSubTopic: (subTopic) => set(state => ({
        subTopics: [...state.subTopics, subTopic]
      })),
      
      updateSubTopic: (subTopic) => set(state => ({
        subTopics: state.subTopics.map(st => st.id === subTopic.id ? subTopic : st)
      })),
      
      removeSubTopic: (subTopicId) => set(state => ({
        subTopics: state.subTopics.filter(st => st.id !== subTopicId),
        contentItems: state.contentItems.filter(ci => ci.subTopicId !== subTopicId),
      })),
      
      // Content Actions
      addContentItem: async (item) => {
        set(state => ({ contentItems: [...state.contentItems, item] }))
        try {
          await setDoc(doc(db, 'personal-content', item.id), item)
        } catch (e) { console.error('Error saving content:', e) }
      },
      
      updateContentItem: async (item) => {
        set(state => ({
          contentItems: state.contentItems.map(ci => ci.id === item.id ? item : ci)
        }))
        try {
          await setDoc(doc(db, 'personal-content', item.id), item)
        } catch (e) { console.error('Error updating content:', e) }
      },
      
      removeContentItem: async (itemId) => {
        set(state => ({
          contentItems: state.contentItems.filter(ci => ci.id !== itemId)
        }))
        try {
          await deleteDoc(doc(db, 'personal-content', itemId))
        } catch (e) { console.error('Error deleting content:', e) }
      },
      
      // Question Category Actions
      addQuestionCategory: async (category) => {
        set(state => ({
          questionCategories: [...state.questionCategories, category]
        }))
        try {
          await setDoc(doc(db, 'personal-categories', category.id), category)
        } catch (e) { console.error('Error saving category:', e) }
      },
      
      removeQuestionCategory: async (categoryId) => {
        const mcqsToDelete = get().courseMCQs.filter(m => m.categoryId === categoryId)
        set(state => ({
          questionCategories: state.questionCategories.filter(qc => qc.id !== categoryId),
          courseMCQs: state.courseMCQs.filter(m => m.categoryId !== categoryId),
        }))
        try {
          const batch = writeBatch(db)
          batch.delete(doc(db, 'personal-categories', categoryId))
          mcqsToDelete.forEach(m => batch.delete(doc(db, 'personal-mcqs', m.id)))
          await batch.commit()
        } catch (e) { console.error('Error deleting category:', e) }
      },
      
      // MCQ Actions
      addCourseMCQ: async (mcq) => {
        set(state => ({ courseMCQs: [...state.courseMCQs, mcq] }))
        try {
          await setDoc(doc(db, 'personal-mcqs', mcq.id), mcq)
        } catch (e) { console.error('Error saving MCQ:', e) }
      },
      
      updateCourseMCQ: async (mcq) => {
        set(state => ({
          courseMCQs: state.courseMCQs.map(m => m.id === mcq.id ? mcq : m)
        }))
        try {
          await setDoc(doc(db, 'personal-mcqs', mcq.id), mcq)
        } catch (e) { console.error('Error updating MCQ:', e) }
      },
      
      removeCourseMCQ: async (mcqId) => {
        set(state => ({
          courseMCQs: state.courseMCQs.filter(m => m.id !== mcqId)
        }))
        try {
          await deleteDoc(doc(db, 'personal-mcqs', mcqId))
        } catch (e) { console.error('Error deleting MCQ:', e) }
      },
      
      // Quiz Result Actions
      addQuizResult: async (result) => {
        set(state => ({ quizResults: [...state.quizResults, result] }))
        try {
          await setDoc(doc(db, 'personal-quiz-results', result.id), result)
        } catch (e) { console.error('Error saving quiz result:', e) }
      },
      
      getQuizResultsByQuiz: (quizItemId) => {
        return get().quizResults.filter(qr => qr.quizItemId === quizItemId)
      },
      
      // Live Test Actions
      addLiveTest: async (test) => {
        set(state => ({ liveTests: [...state.liveTests, test] }))
        try {
          await setDoc(doc(db, 'personal-live-tests', test.id), test)
        } catch (e) { console.error('Error saving live test:', e) }
      },
      
      updateLiveTest: async (test) => {
        set(state => ({
          liveTests: state.liveTests.map(lt => lt.id === test.id ? test : lt)
        }))
        try {
          await setDoc(doc(db, 'personal-live-tests', test.id), test)
        } catch (e) { console.error('Error updating live test:', e) }
      },
      
      removeLiveTest: async (testId) => {
        const resultsToDelete = get().liveTestResults.filter(r => r.testId === testId)
        set(state => ({
          liveTests: state.liveTests.filter(lt => lt.id !== testId),
          liveTestResults: state.liveTestResults.filter(ltr => ltr.testId !== testId),
        }))
        try {
          const batch = writeBatch(db)
          batch.delete(doc(db, 'personal-live-tests', testId))
          resultsToDelete.forEach(r => batch.delete(doc(db, 'personal-live-test-results', r.id)))
          await batch.commit()
        } catch (e) { console.error('Error deleting live test:', e) }
      },
      
      getLiveTestsByCourse: (courseId) => {
        return get().liveTests.filter(lt => lt.courseId === courseId)
      },
      
      // Live Test Result Actions
      addLiveTestResult: async (result) => {
        set(state => ({ liveTestResults: [...state.liveTestResults, result] }))
        try {
          await setDoc(doc(db, 'personal-live-test-results', result.id), result)
        } catch (e) { console.error('Error saving live test result:', e) }
      },
      
      getLiveTestResultsByTest: (testId) => {
        return get().liveTestResults.filter(ltr => ltr.testId === testId)
      },
      
      // Auto Live Test Config Actions
      setAutoLiveTestConfig: async (config) => {
        set(state => ({
          autoLiveTestConfigs: state.autoLiveTestConfigs.some(c => c.courseId === config.courseId)
            ? state.autoLiveTestConfigs.map(c => c.courseId === config.courseId ? config : c)
            : [...state.autoLiveTestConfigs, config]
        }))
        try {
          await setDoc(doc(db, 'personal-auto-test-configs', config.id), config)
        } catch (e) { console.error('Error saving auto test config:', e) }
      },
      
      getAutoLiveTestConfig: (courseId) => {
        return get().autoLiveTestConfigs.find(c => c.courseId === courseId)
      },
      
      // Helper Functions
      getActiveCourse: () => {
        const state = get()
        return state.courses.find(c => c.id === state.activeCourseId)
      },
      
      getTopicsByCourse: (courseId) => {
        return get().topics.filter(t => t.courseId === courseId).sort((a, b) => a.order - b.order)
      },
      
      getSubTopicsByTopic: (topicId) => {
        return get().subTopics.filter(st => st.topicId === topicId).sort((a, b) => a.order - b.order)
      },
      
      getContentBySubTopic: (subTopicId) => {
        return get().contentItems.filter(ci => ci.subTopicId === subTopicId).sort((a, b) => (a.order || 0) - (b.order || 0))
      },
      
      getContentByTopic: (topicId) => {
        return get().contentItems.filter(ci => ci.topicId === topicId).sort((a, b) => (a.order || 0) - (b.order || 0))
      },
      
      getMCQsByCourse: (courseId) => {
        return get().courseMCQs.filter(m => m.courseId === courseId)
      },
      
      getMCQsByCategory: (categoryId) => {
        return get().courseMCQs.filter(m => m.categoryId === categoryId)
      },
      
      getCategoriesByCourse: (courseId) => {
        return get().questionCategories.filter(qc => qc.courseId === courseId)
      },
      
      // Firebase Sync Functions
      loadFromFirebase: async (userId: string) => {
        try {
          // Load courses
          const coursesSnap = await getDocs(query(collection(db, 'personal-courses'), where('userId', '==', userId)))
          const courses = coursesSnap.docs.map(d => ({ ...d.data() } as PersonalCourse))
          
          // Load topics
          const topicsSnap = await getDocs(query(collection(db, 'personal-topics'), where('userId', '==', userId)))
          const topics = topicsSnap.docs.map(d => ({ ...d.data() } as PersonalTopic))
          
          // Load content items
          const contentSnap = await getDocs(query(collection(db, 'personal-content'), where('userId', '==', userId)))
          const contentItems = contentSnap.docs.map(d => ({ ...d.data() } as PersonalContentItem))
          
          // Load MCQs
          const mcqsSnap = await getDocs(query(collection(db, 'personal-mcqs'), where('userId', '==', userId)))
          const courseMCQs = mcqsSnap.docs.map(d => ({ ...d.data() } as PersonalMCQ))
          
          // Load categories
          const catsSnap = await getDocs(query(collection(db, 'personal-categories'), where('userId', '==', userId)))
          const questionCategories = catsSnap.docs.map(d => ({ ...d.data() } as PersonalQuestionCategory))
          
          // Load quiz results
          const quizResultsSnap = await getDocs(query(collection(db, 'personal-quiz-results'), where('userId', '==', userId)))
          const quizResults = quizResultsSnap.docs.map(d => ({ ...d.data() } as PersonalQuizResult))
          
          // Load live tests
          const liveTestsSnap = await getDocs(query(collection(db, 'personal-live-tests'), where('userId', '==', userId)))
          const liveTests = liveTestsSnap.docs.map(d => ({ ...d.data() } as PersonalLiveTest))
          
          // Load live test results
          const liveTestResultsSnap = await getDocs(query(collection(db, 'personal-live-test-results'), where('userId', '==', userId)))
          const liveTestResults = liveTestResultsSnap.docs.map(d => ({ ...d.data() } as PersonalLiveTestResult))
          
          // Load auto live test configs
          const autoConfigsSnap = await getDocs(query(collection(db, 'personal-auto-test-configs'), where('userId', '==', userId)))
          const autoLiveTestConfigs = autoConfigsSnap.docs.map(d => ({ ...d.data() } as PersonalAutoLiveTestConfig))
          
          set({ courses, topics, contentItems, courseMCQs, questionCategories, quizResults, liveTests, liveTestResults, autoLiveTestConfigs })
          console.log('✅ Personal data loaded from Firebase')
        } catch (error) {
          console.error('Error loading personal data:', error)
        }
      },
      
      subscribeToFirebase: (userId: string) => {
        const unsubscribers: (() => void)[] = []
        
        // Subscribe to courses
        unsubscribers.push(
          onSnapshot(query(collection(db, 'personal-courses'), where('userId', '==', userId)), (snap) => {
            const courses = snap.docs.map(d => ({ ...d.data() } as PersonalCourse))
            set({ courses })
          })
        )
        
        // Subscribe to topics
        unsubscribers.push(
          onSnapshot(query(collection(db, 'personal-topics'), where('userId', '==', userId)), (snap) => {
            const topics = snap.docs.map(d => ({ ...d.data() } as PersonalTopic))
            set({ topics })
          })
        )
        
        // Subscribe to content
        unsubscribers.push(
          onSnapshot(query(collection(db, 'personal-content'), where('userId', '==', userId)), (snap) => {
            const contentItems = snap.docs.map(d => ({ ...d.data() } as PersonalContentItem))
            set({ contentItems })
          })
        )
        
        // Subscribe to MCQs
        unsubscribers.push(
          onSnapshot(query(collection(db, 'personal-mcqs'), where('userId', '==', userId)), (snap) => {
            const courseMCQs = snap.docs.map(d => ({ ...d.data() } as PersonalMCQ))
            set({ courseMCQs })
          })
        )
        
        // Subscribe to categories
        unsubscribers.push(
          onSnapshot(query(collection(db, 'personal-categories'), where('userId', '==', userId)), (snap) => {
            const questionCategories = snap.docs.map(d => ({ ...d.data() } as PersonalQuestionCategory))
            set({ questionCategories })
          })
        )
        
        // Subscribe to quiz results
        unsubscribers.push(
          onSnapshot(query(collection(db, 'personal-quiz-results'), where('userId', '==', userId)), (snap) => {
            const quizResults = snap.docs.map(d => ({ ...d.data() } as PersonalQuizResult))
            set({ quizResults })
          })
        )
        
        // Subscribe to live tests
        unsubscribers.push(
          onSnapshot(query(collection(db, 'personal-live-tests'), where('userId', '==', userId)), (snap) => {
            const liveTests = snap.docs.map(d => ({ ...d.data() } as PersonalLiveTest))
            set({ liveTests })
          })
        )
        
        // Subscribe to live test results
        unsubscribers.push(
          onSnapshot(query(collection(db, 'personal-live-test-results'), where('userId', '==', userId)), (snap) => {
            const liveTestResults = snap.docs.map(d => ({ ...d.data() } as PersonalLiveTestResult))
            set({ liveTestResults })
          })
        )
        
        // Subscribe to auto test configs
        unsubscribers.push(
          onSnapshot(query(collection(db, 'personal-auto-test-configs'), where('userId', '==', userId)), (snap) => {
            const autoLiveTestConfigs = snap.docs.map(d => ({ ...d.data() } as PersonalAutoLiveTestConfig))
            set({ autoLiveTestConfigs })
          })
        )
        
        return () => unsubscribers.forEach(unsub => unsub())
      },
      
      // ===============================
      // Legacy State (backward compatibility)
      // ===============================
      subjects: [{ id: 'sub-1', name: 'General' }],
      categories: [],
      mcqs: [],
      notes: [],
      testResults: [],
      settings: { liveCategories: [], liveCount: 20, mockCount: 50 },
      selectedSubjectId: 'sub-1',
      
      // Legacy actions
      addSubject: (s) => set(state => ({ subjects: [...state.subjects, s] })),
      removeSubject: (id) => set(state => ({ subjects: state.subjects.filter(s => s.id !== id) })),
      setSelectedSubject: (id) => set({ selectedSubjectId: id }),
      addCategory: (c) => set(state => ({ categories: [...state.categories, c] })),
      removeCategory: (id) => set(state => ({ 
        categories: state.categories.filter(c => c.id !== id && c.parentId !== id)
      })),
      addMCQ: (q) => set(state => ({ mcqs: [...state.mcqs, q] })),
      updateMCQ: (q) => set(state => ({ mcqs: state.mcqs.map(x => x.id === q.id ? q : x) })),
      removeMCQ: (id) => set(state => ({ mcqs: state.mcqs.filter(q => q.id !== id) })),
      addNote: (n) => set(state => ({ notes: [...state.notes, n] })),
      updateNote: (n) => set(state => ({ notes: state.notes.map(x => x.id === n.id ? n : x) })),
      removeNote: (id) => set(state => ({ notes: state.notes.filter(n => n.id !== id) })),
      addTestResult: (r) => set(state => ({ 
        testResults: [...state.testResults.slice(-9), r]
      })),
      updateSettings: (s) => set(state => ({ settings: { ...state.settings, ...s } })),
    }),
    { name: 'personal-store' }
  )
)

export default usePersonalStore
