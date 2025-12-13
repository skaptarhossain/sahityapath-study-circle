import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  findGroupByCode: (code: string) => Group | undefined
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
      
      addGroup: (group) => set(state => ({ 
        myGroups: [...state.myGroups, group],
        // Also register in global registry
        allGroupsRegistry: state.allGroupsRegistry.some(g => g.id === group.id) 
          ? state.allGroupsRegistry 
          : [...state.allGroupsRegistry, group]
      })),
      
      removeGroup: (groupId) => set(state => ({ 
        myGroups: state.myGroups.filter(g => g.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId
      })),
      
      updateGroup: (group) => set(state => ({
        myGroups: state.myGroups.map(g => g.id === group.id ? group : g),
        // Also update in registry
        allGroupsRegistry: state.allGroupsRegistry.map(g => g.id === group.id ? group : g)
      })),
      
      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
      
      findGroupByCode: (code) => {
        return get().allGroupsRegistry.find(g => g.groupCode === code.toUpperCase())
      },
      
      registerGroup: (group) => set(state => ({
        allGroupsRegistry: state.allGroupsRegistry.some(g => g.id === group.id)
          ? state.allGroupsRegistry.map(g => g.id === group.id ? group : g)
          : [...state.allGroupsRegistry, group]
      })),
      
      // Topic actions
      addTopic: (topic) => set(state => ({
        topics: [...state.topics, topic]
      })),
      
      updateTopic: (topic) => set(state => ({
        topics: state.topics.map(t => t.id === topic.id ? topic : t)
      })),
      
      removeTopic: (topicId) => set(state => ({
        topics: state.topics.filter(t => t.id !== topicId),
        subTopics: state.subTopics.filter(st => st.topicId !== topicId),
        contentItems: state.contentItems.filter(ci => ci.topicId !== topicId)
      })),
      
      // SubTopic actions
      addSubTopic: (subTopic) => set(state => ({
        subTopics: [...state.subTopics, subTopic]
      })),
      
      updateSubTopic: (subTopic) => set(state => ({
        subTopics: state.subTopics.map(st => st.id === subTopic.id ? subTopic : st)
      })),
      
      removeSubTopic: (subTopicId) => set(state => ({
        subTopics: state.subTopics.filter(st => st.id !== subTopicId),
        contentItems: state.contentItems.filter(ci => ci.subTopicId !== subTopicId)
      })),
      
      assignSubTopic: (subTopicId, userId, userName) => set(state => ({
        subTopics: state.subTopics.map(st => 
          st.id === subTopicId 
            ? { ...st, assignedTo: userId, assignedToName: userName, status: 'assigned' as const }
            : st
        )
      })),
      
      updateSubTopicStatus: (subTopicId, status) => set(state => ({
        subTopics: state.subTopics.map(st => 
          st.id === subTopicId ? { ...st, status } : st
        )
      })),
      
      // Content actions
      addContentItem: (item) => set(state => ({
        contentItems: [...state.contentItems, item]
      })),
      
      updateContentItem: (item) => set(state => ({
        contentItems: state.contentItems.map(ci => ci.id === item.id ? item : ci)
      })),
      
      removeContentItem: (itemId) => set(state => ({
        contentItems: state.contentItems.filter(ci => ci.id !== itemId)
      })),
      
      // MCQ actions
      addGroupMCQ: (mcq) => set(state => ({
        groupMCQs: [...state.groupMCQs, mcq]
      })),
      
      removeGroupMCQ: (mcqId) => set(state => ({
        groupMCQs: state.groupMCQs.filter(m => m.id !== mcqId)
      })),
      
      // Question Category actions
      addQuestionCategory: (category) => set(state => ({
        questionCategories: [...state.questionCategories, category]
      })),
      
      removeQuestionCategory: (categoryId) => set(state => ({
        questionCategories: state.questionCategories.filter(c => c.id !== categoryId),
        // Also remove all MCQs in this category
        groupMCQs: state.groupMCQs.filter(m => m.categoryId !== categoryId)
      })),
      
      // Delete Request actions
      createDeleteRequest: (request) => set(state => ({
        deleteRequests: [...state.deleteRequests, request]
      })),
      
      voteOnDeleteRequest: (requestId, userId, approve) => set(state => ({
        deleteRequests: state.deleteRequests.map(req => {
          if (req.id !== requestId) return req
          // Remove from both arrays first (in case switching vote)
          const approvedBy = req.approvedBy.filter(id => id !== userId)
          const rejectedBy = req.rejectedBy.filter(id => id !== userId)
          // Add to appropriate array
          if (approve) {
            approvedBy.push(userId)
          } else {
            rejectedBy.push(userId)
          }
          return { ...req, approvedBy, rejectedBy }
        })
      })),
      
      resolveDeleteRequest: (requestId, approved) => set(state => ({
        deleteRequests: state.deleteRequests.map(req => 
          req.id === requestId 
            ? { ...req, status: approved ? 'approved' as const : 'rejected' as const, resolvedAt: Date.now() }
            : req
        )
      })),
      
      getDeleteRequestsByGroup: (groupId) => {
        return get().deleteRequests.filter(r => r.groupId === groupId && r.status === 'pending')
      },
      
      // Quiz Results Actions
      addQuizResult: (result) => set(state => ({
        quizResults: [...state.quizResults, result]
      })),
      
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
      addContentReport: (report) => set(state => ({
        contentReports: [...state.contentReports, report]
      })),
      
      resolveContentReport: (reportId, status) => set(state => ({
        contentReports: state.contentReports.map(r => 
          r.id === reportId ? { ...r, status, resolvedAt: Date.now() } : r
        )
      })),
      
      getReportsByCreator: (creatorId) => {
        return get().contentReports.filter(r => r.creatorId === creatorId && r.status === 'pending')
      },
      
      getReportsByContent: (contentId) => {
        return get().contentReports.filter(r => r.contentId === contentId)
      },
      
      // Live Tests
      addLiveTest: (test) => set(state => ({
        liveTests: [...state.liveTests, test]
      })),
      
      updateLiveTest: (test) => set(state => ({
        liveTests: state.liveTests.map(t => t.id === test.id ? test : t)
      })),
      
      removeLiveTest: (testId) => set(state => ({
        liveTests: state.liveTests.filter(t => t.id !== testId),
        liveTestResults: state.liveTestResults.filter(r => r.liveTestId !== testId)
      })),
      
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
      addLiveTestResult: (result) => set(state => ({
        liveTestResults: [...state.liveTestResults, result]
      })),
      
      updateLiveTestResult: (result) => set(state => ({
        liveTestResults: state.liveTestResults.map(r => r.id === result.id ? result : r)
      })),
      
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
      setAutoLiveTestConfig: (config) => set(state => {
        const existing = state.autoLiveTestConfigs.findIndex(c => c.groupId === config.groupId)
        if (existing >= 0) {
          const updated = [...state.autoLiveTestConfigs]
          updated[existing] = config
          return { autoLiveTestConfigs: updated }
        }
        return { autoLiveTestConfigs: [...state.autoLiveTestConfigs, config] }
      }),
      
      getAutoLiveTestConfig: (groupId) => {
        return get().autoLiveTestConfigs.find(c => c.groupId === groupId)
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
