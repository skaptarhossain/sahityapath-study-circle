import create from 'zustand'
import { persist } from 'zustand/middleware'

export type Subject = {
  id: string
  name: string
}

export type Category = {
  id: string
  name: string
  subjectId: string
  parentId?: string  // For sub-categories
}

export type MCQ = {
  id: string
  categoryId: string
  question: string
  options: string[]
  correctIndex: number
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
  liveCategories: string[] // category ids included in daily live test
  liveCount: number // number of questions in live test
  mockCount: number
}

type PersonalState = {
  subjects: Subject[]
  categories: Category[]
  mcqs: MCQ[]
  notes: Note[]
  testResults: TestResult[]
  settings: TestSettings
  selectedSubjectId?: string
  // actions
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
      subjects: [
        { id: 'sub-1', name: 'General' }
      ],
      categories: [],
      mcqs: [],
      notes: [],
      testResults: [],
      settings: { liveCategories: [], liveCount: 20, mockCount: 50 },
      selectedSubjectId: 'sub-1',  // Auto-select General subject
      addSubject: (s) => set(state => ({ subjects: [...state.subjects, s] })),
      removeSubject: (id) => set(state => ({ subjects: state.subjects.filter(s => s.id !== id) })),
      setSelectedSubject: (id) => set({ selectedSubjectId: id }),
      addCategory: (c) => set(state => ({ categories: [...state.categories, c] })),
      removeCategory: (id) => set(state => ({ 
        categories: state.categories.filter(c => c.id !== id && c.parentId !== id) // Also remove sub-categories
      })),
      addMCQ: (q) => set(state => ({ mcqs: [...state.mcqs, q] })),
      updateMCQ: (q) => set(state => ({ mcqs: state.mcqs.map(x => x.id === q.id ? q : x) })),
      removeMCQ: (id) => set(state => ({ mcqs: state.mcqs.filter(q => q.id !== id) })),
      addNote: (n) => set(state => ({ notes: [...state.notes, n] })),
      updateNote: (n) => set(state => ({ notes: state.notes.map(x => x.id === n.id ? n : x) })),
      removeNote: (id) => set(state => ({ notes: state.notes.filter(n => n.id !== id) })),
      addTestResult: (r) => set(state => ({ 
        testResults: [...state.testResults.slice(-9), r] // Keep only last 10
      })),
      updateSettings: (s) => set(state => ({ settings: { ...state.settings, ...s } })),
    }),
    { name: 'personal-store' }
  )
)

export default usePersonalStore
