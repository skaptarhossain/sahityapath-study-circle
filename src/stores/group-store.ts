import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Group, Member, GroupTopic, GroupSubTopic, GroupContentItem, GroupMCQ, DeleteRequest } from '@/types'

interface GroupState {
  // Current user's groups
  myGroups: Group[]
  activeGroupId: string | null
  
  // Active group data
  topics: GroupTopic[]
  subTopics: GroupSubTopic[]
  contentItems: GroupContentItem[]
  groupMCQs: GroupMCQ[]
  deleteRequests: DeleteRequest[]
  
  // Actions - Groups
  addGroup: (group: Group) => void
  removeGroup: (groupId: string) => void
  updateGroup: (group: Group) => void
  setActiveGroup: (groupId: string | null) => void
  
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
  
  // Actions - Delete Requests
  createDeleteRequest: (request: DeleteRequest) => void
  voteOnDeleteRequest: (requestId: string, userId: string, approve: boolean) => void
  resolveDeleteRequest: (requestId: string, approved: boolean) => void
  getDeleteRequestsByGroup: (groupId: string) => DeleteRequest[]
  
  // Helpers
  getActiveGroup: () => Group | undefined
  getTopicsByGroup: (groupId: string) => GroupTopic[]
  getSubTopicsByTopic: (topicId: string) => GroupSubTopic[]
  getContentBySubTopic: (subTopicId: string) => GroupContentItem[]
  getMCQsByGroup: (groupId: string) => GroupMCQ[]
  getLatestNotes: (groupId: string, count: number) => GroupContentItem[]
  getLatestQuizzes: (groupId: string, count: number) => GroupContentItem[]
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      myGroups: [],
      activeGroupId: null,
      topics: [],
      subTopics: [],
      contentItems: [],
      groupMCQs: [],
      deleteRequests: [],
      
      // Group actions
      addGroup: (group) => set(state => ({ 
        myGroups: [...state.myGroups, group] 
      })),
      
      removeGroup: (groupId) => set(state => ({ 
        myGroups: state.myGroups.filter(g => g.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId
      })),
      
      updateGroup: (group) => set(state => ({
        myGroups: state.myGroups.map(g => g.id === group.id ? group : g)
      })),
      
      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
      
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
