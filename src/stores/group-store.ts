import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/config/firebase'
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'
import type { Group, Member, GroupTopic, GroupSubTopic, GroupContentItem, GroupMCQ, DeleteRequest, GroupQuestionCategory, GroupQuizResult, ContentReport, LiveTest, LiveTestResult, AutoLiveTestConfig } from '@/types'

interface GroupState {
  // Current user's groups
  myGroups: Group[]
  activeGroupId: string | null
  
  // All groups registry (for joining by code)
  allGroupsRegistry: Group[]
  
  // Active group data
  topics: GroupTopic[]
  subTopics: GroupSubTopic[]
  contentItems: GroupContentItem[]
  groupMCQs: GroupMCQ[]
  deleteRequests: DeleteRequest[]
  questionCategories: GroupQuestionCategory[]
  quizResults: GroupQuizResult[]
  contentReports: ContentReport[]
  liveTests: LiveTest[]
  liveTestResults: LiveTestResult[]
  autoLiveTestConfigs: AutoLiveTestConfig[]
  
  // Actions - Groups
  setMyGroups: (groups: Group[]) => void
  addGroup: (group: Group) => void
  removeGroup: (groupId: string) => void
  updateGroup: (group: Group) => void
  setActiveGroup: (groupId: string | null) => void
  findGroupByCode: (code: string) => Promise<Group | undefined>
  registerGroup: (group: Group) => void
  
  // Actions - Topics
  addTopic: (topic: GroupTopic) => void
  updateTopic: (topic: GroupTopic) => void
  removeTopic: (topicId: string) => void
  
  // Actions - SubTopics
  addSubTopic: (subTopic: GroupSubTopic) => void
  updateSubTopic: (subTopic: GroupSubTopic) => void
  removeSubTopic: (subTopicId: string) => void
  assignSubTopic: (subTopicId: string, userId: string, userName: string) => void
  updateSubTopicStatus: (subTopicId: string, status: GroupSubTopic['status']) => void
  
  // Actions - Content
  addContentItem: (item: GroupContentItem) => void
  updateContentItem: (item: GroupContentItem) => void
  removeContentItem: (itemId: string) => void
  
  // Actions - MCQs
  addGroupMCQ: (mcq: GroupMCQ) => void
  removeGroupMCQ: (mcqId: string) => void
  
  // Actions - Question Categories
  addQuestionCategory: (category: GroupQuestionCategory) => void
  removeQuestionCategory: (categoryId: string) => void
  
  // Actions - Quiz Results
  addQuizResult: (result: GroupQuizResult) => void
  getQuizResultsByUser: (groupId: string, userId: string) => GroupQuizResult[]
  getQuizResultsByQuiz: (quizItemId: string) => GroupQuizResult[]
  getLeaderboard: (quizItemId: string) => GroupQuizResult[]
  getUserQuizHistory: (groupId: string, userId: string, limit?: number) => GroupQuizResult[]
  
  // Actions - Delete Requests
  createDeleteRequest: (request: DeleteRequest) => void
  voteOnDeleteRequest: (requestId: string, userId: string, approve: boolean) => void
  resolveDeleteRequest: (requestId: string, approved: boolean) => void
  getDeleteRequestsByGroup: (groupId: string) => DeleteRequest[]
  
  // Actions - Content Reports
  addContentReport: (report: ContentReport) => void
  resolveContentReport: (reportId: string, status: 'resolved' | 'dismissed') => void
  getReportsByCreator: (creatorId: string) => ContentReport[]
  getReportsByContent: (contentId: string) => ContentReport[]
  
  // Actions - Live Tests
  addLiveTest: (test: LiveTest) => void
  updateLiveTest: (test: LiveTest) => void
  removeLiveTest: (testId: string) => void
  getLiveTestsByGroup: (groupId: string) => LiveTest[]
  getUpcomingLiveTests: (groupId: string) => LiveTest[]
  getActiveLiveTest: (groupId: string) => LiveTest | undefined
  getPastLiveTests: (groupId: string) => LiveTest[]
  
  // Actions - Live Test Results
  addLiveTestResult: (result: LiveTestResult) => void
  updateLiveTestResult: (result: LiveTestResult) => void
  getLiveTestResultsByTest: (testId: string) => LiveTestResult[]
  getUserLiveTestResult: (testId: string, userId: string) => LiveTestResult | undefined
  getLiveTestLeaderboard: (testId: string) => LiveTestResult[]
  
  // Actions - Auto Live Test Config
  setAutoLiveTestConfig: (config: AutoLiveTestConfig) => void
  getAutoLiveTestConfig: (groupId: string) => AutoLiveTestConfig | undefined
  
  // Firebase Sync
  loadGroupFromFirebase: (groupId: string) => Promise<void>
  subscribeToGroup: (groupId: string) => () => void
  
  // Helpers
  getActiveGroup: () => Group | undefined
  getTopicsByGroup: (groupId: string) => GroupTopic[]
  getSubTopicsByTopic: (topicId: string) => GroupSubTopic[]
  getContentBySubTopic: (subTopicId: string) => GroupContentItem[]
  getMCQsByGroup: (groupId: string) => GroupMCQ[]
  getMCQsByCategory: (categoryId: string) => GroupMCQ[]
  getCategoriesByGroup: (groupId: string) => GroupQuestionCategory[]
  getLatestNotes: (groupId: string, count: number) => GroupContentItem[]
  getLatestQuizzes: (groupId: string, count: number) => GroupContentItem[]
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      myGroups: [],
      activeGroupId: null,
      allGroupsRegistry: [],
      topics: [],
      subTopics: [],
      contentItems: [],
      groupMCQs: [],
      deleteRequests: [],
      questionCategories: [],
      quizResults: [],
      contentReports: [],
      liveTests: [],
      liveTestResults: [],
      autoLiveTestConfigs: [],
      
      // Group actions
      setMyGroups: (groups) => set({ myGroups: groups }),
      
      addGroup: async (group) => {
        set(state => ({ 
          myGroups: [...state.myGroups, group],
          allGroupsRegistry: state.allGroupsRegistry.some(g => g.id === group.id) 
            ? state.allGroupsRegistry 
            : [...state.allGroupsRegistry, group]
        }))
        try {
          await setDoc(doc(db, 'groups', group.id), group)
        } catch (e) { console.error('Error saving group:', e) }
      },
      
      removeGroup: async (groupId) => {
        set(state => ({ 
          myGroups: state.myGroups.filter(g => g.id !== groupId),
          activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId
        }))
        // Note: Don't delete from Firebase - other members might still need it
      },
      
      updateGroup: async (group) => {
        set(state => ({
          myGroups: state.myGroups.map(g => g.id === group.id ? group : g),
          allGroupsRegistry: state.allGroupsRegistry.map(g => g.id === group.id ? group : g)
        }))
        try {
          await setDoc(doc(db, 'groups', group.id), group)
        } catch (e) { console.error('Error updating group:', e) }
      },
      
      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
      
      findGroupByCode: async (code) => {
        // First check local
        const local = get().allGroupsRegistry.find(g => g.groupCode === code.toUpperCase())
        if (local) return local
        
        // Then check Firebase
        try {
          const snap = await getDocs(query(collection(db, 'groups'), where('groupCode', '==', code.toUpperCase())))
          if (!snap.empty) {
            const group = snap.docs[0].data() as Group
            // Add to local registry
            set(state => ({
              allGroupsRegistry: [...state.allGroupsRegistry, group]
            }))
            return group
          }
        } catch (e) { console.error('Error finding group:', e) }
        return undefined
      },
      
      registerGroup: async (group) => {
        set(state => ({
          allGroupsRegistry: state.allGroupsRegistry.some(g => g.id === group.id)
            ? state.allGroupsRegistry.map(g => g.id === group.id ? group : g)
            : [...state.allGroupsRegistry, group]
        }))
        try {
          await setDoc(doc(db, 'groups', group.id), group)
        } catch (e) { console.error('Error registering group:', e) }
      },
      
      // Topic actions
      addTopic: async (topic) => {
        set(state => ({ topics: [...state.topics, topic] }))
        try {
          await setDoc(doc(db, 'group-topics', topic.id), topic)
        } catch (e) { console.error('Error saving topic:', e) }
      },
      
      updateTopic: async (topic) => {
        set(state => ({
          topics: state.topics.map(t => t.id === topic.id ? topic : t)
        }))
        try {
          await setDoc(doc(db, 'group-topics', topic.id), topic)
        } catch (e) { console.error('Error updating topic:', e) }
      },
      
      removeTopic: async (topicId) => {
        const state = get()
        const subTopicsToDelete = state.subTopics.filter(st => st.topicId === topicId)
        const contentToDelete = state.contentItems.filter(ci => ci.topicId === topicId)
        
        set(state => ({
          topics: state.topics.filter(t => t.id !== topicId),
          subTopics: state.subTopics.filter(st => st.topicId !== topicId),
          contentItems: state.contentItems.filter(ci => ci.topicId !== topicId)
        }))
        
        try {
          const batch = writeBatch(db)
          batch.delete(doc(db, 'group-topics', topicId))
          subTopicsToDelete.forEach(st => batch.delete(doc(db, 'group-subtopics', st.id)))
          contentToDelete.forEach(c => batch.delete(doc(db, 'group-content', c.id)))
          await batch.commit()
        } catch (e) { console.error('Error deleting topic:', e) }
      },
      
      // SubTopic actions
      addSubTopic: async (subTopic) => {
        set(state => ({ subTopics: [...state.subTopics, subTopic] }))
        try {
          await setDoc(doc(db, 'group-subtopics', subTopic.id), subTopic)
        } catch (e) { console.error('Error saving subtopic:', e) }
      },
      
      updateSubTopic: async (subTopic) => {
        set(state => ({
          subTopics: state.subTopics.map(st => st.id === subTopic.id ? subTopic : st)
        }))
        try {
          await setDoc(doc(db, 'group-subtopics', subTopic.id), subTopic)
        } catch (e) { console.error('Error updating subtopic:', e) }
      },
      
      removeSubTopic: async (subTopicId) => {
        const contentToDelete = get().contentItems.filter(ci => ci.subTopicId === subTopicId)
        
        set(state => ({
          subTopics: state.subTopics.filter(st => st.id !== subTopicId),
          contentItems: state.contentItems.filter(ci => ci.subTopicId !== subTopicId)
        }))
        
        try {
          const batch = writeBatch(db)
          batch.delete(doc(db, 'group-subtopics', subTopicId))
          contentToDelete.forEach(c => batch.delete(doc(db, 'group-content', c.id)))
          await batch.commit()
        } catch (e) { console.error('Error deleting subtopic:', e) }
      },
      
      assignSubTopic: async (subTopicId, userId, userName) => {
        const subTopic = get().subTopics.find(st => st.id === subTopicId)
        if (!subTopic) return
        
        const updated = { ...subTopic, assignedTo: userId, assignedToName: userName, status: 'assigned' as const }
        set(state => ({
          subTopics: state.subTopics.map(st => st.id === subTopicId ? updated : st)
        }))
        try {
          await setDoc(doc(db, 'group-subtopics', subTopicId), updated)
        } catch (e) { console.error('Error assigning subtopic:', e) }
      },
      
      updateSubTopicStatus: async (subTopicId, status) => {
        const subTopic = get().subTopics.find(st => st.id === subTopicId)
        if (!subTopic) return
        
        const updated = { ...subTopic, status }
        set(state => ({
          subTopics: state.subTopics.map(st => st.id === subTopicId ? updated : st)
        }))
        try {
          await setDoc(doc(db, 'group-subtopics', subTopicId), updated)
        } catch (e) { console.error('Error updating subtopic status:', e) }
      },
      
      // Content actions
      addContentItem: async (item) => {
        set(state => ({ contentItems: [...state.contentItems, item] }))
        try {
          await setDoc(doc(db, 'group-content', item.id), item)
        } catch (e) { console.error('Error saving content:', e) }
      },
      
      updateContentItem: async (item) => {
        set(state => ({
          contentItems: state.contentItems.map(ci => ci.id === item.id ? item : ci)
        }))
        try {
          await setDoc(doc(db, 'group-content', item.id), item)
        } catch (e) { console.error('Error updating content:', e) }
      },
      
      removeContentItem: async (itemId) => {
        set(state => ({
          contentItems: state.contentItems.filter(ci => ci.id !== itemId)
        }))
        try {
          await deleteDoc(doc(db, 'group-content', itemId))
        } catch (e) { console.error('Error deleting content:', e) }
      },
      
      // MCQ actions
      addGroupMCQ: async (mcq) => {
        set(state => ({ groupMCQs: [...state.groupMCQs, mcq] }))
        try {
          await setDoc(doc(db, 'group-mcqs', mcq.id), mcq)
        } catch (e) { console.error('Error saving MCQ:', e) }
      },
      
      removeGroupMCQ: async (mcqId) => {
        set(state => ({
          groupMCQs: state.groupMCQs.filter(m => m.id !== mcqId)
        }))
        try {
          await deleteDoc(doc(db, 'group-mcqs', mcqId))
        } catch (e) { console.error('Error deleting MCQ:', e) }
      },
      
      // Question Category actions
      addQuestionCategory: async (category) => {
        set(state => ({
          questionCategories: [...state.questionCategories, category]
        }))
        try {
          await setDoc(doc(db, 'group-categories', category.id), category)
        } catch (e) { console.error('Error saving category:', e) }
      },
      
      removeQuestionCategory: async (categoryId) => {
        const mcqsToDelete = get().groupMCQs.filter(m => m.categoryId === categoryId)
        
        set(state => ({
          questionCategories: state.questionCategories.filter(c => c.id !== categoryId),
          groupMCQs: state.groupMCQs.filter(m => m.categoryId !== categoryId)
        }))
        
        try {
          const batch = writeBatch(db)
          batch.delete(doc(db, 'group-categories', categoryId))
          mcqsToDelete.forEach(m => batch.delete(doc(db, 'group-mcqs', m.id)))
          await batch.commit()
        } catch (e) { console.error('Error deleting category:', e) }
      },
      
      // Delete Request actions
      createDeleteRequest: async (request) => {
        set(state => ({
          deleteRequests: [...state.deleteRequests, request]
        }))
        try {
          await setDoc(doc(db, 'group-delete-requests', request.id), request)
        } catch (e) { console.error('Error creating delete request:', e) }
      },
      
      voteOnDeleteRequest: async (requestId, userId, approve) => {
        const request = get().deleteRequests.find(r => r.id === requestId)
        if (!request) return
        
        const approvedBy = request.approvedBy.filter(id => id !== userId)
        const rejectedBy = request.rejectedBy.filter(id => id !== userId)
        if (approve) {
          approvedBy.push(userId)
        } else {
          rejectedBy.push(userId)
        }
        const updated = { ...request, approvedBy, rejectedBy }
        
        set(state => ({
          deleteRequests: state.deleteRequests.map(req => req.id === requestId ? updated : req)
        }))
        try {
          await setDoc(doc(db, 'group-delete-requests', requestId), updated)
        } catch (e) { console.error('Error voting on delete request:', e) }
      },
      
      resolveDeleteRequest: async (requestId, approved) => {
        const request = get().deleteRequests.find(r => r.id === requestId)
        if (!request) return
        
        const updated = { ...request, status: approved ? 'approved' as const : 'rejected' as const, resolvedAt: Date.now() }
        
        set(state => ({
          deleteRequests: state.deleteRequests.map(req => req.id === requestId ? updated : req)
        }))
        try {
          await setDoc(doc(db, 'group-delete-requests', requestId), updated)
        } catch (e) { console.error('Error resolving delete request:', e) }
      },
      
      getDeleteRequestsByGroup: (groupId) => {
        return get().deleteRequests.filter(r => r.groupId === groupId && r.status === 'pending')
      },
      
      // Quiz Results Actions
      addQuizResult: async (result) => {
        set(state => ({
          quizResults: [...state.quizResults, result]
        }))
        try {
          await setDoc(doc(db, 'group-quiz-results', result.id), result)
        } catch (e) { console.error('Error saving quiz result:', e) }
      },
      
      getQuizResultsByUser: (groupId, userId) => {
        return get().quizResults.filter(r => r.groupId === groupId && r.userId === userId)
      },
      
      getQuizResultsByQuiz: (quizItemId) => {
        return get().quizResults.filter(r => r.quizItemId === quizItemId)
      },
      
      getLeaderboard: (quizItemId) => {
        const results = get().quizResults.filter(r => r.quizItemId === quizItemId)
        // Get best score per user
        const bestScores = new Map<string, GroupQuizResult>()
        results.forEach(r => {
          const existing = bestScores.get(r.userId)
          if (!existing || r.score > existing.score) {
            bestScores.set(r.userId, r)
          }
        })
        return Array.from(bestScores.values()).sort((a, b) => b.score - a.score)
      },
      
      getUserQuizHistory: (groupId, userId, limit = 10) => {
        return get().quizResults
          .filter(r => r.groupId === groupId && r.userId === userId)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, limit)
      },
      
      // Content Reports
      addContentReport: async (report) => {
        set(state => ({
          contentReports: [...state.contentReports, report]
        }))
        try {
          await setDoc(doc(db, 'group-reports', report.id), report)
        } catch (e) { console.error('Error saving report:', e) }
      },
      
      resolveContentReport: async (reportId, status) => {
        const report = get().contentReports.find(r => r.id === reportId)
        if (!report) return
        
        const updated = { ...report, status, resolvedAt: Date.now() }
        set(state => ({
          contentReports: state.contentReports.map(r => r.id === reportId ? updated : r)
        }))
        try {
          await setDoc(doc(db, 'group-reports', reportId), updated)
        } catch (e) { console.error('Error resolving report:', e) }
      },
      
      getReportsByCreator: (creatorId) => {
        return get().contentReports.filter(r => r.creatorId === creatorId && r.status === 'pending')
      },
      
      getReportsByContent: (contentId) => {
        return get().contentReports.filter(r => r.contentId === contentId)
      },
      
      // Live Tests
      addLiveTest: async (test) => {
        set(state => ({ liveTests: [...state.liveTests, test] }))
        try {
          await setDoc(doc(db, 'group-live-tests', test.id), test)
        } catch (e) { console.error('Error saving live test:', e) }
      },
      
      updateLiveTest: async (test) => {
        set(state => ({
          liveTests: state.liveTests.map(t => t.id === test.id ? test : t)
        }))
        try {
          await setDoc(doc(db, 'group-live-tests', test.id), test)
        } catch (e) { console.error('Error updating live test:', e) }
      },
      
      removeLiveTest: async (testId) => {
        const resultsToDelete = get().liveTestResults.filter(r => r.liveTestId === testId)
        
        set(state => ({
          liveTests: state.liveTests.filter(t => t.id !== testId),
          liveTestResults: state.liveTestResults.filter(r => r.liveTestId !== testId)
        }))
        
        try {
          const batch = writeBatch(db)
          batch.delete(doc(db, 'group-live-tests', testId))
          resultsToDelete.forEach(r => batch.delete(doc(db, 'group-live-test-results', r.id)))
          await batch.commit()
        } catch (e) { console.error('Error deleting live test:', e) }
      },
      
      getLiveTestsByGroup: (groupId) => {
        return get().liveTests.filter(t => t.groupId === groupId).sort((a, b) => b.createdAt - a.createdAt)
      },
      
      getUpcomingLiveTests: (groupId) => {
        const now = Date.now()
        return get().liveTests
          .filter(t => t.groupId === groupId && t.startTime > now)
          .sort((a, b) => a.startTime - b.startTime)
      },
      
      getActiveLiveTest: (groupId) => {
        const now = Date.now()
        return get().liveTests.find(t => 
          t.groupId === groupId && 
          t.startTime <= now && 
          t.endTime > now
        )
      },
      
      getPastLiveTests: (groupId) => {
        const now = Date.now()
        return get().liveTests
          .filter(t => t.groupId === groupId && t.endTime <= now)
          .sort((a, b) => b.endTime - a.endTime)
      },
      
      // Live Test Results
      addLiveTestResult: async (result) => {
        set(state => ({
          liveTestResults: [...state.liveTestResults, result]
        }))
        try {
          await setDoc(doc(db, 'group-live-test-results', result.id), result)
        } catch (e) { console.error('Error saving live test result:', e) }
      },
      
      updateLiveTestResult: async (result) => {
        set(state => ({
          liveTestResults: state.liveTestResults.map(r => r.id === result.id ? result : r)
        }))
        try {
          await setDoc(doc(db, 'group-live-test-results', result.id), result)
        } catch (e) { console.error('Error updating live test result:', e) }
      },
      
      getLiveTestResultsByTest: (testId) => {
        return get().liveTestResults.filter(r => r.liveTestId === testId)
      },
      
      getUserLiveTestResult: (testId, userId) => {
        return get().liveTestResults.find(r => r.liveTestId === testId && r.userId === userId)
      },
      
      getLiveTestLeaderboard: (testId) => {
        return get().liveTestResults
          .filter(r => r.liveTestId === testId && r.status !== 'in-progress')
          .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
      },
      
      // Auto Live Test Config
      setAutoLiveTestConfig: async (config) => {
        set(state => {
          const existing = state.autoLiveTestConfigs.findIndex(c => c.groupId === config.groupId)
          if (existing >= 0) {
            const updated = [...state.autoLiveTestConfigs]
            updated[existing] = config
            return { autoLiveTestConfigs: updated }
          }
          return { autoLiveTestConfigs: [...state.autoLiveTestConfigs, config] }
        })
        try {
          await setDoc(doc(db, 'group-auto-test-configs', config.groupId), config)
        } catch (e) { console.error('Error saving auto test config:', e) }
      },
      
      getAutoLiveTestConfig: (groupId) => {
        return get().autoLiveTestConfigs.find(c => c.groupId === groupId)
      },
      
      // Firebase Sync Functions
      loadGroupFromFirebase: async (groupId: string) => {
        try {
          // Load group
          const groupSnap = await getDocs(query(collection(db, 'groups'), where('id', '==', groupId)))
          if (!groupSnap.empty) {
            const group = groupSnap.docs[0].data() as Group
            set(state => ({
              myGroups: state.myGroups.some(g => g.id === groupId) 
                ? state.myGroups.map(g => g.id === groupId ? group : g)
                : [...state.myGroups, group],
              allGroupsRegistry: state.allGroupsRegistry.some(g => g.id === groupId)
                ? state.allGroupsRegistry.map(g => g.id === groupId ? group : g)
                : [...state.allGroupsRegistry, group]
            }))
          }
          
          // Load topics
          const topicsSnap = await getDocs(query(collection(db, 'group-topics'), where('groupId', '==', groupId)))
          const topics = topicsSnap.docs.map(d => ({ ...d.data() } as GroupTopic))
          
          // Load subtopics
          const subTopicsSnap = await getDocs(query(collection(db, 'group-subtopics'), where('groupId', '==', groupId)))
          const subTopics = subTopicsSnap.docs.map(d => ({ ...d.data() } as GroupSubTopic))
          
          // Load content
          const contentSnap = await getDocs(query(collection(db, 'group-content'), where('groupId', '==', groupId)))
          const contentItems = contentSnap.docs.map(d => ({ ...d.data() } as GroupContentItem))
          
          // Load MCQs
          const mcqsSnap = await getDocs(query(collection(db, 'group-mcqs'), where('groupId', '==', groupId)))
          const groupMCQs = mcqsSnap.docs.map(d => ({ ...d.data() } as GroupMCQ))
          
          // Load categories
          const catsSnap = await getDocs(query(collection(db, 'group-categories'), where('groupId', '==', groupId)))
          const questionCategories = catsSnap.docs.map(d => ({ ...d.data() } as GroupQuestionCategory))
          
          // Load quiz results
          const quizResultsSnap = await getDocs(query(collection(db, 'group-quiz-results'), where('groupId', '==', groupId)))
          const quizResults = quizResultsSnap.docs.map(d => ({ ...d.data() } as GroupQuizResult))
          
          // Load live tests
          const liveTestsSnap = await getDocs(query(collection(db, 'group-live-tests'), where('groupId', '==', groupId)))
          const liveTests = liveTestsSnap.docs.map(d => ({ ...d.data() } as LiveTest))
          
          // Load live test results
          const liveTestResultsSnap = await getDocs(query(collection(db, 'group-live-test-results'), where('groupId', '==', groupId)))
          const liveTestResults = liveTestResultsSnap.docs.map(d => ({ ...d.data() } as LiveTestResult))
          
          // Load delete requests
          const deleteReqSnap = await getDocs(query(collection(db, 'group-delete-requests'), where('groupId', '==', groupId)))
          const deleteRequests = deleteReqSnap.docs.map(d => ({ ...d.data() } as DeleteRequest))
          
          // Load content reports
          const reportsSnap = await getDocs(query(collection(db, 'group-reports'), where('groupId', '==', groupId)))
          const contentReports = reportsSnap.docs.map(d => ({ ...d.data() } as ContentReport))
          
          // Merge with existing (for other groups)
          set(state => ({
            topics: [...state.topics.filter(t => t.groupId !== groupId), ...topics],
            subTopics: [...state.subTopics.filter(st => st.groupId !== groupId), ...subTopics],
            contentItems: [...state.contentItems.filter(ci => ci.groupId !== groupId), ...contentItems],
            groupMCQs: [...state.groupMCQs.filter(m => m.groupId !== groupId), ...groupMCQs],
            questionCategories: [...state.questionCategories.filter(c => c.groupId !== groupId), ...questionCategories],
            quizResults: [...state.quizResults.filter(r => r.groupId !== groupId), ...quizResults],
            liveTests: [...state.liveTests.filter(t => t.groupId !== groupId), ...liveTests],
            liveTestResults: [...state.liveTestResults.filter(r => r.groupId !== groupId), ...liveTestResults],
            deleteRequests: [...state.deleteRequests.filter(r => r.groupId !== groupId), ...deleteRequests],
            contentReports: [...state.contentReports.filter(r => r.groupId !== groupId), ...contentReports],
          }))
          
          console.log('✅ Group data loaded from Firebase:', groupId)
        } catch (error) {
          console.error('Error loading group data:', error)
        }
      },
      
      subscribeToGroup: (groupId: string) => {
        const unsubscribers: (() => void)[] = []
        
        // Subscribe to group
        unsubscribers.push(
          onSnapshot(doc(db, 'groups', groupId), (snap) => {
            if (snap.exists()) {
              const group = snap.data() as Group
              set(state => ({
                myGroups: state.myGroups.map(g => g.id === groupId ? group : g),
                allGroupsRegistry: state.allGroupsRegistry.map(g => g.id === groupId ? group : g)
              }))
            }
          })
        )
        
        // Subscribe to topics
        unsubscribers.push(
          onSnapshot(query(collection(db, 'group-topics'), where('groupId', '==', groupId)), (snap) => {
            const topics = snap.docs.map(d => ({ ...d.data() } as GroupTopic))
            set(state => ({
              topics: [...state.topics.filter(t => t.groupId !== groupId), ...topics]
            }))
          })
        )
        
        // Subscribe to subtopics
        unsubscribers.push(
          onSnapshot(query(collection(db, 'group-subtopics'), where('groupId', '==', groupId)), (snap) => {
            const subTopics = snap.docs.map(d => ({ ...d.data() } as GroupSubTopic))
            set(state => ({
              subTopics: [...state.subTopics.filter(st => st.groupId !== groupId), ...subTopics]
            }))
          })
        )
        
        // Subscribe to content
        unsubscribers.push(
          onSnapshot(query(collection(db, 'group-content'), where('groupId', '==', groupId)), (snap) => {
            const contentItems = snap.docs.map(d => ({ ...d.data() } as GroupContentItem))
            set(state => ({
              contentItems: [...state.contentItems.filter(ci => ci.groupId !== groupId), ...contentItems]
            }))
          })
        )
        
        // Subscribe to MCQs
        unsubscribers.push(
          onSnapshot(query(collection(db, 'group-mcqs'), where('groupId', '==', groupId)), (snap) => {
            const groupMCQs = snap.docs.map(d => ({ ...d.data() } as GroupMCQ))
            set(state => ({
              groupMCQs: [...state.groupMCQs.filter(m => m.groupId !== groupId), ...groupMCQs]
            }))
          })
        )
        
        // Subscribe to categories
        unsubscribers.push(
          onSnapshot(query(collection(db, 'group-categories'), where('groupId', '==', groupId)), (snap) => {
            const questionCategories = snap.docs.map(d => ({ ...d.data() } as GroupQuestionCategory))
            set(state => ({
              questionCategories: [...state.questionCategories.filter(c => c.groupId !== groupId), ...questionCategories]
            }))
          })
        )
        
        // Subscribe to quiz results
        unsubscribers.push(
          onSnapshot(query(collection(db, 'group-quiz-results'), where('groupId', '==', groupId)), (snap) => {
            const quizResults = snap.docs.map(d => ({ ...d.data() } as GroupQuizResult))
            set(state => ({
              quizResults: [...state.quizResults.filter(r => r.groupId !== groupId), ...quizResults]
            }))
          })
        )
        
        // Subscribe to live tests
        unsubscribers.push(
          onSnapshot(query(collection(db, 'group-live-tests'), where('groupId', '==', groupId)), (snap) => {
            const liveTests = snap.docs.map(d => ({ ...d.data() } as LiveTest))
            set(state => ({
              liveTests: [...state.liveTests.filter(t => t.groupId !== groupId), ...liveTests]
            }))
          })
        )
        
        // Subscribe to live test results
        unsubscribers.push(
          onSnapshot(query(collection(db, 'group-live-test-results'), where('groupId', '==', groupId)), (snap) => {
            const liveTestResults = snap.docs.map(d => ({ ...d.data() } as LiveTestResult))
            set(state => ({
              liveTestResults: [...state.liveTestResults.filter(r => r.groupId !== groupId), ...liveTestResults]
            }))
          })
        )
        
        return () => unsubscribers.forEach(unsub => unsub())
      },
      
      // Helpers
      getActiveGroup: () => {
        const state = get()
        return state.myGroups.find(g => g.id === state.activeGroupId)
      },
      
      getTopicsByGroup: (groupId) => {
        return get().topics.filter(t => t.groupId === groupId).sort((a, b) => a.order - b.order)
      },
      
      getSubTopicsByTopic: (topicId) => {
        return get().subTopics.filter(st => st.topicId === topicId).sort((a, b) => a.order - b.order)
      },
      
      getContentBySubTopic: (subTopicId) => {
        return get().contentItems.filter(ci => ci.subTopicId === subTopicId)
      },
      
      getMCQsByGroup: (groupId) => {
        return get().groupMCQs.filter(m => m.groupId === groupId)
      },
      
      getMCQsByCategory: (categoryId) => {
        return get().groupMCQs.filter(m => m.categoryId === categoryId)
      },
      
      getCategoriesByGroup: (groupId) => {
        return get().questionCategories.filter(c => c.groupId === groupId)
      },
      
      getLatestNotes: (groupId, count) => {
        return get().contentItems
          .filter(ci => ci.groupId === groupId && ci.type === 'note')
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, count)
      },
      
      getLatestQuizzes: (groupId, count) => {
        return get().contentItems
          .filter(ci => ci.groupId === groupId && ci.type === 'quiz')
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, count)
      },
    }),
    { name: 'group-store' }
  )
)

export default useGroupStore
