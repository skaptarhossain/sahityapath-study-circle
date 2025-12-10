import { useState, useMemo, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePersonalStore } from '@/stores/personal-store'
import { TestRunner, type TestResult } from './test-runner'
import { v4 as uuidv4 } from 'uuid'
import { Play, BookOpen, Brain, Zap, Plus, Trash2, ChevronDown, ChevronRight, FolderPlus, Pencil, Maximize2, X } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export function PersonalDashboard() {
  const [tab, setTab] = useState<'dashboard' | 'mock' | 'live' | 'notes' | 'settings'>('dashboard')
  const subjects = usePersonalStore(s => s.subjects)
  const categories = usePersonalStore(s => s.categories)
  const mcqs = usePersonalStore(s => s.mcqs)
  const notes = usePersonalStore(s => s.notes)
  const testResults = usePersonalStore(s => s.testResults)
  const selectedSubjectId = usePersonalStore(s => s.selectedSubjectId)
  const setSelectedSubject = usePersonalStore(s => s.setSelectedSubject)
  const addSubject = usePersonalStore(s => s.addSubject)
  const removeSubject = usePersonalStore(s => s.removeSubject)
  const addCategory = usePersonalStore(s => s.addCategory)
  const removeCategory = usePersonalStore(s => s.removeCategory)
  const addMCQ = usePersonalStore(s => s.addMCQ)
  const removeMCQ = usePersonalStore(s => s.removeMCQ)
  const addNote = usePersonalStore(s => s.addNote)
  const updateNote = usePersonalStore(s => s.updateNote)
  const addTestResult = usePersonalStore(s => s.addTestResult)
  const updateSettings = usePersonalStore(s => s.updateSettings)
  const settings = usePersonalStore(s => s.settings)

  // Test states
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testType, setTestType] = useState<'mock' | 'live'>('mock')
  const [mockSelectedCategories, setMockSelectedCategories] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null)
  
  // Category expansion state for Question Bank
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  
  // Sub-category form state
  const [subCategoryParentId, setSubCategoryParentId] = useState<string | undefined>(undefined)
  const [newSubCategory, setNewSubCategory] = useState('')

  // Form states
  const [newSubject, setNewSubject] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteCategory, setNoteCategory] = useState<string | undefined>(undefined)
  
  // Edit note state
  const [editingNote, setEditingNote] = useState<{ id: string; title: string; content: string; categoryId: string } | null>(null)
  const [fullscreenNote, setFullscreenNote] = useState<{ id: string; title: string; content: string } | null>(null)
  
  // MCQ form - 4 options with radio for correct answer
  const [mcqQuestion, setMcqQuestion] = useState('')
  const [mcqOptionA, setMcqOptionA] = useState('')
  const [mcqOptionB, setMcqOptionB] = useState('')
  const [mcqOptionC, setMcqOptionC] = useState('')
  const [mcqOptionD, setMcqOptionD] = useState('')
  const [mcqCorrect, setMcqCorrect] = useState(0)
  const [mcqCategory, setMcqCategory] = useState<string | undefined>(undefined)

  // Rich text editor modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],  // Alignment: left, center, right, justify
      [{ 'indent': '-1'}, { 'indent': '+1' }],  // Indent
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  }

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Get questions by category (including sub-categories)
  const getQuestionsByCategory = (categoryId: string) => {
    const subCats = categories.filter(c => c.parentId === categoryId).map(c => c.id)
    return mcqs.filter(q => q.categoryId === categoryId || subCats.includes(q.categoryId))
  }

  // Filter categories by selected subject
  const filteredCategories = useMemo(() => {
    if (!selectedSubjectId) return []
    return categories.filter(c => c.subjectId === selectedSubjectId)
  }, [categories, selectedSubjectId])

  // Get sub-categories
  const getSubCategories = (parentId: string) => {
    return categories.filter(c => c.parentId === parentId)
  }

  // Get main categories (no parent)
  const mainCategories = useMemo(() => {
    return filteredCategories.filter(c => !c.parentId)
  }, [filteredCategories])

  // Get all categories including sub for dropdown
  const allCategoriesFlat = useMemo(() => {
    const result: { id: string; name: string; isSubCategory: boolean }[] = []
    mainCategories.forEach(cat => {
      result.push({ id: cat.id, name: cat.name, isSubCategory: false })
      getSubCategories(cat.id).forEach(sub => {
        result.push({ id: sub.id, name: `  ↳ ${sub.name}`, isSubCategory: true })
      })
    })
    return result
  }, [mainCategories, categories])

  // Auto-select first subject if available and none selected
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubject(subjects[0].id)
    }
  }, [subjects, selectedSubjectId, setSelectedSubject])


  // Auto-select first category of current subject if none selected
  useEffect(() => {
    if (filteredCategories.length > 0 && (!mcqCategory || !filteredCategories.find(c => c.id === mcqCategory))) {
      setMcqCategory(filteredCategories[0].id)
    }
  }, [filteredCategories, mcqCategory])

  // Generate test questions
  const liveTestQuestions = useMemo(() => {
    const eligibleQuestions = mcqs.filter(q => settings.liveCategories.includes(q.categoryId))
    const shuffled = [...eligibleQuestions].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(settings.liveCount, shuffled.length))
  }, [mcqs, settings.liveCategories, settings.liveCount])

  const mockTestQuestions = useMemo(() => {
    const eligibleQuestions = mcqs.filter(q => mockSelectedCategories.length === 0 || mockSelectedCategories.includes(q.categoryId))
    const shuffled = [...eligibleQuestions].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(settings.mockCount, shuffled.length))
  }, [mcqs, mockSelectedCategories, settings.mockCount])

  function handleAddSubject() {
    if (!newSubject.trim()) return alert('Enter subject name')
    addSubject({ id: uuidv4(), name: newSubject.trim() })
    setNewSubject('')
  }

  function handleDeleteCategory(categoryId: string, categoryName: string) {
    // Check if category has questions
    const questionsInCategory = mcqs.filter(q => q.categoryId === categoryId)
    if (questionsInCategory.length > 0) {
      alert(`Cannot delete "${categoryName}"!\n\nThis category has ${questionsInCategory.length} question(s).\nPlease delete all questions first.`)
      return
    }
    
    // Check if category has sub-categories
    const subCategories = categories.filter(c => c.parentId === categoryId)
    if (subCategories.length > 0) {
      alert(`Cannot delete "${categoryName}"!\n\nThis category has ${subCategories.length} sub-category(ies).\nPlease delete all sub-categories first.`)
      return
    }
    
    // Confirm before delete
    if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      removeCategory(categoryId)
    }
  }

  function handleDeleteQuestion(questionId: string, questionText: string) {
    const shortQuestion = questionText.length > 50 ? questionText.substring(0, 50) + '...' : questionText
    if (confirm(`Are you sure you want to delete this question?\n\n"${shortQuestion}"`)) {
      removeMCQ(questionId)
    }
  }

  function handleDeleteSubject(subjectId: string, subjectName: string) {
    // Check if subject has categories
    const categoriesInSubject = categories.filter(c => c.subjectId === subjectId)
    if (categoriesInSubject.length > 0) {
      alert(`Cannot delete "${subjectName}"!\n\nThis subject has ${categoriesInSubject.length} category(ies).\nPlease delete all categories first.`)
      return
    }
    
    // Confirm before delete
    if (confirm(`Are you sure you want to delete subject "${subjectName}"?`)) {
      removeSubject(subjectId)
      // If deleted subject was selected, switch to General
      if (selectedSubjectId === subjectId) {
        setSelectedSubject('sub-1')
      }
    }
  }

  function handleAddCategory() {
    if (!selectedSubjectId) {
      alert('Please select a subject first from the dropdown above')
      return
    }
    if (!newCategory.trim()) {
      alert('Enter category name')
      return
    }
    addCategory({ id: uuidv4(), name: newCategory.trim(), subjectId: selectedSubjectId })
    setNewCategory('')
  }

  function handleAddSubCategory() {
    if (!subCategoryParentId) {
      alert('Please select a parent category')
      return
    }
    if (!newSubCategory.trim()) {
      alert('Enter sub-category name')
      return
    }
    addCategory({ 
      id: uuidv4(), 
      name: newSubCategory.trim(), 
      subjectId: selectedSubjectId!, 
      parentId: subCategoryParentId 
    })
    setNewSubCategory('')
  }

  function handleAddNote() {
    if (!noteTitle.trim()) return alert('Enter note title')
    // ReactQuill returns <p><br></p> when empty
    const cleanContent = noteContent.replace(/<p><br><\/p>/g, '').replace(/<(.|\n)*?>/g, '').trim()
    if (!cleanContent) return alert('Enter note content')
    if (!noteCategory && filteredCategories.length > 0) return alert('Select a category for this note')
    addNote({ id: uuidv4(), title: noteTitle.trim(), content: noteContent, categoryId: noteCategory || '' })
    setNoteTitle('')
    setNoteContent('')
    setNoteCategory(undefined)
  }

  function handleUpdateNote() {
    if (!editingNote) return
    if (!editingNote.title.trim()) return alert('Enter note title')
    const cleanContent = editingNote.content.replace(/<p><br><\/p>/g, '').replace(/<(.|\n)*?>/g, '').trim()
    if (!cleanContent) return alert('Enter note content')
    updateNote({ 
      id: editingNote.id, 
      title: editingNote.title.trim(), 
      content: editingNote.content, 
      categoryId: editingNote.categoryId 
    })
    setEditingNote(null)
  }

  function handleAddMCQ() {
    if (!mcqQuestion.trim()) return alert('Enter question')
    if (!mcqOptionA.trim() || !mcqOptionB.trim() || !mcqOptionC.trim() || !mcqOptionD.trim()) {
      return alert('All 4 options are required')
    }
    if (!mcqCategory) return alert('Select a category')
    
    const options = [mcqOptionA.trim(), mcqOptionB.trim(), mcqOptionC.trim(), mcqOptionD.trim()]
    addMCQ({ 
      id: uuidv4(), 
      categoryId: mcqCategory, 
      question: mcqQuestion.trim(), 
      options, 
      correctIndex: mcqCorrect 
    })
    
    // Clear form but KEEP the selected category for next question
    setMcqQuestion('')
    setMcqOptionA('')
    setMcqOptionB('')
    setMcqOptionC('')
    setMcqOptionD('')
    setMcqCorrect(0)
    // mcqCategory is NOT cleared - keeps last selection as default
  }

  function handleTestFinish(result: TestResult) {
    // Save result to store
    addTestResult({
      id: uuidv4(),
      date: Date.now(),
      testType,
      totalQuestions: result.total,
      correct: result.correct,
      wrong: result.wrong,
      skipped: result.skipped,
      score: Math.round((result.correct / result.total) * 100)
    })
    setLastTestResult(result)
    setShowResults(true)
    setIsTestRunning(false)
  }

  function startMockTest() {
    if (mockTestQuestions.length === 0) {
      return alert('No questions available. Add questions in Settings first.')
    }
    setTestType('mock')
    setIsTestRunning(true)
  }

  function startLiveTest() {
    if (liveTestQuestions.length === 0) {
      return alert('No questions available for Live Test. Configure categories in Settings.')
    }
    setTestType('live')
    setIsTestRunning(true)
  }

  function handleBackFromTest() {
    setIsTestRunning(false)
  }

  // If test is running, show test runner
  if (isTestRunning) {
    const questions = testType === 'live' ? liveTestQuestions : mockTestQuestions
    return (
      <TestRunner
        questions={questions}
        testTitle={testType === 'live' ? 'Daily Live Test' : 'Mock Test'}
        timePerQuestion={30}
        onFinish={handleTestFinish}
        onBack={handleBackFromTest}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Personal</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedSubjectId} onValueChange={(v) => setSelectedSubject(v || undefined)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="mock">Mock Test</TabsTrigger>
          <TabsTrigger value="live">Live Test</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setTab('mock')}>
              <CardContent className="pt-6 text-center">
                <Brain className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                <h3 className="font-semibold">Mock Test</h3>
                <p className="text-sm text-muted-foreground mt-1">Practice with custom tests</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setTab('live')}>
              <CardContent className="pt-6 text-center">
                <Zap className="h-12 w-12 mx-auto mb-3 text-orange-500" />
                <h3 className="font-semibold">Live Test</h3>
                <p className="text-sm text-muted-foreground mt-1">Daily random challenge</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setTab('notes')}>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold">Notes</h3>
                <p className="text-sm text-muted-foreground mt-1">{notes.length} notes saved</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{mcqs.length}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{filteredCategories.length}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{notes.length}</p>
                  <p className="text-sm text-muted-foreground">Notes</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{settings.liveCount}</p>
                  <p className="text-sm text-muted-foreground">Live Test Qs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mock">
          <Card>
            <CardHeader>
              <CardTitle>Mock Test</CardTitle>
              <CardDescription>Create a custom practice test from your question bank</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Select categories (leave empty for all):</p>
                <div className="flex flex-wrap gap-2">
                  {filteredCategories.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer px-3 py-1 border rounded-full hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={mockSelectedCategories.includes(c.id)}
                        onChange={e => {
                          if (e.target.checked) setMockSelectedCategories([...mockSelectedCategories, c.id])
                          else setMockSelectedCategories(mockSelectedCategories.filter(id => id !== c.id))
                        }}
                      />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
                {filteredCategories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet. Add in Settings.</p>}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm"><strong>Questions available:</strong> {mockTestQuestions.length}</p>
                <p className="text-sm"><strong>Test duration:</strong> ~{Math.ceil(mockTestQuestions.length * 30 / 60)} minutes</p>
              </div>

              <Button size="lg" onClick={startMockTest} disabled={mockTestQuestions.length === 0}>
                <Play className="h-4 w-4 mr-2" /> Start Mock Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live">
          <Card>
            <CardHeader>
              <CardTitle>Daily Live Test</CardTitle>
              <CardDescription>Random mix of {settings.liveCount} questions from selected categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm"><strong>Questions:</strong> {liveTestQuestions.length} / {settings.liveCount}</p>
                <p className="text-sm"><strong>Categories:</strong> {settings.liveCategories.length > 0 ? filteredCategories.filter(c => settings.liveCategories.includes(c.id)).map(c => c.name).join(', ') : 'None selected'}</p>
                <p className="text-sm"><strong>Duration:</strong> ~{Math.ceil(liveTestQuestions.length * 30 / 60)} minutes</p>
              </div>

              {liveTestQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Configure Live Test categories in Settings to enable this test.</p>
              ) : (
                <Button size="lg" onClick={startLiveTest}>
                  <Zap className="h-4 w-4 mr-2" /> Start Live Test
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold">Notes</h3>
              {notes.length === 0 && <p className="text-muted-foreground">No notes yet. Create one!</p>}
              {notes.map(n => (
                <Card key={n.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{n.title}</h4>
                        <div 
                          className="text-sm text-muted-foreground mt-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: n.content }}
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setFullscreenNote({ id: n.id, title: n.title, content: n.content })} title="Fullscreen">
                          <Maximize2 className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingNote({ id: n.id, title: n.title, content: n.content, categoryId: n.categoryId })} title="Edit">
                          <Pencil className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (confirm('Delete this note?')) {
                            usePersonalStore.getState().removeNote(n.id)
                          }
                        }} title="Delete">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">New Note</h4>
              <Input placeholder="Title" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} />
              <Select value={noteCategory} onValueChange={(v) => setNoteCategory(v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {allCategoriesFlat.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="border rounded-md overflow-hidden">
                <ReactQuill 
                  theme="snow"
                  value={noteContent}
                  onChange={setNoteContent}
                  modules={quillModules}
                  placeholder="Write your note here..."
                  style={{ height: '200px' }}
                />
              </div>
              <div className="pt-12">
                <Button onClick={handleAddNote} className="w-full">Save Note</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Settings (Admin Panel)</h3>

            {/* Row 1: Subject & Category Management */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Add Subject */}
              <Card className="p-4 space-y-3">
                <h4 className="font-medium">📚 Add New Subject</h4>
                <div className="flex gap-2">
                  <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Subject name (e.g. Physics)" />
                  <Button onClick={handleAddSubject}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => (
                    <span key={s.id} className={`px-3 py-1 rounded-full text-sm cursor-pointer inline-flex items-center gap-1 ${selectedSubjectId === s.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <span onClick={() => setSelectedSubject(s.id)}>{s.name}</span>
                      {s.id !== 'sub-1' && ( // Can't delete General subject
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s.id, s.name) }} className="text-red-500 hover:text-red-700 ml-1">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </Card>

              {/* Create Category & Sub-Category */}
              <Card className="p-4 space-y-3">
                <h4 className="font-medium">📁 Create Category & Sub-Category</h4>
                <p className="text-xs text-muted-foreground">Selected Subject: <strong>{subjects.find(s => s.id === selectedSubjectId)?.name || 'None'}</strong></p>
                
                {/* Main Category */}
                <div className="flex gap-2">
                  <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Category name (e.g. Mechanics)" />
                  <Button onClick={handleAddCategory}><Plus className="h-4 w-4" /></Button>
                </div>
                
                {/* Sub-Category */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Add Sub-Category:</p>
                  <div className="flex gap-2">
                    <Select value={subCategoryParentId} onValueChange={(v) => setSubCategoryParentId(v)}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Parent" /></SelectTrigger>
                      <SelectContent>
                        {mainCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input value={newSubCategory} onChange={e => setNewSubCategory(e.target.value)} placeholder="Sub-category name" className="flex-1" />
                    <Button onClick={handleAddSubCategory} variant="outline"><FolderPlus className="h-4 w-4" /></Button>
                  </div>
                </div>

                {/* Category List with Sub-Categories */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mainCategories.map(c => (
                    <div key={c.id}>
                      <span className="px-3 py-1 bg-muted rounded-full text-sm inline-flex items-center gap-1">
                        {c.name} ({getQuestionsByCategory(c.id).length})
                        <button onClick={() => handleDeleteCategory(c.id, c.name)} className="text-red-500 hover:text-red-700 ml-1">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                      {getSubCategories(c.id).length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {getSubCategories(c.id).map(sub => (
                            <span key={sub.id} className="px-2 py-0.5 bg-muted/50 rounded text-xs inline-flex items-center gap-1">
                              ↳ {sub.name} ({mcqs.filter(q => q.categoryId === sub.id).length})
                              <button onClick={() => handleDeleteCategory(sub.id, sub.name)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Row 2: Create Tests */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Create Live Quiz */}
              <Card className="p-4 space-y-3 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                <h4 className="font-medium flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" /> Create Live Quiz
                </h4>
                <p className="text-xs text-muted-foreground">Select categories and number of questions for daily live test</p>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Questions:</label>
                  <Input type="number" className="w-20" value={settings.liveCount} onChange={e => updateSettings({ liveCount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {allCategoriesFlat.length === 0 && <p className="text-xs text-muted-foreground">Add categories first</p>}
                  {allCategoriesFlat.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={settings.liveCategories.includes(c.id)} onChange={e => {
                        const cur = settings.liveCategories
                        if (e.target.checked) updateSettings({ liveCategories: [...cur, c.id] })
                        else updateSettings({ liveCategories: cur.filter(id => id !== c.id) })
                      }} />
                      <span className="text-sm">{c.name} ({getQuestionsByCategory(c.id).length} Qs)</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs font-medium text-orange-600">
                  Total available: {mcqs.filter(q => settings.liveCategories.includes(q.categoryId)).length} questions
                </p>
              </Card>

              {/* Create Mock Test */}
              <Card className="p-4 space-y-3 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <h4 className="font-medium flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" /> Create Mock Test
                </h4>
                <p className="text-xs text-muted-foreground">Configure maximum questions per mock test</p>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Max Questions:</label>
                  <Input type="number" className="w-20" value={settings.mockCount} onChange={e => updateSettings({ mockCount: Number(e.target.value) })} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Mock test allows selecting categories before starting. All questions from selected categories will be randomized.
                </p>
                <p className="text-xs font-medium text-blue-600">
                  Total in Question Bank: {mcqs.length} questions
                </p>
              </Card>
            </div>

            {/* Row 3: Question Bank with Categories */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">📝 Question Bank</h4>
                <span className="text-sm text-muted-foreground">Total: {mcqs.length} questions</span>
              </div>

              {/* Add Question Form */}
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <p className="text-sm font-medium">Add New Question (MCQ - 4 Options)</p>
                <Textarea 
                  placeholder="Enter your question here..." 
                  value={mcqQuestion} 
                  onChange={e => setMcqQuestion(e.target.value)} 
                  rows={2} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={mcqCorrect === 0} onChange={() => setMcqCorrect(0)} className="w-4 h-4" />
                    <span className="font-medium text-green-600 w-6">A.</span>
                    <Input placeholder="Option A" value={mcqOptionA} onChange={e => setMcqOptionA(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={mcqCorrect === 1} onChange={() => setMcqCorrect(1)} className="w-4 h-4" />
                    <span className="font-medium text-green-600 w-6">B.</span>
                    <Input placeholder="Option B" value={mcqOptionB} onChange={e => setMcqOptionB(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={mcqCorrect === 2} onChange={() => setMcqCorrect(2)} className="w-4 h-4" />
                    <span className="font-medium text-green-600 w-6">C.</span>
                    <Input placeholder="Option C" value={mcqOptionC} onChange={e => setMcqOptionC(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={mcqCorrect === 3} onChange={() => setMcqCorrect(3)} className="w-4 h-4" />
                    <span className="font-medium text-green-600 w-6">D.</span>
                    <Input placeholder="Option D" value={mcqOptionD} onChange={e => setMcqOptionD(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={mcqCategory} onValueChange={(v) => setMcqCategory(v)}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddMCQ}><Plus className="h-4 w-4 mr-1" /> Add Question</Button>
                </div>
              </div>

              {/* Questions grouped by Category */}
              <div className="space-y-2">
                {filteredCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No categories yet. Add a category first.</p>
                )}
                {filteredCategories.map(category => {
                  const categoryQuestions = getQuestionsByCategory(category.id)
                  const isExpanded = expandedCategories.includes(category.id)
                  
                  return (
                    <div key={category.id} className="border rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <div 
                        className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="font-medium">{category.name}</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {categoryQuestions.length} questions
                          </span>
                        </div>
                      </div>
                      
                      {/* Questions List */}
                      {isExpanded && (
                        <div className="divide-y">
                          {categoryQuestions.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-3">No questions in this category</p>
                          ) : (
                            categoryQuestions.map((q, idx) => (
                              <div key={q.id} className="p-3 hover:bg-muted/30">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{idx + 1}. {q.question}</p>
                                    <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                                      {q.options.map((opt, i) => (
                                        <span key={i} className={i === q.correctIndex ? 'text-green-600 font-medium' : ''}>
                                          {String.fromCharCode(65 + i)}. {opt} {i === q.correctIndex && '✓'}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <button onClick={() => handleDeleteQuestion(q.id, q.question)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Fullscreen Note Modal */}
      {fullscreenNote && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">{fullscreenNote.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setFullscreenNote(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div 
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: fullscreenNote.content }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Note</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditingNote(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Input 
                placeholder="Title" 
                value={editingNote.title} 
                onChange={e => setEditingNote({ ...editingNote, title: e.target.value })} 
              />
              <Select value={editingNote.categoryId} onValueChange={(v) => setEditingNote({ ...editingNote, categoryId: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {allCategoriesFlat.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="border rounded-md overflow-hidden" style={{ minHeight: '300px' }}>
                <ReactQuill 
                  theme="snow"
                  value={editingNote.content}
                  onChange={(content) => setEditingNote({ ...editingNote, content })}
                  modules={quillModules}
                  style={{ height: '300px', maxHeight: '400px', overflow: 'auto' }}
                />
              </div>
            </div>
            <div className="p-4 border-t mt-12">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingNote(null)}>Cancel</Button>
                <Button onClick={handleUpdateNote}>Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonalDashboard
