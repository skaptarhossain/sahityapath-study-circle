import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  FileQuestion,
  FileText,
  Package,
  ChevronDown,
  ChevronRight,
  Upload,
  RefreshCw,
  BookOpen,
  FolderPlus,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/auth-store'
import { useLibraryStore } from '@/stores/library-store'
import {
  createLibrarySubject,
  createLibraryTopic,
  createLibrarySubtopic,
  createLibraryPack,
  createLibraryMCQ,
  createLibraryMCQsBulk,
  createLibraryNote,
  deleteLibrarySubject,
  deleteLibraryTopic,
  deleteLibrarySubtopic,
  deleteLibraryPack,
  deleteLibraryMCQ,
  deleteLibraryNote,
  updateLibraryPack,
} from '@/services/library-firestore'
import type {
  LibrarySubject,
  LibraryTopic,
  LibrarySubtopic,
  LibraryContentPack,
  LibraryMCQ,
  LibraryNote,
} from '@/types'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// Quill modules config
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
}

// Admin emails allowed
const ADMIN_EMAILS = ['admin@sahityapath.com', 'info@banglasahityapath.com', 'saptarn90@gmail.com']

export function LibraryAdmin() {
  const { user } = useAuthStore()
  
  // Library store
  const subjects = useLibraryStore(s => s.subjects)
  const topics = useLibraryStore(s => s.topics)
  const subtopics = useLibraryStore(s => s.subtopics)
  const contentPacks = useLibraryStore(s => s.contentPacks)
  const mcqs = useLibraryStore(s => s.mcqs)
  const notes = useLibraryStore(s => s.notes)
  const subscribeToLibrary = useLibraryStore(s => s.subscribeToLibrary)
  const getTopicsBySubject = useLibraryStore(s => s.getTopicsBySubject)
  const getSubtopicsByTopic = useLibraryStore(s => s.getSubtopicsByTopic)
  const getMcqsByPack = useLibraryStore(s => s.getMcqsByPack)
  const getNotesByPack = useLibraryStore(s => s.getNotesByPack)
  
  // UI State
  const [activeTab, setActiveTab] = useState('subjects')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([])
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  
  // Dialogs
  const [showSubjectDialog, setShowSubjectDialog] = useState(false)
  const [showTopicDialog, setShowTopicDialog] = useState(false)
  const [showSubtopicDialog, setShowSubtopicDialog] = useState(false)
  const [showPackDialog, setShowPackDialog] = useState(false)
  const [showMcqDialog, setShowMcqDialog] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showBulkMcqDialog, setShowBulkMcqDialog] = useState(false)
  
  // Edit states
  const [editingSubject, setEditingSubject] = useState<LibrarySubject | null>(null)
  const [editingTopic, setEditingTopic] = useState<LibraryTopic | null>(null)
  const [editingSubtopic, setEditingSubtopic] = useState<LibrarySubtopic | null>(null)
  const [editingPack, setEditingPack] = useState<LibraryContentPack | null>(null)
  const [editingMcq, setEditingMcq] = useState<LibraryMCQ | null>(null)
  const [editingNote, setEditingNote] = useState<LibraryNote | null>(null)
  
  // Form states
  const [subjectName, setSubjectName] = useState('')
  const [subjectNameEn, setSubjectNameEn] = useState('')
  const [subjectIcon, setSubjectIcon] = useState('📚')
  
  const [topicName, setTopicName] = useState('')
  const [topicNameEn, setTopicNameEn] = useState('')
  const [topicSubjectId, setTopicSubjectId] = useState('')
  
  const [subtopicName, setSubtopicName] = useState('')
  const [subtopicNameEn, setSubtopicNameEn] = useState('')
  const [subtopicSubjectId, setSubtopicSubjectId] = useState('')
  const [subtopicTopicId, setSubtopicTopicId] = useState('')
  
  const [packTitle, setPackTitle] = useState('')
  const [packDescription, setPackDescription] = useState('')
  const [packSubjectId, setPackSubjectId] = useState('')
  const [packTopicId, setPackTopicId] = useState('')
  const [packSubtopicId, setPackSubtopicId] = useState('')
  const [packPricing, setPackPricing] = useState<'free' | 'paid'>('free')
  const [packPrice, setPackPrice] = useState('')
  const [packTags, setPackTags] = useState('')
  
  const [mcqQuestion, setMcqQuestion] = useState('')
  const [mcqOptions, setMcqOptions] = useState(['', '', '', ''])
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState(0)
  const [mcqExplanation, setMcqExplanation] = useState('')
  const [mcqDifficulty, setMcqDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [isSourceMode, setIsSourceMode] = useState(false)
  
  const [bulkMcqJson, setBulkMcqJson] = useState('')
  const [bulkMcqError, setBulkMcqError] = useState('')
  
  // Subscribe to library data
  useEffect(() => {
    const unsubscribe = subscribeToLibrary()
    return () => unsubscribe()
  }, [subscribeToLibrary])
  
  // Check admin access
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email)
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please login to access admin panel</p>
      </div>
    )
  }
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Admin access required</p>
          <p className="text-xs text-muted-foreground mt-1">Contact admin for access</p>
        </div>
      </div>
    )
  }
  
  // Toggle subject expand
  const toggleSubject = (id: string) => {
    if (!id) return
    setExpandedSubjects(prev => {
      const arr = prev || []
      return arr.includes(id) ? arr.filter(s => s !== id) : [...arr, id]
    })
  }
  
  // ==================== SUBJECT HANDLERS ====================
  const handleSaveSubject = async () => {
    if (!subjectName.trim()) return
    
    setIsLoading(true)
    try {
      const subject: LibrarySubject = {
        id: editingSubject?.id || uuidv4(),
        name: subjectName,
        nameEn: subjectNameEn || undefined,
        icon: subjectIcon,
        order: editingSubject?.order || subjects.length + 1,
        isActive: true,
        createdAt: editingSubject?.createdAt || Date.now(),
      }
      
      await createLibrarySubject(subject)
      resetSubjectForm()
      setShowSubjectDialog(false)
    } catch (err) {
      console.error('Error saving subject:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Delete this subject and all its topics?')) return
    
    setIsLoading(true)
    try {
      // Delete subject directly - topics will be orphaned but that's ok
      await deleteLibrarySubject(id)
      alert('✅ Subject deleted!')
    } catch (err) {
      console.error('Error deleting subject:', err)
      alert('❌ Delete failed: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }
  
  const resetSubjectForm = () => {
    setSubjectName('')
    setSubjectNameEn('')
    setSubjectIcon('📚')
    setEditingSubject(null)
  }
  
  // ==================== TOPIC HANDLERS ====================
  const handleSaveTopic = async () => {
    if (!topicName.trim() || !topicSubjectId) return
    
    setIsLoading(true)
    try {
      const topic: LibraryTopic = {
        id: editingTopic?.id || uuidv4(),
        subjectId: topicSubjectId,
        name: topicName,
        nameEn: topicNameEn || undefined,
        order: editingTopic?.order || topics.filter(t => t.subjectId === topicSubjectId).length + 1,
        isActive: true,
        createdAt: editingTopic?.createdAt || Date.now(),
      }
      
      await createLibraryTopic(topic)
      resetTopicForm()
      setShowTopicDialog(false)
    } catch (err) {
      console.error('Error saving topic:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Delete this topic?')) return
    
    setIsLoading(true)
    try {
      await deleteLibraryTopic(id)
    } catch (err) {
      console.error('Error deleting topic:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const resetTopicForm = () => {
    setTopicName('')
    setTopicNameEn('')
    setTopicSubjectId('')
    setEditingTopic(null)
  }
  
  // ==================== SUBTOPIC HANDLERS ====================
  const handleSaveSubtopic = async () => {
    if (!subtopicName.trim() || !subtopicSubjectId || !subtopicTopicId) return
    
    setIsLoading(true)
    try {
      const subtopic: LibrarySubtopic = {
        id: editingSubtopic?.id || uuidv4(),
        subjectId: subtopicSubjectId,
        topicId: subtopicTopicId,
        name: subtopicName,
        nameEn: subtopicNameEn || undefined,
        order: editingSubtopic?.order || (subtopics || []).filter(st => st.topicId === subtopicTopicId).length + 1,
        isActive: true,
        createdAt: editingSubtopic?.createdAt || Date.now(),
      }
      
      await createLibrarySubtopic(subtopic)
      resetSubtopicForm()
      setShowSubtopicDialog(false)
    } catch (err) {
      console.error('Error saving subtopic:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeleteSubtopic = async (id: string) => {
    if (!confirm('Delete this subtopic?')) return
    
    setIsLoading(true)
    try {
      await deleteLibrarySubtopic(id)
    } catch (err) {
      console.error('Error deleting subtopic:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const resetSubtopicForm = () => {
    setSubtopicName('')
    setSubtopicNameEn('')
    setSubtopicSubjectId('')
    setSubtopicTopicId('')
    setEditingSubtopic(null)
  }
  
  // ==================== PACK HANDLERS ====================
  const handleSavePack = async () => {
    if (!packTitle.trim() || !packSubjectId || !packTopicId) {
      alert('Please fill Title, Subject and Topic')
      return
    }
    
    setIsLoading(true)
    try {
      const existingPack = editingPack
      const packMcqs = existingPack ? getMcqsByPack(existingPack.id) : []
      const packNotes = existingPack ? getNotesByPack(existingPack.id) : []
      
      const pack: LibraryContentPack = {
        id: existingPack?.id || uuidv4(),
        subjectId: packSubjectId,
        topicId: packTopicId,
        ...(packSubtopicId ? { subtopicId: packSubtopicId } : {}),
        title: packTitle,
        description: packDescription || '',
        tags: packTags.split(',').map(t => t.trim()).filter(Boolean),
        contentType: packMcqs.length > 0 && packNotes.length > 0 ? 'both' : packMcqs.length > 0 ? 'mcq' : 'notes',
        mcqCount: packMcqs.length,
        notesCount: packNotes.length,
        pricing: packPricing,
        price: packPricing === 'paid' ? (parseInt(packPrice) || 0) : 0,
        downloadCount: existingPack?.downloadCount || 0,
        rating: existingPack?.rating || 0,
        isActive: true,
        isFeatured: existingPack?.isFeatured || false,
        createdBy: user?.id || 'admin',
        createdAt: existingPack?.createdAt || Date.now(),
        updatedAt: Date.now(),
      }
      
      await createLibraryPack(pack)
      resetPackForm()
      setShowPackDialog(false)
    } catch (err) {
      console.error('Error saving pack:', err)
      alert('Error saving pack: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeletePack = async (id: string) => {
    if (!confirm('Delete this content pack and all its MCQs/Notes?')) return
    
    setIsLoading(true)
    try {
      // Delete pack's MCQs
      const packMcqs = getMcqsByPack(id)
      for (const mcq of packMcqs) {
        await deleteLibraryMCQ(mcq.id)
      }
      // Delete pack's Notes
      const packNotes = getNotesByPack(id)
      for (const note of packNotes) {
        await deleteLibraryNote(note.id)
      }
      // Delete pack
      await deleteLibraryPack(id)
      setSelectedPackId(null)
    } catch (err) {
      console.error('Error deleting pack:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const resetPackForm = () => {
    setPackTitle('')
    setPackDescription('')
    setPackSubjectId('')
    setPackTopicId('')
    setPackSubtopicId('')
    setPackPricing('free')
    setPackPrice('')
    setPackTags('')
    setEditingPack(null)
  }
  
  // ==================== MCQ HANDLERS ====================
  const handleSaveMcq = async () => {
    if (!mcqQuestion.trim() || !selectedPackId) return
    if (mcqOptions.some(o => !o.trim())) {
      alert('সব option পূরণ করুন')
      return
    }
    
    setIsLoading(true)
    try {
      const pack = contentPacks.find(p => p.id === selectedPackId)
      if (!pack) return
      
      const mcq: LibraryMCQ = {
        id: editingMcq?.id || uuidv4(),
        packId: selectedPackId,
        subjectId: pack.subjectId,
        topicId: pack.topicId,
        question: mcqQuestion,
        options: mcqOptions,
        correctIndex: mcqCorrectIndex,
        explanation: mcqExplanation || undefined,
        difficulty: mcqDifficulty,
        createdAt: editingMcq?.createdAt || Date.now(),
      }
      
      await createLibraryMCQ(mcq)
      
      // Update pack counts
      const updatedMcqCount = getMcqsByPack(selectedPackId).length + (editingMcq ? 0 : 1)
      await updateLibraryPack(selectedPackId, { mcqCount: updatedMcqCount })
      
      resetMcqForm()
      setShowMcqDialog(false)
    } catch (err) {
      console.error('Error saving MCQ:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeleteMcq = async (id: string) => {
    if (!confirm('Delete this MCQ?')) return
    
    setIsLoading(true)
    try {
      await deleteLibraryMCQ(id)
      
      // Update pack counts
      if (selectedPackId) {
        const updatedMcqCount = getMcqsByPack(selectedPackId).length - 1
        await updateLibraryPack(selectedPackId, { mcqCount: Math.max(0, updatedMcqCount) })
      }
    } catch (err) {
      console.error('Error deleting MCQ:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const resetMcqForm = () => {
    setMcqQuestion('')
    setMcqOptions(['', '', '', ''])
    setMcqCorrectIndex(0)
    setMcqExplanation('')
    setMcqDifficulty('medium')
    setEditingMcq(null)
  }
  
  // ==================== BULK MCQ HANDLER ====================
  const handleBulkMcqUpload = async () => {
    if (!bulkMcqJson.trim() || !selectedPackId) return
    
    setBulkMcqError('')
    setIsLoading(true)
    
    try {
      const parsed = JSON.parse(bulkMcqJson)
      const mcqArray = Array.isArray(parsed) ? parsed : [parsed]
      
      const pack = contentPacks.find(p => p.id === selectedPackId)
      if (!pack) throw new Error('Pack not found')
      
      const mcqsToCreate: LibraryMCQ[] = mcqArray.map((item: any) => ({
        id: uuidv4(),
        packId: selectedPackId,
        subjectId: pack.subjectId,
        topicId: pack.topicId,
        question: item.question || item.q,
        options: item.options || item.opts || [item.a, item.b, item.c, item.d].filter(Boolean),
        correctIndex: item.correctIndex ?? item.correct ?? item.ans ?? 0,
        explanation: item.explanation || item.exp,
        difficulty: item.difficulty || 'medium',
        createdAt: Date.now(),
      }))
      
      await createLibraryMCQsBulk(mcqsToCreate)
      
      // Update pack counts
      const updatedMcqCount = getMcqsByPack(selectedPackId).length + mcqsToCreate.length
      await updateLibraryPack(selectedPackId, { mcqCount: updatedMcqCount })
      
      alert(`✅ ${mcqsToCreate.length}টি MCQ যোগ হয়েছে!`)
      setBulkMcqJson('')
      setShowBulkMcqDialog(false)
    } catch (err: any) {
      setBulkMcqError(err.message || 'Invalid JSON format')
    } finally {
      setIsLoading(false)
    }
  }
  
  // ==================== NOTE HANDLERS ====================
  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim() || !selectedPackId) return
    
    setIsLoading(true)
    try {
      const pack = contentPacks.find(p => p.id === selectedPackId)
      if (!pack) return
      
      const packNotes = getNotesByPack(selectedPackId)
      
      const note: LibraryNote = {
        id: editingNote?.id || uuidv4(),
        packId: selectedPackId,
        subjectId: pack.subjectId,
        topicId: pack.topicId,
        title: noteTitle,
        content: noteContent,
        order: editingNote?.order || packNotes.length + 1,
        createdAt: editingNote?.createdAt || Date.now(),
      }
      
      await createLibraryNote(note)
      
      // Update pack counts
      const updatedNoteCount = packNotes.length + (editingNote ? 0 : 1)
      await updateLibraryPack(selectedPackId, { notesCount: updatedNoteCount })
      
      resetNoteForm()
      setShowNoteDialog(false)
    } catch (err) {
      console.error('Error saving note:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return
    
    setIsLoading(true)
    try {
      await deleteLibraryNote(id)
      
      // Update pack counts
      if (selectedPackId) {
        const updatedNoteCount = getNotesByPack(selectedPackId).length - 1
        await updateLibraryPack(selectedPackId, { notesCount: Math.max(0, updatedNoteCount) })
      }
    } catch (err) {
      console.error('Error deleting note:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const resetNoteForm = () => {
    setNoteTitle('')
    setNoteContent('')
    setEditingNote(null)
  }
  
  // Get selected pack details
  const selectedPack = selectedPackId ? contentPacks.find(p => p.id === selectedPackId) : null
  const selectedPackMcqs = selectedPackId ? getMcqsByPack(selectedPackId) : []
  const selectedPackNotes = selectedPackId ? getNotesByPack(selectedPackId) : []
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            🛠️ Library Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">
            {subjects.length} subjects • {topics.length} topics • {(subtopics || []).length} subtopics • {contentPacks.length} packs
          </p>
        </div>
      </div>
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="subjects">Subjects/Topics</TabsTrigger>
          <TabsTrigger value="packs">Content Packs</TabsTrigger>
          <TabsTrigger value="content">MCQ/Notes</TabsTrigger>
        </TabsList>
        
        {/* SUBJECTS TAB */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => { resetSubjectForm(); setShowSubjectDialog(true) }} className="gap-2">
              <Plus className="h-4 w-4" /> Add Subject
            </Button>
            <Button variant="outline" onClick={() => { resetTopicForm(); setShowTopicDialog(true) }} className="gap-2">
              <FolderPlus className="h-4 w-4" /> Add Topic
            </Button>
            <Button variant="secondary" onClick={() => { resetSubtopicForm(); setShowSubtopicDialog(true) }} className="gap-2">
              <FolderPlus className="h-4 w-4" /> Add Subtopic
            </Button>
          </div>
          
          <div className="space-y-2">
            {(subjects || []).filter(s => s && s.id).map(subject => (
              <Card key={subject.id}>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleSubject(subject.id)}
                      className="flex items-center gap-2 text-left"
                    >
                      {(expandedSubjects || []).includes(subject.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="text-lg">{subject.icon}</span>
                      <span className="font-medium">{subject.name}</span>
                      {subject.nameEn && (
                        <span className="text-sm text-muted-foreground">({subject.nameEn})</span>
                      )}
                    </button>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSubject(subject)
                          setSubjectName(subject.name)
                          setSubjectNameEn(subject.nameEn || '')
                          setSubjectIcon(subject.icon || '📚')
                          setShowSubjectDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {(expandedSubjects || []).includes(subject.id) && (
                  <CardContent className="pt-0 pb-3">
                    <div className="ml-6 space-y-1">
                      {getTopicsBySubject(subject.id).map(topic => {
                        const topicSubtopics = getSubtopicsByTopic(topic.id)
                        return (
                          <div key={topic.id} className="space-y-1">
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">
                                📁 {topic.name}
                                {topic.nameEn && (
                                  <span className="text-muted-foreground ml-1">({topic.nameEn})</span>
                                )}
                                {topicSubtopics.length > 0 && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    [{topicSubtopics.length} subtopics]
                                  </span>
                                )}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingTopic(topic)
                                    setTopicName(topic.name)
                                    setTopicNameEn(topic.nameEn || '')
                                    setTopicSubjectId(topic.subjectId)
                                    setShowTopicDialog(true)
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => handleDeleteTopic(topic.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {/* Subtopics under this topic */}
                            {topicSubtopics.length > 0 && (
                              <div className="ml-4 space-y-1">
                                {topicSubtopics.map(subtopic => (
                                  <div
                                    key={subtopic.id}
                                    className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                                  >
                                    <span>
                                      └ 📄 {subtopic.name}
                                      {subtopic.nameEn && (
                                        <span className="text-muted-foreground ml-1">({subtopic.nameEn})</span>
                                      )}
                                    </span>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingSubtopic(subtopic)
                                          setSubtopicName(subtopic.name)
                                          setSubtopicNameEn(subtopic.nameEn || '')
                                          setSubtopicSubjectId(subtopic.subjectId)
                                          setSubtopicTopicId(subtopic.topicId)
                                          setShowSubtopicDialog(true)
                                        }}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive"
                                        onClick={() => handleDeleteSubtopic(subtopic.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {getTopicsBySubject(subject.id).length === 0 && (
                        <p className="text-sm text-muted-foreground py-2">No topics yet</p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* PACKS TAB */}
        <TabsContent value="packs" className="space-y-4">
          <Button onClick={() => { resetPackForm(); setShowPackDialog(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> Create Content Pack
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contentPacks.map(pack => {
              const subject = subjects.find(s => s.id === pack.subjectId)
              const topic = topics.find(t => t.id === pack.topicId)
              const subtopic = pack.subtopicId ? (subtopics || []).find(st => st.id === pack.subtopicId) : null
              return (
                <Card key={pack.id} className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    setSelectedPackId(pack.id)
                    setActiveTab('content')
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-medium">{pack.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {subject?.name} › {topic?.name}{subtopic ? ` › ${subtopic.name}` : ''} • {pack.mcqCount} MCQs • {pack.notesCount} Notes
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {pack.pricing === 'free' ? (
                          <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Free</span>
                        ) : (
                          <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded">₹{pack.price}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingPack(pack)
                          setPackTitle(pack.title)
                          setPackDescription(pack.description || '')
                          setPackSubjectId(pack.subjectId)
                          setPackTopicId(pack.topicId)
                          setPackSubtopicId(pack.subtopicId || '')
                          setPackPricing(pack.pricing)
                          setPackPrice(pack.price?.toString() || '')
                          setPackTags(pack.tags.join(', '))
                          setShowPackDialog(true)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePack(pack.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        
        {/* CONTENT TAB */}
        <TabsContent value="content" className="space-y-4">
          {/* Pack Selector */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedPackId || 'none'} onValueChange={(v) => setSelectedPackId(v === 'none' ? null : v)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select Content Pack" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a Pack</SelectItem>
                {contentPacks.map(pack => (
                  <SelectItem key={pack.id} value={pack.id}>{pack.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedPackId && (
              <div className="flex gap-2">
                <Button onClick={() => { resetMcqForm(); setShowMcqDialog(true) }} className="gap-2">
                  <FileQuestion className="h-4 w-4" /> Add MCQ
                </Button>
                <Button variant="outline" onClick={() => { setBulkMcqJson(''); setBulkMcqError(''); setShowBulkMcqDialog(true) }} className="gap-2">
                  <Upload className="h-4 w-4" /> Bulk MCQ
                </Button>
                <Button variant="outline" onClick={() => { resetNoteForm(); setShowNoteDialog(true) }} className="gap-2">
                  <FileText className="h-4 w-4" /> Add Note
                </Button>
              </div>
            )}
          </div>
          
          {selectedPack ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" /> {selectedPack.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedPackMcqs.length} MCQs • {selectedPackNotes.length} Notes
                  </p>
                </CardHeader>
              </Card>
              
              {/* MCQs List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileQuestion className="h-4 w-4" /> MCQs ({selectedPackMcqs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedPackMcqs.map((mcq, idx) => (
                    <div key={mcq.id} className="p-2 bg-muted/50 rounded flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Q{idx + 1}: <span dangerouslySetInnerHTML={{ __html: mcq.question }} /></p>
                        <p className="text-xs text-muted-foreground">
                          Answer: {mcq.options[mcq.correctIndex]} • {mcq.difficulty}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingMcq(mcq)
                            setMcqQuestion(mcq.question)
                            setMcqOptions(mcq.options)
                            setMcqCorrectIndex(mcq.correctIndex)
                            setMcqExplanation(mcq.explanation || '')
                            setMcqDifficulty(mcq.difficulty || 'medium')
                            setShowMcqDialog(true)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteMcq(mcq.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {selectedPackMcqs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No MCQs yet</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Notes List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Notes ({selectedPackNotes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedPackNotes.map((note, idx) => (
                    <div key={note.id} className="p-2 bg-muted/50 rounded flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{idx + 1}. {note.title}</p>
                        <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: note.content.substring(0, 100) }} />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingNote(note)
                            setNoteTitle(note.title)
                            setNoteContent(note.content)
                            setShowNoteDialog(true)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {selectedPackNotes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a Content Pack to manage MCQs and Notes</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* ==================== DIALOGS ==================== */}
      
      {/* Subject Dialog */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Subject Name (বাংলা)"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
            <Input
              placeholder="English Name (optional)"
              value={subjectNameEn}
              onChange={(e) => setSubjectNameEn(e.target.value)}
            />
            <Input
              placeholder="Icon (emoji)"
              value={subjectIcon}
              onChange={(e) => setSubjectIcon(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSubjectDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveSubject} disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Topic Dialog */}
      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={topicSubjectId || 'none'} onValueChange={(v) => setTopicSubjectId(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Subject</SelectItem>
                {(subjects || []).filter(s => s && s.isActive).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Topic Name (বাংলা)"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
            />
            <Input
              placeholder="English Name (optional)"
              value={topicNameEn}
              onChange={(e) => setTopicNameEn(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowTopicDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveTopic} disabled={isLoading || !topicSubjectId}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Subtopic Dialog */}
      <Dialog open={showSubtopicDialog} onOpenChange={setShowSubtopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubtopic ? 'Edit Subtopic' : 'Add Subtopic'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={subtopicSubjectId || 'none'} onValueChange={(v) => { setSubtopicSubjectId(v === 'none' ? '' : v); setSubtopicTopicId('') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select Subject</SelectItem>
                  {(subjects || []).filter(s => s && s.isActive).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={subtopicTopicId || 'none'} onValueChange={(v) => setSubtopicTopicId(v === 'none' ? '' : v)} disabled={!subtopicSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select Topic</SelectItem>
                  {getTopicsBySubject(subtopicSubjectId).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Subtopic Name (বাংলা)"
              value={subtopicName}
              onChange={(e) => setSubtopicName(e.target.value)}
            />
            <Input
              placeholder="English Name (optional)"
              value={subtopicNameEn}
              onChange={(e) => setSubtopicNameEn(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSubtopicDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveSubtopic} disabled={isLoading || !subtopicSubjectId || !subtopicTopicId}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Pack Dialog */}
      <Dialog open={showPackDialog} onOpenChange={setShowPackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPack ? 'Edit Content Pack' : 'Create Content Pack'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Pack Title"
              value={packTitle}
              onChange={(e) => setPackTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description"
              value={packDescription}
              onChange={(e) => setPackDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={packSubjectId || 'none'} onValueChange={(v) => { setPackSubjectId(v === 'none' ? '' : v); setPackTopicId(''); setPackSubtopicId('') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select Subject</SelectItem>
                  {(subjects || []).filter(s => s && s.isActive).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={packTopicId || 'none'} onValueChange={(v) => { setPackTopicId(v === 'none' ? '' : v); setPackSubtopicId('') }} disabled={!packSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select Topic</SelectItem>
                  {getTopicsBySubject(packSubjectId).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Subtopic - Optional */}
            {packTopicId && getSubtopicsByTopic(packTopicId).length > 0 && (
              <Select value={packSubtopicId || 'none'} onValueChange={(v) => setPackSubtopicId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Subtopic (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Subtopic</SelectItem>
                  {getSubtopicsByTopic(packTopicId).map(st => (
                    <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Select value={packPricing} onValueChange={(v: 'free' | 'paid') => setPackPricing(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              {packPricing === 'paid' && (
                <Input
                  type="number"
                  placeholder="Price (₹)"
                  value={packPrice}
                  onChange={(e) => setPackPrice(e.target.value)}
                />
              )}
            </div>
            <Input
              placeholder="Tags (comma separated)"
              value={packTags}
              onChange={(e) => setPackTags(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPackDialog(false)}>Cancel</Button>
              <Button onClick={handleSavePack} disabled={isLoading || !packSubjectId || !packTopicId}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* MCQ Dialog */}
      <Dialog open={showMcqDialog} onOpenChange={setShowMcqDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMcq ? 'Edit MCQ' : 'Add MCQ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            <Textarea
              placeholder="Question (HTML supported)"
              value={mcqQuestion}
              onChange={(e) => setMcqQuestion(e.target.value)}
              rows={3}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Options:</p>
              {mcqOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={mcqCorrectIndex === idx}
                    onChange={() => setMcqCorrectIndex(idx)}
                  />
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...mcqOptions]
                      newOpts[idx] = e.target.value
                      setMcqOptions(newOpts)
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMcqOptions([...mcqOptions, ''])}
              >
                + Add Option
              </Button>
            </div>
            <Textarea
              placeholder="Explanation (optional)"
              value={mcqExplanation}
              onChange={(e) => setMcqExplanation(e.target.value)}
              rows={2}
            />
            <Select value={mcqDifficulty} onValueChange={(v: 'easy' | 'medium' | 'hard') => setMcqDifficulty(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMcqDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveMcq} disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Bulk MCQ Dialog */}
      <Dialog open={showBulkMcqDialog} onOpenChange={setShowBulkMcqDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk MCQ Upload (JSON)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              JSON format: [{`{ "question": "...", "options": ["a","b","c","d"], "correctIndex": 0, "explanation": "...", "difficulty": "medium" }`}]
            </p>
            <Textarea
              placeholder="Paste JSON array here..."
              value={bulkMcqJson}
              onChange={(e) => setBulkMcqJson(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
            {bulkMcqError && (
              <p className="text-sm text-destructive">{bulkMcqError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowBulkMcqDialog(false)}>Cancel</Button>
              <Button onClick={handleBulkMcqUpload} disabled={isLoading || !bulkMcqJson.trim()}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            <Input
              placeholder="Note Title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
            {/* Source Code Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {isSourceMode ? '📝 Source Code Mode (HTML)' : '✏️ Rich Text Editor'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSourceMode(!isSourceMode)}
              >
                {isSourceMode ? 'Switch to Editor' : 'Switch to Source Code'}
              </Button>
            </div>
            <div className="min-h-[250px]">
              {isSourceMode ? (
                <Textarea
                  className="min-h-[250px] font-mono text-sm"
                  placeholder="Paste HTML source code here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              ) : (
                <ReactQuill
                  theme="snow"
                  value={noteContent}
                  onChange={setNoteContent}
                  modules={quillModules}
                  placeholder="Write note content..."
                />
              )}
            </div>
            {/* HTML Preview */}
            {isSourceMode && noteContent && (
              <details className="border rounded-lg">
                <summary className="p-2 cursor-pointer text-sm text-muted-foreground hover:bg-muted/50">
                  👁️ Click to Preview
                </summary>
                <div className="p-4 border-t bg-muted/30">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: noteContent }}
                  />
                </div>
              </details>
            )}
          </div>
          {/* Fixed Footer */}
          <div className="flex gap-2 justify-end pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveNote} disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
