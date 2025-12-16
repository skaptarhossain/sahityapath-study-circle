import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  AssetSubject, 
  AssetTopic, 
  AssetSubtopic, 
  AnyAsset, 
  AssetMCQ, 
  AssetNote, 
  AssetURL, 
  AssetPDF, 
  AssetVideo,
  AssetUsageRef,
  AssetType
} from '@/types'

interface AssetStore {
  // Data
  subjects: AssetSubject[]
  topics: AssetTopic[]
  subtopics: AssetSubtopic[]
  assets: AnyAsset[]
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
  
  // Filters
  selectedSubjectId: string | null
  selectedTopicId: string | null
  selectedSubtopicId: string | null
  selectedType: AssetType | 'all'
  searchQuery: string
  
  // Actions - Subjects
  setSubjects: (subjects: AssetSubject[]) => void
  addSubject: (subject: AssetSubject) => void
  updateSubject: (id: string, data: Partial<AssetSubject>) => void
  removeSubject: (id: string) => void
  
  // Actions - Topics
  setTopics: (topics: AssetTopic[]) => void
  addTopic: (topic: AssetTopic) => void
  updateTopic: (id: string, data: Partial<AssetTopic>) => void
  removeTopic: (id: string) => void
  
  // Actions - Subtopics
  setSubtopics: (subtopics: AssetSubtopic[]) => void
  addSubtopic: (subtopic: AssetSubtopic) => void
  updateSubtopic: (id: string, data: Partial<AssetSubtopic>) => void
  removeSubtopic: (id: string) => void
  
  // Actions - Assets
  setAssets: (assets: AnyAsset[]) => void
  addAsset: (asset: AnyAsset) => void
  updateAsset: (id: string, data: Partial<AnyAsset>) => void
  removeAsset: (id: string) => void
  
  // Actions - Usage tracking
  addUsageRef: (assetId: string, ref: AssetUsageRef) => void
  removeUsageRef: (assetId: string, deskType: string, deskId: string) => void
  
  // Actions - Filters
  setSelectedSubject: (id: string | null) => void
  setSelectedTopic: (id: string | null) => void
  setSelectedSubtopic: (id: string | null) => void
  setSelectedType: (type: AssetType | 'all') => void
  setSearchQuery: (query: string) => void
  
  // Actions - State
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  clearStore: () => void
  
  // Getters
  getAssetsByType: (type: AssetType) => AnyAsset[]
  getFilteredAssets: () => AnyAsset[]
  getAssetUsageCount: (assetId: string) => number
  getTopicsBySubject: (subjectId: string) => AssetTopic[]
  getSubtopicsByTopic: (topicId: string) => AssetSubtopic[]
  
  // MCQ specific helpers - for single question access
  getMCQById: (assetId: string) => AssetMCQ | undefined
  getMCQQuestionById: (assetId: string, questionId: string) => AssetMCQ['quizQuestions'][0] | undefined
  getAllMCQQuestions: () => Array<AssetMCQ['quizQuestions'][0] & { assetId: string }>
  getMCQQuestionsBySubject: (subjectId: string) => Array<AssetMCQ['quizQuestions'][0] & { assetId: string }>
  
  // Single MCQ question operations
  addSingleMCQ: (
    question: string,
    options: string[],
    correctIndex: number,
    userId: string,
    subjectId: string,
    topicId: string,
    explanation?: string,
    difficulty?: 'easy' | 'medium' | 'hard',
    subtopicId?: string
  ) => { assetId: string; questionId: string }
  
  updateSingleMCQ: (
    assetId: string,
    questionId: string,
    data: Partial<AssetMCQ['quizQuestions'][0]>
  ) => void
  
  removeSingleMCQ: (assetId: string, questionId: string) => void
}

const initialState = {
  subjects: [],
  topics: [],
  subtopics: [],
  assets: [],
  isLoading: false,
  isInitialized: false,
  selectedSubjectId: null,
  selectedTopicId: null,
  selectedSubtopicId: null,
  selectedType: 'all' as const,
  searchQuery: '',
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Subjects
      setSubjects: (subjects) => set({ subjects }),
      addSubject: (subject) => set((state) => ({ 
        subjects: [...state.subjects, subject] 
      })),
      updateSubject: (id, data) => set((state) => ({
        subjects: state.subjects.map(s => s.id === id ? { ...s, ...data } : s)
      })),
      removeSubject: (id) => set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id),
        // Also remove related topics and subtopics
        topics: state.topics.filter(t => t.subjectId !== id),
        subtopics: state.subtopics.filter(st => {
          const topic = state.topics.find(t => t.id === st.topicId)
          return topic?.subjectId !== id
        })
      })),
      
      // Topics
      setTopics: (topics) => set({ topics }),
      addTopic: (topic) => set((state) => ({ 
        topics: [...state.topics, topic] 
      })),
      updateTopic: (id, data) => set((state) => ({
        topics: state.topics.map(t => t.id === id ? { ...t, ...data } : t)
      })),
      removeTopic: (id) => set((state) => ({
        topics: state.topics.filter(t => t.id !== id),
        subtopics: state.subtopics.filter(st => st.topicId !== id)
      })),
      
      // Subtopics
      setSubtopics: (subtopics) => set({ subtopics }),
      addSubtopic: (subtopic) => set((state) => ({ 
        subtopics: [...state.subtopics, subtopic] 
      })),
      updateSubtopic: (id, data) => set((state) => ({
        subtopics: state.subtopics.map(st => st.id === id ? { ...st, ...data } : st)
      })),
      removeSubtopic: (id) => set((state) => ({
        subtopics: state.subtopics.filter(st => st.id !== id)
      })),
      
      // Assets
      setAssets: (assets) => set({ assets }),
      addAsset: (asset) => set((state) => ({ 
        assets: [...state.assets, asset] 
      })),
      updateAsset: (id, data) => set((state) => ({
        assets: state.assets.map(a => a.id === id ? { ...a, ...data } as AnyAsset : a)
      })),
      removeAsset: (id) => set((state) => ({
        assets: state.assets.filter(a => a.id !== id)
      })),
      
      // Usage tracking
      addUsageRef: (assetId, ref) => set((state) => ({
        assets: state.assets.map(a => {
          if (a.id === assetId) {
            return { ...a, usedIn: [...(a.usedIn || []), ref] } as AnyAsset
          }
          return a
        })
      })),
      removeUsageRef: (assetId, deskType, deskId) => set((state) => ({
        assets: state.assets.map(a => {
          if (a.id === assetId) {
            return {
              ...a,
              usedIn: (a.usedIn || []).filter(
                u => !(u.deskType === deskType && u.deskId === deskId)
              )
            } as AnyAsset
          }
          return a
        })
      })),
      
      // Filters
      setSelectedSubject: (id) => set({ 
        selectedSubjectId: id,
        selectedTopicId: null,
        selectedSubtopicId: null
      }),
      setSelectedTopic: (id) => set({ 
        selectedTopicId: id,
        selectedSubtopicId: null
      }),
      setSelectedSubtopic: (id) => set({ selectedSubtopicId: id }),
      setSelectedType: (type) => set({ selectedType: type }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // State
      setLoading: (loading) => set({ isLoading: loading }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      clearStore: () => set(initialState),
      
      // Getters
      getAssetsByType: (type) => {
        return get().assets.filter(a => a.type === type)
      },
      
      getFilteredAssets: () => {
        const { 
          assets, 
          selectedSubjectId, 
          selectedTopicId, 
          selectedSubtopicId, 
          selectedType,
          searchQuery 
        } = get()
        
        return assets.filter(asset => {
          // Type filter
          if (selectedType !== 'all' && asset.type !== selectedType) {
            return false
          }
          
          // Subject filter
          if (selectedSubjectId && asset.subjectId !== selectedSubjectId) {
            return false
          }
          
          // Topic filter
          if (selectedTopicId && asset.topicId !== selectedTopicId) {
            return false
          }
          
          // Subtopic filter
          if (selectedSubtopicId && asset.subtopicId !== selectedSubtopicId) {
            return false
          }
          
          // Search filter
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            const mcqText = asset.type === 'mcq' && (asset as AssetMCQ).quizQuestions
              ? (asset as AssetMCQ).quizQuestions.map(q => q.question).join(' ')
              : ''
            const searchableText = [
              asset.title,
              asset.tags?.join(' ') || '',
              mcqText,
              (asset as AssetNote).content || '',
              (asset as AssetURL).description || '',
            ].join(' ').toLowerCase()
            
            if (!searchableText.includes(query)) {
              return false
            }
          }
          
          return true
        })
      },
      
      getAssetUsageCount: (assetId) => {
        const asset = get().assets.find(a => a.id === assetId)
        return asset?.usedIn?.length || 0
      },
      
      getTopicsBySubject: (subjectId) => {
        return get().topics.filter(t => t.subjectId === subjectId)
      },
      
      getSubtopicsByTopic: (topicId) => {
        return get().subtopics.filter(st => st.topicId === topicId)
      },
      
      // MCQ specific helpers
      getMCQById: (assetId) => {
        const asset = get().assets.find(a => a.id === assetId && a.type === 'mcq')
        return asset as AssetMCQ | undefined
      },
      
      getMCQQuestionById: (assetId, questionId) => {
        const mcq = get().getMCQById(assetId)
        return mcq?.quizQuestions?.find(q => q.id === questionId)
      },
      
      getAllMCQQuestions: () => {
        const mcqAssets = get().assets.filter(a => a.type === 'mcq') as AssetMCQ[]
        return mcqAssets.flatMap(asset => 
          asset.quizQuestions.map(q => ({ ...q, assetId: asset.id }))
        )
      },
      
      getMCQQuestionsBySubject: (subjectId) => {
        const mcqAssets = get().assets.filter(
          a => a.type === 'mcq' && a.subjectId === subjectId
        ) as AssetMCQ[]
        return mcqAssets.flatMap(asset => 
          asset.quizQuestions.map(q => ({ ...q, assetId: asset.id }))
        )
      },
      
      // Add single MCQ question - creates a new asset with one question
      addSingleMCQ: (question, options, correctIndex, userId, subjectId, topicId, explanation, difficulty, subtopicId) => {
        const questionId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        const assetId = `mcq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        
        const newAsset: AssetMCQ = {
          id: assetId,
          userId,
          type: 'mcq',
          subjectId,
          topicId,
          subtopicId,
          tags: [],
          title: question.slice(0, 50) + (question.length > 50 ? '...' : ''),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          usedIn: [],
          quizQuestions: [{
            id: questionId,
            question,
            options,
            correctIndex,
            explanation,
            difficulty
          }]
        }
        
        set(state => ({ assets: [...state.assets, newAsset] }))
        return { assetId, questionId }
      },
      
      // Update single MCQ question
      updateSingleMCQ: (assetId, questionId, data) => {
        set(state => ({
          assets: state.assets.map(a => {
            if (a.id === assetId && a.type === 'mcq') {
              const mcq = a as AssetMCQ
              return {
                ...mcq,
                updatedAt: Date.now(),
                title: data.question ? data.question.slice(0, 50) + (data.question.length > 50 ? '...' : '') : mcq.title,
                quizQuestions: mcq.quizQuestions.map(q =>
                  q.id === questionId ? { ...q, ...data } : q
                )
              } as AssetMCQ
            }
            return a
          })
        }))
      },
      
      // Remove single MCQ question
      removeSingleMCQ: (assetId, questionId) => {
        set(state => {
          const asset = state.assets.find(a => a.id === assetId)
          if (!asset || asset.type !== 'mcq') return state
          
          const mcq = asset as AssetMCQ
          // If this is the last question, remove the whole asset
          if (mcq.quizQuestions.length <= 1) {
            return { assets: state.assets.filter(a => a.id !== assetId) }
          }
          
          // Otherwise just remove the question
          return {
            assets: state.assets.map(a => {
              if (a.id === assetId && a.type === 'mcq') {
                return {
                  ...a,
                  updatedAt: Date.now(),
                  quizQuestions: (a as AssetMCQ).quizQuestions.filter(q => q.id !== questionId)
                } as AssetMCQ
              }
              return a
            })
          }
        })
      },
    }),
    {
      name: 'asset-store',
      partialize: (state) => ({
        subjects: state.subjects,
        topics: state.topics,
        subtopics: state.subtopics,
        assets: state.assets,
      }),
    }
  )
)

// Helper functions for external use
export const getAssetMCQ = (assetId: string) => useAssetStore.getState().getMCQById(assetId)
export const getAllAssetMCQs = () => useAssetStore.getState().getAllMCQQuestions()
