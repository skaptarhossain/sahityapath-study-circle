import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  saveTeacherProfile as saveTeacherToFirestore,
  saveCourse as saveCourseToFirestore,
  deleteCourse as deleteCourseFromFirestore,
  getTeacherProfile as getTeacherFromFirestore,
  getCoursesByTeacher as getCoursesFromFirestore,
  getAllCourses as getAllCoursesFromFirestore,
  getAllTeachers as getAllTeachersFromFirestore
} from '@/services/coaching-firestore'
import type {
  TeacherProfile,
  Course,
  CourseSection,
  CourseLesson,
  CourseMCQ,
  CourseMockTest,
  CourseLiveTest,
  CourseEnrollment,
  LessonProgress,
  MockTestAttempt,
  LiveTestAttempt,
  CourseReview,
  ConsultationBooking,
  CourseAnnouncement,
  CourseDiscussion,
} from '@/types'

interface CoachingState {
  // Teachers List (All teachers)
  teachers: TeacherProfile[]
  
  // Teacher Profile (Current user if teacher)
  teacherProfile: TeacherProfile | null
  
  // Courses
  courses: Course[]
  myCourses: Course[]  // Teacher's own courses
  enrolledCourses: Course[]  // Student's enrolled courses
  
  // Course Content
  sections: CourseSection[]
  lessons: CourseLesson[]
  mcqs: CourseMCQ[]
  mockTests: CourseMockTest[]
  liveTests: CourseLiveTest[]
  
  // Enrollments & Progress
  enrollments: CourseEnrollment[]
  lessonProgress: LessonProgress[]
  mockTestAttempts: MockTestAttempt[]
  liveTestAttempts: LiveTestAttempt[]
  
  // Reviews & Discussions
  reviews: CourseReview[]
  announcements: CourseAnnouncement[]
  discussions: CourseDiscussion[]
  
  // Consultations
  consultationBookings: ConsultationBooking[]
  
  // UI State
  activeCourseId: string | null
  activeView: 'teacher' | 'student'
  
  // ================== ACTIONS ==================
  
  // Firestore Sync
  loadFromFirestore: (userId: string) => Promise<void>
  
  // Teacher Actions
  addTeacher: (teacher: TeacherProfile) => void
  updateTeacher: (teacherId: string, updates: Partial<TeacherProfile>) => void
  removeTeacher: (teacherId: string) => void
  
  // Teacher Profile Actions
  setTeacherProfile: (profile: TeacherProfile | null) => void
  updateTeacherProfile: (updates: Partial<TeacherProfile>) => void
  
  // Course Actions
  setCourses: (courses: Course[]) => void
  addCourse: (course: Course) => void
  updateCourse: (course: Course) => void
  removeCourse: (courseId: string) => void
  setActiveCourse: (courseId: string | null) => void
  
  // Section Actions
  addSection: (section: CourseSection) => void
  updateSection: (section: CourseSection) => void
  removeSection: (sectionId: string) => void
  reorderSections: (courseId: string, sectionIds: string[]) => void
  
  // Lesson Actions
  addLesson: (lesson: CourseLesson) => void
  updateLesson: (lesson: CourseLesson) => void
  removeLesson: (lessonId: string) => void
  reorderLessons: (sectionId: string, lessonIds: string[]) => void
  
  // MCQ Actions
  addMCQ: (mcq: CourseMCQ) => void
  updateMCQ: (mcq: CourseMCQ) => void
  removeMCQ: (mcqId: string) => void
  bulkAddMCQs: (mcqs: CourseMCQ[]) => void
  
  // Mock Test Actions
  addMockTest: (test: CourseMockTest) => void
  updateMockTest: (test: CourseMockTest) => void
  removeMockTest: (testId: string) => void
  
  // Live Test Actions
  addLiveTest: (test: CourseLiveTest) => void
  updateLiveTest: (test: CourseLiveTest) => void
  removeLiveTest: (testId: string) => void
  
  // Enrollment Actions
  addEnrollment: (enrollment: CourseEnrollment) => void
  updateEnrollment: (enrollment: CourseEnrollment) => void
  
  // Progress Actions
  updateLessonProgress: (progress: LessonProgress) => void
  markLessonComplete: (enrollmentId: string, lessonId: string) => void
  
  // Test Attempt Actions
  addMockTestAttempt: (attempt: MockTestAttempt) => void
  updateMockTestAttempt: (attempt: MockTestAttempt) => void
  addLiveTestAttempt: (attempt: LiveTestAttempt) => void
  updateLiveTestAttempt: (attempt: LiveTestAttempt) => void
  
  // Review Actions
  addReview: (review: CourseReview) => void
  updateReview: (review: CourseReview) => void
  
  // Announcement Actions
  addAnnouncement: (announcement: CourseAnnouncement) => void
  removeAnnouncement: (announcementId: string) => void
  
  // Discussion Actions
  addDiscussion: (discussion: CourseDiscussion) => void
  updateDiscussion: (discussion: CourseDiscussion) => void
  
  // Consultation Actions
  addConsultationBooking: (booking: ConsultationBooking) => void
  updateConsultationBooking: (booking: ConsultationBooking) => void
  
  // ================== GETTERS ==================
  
  // Course Getters
  getCourseById: (courseId: string) => Course | undefined
  getCoursesByTeacher: (teacherId: string) => Course[]
  getPublishedCourses: () => Course[]
  getCoursesByCategory: (category: string) => Course[]
  
  // Section Getters
  getSectionsByCourse: (courseId: string) => CourseSection[]
  
  // Lesson Getters
  getLessonsBySection: (sectionId: string) => CourseLesson[]
  getLessonsByCourse: (courseId: string) => CourseLesson[]
  getPreviewableLessons: (courseId: string) => CourseLesson[]
  
  // MCQ Getters
  getMCQsByLesson: (lessonId: string) => CourseMCQ[]
  getMCQsByMockTest: (mockTestId: string) => CourseMCQ[]
  
  // Test Getters
  getMockTestsByCourse: (courseId: string) => CourseMockTest[]
  getLiveTestsByCourse: (courseId: string) => CourseLiveTest[]
  getUpcomingLiveTests: (courseId: string) => CourseLiveTest[]
  getActiveLiveTests: (courseId: string) => CourseLiveTest[]
  
  // Enrollment Getters
  getEnrollmentsByCourse: (courseId: string) => CourseEnrollment[]
  getEnrollmentsByStudent: (studentId: string) => CourseEnrollment[]
  isEnrolled: (courseId: string, studentId: string) => boolean
  
  // Progress Getters
  getProgressByEnrollment: (enrollmentId: string) => LessonProgress[]
  getCourseProgress: (courseId: string, studentId: string) => number
  
  // Attempt Getters
  getMockTestAttempts: (mockTestId: string, studentId: string) => MockTestAttempt[]
  getLiveTestAttempt: (liveTestId: string, studentId: string) => LiveTestAttempt | undefined
  getMockTestLeaderboard: (mockTestId: string) => MockTestAttempt[]
  getLiveTestLeaderboard: (liveTestId: string) => LiveTestAttempt[]
  
  // Review Getters
  getReviewsByCourse: (courseId: string) => CourseReview[]
  
  // Consultation Getters
  getConsultationsByTeacher: (teacherId: string) => ConsultationBooking[]
  getConsultationsByStudent: (studentId: string) => ConsultationBooking[]
  getUpcomingConsultations: (userId: string) => ConsultationBooking[]
  
  // Analytics
  getTeacherStats: (teacherId: string) => {
    totalCourses: number
    totalStudents: number
    totalRevenue: number
    averageRating: number
  }
  getCourseStats: (courseId: string) => {
    enrollments: number
    completionRate: number
    averageRating: number
    revenue: number
  }
}

export const useCoachingStore = create<CoachingState>()(
  persist(
    (set, get) => ({
      // Initial State
      teachers: [],
      teacherProfile: null,
      courses: [],
      myCourses: [],
      enrolledCourses: [],
      sections: [],
      lessons: [],
      mcqs: [],
      mockTests: [],
      liveTests: [],
      enrollments: [],
      lessonProgress: [],
      mockTestAttempts: [],
      liveTestAttempts: [],
      reviews: [],
      announcements: [],
      discussions: [],
      consultationBookings: [],
      activeCourseId: null,
      activeView: 'student',

      // ================== ACTIONS ==================

      // Firestore Sync
      loadFromFirestore: async (userId: string) => {
        try {
          // Load teacher profile
          const profile = await getTeacherFromFirestore(userId);
          if (profile) {
            set({ teacherProfile: profile });
          }
          
          // Load all teachers
          const teachers = await getAllTeachersFromFirestore();
          if (teachers.length > 0) {
            set({ teachers });
          }
          
          // Load user's courses - use teacher_userId format to match course.teacherId
          const teacherId = `teacher_${userId}`;
          const myCourses = await getCoursesFromFirestore(teacherId);
          if (myCourses.length > 0) {
            set({ myCourses });
          }
          
          // Load all courses
          const allCourses = await getAllCoursesFromFirestore();
          if (allCourses.length > 0) {
            set({ courses: allCourses });
          }
        } catch (error) {
          console.error('Error loading from Firestore:', error);
        }
      },

      // Teacher Actions
      addTeacher: (teacher) => {
        set(state => ({
          teachers: [...state.teachers, teacher],
          teacherProfile: teacher  // Set as current teacher profile too
        }));
        // Sync to Firestore
        saveTeacherToFirestore(teacher).catch(console.error);
      },
      updateTeacher: (teacherId, updates) => {
        set(state => {
          const updatedTeachers = state.teachers.map(t => 
            t.id === teacherId 
              ? { ...t, ...updates, updatedAt: new Date() }
              : t
          );
          const updatedProfile = state.teacherProfile?.id === teacherId
            ? { ...state.teacherProfile, ...updates, updatedAt: new Date() }
            : state.teacherProfile;
          
          // Sync to Firestore
          if (updatedProfile && state.teacherProfile?.id === teacherId) {
            saveTeacherToFirestore(updatedProfile).catch(console.error);
          }
          
          return {
            teachers: updatedTeachers,
            teacherProfile: updatedProfile
          };
        });
      },
      removeTeacher: (teacherId) => set(state => ({
        teachers: state.teachers.filter(t => t.id !== teacherId)
      })),

      // Teacher Profile
      setTeacherProfile: (profile) => {
        set({ teacherProfile: profile });
        // Sync to Firestore
        if (profile) {
          saveTeacherToFirestore(profile).catch(console.error);
        }
      },
      updateTeacherProfile: (updates) => set(state => {
        const updatedProfile = state.teacherProfile 
          ? { ...state.teacherProfile, ...updates, updatedAt: new Date() }
          : null;
        // Sync to Firestore
        if (updatedProfile) {
          saveTeacherToFirestore(updatedProfile).catch(console.error);
        }
        return { teacherProfile: updatedProfile };
      }),

      // Course Actions
      setCourses: (courses) => set({ courses }),
      addCourse: (course) => {
        set(state => ({
          courses: [...state.courses, course],
          myCourses: [...state.myCourses, course]
        }));
        // Sync to Firestore
        saveCourseToFirestore(course).catch(console.error);
      },
      updateCourse: (course) => {
        set(state => ({
          courses: state.courses.map(c => c.id === course.id ? course : c),
          myCourses: state.myCourses.map(c => c.id === course.id ? course : c)
        }));
        // Sync to Firestore
        saveCourseToFirestore(course).catch(console.error);
      },
      removeCourse: (courseId) => {
        set(state => ({
          courses: state.courses.filter(c => c.id !== courseId),
          myCourses: state.myCourses.filter(c => c.id !== courseId),
          sections: state.sections.filter(s => s.courseId !== courseId),
          lessons: state.lessons.filter(l => l.courseId !== courseId),
          mcqs: state.mcqs.filter(m => m.courseId !== courseId),
          mockTests: state.mockTests.filter(t => t.courseId !== courseId),
          liveTests: state.liveTests.filter(t => t.courseId !== courseId)
        }));
        // Delete from Firestore
        deleteCourseFromFirestore(courseId).catch(console.error);
      },
      setActiveCourse: (courseId) => set({ activeCourseId: courseId }),

      // Section Actions
      addSection: (section) => set(state => ({
        sections: [...state.sections, section]
      })),
      updateSection: (section) => set(state => ({
        sections: state.sections.map(s => s.id === section.id ? section : s)
      })),
      removeSection: (sectionId) => set(state => ({
        sections: state.sections.filter(s => s.id !== sectionId),
        lessons: state.lessons.filter(l => l.sectionId !== sectionId)
      })),
      reorderSections: (courseId, sectionIds) => set(state => ({
        sections: state.sections.map(s => {
          if (s.courseId !== courseId) return s
          const newOrder = sectionIds.indexOf(s.id)
          return newOrder >= 0 ? { ...s, order: newOrder } : s
        })
      })),

      // Lesson Actions
      addLesson: (lesson) => set(state => ({
        lessons: [...state.lessons, lesson]
      })),
      updateLesson: (lesson) => set(state => ({
        lessons: state.lessons.map(l => l.id === lesson.id ? lesson : l)
      })),
      removeLesson: (lessonId) => set(state => ({
        lessons: state.lessons.filter(l => l.id !== lessonId),
        mcqs: state.mcqs.filter(m => m.lessonId !== lessonId)
      })),
      reorderLessons: (sectionId, lessonIds) => set(state => ({
        lessons: state.lessons.map(l => {
          if (l.sectionId !== sectionId) return l
          const newOrder = lessonIds.indexOf(l.id)
          return newOrder >= 0 ? { ...l, order: newOrder } : l
        })
      })),

      // MCQ Actions
      addMCQ: (mcq) => set(state => ({ mcqs: [...state.mcqs, mcq] })),
      updateMCQ: (mcq) => set(state => ({
        mcqs: state.mcqs.map(m => m.id === mcq.id ? mcq : m)
      })),
      removeMCQ: (mcqId) => set(state => ({
        mcqs: state.mcqs.filter(m => m.id !== mcqId)
      })),
      bulkAddMCQs: (mcqs) => set(state => ({
        mcqs: [...state.mcqs, ...mcqs]
      })),

      // Mock Test Actions
      addMockTest: (test) => set(state => ({
        mockTests: [...state.mockTests, test]
      })),
      updateMockTest: (test) => set(state => ({
        mockTests: state.mockTests.map(t => t.id === test.id ? test : t)
      })),
      removeMockTest: (testId) => set(state => ({
        mockTests: state.mockTests.filter(t => t.id !== testId),
        mcqs: state.mcqs.filter(m => m.mockTestId !== testId)
      })),

      // Live Test Actions
      addLiveTest: (test) => set(state => ({
        liveTests: [...state.liveTests, test]
      })),
      updateLiveTest: (test) => set(state => ({
        liveTests: state.liveTests.map(t => t.id === test.id ? test : t)
      })),
      removeLiveTest: (testId) => set(state => ({
        liveTests: state.liveTests.filter(t => t.id !== testId)
      })),

      // Enrollment Actions
      addEnrollment: (enrollment) => set(state => ({
        enrollments: [...state.enrollments, enrollment],
        enrolledCourses: [
          ...state.enrolledCourses,
          state.courses.find(c => c.id === enrollment.courseId)!
        ].filter(Boolean)
      })),
      updateEnrollment: (enrollment) => set(state => ({
        enrollments: state.enrollments.map(e => e.id === enrollment.id ? enrollment : e)
      })),

      // Progress Actions
      updateLessonProgress: (progress) => set(state => ({
        lessonProgress: state.lessonProgress.some(p => p.id === progress.id)
          ? state.lessonProgress.map(p => p.id === progress.id ? progress : p)
          : [...state.lessonProgress, progress]
      })),
      markLessonComplete: (enrollmentId, lessonId) => set(state => {
        const enrollment = state.enrollments.find(e => e.id === enrollmentId)
        if (!enrollment) return state
        
        const completedLessonIds = [...new Set([...(enrollment.completedLessonIds || []), lessonId])]
        const totalLessons = state.lessons.filter(l => l.courseId === enrollment.courseId).length
        const progress = totalLessons > 0 ? (completedLessonIds.length / totalLessons) * 100 : 0
        
        return {
          enrollments: state.enrollments.map(e => 
            e.id === enrollmentId 
              ? { 
                  ...e, 
                  completedLessonIds, 
                  completedLessons: completedLessonIds.length,
                  progress, 
                  lastAccessedAt: Date.now() 
                }
              : e
          )
        }
      }),

      // Test Attempt Actions
      addMockTestAttempt: (attempt) => set(state => ({
        mockTestAttempts: [...state.mockTestAttempts, attempt]
      })),
      updateMockTestAttempt: (attempt) => set(state => ({
        mockTestAttempts: state.mockTestAttempts.map(a => a.id === attempt.id ? attempt : a)
      })),
      addLiveTestAttempt: (attempt) => set(state => ({
        liveTestAttempts: [...state.liveTestAttempts, attempt]
      })),
      updateLiveTestAttempt: (attempt) => set(state => ({
        liveTestAttempts: state.liveTestAttempts.map(a => a.id === attempt.id ? attempt : a)
      })),

      // Review Actions
      addReview: (review) => set(state => ({ reviews: [...state.reviews, review] })),
      updateReview: (review) => set(state => ({
        reviews: state.reviews.map(r => r.id === review.id ? review : r)
      })),

      // Announcement Actions
      addAnnouncement: (announcement) => set(state => ({
        announcements: [...state.announcements, announcement]
      })),
      removeAnnouncement: (announcementId) => set(state => ({
        announcements: state.announcements.filter(a => a.id !== announcementId)
      })),

      // Discussion Actions
      addDiscussion: (discussion) => set(state => ({
        discussions: [...state.discussions, discussion]
      })),
      updateDiscussion: (discussion) => set(state => ({
        discussions: state.discussions.map(d => d.id === discussion.id ? discussion : d)
      })),

      // Consultation Actions
      addConsultationBooking: (booking) => set(state => ({
        consultationBookings: [...state.consultationBookings, booking]
      })),
      updateConsultationBooking: (booking) => set(state => ({
        consultationBookings: state.consultationBookings.map(b => b.id === booking.id ? booking : b)
      })),

      // ================== GETTERS ==================

      // Course Getters
      getCourseById: (courseId) => get().courses.find(c => c.id === courseId),
      getCoursesByTeacher: (teacherId) => get().courses.filter(c => c.teacherId === teacherId),
      getPublishedCourses: () => get().courses.filter(c => c.status === 'published'),
      getCoursesByCategory: (category) => get().courses.filter(c => 
        c.status === 'published' && c.category === category
      ),

      // Section Getters
      getSectionsByCourse: (courseId) => get().sections
        .filter(s => s.courseId === courseId)
        .sort((a, b) => a.order - b.order),

      // Lesson Getters
      getLessonsBySection: (sectionId) => get().lessons
        .filter(l => l.sectionId === sectionId)
        .sort((a, b) => a.order - b.order),
      getLessonsByCourse: (courseId) => get().lessons
        .filter(l => l.courseId === courseId)
        .sort((a, b) => a.order - b.order),
      getPreviewableLessons: (courseId) => get().lessons
        .filter(l => l.courseId === courseId && l.isPreviewable),

      // MCQ Getters
      getMCQsByLesson: (lessonId) => get().mcqs
        .filter(m => m.lessonId === lessonId)
        .sort((a, b) => a.order - b.order),
      getMCQsByMockTest: (mockTestId) => get().mcqs
        .filter(m => m.mockTestId === mockTestId)
        .sort((a, b) => a.order - b.order),

      // Test Getters
      getMockTestsByCourse: (courseId) => get().mockTests
        .filter(t => t.courseId === courseId)
        .sort((a, b) => a.order - b.order),
      getLiveTestsByCourse: (courseId) => get().liveTests
        .filter(t => t.courseId === courseId)
        .sort((a, b) => a.startTime - b.startTime),
      getUpcomingLiveTests: (courseId) => {
        const now = Date.now()
        return get().liveTests
          .filter(t => t.courseId === courseId && t.startTime > now)
          .sort((a, b) => a.startTime - b.startTime)
      },
      getActiveLiveTests: (courseId) => {
        const now = Date.now()
        return get().liveTests
          .filter(t => t.courseId === courseId && t.startTime <= now && t.endTime > now)
      },

      // Enrollment Getters
      getEnrollmentsByCourse: (courseId) => get().enrollments
        .filter(e => e.courseId === courseId),
      getEnrollmentsByStudent: (studentId) => get().enrollments
        .filter(e => e.studentId === studentId),
      isEnrolled: (courseId, studentId) => get().enrollments
        .some(e => e.courseId === courseId && e.studentId === studentId && e.status === 'active'),

      // Progress Getters
      getProgressByEnrollment: (enrollmentId) => get().lessonProgress
        .filter(p => p.enrollmentId === enrollmentId),
      getCourseProgress: (courseId, studentId) => {
        const enrollment = get().enrollments.find(
          e => e.courseId === courseId && e.studentId === studentId
        )
        return enrollment?.progress || 0
      },

      // Attempt Getters
      getMockTestAttempts: (mockTestId, studentId) => get().mockTestAttempts
        .filter(a => a.mockTestId === mockTestId && a.studentId === studentId)
        .sort((a, b) => b.submittedAt - a.submittedAt),
      getLiveTestAttempt: (liveTestId, studentId) => get().liveTestAttempts
        .find(a => a.liveTestId === liveTestId && a.studentId === studentId),
      getMockTestLeaderboard: (mockTestId) => get().mockTestAttempts
        .filter(a => a.mockTestId === mockTestId && a.status !== 'in-progress')
        .sort((a, b) => b.percentage - a.percentage || a.timeTaken - b.timeTaken),
      getLiveTestLeaderboard: (liveTestId) => get().liveTestAttempts
        .filter(a => a.liveTestId === liveTestId && a.status !== 'in-progress')
        .sort((a, b) => b.percentage - a.percentage || a.timeTaken - b.timeTaken),

      // Review Getters
      getReviewsByCourse: (courseId) => get().reviews
        .filter(r => r.courseId === courseId && r.status === 'published')
        .sort((a, b) => b.createdAt - a.createdAt),

      // Consultation Getters
      getConsultationsByTeacher: (teacherId) => get().consultationBookings
        .filter(b => b.teacherId === teacherId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      getConsultationsByStudent: (studentId) => get().consultationBookings
        .filter(b => b.studentId === studentId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      getUpcomingConsultations: (userId) => {
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        return get().consultationBookings
          .filter(b => 
            (b.teacherId === userId || b.studentId === userId) &&
            b.status === 'confirmed' &&
            b.date >= todayStr
          )
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      },

      // Analytics
      getTeacherStats: (teacherId) => {
        const state = get()
        const teacherCourses = state.courses.filter(c => c.teacherId === teacherId)
        const courseIds = teacherCourses.map(c => c.id)
        const enrollments = state.enrollments.filter(e => courseIds.includes(e.courseId))
        const reviews = state.reviews.filter(r => courseIds.includes(r.courseId))
        
        return {
          totalCourses: teacherCourses.length,
          totalStudents: new Set(enrollments.map(e => e.studentId)).size,
          totalRevenue: enrollments.reduce((sum, e) => sum + e.pricePaid, 0),
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0
        }
      },
      getCourseStats: (courseId) => {
        const state = get()
        const enrollments = state.enrollments.filter(e => e.courseId === courseId)
        const reviews = state.reviews.filter(r => r.courseId === courseId)
        const completedEnrollments = enrollments.filter(e => e.progress === 100)
        
        return {
          enrollments: enrollments.length,
          completionRate: enrollments.length > 0 
            ? (completedEnrollments.length / enrollments.length) * 100 
            : 0,
          averageRating: reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0,
          revenue: enrollments.reduce((sum, e) => sum + e.pricePaid, 0)
        }
      }
    }),
    {
      name: 'coaching-storage',
      version: 1,
      partialize: (state) => ({
        teachers: state.teachers,
        teacherProfile: state.teacherProfile,
        courses: state.courses,
        myCourses: state.myCourses,
        enrolledCourses: state.enrolledCourses,
        sections: state.sections,
        lessons: state.lessons,
        mcqs: state.mcqs,
        mockTests: state.mockTests,
        liveTests: state.liveTests,
        enrollments: state.enrollments,
        lessonProgress: state.lessonProgress,
        mockTestAttempts: state.mockTestAttempts,
        liveTestAttempts: state.liveTestAttempts,
        reviews: state.reviews,
        announcements: state.announcements,
        discussions: state.discussions,
        consultationBookings: state.consultationBookings,
        activeCourseId: state.activeCourseId,
        activeView: state.activeView,
      })
    }
  )
)
