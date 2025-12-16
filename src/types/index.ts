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
  assignedMembers?: string[]  // userIds who can edit this topic
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
  source?: 'user' | 'library' | 'admin'  // Content source for security
  order?: number
  createdBy: string
  createdByName: string
  createdAt: number
  updatedAt: number
}

export interface GroupQuestionCategory {
  id: string
  groupId: string
  name: string
  createdAt: number
}

export interface GroupMCQ {
  id: string
  groupId: string
  categoryId: string  // Required - belongs to a category
  subTopicId?: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string  // Optional explanation for the answer
  difficulty?: 'easy' | 'medium' | 'hard'  // Question difficulty level
  createdBy: string
  createdByName: string
  createdAt: number
}

// Group Quiz Result - For Leaderboard and Analytics
export interface GroupQuizResult {
  id: string
  groupId: string
  quizItemId: string  // ContentItem id
  quizTitle: string
  userId: string
  userName: string
  score: number  // percentage
  correct: number
  wrong: number
  unanswered: number
  total: number
  timeTaken: number  // seconds
  answers: { questionId: string; selected: number | null; correct: number }[]
  createdAt: number
}

// Auto Daily Live Test Configuration
export interface AutoLiveTestConfig {
  id: string
  groupId: string
  enabled: boolean
  title: string  // e.g., "Daily Practice Test"
  categoryIds: string[]  // Categories to pick questions from
  startTime: string  // Daily start time in HH:MM format (e.g., "10:00")
  endTime: string  // Daily end time in HH:MM format (e.g., "22:00")
  duration: number  // Test duration in minutes
  questionCount: number  // Number of questions per test
  activeDays: number[]  // 0=Sunday, 1=Monday, ... 6=Saturday
  autoReleaseResult: boolean
  showSolution: boolean
  showLeaderboard: boolean
  createdBy: string
  createdAt: number
  updatedAt: number
}

// Scheduled Live Test System
export interface LiveTest {
  id: string
  groupId: string
  title: string
  startTime: number  // timestamp - when test becomes available
  endTime: number    // timestamp - when test closes
  duration: number   // minutes - how long user has after starting
  questionMode: 'auto' | 'manual'  // auto from category or manual selection
  categoryIds?: string[]  // for auto mode - which categories (multiple)
  questionCount?: number  // for auto mode - how many questions
  questionIds: string[]  // MCQ ids - for manual mode or resolved auto
  autoReleaseResult: boolean  // show result immediately after endTime
  showSolution: boolean  // allow viewing solutions after result
  showLeaderboard: boolean  // show leaderboard
  status: 'scheduled' | 'active' | 'ended' | 'result-released'
  createdBy: string
  createdByName: string
  createdAt: number
}

// Live Test Participant Result
export interface LiveTestResult {
  id: string
  liveTestId: string
  groupId: string
  userId: string
  userName: string
  startedAt: number  // when user started the test
  submittedAt?: number  // when user submitted
  score: number  // percentage
  correct: number
  wrong: number
  unanswered: number
  total: number
  timeTaken: number  // seconds
  answers: { questionId: string; selected: number | null; correct: number }[]
  status: 'in-progress' | 'submitted' | 'auto-submitted'  // auto if time ran out
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

// Content Report/Correction System
export interface ContentReport {
  id: string
  groupId?: string  // Optional - for group content
  contentId: string  // ContentItem id or MCQ id
  contentType: 'note' | 'quiz' | 'mcq' | 'pack'
  contentTitle: string
  reportType?: 'error' | 'inappropriate' | 'copyright' | 'other'  // Optional for new report system
  reportedBy: string  // userId
  reportedByName?: string  // Legacy
  reporterName?: string  // New report system
  description?: string  // New report system
  message?: string  // Legacy - What needs to be corrected
  creatorId: string  // content creator userId - for notification
  creatorName?: string
  questionId?: string  // For quiz - specific question
  status: 'pending' | 'resolved' | 'dismissed' | 'reviewed'
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

// ============================================
// CONTENT LIBRARY SYSTEM - For Instant Download
// ============================================

// Library Subject (e.g., বাংলা, English, Math, GK)
export interface LibrarySubject {
  id: string
  name: string
  nameEn?: string  // English name for search
  icon?: string  // emoji or icon name
  description?: string
  order: number
  isActive: boolean
  createdAt: number
}

// Library Topic (e.g., ব্যাকরণ, সাহিত্য under বাংলা)
export interface LibraryTopic {
  id: string
  subjectId: string
  name: string
  nameEn?: string
  description?: string
  order: number
  isActive: boolean
  createdAt: number
}

// Library Subtopic (e.g., সন্ধি, সমাস under ব্যাকরণ) - Optional
export interface LibrarySubtopic {
  id: string
  subjectId: string
  topicId: string
  name: string
  nameEn?: string
  description?: string
  order: number
  isActive: boolean
  createdAt: number
}

// Library Content Pack - A downloadable unit containing MCQs and/or Notes
export interface LibraryContentPack {
  id: string
  subjectId: string
  topicId: string
  subtopicId?: string  // Optional subtopic
  title: string
  description?: string
  tags: string[]
  contentType: 'mcq' | 'notes' | 'both'  // What this pack contains
  mcqCount: number
  notesCount: number
  pricing: 'free' | 'paid'
  price?: number  // in INR, if paid
  downloadCount: number
  rating?: number
  previewMcqs?: string[]  // First few MCQ ids for preview
  previewNote?: string  // Preview content snippet
  isActive: boolean
  isFeatured: boolean
  createdBy: string
  createdAt: number
  updatedAt: number
}

// Library MCQ - Questions in the library
export interface LibraryMCQ {
  id: string
  packId: string  // Belongs to which content pack
  subjectId: string
  topicId: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
  createdAt: number
}

// Library Note - Notes in the library
export interface LibraryNote {
  id: string
  packId: string  // Belongs to which content pack
  subjectId: string
  topicId: string
  title: string
  content: string  // HTML content
  order: number
  createdAt: number
}

// User's purchased/downloaded content
export interface UserLibraryDownload {
  id: string
  userId: string
  packId: string
  packTitle: string
  subjectId: string
  topicId: string
  pricing: 'free' | 'paid'
  pricePaid?: number
  paymentId?: string  // Razorpay payment id
  downloadedAt: number
}

// ============================================
// COACHING DESK SYSTEM - Teacher Course Platform
// ============================================

// Teacher Profile - Extended profile for teachers selling courses
export interface TeacherProfile {
  id: string  // Same as userId
  userId: string
  displayName: string
  email: string
  photoURL?: string
  phone?: string
  website?: string
  bio: string
  qualifications: string[]
  certificates?: TeacherCertificate[]  // For verification
  subjects: string[]  // Subjects they teach
  experience?: number  // Years of offline experience (user input)
  gsExperience?: number  // Auto-calculated Group Study platform experience in months
  gsJoinedAt?: Date  // When teacher joined GS platform
  institution?: string
  offlineAddress?: string  // Physical address for offline classes
  rating: number  // 0-5
  totalRatings: number
  totalStudents: number
  totalCourses: number
  totalEarnings: number
  consultationEnabled: boolean
  consultationRate?: number  // Per session rate
  consultationDuration?: number  // Session duration in minutes
  consultationSlots?: ConsultationSlot[]
  socialLinks?: {
    website?: string
    youtube?: string
    facebook?: string
    twitter?: string
    linkedin?: string
    instagram?: string
  }
  isVerified: boolean
  verificationStatus?: 'pending' | 'approved' | 'rejected'
  verificationNote?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Teacher Certificate for verification
export interface TeacherCertificate {
  id: string
  name: string  // Certificate name
  institution?: string  // Issuing institution
  year?: string  // Year received
  documentURL?: string  // Uploaded certificate image/PDF
  isVerified: boolean  // Verified by admin
  verifiedAt?: Date
}

// Consultation Time Slots
export interface ConsultationSlot {
  id: string
  day: number  // 0-6 (Sunday-Saturday)
  startTime: string  // HH:MM format
  endTime: string
  isAvailable: boolean
}

// Course - Main course entity
export interface Course {
  id: string
  teacherId: string
  teacherName?: string
  teacherPhoto?: string
  title: string
  subtitle?: string
  description: string
  thumbnail?: string
  promoVideo?: string  // YouTube or uploaded video URL
  category: string  // e.g., "BCS", "Bank Job", "SSC", "HSC"
  subcategory?: string
  tags: string[]
  language: string  // "Bengali", "English", "Hindi"
  level: 'beginner' | 'intermediate' | 'advanced' | 'all'
  pricing?: 'free' | 'paid'
  price: number  // 0 for free
  discountPrice?: number
  discountEndsAt?: number
  currency: string  // INR, USD, BDT
  
  // Course Content Stats
  totalSections: number
  totalLessons: number
  totalMockTests?: number
  totalLiveTests?: number
  totalDuration: number  // minutes
  estimatedDuration?: number  // hours
  
  // Course Content Details
  whatYouWillLearn: string[]
  requirements: string[]
  
  // Engagement
  enrolledCount?: number
  totalStudents: number
  rating: number
  totalRatings?: number
  totalReviews: number
  
  // Settings
  hasPreview: boolean  // Allow preview lessons
  hasCertificate: boolean
  discussionEnabled?: boolean
  isPublished: boolean
  
  // Status
  status?: 'draft' | 'pending-review' | 'published' | 'unpublished'
  publishedAt?: number
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  
  // Inline embedded sections (for simpler course structure)
  sections?: InlineSection[]
}

// Inline Section for embedded course structure
export interface InlineSection {
  id: string
  title: string
  lessons: InlineLesson[]
  order: number
}

// Inline Lesson for embedded course structure
export interface InlineLesson {
  id: string
  title: string
  type: 'video' | 'note' | 'quiz' | 'pdf' | 'link' | 'live-class' | 'live-test'
  content?: string
  quizQuestions?: InlineMCQ[]
  duration?: number
  order: number
}

// Inline MCQ for embedded quizzes
export interface InlineMCQ {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

// Course Section (Chapter) - for separate collection storage
export interface CourseSection {
  id: string
  courseId: string
  title: string
  description?: string
  order: number
  isPublished: boolean
  createdAt: number
}

// Course Lesson - Individual content items within a section
export interface CourseLesson {
  id: string
  courseId: string
  sectionId: string
  title: string
  type: 'video' | 'note' | 'quiz' | 'pdf' | 'link' | 'live-class'
  content: string  // Video URL, HTML content, Quiz JSON, PDF URL, Link URL
  duration?: number  // minutes (for video/live-class)
  isPreviewable: boolean  // Can be viewed without enrollment
  isPublished: boolean
  order: number
  
  // For Quiz type
  quizQuestions?: CourseMCQ[]
  quizTimeLimit?: number  // minutes
  quizPassingScore?: number  // percentage
  
  // For Live Class
  liveClassStartTime?: number
  liveClassEndTime?: number
  liveClassLink?: string  // Zoom/Meet link
  
  createdAt: number
  updatedAt: number
}

// Course MCQ - Questions for quizzes in courses
export interface CourseMCQ {
  id: string
  courseId: string
  lessonId?: string  // If part of a lesson quiz
  mockTestId?: string  // If part of a mock test
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
  marks: number
  negativeMarks: number
  difficulty: 'easy' | 'medium' | 'hard'
  order: number
}

// Mock Test - Full-length practice tests
export interface CourseMockTest {
  id: string
  courseId: string
  title: string
  description?: string
  duration: number  // minutes
  totalQuestions: number
  totalMarks: number
  passingMarks: number
  negativeMarking: boolean
  negativeMarksPerQuestion: number
  shuffleQuestions: boolean
  showResultImmediately: boolean
  showSolutions: boolean
  attemptsAllowed: number  // 0 = unlimited
  isPreviewable: boolean
  isPublished: boolean
  order: number
  createdAt: number
}

// Live Test - Scheduled tests with time window
export interface CourseLiveTest {
  id: string
  courseId: string
  title: string
  description?: string
  startTime: number  // When test opens
  endTime: number  // When test closes
  duration: number  // minutes per attempt
  totalQuestions: number
  totalMarks: number
  passingMarks: number
  negativeMarking: boolean
  negativeMarksPerQuestion: number
  shuffleQuestions: boolean
  autoReleaseResult: boolean
  showSolutions: boolean
  showLeaderboard: boolean
  status: 'scheduled' | 'active' | 'ended' | 'result-released'
  isPublished: boolean
  order: number
  createdAt: number
}

// Student Enrollment
export interface CourseEnrollment {
  id: string
  courseId: string
  courseTitle: string
  teacherId: string
  teacherName: string
  studentId: string
  studentName: string
  studentEmail: string
  pricing: 'free' | 'paid'
  pricePaid: number
  paymentId?: string  // Payment gateway reference
  paymentMethod?: string
  progress: number  // percentage
  completedLessons: number  // count of completed lessons
  completedLessonIds?: string[]  // lesson IDs
  lastAccessedAt: number
  certificateIssued?: boolean
  certificateId?: string
  certificateUrl?: string
  completedAt?: Date  // When course was completed
  status: 'active' | 'expired' | 'refunded'
  enrolledAt: number
  expiresAt?: number  // For time-limited access
}

// Student Progress for a lesson
export interface LessonProgress {
  id: string
  enrollmentId: string
  courseId: string
  lessonId: string
  studentId: string
  status: 'not-started' | 'in-progress' | 'completed'
  watchTime?: number  // seconds for video
  quizScore?: number  // percentage for quiz
  quizAttempts?: number
  completedAt?: number
  lastAccessedAt: number
}

// Mock Test Attempt
export interface MockTestAttempt {
  id: string
  mockTestId: string
  courseId: string
  studentId: string
  studentName: string
  answers: { questionId: string; selected: number | null }[]
  score: number
  totalMarks: number
  percentage: number
  correct: number
  wrong: number
  unanswered: number
  timeTaken: number  // seconds
  startedAt: number
  submittedAt: number
  status: 'in-progress' | 'submitted' | 'auto-submitted'
}

// Live Test Attempt
export interface LiveTestAttempt {
  id: string
  liveTestId: string
  courseId: string
  studentId: string
  studentName: string
  answers: { questionId: string; selected: number | null }[]
  score: number
  totalMarks: number
  percentage: number
  correct: number
  wrong: number
  unanswered: number
  timeTaken: number
  rank?: number
  startedAt: number
  submittedAt?: number
  status: 'in-progress' | 'submitted' | 'auto-submitted'
}

// Course Review/Rating
export interface CourseReview {
  id: string
  courseId: string
  studentId: string
  studentName: string
  studentPhoto?: string
  rating: number  // 1-5
  review: string
  isVerifiedPurchase: boolean
  helpfulCount: number
  reportCount: number
  teacherReply?: string
  teacherRepliedAt?: number
  status: 'published' | 'hidden' | 'flagged'
  createdAt: number
  updatedAt: number
}

// Consultation Booking
export interface ConsultationBooking {
  id: string
  teacherId: string
  teacherName: string
  studentId: string
  studentName: string
  studentEmail: string
  date: string  // YYYY-MM-DD
  startTime: string  // HH:MM
  endTime: string
  duration: number  // minutes
  topic: string
  notes?: string
  meetingLink?: string  // Zoom/Meet link
  price: number
  paymentId?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  cancelledBy?: string
  cancellationReason?: string
  rating?: number
  feedback?: string
  createdAt: number
  updatedAt: number
}

// Course Announcement
export interface CourseAnnouncement {
  id: string
  courseId: string
  teacherId: string
  title: string
  content: string
  isPinned: boolean
  createdAt: number
}

// Course Discussion (Q&A)
export interface CourseDiscussion {
  id: string
  courseId: string
  lessonId?: string
  studentId: string
  studentName: string
  studentPhoto?: string
  question: string
  answers: DiscussionAnswer[]
  isResolved: boolean
  upvotes: number
  createdAt: number
}

export interface DiscussionAnswer {
  id: string
  discussionId: string
  userId: string
  userName: string
  userPhoto?: string
  isTeacher: boolean
  answer: string
  upvotes: number
  isAccepted: boolean
  createdAt: number
}

// Teacher Analytics
export interface TeacherAnalytics {
  teacherId: string
  totalRevenue: number
  monthlyRevenue: number
  totalStudents: number
  activeStudents: number
  totalCourses: number
  publishedCourses: number
  averageRating: number
  totalReviews: number
  completionRate: number  // Average course completion
  consultationsCompleted: number
  consultationRevenue: number
}

// Course Analytics
export interface CourseAnalytics {
  courseId: string
  totalEnrollments: number
  activeStudents: number
  completionRate: number
  averageProgress: number
  averageRating: number
  totalRevenue: number
  topLessons: { lessonId: string; title: string; views: number }[]
  dropOffPoints: { lessonId: string; title: string; dropRate: number }[]
}

// ==========================================
// ASSET LIBRARY TYPES
// ==========================================

// Asset Subject (User's own subject classification)
export interface AssetSubject {
  id: string
  userId: string
  name: string
  icon?: string  // emoji or icon name
  order: number
  createdAt: number
}

// Asset Topic (Under Subject)
export interface AssetTopic {
  id: string
  userId: string
  subjectId: string
  name: string
  order: number
  createdAt: number
}

// Asset Subtopic (Optional, under Topic)
export interface AssetSubtopic {
  id: string
  userId: string
  topicId: string
  name: string
  order: number
  createdAt: number
}

// Asset Type enum
export type AssetType = 'mcq' | 'note' | 'url' | 'pdf' | 'video'

// Usage Reference - tracks where asset is used
export interface AssetUsageRef {
  deskType: 'personal' | 'group' | 'teacher'
  deskId: string  // groupId or courseId or 'personal'
  deskName: string  // Group name or Course name
  categoryId?: string
  categoryName?: string
  addedAt: number
}

// Base Asset interface
export interface Asset {
  id: string
  userId: string
  type: AssetType
  
  // Categorization
  subjectId: string
  topicId: string
  subtopicId?: string
  tags?: string[]
  
  // Metadata
  title: string  // For display in list
  createdAt: number
  updatedAt: number
  
  // Usage tracking
  usedIn: AssetUsageRef[]
}

// MCQ Asset - Collection of MCQs
export interface AssetMCQQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface AssetMCQ extends Asset {
  type: 'mcq'
  quizQuestions: AssetMCQQuestion[]
}

// Note Asset
export interface AssetNote extends Asset {
  type: 'note'
  content: string  // HTML content
}

// URL Asset (Link)
export interface AssetURL extends Asset {
  type: 'url'
  url: string
  description?: string
  thumbnail?: string
}

// PDF Asset
export interface AssetPDF extends Asset {
  type: 'pdf'
  fileUrl: string
  fileName: string
  fileSize: number
  pageCount?: number
}

// Video Asset
export interface AssetVideo extends Asset {
  type: 'video'
  videoUrl: string  // YouTube, Vimeo, or direct URL
  videoType: 'youtube' | 'vimeo' | 'direct'
  duration?: number  // seconds
  thumbnail?: string
}

// Union type for all assets
export type AnyAsset = AssetMCQ | AssetNote | AssetURL | AssetPDF | AssetVideo

// ============================================
// PERSONAL DESK - Course-based Structure
// (Same structure as Group Desk)
// ============================================

export interface PersonalCourse {
  id: string
  userId: string
  name: string
  description?: string
  icon?: string  // emoji or icon name
  color?: string  // theme color
  order: number
  createdAt: number
  updatedAt: number
}

export interface PersonalTopic {
  id: string
  courseId: string
  userId: string
  name: string
  order: number
  createdAt: number
}

export interface PersonalSubTopic {
  id: string
  topicId: string
  courseId: string
  userId: string
  name: string
  order: number
  status: 'todo' | 'in-progress' | 'completed'
  createdAt: number
}

export interface PersonalContentItem {
  id: string
  subTopicId: string
  topicId: string
  courseId: string
  userId: string
  type: 'note' | 'quiz' | 'file' | 'link'
  title: string
  content: string  // HTML for notes, JSON for quiz, URL for files/links
  order?: number
  assetRef?: string  // Reference to Asset Library item
  createdAt: number
  updatedAt: number
}

export interface PersonalQuestionCategory {
  id: string
  courseId: string
  userId: string
  name: string
  createdAt: number
}

export interface PersonalMCQ {
  id: string
  courseId: string
  categoryId: string
  userId: string
  subTopicId?: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  assetRef?: string  // Reference to Asset Library item
  createdAt: number
}

export interface PersonalQuizResult {
  id: string
  courseId: string
  quizItemId: string
  quizTitle: string
  userId: string
  score: number
  correct: number
  wrong: number
  unanswered: number
  total: number
  timeTaken: number
  answers: { questionId: string; selected: number | null; correct: number }[]
  createdAt: number
}

export interface PersonalLiveTest {
  id: string
  courseId: string
  userId: string
  title: string
  categoryIds: string[]
  questionCount: number
  duration: number  // minutes
  scheduledAt?: number
  startedAt?: number
  endedAt?: number
  status: 'scheduled' | 'active' | 'completed'
  showSolution: boolean
  createdAt: number
}

export interface PersonalLiveTestResult {
  id: string
  testId: string
  courseId: string
  userId: string
  score: number
  correct: number
  wrong: number
  unanswered: number
  total: number
  timeTaken: number
  answers: { questionId: string; selected: number | null; correct: number }[]
  submittedAt: number
}

export interface PersonalAutoLiveTestConfig {
  id: string
  courseId: string
  userId: string
  enabled: boolean
  title: string
  categoryIds: string[]  // Topic IDs for question selection
  startTime: string  // Format: "HH:mm"
  endTime: string    // Format: "HH:mm"
  duration: number   // minutes
  questionCount: number
  activeDays: number[]  // 0-6, Sunday = 0
  showSolution: boolean
  createdAt: number
  updatedAt: number
}

// ==================== NOTIFICATION SYSTEM ====================

export interface UserNotification {
  id: string
  userId: string
  type: 'report' | 'system' | 'update' | 'message'
  title: string
  message: string
  link?: string  // Link to navigate when clicked
  isRead: boolean
  createdAt: number
}
