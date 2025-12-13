import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  LibrarySubject, 
  LibraryTopic, 
  LibraryContentPack, 
  LibraryMCQ, 
  LibraryNote,
  UserLibraryDownload 
} from '@/types'

// Separate Firebase config for Library (will be different project)
// For now, using sample data - will connect to real Firebase later

interface LibraryState {
  // Data
  subjects: LibrarySubject[]
  topics: LibraryTopic[]
  contentPacks: LibraryContentPack[]
  mcqs: LibraryMCQ[]
  notes: LibraryNote[]
  userDownloads: UserLibraryDownload[]
  
  // UI State
  selectedSubjectId: string | null
  selectedTopicId: string | null
  searchQuery: string
  filterPricing: 'all' | 'free' | 'paid'
  isLoading: boolean
  
  // Actions
  setSubjects: (subjects: LibrarySubject[]) => void
  setTopics: (topics: LibraryTopic[]) => void
  setContentPacks: (packs: LibraryContentPack[]) => void
  setMcqs: (mcqs: LibraryMCQ[]) => void
  setNotes: (notes: LibraryNote[]) => void
  
  setSelectedSubject: (id: string | null) => void
  setSelectedTopic: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setFilterPricing: (filter: 'all' | 'free' | 'paid') => void
  setIsLoading: (loading: boolean) => void
  
  // Getters
  getTopicsBySubject: (subjectId: string) => LibraryTopic[]
  getPacksByTopic: (topicId: string) => LibraryContentPack[]
  getPacksBySubject: (subjectId: string) => LibraryContentPack[]
  getMcqsByPack: (packId: string) => LibraryMCQ[]
  getNotesByPack: (packId: string) => LibraryNote[]
  
  // Download tracking
  addDownload: (download: UserLibraryDownload) => void
  hasDownloaded: (packId: string, userId: string) => boolean
  
  // Initialize with sample data
  initSampleData: () => void
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      // Initial state
      subjects: [],
      topics: [],
      contentPacks: [],
      mcqs: [],
      notes: [],
      userDownloads: [],
      
      selectedSubjectId: null,
      selectedTopicId: null,
      searchQuery: '',
      filterPricing: 'all',
      isLoading: false,
      
      // Setters
      setSubjects: (subjects) => set({ subjects }),
      setTopics: (topics) => set({ topics }),
      setContentPacks: (packs) => set({ contentPacks: packs }),
      setMcqs: (mcqs) => set({ mcqs }),
      setNotes: (notes) => set({ notes }),
      
      setSelectedSubject: (id) => set({ selectedSubjectId: id, selectedTopicId: null }),
      setSelectedTopic: (id) => set({ selectedTopicId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterPricing: (filter) => set({ filterPricing: filter }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      // Getters
      getTopicsBySubject: (subjectId) => {
        return get().topics.filter(t => t.subjectId === subjectId && t.isActive)
      },
      
      getPacksByTopic: (topicId) => {
        const { contentPacks, filterPricing, searchQuery } = get()
        return contentPacks.filter(p => {
          if (p.topicId !== topicId || !p.isActive) return false
          if (filterPricing !== 'all' && p.pricing !== filterPricing) return false
          if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
          return true
        })
      },
      
      getPacksBySubject: (subjectId) => {
        const { contentPacks, filterPricing, searchQuery } = get()
        return contentPacks.filter(p => {
          if (p.subjectId !== subjectId || !p.isActive) return false
          if (filterPricing !== 'all' && p.pricing !== filterPricing) return false
          if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
          return true
        })
      },
      
      getMcqsByPack: (packId) => {
        return get().mcqs.filter(m => m.packId === packId)
      },
      
      getNotesByPack: (packId) => {
        return get().notes.filter(n => n.packId === packId)
      },
      
      // Download tracking
      addDownload: (download) => {
        set(state => ({ userDownloads: [...state.userDownloads, download] }))
      },
      
      hasDownloaded: (packId, userId) => {
        return get().userDownloads.some(d => d.packId === packId && d.userId === userId)
      },
      
      // Initialize with sample data for testing
      initSampleData: () => {
        const subjects: LibrarySubject[] = [
          { id: 'sub1', name: 'বাংলা', nameEn: 'Bengali', icon: '📚', order: 1, isActive: true, createdAt: Date.now() },
          { id: 'sub2', name: 'English', nameEn: 'English', icon: '📖', order: 2, isActive: true, createdAt: Date.now() },
          { id: 'sub3', name: 'গণিত', nameEn: 'Mathematics', icon: '🔢', order: 3, isActive: true, createdAt: Date.now() },
          { id: 'sub4', name: 'সাধারণ জ্ঞান', nameEn: 'General Knowledge', icon: '🌍', order: 4, isActive: true, createdAt: Date.now() },
          { id: 'sub5', name: 'বিজ্ঞান', nameEn: 'Science', icon: '🔬', order: 5, isActive: true, createdAt: Date.now() },
        ]
        
        const topics: LibraryTopic[] = [
          // বাংলা
          { id: 'top1', subjectId: 'sub1', name: 'ব্যাকরণ', nameEn: 'Grammar', order: 1, isActive: true, createdAt: Date.now() },
          { id: 'top2', subjectId: 'sub1', name: 'সাহিত্য', nameEn: 'Literature', order: 2, isActive: true, createdAt: Date.now() },
          { id: 'top3', subjectId: 'sub1', name: 'রচনা', nameEn: 'Essay', order: 3, isActive: true, createdAt: Date.now() },
          // English
          { id: 'top4', subjectId: 'sub2', name: 'Grammar', order: 1, isActive: true, createdAt: Date.now() },
          { id: 'top5', subjectId: 'sub2', name: 'Vocabulary', order: 2, isActive: true, createdAt: Date.now() },
          // গণিত
          { id: 'top6', subjectId: 'sub3', name: 'পাটিগণিত', nameEn: 'Arithmetic', order: 1, isActive: true, createdAt: Date.now() },
          { id: 'top7', subjectId: 'sub3', name: 'বীজগণিত', nameEn: 'Algebra', order: 2, isActive: true, createdAt: Date.now() },
          // সাধারণ জ্ঞান
          { id: 'top8', subjectId: 'sub4', name: 'ভারতের ইতিহাস', nameEn: 'Indian History', order: 1, isActive: true, createdAt: Date.now() },
          { id: 'top9', subjectId: 'sub4', name: 'ভূগোল', nameEn: 'Geography', order: 2, isActive: true, createdAt: Date.now() },
        ]
        
        const contentPacks: LibraryContentPack[] = [
          // বাংলা ব্যাকরণ packs
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
            createdAt: Date.now(),
            updatedAt: Date.now(),
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
            createdAt: Date.now(),
            updatedAt: Date.now(),
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
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          // English packs
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
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          // সাধারণ জ্ঞান
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
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ]
        
        // Sample MCQs for pack1 (সন্ধি বিচ্ছেদ)
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
            createdAt: Date.now(),
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
            createdAt: Date.now(),
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
            createdAt: Date.now(),
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
            createdAt: Date.now(),
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
            createdAt: Date.now(),
          },
          // More sample MCQs for pack4 (Tense)
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
            createdAt: Date.now(),
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
            createdAt: Date.now(),
          },
        ]
        
        // Sample notes
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
            createdAt: Date.now(),
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
            createdAt: Date.now(),
          },
        ]
        
        set({ subjects, topics, contentPacks, mcqs, notes })
      },
    }),
    {
      name: 'library-storage',
      partialize: (state) => ({
        userDownloads: state.userDownloads,
      }),
    }
  )
)
