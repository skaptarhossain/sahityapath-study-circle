import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
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
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import type { PersonalSubTab } from '@/components/layout/main-layout'
import type { PersonalCourse, PersonalTopic, PersonalContentItem, PersonalMCQ } from '@/types'

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
    removeCourseMCQ,
    addQuizResult,
    getTopicsByCourse,
    getMCQsByCourse,
    loadFromFirebase,
    subscribeToFirebase,
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

  // Active course
  const activeCourse = activeCourseId ? courses.find(c => c.id === activeCourseId) : null
  
  // Course data
  const courseTopics = activeCourseId 
    ? topics.filter(t => t.courseId === activeCourseId).sort((a, b) => a.order - b.order)
    : []
  
  const courseMCQList = activeCourseId 
    ? courseMCQs.filter(m => m.courseId === activeCourseId)
    : []

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

        {/* Live Test Tab */}
        <TabsContent value="live-test" className="mt-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Practice Quiz</h2>
            <p className="text-sm text-muted-foreground">Test your knowledge</p>
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Start a Quiz</h3>
            {courseMCQList.length === 0 ? (
              <p className="text-muted-foreground text-sm">Add MCQs to your course first!</p>
            ) : (
              <div className="space-y-3">
                <Button onClick={() => handleStartQuiz()} className="w-full">
                  <Play className="h-4 w-4 mr-2" /> 
                  All MCQs ({courseMCQList.length} questions)
                </Button>
                
                {courseTopics.filter(t => courseMCQList.some(m => m.categoryId === t.id)).length > 0 && (
                  <>
                    <div className="text-sm text-muted-foreground text-center">or by chapter</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {courseTopics.map(topic => {
                        const count = courseMCQList.filter(m => m.categoryId === topic.id).length
                        if (count === 0) return null
                        return (
                          <Button 
                            key={topic.id}
                            variant="outline"
                            onClick={() => handleStartQuiz(topic.id)}
                          >
                            {topic.name} ({count})
                          </Button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Recent Results */}
          {quizResults.filter(r => r.courseId === activeCourseId).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Recent Results</h3>
              <div className="space-y-2">
                {quizResults
                  .filter(r => r.courseId === activeCourseId)
                  .slice(-5)
                  .reverse()
                  .map(result => (
                    <div key={result.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="text-sm">
                        <span className="font-medium">{result.correct}/{result.total}</span>
                        <span className="text-muted-foreground ml-2">
                          ({Math.round(result.score)}%)
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
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
    </div>
  )
}

export default PersonalDashboard
