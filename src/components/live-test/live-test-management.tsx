import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Calendar,
  Clock,
  RefreshCw,
  X,
  Trash2,
  Play,
  Check,
  CheckCircle2,
  Brain,
  Library,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResultAnalysisSettings } from './result-analysis-settings'

// ==================== TYPES ====================

export interface LiveTestConfig {
  id: string
  title: string
  duration: number
  questionCount: number
  showSolution: boolean
  status: 'scheduled' | 'active' | 'completed'
  createdAt: number
  startTime?: number
  endTime?: number
  startDate?: string
  startTimeStr?: string
  endDate?: string
  endTimeStr?: string
  categoryIds: string[]
  source?: 'course' | 'library'
  librarySubjectId?: string
  libraryTopicId?: string
  librarySubtopicId?: string
  autoReleaseResult?: boolean
  showLeaderboard?: boolean
  shuffleQuestions?: boolean
  difficulty?: 'all' | 'easy' | 'medium' | 'hard'
}

export interface AutoTestConfig {
  id: string
  enabled: boolean
  title: string
  categoryIds: string[]
  startTime: string
  endTime: string
  duration: number
  questionCount: number
  activeDays: number[]
  autoReleaseResult?: boolean
  showSolution: boolean
  showLeaderboard: boolean
  resultReleaseTime: string
  showDetailedAnalysis: boolean
  source?: 'course' | 'library'
  librarySubjectId?: string
  libraryTopicId?: string
  librarySubtopicId?: string
  difficulty?: 'all' | 'easy' | 'medium' | 'hard'
  createdAt: number
  updatedAt: number
}

export interface CategoryOption {
  id: string
  name: string
  questionCount?: number
}

export interface LiveTestManagementProps {
  context: 'personal' | 'group' | 'coaching'
  contextId?: string
  categories: CategoryOption[]
  scheduledTests: LiveTestConfig[]
  activeTests?: LiveTestConfig[]
  pastTests?: LiveTestConfig[]
  autoTestConfig?: AutoTestConfig | null
  totalMCQCount?: number
  onCreateTest: (test: Omit<LiveTestConfig, 'id' | 'createdAt'>) => void
  onDeleteTest: (testId: string) => void
  onStartTest?: (test: LiveTestConfig) => void
  onSaveAutoConfig: (config: Omit<AutoTestConfig, 'id' | 'createdAt' | 'updatedAt'>) => void
  showSourceSelector?: boolean
  showDateTimeScheduling?: boolean
  isAdmin?: boolean
  assetSubjects?: { id: string; name: string }[]
  getTopicsForSubject?: (subjectId: string) => { id: string; name: string }[]
  getSubtopicsForTopic?: (topicId: string) => { id: string; name: string }[]
  getLibraryMCQCount?: (subjectId: string, topicId?: string, subtopicId?: string) => number
}

// ==================== COMPONENT ====================

export function LiveTestManagement({
  context,
  categories,
  scheduledTests,
  activeTests = [],
  pastTests = [],
  autoTestConfig,
  totalMCQCount = 0,
  onCreateTest,
  onDeleteTest,
  onSaveAutoConfig,
  showSourceSelector = false,
  showDateTimeScheduling = true,
  isAdmin = true,
  assetSubjects = [],
  getTopicsForSubject,
  getSubtopicsForTopic,
  getLibraryMCQCount,
}: LiveTestManagementProps) {
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'auto'>('schedule')
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Schedule Form
  const [newTitle, setNewTitle] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [newDuration, setNewDuration] = useState('30')
  const [newQuestionCount, setNewQuestionCount] = useState('20')
  const [newCategories, setNewCategories] = useState<string[]>([])
  const [newShowSolution, setNewShowSolution] = useState(true)
  const [newAutoRelease, setNewAutoRelease] = useState(true)
  const [newShowLeaderboard, setNewShowLeaderboard] = useState(true)
  const [newShuffleQuestions, setNewShuffleQuestions] = useState(true)
  const [newSource, setNewSource] = useState<'course' | 'library'>('course')
  const [newLibrarySubject, setNewLibrarySubject] = useState('')
  const [newLibraryTopic, setNewLibraryTopic] = useState('')
  const [newLibrarySubtopic, setNewLibrarySubtopic] = useState('')
  const [newDifficulty, setNewDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  
  // Auto Test Form
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [autoTitle, setAutoTitle] = useState('Daily Practice Test')
  const [autoCategories, setAutoCategories] = useState<string[]>([])
  const [autoStartTime, setAutoStartTime] = useState('10:00')
  const [autoEndTime, setAutoEndTime] = useState('22:00')
  const [autoDuration, setAutoDuration] = useState('30')
  const [autoQuestionCount, setAutoQuestionCount] = useState('20')
  const [autoDays, setAutoDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [autoShowSolution, setAutoShowSolution] = useState(true)
  const [autoAutoRelease, setAutoAutoRelease] = useState(true)
  const [autoShowLeaderboard, setAutoShowLeaderboard] = useState(true)
  const [autoResultReleaseTime, setAutoResultReleaseTime] = useState('23:00')
  const [autoShowDetailedAnalysis, setAutoShowDetailedAnalysis] = useState(true)
  const [autoSource, setAutoSource] = useState<'course' | 'library'>('course')
  const [autoLibrarySubject, setAutoLibrarySubject] = useState('')
  const [autoLibraryTopic, setAutoLibraryTopic] = useState('')
  const [autoLibrarySubtopic, setAutoLibrarySubtopic] = useState('')
  const [autoDifficulty, setAutoDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')

  useEffect(() => {
    if (autoTestConfig) {
      setAutoEnabled(autoTestConfig.enabled)
      setAutoTitle(autoTestConfig.title)
      setAutoCategories(autoTestConfig.categoryIds)
      setAutoStartTime(autoTestConfig.startTime)
      setAutoEndTime(autoTestConfig.endTime)
      setAutoDuration(String(autoTestConfig.duration))
      setAutoQuestionCount(String(autoTestConfig.questionCount))
      setAutoDays(autoTestConfig.activeDays)
      setAutoShowSolution(autoTestConfig.showSolution)
      setAutoAutoRelease(autoTestConfig.autoReleaseResult ?? true)
      setAutoShowLeaderboard(autoTestConfig.showLeaderboard)
      setAutoResultReleaseTime(autoTestConfig.resultReleaseTime || '23:00')
      setAutoShowDetailedAnalysis(autoTestConfig.showDetailedAnalysis ?? true)
      setAutoDifficulty(autoTestConfig.difficulty || 'all')
    }
  }, [autoTestConfig])

  const libraryTopics = useMemo(() => {
    if (!getTopicsForSubject || !newLibrarySubject) return []
    return getTopicsForSubject(newLibrarySubject)
  }, [newLibrarySubject, getTopicsForSubject])

  const librarySubtopics = useMemo(() => {
    if (!getSubtopicsForTopic || !newLibraryTopic) return []
    return getSubtopicsForTopic(newLibraryTopic)
  }, [newLibraryTopic, getSubtopicsForTopic])

  // Auto Daily Library selections
  const autoLibraryTopics = useMemo(() => {
    if (!getTopicsForSubject || !autoLibrarySubject) return []
    return getTopicsForSubject(autoLibrarySubject)
  }, [autoLibrarySubject, getTopicsForSubject])

  const autoLibrarySubtopics = useMemo(() => {
    if (!getSubtopicsForTopic || !autoLibraryTopic) return []
    return getSubtopicsForTopic(autoLibraryTopic)
  }, [autoLibraryTopic, getSubtopicsForTopic])

  const autoLibraryMCQCount = useMemo(() => {
    if (!getLibraryMCQCount || !autoLibrarySubject) return 0
    return getLibraryMCQCount(autoLibrarySubject, autoLibraryTopic, autoLibrarySubtopic)
  }, [autoLibrarySubject, autoLibraryTopic, autoLibrarySubtopic, getLibraryMCQCount])

  const libraryMCQCount = useMemo(() => {
    if (!getLibraryMCQCount || !newLibrarySubject) return 0
    return getLibraryMCQCount(newLibrarySubject, newLibraryTopic, newLibrarySubtopic)
  }, [newLibrarySubject, newLibraryTopic, newLibrarySubtopic, getLibraryMCQCount])

  const availableMCQCount = useMemo(() => {
    if (newSource === 'library') return libraryMCQCount
    if (newCategories.length === 0) {
      return totalMCQCount || categories.reduce((sum, c) => sum + (c.questionCount || 0), 0)
    }
    return categories
      .filter(c => newCategories.includes(c.id))
      .reduce((sum, c) => sum + (c.questionCount || 0), 0)
  }, [categories, newCategories, newSource, libraryMCQCount, totalMCQCount])

  const resetForm = () => {
    setNewTitle('')
    setNewStartDate('')
    setNewStartTime('')
    setNewEndDate('')
    setNewEndTime('')
    setNewDuration('30')
    setNewQuestionCount('20')
    setNewCategories([])
    setNewShowSolution(true)
    setNewAutoRelease(true)
    setNewShowLeaderboard(true)
    setNewShuffleQuestions(true)
    setNewSource('course')
    setNewLibrarySubject('')
    setNewLibraryTopic('')
    setNewLibrarySubtopic('')
    setShowCreateForm(false)
  }

  const handleCreateTest = () => {
    if (!newTitle.trim()) {
      alert('Please enter a title')
      return
    }
    
    let startTimestamp: number | undefined
    let endTimestamp: number | undefined
    
    if (showDateTimeScheduling) {
      if (!newStartDate || !newStartTime || !newEndDate || !newEndTime) {
        alert('Please fill all date/time fields')
        return
      }
      startTimestamp = new Date(`${newStartDate}T${newStartTime}`).getTime()
      endTimestamp = new Date(`${newEndDate}T${newEndTime}`).getTime()
      
      if (endTimestamp <= startTimestamp) {
        alert('End time must be after start time')
        return
      }
    }
    
    onCreateTest({
      title: newTitle.trim(),
      duration: parseInt(newDuration),
      questionCount: parseInt(newQuestionCount),
      showSolution: true, // Always true - results show after end time
      status: 'scheduled',
      categoryIds: newCategories,
      source: showSourceSelector ? newSource : 'course',
      librarySubjectId: newSource === 'library' ? newLibrarySubject : undefined,
      libraryTopicId: newSource === 'library' ? newLibraryTopic : undefined,
      librarySubtopicId: newSource === 'library' ? newLibrarySubtopic : undefined,
      startTime: startTimestamp,
      endTime: endTimestamp,
      startDate: newStartDate,
      startTimeStr: newStartTime,
      endDate: newEndDate,
      endTimeStr: newEndTime,
      autoReleaseResult: true, // Always true - results auto-release at end time
      showLeaderboard: newShowLeaderboard,
      shuffleQuestions: newShuffleQuestions,
      difficulty: newDifficulty,
    })
    
    resetForm()
  }

  const handleSaveAutoConfig = () => {
    onSaveAutoConfig({
      enabled: autoEnabled,
      title: autoTitle,
      categoryIds: autoCategories,
      startTime: autoStartTime,
      endTime: autoEndTime,
      duration: parseInt(autoDuration),
      questionCount: parseInt(autoQuestionCount),
      activeDays: autoDays,
      showSolution: true, // Always true - results show after end time
      autoReleaseResult: true, // Always true - results auto-release at end time
      showLeaderboard: autoShowLeaderboard,
      resultReleaseTime: autoEndTime, // End time = Result release time
      showDetailedAnalysis: true, // Always true
      source: showSourceSelector ? autoSource : 'course',
      librarySubjectId: autoSource === 'library' ? autoLibrarySubject : undefined,
      libraryTopicId: autoSource === 'library' ? autoLibraryTopic : undefined,
      librarySubtopicId: autoSource === 'library' ? autoLibrarySubtopic : undefined,
      difficulty: autoDifficulty,
    })
  }

  const dayNamesBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']

  if (!isAdmin) return null

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'schedule' ? 'bg-background shadow' : 'hover:bg-background/50'
          }`}
        >
          <Calendar className="h-4 w-4" /> Schedule
        </button>
        <button
          onClick={() => setActiveTab('auto')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'auto' ? 'bg-background shadow' : 'hover:bg-background/50'
          }`}
        >
          <RefreshCw className="h-4 w-4" /> Auto Daily
          {autoEnabled && <span className="w-2 h-2 bg-green-500 rounded-full" />}
        </button>
      </div>

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {showCreateForm ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border rounded-lg bg-muted/30 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Create New Live Test</h4>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <label className="text-sm font-medium">Test Title *</label>
                <Input 
                  placeholder="e.g., Weekly Quiz #1"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>

              {showSourceSelector && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Question Source</label>
                  <div className="flex gap-2">
                    <Button
                      variant={newSource === 'library' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewSource('library')}
                      className="flex-1"
                    >
                      <Library className="h-4 w-4 mr-2" /> Asset Library
                    </Button>
                    <Button
                      variant={newSource === 'course' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewSource('course')}
                      className="flex-1"
                    >
                      <Brain className="h-4 w-4 mr-2" /> {context === 'group' ? 'Group MCQs' : 'Course MCQs'}
                    </Button>
                  </div>
                </div>
              )}

              {showSourceSelector && newSource === 'library' && (
                <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div>
                    <label className="text-sm font-medium">Subject *</label>
                    <Select 
                      value={newLibrarySubject} 
                      onValueChange={(v) => {
                        setNewLibrarySubject(v)
                        setNewLibraryTopic('')
                        setNewLibrarySubtopic('')
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                      <SelectContent>
                        {assetSubjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newLibrarySubject && libraryTopics.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Topic (optional)</label>
                      <Select 
                        value={newLibraryTopic || 'all'} 
                        onValueChange={(v) => {
                          setNewLibraryTopic(v === 'all' ? '' : v)
                          setNewLibrarySubtopic('')
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="All Topics" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Topics</SelectItem>
                          {libraryTopics.map(topic => (
                            <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {newLibraryTopic && librarySubtopics.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Sub-topic (optional)</label>
                      <Select value={newLibrarySubtopic || 'all'} onValueChange={(v) => setNewLibrarySubtopic(v === 'all' ? '' : v)}>
                        <SelectTrigger><SelectValue placeholder="All Sub-topics" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sub-topics</SelectItem>
                          {librarySubtopics.map(st => (
                            <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground bg-background p-2 rounded">
                    📊 Available: <strong>{libraryMCQCount}</strong> MCQs
                  </div>
                </div>
              )}

              {(!showSourceSelector || newSource !== 'library') && categories.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Categories (optional)</label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    <label className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCategories.length === 0}
                        onChange={() => setNewCategories([])}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">All ({availableMCQCount} MCQs)</span>
                    </label>
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCategories.includes(cat.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewCategories([...newCategories, cat.id])
                            } else {
                              setNewCategories(newCategories.filter(id => id !== cat.id))
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{cat.name} ({cat.questionCount || 0})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showDateTimeScheduling && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Start Date *</label>
                      <Input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Start Time *</label>
                      <Input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">End Date *</label>
                      <Input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Time *</label>
                      <Input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <Select value={newDuration} onValueChange={setNewDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Questions</label>
                  <Select value={newQuestionCount} onValueChange={setNewQuestionCount}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                {/* Difficulty Level Selector */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Difficulty Level</span>
                  <Select value={newDifficulty} onValueChange={(v) => setNewDifficulty(v as any)}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🎯 All</SelectItem>
                      <SelectItem value="easy">🟢 Easy</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="hard">🔴 Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shuffle Questions</span>
                  <input type="checkbox" checked={newShuffleQuestions} onChange={e => setNewShuffleQuestions(e.target.checked)} className="h-4 w-4" />
                </div>
                {(context === 'group' || context === 'coaching') && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Leaderboard</span>
                    <input type="checkbox" checked={newShowLeaderboard} onChange={e => setNewShowLeaderboard(e.target.checked)} className="h-4 w-4" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  📌 Result & Solutions will be available after test ends
                </p>
              </div>
              
              <Button onClick={handleCreateTest} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Create Live Test
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <Button onClick={() => setShowCreateForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Schedule New Live Test
              </Button>
              
              {activeTests.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                    <Play className="h-4 w-4" /> Active Now
                  </h4>
                  {activeTests.map(test => (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20">
                      <div>
                        <p className="font-medium">{test.title}</p>
                        <p className="text-xs text-muted-foreground">{test.questionCount} questions • {test.duration} min</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-green-500 text-white animate-pulse">LIVE</span>
                    </div>
                  ))}
                </div>
              )}
              
              {scheduledTests.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Upcoming
                  </h4>
                  {scheduledTests.map(test => (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{test.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {test.questionCount} questions • {test.duration} min
                          {test.startTime && <> • {new Date(test.startTime).toLocaleDateString('bn-BD')}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Scheduled</span>
                        <Button variant="ghost" size="sm" onClick={() => onDeleteTest(test.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No scheduled tests. Create one above!</p>
              )}
              
              {pastTests.length > 0 && (
                <details className="group">
                  <summary className="text-sm font-medium text-muted-foreground cursor-pointer flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Past Tests ({pastTests.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {pastTests.slice(0, 5).map(test => (
                      <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg opacity-70">
                        <div>
                          <p className="font-medium">{test.title}</p>
                          <p className="text-xs text-muted-foreground">{test.questionCount} questions • Completed</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Done</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* AUTO DAILY TAB */}
      {activeTab === 'auto' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div>
              <h4 className="font-medium">Enable Auto Daily Test</h4>
              <p className="text-sm text-muted-foreground">Automatically create a new test every day</p>
            </div>
            <input type="checkbox" checked={autoEnabled} onChange={e => setAutoEnabled(e.target.checked)} className="h-5 w-5" />
          </div>
          
          {autoEnabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Title</label>
                <Input value={autoTitle} onChange={e => setAutoTitle(e.target.value)} placeholder="Daily Practice Test" />
              </div>
              
              {showSourceSelector && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Question Source</label>
                  <div className="flex gap-2">
                    <Button variant={autoSource === 'library' ? 'default' : 'outline'} size="sm" onClick={() => setAutoSource('library')} className="flex-1">
                      <Library className="h-4 w-4 mr-2" /> Asset Library
                    </Button>
                    <Button variant={autoSource === 'course' ? 'default' : 'outline'} size="sm" onClick={() => setAutoSource('course')} className="flex-1">
                      <Brain className="h-4 w-4 mr-2" /> {context === 'group' ? 'Group' : 'Course'}
                    </Button>
                  </div>
                </div>
              )}

              {showSourceSelector && autoSource === 'library' && (
                <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div>
                    <label className="text-sm font-medium">Subject *</label>
                    <Select 
                      value={autoLibrarySubject} 
                      onValueChange={(v) => {
                        setAutoLibrarySubject(v)
                        setAutoLibraryTopic('')
                        setAutoLibrarySubtopic('')
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                      <SelectContent>
                        {assetSubjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {autoLibrarySubject && autoLibraryTopics.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Topic (optional)</label>
                      <Select 
                        value={autoLibraryTopic || 'all'} 
                        onValueChange={(v) => {
                          setAutoLibraryTopic(v === 'all' ? '' : v)
                          setAutoLibrarySubtopic('')
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="All Topics" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Topics</SelectItem>
                          {autoLibraryTopics.map(topic => (
                            <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {autoLibraryTopic && autoLibrarySubtopics.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Sub-topic (optional)</label>
                      <Select value={autoLibrarySubtopic || 'all'} onValueChange={(v) => setAutoLibrarySubtopic(v === 'all' ? '' : v)}>
                        <SelectTrigger><SelectValue placeholder="All Sub-topics" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sub-topics</SelectItem>
                          {autoLibrarySubtopics.map(st => (
                            <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground bg-background p-2 rounded">
                    📊 Available: <strong>{autoLibraryMCQCount}</strong> MCQs
                  </div>
                </div>
              )}
              
              {(!showSourceSelector || autoSource !== 'library') && categories.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Categories</label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    <label className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                      <input type="checkbox" checked={autoCategories.length === 0} onChange={() => setAutoCategories([])} className="h-4 w-4" />
                      <span className="text-sm font-medium">All Categories</span>
                    </label>
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoCategories.includes(cat.id)}
                          onChange={e => {
                            if (e.target.checked) setAutoCategories([...autoCategories, cat.id])
                            else setAutoCategories(autoCategories.filter(id => id !== cat.id))
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{cat.name} ({cat.questionCount || 0})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input type="time" value={autoStartTime} onChange={e => setAutoStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input type="time" value={autoEndTime} onChange={e => setAutoEndTime(e.target.value)} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <Select value={autoDuration} onValueChange={setAutoDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Questions</label>
                  <Select value={autoQuestionCount} onValueChange={setAutoQuestionCount}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Active Days</label>
                <div className="flex flex-wrap gap-2">
                  {dayNamesBn.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (autoDays.includes(idx)) setAutoDays(autoDays.filter(d => d !== idx))
                        else setAutoDays([...autoDays, idx])
                      }}
                      className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                        autoDays.includes(idx) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                {/* Difficulty Level Selector */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Difficulty Level</span>
                  <Select value={autoDifficulty} onValueChange={(v) => setAutoDifficulty(v as any)}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🎯 All</SelectItem>
                      <SelectItem value="easy">🟢 Easy</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="hard">🔴 Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(context === 'group' || context === 'coaching') && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Leaderboard</span>
                    <input type="checkbox" checked={autoShowLeaderboard} onChange={e => setAutoShowLeaderboard(e.target.checked)} className="h-4 w-4" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  📌 Result & Solutions available after daily end time ({autoEndTime})
                </p>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Auto test runs daily from {autoStartTime} to {autoEndTime}</span>
              </div>
            </motion.div>
          )}
          
          {!autoEnabled && (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Auto daily test is disabled</p>
              <p className="text-xs mt-1">Enable to automatically create practice tests</p>
            </div>
          )}
          
          <Button onClick={handleSaveAutoConfig} className="w-full">
            <Check className="h-4 w-4 mr-2" /> Save Auto Test Settings
          </Button>
          
          {autoTestConfig?.enabled && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">✓ Auto Test Active</p>
              <p className="text-xs text-muted-foreground mt-1">Runs daily from {autoTestConfig.startTime} to {autoTestConfig.endTime}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
