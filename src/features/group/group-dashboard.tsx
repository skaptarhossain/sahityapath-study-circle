import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import { sanitizeHtml, smartSanitize } from '@/lib/html-sanitizer'
import {
  Users,
  Plus,
  Settings,
  Crown,
  Copy,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Trash2,
  UserPlus,
  Sparkles,
  BookOpen,
  Brain,
  FolderPlus,
  Play,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  GripVertical,
  X,
  Heading,
  Type,
  Link,
  Clock,
  Video,
  Upload,
  Download,
  Package,
  Code,
  Pencil,
  AlertTriangle,
  Check,
  XCircle,
  Vote,
  Bell,
  Shuffle,
  Trophy,
  Target,
  BarChart3,
  Eye,
  History,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle2,
  CircleDot,
  RefreshCw,
  ChevronLeft,
  Library,
  Grid3X3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ResultAnalysisSettings, LiveTestManagement, type LiveTestConfig, type AutoTestConfig } from '@/components/live-test'
import { useGroupStore } from '@/stores/group-store'
import { useAuthStore } from '@/stores/auth-store'
import { useLibraryStore } from '@/stores/library-store'
import { useAssetStore } from '@/stores/asset-store'
import { storage, db } from '@/config/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, setDoc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import type { Group, GroupTopic, GroupSubTopic, GroupContentItem, GroupMCQ, DeleteRequest, GroupQuestionCategory, GroupQuizResult, LiveTest, LiveTestResult, LibraryContentPack } from '@/types'
import { GroupQuizRunner } from './group-quiz-runner'
import { ReportDialog } from './report-dialog'
import { syncGroupToLibrary } from '@/lib/asset-sync'
import type { GroupSubTab } from '@/components/layout/main-layout'

interface GroupDashboardProps {
  activeSubTab: GroupSubTab
  setActiveSubTab: (tab: GroupSubTab) => void
}

export function GroupDashboard({ activeSubTab, setActiveSubTab }: GroupDashboardProps) {
  const user = useAuthStore(s => s.user)
  const { 
    myGroups,
    setMyGroups,
    activeGroupId, 
    setActiveGroup, 
    addGroup, 
    removeGroup,
    updateGroup,
    topics,
    subTopics,
    contentItems,
    groupMCQs,
    questionCategories,
    addTopic,
    removeTopic,
    updateTopic,
    addSubTopic,
    removeSubTopic,
    updateSubTopic,
    assignSubTopic,
    addContentItem,
    updateContentItem,
    removeContentItem,
    addGroupMCQ,
    updateGroupMCQ,
    removeGroupMCQ,
    addQuestionCategory,
    removeQuestionCategory,
    createDeleteRequest,
    voteOnDeleteRequest,
    resolveDeleteRequest,
    deleteRequests,
    getTopicsByGroup,
    getMCQsByCategory,
    getCategoriesByGroup,
    getSubTopicsByTopic,
    getContentBySubTopic,
    getMCQsByGroup,
    getLatestNotes,
    getReportsByCreator,
    resolveContentReport,
    findGroupByCode,
    getQuizResultsByUser,
    getLeaderboard,
    getUserQuizHistory,
    quizResults,
    liveTests,
    liveTestResults,
    addLiveTest,
    updateLiveTest,
    removeLiveTest,
    getLiveTestsByGroup,
    getUpcomingLiveTests,
    getActiveLiveTest,
    getPastLiveTests,
    addLiveTestResult,
    updateLiveTestResult,
    getLiveTestResultsByTest,
    getUserLiveTestResult,
    getLiveTestLeaderboard,
    setAutoLiveTestConfig,
    getAutoLiveTestConfig,
    loadGroupFromFirebase,
    subscribeToGroup,
  } = useGroupStore()

  // UI States
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [expandedTopics, setExpandedTopics] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)  // Display vs Edit mode
  const [viewingContent, setViewingContent] = useState<GroupContentItem | null>(null)  // For viewing content in display mode
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  
  // Adding content state
  const [addingItemToTopic, setAddingItemToTopic] = useState<string | null>(null)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [addingToTopicId, setAddingToTopicId] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [newItemType, setNewItemType] = useState<'note' | 'quiz' | 'heading' | 'text' | 'link'>('note')
  const [addContentMode, setAddContentMode] = useState<'choose' | 'manual' | 'library'>('choose')
  
  // Secondary modal for item details
  const [showItemDetailModal, setShowItemDetailModal] = useState(false)
  const [itemDetailTitle, setItemDetailTitle] = useState('')
  const [itemDetailContent, setItemDetailContent] = useState('')
  const [itemDetailUrl, setItemDetailUrl] = useState('')
  const [quizTimeLimit, setQuizTimeLimit] = useState('')
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  
  // Content editing
  const [editingContent, setEditingContent] = useState<GroupContentItem | null>(null)
  const [editContent, setEditContent] = useState('')
  
  // MCQ form
  const [mcqQuestion, setMcqQuestion] = useState('')
  const [mcqOptions, setMcqOptions] = useState(['', '', '', ''])
  const [mcqCorrect, setMcqCorrect] = useState(0)
  const [addingMCQTo, setAddingMCQTo] = useState<string | null>(null)
  
  // MCQ Edit state
  const [editingMcq, setEditingMcq] = useState<GroupMCQ | null>(null)
  const [editMcqQuestion, setEditMcqQuestion] = useState('')
  const [editMcqOptions, setEditMcqOptions] = useState(['', '', '', ''])
  const [editMcqCorrectIndex, setEditMcqCorrectIndex] = useState(0)
  const [editMcqExplanation, setEditMcqExplanation] = useState('')
  
  // Live Test Tab state
  const [liveTestTab, setLiveTestTab] = useState<'upcoming' | 'active' | 'past' | 'results'>('upcoming')
  const [selectedLiveTest, setSelectedLiveTest] = useState<LiveTest | null>(null)
  const [viewingLiveTestResult, setViewingLiveTestResult] = useState<LiveTestResult | null>(null)
  const [viewingLiveTestSolutions, setViewingLiveTestSolutions] = useState(false)
  
  // Live Test Running state
  const [runningLiveTest, setRunningLiveTest] = useState<LiveTest | null>(null)
  const [liveTestQuestions, setLiveTestQuestions] = useState<GroupMCQ[]>([])
  const [liveTestCurrentQ, setLiveTestCurrentQ] = useState(0)
  const [liveTestAnswers, setLiveTestAnswers] = useState<Record<string, number>>({})
  const [liveTestStartedAt, setLiveTestStartedAt] = useState<number>(0)
  const [showQuestionNav, setShowQuestionNav] = useState(false)
  
  // Create Live Test form (in Settings)
  const [showCreateLiveTest, setShowCreateLiveTest] = useState(false)
  const [newLiveTestTitle, setNewLiveTestTitle] = useState('')
  const [newLiveTestStartDate, setNewLiveTestStartDate] = useState('')
  const [newLiveTestStartTime, setNewLiveTestStartTime] = useState('')
  const [newLiveTestEndDate, setNewLiveTestEndDate] = useState('')
  const [newLiveTestEndTime, setNewLiveTestEndTime] = useState('')
  const [newLiveTestDuration, setNewLiveTestDuration] = useState('30')
  const [newLiveTestMode, setNewLiveTestMode] = useState<'auto' | 'manual'>('auto')
  const [newLiveTestCategories, setNewLiveTestCategories] = useState<string[]>([])
  const [newLiveTestQuestionCount, setNewLiveTestQuestionCount] = useState('20')
  const [newLiveTestAutoRelease, setNewLiveTestAutoRelease] = useState(true)
  const [newLiveTestShowSolution, setNewLiveTestShowSolution] = useState(true)
  const [newLiveTestShowLeaderboard, setNewLiveTestShowLeaderboard] = useState(true)
  
  // Auto Daily Test states
  const [liveTestMgmtTab, setLiveTestMgmtTab] = useState<'schedule' | 'auto'>('schedule')
  const [autoTestEnabled, setAutoTestEnabled] = useState(false)
  const [autoTestTitle, setAutoTestTitle] = useState('Daily Practice Test')
  const [autoTestCategories, setAutoTestCategories] = useState<string[]>([])
  const [autoTestStartTime, setAutoTestStartTime] = useState('10:00')
  const [autoTestEndTime, setAutoTestEndTime] = useState('22:00')
  const [autoTestDuration, setAutoTestDuration] = useState('30')
  const [autoTestQuestionCount, setAutoTestQuestionCount] = useState('20')
  const [autoTestDays, setAutoTestDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [autoTestAutoRelease, setAutoTestAutoRelease] = useState(true)
  const [autoTestShowSolution, setAutoTestShowSolution] = useState(true)
  const [autoTestShowLeaderboard, setAutoTestShowLeaderboard] = useState(true)
  // Result Analysis Settings
  const [autoTestResultReleaseTime, setAutoTestResultReleaseTime] = useState('23:00')
  const [autoTestShowDetailedAnalysis, setAutoTestShowDetailedAnalysis] = useState(true)
  
  // Question Bank Tab state
  const [questionBankTab, setQuestionBankTab] = useState<'single' | 'group' | 'instant'>('single')
  
  // Group Upload states
  const [groupUploadFile, setGroupUploadFile] = useState<File | null>(null)
  const [groupUploadParsedQuestions, setGroupUploadParsedQuestions] = useState<Array<{
    question: string
    options: string[]
    correctIndex: number
    explanation?: string
    difficulty?: 'easy' | 'medium' | 'hard'
  }>>([])
  const [groupUploadCategory, setGroupUploadCategory] = useState('')
  const [groupUploadLoading, setGroupUploadLoading] = useState(false)
  const [groupUploadError, setGroupUploadError] = useState('')
  
  // Library (Instant Download) states
  const [librarySelectedPack, setLibrarySelectedPack] = useState<LibraryContentPack | null>(null)
  const [libraryDownloadCategory, setLibraryDownloadCategory] = useState('')
  const [libraryDownloadMode, setLibraryDownloadMode] = useState<'new' | 'merge'>('new')
  const [libraryNewCategoryName, setLibraryNewCategoryName] = useState('')
  
  // Asset Library Import states
  const [showImportFromLibrary, setShowImportFromLibrary] = useState(false)
  const [importAssetType, setImportAssetType] = useState<'mcq' | 'note' | 'url' | 'pdf' | 'video' | 'all'>('all')
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [importTargetTopicId, setImportTargetTopicId] = useState<string | null>(null)
  
  // Asset store
  const {
    subjects: assetSubjects,
    topics: assetTopics,
    assets: allAssets,
    selectedSubjectId: assetSelectedSubject,
    selectedTopicId: assetSelectedTopic,
    setSelectedSubject: setAssetSelectedSubject,
    setSelectedTopic: setAssetSelectedTopic,
    getTopicsBySubject: getAssetTopicsBySubject,
    getSubtopicsByTopic: getAssetSubtopicsByTopic,
  } = useAssetStore()
  
  // Library store
  const {
    subjects: librarySubjects,
    topics: libraryTopics,
    contentPacks: libraryPacks,
    mcqs: libraryMcqs,
    notes: libraryNotes,
    selectedSubjectId: librarySubjectId,
    selectedTopicId: libraryTopicId,
    filterPricing: libraryFilterPricing,
    setSelectedSubject: setLibrarySubject,
    setSelectedTopic: setLibraryTopic,
    setFilterPricing: setLibraryFilterPricing,
    getTopicsBySubject: getLibraryTopicsBySubject,
    getPacksBySubject: getLibraryPacksBySubject,
    getPacksByTopic: getLibraryPacksByTopic,
    getMcqsByPack: getLibraryMcqsByPack,
    getNotesByPack: getLibraryNotesByPack,
    addDownload: addLibraryDownload,
    hasDownloaded: hasLibraryDownloaded,
    initSampleData: initLibrarySampleData,
  } = useLibraryStore()
  
  // Quiz Runner state (new - with result, leaderboard, etc.)
  const [runningQuiz, setRunningQuiz] = useState<{ item: GroupContentItem; questions: GroupMCQ[]; timeLimit: number | null } | null>(null)
  
  // Source code toggle for editors
  const [showSourceCode, setShowSourceCode] = useState(false)
  const [showEditSourceCode, setShowEditSourceCode] = useState(false)
  
  // Delete requests modal
  const [showDeleteRequests, setShowDeleteRequests] = useState(false)
  
  // Assign members modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningTopicId, setAssigningTopicId] = useState<string | null>(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  
  // Question Bank states
  const [newCategoryName, setNewCategoryName] = useState('')
  const [qbQuestion, setQbQuestion] = useState('')
  const [qbOptions, setQbOptions] = useState(['', '', '', ''])
  const [qbCorrect, setQbCorrect] = useState(0)
  const [qbCategoryId, setQbCategoryId] = useState('')
  const [expandedQbCategories, setExpandedQbCategories] = useState<string[]>([])
  
  // Quiz - Question Bank selection
  const [selectedQBQuestions, setSelectedQBQuestions] = useState<string[]>([])  // MCQ ids
  const [showQBSelector, setShowQBSelector] = useState(false)
  const [quizSelectionMode, setQuizSelectionMode] = useState<'manual' | 'auto'>('manual')
  const [autoRandomCategoryId, setAutoRandomCategoryId] = useState('')
  const [autoRandomCount, setAutoRandomCount] = useState('')

  // Quill modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  }

  // Sync group data from Firestore when group is selected
  const syncGroupFromCloud = async (groupId: string) => {
    try {
      // Sync group info
      const groupRef = doc(db, 'groups', groupId)
      const groupSnap = await getDoc(groupRef)
      if (groupSnap.exists()) {
        const cloudGroup = groupSnap.data() as Group
        updateGroup(cloudGroup)
      }
      
      // Get current state to check for duplicates
      const currentTopics = useGroupStore.getState().topics
      const currentContentItems = useGroupStore.getState().contentItems
      const currentMCQs = useGroupStore.getState().groupMCQs
      const currentCategories = useGroupStore.getState().questionCategories
      
      // Sync topics (only add if not exists, otherwise update)
      const topicsQuery = query(collection(db, 'topics'), where('groupId', '==', groupId))
      const topicsSnap = await getDocs(topicsQuery)
      topicsSnap.forEach(docSnap => {
        const cloudTopic = docSnap.data() as GroupTopic
        const exists = currentTopics.find(t => t.id === cloudTopic.id)
        if (exists) {
          updateTopic(cloudTopic)
        } else {
          addTopic(cloudTopic)
        }
      })
      
      // Sync content items (only add if not exists, otherwise update)
      const contentQuery = query(collection(db, 'contentItems'), where('groupId', '==', groupId))
      const contentSnap = await getDocs(contentQuery)
      contentSnap.forEach(docSnap => {
        const cloudItem = docSnap.data() as GroupContentItem
        const exists = currentContentItems.find(ci => ci.id === cloudItem.id)
        if (exists) {
          updateContentItem(cloudItem)
        } else {
          addContentItem(cloudItem)
        }
      })
      
      // Sync MCQs (only add if not exists - no update function available)
      const mcqQuery = query(collection(db, 'mcqs'), where('groupId', '==', groupId))
      const mcqSnap = await getDocs(mcqQuery)
      mcqSnap.forEach(docSnap => {
        const cloudMCQ = docSnap.data() as GroupMCQ
        const exists = currentMCQs.find(m => m.id === cloudMCQ.id)
        if (!exists) {
          addGroupMCQ(cloudMCQ)
        }
      })
      
      // Sync categories (only add if not exists - no update function available)
      const catQuery = query(collection(db, 'categories'), where('groupId', '==', groupId))
      const catSnap = await getDocs(catQuery)
      catSnap.forEach(docSnap => {
        const cloudCat = docSnap.data() as GroupQuestionCategory
        const exists = currentCategories.find(c => c.id === cloudCat.id)
        if (!exists) {
          addQuestionCategory(cloudCat)
        }
      })
      
    } catch (err) {
      console.error('Error syncing from Firestore:', err)
    }
  }

  // Auto-sync when active group changes - use new Firebase sync
  useEffect(() => {
    if (activeGroupId) {
      loadGroupFromFirebase(activeGroupId)
      const unsubscribe = subscribeToGroup(activeGroupId)
      return () => unsubscribe()
    }
  }, [activeGroupId])

  // Load Auto Test config when group changes
  useEffect(() => {
    if (activeGroupId) {
      const config = getAutoLiveTestConfig(activeGroupId)
      if (config) {
        setAutoTestEnabled(config.enabled)
        setAutoTestTitle(config.title)
        setAutoTestCategories(config.categoryIds)
        setAutoTestStartTime(config.startTime)
        setAutoTestEndTime(config.endTime)
        setAutoTestDuration(config.duration.toString())
        setAutoTestQuestionCount(config.questionCount.toString())
        setAutoTestDays(config.activeDays)
        setAutoTestAutoRelease(config.autoReleaseResult)
        setAutoTestShowSolution(config.showSolution)
        setAutoTestShowLeaderboard(config.showLeaderboard)
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
      }
    }
  }, [activeGroupId])

  // Initialize Library Sample Data on first load
  useEffect(() => {
    if (librarySubjects.length === 0) {
      initLibrarySampleData()
    }
  }, [])

  // Load user's groups from Firebase on startup
  useEffect(() => {
    const loadUserGroups = async () => {
      if (!user?.id) return
      
      try {
        // Query groups where user is a member
        const q = query(
          collection(db, 'groups'),
          where('memberIds', 'array-contains', user.id)
        )
        const snapshot = await getDocs(q)
        const groups: Group[] = []
        snapshot.forEach(doc => {
          groups.push({ id: doc.id, ...doc.data() } as Group)
        })
        
        if (groups.length > 0) {
          setMyGroups(groups)
        }
      } catch (err) {
        console.error('Error loading groups from Firebase:', err)
      }
    }
    
    loadUserGroups()
  }, [user?.id])

  // Helper function to convert Google Drive/Docs links to embeddable format
  const convertToEmbedUrl = (url: string): string => {
    // Google Drive file link: https://drive.google.com/file/d/FILE_ID/view
    const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (driveFileMatch) {
      return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`
    }
    
    // Google Drive open link: https://drive.google.com/open?id=FILE_ID
    const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
    if (driveOpenMatch) {
      return `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`
    }
    
    // Google Docs: https://docs.google.com/document/d/DOC_ID/edit
    const docsMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/)
    if (docsMatch) {
      return `https://docs.google.com/document/d/${docsMatch[1]}/preview`
    }
    
    // Google Sheets: https://docs.google.com/spreadsheets/d/SHEET_ID/edit
    const sheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    if (sheetsMatch) {
      return `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/preview`
    }
    
    // Google Slides: https://docs.google.com/presentation/d/PRES_ID/edit
    const slidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/)
    if (slidesMatch) {
      return `https://docs.google.com/presentation/d/${slidesMatch[1]}/embed`
    }
    
    // Return original URL if no conversion needed
    return url
  }

  // Get active group
  const activeGroup = useMemo(() => 
    myGroups.find(g => g.id === activeGroupId), 
    [myGroups, activeGroupId]
  )
  
  const isAdmin = activeGroup?.adminId === user?.id

  // Get group data - directly filter topics for proper reactivity
  const groupTopics = activeGroupId 
    ? topics.filter(t => t.groupId === activeGroupId).sort((a, b) => a.order - b.order)
    : []
  
  const groupMCQList = useMemo(() =>
    activeGroupId ? getMCQsByGroup(activeGroupId) : [],
    [activeGroupId, groupMCQs]
  )
  
  const groupCategories = useMemo(() =>
    activeGroupId ? getCategoriesByGroup(activeGroupId) : [],
    [activeGroupId, questionCategories]
  )
  
  const latestNotes = useMemo(() =>
    activeGroupId ? getLatestNotes(activeGroupId, 5) : [],
    [activeGroupId, contentItems]
  )

  // Pending delete requests for this group
  const pendingDeleteRequests = useMemo(() =>
    activeGroupId 
      ? deleteRequests.filter(r => r.groupId === activeGroupId && r.status === 'pending')
      : [],
    [activeGroupId, deleteRequests]
  )

  // Pending reports for current user (as content creator)
  const pendingReportsForMe = useMemo(() =>
    user ? getReportsByCreator(user.id).filter(r => r.groupId === activeGroupId) : [],
    [user, activeGroupId]
  )

  // Get current user's role in the group
  const getCurrentUserRole = (): 'admin' | 'moderator' | 'member' => {
    if (!activeGroup || !user) return 'member'
    const member = activeGroup.members.find(m => m.userId === user.id)
    return member?.role || 'member'
  }
  
  // Check if user can edit a specific topic
  const canEditTopic = (topic: GroupTopic): boolean => {
    if (!user) return false
    // Admin can always edit
    if (isAdmin) return true
    // Check if user is assigned to this topic
    return topic.assignedMembers?.includes(user.id) || false
  }

  // Create delete request (instead of direct delete)
  const requestDelete = (targetType: 'group' | 'topic' | 'content', targetId: string, targetName: string) => {
    if (!activeGroup || !user) return
    
    const userRole = getCurrentUserRole()
    
    const request: DeleteRequest = {
      id: uuidv4(),
      groupId: activeGroup.id,
      targetType,
      targetId,
      targetName,
      requesterId: user.id,
      requesterName: user.displayName,
      requesterRole: userRole,
      approvedBy: [],
      rejectedBy: [],
      status: 'pending',
      createdAt: Date.now(),
    }
    
    createDeleteRequest(request)
    alert('Delete request created! It will be reviewed.')
  }

  // Check if delete request can be resolved
  const canResolveRequest = (request: DeleteRequest): { canResolve: boolean; approved: boolean } => {
    if (!activeGroup) return { canResolve: false, approved: false }
    
    const totalMembers = activeGroup.members.length
    const requiredVotes = Math.ceil(totalMembers * 0.5)
    
    // If requester is a member, admin approval is enough
    if (request.requesterRole === 'member' || request.requesterRole === 'moderator') {
      const adminApproved = request.approvedBy.some(userId => 
        activeGroup.members.find(m => m.userId === userId && m.role === 'admin')
      )
      if (adminApproved) return { canResolve: true, approved: true }
      
      const adminRejected = request.rejectedBy.some(userId => 
        activeGroup.members.find(m => m.userId === userId && m.role === 'admin')
      )
      if (adminRejected) return { canResolve: true, approved: false }
    }
    
    // If requester is admin, need 50% member approval
    if (request.requesterRole === 'admin') {
      if (request.approvedBy.length >= requiredVotes) return { canResolve: true, approved: true }
      if (request.rejectedBy.length > totalMembers - requiredVotes) return { canResolve: true, approved: false }
    }
    
    return { canResolve: false, approved: false }
  }

  // Execute delete after approval
  const executeDelete = (request: DeleteRequest) => {
    if (request.targetType === 'group') {
      removeGroup(request.targetId)
    } else if (request.targetType === 'topic') {
      removeTopic(request.targetId)
    } else {
      removeContentItem(request.targetId)
    }
    resolveDeleteRequest(request.id, true)
  }

  // Question Bank handlers
  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !activeGroupId) return
    const category: GroupQuestionCategory = {
      id: uuidv4(),
      groupId: activeGroupId,
      name: newCategoryName.trim(),
      createdAt: Date.now(),
    }
    addQuestionCategory(category)
    setNewCategoryName('')
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'categories', category.id), category)
    } catch (err) {
      console.error('Error saving category to Firestore:', err)
    }
  }

  const handleAddQuestion = async () => {
    if (!qbQuestion.trim() || !qbCategoryId || !activeGroupId || !user) return
    if (qbOptions.some(o => !o.trim())) {
      alert('Please fill all options')
      return
    }
    const mcq: GroupMCQ = {
      id: uuidv4(),
      groupId: activeGroupId,
      categoryId: qbCategoryId,
      question: qbQuestion.trim(),
      options: qbOptions.map(o => o.trim()),
      correctIndex: qbCorrect,
      createdBy: user.id,
      createdByName: user.displayName,
      createdAt: Date.now(),
    }
    addGroupMCQ(mcq)
    setQbQuestion('')
    setQbOptions(['', '', '', ''])
    setQbCorrect(0)
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'mcqs', mcq.id), mcq)
    } catch (err) {
      console.error('Error saving MCQ to Firestore:', err)
    }
  }

  // Group Upload - Parse Excel file
  const parseExcelFile = async (file: File) => {
    setGroupUploadLoading(true)
    setGroupUploadError('')
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
      
      // Find header row (first row with data)
      const headerRow = jsonData.find(row => row.some(cell => cell))
      if (!headerRow) {
        setGroupUploadError('Empty file or no header found')
        return
      }
      
      // Parse questions (skip header)
      const questions: Array<{ question: string; options: string[]; correctIndex: number; explanation?: string; difficulty?: 'easy' | 'medium' | 'hard' }> = []
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || !row[0]) continue
        
        // Expected format: Question | Option A | Option B | Option C | Option D | Correct Answer (A/B/C/D or 1/2/3/4) | Explanation | Difficulty
        const question = String(row[0] || '').trim()
        const optionA = String(row[1] || '').trim()
        const optionB = String(row[2] || '').trim()
        const optionC = String(row[3] || '').trim()
        const optionD = String(row[4] || '').trim()
        const correctAnswer = String(row[5] || '').trim().toUpperCase()
        const explanation = row[6] ? String(row[6]).trim() : undefined
        const difficultyRaw = row[7] ? String(row[7]).trim().toLowerCase() : undefined
        
        if (!question || !optionA || !optionB || !optionC || !optionD) continue
        
        let correctIndex = 0
        if (correctAnswer === 'A' || correctAnswer === '1') correctIndex = 0
        else if (correctAnswer === 'B' || correctAnswer === '2') correctIndex = 1
        else if (correctAnswer === 'C' || correctAnswer === '3') correctIndex = 2
        else if (correctAnswer === 'D' || correctAnswer === '4') correctIndex = 3
        
        // Parse difficulty
        let difficulty: 'easy' | 'medium' | 'hard' | undefined = undefined
        if (difficultyRaw === 'easy' || difficultyRaw === 'সহজ') difficulty = 'easy'
        else if (difficultyRaw === 'medium' || difficultyRaw === 'মাঝারি') difficulty = 'medium'
        else if (difficultyRaw === 'hard' || difficultyRaw === 'কঠিন') difficulty = 'hard'
        
        questions.push({
          question,
          options: [optionA, optionB, optionC, optionD],
          correctIndex,
          explanation,
          difficulty
        })
      }
      
      if (questions.length === 0) {
        setGroupUploadError('No valid questions found. Format: Question | Option 1 | Option 2 | Option 3 | Option 4 | Correct (1/2/3/4) | Explanation | Difficulty')
      } else {
        setGroupUploadParsedQuestions(questions)
      }
    } catch (err) {
      console.error('Excel parse error:', err)
      setGroupUploadError('Error parsing Excel file')
    } finally {
      setGroupUploadLoading(false)
    }
  }

  // Group Upload - Parse Word file
  const parseWordFile = async (file: File) => {
    setGroupUploadLoading(true)
    setGroupUploadError('')
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const text = result.value
      
      // Parse questions from text
      // Expected format:
      // 1. Question text
      // 1) Option 1
      // 2) Option 2
      // 3) Option 3
      // 4) Option 4
      // Ans: 1 (or Answer: 1, or সঠিক উত্তর: ১)
      // Exp: Explanation text (optional)
      // Diff: easy/medium/hard (optional)
      
      const questions: Array<{ question: string; options: string[]; correctIndex: number; explanation?: string; difficulty?: 'easy' | 'medium' | 'hard' }> = []
      
      // Split by question numbers (1., 2., 3., etc. or ১., ২., ৩.)
      const questionBlocks = text.split(/(?=\n\s*(?:\d+|[১২৩৪৫৬৭৮৯০]+)[\.\)]\s*)/g)
      
      for (const block of questionBlocks) {
        if (!block.trim()) continue
        
        const lines = block.split('\n').map(l => l.trim()).filter(l => l)
        if (lines.length < 5) continue
        
        // First line is question (remove number prefix)
        const questionLine = lines[0].replace(/^(?:\d+|[১২৩৪৫৬৭৮৯০]+)[\.\)]\s*/, '').trim()
        if (!questionLine) continue
        
        // Find options - supports both 1/2/3/4 and A/B/C/D formats
        const optionPatterns = [
          /^[1১AaAক][\.\)\s]/,
          /^[2২BbBখ][\.\)\s]/,
          /^[3৩CcCগ][\.\)\s]/,
          /^[4৪DdDঘ][\.\)\s]/
        ]
        
        const options: string[] = ['', '', '', '']
        let correctIndex = 0
        let explanation: string | undefined = undefined
        let difficulty: 'easy' | 'medium' | 'hard' | undefined = undefined
        
        for (const line of lines.slice(1)) {
          // Check if this is an answer line - supports 1/2/3/4 and A/B/C/D
          const answerMatch = line.match(/(?:Ans|Answer|উত্তর|সঠিক উত্তর|Correct)[:\s]*([1234১২৩৪AaBbCcDd])/i)
          if (answerMatch) {
            const ans = answerMatch[1].toUpperCase()
            if (ans === '1' || ans === '১' || ans === 'A') correctIndex = 0
            else if (ans === '2' || ans === '২' || ans === 'B') correctIndex = 1
            else if (ans === '3' || ans === '৩' || ans === 'C') correctIndex = 2
            else if (ans === '4' || ans === '৪' || ans === 'D') correctIndex = 3
            continue
          }
          
          // Check for explanation line
          const expMatch = line.match(/(?:Exp|Explanation|ব্যাখ্যা|Solution)[:\s]*(.*)/i)
          if (expMatch && expMatch[1].trim()) {
            explanation = expMatch[1].trim()
            continue
          }
          
          // Check for difficulty line
          const diffMatch = line.match(/(?:Diff|Difficulty|Level|কঠিনত্ব)[:\s]*(.*)/i)
          if (diffMatch) {
            const diffVal = diffMatch[1].trim().toLowerCase()
            if (diffVal === 'easy' || diffVal === 'সহজ') difficulty = 'easy'
            else if (diffVal === 'medium' || diffVal === 'মাঝারি') difficulty = 'medium'
            else if (diffVal === 'hard' || diffVal === 'কঠিন') difficulty = 'hard'
            continue
          }
          
          // Check for * marked correct answer
          if (line.startsWith('*')) {
            const optLine = line.substring(1).trim()
            for (let i = 0; i < optionPatterns.length; i++) {
              if (optionPatterns[i].test(optLine)) {
                options[i] = optLine.replace(optionPatterns[i], '').trim()
                correctIndex = i
                break
              }
            }
            continue
          }
          
          // Check which option this is
          for (let i = 0; i < optionPatterns.length; i++) {
            if (optionPatterns[i].test(line)) {
              options[i] = line.replace(optionPatterns[i], '').trim()
              break
            }
          }
        }
        
        // Validate we have all options
        if (questionLine && options.every(o => o)) {
          questions.push({
            question: questionLine,
            options,
            correctIndex,
            explanation,
            difficulty
          })
        }
      }
      
      if (questions.length === 0) {
        setGroupUploadError('No valid questions found. Check the format.')
      } else {
        setGroupUploadParsedQuestions(questions)
      }
    } catch (err) {
      console.error('Word parse error:', err)
      setGroupUploadError('Error parsing Word file')
    } finally {
      setGroupUploadLoading(false)
    }
  }

  // Handle file selection
  const handleGroupUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setGroupUploadFile(file)
    setGroupUploadParsedQuestions([])
    setGroupUploadError('')
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'xlsx' || ext === 'xls') {
      parseExcelFile(file)
    } else if (ext === 'docx') {
      parseWordFile(file)
    } else {
      setGroupUploadError('Unsupported file type. Use .xlsx, .xls, or .docx')
    }
  }

  // Save all parsed questions
  const handleGroupUploadSave = async () => {
    if (!groupUploadCategory || !activeGroupId || !user || groupUploadParsedQuestions.length === 0) return
    
    setGroupUploadLoading(true)
    try {
      for (const q of groupUploadParsedQuestions) {
        const mcq: GroupMCQ = {
          id: uuidv4(),
          groupId: activeGroupId,
          categoryId: groupUploadCategory,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          createdBy: user.id,
          createdByName: user.displayName,
          createdAt: Date.now(),
          explanation: q.explanation,
          difficulty: q.difficulty,
        }
        addGroupMCQ(mcq)
        await setDoc(doc(db, 'mcqs', mcq.id), mcq)
      }
      
      alert(`✅ ${groupUploadParsedQuestions.length} questions uploaded successfully!`)
      setGroupUploadFile(null)
      setGroupUploadParsedQuestions([])
      setGroupUploadCategory('')
    } catch (err) {
      console.error('Error saving questions:', err)
      setGroupUploadError('Error saving questions to database')
    } finally {
      setGroupUploadLoading(false)
    }
  }

  const toggleQbCategory = (categoryId: string) => {
    setExpandedQbCategories(prev => 
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    )
  }

  // Handlers
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return
    const newGroup: Group = {
      id: uuidv4(),
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      groupCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      adminId: user.id,
      adminName: user.displayName,
      memberIds: [user.id],
      members: [{ userId: user.id, name: user.displayName, role: 'admin', joinedAt: Date.now() }],
      createdAt: Date.now(),
    }
    
    // Save to Firestore for cross-browser access
    try {
      await setDoc(doc(db, 'groups', newGroup.id), newGroup)
    } catch (err) {
      console.error('Error saving to Firestore:', err)
    }
    
    addGroup(newGroup)
    setActiveGroup(newGroup.id)
    setNewGroupName('')
    setNewGroupDesc('')
    setShowCreateGroup(false)
  }

  const handleJoinGroup = async () => {
    if (!joinCode.trim() || !user) return
    
    // Search in local registry and Firebase
    let groupToJoin: Group | undefined = await findGroupByCode(joinCode.trim())
    
    if (!groupToJoin) {
      alert('Invalid group code. Please check and try again.')
      return
    }
    
    // Check if already a member
    if (groupToJoin.memberIds.includes(user.id)) {
      alert('You are already a member of this group!')
      setJoinCode('')
      setShowJoinGroup(false)
      setActiveGroup(groupToJoin.id)
      return
    }
    
    // Add user to group
    const updatedGroup: Group = {
      ...groupToJoin,
      memberIds: [...groupToJoin.memberIds, user.id],
      members: [
        ...groupToJoin.members,
        {
          userId: user.id,
          name: user.displayName,
          role: 'member',
          joinedAt: Date.now()
        }
      ]
    }
    
    // Update in Firestore
    try {
      await updateDoc(doc(db, 'groups', updatedGroup.id), {
        memberIds: updatedGroup.memberIds,
        members: updatedGroup.members
      })
    } catch (err) {
      console.error('Error updating Firestore:', err)
    }
    
    // Update in registry and add to myGroups
    updateGroup(updatedGroup)
    
    // Also add to myGroups if not already there
    if (!myGroups.some(g => g.id === updatedGroup.id)) {
      addGroup(updatedGroup)
    }
    
    setActiveGroup(updatedGroup.id)
    setJoinCode('')
    setShowJoinGroup(false)
    alert(`Successfully joined "${groupToJoin.name}"!`)
  }

  const handleAddTopic = async (topicName?: string) => {
    const name = topicName || newTopicName
    if (!name.trim() || !activeGroupId) return
    const topic: GroupTopic = {
      id: uuidv4(),
      groupId: activeGroupId,
      name: name.trim(),
      order: groupTopics.length + 1,
      createdAt: Date.now(),
    }
    addTopic(topic)
    setNewTopicName('')
    // Note: Firestore save is handled by addTopic in group-store
  }

  const handleAddChapterItem = (topicId: string) => {
    if (!newItemName.trim() || !activeGroupId || !user) return
    
    // Map new types to supported types
    let finalType: 'note' | 'quiz' | 'file' = 'note'
    if (newItemType === 'quiz') finalType = 'quiz'
    else if (newItemType === 'link' || newItemType === 'text' || newItemType === 'heading') finalType = 'note'
    
    const item: GroupContentItem = {
      id: uuidv4(),
      subTopicId: '',
      topicId,
      groupId: activeGroupId,
      type: finalType,
      title: newItemName.trim(),
      content: '',
      source: 'user',  // User-created content
      createdBy: user.id,
      createdByName: user.displayName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addContentItem(item)
    setNewItemName('')
    setNewItemType('note')
    setShowAddItemModal(false)
    setAddingToTopicId(null)
  }

  // Open detail modal based on item type
  const openItemDetailModal = (type: typeof newItemType) => {
    setNewItemType(type)
    setItemDetailTitle('')
    setItemDetailContent('')
    setItemDetailUrl('')
    setQuizTimeLimit('')
    setShowSourceCode(false)
    setUploadedFiles([])
    setShowItemDetailModal(true)
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Filter valid files (PDF or images)
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB max per file
      return isValidType && isValidSize
    })

    // Max 10 files
    const limitedFiles = validFiles.slice(0, 10)
    setUploadedFiles(prev => [...prev, ...limitedFiles].slice(0, 10))
  }

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload files to Firebase Storage
  const uploadFilesToStorage = async (): Promise<string[]> => {
    if (uploadedFiles.length === 0) return []
    
    setIsUploading(true)
    const urls: string[] = []
    
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        const fileId = uuidv4()
        const fileRef = ref(storage, `group-files/${activeGroupId}/${fileId}_${file.name}`)
        
        await uploadBytes(fileRef, file)
        const url = await getDownloadURL(fileRef)
        urls.push(url)
        
        setUploadProgress(Math.round(((i + 1) / uploadedFiles.length) * 100))
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading files. Please try again.')
    }
    
    setIsUploading(false)
    setUploadProgress(0)
    return urls
  }

  // Submit item from detail modal
  const handleSubmitItemDetail = async () => {
    if (!itemDetailTitle.trim() || !activeGroupId || !user || !addingToTopicId) return
    
    let finalType: 'note' | 'quiz' | 'file' = 'note'
    if (newItemType === 'quiz') finalType = 'quiz'
    
    let content = itemDetailContent
    if (newItemType === 'link') {
      // Convert Google Drive/Docs links to embeddable format
      const embedUrl = convertToEmbedUrl(itemDetailUrl)
      content = `<iframe src="${embedUrl}" width="100%" height="500" frameborder="0" allow="autoplay"></iframe>`
    }
    
    // For Quiz - save based on selection mode
    if (newItemType === 'quiz') {
      if (quizSelectionMode === 'auto' && autoRandomCategoryId && autoRandomCount) {
        // Auto Random Mode - save category and count for dynamic random selection each time
        content = JSON.stringify({
          timeLimit: quizTimeLimit ? parseInt(quizTimeLimit) : null,
          mode: 'auto',
          categoryId: autoRandomCategoryId,  // 'all' or specific category id
          questionCount: parseInt(autoRandomCount),
        })
      } else {
        // Manual Mode - save fixed question IDs
        content = JSON.stringify({
          timeLimit: quizTimeLimit ? parseInt(quizTimeLimit) : null,
          mode: 'manual',
          questionIds: selectedQBQuestions,
        })
      }
    }
    
    // Upload files if any
    if (newItemType === 'note' && uploadedFiles.length > 0) {
      const fileUrls = await uploadFilesToStorage()
      if (fileUrls.length > 0) {
        // Create HTML for uploaded files
        const filesHtml = fileUrls.map((url, i) => {
          const file = uploadedFiles[i]
          if (file.type === 'application/pdf') {
            return `<div class="pdf-container mb-4"><embed src="${url}" type="application/pdf" width="100%" height="600px" /><p><a href="${url}" target="_blank" class="text-blue-500 underline">📄 ${file.name}</a></p></div>`
          } else {
            return `<div class="image-container mb-4"><img src="${url}" alt="${file.name}" style="max-width:100%;height:auto;" /><p class="text-sm text-gray-500">${file.name}</p></div>`
          }
        }).join('\n')
        content = filesHtml + (content ? `\n<div class="notes-content mt-4">${content}</div>` : '')
      }
    }
    
    // Get max order for this topic
    const existingItems = contentItems.filter(ci => ci.topicId === addingToTopicId)
    const maxOrder = existingItems.length > 0 
      ? Math.max(...existingItems.map(ci => ci.order ?? 0)) 
      : 0
    
    const item: GroupContentItem = {
      id: uuidv4(),
      subTopicId: '',
      topicId: addingToTopicId,
      groupId: activeGroupId,
      type: finalType,
      title: itemDetailTitle.trim(),
      content: content,
      source: 'user',  // User-created content
      order: maxOrder + 1,
      createdBy: user.id,
      createdByName: user.displayName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addContentItem(item)
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'contentItems', item.id), item)
    } catch (err) {
      console.error('Error saving content to Firestore:', err)
      alert('❌ Content save করতে সমস্যা হয়েছে! কনসোল চেক করুন।')
    }
    
    // Reset all
    setItemDetailTitle('')
    setItemDetailContent('')
    setItemDetailUrl('')
    setQuizTimeLimit('')
    setSelectedQBQuestions([])
    setQuizSelectionMode('manual')
    setAutoRandomCategoryId('')
    setAutoRandomCount('')
    setUploadedFiles([])
    setShowItemDetailModal(false)
    setShowAddItemModal(false)
    setAddingToTopicId(null)
  }

  // Get asset store MCQ sync functions
  const { addSingleMCQ: addAssetMCQ } = useAssetStore()

  const handleAddMCQ = (topicId: string) => {
    if (!mcqQuestion.trim() || mcqOptions.some(o => !o.trim()) || !activeGroupId || !user) {
      alert('Please fill all fields')
      return
    }
    // Use first category or create default
    const defaultCategory = groupCategories[0]?.id || 'uncategorized'
    
    // First add to Asset Library for centralized storage
    const { assetId, questionId } = addAssetMCQ(
      mcqQuestion.trim(),
      mcqOptions.map(o => o.trim()),
      mcqCorrect,
      user.id,
      'group-subject',  // default subject
      'group-topic',    // default topic
      undefined,        // explanation
      undefined,        // difficulty
      undefined         // subtopicId
    )
    
    // Then add to Group store with assetRef
    const mcq: GroupMCQ = {
      id: uuidv4(),
      groupId: activeGroupId,
      categoryId: defaultCategory,
      subTopicId: topicId,
      question: mcqQuestion.trim(),
      options: mcqOptions.map(o => o.trim()),
      correctIndex: mcqCorrect,
      createdBy: user.id,
      createdByName: user.displayName,
      createdAt: Date.now(),
    }
    addGroupMCQ(mcq)
    setMcqQuestion('')
    setMcqOptions(['', '', '', ''])
    setMcqCorrect(0)
    setAddingMCQTo(null)
  }

  // MCQ Edit handlers
  const handleEditMcq = (mcq: GroupMCQ) => {
    setEditingMcq(mcq)
    setEditMcqQuestion(mcq.question)
    setEditMcqOptions([...mcq.options])
    setEditMcqCorrectIndex(mcq.correctIndex)
    setEditMcqExplanation(mcq.explanation || '')
  }

  const handleSaveEditMcq = async () => {
    if (!editingMcq || !editMcqQuestion.trim() || editMcqOptions.some(o => !o.trim())) return
    
    const updated: GroupMCQ = {
      ...editingMcq,
      question: editMcqQuestion.trim(),
      options: editMcqOptions.map(o => o.trim()),
      correctIndex: editMcqCorrectIndex,
      explanation: editMcqExplanation.trim() || undefined,
    }
    
    updateGroupMCQ(updated)
    
    // Sync to Asset Library if linked
    if ((updated as any).assetRef) {
      syncGroupToLibrary(updated.id)
    }
    
    setEditingMcq(null)
  }

  const copyGroupCode = () => {
    if (activeGroup) {
      navigator.clipboard.writeText(activeGroup.groupCode)
      alert('Group code copied!')
    }
  }

  // Sync existing group to Firestore (for groups created before Firestore was added)
  const syncGroupToCloud = async () => {
    if (!activeGroup) return
    try {
      await setDoc(doc(db, 'groups', activeGroup.id), activeGroup)
      alert('Group synced to cloud! Now others can join with the code.')
    } catch (err) {
      console.error('Error syncing to Firestore:', err)
      alert('Error syncing. Please try again.')
    }
  }

  // Sync ALL group data to cloud (topics, content, MCQs, categories)
  const syncAllToCloud = async () => {
    if (!activeGroup || !activeGroupId) return
    
    try {
      // Sync group
      await setDoc(doc(db, 'groups', activeGroup.id), activeGroup)
      
      // Sync all topics for this group
      const groupTopicsList = topics.filter(t => t.groupId === activeGroupId)
      for (const topic of groupTopicsList) {
        await setDoc(doc(db, 'topics', topic.id), topic)
      }
      
      // Sync all content items for this group
      const groupContentList = contentItems.filter(c => c.groupId === activeGroupId)
      for (const item of groupContentList) {
        await setDoc(doc(db, 'contentItems', item.id), item)
      }
      
      // Sync all MCQs for this group
      const groupMCQsList = groupMCQs.filter(m => m.groupId === activeGroupId)
      for (const mcq of groupMCQsList) {
        await setDoc(doc(db, 'mcqs', mcq.id), mcq)
      }
      
      // Sync all categories for this group
      const groupCatsList = questionCategories.filter(c => c.groupId === activeGroupId)
      for (const cat of groupCatsList) {
        await setDoc(doc(db, 'categories', cat.id), cat)
      }
      
      alert(`Synced to cloud!\n- ${groupTopicsList.length} chapters\n- ${groupContentList.length} content items\n- ${groupMCQsList.length} MCQs\n- ${groupCatsList.length} categories`)
    } catch (err) {
      console.error('Error syncing all to Firestore:', err)
      alert('Error syncing. Please try again.')
    }
  }

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => 
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    )
  }

  const moveTopicUp = (topic: GroupTopic) => {
    const idx = groupTopics.findIndex(t => t.id === topic.id)
    if (idx > 0) {
      const prevTopic = groupTopics[idx - 1]
      updateTopic({ ...topic, order: prevTopic.order })
      updateTopic({ ...prevTopic, order: topic.order })
    }
  }

  const moveTopicDown = (topic: GroupTopic) => {
    const idx = groupTopics.findIndex(t => t.id === topic.id)
    if (idx < groupTopics.length - 1) {
      const nextTopic = groupTopics[idx + 1]
      updateTopic({ ...topic, order: nextTopic.order })
      updateTopic({ ...nextTopic, order: topic.order })
    }
  }

  // Live Test handlers
  
  // Get Live Tests for this group
  const upcomingLiveTests = useMemo(() => {
    if (!activeGroupId) return []
    return getUpcomingLiveTests(activeGroupId)
  }, [activeGroupId, liveTests])
  
  const activeLiveTest = useMemo(() => {
    if (!activeGroupId) return undefined
    return getActiveLiveTest(activeGroupId)
  }, [activeGroupId, liveTests])
  
  const pastLiveTests = useMemo(() => {
    if (!activeGroupId) return []
    return getPastLiveTests(activeGroupId)
  }, [activeGroupId, liveTests])
  
  // Create Live Test
  const handleCreateLiveTest = () => {
    if (!newLiveTestTitle.trim() || !newLiveTestStartDate || !newLiveTestStartTime || !newLiveTestEndDate || !newLiveTestEndTime) {
      alert('Please fill all required fields')
      return
    }
    
    const startTime = new Date(`${newLiveTestStartDate}T${newLiveTestStartTime}`).getTime()
    const endTime = new Date(`${newLiveTestEndDate}T${newLiveTestEndTime}`).getTime()
    
    if (endTime <= startTime) {
      alert('End time must be after start time')
      return
    }
    
    // Get questions based on mode
    let questionIds: string[] = []
    if (newLiveTestMode === 'auto') {
      let availableQuestions = groupMCQList
      if (newLiveTestCategories.length > 0) {
        availableQuestions = groupMCQList.filter(q => newLiveTestCategories.includes(q.categoryId || ''))
      }
      const count = Math.min(parseInt(newLiveTestQuestionCount), availableQuestions.length)
      const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
      questionIds = shuffled.slice(0, count).map(q => q.id)
    }
    
    const liveTest: LiveTest = {
      id: uuidv4(),
      groupId: activeGroup!.id,
      title: newLiveTestTitle.trim(),
      startTime,
      endTime,
      duration: parseInt(newLiveTestDuration),
      questionMode: newLiveTestMode,
      categoryIds: newLiveTestMode === 'auto' ? newLiveTestCategories : undefined,
      questionCount: newLiveTestMode === 'auto' ? parseInt(newLiveTestQuestionCount) : undefined,
      questionIds,
      autoReleaseResult: newLiveTestAutoRelease,
      showSolution: newLiveTestShowSolution,
      showLeaderboard: newLiveTestShowLeaderboard,
      status: 'scheduled',
      createdBy: user!.id,
      createdByName: user!.displayName || 'Admin',
      createdAt: Date.now()
    }
    
    addLiveTest(liveTest)
    
    // Reset form
    setShowCreateLiveTest(false)
    setNewLiveTestTitle('')
    setNewLiveTestStartDate('')
    setNewLiveTestStartTime('')
    setNewLiveTestEndDate('')
    setNewLiveTestEndTime('')
    setNewLiveTestDuration('30')
    setNewLiveTestMode('auto')
    setNewLiveTestCategories([])
    setNewLiveTestQuestionCount('20')
    setNewLiveTestAutoRelease(true)
    setNewLiveTestShowSolution(true)
    setNewLiveTestShowLeaderboard(true)
    
    alert('Live Test scheduled successfully!')
  }
  
  // Save Auto Daily Test Config
  const handleSaveAutoTestConfig = () => {
    if (!activeGroupId || !user) return
    
    if (autoTestEnabled && autoTestCategories.length === 0) {
      alert('Please select at least one category for Auto Test')
      return
    }
    
    const config = {
      id: `auto-${activeGroupId}`,
      groupId: activeGroupId,
      enabled: autoTestEnabled,
      title: autoTestTitle,
      categoryIds: autoTestCategories,
      startTime: autoTestStartTime,
      endTime: autoTestEndTime,
      duration: parseInt(autoTestDuration),
      questionCount: parseInt(autoTestQuestionCount),
      activeDays: autoTestDays,
      autoReleaseResult: autoTestAutoRelease,
      showSolution: autoTestShowSolution,
      showLeaderboard: autoTestShowLeaderboard,
      createdBy: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    setAutoLiveTestConfig(config)
    alert('Auto Daily Test settings saved!')
  }
  
  // ==== Shared LiveTestManagement Handlers ====
  
  // Handle create test from shared component
  const handleCreateTestFromShared = (test: Omit<LiveTestConfig, 'id' | 'createdAt'>) => {
    if (!activeGroupId || !user) return
    
    const startTime = test.startDate && test.startTimeStr 
      ? new Date(`${test.startDate}T${test.startTimeStr}`).getTime() 
      : Date.now()
    const endTime = test.endDate && test.endTimeStr 
      ? new Date(`${test.endDate}T${test.endTimeStr}`).getTime() 
      : startTime + 24 * 60 * 60 * 1000
    
    // Get question IDs based on source
    let questionIds: string[] = []
    let availableQuestions: any[] = []
    
    if (test.source === 'library') {
      // Get questions from Asset Library
      if (!test.librarySubjectId) {
        alert('Please select a subject from Asset Library')
        return
      }
      let filteredAssets = allAssets.filter(a => a.type === 'mcq' && a.subjectId === test.librarySubjectId)
      if (test.libraryTopicId) {
        filteredAssets = filteredAssets.filter(a => a.topicId === test.libraryTopicId)
      }
      if (test.librarySubtopicId) {
        filteredAssets = filteredAssets.filter(a => a.subtopicId === test.librarySubtopicId)
      }
      // Flatten quizQuestions from assets
      filteredAssets.forEach(asset => {
        if ('quizQuestions' in asset) {
          const mcqAsset = asset as any
          mcqAsset.quizQuestions?.forEach((q: any) => {
            availableQuestions.push({
              id: q.id || `${asset.id}-${Math.random()}`,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              difficulty: q.difficulty || 'medium',
            })
          })
        }
      })
    } else {
      // Get questions from Group MCQs
      availableQuestions = [...groupMCQList]
      if (test.categoryIds.length > 0) {
        availableQuestions = groupMCQList.filter(q => test.categoryIds.includes(q.categoryId || ''))
      }
    }
    
    // Filter by difficulty if specified
    if (test.difficulty && test.difficulty !== 'all') {
      availableQuestions = availableQuestions.filter(q => {
        const questionDifficulty = q.difficulty || 'medium'
        return questionDifficulty === test.difficulty
      })
    }
    
    if (availableQuestions.length === 0) {
      alert('No questions available for the selected criteria')
      return
    }
    
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
    questionIds = shuffled.slice(0, test.questionCount).map(q => q.id)
    
    const liveTest: LiveTest = {
      id: uuidv4(),
      groupId: activeGroupId,
      title: test.title,
      startTime,
      endTime,
      duration: test.duration,
      questionMode: 'auto',
      categoryIds: test.categoryIds,
      questionCount: test.questionCount,
      questionIds,
      autoReleaseResult: true,
      showSolution: test.showSolution,
      showLeaderboard: test.showLeaderboard ?? true,
      status: 'scheduled',
      createdBy: user.id,
      createdByName: user.displayName || 'Admin',
      createdAt: Date.now(),
      resultReleaseTime: test.endTimeStr, // End Time = Result Release Time
      source: test.source === 'library' ? 'library' : 'group',
      librarySubjectId: test.librarySubjectId,
      libraryTopicId: test.libraryTopicId,
      librarySubtopicId: test.librarySubtopicId,
      difficulty: test.difficulty,
    }
    
    addLiveTest(liveTest)
    alert('Live Test scheduled successfully!')
  }
  
  // Handle delete test from shared component
  const handleDeleteTestFromShared = (testId: string) => {
    if (confirm('Delete this test?')) {
      removeLiveTest(testId)
    }
  }
  
  // Handle save auto config from shared component
  const handleSaveAutoConfigFromShared = (config: Omit<AutoTestConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!activeGroupId || !user) return
    
    // Validate based on source
    const isLibrarySource = config.source === 'library'
    if (config.enabled && !isLibrarySource && config.categoryIds.length === 0) {
      alert('Please select at least one category for Auto Test')
      return
    }
    if (config.enabled && isLibrarySource && !config.librarySubjectId) {
      alert('Please select a subject from Asset Library')
      return
    }
    
    const fullConfig = {
      id: `auto-${activeGroupId}`,
      groupId: activeGroupId,
      enabled: config.enabled,
      title: config.title,
      categoryIds: config.categoryIds,
      startTime: config.startTime,
      endTime: config.endTime,
      duration: config.duration,
      questionCount: config.questionCount,
      activeDays: config.activeDays,
      autoReleaseResult: true,
      showSolution: config.showSolution,
      showLeaderboard: config.showLeaderboard,
      resultReleaseTime: config.endTime, // End Time = Result Release Time
      showDetailedAnalysis: config.showDetailedAnalysis,
      source: (config.source === 'library' ? 'library' : 'group') as 'library' | 'group',
      librarySubjectId: config.librarySubjectId,
      libraryTopicId: config.libraryTopicId,
      librarySubtopicId: config.librarySubtopicId,
      difficulty: config.difficulty,
      createdBy: user.id,
      createdAt: currentAutoTestConfig?.createdAt || Date.now(),
      updatedAt: Date.now()
    }
    
    setAutoLiveTestConfig(fullConfig)
    alert('✅ Auto Test Settings saved!')
  }

  // Check if Auto Test is currently active
  const isAutoTestActive = useMemo(() => {
    if (!activeGroupId) return false
    const config = getAutoLiveTestConfig(activeGroupId)
    if (!config || !config.enabled) return false
    
    const now = new Date()
    const currentDay = now.getDay()
    if (!config.activeDays.includes(currentDay)) return false
    
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [startH, startM] = config.startTime.split(':').map(Number)
    const [endH, endM] = config.endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    
    return currentTime >= startMinutes && currentTime <= endMinutes
  }, [activeGroupId, autoTestEnabled])
  
  // Get current Auto Test config
  const currentAutoTestConfig = useMemo(() => {
    if (!activeGroupId) return null
    return getAutoLiveTestConfig(activeGroupId)
  }, [activeGroupId, autoTestEnabled])
  
  // Check if user has already completed today's auto test
  const hasCompletedTodayAutoTest = useMemo(() => {
    if (!activeGroupId || !user || !currentAutoTestConfig?.enabled) return false
    
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    // Check if any result exists for today's auto test
    const todayResults = liveTestResults.filter(r => {
      if (r.userId !== user.id) return false
      if (!r.liveTestId.startsWith('auto-')) return false
      if (r.status !== 'submitted') return false
      
      // Check if submitted today
      const submitDate = new Date(r.submittedAt || r.startedAt)
      const submitDateStr = `${submitDate.getFullYear()}-${String(submitDate.getMonth() + 1).padStart(2, '0')}-${String(submitDate.getDate()).padStart(2, '0')}`
      
      return submitDateStr === todayStr
    })
    
    return todayResults.length > 0
  }, [activeGroupId, user, currentAutoTestConfig, liveTestResults])

  // Start Live Test
  const startLiveTest = (test: LiveTest) => {
    // Check if user already has a result
    const existingResult = getUserLiveTestResult(test.id, user!.id)
    if (existingResult && existingResult.status !== 'in-progress') {
      alert('You have already submitted this test')
      return
    }
    
    // Get questions
    const questions = groupMCQs.filter(m => test.questionIds.includes(m.id))
    if (questions.length === 0) {
      alert('No questions found for this test')
      return
    }
    
    // Shuffle questions
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    
    setLiveTestQuestions(shuffled)
    setLiveTestCurrentQ(0)
    setLiveTestAnswers(existingResult?.answers.reduce((acc, a) => {
      if (a.selected !== null) acc[a.questionId] = a.selected
      return acc
    }, {} as Record<string, number>) || {})
    setLiveTestStartedAt(existingResult?.startedAt || Date.now())
    setRunningLiveTest(test)
    
    // Create or update result
    if (!existingResult) {
      const newResult: LiveTestResult = {
        id: uuidv4(),
        liveTestId: test.id,
        groupId: test.groupId,
        userId: user!.id,
        userName: user!.displayName || 'User',
        startedAt: Date.now(),
        score: 0,
        correct: 0,
        wrong: 0,
        unanswered: test.questionIds.length,
        total: test.questionIds.length,
        timeTaken: 0,
        answers: test.questionIds.map(qId => ({ questionId: qId, selected: null, correct: groupMCQs.find(m => m.id === qId)?.correctIndex || 0 })),
        status: 'in-progress'
      }
      addLiveTestResult(newResult)
    }
  }
  
  // Submit Live Test
  const submitLiveTest = () => {
    if (!runningLiveTest) return
    
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
    
    // Update result
    const existingResult = getUserLiveTestResult(runningLiveTest.id, user!.id)
    if (existingResult) {
      const updatedResult: LiveTestResult = {
        ...existingResult,
        submittedAt: Date.now(),
        score,
        correct,
        wrong,
        unanswered,
        timeTaken,
        answers,
        status: 'submitted'
      }
      updateLiveTestResult(updatedResult)
      setViewingLiveTestResult(updatedResult)
      
      // Show message if result is not released yet
      if (runningLiveTest.resultReleaseTime && !isResultReleased(runningLiveTest.resultReleaseTime)) {
        alert(`✅ Test submitted successfully!\n\n⏰ Result will be available at ${getResultReleaseMessage(runningLiveTest.resultReleaseTime)}`)
      }
    }
    
    setRunningLiveTest(null)
    setLiveTestQuestions([])
    setLiveTestTab('results')
  }
  
  // Check if result should be shown for a test
  const canViewResult = (test: LiveTest, submittedAt?: number): boolean => {
    // First check if test has ended
    if (Date.now() < test.endTime) return false
    
    // Check resultReleaseTime if set
    if (test.resultReleaseTime) {
      return isResultReleased(test.resultReleaseTime, submittedAt)
    }
    
    // Fall back to legacy checks
    if (test.autoReleaseResult && Date.now() > test.endTime) return true
    if (test.status === 'result-released') return true
    return false
  }
  
  // Get user's result for a test
  const getMyResult = (testId: string): LiveTestResult | undefined => {
    return getUserLiveTestResult(testId, user?.id || '')
  }
  
  // Format countdown
  const formatCountdown = (targetTime: number): string => {
    const diff = targetTime - Date.now()
    if (diff <= 0) return 'Started'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }
  
  // Format time remaining for test
  const formatTimeRemaining = (test: LiveTest, startedAt: number): string => {
    const maxEndTime = Math.min(test.endTime, startedAt + test.duration * 60 * 1000)
    const remaining = maxEndTime - Date.now()
    
    if (remaining <= 0) return '0:00'
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }
  
  // Check if result is released based on resultReleaseTime and submission date
  const isResultReleased = (resultReleaseTime?: string, submittedAt?: number): boolean => {
    if (!resultReleaseTime) return true // If no release time set, show result immediately
    
    const now = new Date()
    
    // If submittedAt is provided, check if it's from a previous day
    if (submittedAt) {
      const submissionDate = new Date(submittedAt)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      submissionDate.setHours(0, 0, 0, 0)
      
      // If test was submitted on a previous day, result is always available
      if (submissionDate < today) {
        return true
      }
    }
    
    // For today's tests, check if current time is past release time
    const [hours, minutes] = resultReleaseTime.split(':').map(Number)
    const releaseTime = new Date()
    releaseTime.setHours(hours, minutes, 0, 0)
    
    return now >= releaseTime
  }

  // Get result release time display
  const getResultReleaseMessage = (resultReleaseTime?: string): string => {
    if (!resultReleaseTime) return ''
    const [hours, minutes] = resultReleaseTime.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
  }
  
  // Start Quiz from Question Bank - Now uses GroupQuizRunner
  const startQuizFromItem = (item: GroupContentItem) => {
    try {
      const quizData = JSON.parse(item.content)
      
      let quizQuestions: GroupMCQ[] = []
      
      if (quizData.mode === 'auto') {
        // Auto Random Mode - get fresh random questions each time
        const { categoryId, questionCount } = quizData
        
        let availableQuestions: GroupMCQ[]
        if (categoryId === 'all') {
          availableQuestions = groupMCQs.filter((m: GroupMCQ) => m.groupId === activeGroup?.id)
        } else {
          availableQuestions = groupMCQs.filter((m: GroupMCQ) => m.groupId === activeGroup?.id && m.categoryId === categoryId)
        }
        
        if (availableQuestions.length === 0) {
          alert('No questions available in this category.')
          return
        }
        
        // Shuffle and pick random questions
        const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
        quizQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length))
        
      } else {
        // Manual Mode - use fixed question IDs
        const questionIds: string[] = quizData.questionIds || []
        
        if (questionIds.length === 0) {
          alert('No questions in this quiz. Edit the quiz to add questions.')
          return
        }
        
        quizQuestions = groupMCQs.filter((m: GroupMCQ) => questionIds.includes(m.id))
        // Shuffle the fixed questions too
        quizQuestions = [...quizQuestions].sort(() => Math.random() - 0.5)
      }
      
      if (quizQuestions.length === 0) {
        alert('Questions not found. They may have been deleted.')
        return
      }
      
      // Use new GroupQuizRunner with result, leaderboard, etc.
      setRunningQuiz({
        item,
        questions: quizQuestions,
        timeLimit: quizData.timeLimit || null
      })
    } catch {
      alert('Invalid quiz data')
    }
  }
  
  // Get quiz info from item
  const getQuizInfo = (item: GroupContentItem) => {
    try {
      const quizData = JSON.parse(item.content)
      
      if (quizData.mode === 'auto') {
        // For auto mode, show category info
        const categoryName = quizData.categoryId === 'all' 
          ? 'All Categories' 
          : groupCategories.find(c => c.id === quizData.categoryId)?.name || 'Unknown'
        return {
          timeLimit: quizData.timeLimit,
          questionCount: quizData.questionCount,
          mode: 'auto',
          categoryName
        }
      }
      
      return {
        timeLimit: quizData.timeLimit,
        questionCount: quizData.questionIds?.length || 0,
        mode: 'manual'
      }
    } catch {
      return { timeLimit: null, questionCount: 0 }
    }
  }

  // Main render
  
  // If Quiz is running, show GroupQuizRunner fullscreen
  if (runningQuiz) {
    return (
      <div className="p-6">
        <GroupQuizRunner
          questions={runningQuiz.questions}
          quizItem={runningQuiz.item}
          timeLimit={runningQuiz.timeLimit || undefined}
          onBack={() => setRunningQuiz(null)}
        />
      </div>
    )
  }
  
  return (
    <div className="p-4 sm:p-6 space-y-4 -mx-4 sm:mx-0">
      {/* Header with Group Dropdown - Desktop only */}
      <div className="hidden sm:flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Group Study</h2>
          
          {/* Group Dropdown */}
          <Select 
            value={activeGroupId || ''} 
            onValueChange={(v) => setActiveGroup(v || null)}
          >
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Select Group" />
            </SelectTrigger>
            <SelectContent>
              {myGroups.map(g => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateGroup(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Create
          </Button>
          <Button variant="outline" onClick={() => setShowJoinGroup(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-1" /> Join
          </Button>
        </div>
      </div>

      {/* Mobile Header - Compact */}
      <div className="sm:hidden flex items-center gap-2">
        <Select 
          value={activeGroupId || ''} 
          onValueChange={(v) => setActiveGroup(v || null)}
        >
          <SelectTrigger className="flex-1 h-8 text-xs">
            <SelectValue placeholder="Select Group" />
          </SelectTrigger>
          <SelectContent>
            {myGroups.map(g => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreateGroup(true)} size="sm" className="h-8 px-2">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => setShowJoinGroup(true)} size="sm" className="h-8 px-2">
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* No Group Selected */}
      {!activeGroupId ? (
        <Card className="p-8 sm:p-12 text-center">
          <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">
            {myGroups.length === 0 ? 'No Groups Yet' : 'Select a Group'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {myGroups.length === 0 
              ? 'Create a new group or join an existing one!' 
              : 'Choose a group from the dropdown above'}
          </p>
        </Card>
      ) : (
        <>
          {/* Group Info Bar - Mobile friendly */}
          <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-muted/50 rounded-lg flex-wrap text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <code className="bg-background px-2 py-0.5 rounded font-mono text-xs">{activeGroup?.groupCode}</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={copyGroupCode}>
                <Copy className="h-3 w-3" />
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-500" onClick={syncGroupToCloud} title="Sync to cloud">
                  <Upload className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs sm:text-sm">{activeGroup?.members.length}</span>
            </div>
            {isAdmin && (
              <span className="flex items-center gap-1 text-xs sm:text-sm text-primary">
                <Crown className="h-3 w-3" /> Admin
              </span>
            )}
            {/* Delete Requests Button */}
            {pendingDeleteRequests.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto relative h-7 text-xs"
                onClick={() => setShowDeleteRequests(true)}
              >
                <Bell className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Delete Requests</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                  {pendingDeleteRequests.length}
                </span>
              </Button>
            )}
          </div>

          {/* Tabs - Hidden on mobile (controlled by bottom nav) */}
          <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as typeof activeSubTab)}>
            <TabsList className="hidden lg:grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="whats-new" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <Sparkles className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">What's New</span>
              </TabsTrigger>
              <TabsTrigger value="course" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <BookOpen className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Course</span>
              </TabsTrigger>
              <TabsTrigger value="live-test" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <Brain className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Live Test</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <Settings className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* What's New Tab */}
            <TabsContent value="whats-new" className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" /> Latest Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latestNotes.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No notes yet</p>
                    ) : (
                      <div className="space-y-2">
                        {latestNotes.map(note => (
                          <div 
                            key={note.id} 
                            className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => setViewingContent(note)}
                          >
                            <h4 className="font-medium text-sm">{note.title}</h4>
                            <p className="text-xs text-muted-foreground">by {note.createdByName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /> Latest MCQs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {groupMCQList.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No MCQs yet</p>
                    ) : (
                      <div className="space-y-2">
                        {groupMCQList.slice(0, 5).map(mcq => (
                          <div 
                            key={mcq.id} 
                            className="p-2 sm:p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => {
                              // Find the quiz content item that contains this MCQ or go to Course tab
                              setActiveSubTab('course')
                            }}
                          >
                            <h4 className="font-medium text-xs sm:text-sm line-clamp-1">{mcq.question}</h4>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">by {mcq.createdByName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Pending Reports for Content Creators */}
              {pendingReportsForMe.length > 0 && (
                <Card className="border-orange-500/50 bg-orange-50/50 dark:bg-orange-900/10">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" /> 
                      Correction <span className="hidden sm:inline">Requests</span> ({pendingReportsForMe.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    {pendingReportsForMe.map(report => (
                      <div key={report.id} className="p-2 sm:p-3 bg-white dark:bg-background rounded-lg border space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm truncate">{report.contentTitle}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              by {report.reportedByName} • {new Date(report.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-[10px] sm:text-xs bg-orange-500/20 text-orange-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                            {report.contentType === 'note' ? 'Notes' : report.contentType === 'quiz' ? 'Quiz' : 'Q'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm bg-muted p-2 rounded line-clamp-2">{report.message}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600 hover:bg-green-50 h-7 text-xs px-2"
                            onClick={() => resolveContentReport(report.id, 'resolved')}
                          >
                            <Check className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Fixed</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 h-7 text-xs px-2"
                            onClick={() => resolveContentReport(report.id, 'dismissed')}
                          >
                            <XCircle className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Dismiss</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Stats Grid - Mobile optimized */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <Card className="p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary">{groupTopics.length}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Chapters</div>
                </Card>
                <Card className="p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-500">
                    {contentItems.filter(ci => ci.groupId === activeGroupId && ci.type === 'note').length}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Notes</div>
                </Card>
                <Card className="p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-500">{groupMCQList.length}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">MCQs</div>
                </Card>
                <Card className="p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-orange-500">{activeGroup?.members.length}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Members</div>
                </Card>
              </div>
            </TabsContent>

            {/* Course Tab - Display & Edit Mode */}
            <TabsContent value="course" className="space-y-3 sm:space-y-4">
              {/* Course Contents Header */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-base sm:text-lg">Course Contents</h3>
                <Button 
                  variant={isEditMode ? 'default' : 'outline'} 
                  size="sm"
                  className="h-8 text-xs sm:text-sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <Pencil className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">{isEditMode ? 'Exit Edit' : 'Edit Mode'}</span>
                </Button>
              </div>
              
              {/* Add new chapter button - Only in Edit Mode for Admin */}
              {isEditMode && isAdmin && (
                <div className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded cursor-pointer border-b"
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
              <div className="border rounded-lg overflow-hidden bg-card">
                {groupTopics.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No chapters yet. {isAdmin && isEditMode && 'Click "Add new chapter" above!'}
                  </div>
                ) : (
                  groupTopics.map((topic) => {
                    const isExpanded = expandedTopics.includes(topic.id)
                    const topicContent = contentItems
                      .filter(ci => ci.topicId === topic.id)
                      .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt))
                    const canEdit = canEditTopic(topic)
                    const assignedNames = topic.assignedMembers?.map(uid => 
                      activeGroup?.members.find(m => m.userId === uid)?.name || 'Unknown'
                    ).join(', ')
                    
                    return (
                      <div key={topic.id} className="border-b last:border-b-0">
                        {/* Chapter Header */}
                        <div className="flex items-center hover:bg-muted/30">
                          <button 
                            className="flex-1 flex items-center gap-2 p-3 text-left"
                            onClick={() => toggleTopic(topic.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className="font-semibold">{topic.name}</span>
                            {topic.assignedMembers && topic.assignedMembers.length > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({assignedNames})
                              </span>
                            )}
                          </button>
                          
                          {/* Edit Mode Controls */}
                          {isEditMode && (isAdmin || canEdit) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-2">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isAdmin && (
                                  <DropdownMenuItem onClick={() => {
                                    const newName = prompt('Enter new chapter name:', topic.name)
                                    if (newName?.trim()) {
                                      updateTopic({ ...topic, name: newName.trim() })
                                    }
                                  }}>
                                    <Pencil className="h-4 w-4 mr-2" /> Rename
                                  </DropdownMenuItem>
                                )}
                                {canEdit && (
                                  <DropdownMenuItem onClick={() => {
                                    setAddingToTopicId(topic.id)
                                    setShowAddItemModal(true)
                                  }}>
                                    <Plus className="h-4 w-4 mr-2" /> Add content
                                  </DropdownMenuItem>
                                )}
                                {isAdmin && (
                                  <>
                                    <DropdownMenuItem onClick={() => {
                                      // Open assign members modal
                                      setAssigningTopicId(topic.id)
                                      setSelectedMemberIds(topic.assignedMembers || [])
                                      setShowAssignModal(true)
                                    }}>
                                      <UserPlus className="h-4 w-4 mr-2" /> Assign members
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => moveTopicUp(topic)}>
                                      <ArrowUp className="h-4 w-4 mr-2" /> Move up
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => moveTopicDown(topic)}>
                                      <ArrowDown className="h-4 w-4 mr-2" /> Move down
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-orange-500"
                                      onClick={() => requestDelete('topic', topic.id, topic.name)}
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2" /> Request Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* Chapter Content - Expanded */}
                        {isExpanded && (
                          <div className="bg-muted/20">
                            {/* Add content buttons - Edit Mode Only */}
                            {isEditMode && canEdit && (
                              <div className="flex items-center gap-4 py-2 px-8 border-b">
                                <div 
                                  className="flex items-center gap-2 hover:bg-muted/30 cursor-pointer text-sm px-2 py-1 rounded"
                                  onClick={() => {
                                    setAddingToTopicId(topic.id)
                                    setShowAddItemModal(true)
                                  }}
                                >
                                  <Plus className="h-3 w-3 text-primary" />
                                  <span className="text-primary">Add content</span>
                                </div>
                              </div>
                            )}

                            {/* Content Items */}
                            {topicContent.length === 0 ? (
                              <p className="px-8 py-4 text-sm text-muted-foreground">
                                No content yet. {isEditMode && canEdit && 'Click "Add content" to start!'}
                              </p>
                            ) : (
                              <>
                                {topicContent.map((item, itemIndex) => {
                                  const quizInfo = item.type === 'quiz' ? getQuizInfo(item) : null
                                  
                                  return (
                                  <div key={item.id} className="flex items-center hover:bg-muted/30 border-b last:border-b-0">
                                    {/* Display Mode - Click to view/interact */}
                                    <div 
                                      className="flex-1 flex items-center gap-2 py-2 px-8 cursor-pointer"
                                      onClick={() => {
                                        if (item.type === 'quiz') {
                                          startQuizFromItem(item)
                                        } else if (item.type === 'note') {
                                          setViewingContent(item)
                                        }
                                      }}
                                    >
                                      {item.type === 'note' && item.content ? (
                                        <FileText className="h-4 w-4 text-blue-500" />
                                      ) : item.type === 'quiz' ? (
                                        <HelpCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <span className="text-muted-foreground">•</span>
                                      )}
                                      <span className="text-sm">{item.title}</span>
                                      {quizInfo && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                          ({quizInfo.questionCount} Q{quizInfo.timeLimit ? `, ${quizInfo.timeLimit}min` : ''}
                                          {quizInfo.mode === 'auto' && <Shuffle className="h-3 w-3 inline ml-1" />})
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Edit Mode Controls */}
                                    {isEditMode && canEdit && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-2">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => {
                                            const newName = prompt('Enter new name:', item.title)
                                            if (newName?.trim()) {
                                              updateContentItem({ ...item, title: newName.trim(), updatedAt: Date.now() })
                                            }
                                          }}>
                                            <Pencil className="h-4 w-4 mr-2" /> Rename
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setEditingContent(item)}>
                                            <FileText className="h-4 w-4 mr-2" /> Edit content
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            setAddingToTopicId(topic.id)
                                            setShowAddItemModal(true)
                                          }}>
                                            <Plus className="h-4 w-4 mr-2" /> Add content
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            disabled={itemIndex === 0}
                                            onClick={() => {
                                              if (itemIndex > 0) {
                                                const prevItem = topicContent[itemIndex - 1]
                                                const currentOrder = item.order ?? itemIndex
                                                const prevOrder = prevItem.order ?? (itemIndex - 1)
                                                updateContentItem({ ...item, order: prevOrder, updatedAt: Date.now() })
                                                updateContentItem({ ...prevItem, order: currentOrder, updatedAt: Date.now() })
                                              }
                                            }}
                                          >
                                            <ArrowUp className="h-4 w-4 mr-2" /> Move up
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            disabled={itemIndex === topicContent.length - 1}
                                            onClick={() => {
                                              if (itemIndex < topicContent.length - 1) {
                                                const nextItem = topicContent[itemIndex + 1]
                                                const currentOrder = item.order ?? itemIndex
                                                const nextOrder = nextItem.order ?? (itemIndex + 1)
                                                updateContentItem({ ...item, order: nextOrder, updatedAt: Date.now() })
                                                updateContentItem({ ...nextItem, order: currentOrder, updatedAt: Date.now() })
                                              }
                                            }}
                                          >
                                            <ArrowDown className="h-4 w-4 mr-2" /> Move down
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-orange-500"
                                            onClick={() => requestDelete('content', item.id, item.title)}
                                          >
                                            <AlertTriangle className="h-4 w-4 mr-2" /> Request Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                  )
                                })}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Add new chapter at bottom - Edit Mode Only */}
              {isEditMode && isAdmin && groupTopics.length > 0 && (
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
            <TabsContent value="live-test" className="space-y-4">
              {/* If running a live test */}
              {runningLiveTest ? (
                <Card className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-4 text-sm">
                      <span className="font-medium">Q {liveTestCurrentQ + 1}/{liveTestQuestions.length}</span>
                      <span className="text-red-500 font-medium">
                        <Clock className="h-3.5 w-3.5 inline mr-1" />
                        {formatTimeRemaining(runningLiveTest, liveTestStartedAt)}
                      </span>
                    </div>
                    <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={submitLiveTest}>
                      <Check className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Submit</span>
                    </Button>
                  </div>
                  
                  {/* Question Navigator - Collapsible Icon */}
                  {(() => {
                    const answeredCount = Object.keys(liveTestAnswers).length
                    return (
                      <div className="mb-3 sm:mb-4">
                        <button
                          onClick={() => setShowQuestionNav(!showQuestionNav)}
                          className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors w-full justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Grid3X3 className="h-4 w-4" />
                            <span className="text-sm font-medium">Questions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-primary/20 px-2 py-0.5 rounded">
                              {answeredCount}/{liveTestQuestions.length}
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${showQuestionNav ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {showQuestionNav && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                                {liveTestQuestions.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => { setLiveTestCurrentQ(i); setShowQuestionNav(false) }}
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
                              <div className="flex gap-3 mt-2 px-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Answered</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 border rounded" /> Unanswered</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })()}
                  
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
              ) : viewingLiveTestSolutions && viewingLiveTestResult ? (
                /* View Solutions Mode */
                <Card className="p-3 sm:p-6">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold">View Solutions</h3>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setViewingLiveTestSolutions(false)}>
                      <X className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Close</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-4 sm:space-y-6">
                    {viewingLiveTestResult.answers.map((ans, idx) => {
                      const question = groupMCQs.find(q => q.id === ans.questionId)
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
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ) : (
                /* Main Live Test View */
                <>
                  {/* Auto Daily Test Banner */}
                  {currentAutoTestConfig?.enabled && (
                    <Card className={`border-2 ${
                      hasCompletedTodayAutoTest
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : isAutoTestActive
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {hasCompletedTodayAutoTest ? (
                              <span className="text-green-600 dark:text-green-400 font-bold text-sm">✅ Done</span>
                            ) : isAutoTestActive ? (
                              <span className="text-red-600 dark:text-red-400 font-bold text-sm animate-pulse">🔴 LIVE</span>
                            ) : (
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full" />
                            )}
                            <div>
                              <h4 className={`font-semibold text-sm sm:text-base ${
                                hasCompletedTodayAutoTest
                                  ? 'text-green-700 dark:text-green-400'
                                  : isAutoTestActive
                                    ? 'text-red-700 dark:text-red-400'
                                    : 'text-yellow-700 dark:text-yellow-400'
                              }`}>
                                {currentAutoTestConfig.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {currentAutoTestConfig.questionCount} Q • {currentAutoTestConfig.duration} min
                              </p>
                            </div>
                          </div>
                          {hasCompletedTodayAutoTest ? (
                            <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                              ✓ Today's test completed! Result at {currentAutoTestConfig.endTime}
                            </span>
                          ) : isAutoTestActive ? (
                            <Button 
                              size="sm"
                              className="h-8 text-xs sm:text-sm w-full sm:w-auto bg-red-600 hover:bg-red-700"
                              onClick={() => {
                                // Generate questions based on source
                                let availableQuestions: any[] = []
                                
                                if (currentAutoTestConfig.source === 'library') {
                                  // Get questions from Asset Library
                                  let filteredAssets = allAssets.filter(a => 
                                    a.type === 'mcq' && a.subjectId === currentAutoTestConfig.librarySubjectId
                                )
                                if (currentAutoTestConfig.libraryTopicId) {
                                  filteredAssets = filteredAssets.filter(a => a.topicId === currentAutoTestConfig.libraryTopicId)
                                }
                                if (currentAutoTestConfig.librarySubtopicId) {
                                  filteredAssets = filteredAssets.filter(a => a.subtopicId === currentAutoTestConfig.librarySubtopicId)
                                }
                                // Flatten quizQuestions from assets
                                filteredAssets.forEach(asset => {
                                  if ('quizQuestions' in asset) {
                                    const mcqAsset = asset as any
                                    mcqAsset.quizQuestions?.forEach((q: any) => {
                                      availableQuestions.push({
                                        id: q.id || `${asset.id}-${Math.random()}`,
                                        question: q.question,
                                        options: q.options,
                                        correctIndex: q.correctIndex,
                                        explanation: q.explanation,
                                        difficulty: q.difficulty || 'medium',
                                      })
                                    })
                                  }
                                })
                              } else {
                                // Get questions from Group MCQs
                                availableQuestions = groupMCQList.filter(q => 
                                  currentAutoTestConfig.categoryIds.length === 0 || 
                                  currentAutoTestConfig.categoryIds.includes(q.categoryId || '')
                                )
                              }
                              
                              // Filter by difficulty if specified
                              if (currentAutoTestConfig.difficulty && currentAutoTestConfig.difficulty !== 'all') {
                                availableQuestions = availableQuestions.filter(q => {
                                  const qDifficulty = q.difficulty || 'medium'
                                  return qDifficulty === currentAutoTestConfig.difficulty
                                })
                              }
                              
                              const count = Math.min(currentAutoTestConfig.questionCount, availableQuestions.length)
                              const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
                              const selectedQuestions = shuffled.slice(0, count)
                              
                              if (selectedQuestions.length === 0) {
                                alert('No questions available for the selected criteria')
                                return
                              }
                              
                              // Start the auto test
                              setLiveTestQuestions(selectedQuestions)
                              setRunningLiveTest({
                                id: `auto-${Date.now()}`,
                                groupId: activeGroupId!,
                                title: currentAutoTestConfig.title,
                                startTime: Date.now(),
                                endTime: Date.now() + currentAutoTestConfig.duration * 60 * 1000,
                                duration: currentAutoTestConfig.duration,
                                questionMode: 'auto',
                                categoryIds: currentAutoTestConfig.categoryIds,
                                questionCount: currentAutoTestConfig.questionCount,
                                questionIds: selectedQuestions.map(q => q.id),
                                autoReleaseResult: currentAutoTestConfig.autoReleaseResult,
                                showSolution: currentAutoTestConfig.showSolution,
                                showLeaderboard: currentAutoTestConfig.showLeaderboard,
                                status: 'active',
                                createdBy: 'auto',
                                createdByName: 'Auto Test',
                                createdAt: Date.now()
                              })
                              setLiveTestStartedAt(Date.now())
                              setLiveTestCurrentQ(0)
                              setLiveTestAnswers({})
                            }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Now!
                            </Button>
                          ) : (
                            <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                              ⏰ Available: {currentAutoTestConfig.startTime} - {currentAutoTestConfig.endTime}
                            </span>
                          )}
                        </div>
                        {isAutoTestActive && !hasCompletedTodayAutoTest && (
                          <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-2">
                            ⚡ Live now! Available until {currentAutoTestConfig.endTime} today
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Sub-tabs */}
                  <div className="flex gap-2 border-b pb-2 mb-4">
                    <Button 
                      variant={liveTestTab === 'upcoming' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setLiveTestTab('upcoming')}
                    >
                      <Clock className="h-4 w-4 mr-1" /> Upcoming
                    </Button>
                    {activeLiveTest && (
                      <Button 
                        variant={liveTestTab === 'active' ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => setLiveTestTab('active')}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Play className="h-4 w-4 mr-1" /> Active Now!
                      </Button>
                    )}
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
                  
                  {/* Upcoming Tests */}
                  {liveTestTab === 'upcoming' && (
                    <div className="space-y-4">
                      {upcomingLiveTests.length === 0 ? (
                        <Card className="p-8 text-center">
                          <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Upcoming Tests</h3>
                          <p className="text-muted-foreground">Check back later for scheduled tests</p>
                        </Card>
                      ) : (
                        upcomingLiveTests.map(test => (
                          <Card key={test.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{test.title}</h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span><Calendar className="h-4 w-4 inline mr-1" /> {new Date(test.startTime).toLocaleDateString()}</span>
                                  <span><Clock className="h-4 w-4 inline mr-1" /> {new Date(test.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span><Target className="h-4 w-4 inline mr-1" /> {test.questionIds.length} questions</span>
                                  <span><Clock className="h-4 w-4 inline mr-1" /> {test.duration} min</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-primary">{formatCountdown(test.startTime)}</div>
                                <p className="text-xs text-muted-foreground">until start</p>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                  
                  {/* Active Test */}
                  {liveTestTab === 'active' && activeLiveTest && (
                    <Card className="p-6 border-2 border-green-500">
                      <div className="flex items-center gap-2 text-green-600 mb-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-semibold">LIVE NOW</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{activeLiveTest.title}</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="text-2xl font-bold">{activeLiveTest.questionIds.length}</div>
                          <p className="text-xs text-muted-foreground">Questions</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="text-2xl font-bold">{activeLiveTest.duration}</div>
                          <p className="text-xs text-muted-foreground">Minutes</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="text-2xl font-bold text-red-500">{formatCountdown(activeLiveTest.endTime)}</div>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="text-2xl font-bold">{getLiveTestResultsByTest(activeLiveTest.id).filter(r => r.status === 'submitted').length}</div>
                          <p className="text-xs text-muted-foreground">Submitted</p>
                        </div>
                      </div>
                      
                      {(() => {
                        const myResult = getMyResult(activeLiveTest.id)
                        if (myResult?.status === 'submitted') {
                          return (
                            <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded">
                              <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                              <p className="font-medium">You have submitted this test</p>
                              <p className="text-sm text-muted-foreground">Result will be available after test ends</p>
                            </div>
                          )
                        }
                        return (
                          <Button size="lg" className="w-full" onClick={() => startLiveTest(activeLiveTest)}>
                            <Play className="h-5 w-5 mr-2" /> 
                            {myResult?.status === 'in-progress' ? 'Continue Test' : 'Start Test'}
                          </Button>
                        )
                      })()}
                    </Card>
                  )}
                  
                  {/* Past Tests */}
                  {liveTestTab === 'past' && (
                    <div className="space-y-4">
                      {pastLiveTests.length === 0 ? (
                        <Card className="p-8 text-center">
                          <History className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Past Tests</h3>
                          <p className="text-muted-foreground">Completed tests will appear here</p>
                        </Card>
                      ) : (
                        pastLiveTests.map(test => {
                          const myResult = getMyResult(test.id)
                          const leaderboard = getLiveTestLeaderboard(test.id)
                          const canView = canViewResult(test, myResult?.submittedAt)
                          
                          return (
                            <Card key={test.id} className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold">{test.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(test.endTime).toLocaleDateString()} • {test.questionIds.length} questions
                                  </p>
                                </div>
                                <div className="text-right">
                                  {myResult && canView ? (
                                    <div className={`text-2xl font-bold ${myResult.score >= 80 ? 'text-green-500' : myResult.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                      {myResult.score}%
                                    </div>
                                  ) : myResult && test.resultReleaseTime ? (
                                    <div className="text-sm text-orange-500 flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      Result at {getResultReleaseMessage(test.resultReleaseTime)}
                                    </div>
                                  ) : myResult ? (
                                    <span className="text-sm text-muted-foreground">Result pending</span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Not attempted</span>
                                  )}
                                </div>
                              </div>
                              
                              {canView && (
                                <div className="flex gap-2 mt-3">
                                  {myResult && test.showSolution && (
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
                                  )}
                                  {test.showLeaderboard && leaderboard.length > 0 && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedLiveTest(test)
                                        setLiveTestTab('results')
                                      }}
                                    >
                                      <Trophy className="h-4 w-4 mr-1" /> Leaderboard
                                    </Button>
                                  )}
                                </div>
                              )}
                              
                              {myResult && !canView && test.resultReleaseTime && (
                                <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Test submitted! Result will be available at {getResultReleaseMessage(test.resultReleaseTime)}
                                </div>
                              )}
                            </Card>
                          )
                        })
                      )}
                    </div>
                  )}
                  
                  {/* Results / Leaderboard */}
                  {liveTestTab === 'results' && (
                    <div className="space-y-4">
                      {/* Selected Test Leaderboard */}
                      {selectedLiveTest ? (
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                {selectedLiveTest.title} - Leaderboard
                              </CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedLiveTest(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const leaderboard = getLiveTestLeaderboard(selectedLiveTest.id)
                              if (leaderboard.length === 0) {
                                return <p className="text-muted-foreground text-center py-4">No results yet</p>
                              }
                              return (
                                <div className="space-y-2">
                                  {leaderboard.map((result, idx) => (
                                    <div 
                                      key={result.id} 
                                      className={`flex items-center justify-between p-3 rounded ${
                                        idx === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300' :
                                        idx === 1 ? 'bg-gray-100 dark:bg-gray-800/50 border border-gray-300' :
                                        idx === 2 ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-300' :
                                        'bg-muted/30'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                          idx === 0 ? 'bg-yellow-500 text-white' :
                                          idx === 1 ? 'bg-gray-400 text-white' :
                                          idx === 2 ? 'bg-orange-500 text-white' :
                                          'bg-muted text-muted-foreground'
                                        }`}>
                                          {idx + 1}
                                        </div>
                                        <div>
                                          <p className="font-medium">
                                            {result.userName}
                                            {result.userId === user?.id && <span className="text-xs text-primary ml-1">(You)</span>}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {Math.floor(result.timeTaken / 60)}:{String(result.timeTaken % 60).padStart(2, '0')} • {result.correct}/{result.total} correct
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-xl font-bold">{result.score}%</div>
                                    </div>
                                  ))}
                                </div>
                              )
                            })()}
                          </CardContent>
                        </Card>
                      ) : (
                        /* My Results Summary */
                        <Card>
                          <CardHeader>
                            <CardTitle>My Live Test Results</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const myResults = liveTestResults.filter(r => r.userId === user?.id && r.status === 'submitted')
                              if (myResults.length === 0) {
                                return <p className="text-muted-foreground text-center py-4">No results yet. Take a live test!</p>
                              }
                              return (
                                <div className="space-y-2">
                                  {myResults.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0)).map(result => {
                                    const test = liveTests.find(t => t.id === result.liveTestId)
                                    if (!test) return null
                                    const canView = canViewResult(test)
                                    
                                    return (
                                      <div key={result.id} className="flex items-center justify-between p-3 border rounded">
                                        <div>
                                          <p className="font-medium">{test.title}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : ''} • {result.correct}/{result.total} correct
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          {canView ? (
                                            <>
                                              <div className={`text-xl font-bold ${result.score >= 80 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                {result.score}%
                                              </div>
                                              {test.showSolution && (
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => {
                                                    setViewingLiveTestResult(result)
                                                    setViewingLiveTestSolutions(true)
                                                  }}
                                                >
                                                  <Eye className="h-4 w-4" />
                                                </Button>
                                              )}
                                            </>
                                          ) : (
                                            <span className="text-sm text-muted-foreground">Result pending</span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })()}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-3 sm:space-y-4">
              {/* Page Title */}
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h2 className="text-base sm:text-lg font-semibold">Group Settings</h2>
              </div>

              {/* Members Section - Everyone can see */}
              <Card className="border-2">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      Members
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                        {activeGroup?.members.length}
                      </span>
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={copyGroupCode} className="h-7 text-xs">
                      <Copy className="h-3 w-3 sm:mr-1.5" /> <span className="hidden sm:inline">Invite Code</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-3 sm:px-6">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeGroup?.members.map(member => {
                      const isSelf = member.userId === user?.id;
                      const isOnlyAdmin = activeGroup.members.filter(m => m.role === 'admin').length === 1 && member.role === 'admin';
                      
                      return (
                        <div key={member.userId} className="flex items-center justify-between p-2 sm:p-2.5 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                              <AvatarFallback className="text-xs sm:text-sm">{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-xs sm:text-sm leading-tight">
                                {member.name} {isSelf && <span className="text-muted-foreground">(You)</span>}
                              </p>
                              <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {member.role === 'admin' && <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />}
                            
                            {/* Admin actions - not on self if only admin */}
                            {isAdmin && !isSelf && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  {/* Role change options */}
                                  {member.role !== 'admin' && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const updatedMembers = activeGroup.members.map(m => 
                                          m.userId === member.userId ? { ...m, role: 'admin' as const } : m
                                        );
                                        updateGroup({ ...activeGroup, members: updatedMembers });
                                      }}
                                    >
                                      <Crown className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                                      Make Admin
                                    </DropdownMenuItem>
                                  )}
                                  {member.role === 'admin' && !isOnlyAdmin && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const updatedMembers = activeGroup.members.map(m => 
                                          m.userId === member.userId ? { ...m, role: 'member' as const } : m
                                        );
                                        updateGroup({ ...activeGroup, members: updatedMembers });
                                      }}
                                    >
                                      <Users className="h-3.5 w-3.5 mr-2" />
                                      Make Member
                                    </DropdownMenuItem>
                                  )}
                                  {member.role !== 'moderator' && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const updatedMembers = activeGroup.members.map(m => 
                                          m.userId === member.userId ? { ...m, role: 'moderator' as const } : m
                                        );
                                        updateGroup({ ...activeGroup, members: updatedMembers });
                                      }}
                                    >
                                      <Settings className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                      Make Moderator
                                    </DropdownMenuItem>
                                  )}
                                  {/* Remove member */}
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => {
                                      if (confirm(`Remove ${member.name} from this group?`)) {
                                        const updatedMembers = activeGroup.members.filter(m => m.userId !== member.userId);
                                        const updatedMemberIds = activeGroup.memberIds.filter(id => id !== member.userId);
                                        updateGroup({ 
                                          ...activeGroup, 
                                          members: updatedMembers,
                                          memberIds: updatedMemberIds
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Admin Only Settings */}
              {isAdmin && (
                <>
                {/* Live Test Management - Using Shared Component */}
                <Card className="p-4 border-2 border-green-200 dark:border-green-800">
                  <LiveTestManagement
                    context="group"
                    contextId={activeGroupId || undefined}
                    categories={groupCategories.map(c => ({
                      id: c.id,
                      name: c.name,
                      questionCount: groupMCQList.filter(m => m.categoryId === c.id).length
                    }))}
                    scheduledTests={upcomingLiveTests.map(t => ({
                      id: t.id,
                      title: t.title,
                      duration: t.duration,
                      questionCount: t.questionIds.length,
                      showSolution: t.showSolution,
                      status: t.status as 'scheduled' | 'active' | 'completed',
                      createdAt: t.createdAt,
                      categoryIds: t.categoryIds || [],
                      difficulty: t.difficulty,
                    }))}
                    autoTestConfig={currentAutoTestConfig ? {
                      id: currentAutoTestConfig.id,
                      enabled: currentAutoTestConfig.enabled,
                      title: currentAutoTestConfig.title,
                      categoryIds: currentAutoTestConfig.categoryIds,
                      startTime: currentAutoTestConfig.startTime,
                      endTime: currentAutoTestConfig.endTime,
                      duration: currentAutoTestConfig.duration,
                      questionCount: currentAutoTestConfig.questionCount,
                      activeDays: currentAutoTestConfig.activeDays,
                      showSolution: currentAutoTestConfig.showSolution,
                      showLeaderboard: currentAutoTestConfig.showLeaderboard,
                      resultReleaseTime: currentAutoTestConfig.resultReleaseTime || currentAutoTestConfig.endTime,
                      showDetailedAnalysis: currentAutoTestConfig.showDetailedAnalysis ?? true,
                      difficulty: currentAutoTestConfig.difficulty || 'all',
                      createdAt: currentAutoTestConfig.createdAt,
                      updatedAt: currentAutoTestConfig.updatedAt,
                    } : null}
                    totalMCQCount={groupMCQList.length}
                    onCreateTest={handleCreateTestFromShared}
                    onDeleteTest={handleDeleteTestFromShared}
                    onSaveAutoConfig={handleSaveAutoConfigFromShared}
                    showSourceSelector={true}
                    showDateTimeScheduling={true}
                    isAdmin={isAdmin}
                    assetSubjects={assetSubjects}
                    getTopicsForSubject={(subjectId) => getAssetTopicsBySubject(subjectId)}
                    getSubtopicsForTopic={(topicId) => getAssetSubtopicsByTopic(topicId)}
                    getLibraryMCQCount={(subjectId, topicId, subtopicId) => {
                      let filtered = allAssets.filter(a => a.type === 'mcq' && a.subjectId === subjectId)
                      if (topicId) filtered = filtered.filter(a => a.topicId === topicId)
                      if (subtopicId) filtered = filtered.filter(a => a.subtopicId === subtopicId)
                      return filtered.length
                    }}
                  />
                </Card>

                {/* Question Bank */}
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="h-5 w-5 text-purple-500" />
                      Question Bank
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full">
                        {groupMCQList.length} questions
                      </span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {groupCategories.length} categories
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {/* Add Category */}
                    <div className="flex gap-2">
                      <Input 
                        placeholder="New category name..." 
                        value={newCategoryName} 
                        onChange={e => setNewCategoryName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                        className="flex-1"
                      />
                      <Button onClick={handleAddCategory} size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>

                    {/* Question Upload Tabs */}
                    <div className="flex gap-1 p-1 bg-muted rounded-lg">
                      <button
                        onClick={() => setQuestionBankTab('single')}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          questionBankTab === 'single'
                            ? 'bg-background shadow text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        ✏️ Single
                      </button>
                      <button
                        onClick={() => setQuestionBankTab('group')}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          questionBankTab === 'group'
                            ? 'bg-background shadow text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        📋 Group
                      </button>
                      <button
                        onClick={() => setQuestionBankTab('instant')}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          questionBankTab === 'instant'
                            ? 'bg-background shadow text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        ⚡ Instant
                      </button>
                    </div>

                    {/* Single Upload Tab */}
                    {questionBankTab === 'single' && groupCategories.length > 0 && (
                      <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                        <p className="text-sm font-medium">Add Single Question (MCQ)</p>
                        <Textarea 
                          placeholder="Enter your question here..." 
                          value={qbQuestion} 
                          onChange={e => setQbQuestion(e.target.value)} 
                          rows={2} 
                          className="text-sm"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[0, 1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-1.5">
                              <input 
                                type="radio" 
                                name="qbCorrect" 
                                checked={qbCorrect === i} 
                                onChange={() => setQbCorrect(i)} 
                                className="w-3.5 h-3.5" 
                              />
                              <span className={`font-medium text-sm w-5 ${qbCorrect === i ? 'text-green-600' : ''}`}>
                                {i + 1}.
                              </span>
                              <Input 
                                placeholder={`Option ${i + 1}`} 
                                value={qbOptions[i]} 
                                onChange={e => {
                                  const newOpts = [...qbOptions]
                                  newOpts[i] = e.target.value
                                  setQbOptions(newOpts)
                                }}
                                className="flex-1 h-8 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Select value={qbCategoryId} onValueChange={setQbCategoryId}>
                            <SelectTrigger className="w-40 h-8 text-sm">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {groupCategories.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={handleAddQuestion} size="sm">
                            <Plus className="h-4 w-4 mr-1" /> Add Question
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Group Upload Tab */}
                    {questionBankTab === 'group' && (
                      <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 space-y-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">📋 Bulk Upload Questions</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload Excel (.xlsx) or Word (.docx) file
                          </p>
                        </div>
                        
                        {/* File Format Info */}
                        <div className="text-xs bg-white dark:bg-gray-900 p-3 rounded border space-y-2">
                          <p className="font-medium">📄 Excel Format (8 columns):</p>
                          <p className="text-muted-foreground pl-2">Question | Option 1 | Option 2 | Option 3 | Option 4 | Correct (1/2/3/4) | Explanation | Difficulty (easy/medium/hard)</p>
                          <p className="font-medium mt-2">📝 Word Format:</p>
                          <div className="text-muted-foreground pl-2 whitespace-pre-line">
{`1. Question text here
1) Option 1
2) Option 2
3) Option 3
4) Option 4
Ans: 1
Exp: ব্যাখ্যা (optional)
Diff: medium (optional)`}
                          </div>
                        </div>
                        
                        {/* File Upload */}
                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            accept=".xlsx,.xls,.docx"
                            onChange={handleGroupUploadFile}
                            className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                          />
                          {groupUploadFile && (
                            <p className="text-xs text-muted-foreground">
                              Selected: {groupUploadFile.name}
                            </p>
                          )}
                        </div>
                        
                        {/* Loading */}
                        {groupUploadLoading && (
                          <div className="text-center py-4">
                            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-blue-500" />
                            <p className="text-xs text-muted-foreground mt-2">Parsing file...</p>
                          </div>
                        )}
                        
                        {/* Error */}
                        {groupUploadError && (
                          <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs">
                            ❌ {groupUploadError}
                          </div>
                        )}
                        
                        {/* Parsed Questions Preview */}
                        {groupUploadParsedQuestions.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                ✅ {groupUploadParsedQuestions.length} questions parsed
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setGroupUploadFile(null)
                                  setGroupUploadParsedQuestions([])
                                }}
                                className="h-6 text-xs"
                              >
                                Clear
                              </Button>
                            </div>
                            
                            {/* Preview list */}
                            <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2 bg-white dark:bg-gray-900">
                              {groupUploadParsedQuestions.slice(0, 5).map((q, idx) => (
                                <div key={idx} className="text-xs border-b pb-2 last:border-0">
                                  <p className="font-medium truncate">{idx + 1}. {q.question}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {q.options.map((opt, i) => (
                                      <span 
                                        key={i} 
                                        className={`px-1.5 py-0.5 rounded ${i === q.correctIndex ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                      >
                                        {i + 1}. {opt.slice(0, 15)}{opt.length > 15 ? '...' : ''}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {groupUploadParsedQuestions.length > 5 && (
                                <p className="text-xs text-muted-foreground text-center">
                                  +{groupUploadParsedQuestions.length - 5} more questions...
                                </p>
                              )}
                            </div>
                            
                            {/* Category Selection & Save */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Select value={groupUploadCategory} onValueChange={setGroupUploadCategory}>
                                <SelectTrigger className="w-40 h-8 text-xs">
                                  <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {groupCategories.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                onClick={handleGroupUploadSave}
                                disabled={!groupUploadCategory || groupUploadLoading}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Save All ({groupUploadParsedQuestions.length})
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {groupCategories.length === 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                            ⚠️ Add a category first before uploading
                          </p>
                        )}
                      </div>
                    )}

                    {/* Instant Download Tab - Content Library */}
                    {questionBankTab === 'instant' && (
                      <div className="space-y-4">
                        {/* Library Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-amber-500" />
                            <span className="font-medium">Content Library</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {libraryPacks.length} পacks available
                          </span>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-3 gap-2">
                          {/* Subject Filter */}
                          <select
                            className="text-xs px-2 py-1.5 border rounded bg-background"
                            value={librarySubjectId || ''}
                            onChange={(e) => {
                              setLibrarySubject(e.target.value || null)
                              setLibraryTopic(null)
                            }}
                          >
                            <option value="">All Subjects</option>
                            {librarySubjects.map(s => (
                              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                            ))}
                          </select>

                          {/* Topic Filter */}
                          <select
                            className="text-xs px-2 py-1.5 border rounded bg-background"
                            value={libraryTopicId || ''}
                            onChange={(e) => setLibraryTopic(e.target.value || null)}
                            disabled={!librarySubjectId}
                          >
                            <option value="">All Topics</option>
                            {librarySubjectId && getLibraryTopicsBySubject(librarySubjectId).map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>

                          {/* Price Filter */}
                          <select
                            className="text-xs px-2 py-1.5 border rounded bg-background"
                            value={libraryFilterPricing}
                            onChange={(e) => setLibraryFilterPricing(e.target.value as 'all' | 'free' | 'paid')}
                          >
                            <option value="all">All</option>
                            <option value="free">🆓 Free Only</option>
                            <option value="paid">💎 Paid Only</option>
                          </select>
                        </div>

                        {/* Content Packs Grid */}
                        <div className="grid gap-2 max-h-[350px] overflow-y-auto">
                          {(() => {
                            let filteredPacks = libraryPacks
                            
                            // Filter by subject
                            if (librarySubjectId) {
                              filteredPacks = getLibraryPacksBySubject(librarySubjectId)
                            }
                            
                            // Filter by topic
                            if (libraryTopicId) {
                              filteredPacks = getLibraryPacksByTopic(libraryTopicId)
                            }
                            
                            // Filter by pricing
                            if (libraryFilterPricing !== 'all') {
                              filteredPacks = filteredPacks.filter(p => p.pricing === libraryFilterPricing)
                            }

                            if (filteredPacks.length === 0) {
                              return (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No content packs found</p>
                                  <p className="text-xs mt-1">Try changing your filters</p>
                                </div>
                              )
                            }

                            return filteredPacks.map(pack => {
                              const subject = librarySubjects.find(s => s.id === pack.subjectId)
                              const topic = libraryTopics.find(t => t.id === pack.topicId)
                              const downloaded = user ? hasLibraryDownloaded(pack.id, user.id) : false
                              
                              return (
                                <div 
                                  key={pack.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                    librarySelectedPack?.id === pack.id 
                                      ? 'border-primary bg-primary/5' 
                                      : 'hover:border-primary/50'
                                  } ${downloaded ? 'opacity-60' : ''}`}
                                  onClick={() => setLibrarySelectedPack(pack)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{pack.contentType === 'mcq' ? '📝' : pack.contentType === 'notes' ? '📖' : '📦'}</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">{pack.title}</p>
                                          <p className="text-[10px] text-muted-foreground">
                                            {subject?.icon} {subject?.name} • {topic?.name}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {pack.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2 text-[10px]">
                                        {pack.mcqCount > 0 && (
                                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                            {pack.mcqCount} MCQs
                                          </span>
                                        )}
                                        {pack.notesCount > 0 && (
                                          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                                            {pack.notesCount} Notes
                                          </span>
                                        )}
                                        <span className="text-muted-foreground">
                                          ⬇️ {pack.downloadCount}
                                        </span>
                                        {downloaded && (
                                          <span className="text-green-600 font-medium">✓ Downloaded</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      {pack.pricing === 'free' ? (
                                        <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                          FREE
                                        </span>
                                      ) : (
                                        <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                                          ₹{pack.price}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>

                        {/* Download Section - Shows when a pack is selected */}
                        {librarySelectedPack && (
                          <div className="p-4 border-2 border-primary rounded-lg bg-primary/5 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold">{librarySelectedPack.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {librarySelectedPack.mcqCount > 0 && `${librarySelectedPack.mcqCount} MCQs`}
                                  {librarySelectedPack.mcqCount > 0 && librarySelectedPack.notesCount > 0 && ' • '}
                                  {librarySelectedPack.notesCount > 0 && `${librarySelectedPack.notesCount} Notes`}
                                </p>
                              </div>
                              <button 
                                onClick={() => setLibrarySelectedPack(null)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Preview Content */}
                            <div className="bg-background rounded-md p-2 max-h-[120px] overflow-y-auto">
                              <p className="text-[10px] font-medium text-muted-foreground mb-1">Preview:</p>
                              {librarySelectedPack.mcqCount > 0 && (
                                <div className="space-y-1">
                                  {getLibraryMcqsByPack(librarySelectedPack.id).slice(0, 3).map((mcq, idx) => (
                                    <p key={mcq.id} className="text-xs truncate">
                                      {idx + 1}. {mcq.question}
                                    </p>
                                  ))}
                                  {librarySelectedPack.mcqCount > 3 && (
                                    <p className="text-[10px] text-muted-foreground italic">
                                      +{librarySelectedPack.mcqCount - 3} more questions...
                                    </p>
                                  )}
                                </div>
                              )}
                              {librarySelectedPack.notesCount > 0 && (
                                <div className="space-y-1 mt-2">
                                  {getLibraryNotesByPack(librarySelectedPack.id).slice(0, 2).map((note) => (
                                    <p key={note.id} className="text-xs truncate">
                                      📄 {note.title}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Download Options - Only for MCQ packs */}
                            {librarySelectedPack.mcqCount > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium flex-1">MCQs Download to:</label>
                                  <select
                                    className="text-xs px-2 py-1.5 border rounded bg-background flex-1"
                                    value={libraryDownloadMode}
                                    onChange={(e) => setLibraryDownloadMode(e.target.value as 'new' | 'merge')}
                                  >
                                    <option value="new">New Category</option>
                                    <option value="merge">Existing Category</option>
                                  </select>
                                </div>

                                {libraryDownloadMode === 'new' ? (
                                  <Input
                                    placeholder="New category name..."
                                    value={libraryNewCategoryName}
                                    onChange={(e) => setLibraryNewCategoryName(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                ) : (
                                  <select
                                    className="w-full text-xs px-2 py-1.5 border rounded bg-background"
                                    value={libraryDownloadCategory}
                                    onChange={(e) => setLibraryDownloadCategory(e.target.value)}
                                  >
                                    <option value="">Select category...</option>
                                    {groupCategories.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            )}

                            {/* Download Button */}
                            <Button
                              className="w-full"
                              disabled={
                                (user ? hasLibraryDownloaded(librarySelectedPack.id, user.id) : true) ||
                                (librarySelectedPack.mcqCount > 0 && libraryDownloadMode === 'new' && !libraryNewCategoryName.trim()) ||
                                (librarySelectedPack.mcqCount > 0 && libraryDownloadMode === 'merge' && !libraryDownloadCategory)
                              }
                              onClick={() => {
                                if (!activeGroupId || !user) return

                                // Download MCQs
                                if (librarySelectedPack.mcqCount > 0) {
                                  const mcqs = getLibraryMcqsByPack(librarySelectedPack.id)
                                  
                                  let targetCategoryId = libraryDownloadCategory
                                  
                                  // Create new category if needed
                                  if (libraryDownloadMode === 'new') {
                                    const newCatId = `cat_${Date.now()}`
                                    addQuestionCategory({
                                      id: newCatId,
                                      groupId: activeGroupId,
                                      name: libraryNewCategoryName.trim(),
                                      createdAt: Date.now(),
                                    })
                                    targetCategoryId = newCatId
                                  }

                                  // Add MCQs to the category
                                  mcqs.forEach(mcq => {
                                    addGroupMCQ({
                                      id: `mcq_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                      groupId: activeGroupId,
                                      categoryId: targetCategoryId,
                                      question: mcq.question,
                                      options: mcq.options,
                                      correctIndex: mcq.correctIndex,
                                      createdBy: user.id,
                                      createdByName: user.displayName,
                                      createdAt: Date.now(),
                                    })
                                  })
                                }

                                // Download Notes
                                if (librarySelectedPack.notesCount > 0) {
                                  const notes = getLibraryNotesByPack(librarySelectedPack.id)
                                  
                                  // Create a new topic for notes
                                  const topicId = `topic_${Date.now()}`
                                  addTopic({
                                    id: topicId,
                                    groupId: activeGroupId,
                                    name: librarySelectedPack.title,
                                    order: groupTopics.length,
                                    createdAt: Date.now(),
                                  })

                                  // Add notes as content items
                                  notes.forEach((note, idx) => {
                                    addContentItem({
                                      id: `content_${Date.now()}_${idx}`,
                                      topicId: topicId,
                                      subTopicId: '',
                                      groupId: activeGroupId,
                                      type: 'note',
                                      title: note.title,
                                      content: note.content,
                                      source: 'library',  // Admin/Library content - trusted
                                      order: idx,
                                      createdBy: user.id,
                                      createdByName: user.displayName,
                                      createdAt: Date.now(),
                                      updatedAt: Date.now(),
                                    })
                                  })
                                }

                                // Mark as downloaded
                                addLibraryDownload({
                                  id: `dl_${Date.now()}`,
                                  userId: user.id,
                                  packId: librarySelectedPack.id,
                                  packTitle: librarySelectedPack.title,
                                  subjectId: librarySelectedPack.subjectId,
                                  topicId: librarySelectedPack.topicId,
                                  pricing: librarySelectedPack.pricing,
                                  downloadedAt: Date.now(),
                                })
                                
                                // Success message
                                const mcqMsg = librarySelectedPack.mcqCount > 0 ? `${librarySelectedPack.mcqCount} MCQs` : ''
                                const noteMsg = librarySelectedPack.notesCount > 0 ? `${librarySelectedPack.notesCount} Notes` : ''
                                const separator = mcqMsg && noteMsg ? ' and ' : ''
                                alert(`✅ ${mcqMsg}${separator}${noteMsg} downloaded successfully!`)

                                // Reset
                                setLibrarySelectedPack(null)
                                setLibraryDownloadCategory('')
                                setLibraryNewCategoryName('')
                                setLibraryDownloadMode('new')
                              }}
                            >
                              {user && hasLibraryDownloaded(librarySelectedPack.id, user.id) ? (
                                <>✓ Already Downloaded</>
                              ) : librarySelectedPack.pricing === 'paid' ? (
                                <>🔒 Buy for ₹{librarySelectedPack.price}</>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Free
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {questionBankTab === 'single' && groupCategories.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Add a category first to start adding questions.
                      </p>
                    )}

                    {/* Categories with Questions */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {groupCategories.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No categories yet. Add a category first.
                        </p>
                      ) : (
                        groupCategories.map(category => {
                          const categoryQuestions = getMCQsByCategory(category.id)
                          const isExpanded = expandedQbCategories.includes(category.id)
                          
                          return (
                            <div key={category.id} className="border rounded-lg overflow-hidden">
                              {/* Category Header */}
                              <div 
                                className="flex items-center justify-between p-2.5 bg-muted/50 cursor-pointer hover:bg-muted"
                                onClick={() => toggleQbCategory(category.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  <span className="font-medium text-sm">{category.name}</span>
                                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                    {categoryQuestions.length}
                                  </span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm(`Delete category "${category.name}" and all its questions?`)) {
                                      removeQuestionCategory(category.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              
                              {/* Questions List */}
                              {isExpanded && (
                                <div className="divide-y max-h-[200px] overflow-y-auto">
                                  {categoryQuestions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground p-2.5">No questions</p>
                                  ) : (
                                    categoryQuestions.map((q, idx) => (
                                      <div key={q.id} className="p-2.5 hover:bg-muted/30">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">
                                              {idx + 1}. {q.question}
                                              {(q as any).assetRef && <span className="ml-1 text-green-500" title="Synced with Library">🔗</span>}
                                            </p>
                                            <div className="mt-1 grid grid-cols-2 gap-0.5 text-[10px] text-muted-foreground">
                                              {q.options.map((opt, i) => (
                                                <span key={i} className={`truncate ${i === q.correctIndex ? 'text-green-600 font-medium' : ''}`}>
                                                  {i + 1}. {opt} {i === q.correctIndex && '✓'}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="flex gap-1 flex-shrink-0">
                                            <button 
                                              onClick={() => handleEditMcq(q)} 
                                              className="text-blue-500 hover:text-blue-700"
                                              title="Edit MCQ"
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button 
                                              onClick={() => {
                                                if (confirm('Delete this question?')) {
                                                  removeGroupMCQ(q.id)
                                                }
                                              }} 
                                              className="text-red-500 hover:text-red-700"
                                              title="Delete MCQ"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Group Settings - At Bottom */}
                <Card className="border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings className="h-5 w-5 text-orange-500" />
                      Group Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Group Name</label>
                        <Input 
                          value={activeGroup?.name || ''} 
                          onChange={e => activeGroup && updateGroup({ ...activeGroup, name: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Description</label>
                        <Input 
                          value={activeGroup?.description || ''} 
                          onChange={e => activeGroup && updateGroup({ ...activeGroup, description: e.target.value })}
                          className="h-9"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={syncAllToCloud}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <Upload className="h-4 w-4 mr-1.5" />
                          Sync to Cloud
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
                          onClick={() => {
                            if (confirm('This will clear all local data and re-download from cloud. Continue?')) {
                              const state = useGroupStore.getState()
                              useGroupStore.setState({
                                topics: state.topics.filter(t => t.groupId !== activeGroupId),
                                contentItems: state.contentItems.filter(ci => ci.groupId !== activeGroupId),
                                groupMCQs: state.groupMCQs.filter(m => m.groupId !== activeGroupId),
                                questionCategories: state.questionCategories.filter(c => c.groupId !== activeGroupId),
                              })
                              syncGroupFromCloud(activeGroupId!)
                              alert('Data cleared and re-syncing from cloud!')
                            }
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-1.5" />
                          Resync Data
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Sync uploads content to cloud • Resync fixes duplicate content issues
                      </p>
                    </div>

                    <div className="pt-3 border-t">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => requestDelete('group', activeGroup!.id, activeGroup!.name)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1.5" />
                        Delete Group
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Requires 50% member approval
                      </p>
                    </div>
                  </CardContent>
                </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Create Group Dialog - Mobile optimized */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <Card className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl mx-0 sm:mx-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Create New Group</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:hidden" onClick={() => setShowCreateGroup(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              <Input className="h-10" placeholder="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
              <Input className="h-10" placeholder="Description (optional)" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
                <Button className="flex-1 h-10" onClick={handleCreateGroup}>Create</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Join Group Dialog - Mobile optimized */}
      {showJoinGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <Card className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl mx-0 sm:mx-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Join Group</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:hidden" onClick={() => setShowJoinGroup(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              <Input className="h-12 text-center text-xl tracking-widest font-mono uppercase" placeholder="Enter Code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
              <p className="text-xs text-center text-muted-foreground">Enter the 6-character group code</p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setShowJoinGroup(false)}>Cancel</Button>
                <Button className="flex-1 h-10" onClick={handleJoinGroup}>Join</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Content Modal - Mobile fullscreen */}
      {editingContent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <Card className="w-full sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-xl">
            <CardHeader className="flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-base sm:text-lg truncate pr-2">Edit: {editingContent.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant={showEditSourceCode ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowEditSourceCode(!showEditSourceCode)}
                  className="h-8"
                >
                  <Code className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Source</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:hidden" onClick={() => { setEditingContent(null); setShowEditSourceCode(false) }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {showEditSourceCode ? (
                <div>
                  <Textarea 
                    placeholder="Enter HTML code here..."
                    value={editingContent.content}
                    onChange={(e) => setEditingContent({ ...editingContent, content: e.target.value })}
                    className="font-mono text-sm min-h-[350px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 You can add HTML, iFrame, embed codes for games, videos etc.
                  </p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <ReactQuill 
                    theme="snow"
                    value={editingContent.content}
                    onChange={(content) => setEditingContent({ ...editingContent, content })}
                    modules={quillModules}
                    style={{ height: '300px' }}
                  />
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t flex gap-2 justify-end mt-12">
              <Button variant="outline" onClick={() => { setEditingContent(null); setShowEditSourceCode(false) }}>Cancel</Button>
              <Button onClick={async () => {
                const updated = { ...editingContent, updatedAt: Date.now() }
                updateContentItem(updated)
                // Also save to Firestore
                try {
                  await setDoc(doc(db, 'contentItems', updated.id), updated)
                } catch (err) {
                  console.error('Error updating content in Firestore:', err)
                  alert('❌ Firestore এ update করতে সমস্যা হয়েছে!')
                }
                setEditingContent(null)
                setShowEditSourceCode(false)
              }}>Save</Button>
            </div>
          </Card>
        </div>
      )}


      {/* Sahityapath Style Add Item Modal - Mobile bottom sheet */}
      {showAddItemModal && addingToTopicId && !showItemDetailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <Card className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">
                {addContentMode === 'choose' ? 'Add Content' : addContentMode === 'manual' ? 'Create new item' : 'Import from Library'}
              </h3>
              <div className="flex items-center gap-1">
                {addContentMode !== 'choose' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setAddContentMode('choose')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setShowAddItemModal(false)
                    setAddingToTopicId(null)
                    setNewItemName('')
                    setNewItemType('note')
                    setAddContentMode('choose')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              {/* Step 1: Choose mode - Manually or Import from Library */}
              {addContentMode === 'choose' && (
                <div className="space-y-3">
                  <div 
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-primary/10 cursor-pointer border border-transparent hover:border-primary/30 transition-colors"
                    onClick={() => setAddContentMode('manual')}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">Manually</div>
                      <p className="text-sm text-muted-foreground">Create new content from scratch</p>
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-primary/10 cursor-pointer border border-transparent hover:border-primary/30 transition-colors"
                    onClick={() => {
                      setShowAddItemModal(false)
                      setAddContentMode('choose')
                      setShowImportFromLibrary(true)
                      setImportTargetTopicId(addingToTopicId)
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Library className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">Import from Library</div>
                      <p className="text-sm text-muted-foreground">Import MCQs or Notes from your library</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Manual content type selection */}
              {addContentMode === 'manual' && (
                <div className="space-y-2">
                  <div 
                    className="flex items-start gap-3 p-3 rounded hover:bg-primary/10 cursor-pointer border border-transparent hover:border-primary/30 transition-colors"
                    onClick={() => openItemDetailModal('heading')}
                  >
                    <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-primary" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Heading className="h-4 w-4 text-purple-500" /> Heading
                      </div>
                      <p className="text-sm text-muted-foreground">Define chapter section headings</p>
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-start gap-3 p-3 rounded hover:bg-primary/10 cursor-pointer border border-transparent hover:border-primary/30 transition-colors"
                    onClick={() => openItemDetailModal('note')}
                  >
                    <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-primary" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" /> PDF / Images
                      </div>
                      <p className="text-sm text-muted-foreground">Upload PDF or image files</p>
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-start gap-3 p-3 rounded hover:bg-primary/10 cursor-pointer border border-transparent hover:border-primary/30 transition-colors"
                    onClick={() => openItemDetailModal('text')}
                  >
                    <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-primary" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Type className="h-4 w-4 text-orange-500" /> Text
                      </div>
                      <p className="text-sm text-muted-foreground">Add custom text or iFrame and HTML</p>
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-start gap-3 p-3 rounded hover:bg-primary/10 cursor-pointer border border-transparent hover:border-primary/30 transition-colors"
                    onClick={() => openItemDetailModal('link')}
                  >
                    <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-primary" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Link className="h-4 w-4 text-cyan-500" /> Link (Video, Website etc.)
                      </div>
                      <p className="text-sm text-muted-foreground">Add link which will be embedded in iFrame</p>
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-start gap-3 p-3 rounded hover:bg-primary/10 cursor-pointer border border-transparent hover:border-primary/30 transition-colors"
                    onClick={() => openItemDetailModal('quiz')}
                  >
                    <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-primary" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-green-500" /> Quiz
                      </div>
                      <p className="text-sm text-muted-foreground">Learners can attempt any time & get results</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Item Detail Modal - Opens after selecting item type */}
      {showItemDetailModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">
                {newItemType === 'heading' && 'New heading'}
                {newItemType === 'text' && 'New text content'}
                {newItemType === 'link' && 'New link'}
                {newItemType === 'quiz' && 'New quiz'}
                {newItemType === 'note' && 'New PDF / Notes'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setShowItemDetailModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <CardContent className="p-6 space-y-4">
              {/* Title - Common for all */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {newItemType === 'heading' ? 'Heading name' : 'Title'} <span className="text-red-500">*</span>
                </label>
                <Input 
                  placeholder={newItemType === 'heading' ? 'New heading' : 'Title'}
                  value={itemDetailTitle}
                  onChange={e => setItemDetailTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* URL - For Link type */}
              {newItemType === 'link' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    placeholder="https://..."
                    value={itemDetailUrl}
                    onChange={e => setItemDetailUrl(e.target.value)}
                  />
                </div>
              )}

              {/* Rich Text - For Text type */}
              {newItemType === 'text' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Content</label>
                    <Button 
                      variant={showSourceCode ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setShowSourceCode(!showSourceCode)}
                      className="h-7 text-xs"
                    >
                      <Code className="h-3 w-3 mr-1" /> Source
                    </Button>
                  </div>
                  {showSourceCode ? (
                    <Textarea 
                      placeholder="Enter HTML code here..."
                      value={itemDetailContent}
                      onChange={e => setItemDetailContent(e.target.value)}
                      className="font-mono text-sm min-h-[250px]"
                    />
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <ReactQuill 
                        theme="snow"
                        value={itemDetailContent}
                        onChange={setItemDetailContent}
                        modules={quillModules}
                        style={{ height: '200px' }}
                      />
                    </div>
                  )}
                  {showSourceCode && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 You can add HTML, iFrame, embed codes for games, videos etc.
                    </p>
                  )}
                </div>
              )}

              {/* Note/PDF - File upload + Rich text editor */}
              {newItemType === 'note' && (
                <div className="space-y-4">
                  {/* File Upload Section */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Upload PDF or Images <span className="text-muted-foreground text-xs">(Max 10 files, 10MB each)</span>
                    </label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <input 
                        type="file"
                        multiple
                        accept=".pdf,image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload PDF or Images
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, PNG, JPG, GIF up to 10MB
                        </p>
                      </label>
                    </div>
                    
                    {/* Uploaded files list */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">{uploadedFiles.length} file(s) selected:</p>
                        {uploadedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-muted/50 rounded p-2 text-sm">
                            <span className="truncate flex-1">
                              {file.type === 'application/pdf' ? '📄' : '🖼️'} {file.name}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-500"
                              onClick={() => removeFile(idx)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Upload progress */}
                    {isUploading && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quiz - Time limit */}
              {newItemType === 'quiz' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Time Limit (in minutes) <span className="text-muted-foreground text-xs">Keep blank for no time limit</span>
                    </label>
                    <Input 
                      type="number"
                      placeholder="Time Limit (in minutes)"
                      value={quizTimeLimit}
                      onChange={e => setQuizTimeLimit(e.target.value)}
                    />
                  </div>
                  
                  {/* Question Bank Selection */}
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">Select Questions from Bank</label>
                      <span className="text-xs text-muted-foreground">
                        {selectedQBQuestions.length} selected
                      </span>
                    </div>
                    
                    {groupCategories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No questions in Question Bank. Add questions from Settings → Question Bank first.
                      </p>
                    ) : (
                      <>
                        {/* Selection Mode Toggle */}
                        <div className="flex gap-2 mb-3">
                          <Button 
                            type="button"
                            size="sm" 
                            variant={quizSelectionMode === 'manual' ? 'default' : 'outline'}
                            onClick={() => setQuizSelectionMode('manual')}
                          >
                            Manual Select
                          </Button>
                          <Button 
                            type="button"
                            size="sm" 
                            variant={quizSelectionMode === 'auto' ? 'default' : 'outline'}
                            onClick={() => setQuizSelectionMode('auto')}
                          >
                            Auto Random
                          </Button>
                        </div>
                        
                        {quizSelectionMode === 'auto' ? (
                          /* Auto Random Mode */
                          <div className="space-y-3 p-3 bg-background rounded border">
                            <div>
                              <label className="text-xs font-medium mb-1 block">Select Category</label>
                              <select
                                className="w-full border rounded p-2 text-sm bg-background"
                                value={autoRandomCategoryId}
                                onChange={e => setAutoRandomCategoryId(e.target.value)}
                              >
                                <option value="">-- Select Category --</option>
                                <option value="all">All Categories</option>
                                {groupCategories.map(cat => {
                                  const count = groupMCQs.filter((m: GroupMCQ) => m.groupId === activeGroup?.id && m.categoryId === cat.id).length
                                  return (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name} ({count} questions)
                                    </option>
                                  )
                                })}
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium mb-1 block">Number of Questions</label>
                              <Input
                                type="number"
                                placeholder="Enter number of questions"
                                value={autoRandomCount}
                                onChange={e => setAutoRandomCount(e.target.value)}
                                min="1"
                              />
                              {autoRandomCategoryId && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Available: {autoRandomCategoryId === 'all' 
                                    ? groupMCQs.filter((m: GroupMCQ) => m.groupId === activeGroup?.id).length
                                    : groupMCQs.filter((m: GroupMCQ) => m.groupId === activeGroup?.id && m.categoryId === autoRandomCategoryId).length
                                  } questions
                                </p>
                              )}
                            </div>
                            
                            <Button 
                              type="button"
                              size="sm"
                              className="w-full"
                              disabled={!autoRandomCategoryId || !autoRandomCount}
                              onClick={() => {
                                const count = parseInt(autoRandomCount)
                                if (!count || count < 1) return
                                
                                let availableQuestions: GroupMCQ[]
                                if (autoRandomCategoryId === 'all') {
                                  availableQuestions = groupMCQs.filter((m: GroupMCQ) => m.groupId === activeGroup?.id)
                                } else {
                                  availableQuestions = groupMCQs.filter((m: GroupMCQ) => m.groupId === activeGroup?.id && m.categoryId === autoRandomCategoryId)
                                }
                                
                                // Shuffle and pick
                                const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
                                const selected = shuffled.slice(0, Math.min(count, shuffled.length))
                                setSelectedQBQuestions(selected.map(q => q.id))
                                
                                // Reset
                                setAutoRandomCount('')
                              }}
                            >
                              <Shuffle className="h-4 w-4 mr-2" /> Generate Random Selection
                            </Button>
                          </div>
                        ) : (
                          /* Manual Mode - Category list */
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {groupCategories.map(cat => {
                              const catQuestions = groupMCQs.filter((m: GroupMCQ) => m.groupId === activeGroup?.id && m.categoryId === cat.id)
                              if (catQuestions.length === 0) return null
                              
                              return (
                                <div key={cat.id} className="border rounded bg-background">
                                  <button
                                    type="button"
                                    className="w-full flex items-center justify-between p-2 hover:bg-muted/50"
                                    onClick={() => {
                                      setExpandedQbCategories(prev => 
                                        prev.includes(cat.id) 
                                          ? prev.filter(id => id !== cat.id)
                                          : [...prev, cat.id]
                                      )
                                    }}
                                  >
                                    <span className="font-medium text-sm">{cat.name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">{catQuestions.length} questions</span>
                                      {expandedQbCategories.includes(cat.id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </div>
                                  </button>
                                  
                                  {expandedQbCategories.includes(cat.id) && (
                                    <div className="border-t p-2 space-y-1">
                                      {/* Select All in Category */}
                                      <button
                                        type="button"
                                        className="text-xs text-primary hover:underline mb-2"
                                        onClick={() => {
                                          const allInCat = catQuestions.map((q: GroupMCQ) => q.id)
                                          const allSelected = allInCat.every((id: string) => selectedQBQuestions.includes(id))
                                          if (allSelected) {
                                            setSelectedQBQuestions(prev => prev.filter(id => !allInCat.includes(id)))
                                          } else {
                                            setSelectedQBQuestions(prev => [...new Set([...prev, ...allInCat])])
                                          }
                                        }}
                                      >
                                        {catQuestions.every((q: GroupMCQ) => selectedQBQuestions.includes(q.id)) ? 'Deselect All' : 'Select All'}
                                      </button>
                                      
                                      {catQuestions.map((q: GroupMCQ) => (
                                        <label key={q.id} className="flex items-start gap-2 p-1 hover:bg-muted/30 rounded cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={selectedQBQuestions.includes(q.id)}
                                            onChange={e => {
                                              if (e.target.checked) {
                                                setSelectedQBQuestions(prev => [...prev, q.id])
                                              } else {
                                                setSelectedQBQuestions(prev => prev.filter(id => id !== q.id))
                                              }
                                            }}
                                            className="mt-1"
                                          />
                                          <span className="text-sm">{q.question}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        
                        {/* Clear Selection */}
                        {selectedQBQuestions.length > 0 && (
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:underline mt-2"
                            onClick={() => setSelectedQBQuestions([])}
                          >
                            Clear Selection ({selectedQBQuestions.length})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>

            <div className="flex justify-end gap-2 p-4 border-t mt-8">
              <Button variant="outline" onClick={() => setShowItemDetailModal(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleSubmitItemDetail} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Submit'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Content Viewer Modal - Mobile fullscreen */}
      {viewingContent && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <Card className="w-full sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-xl sm:mx-4">
            <CardHeader className="flex flex-row items-center justify-between border-b py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg truncate">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
                <span className="truncate">{viewingContent.title}</span>
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => setViewingContent(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto p-4 sm:p-6 flex-1">
              {viewingContent.type === 'note' && viewingContent.content ? (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:text-foreground 
                    prose-p:text-foreground 
                    prose-strong:text-foreground 
                    prose-li:text-foreground
                    prose-a:text-primary
                    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4
                    [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3
                    [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2
                    [&_p]:mb-3 [&_p]:leading-relaxed
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
                    [&_li]:mb-1
                    [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic
                    [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded
                    [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto
                    [&_table]:w-full [&_table]:border-collapse
                    [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted
                    [&_td]:border [&_td]:border-border [&_td]:p-2"
                  dangerouslySetInnerHTML={{ 
                    __html: smartSanitize(viewingContent.content, {
                      source: viewingContent.source,
                      isAdmin: viewingContent.source === 'library'
                    })
                  }}
                />
              ) : (
                <p className="text-muted-foreground">No content available</p>
              )}
            </CardContent>
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 p-3 sm:p-4 border-t">
              <ReportDialog
                groupId={viewingContent.groupId}
                contentId={viewingContent.id}
                contentType="note"
                contentTitle={viewingContent.title}
                creatorId={viewingContent.createdBy}
                creatorName={viewingContent.createdByName}
              />
              <div className="flex gap-2">
                {(isAdmin || viewingContent.createdBy === user?.id) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 sm:flex-none h-9"
                    onClick={() => {
                      setEditingContent(viewingContent)
                      setEditContent(viewingContent.content || '')
                      setViewingContent(null)
                    }}
                  >
                    <Pencil className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-9" onClick={() => setViewingContent(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Requests Modal - Mobile optimized */}
      {showDeleteRequests && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <Card className="w-full sm:max-w-lg h-[85vh] sm:h-auto sm:max-h-[80vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                Delete Requests
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteRequests(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {pendingDeleteRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending delete requests</p>
              ) : (
                <div className="space-y-4">
                  {pendingDeleteRequests.map(request => {
                    const { canResolve, approved } = canResolveRequest(request)
                    const hasVoted = request.approvedBy.includes(user?.id || '') || request.rejectedBy.includes(user?.id || '')
                    const totalMembers = activeGroup?.members.length || 1
                    const requiredVotes = Math.ceil(totalMembers * 0.5)
                    
                    return (
                      <div key={request.id} className={`border rounded-lg p-4 space-y-3 ${request.targetType === 'group' ? 'border-red-300 bg-red-50/30' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{request.targetName}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.targetType === 'group' ? '⚠️ Entire Group' : request.targetType === 'topic' ? 'Chapter' : 'Content Item'}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            request.requesterRole === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted'
                          }`}>
                            {request.requesterRole}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <p>Requested by: <span className="font-medium">{request.requesterName}</span></p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Voting info */}
                        <div className="bg-muted/50 rounded p-2 text-sm">
                          {request.requesterRole === 'admin' ? (
                            <>
                              <p>Admin request: Needs 50% member approval</p>
                              <p className="text-xs text-muted-foreground">
                                Approved: {request.approvedBy.length}/{requiredVotes} required
                              </p>
                            </>
                          ) : (
                            <p>Member request: Needs Admin approval</p>
                          )}
                        </div>

                        {/* Vote buttons */}
                        {!hasVoted && user && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => voteOnDeleteRequest(request.id, user.id, true)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => voteOnDeleteRequest(request.id, user.id, false)}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}

                        {hasVoted && (
                          <p className="text-sm text-center text-muted-foreground">
                            You have voted on this request
                          </p>
                        )}

                        {/* Execute delete if resolved */}
                        {canResolve && approved && isAdmin && (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="w-full"
                            onClick={() => {
                              executeDelete(request)
                              if (pendingDeleteRequests.length <= 1) {
                                setShowDeleteRequests(false)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Execute Delete
                          </Button>
                        )}

                        {canResolve && !approved && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => resolveDeleteRequest(request.id, false)}
                          >
                            Mark as Rejected
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Members Modal - Mobile optimized */}
      {showAssignModal && assigningTopicId && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <Card className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl">
            <CardHeader className="py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                Assign Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select members who can edit this chapter:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activeGroup?.members.map(member => (
                  <label 
                    key={member.userId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(member.userId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMemberIds(prev => [...prev, member.userId])
                        } else {
                          setSelectedMemberIds(prev => prev.filter(id => id !== member.userId))
                        }
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                    {member.role === 'admin' && (
                      <Crown className="h-4 w-4 text-yellow-500 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => {
                  setShowAssignModal(false)
                  setAssigningTopicId(null)
                  setSelectedMemberIds([])
                }}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  const topic = topics.find(t => t.id === assigningTopicId)
                  if (topic) {
                    updateTopic({ ...topic, assignedMembers: selectedMemberIds })
                  }
                  setShowAssignModal(false)
                  setAssigningTopicId(null)
                  setSelectedMemberIds([])
                }}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import from Library Modal */}
      {showImportFromLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Library className="h-5 w-5 text-purple-600" />
                  Import from Library
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowImportFromLibrary(false)
                  setSelectedAssetIds([])
                  setImportTargetTopicId(null)
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {/* Filter by Type */}
              <div className="flex flex-wrap gap-1 p-1 bg-muted rounded">
                <button
                  onClick={() => setImportAssetType('all')}
                  className={`px-2 py-1 rounded text-xs ${importAssetType === 'all' ? 'bg-background shadow' : ''}`}
                >
                  All
                </button>
                <button
                  onClick={() => setImportAssetType('mcq')}
                  className={`px-2 py-1 rounded text-xs ${importAssetType === 'mcq' ? 'bg-background shadow' : ''}`}
                >
                  MCQs
                </button>
                <button
                  onClick={() => setImportAssetType('note')}
                  className={`px-2 py-1 rounded text-xs ${importAssetType === 'note' ? 'bg-background shadow' : ''}`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setImportAssetType('url')}
                  className={`px-2 py-1 rounded text-xs ${importAssetType === 'url' ? 'bg-background shadow' : ''}`}
                >
                  Links
                </button>
                <button
                  onClick={() => setImportAssetType('pdf')}
                  className={`px-2 py-1 rounded text-xs ${importAssetType === 'pdf' ? 'bg-background shadow' : ''}`}
                >
                  PDFs
                </button>
                <button
                  onClick={() => setImportAssetType('video')}
                  className={`px-2 py-1 rounded text-xs ${importAssetType === 'video' ? 'bg-background shadow' : ''}`}
                >
                  Videos
                </button>
              </div>

              {/* Filter by Subject/Topic */}
              <div className="flex gap-2">
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
                      return true // Show all types: mcq, note, url, pdf, video
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
                              asset.type === 'mcq' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              asset.type === 'note' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              asset.type === 'url' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                              asset.type === 'pdf' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                              asset.type === 'video' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {asset.type.toUpperCase()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {assetSubjects.find(s => s.id === asset.subjectId)?.name}
                            </span>
                          </div>
                          <p className="text-sm mt-1 truncate">
                            {asset.type === 'mcq' 
                              ? (asset as any).question?.substring(0, 80) + ((asset as any).question?.length > 80 ? '...' : '')
                              : asset.title
                            }
                          </p>
                        </div>
                      </label>
                    ))
                )}
              </div>

              {/* Selected count */}
              {selectedAssetIds.length > 0 && (
                <p className="text-sm text-primary font-medium">
                  ✓ {selectedAssetIds.length} item(s) selected
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => {
                  setShowImportFromLibrary(false)
                  setSelectedAssetIds([])
                  setImportTargetTopicId(null)
                }}>
                  Cancel
                </Button>
                <Button
                  disabled={selectedAssetIds.length === 0}
                  onClick={async () => {
                    if (!importTargetTopicId || !activeGroupId || !user) return
                    
                    for (const assetId of selectedAssetIds) {
                      const asset = allAssets.find(a => a.id === assetId)
                      if (!asset) continue
                      
                      if (asset.type === 'mcq') {
                        // Create MCQ in group
                        const mcq: GroupMCQ = {
                          id: uuidv4(),
                          groupId: activeGroupId,
                          categoryId: questionCategories[0]?.id || '',
                          subTopicId: importTargetTopicId,
                          question: (asset as any).question,
                          options: (asset as any).options,
                          correctIndex: (asset as any).correctIndex,
                          explanation: (asset as any).explanation,
                          difficulty: (asset as any).difficulty,
                          createdBy: user.id,
                          createdByName: user.displayName,
                          createdAt: Date.now(),
                        }
                        addGroupMCQ(mcq)
                        await setDoc(doc(db, 'mcqs', mcq.id), mcq)
                      } else if (asset.type === 'note') {
                        // Create note content item
                        const contentItem: GroupContentItem = {
                          id: uuidv4(),
                          subTopicId: importTargetTopicId,
                          topicId: importTargetTopicId,
                          groupId: activeGroupId,
                          type: 'note',
                          title: asset.title,
                          content: (asset as any).content,
                          source: 'library',
                          createdBy: user.id,
                          createdByName: user.displayName,
                          createdAt: Date.now(),
                          updatedAt: Date.now(),
                        }
                        addContentItem(contentItem)
                        await setDoc(doc(db, 'content-items', contentItem.id), contentItem)
                      }
                    }
                    
                    alert(`✅ ${selectedAssetIds.length} item(s) imported successfully!`)
                    setShowImportFromLibrary(false)
                    setSelectedAssetIds([])
                    setImportTargetTopicId(null)
                  }}
                >
                  <Library className="h-4 w-4 mr-2" />
                  Import ({selectedAssetIds.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MCQ Edit Dialog */}
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
                {(editingMcq as any).assetRef && <span className="text-xs text-green-500">(🔗 Library Synced)</span>}
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
                  <RefreshCw className="h-4 w-4 mr-1" /> Save {(editingMcq as any).assetRef && '& Sync'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default GroupDashboard