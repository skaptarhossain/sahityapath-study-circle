import { useState, useEffect, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { 
  FileQuestion, 
  FileText, 
  Link2, 
  File, 
  Video, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Send,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  RefreshCw,
  X,
  AlertTriangle,
  BookOpen,
  Tag,
  Upload,
  FileSpreadsheet,
  Download,
  Library,
  Package,
  CheckCircle,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/auth-store'
import { useAssetStore } from '@/stores/asset-store'
import { useGroupStore } from '@/stores/group-store'
import { useCoachingStore } from '@/stores/coaching-store'
import { useLibraryStore } from '@/stores/library-store'
import { 
  subscribeToAllAssetData,
  createAssetSubject,
  createAssetTopic,
  createAssetSubtopic,
  createAsset,
  updateAsset,
  deleteAsset,
  createAssetsInBulk,
  deleteAssetSubject,
  deleteAssetTopic,
  deleteAssetSubtopic,
  addAssetUsage,
} from '@/services/asset-firestore'
import type { 
  AssetSubject, 
  AssetTopic, 
  AssetSubtopic, 
  AssetType, 
  AnyAsset,
  AssetMCQ,
  AssetNote,
  AssetURL,
  AssetUsageRef,
  Group,
  Course,
  LibraryContentPack,
  LibraryMCQ,
  LibraryNote,
} from '@/types'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import * as XLSX from 'xlsx'

// Quill modules - defined outside component to prevent re-creation
const quillModulesConfig = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
}

const assetTypeConfig = [
  { type: 'all' as const, label: 'All', icon: BookOpen },
  { type: 'mcq' as const, label: 'MCQ', icon: FileQuestion },
  { type: 'note' as const, label: 'Notes', icon: FileText },
  { type: 'url' as const, label: 'URLs', icon: Link2 },
  { type: 'pdf' as const, label: 'PDF', icon: File },
  { type: 'video' as const, label: 'Video', icon: Video },
]

export function AssetLibrary() {
  const { user } = useAuthStore()
  
  // Asset store
  const {
    subjects,
    topics,
    subtopics,
    assets,
    selectedSubjectId,
    selectedTopicId,
    selectedSubtopicId,
    selectedType,
    searchQuery,
    setSubjects,
    setTopics,
    setSubtopics,
    setAssets,
    addSubject,
    addTopic,
    addSubtopic,
    addAsset: addAssetToStore,
    updateAsset: updateAssetInStore,
    removeAsset,
    setSelectedSubject,
    setSelectedTopic,
    setSelectedSubtopic,
    setSelectedType,
    setSearchQuery,
    getFilteredAssets,
    getTopicsBySubject: getAssetTopicsBySubject,
    getSubtopicsByTopic,
    getAssetUsageCount,
    setInitialized,
    isInitialized,
  } = useAssetStore()
  
  // Group and Coaching stores for "Add to Desk"
  const groups = useGroupStore(s => s.myGroups)
  const courses = useCoachingStore(s => s.courses)
  
  // UI States
  const [activeTab, setActiveTab] = useState<AssetType | 'all'>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddToDeskDialog, setShowAddToDeskDialog] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AnyAsset | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Category management
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [showSubtopicForm, setShowSubtopicForm] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [newSubtopicName, setNewSubtopicName] = useState('')
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([])
  const [expandedTopics, setExpandedTopics] = useState<string[]>([])
  
  // MCQ Form
  const [mcqQuestion, setMcqQuestion] = useState('')
  const [mcqOptions, setMcqOptions] = useState(['', '', '', ''])
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState(0)
  const [mcqExplanation, setMcqExplanation] = useState('')
  const [mcqDifficulty, setMcqDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [mcqTags, setMcqTags] = useState('')
  
  // Note Form
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  
  // URL Form
  const [urlTitle, setUrlTitle] = useState('')
  const [urlLink, setUrlLink] = useState('')
  const [urlDescription, setUrlDescription] = useState('')
  
  // Bulk Upload
  const [bulkUploadMode, setBulkUploadMode] = useState<'single' | 'bulk'>('single')
  const [jsonText, setJsonText] = useState('')
  const [parsedQuestions, setParsedQuestions] = useState<Array<{
    question: string
    options: string[]
    correctIndex: number
    explanation?: string
    difficulty?: 'easy' | 'medium' | 'hard'
  }>>([])
  const [parseError, setParseError] = useState('')
  
  // Add to Desk
  const [deskType, setDeskType] = useState<'personal' | 'group' | 'teacher'>('personal')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  
  // Online Library Import
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [selectedMcqIds, setSelectedMcqIds] = useState<string[]>([])
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [importingItems, setImportingItems] = useState(false)
  
  // Library Store
  const librarySubjects = useLibraryStore(s => s.subjects)
  const libraryTopics = useLibraryStore(s => s.topics)
  const contentPacks = useLibraryStore(s => s.contentPacks)
  const libraryMcqs = useLibraryStore(s => s.mcqs)
  const libraryNotes = useLibraryStore(s => s.notes)
  const getLibraryTopicsBySubject = useLibraryStore(s => s.getTopicsBySubject)
  const getMcqsByPack = useLibraryStore(s => s.getMcqsByPack)
  const getNotesByPack = useLibraryStore(s => s.getNotesByPack)
  const initSampleData = useLibraryStore(s => s.initSampleData)
  const subscribeToLibrary = useLibraryStore(s => s.subscribeToLibrary)
  const libraryIsInitialized = useLibraryStore(s => s.isInitialized)
  
  // Form subject/topic selection
  const [formSubjectId, setFormSubjectId] = useState('')
  const [formTopicId, setFormTopicId] = useState('')
  const [formSubtopicId, setFormSubtopicId] = useState('')

  // Subscribe to real-time data
  useEffect(() => {
    if (!user?.id) return
    
    const unsubscribe = subscribeToAllAssetData(user.id, {
      onSubjects: setSubjects,
      onTopics: setTopics,
      onSubtopics: setSubtopics,
      onAssets: setAssets,
    })
    
    setInitialized(true)
    
    return () => unsubscribe()
  }, [user?.id])

  // Initialize library sample data and subscribe to Firebase
  useEffect(() => {
    // First init sample data if not exists
    initSampleData()
    
    // Then subscribe to real-time updates from Firebase
    const unsubscribe = subscribeToLibrary()
    
    return () => unsubscribe()
  }, [initSampleData, subscribeToLibrary])

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return getFilteredAssets()
  }, [assets, selectedSubjectId, selectedTopicId, selectedSubtopicId, selectedType, searchQuery])

  // Get current topics and subtopics
  const currentTopics = selectedSubjectId ? getAssetTopicsBySubject(selectedSubjectId) : []
  const currentSubtopics = selectedTopicId ? getSubtopicsByTopic(selectedTopicId) : []
  const formTopics = formSubjectId ? getAssetTopicsBySubject(formSubjectId) : []
  const formSubtopics = formTopicId ? getSubtopicsByTopic(formTopicId) : []

  // Toggle functions
  const toggleSubject = (id: string) => {
    setExpandedSubjects(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }
  
  const toggleTopic = (id: string) => {
    setExpandedTopics(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  // Add Subject
  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !user?.id) return
    
    const subject: AssetSubject = {
      id: uuidv4(),
      userId: user.id,
      name: newSubjectName.trim(),
      order: subjects.length,
      createdAt: Date.now(),
    }
    
    try {
      await createAssetSubject(subject)
      addSubject(subject)
      setNewSubjectName('')
      setShowSubjectForm(false)
    } catch (err) {
      console.error('Error creating subject:', err)
    }
  }

  // Add Topic
  const handleAddTopic = async () => {
    if (!newTopicName.trim() || !selectedSubjectId || !user?.id) return
    
    const topic: AssetTopic = {
      id: uuidv4(),
      userId: user.id,
      subjectId: selectedSubjectId,
      name: newTopicName.trim(),
      order: currentTopics.length,
      createdAt: Date.now(),
    }
    
    try {
      await createAssetTopic(topic)
      addTopic(topic)
      setNewTopicName('')
      setShowTopicForm(false)
    } catch (err) {
      console.error('Error creating topic:', err)
    }
  }

  // Add Subtopic
  const handleAddSubtopic = async () => {
    if (!newSubtopicName.trim() || !selectedTopicId || !user?.id) return
    
    const subtopic: AssetSubtopic = {
      id: uuidv4(),
      userId: user.id,
      topicId: selectedTopicId,
      name: newSubtopicName.trim(),
      order: currentSubtopics.length,
      createdAt: Date.now(),
    }
    
    try {
      await createAssetSubtopic(subtopic)
      addSubtopic(subtopic)
      setNewSubtopicName('')
      setShowSubtopicForm(false)
    } catch (err) {
      console.error('Error creating subtopic:', err)
    }
  }

  // Add MCQ Asset
  const handleAddMCQ = async () => {
    if (!mcqQuestion.trim() || !formSubjectId || !formTopicId || !user?.id) return
    if (mcqOptions.some(o => !o.trim())) return
    
    const mcq: AssetMCQ = {
      id: uuidv4(),
      userId: user.id,
      type: 'mcq',
      subjectId: formSubjectId,
      topicId: formTopicId,
      subtopicId: formSubtopicId || undefined,
      tags: mcqTags.split(',').map(t => t.trim()).filter(Boolean),
      title: mcqQuestion.substring(0, 50) + (mcqQuestion.length > 50 ? '...' : ''),
      quizQuestions: [{
        id: uuidv4(),
        question: mcqQuestion,
        options: mcqOptions,
        correctIndex: mcqCorrectIndex,
        explanation: mcqExplanation || undefined,
        difficulty: mcqDifficulty,
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usedIn: [],
    }
    
    try {
      setIsLoading(true)
      await createAsset(mcq)
      addAssetToStore(mcq)
      resetMcqForm()
      setShowAddDialog(false)
    } catch (err) {
      console.error('Error creating MCQ:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Add Note Asset
  const handleAddNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim() || !formSubjectId || !formTopicId || !user?.id) return
    
    const note: AssetNote = {
      id: uuidv4(),
      userId: user.id,
      type: 'note',
      subjectId: formSubjectId,
      topicId: formTopicId,
      subtopicId: formSubtopicId || undefined,
      tags: [],
      title: noteTitle,
      content: noteContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usedIn: [],
    }
    
    try {
      setIsLoading(true)
      await createAsset(note)
      addAssetToStore(note)
      setNoteTitle('')
      setNoteContent('')
      setShowAddDialog(false)
    } catch (err) {
      console.error('Error creating note:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Add URL Asset
  const handleAddUrl = async () => {
    if (!urlTitle.trim() || !urlLink.trim() || !formSubjectId || !formTopicId || !user?.id) return
    
    const urlAsset: AssetURL = {
      id: uuidv4(),
      userId: user.id,
      type: 'url',
      subjectId: formSubjectId,
      topicId: formTopicId,
      subtopicId: formSubtopicId || undefined,
      tags: [],
      title: urlTitle,
      url: urlLink,
      description: urlDescription || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usedIn: [],
    }
    
    try {
      setIsLoading(true)
      await createAsset(urlAsset)
      addAssetToStore(urlAsset)
      setUrlTitle('')
      setUrlLink('')
      setUrlDescription('')
      setShowAddDialog(false)
    } catch (err) {
      console.error('Error creating URL:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Parse JSON for bulk upload
  const parseJsonQuestions = () => {
    setParseError('')
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) {
        setParseError('JSON must be an array')
        return
      }
      
      const questions = parsed.map((item: any) => ({
        question: item.question || item.q || '',
        options: item.options || item.opts || [item.a, item.b, item.c, item.d].filter(Boolean),
        correctIndex: item.correctIndex ?? item.correct ?? item.ans ?? 0,
        explanation: item.explanation || item.exp || undefined,
        difficulty: ['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium',
      })).filter((q: any) => q.question && q.options.length >= 2)
      
      if (questions.length === 0) {
        setParseError('No valid questions found')
        return
      }
      
      setParsedQuestions(questions)
    } catch (err) {
      setParseError('Invalid JSON format')
    }
  }

  // Bulk upload MCQs - creates ONE asset with multiple questions
  const handleBulkUpload = async () => {
    if (parsedQuestions.length === 0 || !formSubjectId || !formTopicId || !user?.id) return
    
    const mcqAsset: AssetMCQ = {
      id: uuidv4(),
      userId: user.id,
      type: 'mcq' as const,
      subjectId: formSubjectId,
      topicId: formTopicId,
      subtopicId: formSubtopicId || undefined,
      tags: [],
      title: `${parsedQuestions.length} MCQs - ${new Date().toLocaleDateString()}`,
      quizQuestions: parsedQuestions.map((q: any) => ({
        id: uuidv4(),
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        difficulty: q.difficulty,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usedIn: [],
    }
    
    try {
      setIsLoading(true)
      await createAsset(mcqAsset)
      addAssetToStore(mcqAsset)
      setParsedQuestions([])
      setJsonText('')
      setShowAddDialog(false)
      alert(`✅ ${parsedQuestions.length} MCQs uploaded successfully!`)
    } catch (err) {
      console.error('Error bulk uploading:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Delete Asset
  const handleDeleteAsset = async () => {
    if (!selectedAsset) return
    
    try {
      setIsLoading(true)
      await deleteAsset(selectedAsset.id)
      removeAsset(selectedAsset.id)
      setShowDeleteDialog(false)
      setSelectedAsset(null)
    } catch (err) {
      console.error('Error deleting asset:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Add to Desk
  const handleAddToDesk = async () => {
    if (!selectedAsset) return
    
    let deskId = ''
    let deskName = ''
    
    if (deskType === 'personal') {
      deskId = 'personal'
      deskName = 'Personal Practice'
    } else if (deskType === 'group') {
      if (!selectedGroupId) return
      const group = groups.find((g: Group) => g.id === selectedGroupId)
      deskId = selectedGroupId
      deskName = group?.name || 'Group'
    } else if (deskType === 'teacher') {
      if (!selectedCourseId) return
      const course = courses.find((c: Course) => c.id === selectedCourseId)
      deskId = selectedCourseId
      deskName = course?.title || 'Course'
    }
    
    const usageRef: AssetUsageRef = {
      deskType,
      deskId,
      deskName,
      addedAt: Date.now(),
    }
    
    try {
      setIsLoading(true)
      await addAssetUsage(selectedAsset.id, usageRef)
      // Update local store
      const updatedUsedIn = [...(selectedAsset.usedIn || []), usageRef]
      updateAssetInStore(selectedAsset.id, { usedIn: updatedUsedIn })
      setShowAddToDeskDialog(false)
      setSelectedAsset(null)
      alert('✅ Added to desk successfully!')
    } catch (err) {
      console.error('Error adding to desk:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Import from Online Library
  const handleImportFromLibrary = async () => {
    if (!user?.id || !selectedPackId) return
    if (selectedMcqIds.length === 0 && selectedNoteIds.length === 0) {
      alert('কিছু select করুন!')
      return
    }
    
    // Check if subject/topic selected for import
    if (!formSubjectId) {
      alert('একটি Subject select করুন!')
      return
    }
    
    setImportingItems(true)
    
    try {
      const assetsToCreate: AnyAsset[] = []
      const now = Date.now()
      
      // Get pack info
      const pack = contentPacks.find(p => p.id === selectedPackId)
      const packTitle = pack?.title || 'Imported'
      
      // Import selected MCQs - each MCQ becomes a separate asset with quizQuestions array
      for (const mcqId of selectedMcqIds) {
        const libMcq = libraryMcqs.find(m => m.id === mcqId)
        if (libMcq) {
          const newMcq: AssetMCQ = {
            id: uuidv4(),
            userId: user.id,
            type: 'mcq',
            subjectId: formSubjectId,
            topicId: formTopicId || '',
            subtopicId: formSubtopicId || undefined,
            title: libMcq.question.replace(/<[^>]*>/g, '').substring(0, 50) + '...',
            quizQuestions: [{
              id: uuidv4(),
              question: libMcq.question,
              options: libMcq.options,
              correctIndex: libMcq.correctIndex,
              explanation: libMcq.explanation,
              difficulty: libMcq.difficulty || 'medium',
            }],
            tags: libMcq.tags || [packTitle],
            usedIn: [],
            createdAt: now,
            updatedAt: now,
          }
          assetsToCreate.push(newMcq)
        }
      }
      
      // Import selected Notes
      for (const noteId of selectedNoteIds) {
        const libNote = libraryNotes.find(n => n.id === noteId)
        if (libNote) {
          const newNote: AssetNote = {
            id: uuidv4(),
            userId: user.id,
            type: 'note',
            subjectId: formSubjectId,
            topicId: formTopicId || '',
            subtopicId: formSubtopicId || undefined,
            title: libNote.title,
            content: libNote.content,
            tags: [packTitle],
            usedIn: [],
            createdAt: now,
            updatedAt: now,
          }
          assetsToCreate.push(newNote)
        }
      }
      
      // Bulk create assets
      if (assetsToCreate.length > 0) {
        await createAssetsInBulk(assetsToCreate)
        // Add to store
        assetsToCreate.forEach(asset => addAssetToStore(asset))
        
        alert(`✅ ${assetsToCreate.length}টি আইটেম সফলভাবে Import হয়েছে!`)
        setShowImportDialog(false)
        setSelectedPackId(null)
        setSelectedMcqIds([])
        setSelectedNoteIds([])
      }
    } catch (err) {
      console.error('Error importing from library:', err)
      alert('❌ Import করতে সমস্যা হয়েছে')
    } finally {
      setImportingItems(false)
    }
  }

  // Toggle MCQ selection for import
  const toggleMcqSelection = (mcqId: string) => {
    setSelectedMcqIds(prev => 
      prev.includes(mcqId) 
        ? prev.filter(id => id !== mcqId)
        : [...prev, mcqId]
    )
  }
  
  // Toggle Note selection for import
  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }
  
  // Select all MCQs from pack
  const selectAllPackMcqs = (packId: string) => {
    const mcqs = getMcqsByPack(packId)
    setSelectedMcqIds(mcqs.map(m => m.id))
  }
  
  // Select all Notes from pack
  const selectAllPackNotes = (packId: string) => {
    const notes = getNotesByPack(packId)
    setSelectedNoteIds(notes.map(n => n.id))
  }

  // Reset MCQ form
  const resetMcqForm = () => {
    setMcqQuestion('')
    setMcqOptions(['', '', '', ''])
    setMcqCorrectIndex(0)
    setMcqExplanation('')
    setMcqDifficulty('medium')
    setMcqTags('')
  }

  // Get subject/topic names
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || ''
  const getTopicName = (id: string) => topics.find(t => t.id === id)?.name || ''

  if (!user) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            📚 Asset Library
          </h1>
          <p className="text-sm text-muted-foreground">
            {assets.length} assets • {subjects.length} subjects
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowImportDialog(true)} 
            className="gap-2"
          >
            <Library className="h-4 w-4" /> Import from Library
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Asset
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 space-y-3">
          {/* Type Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {assetTypeConfig.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type)
                  setActiveTab(type)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="pl-8 h-9"
              />
            </div>
            
            <Select value={selectedSubjectId || 'all'} onValueChange={v => setSelectedSubject(v === 'all' ? null : v)}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedSubjectId && (
              <Select value={selectedTopicId || 'all'} onValueChange={v => setSelectedTopic(v === 'all' ? null : v)}>
                <SelectTrigger className="w-full sm:w-40 h-9">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {currentTopics.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Area - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar - Categories */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Categories</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setShowSubjectForm(true)}>
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 max-h-[400px] overflow-y-auto">
            {/* Add Subject Form */}
            {showSubjectForm && (
              <div className="flex gap-1 mb-2 p-2 bg-muted rounded">
                <Input
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  placeholder="Subject name"
                  className="h-8 text-xs"
                />
                <Button size="sm" className="h-8 px-2" onClick={handleAddSubject}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowSubjectForm(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Subject List */}
            {subjects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No subjects yet. Add one to get started!
              </p>
            ) : (
              <div className="space-y-1">
                {subjects.map(subject => (
                  <div key={subject.id}>
                    <button
                      onClick={() => {
                        toggleSubject(subject.id)
                        setSelectedSubject(subject.id)
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left hover:bg-muted ${
                        selectedSubjectId === subject.id ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      {expandedSubjects.includes(subject.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <span className="flex-1 truncate">{subject.name}</span>
                      <span className="text-muted-foreground">
                        {assets.filter(a => a.subjectId === subject.id).length}
                      </span>
                    </button>
                    
                    {/* Topics under Subject */}
                    {expandedSubjects.includes(subject.id) && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {getAssetTopicsBySubject(subject.id).map(topic => (
                          <button
                            key={topic.id}
                            onClick={() => setSelectedTopic(topic.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left hover:bg-muted ${
                              selectedTopicId === topic.id ? 'bg-primary/10 text-primary' : ''
                            }`}
                          >
                            <span className="flex-1 truncate">• {topic.name}</span>
                            <span className="text-muted-foreground">
                              {assets.filter(a => a.topicId === topic.id).length}
                            </span>
                          </button>
                        ))}
                        
                        {/* Add Topic button */}
                        {selectedSubjectId === subject.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full h-6 text-xs justify-start"
                            onClick={() => setShowTopicForm(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Topic
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Topic Form */}
            {showTopicForm && selectedSubjectId && (
              <div className="flex gap-1 mt-2 p-2 bg-muted rounded">
                <Input
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  placeholder="Topic name"
                  className="h-8 text-xs"
                />
                <Button size="sm" className="h-8 px-2" onClick={handleAddTopic}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowTopicForm(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content - Asset List */}
        <div className="lg:col-span-3 space-y-3">
          {filteredAssets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No assets found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {assets.length === 0 
                    ? 'Start building your library by adding some assets!'
                    : 'Try adjusting your filters or search query'}
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Asset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map(asset => (
                <Card key={asset.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div className={`p-2 rounded-lg ${
                        asset.type === 'mcq' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        asset.type === 'note' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        asset.type === 'url' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {asset.type === 'mcq' && <FileQuestion className="h-5 w-5" />}
                        {asset.type === 'note' && <FileText className="h-5 w-5" />}
                        {asset.type === 'url' && <Link2 className="h-5 w-5" />}
                        {asset.type === 'pdf' && <File className="h-5 w-5" />}
                        {asset.type === 'video' && <Video className="h-5 w-5" />}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {asset.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{getSubjectName(asset.subjectId)}</span>
                          <span>•</span>
                          <span>{getTopicName(asset.topicId)}</span>
                          {asset.type === 'mcq' && (asset as AssetMCQ).quizQuestions && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">{(asset as AssetMCQ).quizQuestions.length} questions</span>
                            </>
                          )}
                          {asset.usedIn && asset.usedIn.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-primary">Used in {asset.usedIn.length} places</span>
                            </>
                          )}
                        </div>
                        
                        {/* MCQ Preview */}
                        {asset.type === 'mcq' && (asset as AssetMCQ).quizQuestions && (asset as AssetMCQ).quizQuestions.length > 0 && (
                          <div className="mt-2 text-xs space-y-0.5">
                            <div className="text-muted-foreground">
                              Q1: {(asset as AssetMCQ).quizQuestions[0].question.substring(0, 60)}
                              {(asset as AssetMCQ).quizQuestions[0].question.length > 60 ? '...' : ''}
                            </div>
                            {(asset as AssetMCQ).quizQuestions.length > 1 && (
                              <div className="text-blue-600">+{(asset as AssetMCQ).quizQuestions.length - 1} more questions</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-primary"
                          onClick={() => {
                            setSelectedAsset(asset)
                            setShowAddToDeskDialog(true)
                          }}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            // TODO: Edit functionality
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => {
                            setSelectedAsset(asset)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Asset Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="mcq" className="mt-4">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="mcq">MCQ</TabsTrigger>
              <TabsTrigger value="note">Note</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>
            
            {/* Category Selection - Common for all types */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Select value={formSubjectId} onValueChange={v => { setFormSubjectId(v); setFormTopicId(''); setFormSubtopicId(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Subject *" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={formTopicId} onValueChange={v => { setFormTopicId(v); setFormSubtopicId(''); }} disabled={!formSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Topic *" />
                </SelectTrigger>
                <SelectContent>
                  {formTopics.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={formSubtopicId || 'none'} onValueChange={(v) => setFormSubtopicId(v === 'none' ? '' : v)} disabled={!formTopicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Subtopic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {formSubtopics.map(st => (
                    <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* MCQ Tab */}
            <TabsContent value="mcq" className="space-y-4 mt-4">
              {/* Single/Bulk Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded">
                <button
                  onClick={() => setBulkUploadMode('single')}
                  className={`flex-1 px-3 py-1.5 rounded text-sm ${bulkUploadMode === 'single' ? 'bg-background shadow' : ''}`}
                >
                  Single MCQ
                </button>
                <button
                  onClick={() => setBulkUploadMode('bulk')}
                  className={`flex-1 px-3 py-1.5 rounded text-sm ${bulkUploadMode === 'bulk' ? 'bg-background shadow' : ''}`}
                >
                  Bulk Upload
                </button>
              </div>
              
              {bulkUploadMode === 'single' ? (
                <>
                  <Textarea
                    value={mcqQuestion}
                    onChange={e => setMcqQuestion(e.target.value)}
                    placeholder="Enter question..."
                    rows={3}
                  />
                  
                  <div className="space-y-2">
                    {mcqOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct"
                          checked={mcqCorrectIndex === i}
                          onChange={() => setMcqCorrectIndex(i)}
                          className="h-4 w-4"
                        />
                        <Input
                          value={opt}
                          onChange={e => {
                            const newOpts = [...mcqOptions]
                            newOpts[i] = e.target.value
                            setMcqOptions(newOpts)
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={mcqDifficulty} onValueChange={v => setMcqDifficulty(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={mcqTags}
                      onChange={e => setMcqTags(e.target.value)}
                      placeholder="Tags (comma separated)"
                    />
                  </div>
                  
                  <Textarea
                    value={mcqExplanation}
                    onChange={e => setMcqExplanation(e.target.value)}
                    placeholder="Explanation (optional)"
                    rows={2}
                  />
                  
                  <Button onClick={handleAddMCQ} disabled={isLoading || !formSubjectId || !formTopicId} className="w-full">
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add MCQ
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-xs bg-muted p-3 rounded space-y-1">
                    <p className="font-medium">JSON Format:</p>
                    <code className="text-[10px]">{`[{"question":"Q1","options":["A","B","C","D"],"correctIndex":0,"explanation":"...","difficulty":"medium"}]`}</code>
                  </div>
                  
                  <Textarea
                    value={jsonText}
                    onChange={e => setJsonText(e.target.value)}
                    placeholder="Paste JSON array here..."
                    rows={6}
                    className="font-mono text-xs"
                  />
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={parseJsonQuestions} className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" /> Parse JSON
                    </Button>
                    <Button 
                      onClick={handleBulkUpload} 
                      disabled={isLoading || parsedQuestions.length === 0 || !formSubjectId || !formTopicId}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload {parsedQuestions.length} MCQs
                    </Button>
                  </div>
                  
                  {parseError && <p className="text-xs text-red-500">❌ {parseError}</p>}
                  {parsedQuestions.length > 0 && (
                    <p className="text-xs text-green-600">✅ {parsedQuestions.length} questions parsed successfully</p>
                  )}
                </>
              )}
            </TabsContent>
            
            {/* Note Tab */}
            <TabsContent value="note" className="space-y-4 mt-4">
              <Input
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                placeholder="Note title"
              />
              <ReactQuill
                theme="snow"
                value={noteContent}
                onChange={setNoteContent}
                modules={quillModulesConfig}
                className="bg-background"
              />
              <Button onClick={handleAddNote} disabled={isLoading || !formSubjectId || !formTopicId} className="w-full">
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Note
              </Button>
            </TabsContent>
            
            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4 mt-4">
              <Input
                value={urlTitle}
                onChange={e => setUrlTitle(e.target.value)}
                placeholder="Title"
              />
              <Input
                value={urlLink}
                onChange={e => setUrlLink(e.target.value)}
                placeholder="https://..."
              />
              <Textarea
                value={urlDescription}
                onChange={e => setUrlDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
              <Button onClick={handleAddUrl} disabled={isLoading || !formSubjectId || !formTopicId} className="w-full">
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add URL
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete Asset
            </DialogTitle>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="space-y-4">
              <p className="text-sm">Are you sure you want to delete this asset?</p>
              <div className="p-3 bg-muted rounded text-sm">
                <p className="font-medium">{selectedAsset.title}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {getSubjectName(selectedAsset.subjectId)} • {getTopicName(selectedAsset.topicId)}
                </p>
              </div>
              
              {selectedAsset.usedIn && selectedAsset.usedIn.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Used in {selectedAsset.usedIn.length} places:
                  </p>
                  <ul className="mt-2 text-xs space-y-1">
                    {selectedAsset.usedIn.slice(0, 5).map((usage, i) => (
                      <li key={i}>• {usage.deskName} ({usage.deskType})</li>
                    ))}
                    {selectedAsset.usedIn.length > 5 && (
                      <li>+{selectedAsset.usedIn.length - 5} more...</li>
                    )}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteAsset} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Delete {selectedAsset.usedIn?.length ? `(${selectedAsset.usedIn.length} places)` : ''}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to Desk Dialog */}
      <Dialog open={showAddToDeskDialog} onOpenChange={setShowAddToDeskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Desk</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Destination</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="radio"
                    name="desk"
                    checked={deskType === 'personal'}
                    onChange={() => setDeskType('personal')}
                  />
                  <span>Personal Practice</span>
                </label>
                
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="radio"
                    name="desk"
                    checked={deskType === 'group'}
                    onChange={() => setDeskType('group')}
                  />
                  <span>Group Desk</span>
                </label>
                {deskType === 'group' && (
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger className="ml-6">
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((g: Group) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="radio"
                    name="desk"
                    checked={deskType === 'teacher'}
                    onChange={() => setDeskType('teacher')}
                  />
                  <span>Teacher Desk (Course)</span>
                </label>
                {deskType === 'teacher' && (
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger className="ml-6">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.filter(c => c.teacherId === user?.id).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddToDeskDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleAddToDesk} 
                disabled={isLoading || (deskType === 'group' && !selectedGroupId) || (deskType === 'teacher' && !selectedCourseId)}
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Add to Desk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import from Online Library Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" /> Import from Online Library
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-4">
            {/* Pack Selection */}
            {!selectedPackId ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  একটি Content Pack select করুন import করার জন্য:
                </p>
                
                {/* Browse by Subject */}
                {librarySubjects.map(subject => (
                  <div key={subject.id} className="border rounded-lg p-3">
                    <h3 className="font-medium mb-2">{subject.name}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {contentPacks
                        .filter(p => p.subjectId === subject.id)
                        .map(pack => (
                          <div 
                            key={pack.id} 
                            className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => {
                              setSelectedPackId(pack.id)
                              setSelectedMcqIds([])
                              setSelectedNoteIds([])
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-sm">{pack.title}</span>
                                </div>
                                {pack.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{pack.description}</p>
                                )}
                              </div>
                              {pack.pricing === 'free' ? (
                                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Free</span>
                              ) : (
                                <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded">₹{pack.price}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileQuestion className="h-3 w-3" /> {pack.mcqCount} MCQs
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" /> {pack.notesCount} Notes
                              </span>
                              {pack.rating && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500" /> {pack.rating}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Download className="h-3 w-3" /> {pack.downloadCount}
                              </span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}
                
                {contentPacks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Library className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>কোনো Content Pack পাওয়া যায়নি</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected Pack Header */}
                {(() => {
                  const pack = contentPacks.find(p => p.id === selectedPackId)
                  const packMcqs = getMcqsByPack(selectedPackId)
                  const packNotes = getNotesByPack(selectedPackId)
                  
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedPackId(null)}
                            className="mb-2"
                          >
                            ← Back to Packs
                          </Button>
                          <h3 className="font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" /> {pack?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {packMcqs.length} MCQs • {packNotes.length} Notes
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-primary font-medium">
                            {selectedMcqIds.length + selectedNoteIds.length} selected
                          </p>
                        </div>
                      </div>
                      
                      {/* Select Target Subject/Topic */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium mb-2">📁 Import কোথায় করবেন?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Select value={formSubjectId || "none"} onValueChange={(v) => {
                            setFormSubjectId(v === "none" ? "" : v)
                            setFormTopicId('')
                            setFormSubtopicId('')
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Subject *" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select Subject</SelectItem>
                              {subjects.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={formTopicId || "none"} 
                            onValueChange={(v) => {
                              setFormTopicId(v === "none" ? "" : v)
                              setFormSubtopicId('')
                            }}
                            disabled={!formSubjectId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Topic (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select Topic</SelectItem>
                              {formTopics.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={formSubtopicId || "none"} 
                            onValueChange={(v) => setFormSubtopicId(v === "none" ? "" : v)}
                            disabled={!formTopicId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Subtopic (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select Subtopic</SelectItem>
                              {formSubtopics.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* MCQs List */}
                      {packMcqs.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 p-2 flex items-center justify-between">
                            <span className="font-medium text-sm flex items-center gap-2">
                              <FileQuestion className="h-4 w-4" /> MCQs ({packMcqs.length})
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => selectAllPackMcqs(selectedPackId)}
                            >
                              Select All
                            </Button>
                          </div>
                          <div className="max-h-48 overflow-y-auto divide-y">
                            {packMcqs.map((mcq, idx) => (
                              <div 
                                key={mcq.id}
                                className={`p-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                                  selectedMcqIds.includes(mcq.id) ? 'bg-primary/10' : ''
                                }`}
                                onClick={() => toggleMcqSelection(mcq.id)}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                    selectedMcqIds.includes(mcq.id) 
                                      ? 'bg-primary border-primary text-white' 
                                      : 'border-muted-foreground'
                                  }`}>
                                    {selectedMcqIds.includes(mcq.id) && <CheckCircle className="h-3 w-3" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate" dangerouslySetInnerHTML={{ __html: mcq.question }} />
                                    <p className="text-xs text-muted-foreground">
                                      {mcq.options.length} options • {mcq.difficulty || 'medium'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Notes List */}
                      {packNotes.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 p-2 flex items-center justify-between">
                            <span className="font-medium text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4" /> Notes ({packNotes.length})
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => selectAllPackNotes(selectedPackId)}
                            >
                              Select All
                            </Button>
                          </div>
                          <div className="max-h-48 overflow-y-auto divide-y">
                            {packNotes.map((note, idx) => (
                              <div 
                                key={note.id}
                                className={`p-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                                  selectedNoteIds.includes(note.id) ? 'bg-primary/10' : ''
                                }`}
                                onClick={() => toggleNoteSelection(note.id)}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                    selectedNoteIds.includes(note.id) 
                                      ? 'bg-primary border-primary text-white' 
                                      : 'border-muted-foreground'
                                  }`}>
                                    {selectedNoteIds.includes(note.id) && <CheckCircle className="h-3 w-3" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{note.title}</p>
                                    <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: note.content.substring(0, 100) + '...' }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
          
          {/* Import Button */}
          {selectedPackId && (
            <div className="flex gap-2 justify-end pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => {
                setShowImportDialog(false)
                setSelectedPackId(null)
                setSelectedMcqIds([])
                setSelectedNoteIds([])
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleImportFromLibrary}
                disabled={importingItems || (selectedMcqIds.length === 0 && selectedNoteIds.length === 0) || !formSubjectId}
              >
                {importingItems ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Import {selectedMcqIds.length + selectedNoteIds.length} Items
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
