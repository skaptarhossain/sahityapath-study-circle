import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileText,
  HelpCircle,
  Play,
  MoreVertical,
  X,
  Pencil,
  Check,
  BookOpen,
  Brain,
  BarChart3,
  Trophy,
  Settings,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Heading,
  Type,
  Link,
  Image,
  Library,
  Clock,
  Calendar,
  Target,
  Eye,
  History,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CircleDot,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { usePersonalStore } from '@/stores/personal-store'
import { useAuthStore } from '@/stores/auth-store'
import { useAssetStore } from '@/stores/asset-store'
import { v4 as uuidv4 } from 'uuid'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { TestRunner } from './test-runner'
import { syncPersonalToLibrary } from '@/lib/asset-sync'
import type { PersonalSubTab } from '@/components/layout/main-layout'
import type { PersonalCourse, PersonalTopic, PersonalContentItem, PersonalMCQ, PersonalLiveTest, PersonalLiveTestResult, PersonalAutoLiveTestConfig } from '@/types'

interface PersonalDashboardProps {
  activeSubTab: PersonalSubTab
  setActiveSubTab: (tab: PersonalSubTab) => void
}

export function PersonalDashboard({ activeSubTab, setActiveSubTab }: PersonalDashboardProps) {
  const user = useAuthStore(s => s.user)
  
  // Store
  const {
    courses,
    topics,
    contentItems,
    courseMCQs,
    quizResults,
    activeCourseId,
    setActiveCourse,
    addCourse,
    updateCourse,
    removeCourse,
    addTopic,
    updateTopic,
    removeTopic,
    addContentItem,
    updateContentItem,
    removeContentItem,
    addCourseMCQ,
    updateCourseMCQ,
    removeCourseMCQ,
    addQuizResult,
    getTopicsByCourse,
    getMCQsByCourse,
    loadFromFirebase,
    subscribeToFirebase,
    // Live Test
    liveTests,
    liveTestResults,
    addLiveTest,
    updateLiveTest,
    removeLiveTest,
    getLiveTestsByCourse,
    addLiveTestResult,
    getLiveTestResultsByTest,
    setAutoLiveTestConfig,
    getAutoLiveTestConfig,
  } = usePersonalStore()

  // Local state
  const [isEditMode, setIsEditMode] = useState(false)
  const [expandedTopics, setExpandedTopics] = useState<string[]>([])
  
  // Course form
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseDesc, setNewCourseDesc] = useState('')
  const [newCourseIcon, setNewCourseIcon] = useState('📚')
  
  // Content form - multi-step
  const [showContentForm, setShowContentForm] = useState<{ topicId: string } | null>(null)
  const [contentStep, setContentStep] = useState<'choose' | 'type' | 'form' | 'import'>('choose')
  const [newContentType, setNewContentType] = useState<'heading' | 'pdf' | 'text' | 'link' | 'quiz'>('text')
  const [newContentTitle, setNewContentTitle] = useState('')
  const [newContentBody, setNewContentBody] = useState('')
  const [newContentLink, setNewContentLink] = useState('')
  
  // Import from Library state
  const [importAssetType, setImportAssetType] = useState<'mcq' | 'note' | 'url' | 'pdf' | 'video' | 'all'>('all')
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  
  // Edit content
  const [editingContent, setEditingContent] = useState<PersonalContentItem | null>(null)
  const [viewingContent, setViewingContent] = useState<PersonalContentItem | null>(null)
  
  // MCQ form
  const [showMCQForm, setShowMCQForm] = useState<{ topicId: string } | null>(null)
  const [mcqQuestion, setMcqQuestion] = useState('')
  const [mcqOptions, setMcqOptions] = useState(['', '', '', ''])
  const [mcqCorrect, setMcqCorrect] = useState(0)
  const [mcqExplanation, setMcqExplanation] = useState('')
  
  // Quiz state
  const [runningQuiz, setRunningQuiz] = useState<{ questions: PersonalMCQ[]; title: string } | null>(null)

  // MCQ Edit state
  const [editingMcq, setEditingMcq] = useState<PersonalMCQ | null>(null)
  const [editMcqQuestion, setEditMcqQuestion] = useState('')
  const [editMcqOptions, setEditMcqOptions] = useState(['', '', '', ''])
  const [editMcqCorrectIndex, setEditMcqCorrectIndex] = useState(0)
  const [editMcqExplanation, setEditMcqExplanation] = useState('')

  // Asset store for Import from Library
  const {
    subjects: assetSubjects,
    assets: allAssets,
    selectedSubjectId: assetSelectedSubject,
    selectedTopicId: assetSelectedTopic,
    setSelectedSubject: setAssetSelectedSubject,
    setSelectedTopic: setAssetSelectedTopic,
    getTopicsBySubject: getAssetTopicsBySubject,
  } = useAssetStore()

  // ===========================
  // Live Test State
  // ===========================
  const [liveTestTab, setLiveTestTab] = useState<'upcoming' | 'past' | 'results'>('upcoming')
  const [settingsLiveTestTab, setSettingsLiveTestTab] = useState<'schedule' | 'auto-daily'>('schedule')
  const [liveTestMgmtTab, setLiveTestMgmtTab] = useState<'schedule' | 'auto'>('schedule')
  
  // Running Live Test state
  const [runningLiveTest, setRunningLiveTest] = useState<PersonalLiveTest | null>(null)
  const [liveTestQuestions, setLiveTestQuestions] = useState<PersonalMCQ[]>([])
  const [liveTestCurrentQ, setLiveTestCurrentQ] = useState(0)
  const [liveTestAnswers, setLiveTestAnswers] = useState<Record<string, number>>({})
  const [liveTestStartedAt, setLiveTestStartedAt] = useState<number>(0)
  const [viewingLiveTestResult, setViewingLiveTestResult] = useState<PersonalLiveTestResult | null>(null)
  const [viewingLiveTestSolutions, setViewingLiveTestSolutions] = useState(false)
  
  // Create Live Test form
  const [showCreateLiveTest, setShowCreateLiveTest] = useState(false)
  const [newLiveTestTitle, setNewLiveTestTitle] = useState('')
  const [newLiveTestDuration, setNewLiveTestDuration] = useState('30')
  const [newLiveTestCategories, setNewLiveTestCategories] = useState<string[]>([])
  const [newLiveTestQuestionCount, setNewLiveTestQuestionCount] = useState('20')
  const [newLiveTestShowSolution, setNewLiveTestShowSolution] = useState(true)
  
  // Auto Daily Test states
  const [autoTestEnabled, setAutoTestEnabled] = useState(false)
  const [autoTestTitle, setAutoTestTitle] = useState('Daily Practice Test')
  const [autoTestCategories, setAutoTestCategories] = useState<string[]>([])
  const [autoTestStartTime, setAutoTestStartTime] = useState('10:00')
  const [autoTestEndTime, setAutoTestEndTime] = useState('22:00')
  const [autoTestDuration, setAutoTestDuration] = useState('30')
  const [autoTestQuestionCount, setAutoTestQuestionCount] = useState('20')
  const [autoTestDays, setAutoTestDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [autoTestShowSolution, setAutoTestShowSolution] = useState(true)

  // Active course
  const activeCourse = activeCourseId ? courses.find(c => c.id === activeCourseId) : null
  
  // Course data
  const courseTopics = activeCourseId 
    ? topics.filter(t => t.courseId === activeCourseId).sort((a, b) => a.order - b.order)
    : []
  
  const courseMCQList = activeCourseId 
    ? courseMCQs.filter(m => m.courseId === activeCourseId)
    : []
    
  // Live Tests for this course
  const courseLiveTests = useMemo(() => {
    if (!activeCourseId) return []
    return getLiveTestsByCourse(activeCourseId).sort((a, b) => b.createdAt - a.createdAt)
  }, [activeCourseId, liveTests])
  
  // Auto Test Config for this course
  const currentAutoTestConfig = useMemo(() => {
    if (!activeCourseId) return null
    return getAutoLiveTestConfig(activeCourseId)
  }, [activeCourseId, getAutoLiveTestConfig])
  
  // Check if Auto Test is currently active
  const isAutoTestActive = useMemo(() => {
    if (!currentAutoTestConfig || !currentAutoTestConfig.enabled) return false
    
    const now = new Date()
    const currentDay = now.getDay()
    if (!currentAutoTestConfig.activeDays.includes(currentDay)) return false
    
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [startH, startM] = currentAutoTestConfig.startTime.split(':').map(Number)
    const [endH, endM] = currentAutoTestConfig.endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    
    return currentTime >= startMinutes && currentTime <= endMinutes
  }, [currentAutoTestConfig])
  
  // Load Auto Test config when course changes
  useEffect(() => {
    if (currentAutoTestConfig) {
      setAutoTestEnabled(currentAutoTestConfig.enabled)
      setAutoTestTitle(currentAutoTestConfig.title)
      setAutoTestCategories(currentAutoTestConfig.categoryIds)
      setAutoTestStartTime(currentAutoTestConfig.startTime)
      setAutoTestEndTime(currentAutoTestConfig.endTime)
      setAutoTestDuration(String(currentAutoTestConfig.duration))
      setAutoTestQuestionCount(String(currentAutoTestConfig.questionCount))
      setAutoTestDays(currentAutoTestConfig.activeDays)
      setAutoTestShowSolution(currentAutoTestConfig.showSolution)
    } else {
      // Reset to defaults
      setAutoTestEnabled(false)
      setAutoTestTitle('Daily Practice Test')
      setAutoTestCategories([])
      setAutoTestStartTime('10:00')
      setAutoTestEndTime('22:00')
      setAutoTestDuration('30')
      setAutoTestQuestionCount('20')
      setAutoTestDays([0, 1, 2, 3, 4, 5, 6])
      setAutoTestShowSolution(true)
    }
  }, [currentAutoTestConfig, activeCourseId])

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      loadFromFirebase(user.id)
      const unsub = subscribeToFirebase(user.id)
      return () => unsub()
    }
  }, [user?.id])

  // Toggle topic expansion
  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => 
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    )
  }

  // Create course
  const handleCreateCourse = () => {
    if (!newCourseName.trim() || !user) return
    const course: PersonalCourse = {
      id: uuidv4(),
      userId: user.id,
      name: newCourseName.trim(),
      description: newCourseDesc.trim(),
      icon: newCourseIcon,
      order: courses.length + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addCourse(course)
    setActiveCourse(course.id)
    setNewCourseName('')
    setNewCourseDesc('')
    setShowCreateCourse(false)
  }

  // Add topic
  const handleAddTopic = (topicName?: string) => {
    const name = topicName || ''
    if (!name.trim() || !activeCourseId || !user) return
    const topic: PersonalTopic = {
      id: uuidv4(),
      courseId: activeCourseId,
      userId: user.id,
      name: name.trim(),
      order: courseTopics.length + 1,
      createdAt: Date.now(),
    }
    addTopic(topic)
  }

  // Add content
  const handleAddContent = () => {
    if (!showContentForm || !newContentTitle.trim() || !user || !activeCourseId) return
    
    // Determine content type for storage
    let contentType: 'note' | 'quiz' | 'file' | 'link' = 'note'
    let contentData = newContentBody
    
    if (newContentType === 'heading') {
      contentType = 'note'
    } else if (newContentType === 'pdf') {
      contentType = 'file'
    } else if (newContentType === 'text') {
      contentType = 'note'
    } else if (newContentType === 'link') {
      contentType = 'link'
      contentData = newContentLink
    } else if (newContentType === 'quiz') {
      contentType = 'quiz'
    }
    
    const item: PersonalContentItem = {
      id: uuidv4(),
      courseId: activeCourseId,
      topicId: showContentForm.topicId,
      subTopicId: '',
      userId: user.id,
      type: contentType,
      title: newContentTitle.trim(),
      content: contentData,
      order: contentItems.filter(c => c.topicId === showContentForm.topicId).length + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addContentItem(item)
    resetContentForm()
  }
  
  // Reset content form
  const resetContentForm = () => {
    setShowContentForm(null)
    setContentStep('choose')
    setNewContentType('text')
    setNewContentTitle('')
    setNewContentBody('')
    setNewContentLink('')
    setSelectedAssetIds([])
    setImportAssetType('all')
  }

  // Import selected assets from library
  const handleImportAssets = () => {
    if (!showContentForm || !user || !activeCourseId || selectedAssetIds.length === 0) return
    
    selectedAssetIds.forEach(assetId => {
      const asset = allAssets.find(a => a.id === assetId)
      if (!asset) return
      
      // Get content based on asset type
      let contentData = ''
      if (asset.type === 'note') {
        contentData = (asset as any).content || ''
      } else if (asset.type === 'url') {
        contentData = (asset as any).url || ''
      } else if (asset.type === 'pdf') {
        contentData = (asset as any).fileUrl || ''
      } else if (asset.type === 'video') {
        contentData = (asset as any).videoUrl || ''
      }
      
      // Add as content item
      const item: PersonalContentItem = {
        id: uuidv4(),
        courseId: activeCourseId,
        topicId: showContentForm.topicId,
        subTopicId: '',
        userId: user.id,
        type: asset.type === 'mcq' ? 'quiz' : asset.type === 'url' ? 'link' : asset.type === 'pdf' || asset.type === 'video' ? 'file' : 'note',
        title: asset.title,
        content: contentData,
        order: contentItems.filter(c => c.topicId === showContentForm.topicId).length + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        assetRef: asset.id,
      }
      addContentItem(item)
      
      // If MCQ, also add quiz questions
      if (asset.type === 'mcq') {
        const mcqAsset = asset as any
        if (mcqAsset.quizQuestions && Array.isArray(mcqAsset.quizQuestions)) {
          mcqAsset.quizQuestions.forEach((q: any) => {
            const mcq: PersonalMCQ = {
              id: uuidv4(),
              courseId: activeCourseId,
              categoryId: showContentForm.topicId,
              userId: user.id,
              question: q.question || '',
              options: q.options || [],
              correctIndex: q.correctIndex || 0,
              explanation: q.explanation,
              createdAt: Date.now(),
            }
            addCourseMCQ(mcq)
          })
        }
      }
    })
    
    resetContentForm()
  }

  // Save edited content
  const handleSaveContent = () => {
    if (!editingContent) return
    updateContentItem(editingContent)
    setEditingContent(null)
  }

  // Add MCQ
  const handleAddMCQ = () => {
    const topicId = showMCQForm?.topicId || showContentForm?.topicId
    if (!topicId || !mcqQuestion.trim() || !user || !activeCourseId) return
    if (mcqOptions.filter(o => o.trim()).length < 2) return
    
    const mcq: PersonalMCQ = {
      id: uuidv4(),
      courseId: activeCourseId,
      categoryId: topicId,  // Use topicId as categoryId
      userId: user.id,
      question: mcqQuestion.trim(),
      options: mcqOptions.filter(o => o.trim()),
      correctIndex: mcqCorrect,
      explanation: mcqExplanation.trim() || undefined,
      createdAt: Date.now(),
    }
    addCourseMCQ(mcq)
    setShowMCQForm(null)
    setMcqQuestion('')
    setMcqOptions(['', '', '', ''])
    setMcqCorrect(0)
    setMcqExplanation('')
  }

  // Start quiz
  const handleStartQuiz = (topicId?: string) => {
    let questions = courseMCQList
    if (topicId) {
      questions = questions.filter(m => m.categoryId === topicId)
    }
    if (questions.length === 0) {
      alert('No MCQs available!')
      return
    }
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    setRunningQuiz({
      questions: shuffled,
      title: topicId 
        ? courseTopics.find(t => t.id === topicId)?.name || 'Quiz'
        : activeCourse?.name || 'Quiz'
    })
  }

  // MCQ Edit handlers
  const handleEditMcq = (mcq: PersonalMCQ) => {
    setEditingMcq(mcq)
    setEditMcqQuestion(mcq.question)
    setEditMcqOptions([...mcq.options])
    setEditMcqCorrectIndex(mcq.correctIndex)
    setEditMcqExplanation(mcq.explanation || '')
  }

  const handleSaveEditMcq = async () => {
    if (!editingMcq || !editMcqQuestion.trim() || editMcqOptions.some(o => !o.trim())) return
    
    const updated: PersonalMCQ = {
      ...editingMcq,
      question: editMcqQuestion.trim(),
      options: editMcqOptions.map(o => o.trim()),
      correctIndex: editMcqCorrectIndex,
      explanation: editMcqExplanation.trim() || undefined,
    }
    
    updateCourseMCQ(updated)
    
    // Sync to Asset Library if linked
    if (updated.assetRef) {
      syncPersonalToLibrary(updated.id)
    }
    
    setEditingMcq(null)
  }

  // ===========================
  // Live Test Handlers
  // ===========================
  
  // Create Manual Live Test
  const handleCreateLiveTest = () => {
    if (!newLiveTestTitle.trim() || !activeCourseId || !user) {
      alert('Please enter a test title')
      return
    }
    
    // Get questions based on selected categories
    let availableQuestions = courseMCQList
    if (newLiveTestCategories.length > 0) {
      availableQuestions = courseMCQList.filter(q => newLiveTestCategories.includes(q.categoryId || ''))
    }
    
    if (availableQuestions.length === 0) {
      alert('No questions available in selected categories')
      return
    }
    
    const liveTest: PersonalLiveTest = {
      id: uuidv4(),
      courseId: activeCourseId,
      userId: user.id,
      title: newLiveTestTitle.trim(),
      categoryIds: newLiveTestCategories,
      questionCount: Math.min(parseInt(newLiveTestQuestionCount), availableQuestions.length),
      duration: parseInt(newLiveTestDuration),
      status: 'scheduled',
      showSolution: newLiveTestShowSolution,
      createdAt: Date.now()
    }
    
    addLiveTest(liveTest)
    
    // Reset form
    setShowCreateLiveTest(false)
    setNewLiveTestTitle('')
    setNewLiveTestDuration('30')
    setNewLiveTestCategories([])
    setNewLiveTestQuestionCount('20')
    setNewLiveTestShowSolution(true)
    
    alert('Live Test created successfully!')
  }
  
  // Save Auto Daily Test Config
  const handleSaveAutoTestConfig = () => {
    if (!activeCourseId || !user) return
    
    if (autoTestEnabled && autoTestCategories.length === 0 && courseMCQList.length === 0) {
      alert('Please add MCQs to your course first or select categories')
      return
    }
    
    const config: PersonalAutoLiveTestConfig = {
      id: `auto-${activeCourseId}`,
      courseId: activeCourseId,
      userId: user.id,
      enabled: autoTestEnabled,
      title: autoTestTitle,
      categoryIds: autoTestCategories,
      startTime: autoTestStartTime,
      endTime: autoTestEndTime,
      duration: parseInt(autoTestDuration),
      questionCount: parseInt(autoTestQuestionCount),
      activeDays: autoTestDays,
      showSolution: autoTestShowSolution,
      createdAt: currentAutoTestConfig?.createdAt || Date.now(),
      updatedAt: Date.now()
    }
    
    setAutoLiveTestConfig(config)
    alert('Auto Daily Test settings saved!')
  }
  
  // Start Live Test (Manual or Auto)
  const startLiveTest = (test: PersonalLiveTest) => {
    // Get questions based on categories
    let availableQuestions = courseMCQList
    if (test.categoryIds.length > 0) {
      availableQuestions = courseMCQList.filter(q => test.categoryIds.includes(q.categoryId || ''))
    }
    
    if (availableQuestions.length === 0) {
      alert('No questions available')
      return
    }
    
    // Shuffle and pick questions
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
    const selectedQuestions = shuffled.slice(0, test.questionCount)
    
    setLiveTestQuestions(selectedQuestions)
    setLiveTestCurrentQ(0)
    setLiveTestAnswers({})
    setLiveTestStartedAt(Date.now())
    setRunningLiveTest(test)
    
    // Update test status
    updateLiveTest({ ...test, status: 'active', startedAt: Date.now() })
  }
  
  // Start Auto Test
  const startAutoTest = () => {
    if (!currentAutoTestConfig || !activeCourseId || !user) return
    
    // Get questions
    let availableQuestions = courseMCQList
    if (currentAutoTestConfig.categoryIds.length > 0) {
      availableQuestions = courseMCQList.filter(q => currentAutoTestConfig.categoryIds.includes(q.categoryId || ''))
    }
    
    if (availableQuestions.length === 0) {
      alert('No questions available')
      return
    }
    
    // Create a temporary test
    const autoTest: PersonalLiveTest = {
      id: `auto-${Date.now()}`,
      courseId: activeCourseId,
      userId: user.id,
      title: currentAutoTestConfig.title,
      categoryIds: currentAutoTestConfig.categoryIds,
      questionCount: Math.min(currentAutoTestConfig.questionCount, availableQuestions.length),
      duration: currentAutoTestConfig.duration,
      status: 'active',
      showSolution: currentAutoTestConfig.showSolution,
      startedAt: Date.now(),
      createdAt: Date.now()
    }
    
    // Shuffle and pick questions
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
    const selectedQuestions = shuffled.slice(0, autoTest.questionCount)
    
    setLiveTestQuestions(selectedQuestions)
    setLiveTestCurrentQ(0)
    setLiveTestAnswers({})
    setLiveTestStartedAt(Date.now())
    setRunningLiveTest(autoTest)
  }
  
  // Submit Live Test
  const submitLiveTest = () => {
    if (!runningLiveTest || !user || !activeCourseId) return
    
    const timeTaken = Math.round((Date.now() - liveTestStartedAt) / 1000)
    
    let correct = 0
    let wrong = 0
    let unanswered = 0
    
    const answers = liveTestQuestions.map(q => {
      const selected = liveTestAnswers[q.id] !== undefined ? liveTestAnswers[q.id] : null
      if (selected === null) {
        unanswered++
      } else if (selected === q.correctIndex) {
        correct++
      } else {
        wrong++
      }
      return { questionId: q.id, selected, correct: q.correctIndex }
    })
    
    const score = Math.round((correct / liveTestQuestions.length) * 100)
    
    const result: PersonalLiveTestResult = {
      id: uuidv4(),
      testId: runningLiveTest.id,
      courseId: activeCourseId,
      userId: user.id,
      score,
      correct,
      wrong,
      unanswered,
      total: liveTestQuestions.length,
      timeTaken,
      answers,
      submittedAt: Date.now()
    }
    
    addLiveTestResult(result)
    
    // Update test status
    if (!runningLiveTest.id.startsWith('auto-')) {
      updateLiveTest({ ...runningLiveTest, status: 'completed', endedAt: Date.now() })
    }
    
    setViewingLiveTestResult(result)
    setRunningLiveTest(null)
    setLiveTestQuestions([])
    setLiveTestTab('results')
  }
  
  // Format time remaining
  const formatTimeRemaining = (startedAt: number, duration: number): string => {
    const endTime = startedAt + duration * 60 * 1000
    const remaining = endTime - Date.now()
    
    if (remaining <= 0) return '0:00'
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  // Rich text modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  }

  // ===============================
  // Render: Quiz Running
  // ===============================
  if (runningQuiz) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <TestRunner
          questions={runningQuiz.questions.map(m => ({
            id: m.id,
            categoryId: m.categoryId || '',
            question: m.question,
            options: m.options,
            correctIndex: m.correctIndex,
            explanation: m.explanation,
          }))}
          testTitle={runningQuiz.title}
          onFinish={(result) => {
            if (user && activeCourseId) {
              addQuizResult({
                id: uuidv4(),
                courseId: activeCourseId,
                quizItemId: runningQuiz.questions[0]?.id || '',
                quizTitle: runningQuiz.title,
                userId: user.id,
                score: result.percentage,
                correct: result.correct,
                wrong: result.wrong,
                unanswered: result.total - result.correct - result.wrong,
                total: result.total,
                timeTaken: result.timeTaken,
                answers: result.answers,
                createdAt: Date.now(),
              })
            }
            setRunningQuiz(null)
          }}
          onBack={() => setRunningQuiz(null)}
        />
      </div>
    )
  }

  // ===============================
  // Render: Live Test Running
  // ===============================
  if (runningLiveTest && liveTestQuestions.length > 0) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto pb-20 lg:pb-6">
        <Card className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-4 text-sm">
              <span className="font-medium">Q {liveTestCurrentQ + 1}/{liveTestQuestions.length}</span>
              <span className="text-red-500 font-medium">
                <Clock className="h-3.5 w-3.5 inline mr-1" />
                {formatTimeRemaining(liveTestStartedAt, runningLiveTest.duration)}
              </span>
            </div>
            <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={submitLiveTest}>
              <Check className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Submit</span>
            </Button>
          </div>
          
          {/* Question Navigator */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 p-2 sm:p-3 bg-muted/50 rounded overflow-x-auto">
            {liveTestQuestions.map((_, i) => (
              <button
                key={i}
                onClick={() => setLiveTestCurrentQ(i)}
                className={`min-w-[28px] w-7 h-7 sm:w-8 sm:h-8 rounded text-xs sm:text-sm font-medium transition-colors ${
                  liveTestCurrentQ === i 
                    ? 'bg-primary text-primary-foreground' 
                    : liveTestAnswers[liveTestQuestions[i].id] !== undefined
                      ? 'bg-green-500 text-white'
                      : 'bg-background border'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">{liveTestQuestions[liveTestCurrentQ]?.question}</h3>
          <div className="space-y-2">
            {liveTestQuestions[liveTestCurrentQ]?.options.map((opt, i) => (
              <div 
                key={i}
                className={`p-2.5 sm:p-3 border rounded cursor-pointer transition-colors text-sm ${
                  liveTestAnswers[liveTestQuestions[liveTestCurrentQ].id] === i 
                    ? 'border-primary bg-primary/10' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => setLiveTestAnswers(prev => ({ ...prev, [liveTestQuestions[liveTestCurrentQ].id]: i }))}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-3 sm:pt-4">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 text-xs sm:text-sm"
              disabled={liveTestCurrentQ === 0} 
              onClick={() => setLiveTestCurrentQ(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            {liveTestCurrentQ < liveTestQuestions.length - 1 ? (
              <Button size="sm" className="h-8 text-xs sm:text-sm" onClick={() => setLiveTestCurrentQ(p => p + 1)}>
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" className="h-8 text-xs sm:text-sm" onClick={submitLiveTest}>
                <Check className="h-3.5 w-3.5 mr-1" /> Submit
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // ===============================
  // Render: View Live Test Solutions
  // ===============================
  if (viewingLiveTestSolutions && viewingLiveTestResult) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto pb-20 lg:pb-6">
        <Card className="p-3 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold">View Solutions</h3>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setViewingLiveTestSolutions(false)}>
              <X className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Close</span>
            </Button>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {viewingLiveTestResult.answers.map((ans, idx) => {
              const question = courseMCQs.find(q => q.id === ans.questionId)
              if (!question) return null
              
              const isCorrect = ans.selected === ans.correct
              const wasSkipped = ans.selected === null
              
              return (
                <div key={ans.questionId} className={`p-3 sm:p-4 rounded-lg border ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : wasSkipped ? 'border-gray-400 bg-gray-50 dark:bg-gray-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}`}>
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <span className="text-xs sm:text-sm font-medium">Q{idx + 1}.</span>
                    {isCorrect ? (
                      <span className="text-green-600 text-xs sm:text-sm flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Correct</span>
                    ) : wasSkipped ? (
                      <span className="text-gray-500 text-xs sm:text-sm flex items-center"><CircleDot className="h-3.5 w-3.5 mr-1" /> Skipped</span>
                    ) : (
                      <span className="text-red-600 text-xs sm:text-sm flex items-center"><XCircle className="h-3.5 w-3.5 mr-1" /> Wrong</span>
                    )}
                  </div>
                  <p className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">{question.question}</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    {question.options.map((opt, i) => (
                      <div 
                        key={i} 
                        className={`p-1.5 sm:p-2 rounded text-xs sm:text-sm ${
                          i === ans.correct 
                            ? 'bg-green-200 dark:bg-green-900 font-medium' 
                            : ans.selected === i && !isCorrect
                              ? 'bg-red-200 dark:bg-red-900'
                              : ''
                        }`}
                      >
                        <span className="font-medium mr-1.5 sm:mr-2">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                        {i === ans.correct && <Check className="h-3.5 w-3.5 inline ml-1.5 text-green-600" />}
                        {ans.selected === i && !isCorrect && <X className="h-3.5 w-3.5 inline ml-1.5 text-red-600" />}
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs sm:text-sm">
                      <span className="font-medium">Explanation:</span> {question.explanation}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    )
  }

  // ===============================
  // Render: No Course Selected
  // ===============================
  if (!activeCourse) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto pb-20 lg:pb-6">
        <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as PersonalSubTab)} className="w-full">
          <TabsList className="hidden lg:flex w-full justify-start mb-4 bg-muted/50">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="course" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course
            </TabsTrigger>
            <TabsTrigger value="live-test" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Live Test
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard - No Course */}
          <TabsContent value="dashboard" className="mt-4 space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Personal Desk</h1>
              <p className="text-muted-foreground">Your personal learning dashboard</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-xl font-bold">{courses.length}</p>
                  <p className="text-xs text-muted-foreground">Courses</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-xl font-bold">{contentItems.length}</p>
                  <p className="text-xs text-muted-foreground">Contents</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <HelpCircle className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-xl font-bold">{courseMCQs.length}</p>
                  <p className="text-xs text-muted-foreground">MCQs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-xl font-bold">{quizResults.length}</p>
                  <p className="text-xs text-muted-foreground">Quizzes</p>
                </CardContent>
              </Card>
            </div>
            {courses.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Create your first course to get started</p>
                <Button onClick={() => { setActiveSubTab('course'); setShowCreateCourse(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Create Course
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Course Tab - No Course Selected */}
          <TabsContent value="course" className="mt-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">My Courses</h1>
                <p className="text-muted-foreground">Create and manage your courses</p>
              </div>
              <Button onClick={() => setShowCreateCourse(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Create Course
              </Button>
            </div>

            {courses.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">Create your first course to get started</p>
                <Button onClick={() => setShowCreateCourse(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Create Course
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => (
                  <Card 
                    key={course.id} 
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                    onClick={() => setActiveCourse(course.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{course.icon || '📚'}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{course.name}</h3>
                          {course.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>{getTopicsByCourse(course.id).length} chapters</span>
                            <span>{getMCQsByCourse(course.id).length} MCQs</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Live Test Tab - No Course */}
          <TabsContent value="live-test" className="mt-4 space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Live Tests</h1>
              <p className="text-muted-foreground">Practice with timed tests</p>
            </div>
            <Card className="p-12 text-center">
              <Brain className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a course first</h3>
              <p className="text-muted-foreground mb-4">Go to Course tab and select a course</p>
              <Button onClick={() => setActiveSubTab('course')}>
                <BookOpen className="h-4 w-4 mr-2" /> Go to Courses
              </Button>
            </Card>
          </TabsContent>

          {/* Settings Tab - No Course */}
          <TabsContent value="settings" className="mt-4 space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your preferences</p>
            </div>
            <Card className="p-6">
              <h3 className="font-semibold mb-4">About Personal Desk</h3>
              <p className="text-sm text-muted-foreground">
                Personal Desk helps you create and organize your own courses, notes, and MCQs for self-study.
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Course Modal */}
        <AnimatePresence>
          {showCreateCourse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateCourse(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-background rounded-xl max-w-md w-full p-6 space-y-4"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold">Create New Course</h2>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Select value={newCourseIcon} onValueChange={setNewCourseIcon}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['📚', '📖', '📝', '🎯', '💡', '🔬', '🧮', '📐', '🌍', '💻', '🎨', '🎵'].map(icon => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Course name"
                      value={newCourseName}
                      onChange={e => setNewCourseName(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={newCourseDesc}
                    onChange={e => setNewCourseDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreateCourse(false)}>Cancel</Button>
                  <Button onClick={handleCreateCourse} disabled={!newCourseName.trim()}>Create</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ===============================
  // Render: Course Selected
  // ===============================
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-20 lg:pb-6">
      {/* Course Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveCourse(null)}>
            ← Back
          </Button>
          <span className="text-2xl">{activeCourse.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{activeCourse.name}</h1>
            {activeCourse.description && (
              <p className="text-sm text-muted-foreground">{activeCourse.description}</p>
            )}
          </div>
        </div>
        <Button
          variant={isEditMode ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditMode(!isEditMode)}
        >
          {isEditMode ? <><Pencil className="h-4 w-4 mr-1" /> Exit Edit</> : <><Pencil className="h-4 w-4 mr-1" /> Edit</>}
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as PersonalSubTab)} className="w-full">
        <TabsList className="hidden lg:flex w-full justify-start mb-4 bg-muted/50">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="course" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Course
          </TabsTrigger>
          <TabsTrigger value="live-test" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Live Test
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-xl font-bold">{courseTopics.length}</p>
                <p className="text-xs text-muted-foreground">Chapters</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-xl font-bold">{contentItems.filter(c => c.courseId === activeCourseId).length}</p>
                <p className="text-xs text-muted-foreground">Contents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <HelpCircle className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <p className="text-xl font-bold">{courseMCQList.length}</p>
                <p className="text-xs text-muted-foreground">MCQs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-xl font-bold">{quizResults.filter(r => r.courseId === activeCourseId).length}</p>
                <p className="text-xs text-muted-foreground">Quiz Results</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveSubTab('course')}>
                <Plus className="h-4 w-4 mr-1" /> Add Chapter
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleStartQuiz()} disabled={courseMCQList.length === 0}>
                <Play className="h-4 w-4 mr-1" /> Start Quiz
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Course Tab - Chapter/Content Management */}
        <TabsContent value="course" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Course Contents</h2>
          </div>

          {/* Add Chapter Button */}
          {isEditMode && (
            <div 
              className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded cursor-pointer border border-dashed"
              onClick={() => {
                const name = prompt('Enter chapter name:')
                if (name?.trim()) {
                  handleAddTopic(name)
                }
              }}
            >
              <Plus className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Add new chapter</span>
            </div>
          )}

          {/* Chapter List */}
          <div className="space-y-3">
            {courseTopics.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No chapters yet. {isEditMode && 'Click "Add new chapter" above!'}</p>
              </Card>
            ) : (
              courseTopics.map((topic) => {
                const topicContent = contentItems.filter(c => c.topicId === topic.id)
                const topicMCQs = courseMCQList.filter(m => m.categoryId === topic.id)
                const isExpanded = expandedTopics.includes(topic.id)
                
                return (
                  <Card key={topic.id} className="overflow-hidden">
                    {/* Chapter Header */}
                    <div 
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleTopic(topic.id)}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div className="flex-1">
                        <span className="font-medium">{topic.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({topicContent.length} items, {topicMCQs.length} MCQs)
                        </span>
                      </div>
                      
                      {isEditMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              const newName = prompt('Rename chapter:', topic.name)
                              if (newName?.trim()) {
                                updateTopic({ ...topic, name: newName.trim() })
                              }
                            }}>
                              <Pencil className="h-4 w-4 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setExpandedTopics(prev => prev.includes(topic.id) ? prev : [...prev, topic.id])
                              setShowContentForm({ topicId: topic.id })
                            }}>
                              <Plus className="h-4 w-4 mr-2" /> Add content
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                const idx = courseTopics.findIndex(t => t.id === topic.id)
                                if (idx > 0) {
                                  const prevTopic = courseTopics[idx - 1]
                                  updateTopic({ ...topic, order: prevTopic.order })
                                  updateTopic({ ...prevTopic, order: topic.order })
                                }
                              }}
                              disabled={courseTopics.findIndex(t => t.id === topic.id) === 0}
                            >
                              <ArrowUp className="h-4 w-4 mr-2" /> Move up
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                const idx = courseTopics.findIndex(t => t.id === topic.id)
                                if (idx < courseTopics.length - 1) {
                                  const nextTopic = courseTopics[idx + 1]
                                  updateTopic({ ...topic, order: nextTopic.order })
                                  updateTopic({ ...nextTopic, order: topic.order })
                                }
                              }}
                              disabled={courseTopics.findIndex(t => t.id === topic.id) === courseTopics.length - 1}
                            >
                              <ArrowDown className="h-4 w-4 mr-2" /> Move down
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Delete this chapter and all its content?')) {
                                  removeTopic(topic.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {!isEditMode && topicMCQs.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); handleStartQuiz(topic.id); }}
                        >
                          <Play className="h-3 w-3 mr-1" /> Quiz
                        </Button>
                      )}
                    </div>
                    
                    {/* Chapter Content */}
                    {isExpanded && (
                      <div className="border-t bg-muted/30 p-3 space-y-2">
                        {topicContent.map(item => (
                          <div 
                            key={item.id}
                            className="flex items-center gap-2 p-2 bg-background rounded border cursor-pointer hover:border-primary"
                            onClick={() => setViewingContent(item)}
                          >
                            {item.type === 'note' ? (
                              <FileText className="h-4 w-4 text-green-500" />
                            ) : (
                              <HelpCircle className="h-4 w-4 text-purple-500" />
                            )}
                            <span className="flex-1 text-sm">{item.title}</span>
                            <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                            
                            {isEditMode && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingContent(item)
                                  }}>
                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm('Delete this content?')) {
                                        removeContentItem(item.id)
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        ))}

                        {/* Add Content Button */}
                        {isEditMode && (
                          <div 
                            className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded cursor-pointer text-primary"
                            onClick={() => setShowContentForm({ topicId: topic.id })}
                          >
                            <Plus className="h-4 w-4" />
                            <span className="font-medium">Add content</span>
                          </div>
                        )}

                        {/* MCQ List */}
                        {topicMCQs.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-2">MCQs ({topicMCQs.length})</p>
                            <div className="space-y-1">
                              {topicMCQs.map((mcq, idx) => (
                                <div 
                                  key={mcq.id}
                                  className="flex items-center gap-2 p-2 bg-background rounded border hover:border-primary text-sm"
                                >
                                  <HelpCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                  <span className="flex-1 truncate">{idx + 1}. {mcq.question.replace(/<[^>]*>/g, '').substring(0, 60)}...</span>
                                  {mcq.assetRef && <span className="text-xs text-green-500" title="Synced with Library">🔗</span>}
                                  {isEditMode && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleEditMcq(mcq)}>
                                          <Pencil className="h-4 w-4 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-destructive"
                                          onClick={() => {
                                            if (confirm('Delete this MCQ?')) removeCourseMCQ(mcq.id)
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty State */}
                        {topicContent.length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">
                            No content yet. {isEditMode && 'Click "Add content" to start!'}
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })
            )}
          </div>

          {/* Add Chapter at Bottom */}
          {isEditMode && courseTopics.length > 0 && (
            <div 
              className="flex items-center gap-2 py-3 px-3 hover:bg-primary/10 rounded cursor-pointer border border-dashed"
              onClick={() => {
                const name = prompt('Enter chapter name:')
                if (name?.trim()) {
                  handleAddTopic(name)
                }
              }}
            >
              <Plus className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Add new chapter</span>
            </div>
          )}
        </TabsContent>

        {/* Live Test Tab - Same as Group Study */}
        <TabsContent value="live-test" className="mt-4 space-y-4">
          {/* Auto Daily Test Banner */}
          {isAutoTestActive && currentAutoTestConfig && (
            <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" />
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base text-green-700 dark:text-green-400">
                        {currentAutoTestConfig.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {currentAutoTestConfig.questionCount} Q • {currentAutoTestConfig.duration} min
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    className="h-8 text-xs sm:text-sm w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    onClick={startAutoTest}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Daily Test
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Available until {currentAutoTestConfig.endTime} today
                </p>
              </CardContent>
            </Card>
          )}

          {/* Sub-tabs - Same as Group Study: Upcoming, Past Tests, My Results */}
          <div className="flex gap-2 border-b pb-2 mb-4">
            <Button 
              variant={liveTestTab === 'upcoming' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setLiveTestTab('upcoming')}
            >
              <Clock className="h-4 w-4 mr-1" /> Upcoming
            </Button>
            <Button 
              variant={liveTestTab === 'past' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setLiveTestTab('past')}
            >
              <History className="h-4 w-4 mr-1" /> Past Tests
            </Button>
            <Button 
              variant={liveTestTab === 'results' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setLiveTestTab('results')}
            >
              <Trophy className="h-4 w-4 mr-1" /> My Results
            </Button>
          </div>

          {/* Upcoming Tests Tab */}
          {liveTestTab === 'upcoming' && (
            <div className="space-y-4">
              {courseLiveTests.filter(t => t.status === 'scheduled').length === 0 ? (
                <Card className="p-8 text-center">
                  <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Tests</h3>
                  <p className="text-muted-foreground">Check back later for scheduled tests</p>
                </Card>
              ) : (
                courseLiveTests.filter(t => t.status === 'scheduled').map(test => (
                  <Card key={test.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{test.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span><Target className="h-4 w-4 inline mr-1" /> {test.questionCount} questions</span>
                          <span><Clock className="h-4 w-4 inline mr-1" /> {test.duration} min</span>
                        </div>
                      </div>
                      <Button onClick={() => startLiveTest(test)}>
                        <Play className="h-4 w-4 mr-2" /> Start
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Past Tests Tab */}
          {liveTestTab === 'past' && (
            <div className="space-y-4">
              {courseLiveTests.filter(t => t.status === 'completed').length === 0 ? (
                <Card className="p-8 text-center">
                  <History className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Past Tests</h3>
                  <p className="text-muted-foreground">Completed tests will appear here</p>
                </Card>
              ) : (
                courseLiveTests.filter(t => t.status === 'completed').map(test => {
                  const myResult = liveTestResults.find(r => r.testId === test.id)
                  return (
                    <Card key={test.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{test.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {test.endedAt ? new Date(test.endedAt).toLocaleDateString() : ''} • {test.questionCount} questions
                          </p>
                        </div>
                        <div className="text-right">
                          {myResult ? (
                            <div className={`text-2xl font-bold ${myResult.score >= 80 ? 'text-green-500' : myResult.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                              {myResult.score}%
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not attempted</span>
                          )}
                        </div>
                      </div>
                      
                      {myResult && test.showSolution && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setViewingLiveTestResult(myResult)
                              setViewingLiveTestSolutions(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View Solutions
                          </Button>
                        </div>
                      )}
                    </Card>
                  )
                })
              )}
            </div>
          )}

          {/* My Results Tab */}
          {liveTestTab === 'results' && (
            <div className="space-y-4">
              {viewingLiveTestResult ? (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Test Result</h3>
                    <Button variant="outline" size="sm" onClick={() => setViewingLiveTestResult(null)}>
                      <X className="h-4 w-4 mr-1" /> Close
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted rounded">
                      <div className={`text-2xl font-bold ${viewingLiveTestResult.score >= 80 ? 'text-green-500' : viewingLiveTestResult.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {viewingLiveTestResult.score}%
                      </div>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold text-green-500">{viewingLiveTestResult.correct}</div>
                      <p className="text-xs text-muted-foreground">Correct</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold text-red-500">{viewingLiveTestResult.wrong}</div>
                      <p className="text-xs text-muted-foreground">Wrong</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold">{Math.floor(viewingLiveTestResult.timeTaken / 60)}:{String(viewingLiveTestResult.timeTaken % 60).padStart(2, '0')}</div>
                      <p className="text-xs text-muted-foreground">Time</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setViewingLiveTestSolutions(true)} 
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" /> View Solutions
                  </Button>
                </Card>
              ) : (
                <Card className="p-4">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle>My Live Test Results</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {liveTestResults.filter(r => r.courseId === activeCourseId).length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No results yet. Take a live test!</p>
                    ) : (
                      <div className="space-y-2">
                        {liveTestResults
                          .filter(r => r.courseId === activeCourseId)
                          .sort((a, b) => b.submittedAt - a.submittedAt)
                          .map(result => {
                            const test = liveTests.find(t => t.id === result.testId)
                            return (
                              <div 
                                key={result.id} 
                                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer"
                                onClick={() => setViewingLiveTestResult(result)}
                              >
                                <div>
                                  <p className="font-medium">{test?.title || 'Auto Test'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(result.submittedAt).toLocaleDateString()} • {result.correct}/{result.total} correct
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className={`text-xl font-bold ${result.score >= 80 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {result.score}%
                                  </div>
                                  {test?.showSolution && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setViewingLiveTestResult(result)
                                        setViewingLiveTestSolutions(true)
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Course Settings</h2>
            <p className="text-sm text-muted-foreground">Manage this course</p>
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Course Info</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input 
                  value={activeCourse.name} 
                  onChange={e => updateCourse({ ...activeCourse, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={activeCourse.description || ''} 
                  onChange={e => updateCourse({ ...activeCourse, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Live Test Management - Same as Group Study */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Live Test Management
            </h3>
            
            {/* Schedule / Auto Daily Tabs - using buttons instead of nested Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
              <button
                onClick={() => setSettingsLiveTestTab('schedule')}
                className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-all ${
                  settingsLiveTestTab === 'schedule'
                    ? 'bg-background shadow'
                    : 'hover:bg-background/50'
                }`}
              >
                Schedule
              </button>
              <button
                onClick={() => setSettingsLiveTestTab('auto-daily')}
                className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-all ${
                  settingsLiveTestTab === 'auto-daily'
                    ? 'bg-background shadow'
                    : 'hover:bg-background/50'
                }`}
              >
                Auto Daily
              </button>
            </div>
            
            {/* Schedule Tab Content */}
            {settingsLiveTestTab === 'schedule' && (
              <div className="space-y-4">
                {showCreateLiveTest ? (
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Create New Test</h4>
                      <Button variant="ghost" size="sm" onClick={() => setShowCreateLiveTest(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Test Title *</label>
                      <Input 
                        placeholder="e.g., Weekly Quiz #1"
                        value={newLiveTestTitle}
                        onChange={e => setNewLiveTestTitle(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Chapters (optional)</label>
                      <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                        <label className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newLiveTestCategories.length === 0}
                            onChange={() => setNewLiveTestCategories([])}
                            className="h-4 w-4"
                          />
                          <span className="text-sm font-medium">All Chapters ({courseMCQList.length} MCQs)</span>
                        </label>
                        {courseTopics.map(topic => {
                          const count = courseMCQList.filter(q => q.categoryId === topic.id).length
                          const isChecked = newLiveTestCategories.includes(topic.id)
                          return (
                            <label key={topic.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setNewLiveTestCategories([...newLiveTestCategories, topic.id])
                                  } else {
                                    setNewLiveTestCategories(newLiveTestCategories.filter(id => id !== topic.id))
                                  }
                                }}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">{topic.name} ({count})</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Test Duration</label>
                        <Select value={newLiveTestDuration} onValueChange={setNewLiveTestDuration}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Questions Count</label>
                        <Select value={newLiveTestQuestionCount} onValueChange={setNewLiveTestQuestionCount}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 Questions</SelectItem>
                            <SelectItem value="20">20 Questions</SelectItem>
                            <SelectItem value="30">30 Questions</SelectItem>
                            <SelectItem value="50">50 Questions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show solutions after test</span>
                      <input 
                        type="checkbox" 
                        checked={newLiveTestShowSolution}
                        onChange={e => setNewLiveTestShowSolution(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                    
                    <Button onClick={handleCreateLiveTest} className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Create Test
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setShowCreateLiveTest(true)} className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Create New Test
                    </Button>
                    
                    {/* Scheduled Tests List */}
                    {courseLiveTests.filter(t => t.status === 'scheduled').length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Scheduled Tests</h4>
                        {courseLiveTests
                          .filter(t => t.status === 'scheduled')
                          .map(test => (
                          <div key={test.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <p className="font-medium">{test.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {test.questionCount} questions • {test.duration} min
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Ready
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  if (confirm('Delete this test?')) {
                                    removeLiveTest(test.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No scheduled tests. Create one above!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Auto Daily Tab Content */}
            {settingsLiveTestTab === 'auto-daily' && (
              <div className="space-y-4">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div>
                    <h4 className="font-medium">Enable Auto Daily Test</h4>
                    <p className="text-sm text-muted-foreground">
                      Practice with a new test every day at the specified time
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoTestEnabled}
                    onChange={e => setAutoTestEnabled(e.target.checked)}
                    className="h-5 w-5"
                  />
                </div>
                
                {/* Config Form */}
                <div className={`space-y-4 ${!autoTestEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div>
                    <label className="text-sm font-medium">Test Title</label>
                    <Input
                      value={autoTestTitle}
                      onChange={e => setAutoTestTitle(e.target.value)}
                      placeholder="Daily Practice Test"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Chapters</label>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {courseTopics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Add chapters first.</p>
                      ) : (
                        <>
                          <label className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoTestCategories.length === 0}
                              onChange={() => setAutoTestCategories([])}
                              className="h-4 w-4"
                            />
                            <span className="text-sm font-medium">All Chapters ({courseMCQList.length})</span>
                          </label>
                          {courseTopics.map(topic => {
                            const count = courseMCQList.filter(q => q.categoryId === topic.id).length
                            const isChecked = autoTestCategories.includes(topic.id)
                            return (
                              <label key={topic.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setAutoTestCategories([...autoTestCategories, topic.id])
                                    } else {
                                      setAutoTestCategories(autoTestCategories.filter(id => id !== topic.id))
                                    }
                                  }}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">{topic.name} ({count})</span>
                              </label>
                            )
                          })}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Daily Start Time</label>
                      <Input
                        type="time"
                        value={autoTestStartTime}
                        onChange={e => setAutoTestStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Daily End Time</label>
                      <Input
                        type="time"
                        value={autoTestEndTime}
                        onChange={e => setAutoTestEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Test Duration</label>
                      <Select value={autoTestDuration} onValueChange={setAutoTestDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Questions Count</label>
                      <Select value={autoTestQuestionCount} onValueChange={setAutoTestQuestionCount}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 Questions</SelectItem>
                          <SelectItem value="20">20 Questions</SelectItem>
                          <SelectItem value="30">30 Questions</SelectItem>
                          <SelectItem value="50">50 Questions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Active Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                        <button
                          key={day}
                          onClick={() => {
                            if (autoTestDays.includes(idx)) {
                              setAutoTestDays(autoTestDays.filter(d => d !== idx))
                            } else {
                              setAutoTestDays([...autoTestDays, idx])
                            }
                          }}
                          className={`px-3 py-1 rounded text-sm ${
                            autoTestDays.includes(idx)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show solutions after test</span>
                    <input
                      type="checkbox"
                      checked={autoTestShowSolution}
                      onChange={e => setAutoTestShowSolution(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>
                </div>
                
                <Button onClick={handleSaveAutoTestConfig} className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Save Auto Test Settings
                </Button>
                
                {autoTestEnabled && currentAutoTestConfig && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      ✓ Auto Test Active
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Runs daily from {currentAutoTestConfig.startTime} to {currentAutoTestConfig.endTime}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-4 border-destructive/50">
            <h3 className="font-semibold mb-3 text-destructive">Danger Zone</h3>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (confirm('Delete this course and all its content? This cannot be undone!')) {
                  removeCourse(activeCourseId!)
                  setActiveCourse(null)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete Course
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Content Form Modal - Multi-step like Group Study */}
      <AnimatePresence>
        {showContentForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={resetContentForm}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Step 1: Choose Method */}
              {contentStep === 'choose' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Add Content</h2>
                    <Button variant="ghost" size="sm" onClick={resetContentForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div 
                      className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary hover:bg-muted/50 cursor-pointer transition-all"
                      onClick={() => setContentStep('type')}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Manually</p>
                        <p className="text-sm text-muted-foreground">Create new content from scratch</p>
                      </div>
                    </div>
                    <div 
                      className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary hover:bg-muted/50 cursor-pointer transition-all"
                      onClick={() => setContentStep('import')}
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Library className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">Import from Library</p>
                        <p className="text-sm text-muted-foreground">Import MCQs or Notes from your library</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Import from Library */}
              {contentStep === 'import' && (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setContentStep('choose')}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Library className="h-5 w-5 text-purple-600" />
                      Import from Library
                    </h2>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={resetContentForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Filter by Type */}
                  <div className="flex flex-wrap gap-1 p-1 bg-muted rounded mb-4">
                    {['all', 'mcq', 'note', 'url', 'pdf', 'video'].map(type => (
                      <button
                        key={type}
                        onClick={() => setImportAssetType(type as typeof importAssetType)}
                        className={`px-2 py-1 rounded text-xs capitalize ${importAssetType === type ? 'bg-background shadow' : ''}`}
                      >
                        {type === 'all' ? 'All' : type === 'mcq' ? 'MCQs' : type === 'note' ? 'Notes' : type === 'url' ? 'Links' : type === 'pdf' ? 'PDFs' : 'Videos'}
                      </button>
                    ))}
                  </div>

                  {/* Filter by Subject/Topic */}
                  <div className="flex gap-2 mb-4">
                    <Select value={assetSelectedSubject || 'all'} onValueChange={v => setAssetSelectedSubject(v === 'all' ? null : v)}>
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {assetSubjects.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {assetSelectedSubject && (
                      <Select value={assetSelectedTopic || 'all'} onValueChange={v => setAssetSelectedTopic(v === 'all' ? null : v)}>
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="All Topics" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Topics</SelectItem>
                          {getAssetTopicsBySubject(assetSelectedSubject).map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Assets List */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {allAssets.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No assets in your library yet.
                        <br />
                        <span className="text-xs">Go to Library tab to add content!</span>
                      </p>
                    ) : (
                      allAssets
                        .filter(a => {
                          if (importAssetType !== 'all' && a.type !== importAssetType) return false
                          if (assetSelectedSubject && a.subjectId !== assetSelectedSubject) return false
                          if (assetSelectedTopic && a.topicId !== assetSelectedTopic) return false
                          return true
                        })
                        .map(asset => (
                          <label
                            key={asset.id}
                            className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                              selectedAssetIds.includes(asset.id) ? 'border-primary bg-primary/5' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedAssetIds.includes(asset.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedAssetIds([...selectedAssetIds, asset.id])
                                } else {
                                  setSelectedAssetIds(selectedAssetIds.filter(id => id !== asset.id))
                                }
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  asset.type === 'mcq' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                  asset.type === 'note' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                  asset.type === 'url' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                }`}>
                                  {asset.type.toUpperCase()}
                                </span>
                                <span className="font-medium text-sm truncate">{asset.title}</span>
                              </div>
                              {asset.type === 'note' && (asset as any).content && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                  {((asset as any).content || '').replace(/<[^>]*>/g, '').substring(0, 60)}...
                                </p>
                              )}
                              {asset.type === 'mcq' && (asset as any).quizQuestions && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {(asset as any).quizQuestions.length} questions
                                </p>
                              )}
                            </div>
                          </label>
                        ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <Button variant="outline" onClick={resetContentForm}>Cancel</Button>
                    <Button 
                      onClick={handleImportAssets}
                      disabled={selectedAssetIds.length === 0}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Library className="h-4 w-4 mr-2" />
                      Import ({selectedAssetIds.length})
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Choose Content Type */}
              {contentStep === 'type' && (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => setContentStep('choose')}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold">Create new item</h2>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={resetContentForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { type: 'heading' as const, icon: Heading, label: 'Heading', desc: 'Define chapter section headings' },
                      { type: 'pdf' as const, icon: Image, label: 'PDF / Images', desc: 'Upload PDF or image files' },
                      { type: 'text' as const, icon: Type, label: 'Text', desc: 'Add custom text or iFrame and HTML' },
                      { type: 'link' as const, icon: Link, label: 'Link (Video, Website etc.)', desc: 'Add link which will be embedded in iFrame' },
                      { type: 'quiz' as const, icon: HelpCircle, label: 'Quiz', desc: 'Learners can attempt any time & get results' },
                    ].map(item => (
                      <div 
                        key={item.type}
                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                          newContentType === item.type ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => {
                          setNewContentType(item.type)
                          setContentStep('form')
                        }}
                      >
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                          {newContentType === item.type && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Content Form */}
              {contentStep === 'form' && (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => setContentStep('type')}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold">
                      {newContentType === 'heading' && 'Add Heading'}
                      {newContentType === 'pdf' && 'Add PDF / Images'}
                      {newContentType === 'text' && 'Add Text'}
                      {newContentType === 'link' && 'Add Link'}
                      {newContentType === 'quiz' && 'Add Quiz'}
                    </h2>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={resetContentForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Heading Form */}
                  {newContentType === 'heading' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Heading Text</label>
                        <Input
                          placeholder="Enter heading"
                          value={newContentTitle}
                          onChange={e => setNewContentTitle(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={resetContentForm}>Cancel</Button>
                        <Button onClick={handleAddContent} disabled={!newContentTitle.trim()}>Add</Button>
                      </div>
                    </div>
                  )}

                  {/* PDF/Images Form */}
                  {newContentType === 'pdf' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          placeholder="File title"
                          value={newContentTitle}
                          onChange={e => setNewContentTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">File URL</label>
                        <Input
                          placeholder="Enter file URL (PDF, Image)"
                          value={newContentLink}
                          onChange={e => setNewContentLink(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Upload to Google Drive/Dropbox and paste the link</p>
                      </div>
                      <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={resetContentForm}>Cancel</Button>
                        <Button onClick={handleAddContent} disabled={!newContentTitle.trim()}>Add</Button>
                      </div>
                    </div>
                  )}

                  {/* Text Form */}
                  {newContentType === 'text' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          placeholder="Content title"
                          value={newContentTitle}
                          onChange={e => setNewContentTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Content</label>
                        <ReactQuill
                          theme="snow"
                          value={newContentBody}
                          onChange={setNewContentBody}
                          modules={quillModules}
                          className="bg-background"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={resetContentForm}>Cancel</Button>
                        <Button onClick={handleAddContent} disabled={!newContentTitle.trim()}>Add</Button>
                      </div>
                    </div>
                  )}

                  {/* Link Form */}
                  {newContentType === 'link' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          placeholder="Link title"
                          value={newContentTitle}
                          onChange={e => setNewContentTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">URL</label>
                        <Input
                          placeholder="https://..."
                          value={newContentLink}
                          onChange={e => setNewContentLink(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">YouTube, Website, or any embeddable link</p>
                      </div>
                      <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={resetContentForm}>Cancel</Button>
                        <Button onClick={handleAddContent} disabled={!newContentTitle.trim() || !newContentLink.trim()}>Add</Button>
                      </div>
                    </div>
                  )}

                  {/* Quiz Form (MCQ) */}
                  {newContentType === 'quiz' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Question</label>
                        <Textarea
                          placeholder="Enter your question"
                          value={mcqQuestion}
                          onChange={e => setMcqQuestion(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Options (click to mark correct)</label>
                        {mcqOptions.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <button
                              type="button"
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                mcqCorrect === idx ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground'
                              }`}
                              onClick={() => setMcqCorrect(idx)}
                            >
                              {mcqCorrect === idx && <Check className="h-3 w-3" />}
                            </button>
                            <Input
                              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                              value={opt}
                              onChange={e => {
                                const newOpts = [...mcqOptions]
                                newOpts[idx] = e.target.value
                                setMcqOptions(newOpts)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="text-sm font-medium">Explanation (optional)</label>
                        <Textarea
                          placeholder="Explain the answer"
                          value={mcqExplanation}
                          onChange={e => setMcqExplanation(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={resetContentForm}>Cancel</Button>
                        <Button 
                          onClick={() => {
                            handleAddMCQ()
                            resetContentForm()
                          }} 
                          disabled={!mcqQuestion.trim() || mcqOptions.filter(o => o.trim()).length < 2}
                        >
                          Add Quiz
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MCQ Form Modal */}
      <AnimatePresence>
        {showMCQForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMCQForm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold">Add MCQ</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Question</label>
                  <Textarea
                    placeholder="Enter your question"
                    value={mcqQuestion}
                    onChange={e => setMcqQuestion(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Options (click to mark correct)</label>
                  {mcqOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          mcqCorrect === idx ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground'
                        }`}
                        onClick={() => setMcqCorrect(idx)}
                      >
                        {mcqCorrect === idx && <Check className="h-3 w-3" />}
                      </button>
                      <Input
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={e => {
                          const newOpts = [...mcqOptions]
                          newOpts[idx] = e.target.value
                          setMcqOptions(newOpts)
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium">Explanation (optional)</label>
                  <Textarea
                    placeholder="Explain the answer"
                    value={mcqExplanation}
                    onChange={e => setMcqExplanation(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowMCQForm(null)}>Cancel</Button>
                <Button 
                  onClick={handleAddMCQ} 
                  disabled={!mcqQuestion.trim() || mcqOptions.filter(o => o.trim()).length < 2}
                >
                  Add MCQ
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Content Modal */}
      <AnimatePresence>
        {viewingContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingContent(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{viewingContent.title}</h2>
                <Button variant="ghost" size="sm" onClick={() => setViewingContent(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: viewingContent.content || '<p class="text-muted-foreground">No content</p>' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Content Modal */}
      <AnimatePresence>
        {editingContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingContent(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold">Edit Content</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editingContent.title}
                    onChange={e => setEditingContent({ ...editingContent, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <ReactQuill
                    theme="snow"
                    value={editingContent.content || ''}
                    onChange={content => setEditingContent({ ...editingContent, content })}
                    modules={quillModules}
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setEditingContent(null)}>Cancel</Button>
                <Button onClick={handleSaveContent}>Save</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MCQ Edit Dialog */}
      <AnimatePresence>
        {editingMcq && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setEditingMcq(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> Edit MCQ
                  {editingMcq.assetRef && <span className="text-xs text-green-500">(🔗 Library Synced)</span>}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setEditingMcq(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Question</label>
                  <Textarea
                    value={editMcqQuestion}
                    onChange={(e) => setEditMcqQuestion(e.target.value)}
                    placeholder="Enter question..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Options</label>
                  {editMcqOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="editCorrect"
                        checked={editMcqCorrectIndex === idx}
                        onChange={() => setEditMcqCorrectIndex(idx)}
                        className="h-4 w-4"
                      />
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...editMcqOptions]
                          newOpts[idx] = e.target.value
                          setEditMcqOptions(newOpts)
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Explanation (Optional)</label>
                  <Textarea
                    value={editMcqExplanation}
                    onChange={(e) => setEditMcqExplanation(e.target.value)}
                    placeholder="Explain the correct answer..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setEditingMcq(null)}>Cancel</Button>
                  <Button 
                    onClick={handleSaveEditMcq}
                    disabled={!editMcqQuestion.trim() || editMcqOptions.some(o => !o.trim())}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Save {editingMcq.assetRef && '& Sync'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PersonalDashboard
