import { z } from 'zod'

// User Types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1),
  photoURL: z.string().url().optional(),
  institution: z.string().optional(),
  groups: z.array(z.string()).default([]),
  role: z.enum(['student', 'teacher', 'admin']).default('student'),
  isGuest: z.boolean().optional(),
  createdAt: z.date(),
  lastActive: z.date(),
})

export type User = z.infer<typeof UserSchema>

// Note Types
export const NoteSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string(),
  subject: z.string().optional(),
  userId: z.string(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type Note = z.infer<typeof NoteSchema>

// Group Types
export const MemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  role: z.enum(['admin', 'moderator', 'member']),
  joinedAt: z.number(),
})

export type Member = z.infer<typeof MemberSchema>

export const GroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  groupCode: z.string(),
  adminId: z.string(),
  adminName: z.string(),
  memberIds: z.array(z.string()),
  members: z.array(MemberSchema),
  createdAt: z.number(),
})

export type Group = z.infer<typeof GroupSchema>

// Group Course Structure Types
export interface GroupTopic {
  id: string
  groupId: string
  name: string
  order: number
  createdAt: number
}

export interface GroupSubTopic {
  id: string
  topicId: string
  groupId: string
  name: string
  order: number
  assignedTo?: string  // userId
  assignedToName?: string
  status: 'unassigned' | 'assigned' | 'submitted' | 'approved'
  createdAt: number
}

export interface GroupContentItem {
  id: string
  subTopicId: string
  topicId: string
  groupId: string
  type: 'note' | 'quiz' | 'file'
  title: string
  content: string  // HTML for notes, JSON for quiz, URL for files
  order?: number
  createdBy: string
  createdByName: string
  createdAt: number
  updatedAt: number
}

export interface GroupMCQ {
  id: string
  groupId: string
  subTopicId?: string
  question: string
  options: string[]
  correctIndex: number
  createdBy: string
  createdByName: string
  createdAt: number
}

// Delete Request System - Democratic Deletion
export interface DeleteRequest {
  id: string
  groupId: string
  targetType: 'group' | 'topic' | 'content'  // What to delete
  targetId: string
  targetName: string  // For display
  requesterId: string
  requesterName: string
  requesterRole: 'admin' | 'moderator' | 'member'
  approvedBy: string[]  // userIds who approved
  rejectedBy: string[]  // userIds who rejected
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
  resolvedAt?: number
}

// Quiz Types
export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.number(),
  explanation: z.string().optional(),
  points: z.number().default(1),
})

export type Question = z.infer<typeof QuestionSchema>

export const QuizSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(QuestionSchema),
  duration: z.number().optional(), // in minutes
  creatorId: z.string(),
  creatorName: z.string(),
  isPublished: z.boolean().default(false),
  createdAt: z.number(),
})

export type Quiz = z.infer<typeof QuizSchema>

export const QuizResultSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  userId: z.string(),
  userName: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  answers: z.record(z.number()),
  timeTaken: z.number().optional(),
  submittedAt: z.number(),
})

export type QuizResult = z.infer<typeof QuizResultSchema>

// Coaching Types
export const CoachingSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  coachingCode: z.string(),
  ownerId: z.string(),
  ownerName: z.string(),
  memberIds: z.array(z.string()),
  members: z.array(MemberSchema),
  createdAt: z.number(),
})

export type Coaching = z.infer<typeof CoachingSchema>
