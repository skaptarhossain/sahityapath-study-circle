import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
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
  GripVertical,
  X,
  Heading,
  Type,
  Link,
  Clock,
  Video,
  Upload,
  Code,
  Pencil,
  AlertTriangle,
  Check,
  XCircle,
  Vote,
  Bell,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useGroupStore } from '@/stores/group-store'
import { useAuthStore } from '@/stores/auth-store'
import { storage } from '@/config/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import type { Group, GroupTopic, GroupSubTopic, GroupContentItem, GroupMCQ, DeleteRequest } from '@/types'

export function GroupDashboard() {
  const user = useAuthStore(s => s.user)
  const { 
    myGroups, 
    activeGroupId, 
    setActiveGroup, 
    addGroup, 
    removeGroup,
    updateGroup,
    topics,
    subTopics,
    contentItems,
    groupMCQs,
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
    removeGroupMCQ,
    createDeleteRequest,
    voteOnDeleteRequest,
    resolveDeleteRequest,
    deleteRequests,
    getTopicsByGroup,
    getSubTopicsByTopic,
    getContentBySubTopic,
    getMCQsByGroup,
    getLatestNotes,
  } = useGroupStore()

  // UI States
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [activeTab, setActiveTab] = useState<'whats-new' | 'course' | 'live-test' | 'members' | 'settings'>('whats-new')
  const [expandedTopics, setExpandedTopics] = useState<string[]>([])
  
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
  
  // Live Test state
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testQuestions, setTestQuestions] = useState<GroupMCQ[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [showTestResults, setShowTestResults] = useState(false)
  
  // Source code toggle for editors
  const [showSourceCode, setShowSourceCode] = useState(false)
  const [showEditSourceCode, setShowEditSourceCode] = useState(false)
  
  // Delete requests modal
  const [showDeleteRequests, setShowDeleteRequests] = useState(false)

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

  // Get active group
  const activeGroup = useMemo(() => 
    myGroups.find(g => g.id === activeGroupId), 
    [myGroups, activeGroupId]
  )
  
  const isAdmin = activeGroup?.adminId === user?.id

  // Get group data
  const groupTopics = useMemo(() => 
    activeGroupId ? getTopicsByGroup(activeGroupId) : [],
    [activeGroupId, topics]
  )
  
  const groupMCQList = useMemo(() =>
    activeGroupId ? getMCQsByGroup(activeGroupId) : [],
    [activeGroupId, groupMCQs]
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

  // Get current user's role in the group
  const getCurrentUserRole = (): 'admin' | 'moderator' | 'member' => {
    if (!activeGroup || !user) return 'member'
    const member = activeGroup.members.find(m => m.userId === user.id)
    return member?.role || 'member'
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

  // Handlers
  const handleCreateGroup = () => {
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
    addGroup(newGroup)
    setActiveGroup(newGroup.id)
    setNewGroupName('')
    setNewGroupDesc('')
    setShowCreateGroup(false)
  }

  const handleJoinGroup = () => {
    if (!joinCode.trim() || !user) return
    alert('Group joining will be implemented with Firestore.')
    setJoinCode('')
    setShowJoinGroup(false)
  }

  const handleAddTopic = () => {
    if (!newTopicName.trim() || !activeGroupId) return
    const topic: GroupTopic = {
      id: uuidv4(),
      groupId: activeGroupId,
      name: newTopicName.trim(),
      order: groupTopics.length + 1,
      createdAt: Date.now(),
    }
    addTopic(topic)
    setNewTopicName('')
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
      content = `<iframe src="${itemDetailUrl}" width="100%" height="500" frameborder="0"></iframe>`
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
      order: maxOrder + 1,
      createdBy: user.id,
      createdByName: user.displayName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addContentItem(item)
    
    // Reset all
    setItemDetailTitle('')
    setItemDetailContent('')
    setItemDetailUrl('')
    setQuizTimeLimit('')
    setUploadedFiles([])
    setShowItemDetailModal(false)
    setShowAddItemModal(false)
    setAddingToTopicId(null)
  }

  const handleAddMCQ = (topicId: string) => {
    if (!mcqQuestion.trim() || mcqOptions.some(o => !o.trim()) || !activeGroupId || !user) {
      alert('Please fill all fields')
      return
    }
    const mcq: GroupMCQ = {
      id: uuidv4(),
      groupId: activeGroupId,
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

  const copyGroupCode = () => {
    if (activeGroup) {
      navigator.clipboard.writeText(activeGroup.groupCode)
      alert('Group code copied!')
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
  const startLiveTest = () => {
    if (groupMCQList.length === 0) {
      alert('No questions available!')
      return
    }
    const shuffled = [...groupMCQList].sort(() => Math.random() - 0.5).slice(0, 20)
    setTestQuestions(shuffled)
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setIsTestRunning(true)
    setShowTestResults(false)
  }

  const submitTest = () => {
    setIsTestRunning(false)
    setShowTestResults(true)
  }

  const getTestScore = () => {
    let correct = 0
    testQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) correct++
    })
    return correct
  }

  // Main render
  return (
    <div className="p-6 space-y-4">
      {/* Header with Group Dropdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Group Study</h2>
          
          {/* Group Dropdown */}
          <Select 
            value={activeGroupId || ''} 
            onValueChange={(v) => setActiveGroup(v || null)}
          >
            <SelectTrigger className="w-[200px]">
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

      {/* No Group Selected */}
      {!activeGroupId ? (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {myGroups.length === 0 ? 'No Groups Yet' : 'Select a Group'}
          </h3>
          <p className="text-muted-foreground">
            {myGroups.length === 0 
              ? 'Create a new group or join an existing one!' 
              : 'Choose a group from the dropdown above'}
          </p>
        </Card>
      ) : (
        <>
          {/* Group Info Bar */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Code:</span>
              <code className="bg-background px-2 py-1 rounded font-mono">{activeGroup?.groupCode}</code>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={copyGroupCode}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{activeGroup?.members.length} members</span>
            </div>
            {isAdmin && (
              <span className="flex items-center gap-1 text-sm text-primary">
                <Crown className="h-3 w-3" /> Admin
              </span>
            )}
            {/* Delete Requests Button */}
            {pendingDeleteRequests.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto relative"
                onClick={() => setShowDeleteRequests(true)}
              >
                <Bell className="h-4 w-4 mr-1" />
                Delete Requests
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingDeleteRequests.length}
                </span>
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="whats-new"><Sparkles className="h-4 w-4 mr-1" /> What's New</TabsTrigger>
              <TabsTrigger value="course"><BookOpen className="h-4 w-4 mr-1" /> Course</TabsTrigger>
              <TabsTrigger value="live-test"><Brain className="h-4 w-4 mr-1" /> Live Test</TabsTrigger>
              <TabsTrigger value="members"><Users className="h-4 w-4 mr-1" /> Members</TabsTrigger>
              {isAdmin && <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" /> Settings</TabsTrigger>}
            </TabsList>

            {/* What's New Tab */}
            <TabsContent value="whats-new" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" /> Latest Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latestNotes.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No notes yet</p>
                    ) : (
                      <div className="space-y-2">
                        {latestNotes.map(note => (
                          <div key={note.id} className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-medium">{note.title}</h4>
                            <p className="text-xs text-muted-foreground">by {note.createdByName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-green-500" /> Latest MCQs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {groupMCQList.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No MCQs yet</p>
                    ) : (
                      <div className="space-y-2">
                        {groupMCQList.slice(0, 5).map(mcq => (
                          <div key={mcq.id} className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-medium text-sm line-clamp-1">{mcq.question}</h4>
                            <p className="text-xs text-muted-foreground">by {mcq.createdByName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{groupTopics.length}</div>
                  <div className="text-sm text-muted-foreground">Chapters</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {contentItems.filter(ci => ci.groupId === activeGroupId && ci.type === 'note').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">{groupMCQList.length}</div>
                  <div className="text-sm text-muted-foreground">MCQs</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-500">{activeGroup?.members.length}</div>
                  <div className="text-sm text-muted-foreground">Members</div>
                </Card>
              </div>
            </TabsContent>

            {/* Course Tab - Sahityapath Style */}
            <TabsContent value="course" className="space-y-2">
              {/* Add new chapter button at top */}
              {isAdmin && (
                <div className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded cursor-pointer border-b"
                  onClick={() => {
                    const name = prompt('Enter chapter name:')
                    if (name?.trim()) {
                      setNewTopicName(name)
                      handleAddTopic()
                    }
                  }}
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">Add new chapter</span>
                </div>
              )}

              {/* Chapter List - Sahityapath Style */}
              <div className="border rounded-lg overflow-hidden bg-card">
                {groupTopics.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No chapters yet. {isAdmin && 'Click "Add new chapter" above!'}
                  </div>
                ) : (
                  groupTopics.map((topic, topicIdx) => {
                    const isExpanded = expandedTopics.includes(topic.id)
                    const topicContent = contentItems
                      .filter(ci => ci.topicId === topic.id)
                      .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt))
                    const topicMCQs = groupMCQList.filter(m => m.subTopicId === topic.id)
                    
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
                          </button>
                          
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-2">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setAddingToTopicId(topic.id)
                                  setShowAddItemModal(true)
                                }}>
                                  <Plus className="h-4 w-4 mr-2" /> Add chapter item
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  const newName = prompt('Enter new chapter name:', topic.name)
                                  if (newName?.trim()) {
                                    updateTopic({ ...topic, name: newName.trim() })
                                  }
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" /> Rename
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
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* Chapter Content - Expanded */}
                        {isExpanded && (
                          <div className="bg-muted/20">
                            {/* Add chapter item button */}
                            {isAdmin && (
                              <div 
                                className="flex items-center gap-2 py-2 px-8 hover:bg-muted/30 cursor-pointer text-sm border-b"
                                onClick={() => {
                                  setAddingToTopicId(topic.id)
                                  setShowAddItemModal(true)
                                }}
                              >
                                <Plus className="h-3 w-3 text-primary" />
                                <span className="text-primary">Add chapter item</span>
                              </div>
                            )}

                            {/* Content Items */}
                            {topicContent.length === 0 ? (
                              <p className="px-8 py-4 text-sm text-muted-foreground">No items yet</p>
                            ) : (
                              <>
                                {topicContent.map((item, itemIndex) => (
                                  <div key={item.id} className="flex items-center hover:bg-muted/30 border-b last:border-b-0">
                                    <div className="flex-1 flex items-center gap-2 py-2 px-8">
                                      {item.type === 'note' && item.content ? (
                                        <FileText className="h-4 w-4 text-blue-500" />
                                      ) : item.type === 'quiz' ? (
                                        <HelpCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <span className="text-muted-foreground">•</span>
                                      )}
                                      <span className="text-sm">{item.title}</span>
                                    </div>
                                    
                                    {isAdmin && (
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
                                          <DropdownMenuItem 
                                            disabled={itemIndex === 0}
                                            onClick={() => {
                                              if (itemIndex > 0) {
                                                const prevItem = topicContent[itemIndex - 1]
                                                const currentOrder = item.order ?? itemIndex
                                                const prevOrder = prevItem.order ?? (itemIndex - 1)
                                                // Swap orders
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
                                                // Swap orders
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
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Add new chapter at bottom */}
              {isAdmin && groupTopics.length > 0 && (
                <div 
                  className="flex items-center gap-2 py-3 px-3 hover:bg-primary/10 rounded cursor-pointer border border-dashed"
                  onClick={() => {
                    const name = prompt('Enter chapter name:')
                    if (name?.trim()) {
                      const topic: GroupTopic = {
                        id: uuidv4(),
                        groupId: activeGroupId!,
                        name: name.trim(),
                        order: groupTopics.length + 1,
                        createdAt: Date.now(),
                      }
                      addTopic(topic)
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
              {!isTestRunning && !showTestResults ? (
                <Card className="p-8 text-center">
                  <Brain className="h-16 w-16 mx-auto text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Group Live Test</h3>
                  <p className="text-muted-foreground mb-4">{groupMCQList.length} questions available</p>
                  <Button size="lg" onClick={startLiveTest} disabled={groupMCQList.length === 0}>
                    <Play className="h-4 w-4 mr-2" /> Start Test
                  </Button>
                </Card>
              ) : isTestRunning ? (
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm">Question {currentQuestion + 1} / {testQuestions.length}</span>
                    <Button variant="destructive" size="sm" onClick={submitTest}>Submit</Button>
                  </div>
                  <h3 className="text-lg font-medium mb-4">{testQuestions[currentQuestion]?.question}</h3>
                  <div className="space-y-2">
                    {testQuestions[currentQuestion]?.options.map((opt, i) => (
                      <div 
                        key={i}
                        className={`p-3 border rounded cursor-pointer ${
                          selectedAnswers[testQuestions[currentQuestion].id] === i ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedAnswers(prev => ({ ...prev, [testQuestions[currentQuestion].id]: i }))}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(p => p - 1)}>Previous</Button>
                    {currentQuestion < testQuestions.length - 1 ? (
                      <Button onClick={() => setCurrentQuestion(p => p + 1)}>Next</Button>
                    ) : (
                      <Button onClick={submitTest}>Submit</Button>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-2">Test Complete!</h3>
                  <div className="text-5xl font-bold text-primary my-4">{getTestScore()}/{testQuestions.length}</div>
                  <p className="text-muted-foreground mb-4">{Math.round((getTestScore() / testQuestions.length) * 100)}% Correct</p>
                  <Button onClick={() => { setShowTestResults(false); setTestQuestions([]) }}>Done</Button>
                </Card>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>Members ({activeGroup?.members.length})</span>
                    <Button variant="outline" size="sm" onClick={copyGroupCode}>
                      <Copy className="h-4 w-4 mr-1" /> Invite
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeGroup?.members.map(member => (
                    <div key={member.userId} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                      {member.role === 'admin' && <Crown className="h-4 w-4 text-yellow-500" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            {isAdmin && (
              <TabsContent value="settings">
                <Card>
                  <CardHeader><CardTitle>Group Settings</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Group Name</label>
                      <Input 
                        value={activeGroup?.name || ''} 
                        onChange={e => activeGroup && updateGroup({ ...activeGroup, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input 
                        value={activeGroup?.description || ''} 
                        onChange={e => activeGroup && updateGroup({ ...activeGroup, description: e.target.value })}
                      />
                    </div>
                    <div className="pt-4 border-t">
                      <Button 
                        variant="outline"
                        className="text-orange-500 border-orange-500 hover:bg-orange-50"
                        onClick={() => requestDelete('group', activeGroup!.id, activeGroup!.name)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Request Delete Group
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Group deletion requires 50% member approval
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}

      {/* Create Group Dialog */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle>Create New Group</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
              <Input placeholder="Description (optional)" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
                <Button onClick={handleCreateGroup}>Create</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Join Group Dialog */}
      {showJoinGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle>Join Group</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Enter Group Code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowJoinGroup(false)}>Cancel</Button>
                <Button onClick={handleJoinGroup}>Join</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Content Modal */}
      {editingContent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Edit: {editingContent.title}</CardTitle>
              <Button 
                variant={showEditSourceCode ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowEditSourceCode(!showEditSourceCode)}
                className="h-8"
              >
                <Code className="h-4 w-4 mr-1" /> Source
              </Button>
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
              <Button onClick={() => {
                updateContentItem({ ...editingContent, updatedAt: Date.now() })
                setEditingContent(null)
                setShowEditSourceCode(false)
              }}>Save</Button>
            </div>
          </Card>
        </div>
      )}


      {/* Sahityapath Style Add Item Modal */}
      {showAddItemModal && addingToTopicId && !showItemDetailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">Create new item</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => {
                  setShowAddItemModal(false)
                  setAddingToTopicId(null)
                  setNewItemName('')
                  setNewItemType('note')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <CardContent className="p-4">
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
                  <p className="text-xs text-muted-foreground mt-2">
                    After creating, you can add questions from the chapter item menu.
                  </p>
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

      {/* Delete Requests Modal */}
      {showDeleteRequests && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
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
    </div>
  )
}

export default GroupDashboard