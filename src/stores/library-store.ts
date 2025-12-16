import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  LibrarySubject, 
  LibraryTopic, 
  LibrarySubtopic,
  LibraryContentPack, 
  LibraryMCQ, 
  LibraryNote,
  UserLibraryDownload 
} from '@/types'
import {
  subscribeToAllLibraryData,
  initializeLibrarySampleData,
  createLibraryDownload,
  subscribeToUserDownloads,
  subscribeToLibrarySubtopics,
} from '@/services/library-firestore'
import type { Unsubscribe } from 'firebase/firestore'

interface LibraryState {
  // Data
  subjects: LibrarySubject[]
  topics: LibraryTopic[]
  subtopics: LibrarySubtopic[]
  contentPacks: LibraryContentPack[]
  mcqs: LibraryMCQ[]
  notes: LibraryNote[]
  userDownloads: UserLibraryDownload[]
  
  // UI State
  selectedSubjectId: string | null
  selectedTopicId: string | null
  selectedSubtopicId: string | null
  searchQuery: string
  filterPricing: 'all' | 'free' | 'paid'
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  setSubjects: (subjects: LibrarySubject[]) => void
  setTopics: (topics: LibraryTopic[]) => void
  setSubtopics: (subtopics: LibrarySubtopic[]) => void
  setContentPacks: (packs: LibraryContentPack[]) => void
  setMcqs: (mcqs: LibraryMCQ[]) => void
  setNotes: (notes: LibraryNote[]) => void
  setUserDownloads: (downloads: UserLibraryDownload[]) => void
  
  setSelectedSubject: (id: string | null) => void
  setSelectedTopic: (id: string | null) => void
  setSelectedSubtopic: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setFilterPricing: (filter: 'all' | 'free' | 'paid') => void
  setIsLoading: (loading: boolean) => void
  setIsInitialized: (initialized: boolean) => void
  
  // Getters
  getTopicsBySubject: (subjectId: string) => LibraryTopic[]
  getSubtopicsByTopic: (topicId: string) => LibrarySubtopic[]
  getPacksByTopic: (topicId: string) => LibraryContentPack[]
  getPacksBySubtopic: (subtopicId: string) => LibraryContentPack[]
  getPacksBySubject: (subjectId: string) => LibraryContentPack[]
  getMcqsByPack: (packId: string) => LibraryMCQ[]
  getNotesByPack: (packId: string) => LibraryNote[]
  
  // Download tracking
  addDownload: (download: UserLibraryDownload) => Promise<void>
  hasDownloaded: (packId: string, userId: string) => boolean
  
  // Firebase sync
  initSampleData: () => Promise<void>
  subscribeToLibrary: () => Unsubscribe
  subscribeToDownloads: (userId: string) => Unsubscribe
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      // Initial state
      subjects: [],
      topics: [],
      subtopics: [],
      contentPacks: [],
      mcqs: [],
      notes: [],
      userDownloads: [],
      
      selectedSubjectId: null,
      selectedTopicId: null,
      selectedSubtopicId: null,
      searchQuery: '',
      filterPricing: 'all',
      isLoading: false,
      isInitialized: false,
      
      // Setters
      setSubjects: (subjects) => set({ subjects }),
      setTopics: (topics) => set({ topics }),
      setSubtopics: (subtopics) => set({ subtopics }),
      setContentPacks: (packs) => set({ contentPacks: packs }),
      setMcqs: (mcqs) => set({ mcqs }),
      setNotes: (notes) => set({ notes }),
      setUserDownloads: (downloads) => set({ userDownloads: downloads }),
      
      setSelectedSubject: (id) => set({ selectedSubjectId: id, selectedTopicId: null, selectedSubtopicId: null }),
      setSelectedTopic: (id) => set({ selectedTopicId: id, selectedSubtopicId: null }),
      setSelectedSubtopic: (id) => set({ selectedSubtopicId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterPricing: (filter) => set({ filterPricing: filter }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsInitialized: (initialized) => set({ isInitialized: initialized }),
      
      // Getters
      getTopicsBySubject: (subjectId) => {
        const topics = get().topics || []
        return topics.filter(t => t && t.subjectId === subjectId && t.isActive)
      },
      
      getSubtopicsByTopic: (topicId) => {
        const subtopics = get().subtopics || []
        return subtopics.filter(st => st && st.topicId === topicId && st.isActive)
      },
      
      getPacksByTopic: (topicId) => {
        const { contentPacks, filterPricing, searchQuery } = get()
        return (contentPacks || []).filter(p => {
          if (!p || p.topicId !== topicId || !p.isActive) return false
          if (filterPricing !== 'all' && p.pricing !== filterPricing) return false
          if (searchQuery && p.title && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
          return true
        })
      },
      
      getPacksBySubtopic: (subtopicId) => {
        const { contentPacks, filterPricing, searchQuery } = get()
        return (contentPacks || []).filter(p => {
          if (!p || p.subtopicId !== subtopicId || !p.isActive) return false
          if (filterPricing !== 'all' && p.pricing !== filterPricing) return false
          if (searchQuery && p.title && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
          return true
        })
      },
      
      getPacksBySubject: (subjectId) => {
        const { contentPacks, filterPricing, searchQuery } = get()
        return (contentPacks || []).filter(p => {
          if (!p || p.subjectId !== subjectId || !p.isActive) return false
          if (filterPricing !== 'all' && p.pricing !== filterPricing) return false
          if (searchQuery && p.title && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
          return true
        })
      },
      
      getMcqsByPack: (packId) => {
        const mcqs = get().mcqs || []
        return mcqs.filter(m => m && m.packId === packId)
      },
      
      getNotesByPack: (packId) => {
        const notes = get().notes || []
        return notes.filter(n => n && n.packId === packId)
      },
      
      // Download tracking - now saves to Firebase
      addDownload: async (download) => {
        await createLibraryDownload(download)
        set(state => ({ userDownloads: [...state.userDownloads, download] }))
      },
      
      hasDownloaded: (packId, userId) => {
        return get().userDownloads.some(d => d.packId === packId && d.userId === userId)
      },
      
      // Initialize sample data to Firebase
      initSampleData: async () => {
        const state = get()
        if (state.isInitialized && state.subjects.length > 0) return
        
        set({ isLoading: true })
        try {
          await initializeLibrarySampleData()
          set({ isInitialized: true })
        } catch (error) {
          console.error('Error initializing library data:', error)
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Subscribe to library data from Firebase
      subscribeToLibrary: () => {
        set({ isLoading: true })
        
        const unsubscribe = subscribeToAllLibraryData({
          onSubjects: (subjects) => set({ subjects }),
          onTopics: (topics) => set({ topics }),
          onSubtopics: (subtopics) => set({ subtopics }),
          onPacks: (packs) => set({ contentPacks: packs }),
          onMcqs: (mcqs) => set({ mcqs }),
          onNotes: (notes) => set({ notes, isLoading: false, isInitialized: true }),
        })
        
        return unsubscribe
      },
      
      // Subscribe to user's downloads
      subscribeToDownloads: (userId) => {
        return subscribeToUserDownloads(userId, (downloads) => {
          set({ userDownloads: downloads })
        })
      },
    }),
    {
      name: 'library-storage',
      partialize: (state) => ({
        // Only persist UI state, data comes from Firebase
        selectedSubjectId: state.selectedSubjectId,
        selectedTopicId: state.selectedTopicId,
        filterPricing: state.filterPricing,
      }),
    }
  )
)
