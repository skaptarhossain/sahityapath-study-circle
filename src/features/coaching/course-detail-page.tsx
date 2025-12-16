import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  PlayCircle,
  Clock,
  Users,
  Star,
  BookOpen,
  Video,
  FileText,
  Link2,
  Lock,
  Unlock,
  Check,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Award,
  Globe,
  MessageCircle,
  Share2,
  Heart,
  Download,
  CheckCircle2,
  FileQuestion,
  Calendar,
  Zap,
  Target,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCoachingStore } from '@/stores/coaching-store';
import { useAuthStore } from '@/stores/auth-store';
import type { Course, CourseSection, CourseLesson, TeacherProfile, CourseEnrollment } from '@/types';

interface CourseDetailPageProps {
  courseId: string;
  onBack: () => void;
  onEnroll?: (courseId: string) => void;
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export function CourseDetailPage({ courseId, onBack, onEnroll }: CourseDetailPageProps) {
  const { user } = useAuthStore();
  const {
    courses,
    teachers,
    sections,
    lessons,
    enrollments,
    reviews,
    addEnrollment,
    addReview,
    updateCourse,
    updateReview,
    markLessonComplete,
    getSectionsByCourse,
    getLessonsBySection,
    isEnrolled,
    getEnrollmentsByStudent,
  } = useCoachingStore();

  // Get course data
  const course = courses.find((c) => c.id === courseId);
  const teacher = course ? teachers.find((t) => t.id === course.teacherId) : null;
  const courseSections = course ? getSectionsByCourse(course.id) : [];
  const courseReviews = course ? reviews.filter((r) => r.courseId === course.id) : [];

  // Check enrollment status
  const userEnrolled = user ? isEnrolled(courseId, user.id) : false;
  const userEnrollment = user
    ? getEnrollmentsByStudent(user.id).find((e) => e.courseId === courseId)
    : null;
  
  // Check if user already reviewed
  const userReview = user ? courseReviews.find(r => r.studentId === user.id) : null;

  // UI State
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [showEnrollSuccess, setShowEnrollSuccess] = useState(false);
  const [viewingLesson, setViewingLesson] = useState<CourseLesson | null>(null);
  
  // Teacher reply state
  const [replyingToReviewId, setReplyingToReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // Check if current user is the course teacher
  const isTeacher = user && course && user.id === course.teacherId;
  
  // Get completed lesson IDs from enrollment
  const completedLessonIds = userEnrollment?.completedLessonIds || [];

  // Toggle section expand
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Submit review
  const handleSubmitReview = () => {
    if (!user || !course || !reviewText.trim()) return;
    
    const newReview = {
      id: `review_${Date.now()}`,
      courseId: course.id,
      studentId: user.id,
      studentName: user.displayName || 'Anonymous',
      studentPhoto: user.photoURL,
      rating: reviewRating,
      review: reviewText.trim(),
      isVerifiedPurchase: userEnrolled,
      helpfulCount: 0,
      reportCount: 0,
      status: 'published' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    addReview(newReview);
    
    // Update course rating
    const allReviews = [...courseReviews, newReview];
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    updateCourse({
      ...course,
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.length,
    });
    
    // Reset form
    setReviewText('');
    setReviewRating(5);
    setShowReviewForm(false);
  };

  // Calculate total stats
  const courseStats = useMemo(() => {
    const allLessons = courseSections.flatMap((s) =>
      getLessonsBySection(s.id)
    );
    const totalDuration = allLessons.reduce((acc, l) => acc + (l.duration || 0), 0);
    const videoLessons = allLessons.filter((l) => l.type === 'video').length;
    const quizLessons = allLessons.filter((l) => l.type === 'quiz').length;
    const previewLessons = allLessons.filter((l) => l.isPreviewable).length;

    return {
      totalLessons: allLessons.length,
      totalDuration,
      videoLessons,
      quizLessons,
      previewLessons,
    };
  }, [courseSections, getLessonsBySection]);

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Handle enrollment
  const handleEnroll = () => {
    if (!user || !course || !teacher) return;

    const enrollment: CourseEnrollment = {
      id: `enrollment_${Date.now()}`,
      courseId: course.id,
      courseTitle: course.title,
      teacherId: teacher.id,
      teacherName: teacher.displayName,
      studentId: user.id,
      studentName: user.displayName || 'Student',
      studentEmail: user.email || '',
      pricing: course.price === 0 ? 'free' : 'paid',
      pricePaid: course.discountPrice || course.price,
      progress: 0,
      completedLessons: 0,
      lastAccessedAt: Date.now(),
      status: 'active',
      enrolledAt: Date.now(),
    };

    addEnrollment(enrollment);
    
    // Update course total students
    updateCourse({
      ...course,
      totalStudents: course.totalStudents + 1,
    });
    
    setShowEnrollModal(false);
    setShowEnrollSuccess(true);
    
    // Auto hide success after 3 seconds
    setTimeout(() => setShowEnrollSuccess(false), 3000);
  };

  // Lesson icon based on type
  const getLessonIcon = (type: CourseLesson['type']) => {
    switch (type) {
      case 'video':
        return Video;
      case 'note':
        return FileText;
      case 'quiz':
        return FileQuestion;
      case 'link':
        return Link2;
      case 'live-class':
        return Calendar;
      default:
        return FileText;
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Course not found
          </h2>
          <p className="text-gray-500 mt-2">This course may have been removed</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="lg:col-span-2 space-y-4"
            >
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {course.category}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm capitalize">
                  {course.level}
                </span>
                {course.hasCertificate && (
                  <span className="px-3 py-1 bg-amber-500/80 rounded-full text-sm flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Certificate
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                {course.title}
              </h1>

              {/* Subtitle */}
              {course.subtitle && (
                <p className="text-lg text-white/80">{course.subtitle}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{course.rating.toFixed(1)}</span>
                  <span className="text-white/70">
                    ({course.totalReviews} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-white/80">
                  <Users className="w-4 h-4" />
                  <span>{course.totalStudents} students</span>
                </div>
                <div className="flex items-center gap-1 text-white/80">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(courseStats.totalDuration)}</span>
                </div>
                <div className="flex items-center gap-1 text-white/80">
                  <Video className="w-4 h-4" />
                  <span>{courseStats.totalLessons} lessons</span>
                </div>
              </div>

              {/* Teacher */}
              {teacher && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden">
                    {teacher.photoURL ? (
                      <img
                        src={teacher.photoURL}
                        alt={teacher.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-medium">
                        {teacher.displayName[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-1">
                      {teacher.displayName}
                      {teacher.isVerified && (
                        <BadgeCheck className="w-4 h-4 text-blue-400" />
                      )}
                    </p>
                    <p className="text-sm text-white/70">
                      {teacher.subjects.slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Pricing Card */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="lg:col-span-1"
            >
              <Card className="sticky top-6 overflow-hidden border-0 shadow-2xl">
                {/* Thumbnail */}
                <div className="relative h-48 bg-gray-200 dark:bg-gray-800">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {course.hasPreview && courseStats.previewLessons > 0 && (
                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                        <PlayCircle className="w-10 h-10 text-indigo-600" />
                      </div>
                    </button>
                  )}
                </div>

                <CardContent className="p-6 space-y-4">
                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {course.price === 0 ? (
                        'Free'
                      ) : (
                        <>
                          {course.currency === 'INR' ? '₹' : course.currency === 'BDT' ? '৳' : '$'}
                          {course.discountPrice || course.price}
                        </>
                      )}
                    </span>
                    {course.discountPrice && course.price > 0 && (
                      <span className="text-lg text-gray-400 line-through">
                        {course.currency === 'INR' ? '₹' : course.currency === 'BDT' ? '৳' : '$'}
                        {course.price}
                      </span>
                    )}
                    {course.discountPrice && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded">
                        {Math.round((1 - course.discountPrice / course.price) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {userEnrolled ? (
                    <div className="space-y-3">
                      <Button className="w-full" size="lg">
                        <Play className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Button>
                      {userEnrollment && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Your progress</span>
                            <span className="font-medium">
                              {Math.round(userEnrollment.progress)}%
                            </span>
                          </div>
                          <Progress value={userEnrollment.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => setShowEnrollModal(true)}
                      >
                        {course.price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Heart className="w-4 h-4 mr-2" />
                        Add to Wishlist
                      </Button>
                    </div>
                  )}

                  {/* Features */}
                  <div className="pt-4 space-y-3 border-t dark:border-gray-800">
                    <p className="font-medium text-gray-900 dark:text-white">
                      This course includes:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-indigo-500" />
                        {courseStats.videoLessons} video lessons
                      </li>
                      <li className="flex items-center gap-2">
                        <FileQuestion className="w-4 h-4 text-indigo-500" />
                        {courseStats.quizLessons} quizzes
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        {formatDuration(courseStats.totalDuration)} total content
                      </li>
                      <li className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-500" />
                        Full lifetime access
                      </li>
                      <li className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-indigo-500" />
                        Downloadable resources
                      </li>
                      {course.hasCertificate && (
                        <li className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          Certificate of completion
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Share */}
                  <div className="pt-4 border-t dark:border-gray-800">
                    <button 
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors"
                      onClick={async () => {
                        const shareUrl = window.location.href;
                        const shareTitle = course.title;
                        const shareText = course.description.slice(0, 100) + '...';

                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: shareTitle,
                              text: shareText,
                              url: shareUrl,
                            });
                          } catch (err) {
                            // User cancelled sharing
                          }
                        } else {
                          // Fallback: Copy to clipboard
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            alert('Link copied to clipboard!');
                          } catch (err) {
                            // Fallback for older browsers
                            const textArea = document.createElement('textarea');
                            textArea.value = shareUrl;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            alert('Link copied to clipboard!');
                          }
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      Share this course
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-6 overflow-x-auto">
            {(['overview', 'curriculum', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Description */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      About this course
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                      {course.description}
                    </p>
                  </div>

                  {/* What You'll Learn */}
                  {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        What you'll learn
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {course.whatYouWillLearn.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3"
                          >
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {course.requirements && course.requirements.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Requirements
                      </h2>
                      <ul className="space-y-2">
                        {course.requirements.map((req, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 text-gray-600 dark:text-gray-400"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Teacher Info */}
                  {teacher && (
                    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Your Instructor
                      </h2>
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                          {teacher.photoURL ? (
                            <img
                              src={teacher.photoURL}
                              alt={teacher.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-medium text-gray-500">
                              {teacher.displayName[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            {teacher.displayName}
                            {teacher.isVerified && (
                              <BadgeCheck className="w-5 h-5 text-blue-500" />
                            )}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {teacher.subjects.join(', ')}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              {teacher.rating.toFixed(1)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {teacher.totalStudents} students
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {teacher.totalCourses} courses
                            </span>
                          </div>
                          <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                            {teacher.bio}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Curriculum Tab */}
              {activeTab === 'curriculum' && (
                <motion.div
                  key="curriculum"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Course Content
                    </h2>
                    <p className="text-sm text-gray-500">
                      {courseSections.length} sections • {courseStats.totalLessons} lessons •{' '}
                      {formatDuration(courseStats.totalDuration)}
                    </p>
                  </div>

                  {courseSections.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No content available yet</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-3"
                    >
                      {courseSections
                        .sort((a, b) => a.order - b.order)
                        .map((section, sectionIndex) => {
                          const sectionLessons = getLessonsBySection(section.id).sort(
                            (a, b) => a.order - b.order
                          );
                          const isExpanded = expandedSections.includes(section.id);

                          return (
                            <motion.div
                              key={section.id}
                              variants={fadeIn}
                              className="border dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
                            >
                              {/* Section Header */}
                              <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 font-medium text-sm flex items-center justify-center">
                                    {sectionIndex + 1}
                                  </span>
                                  <div className="text-left">
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                      {section.title}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {sectionLessons.length} lessons
                                    </p>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </button>

                              {/* Lessons */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-t dark:border-gray-800"
                                  >
                                    {sectionLessons.map((lesson, lessonIndex) => {
                                      const LessonIcon = getLessonIcon(lesson.type);
                                      const isLocked = !userEnrolled && !lesson.isPreviewable;
                                      const isCompleted = completedLessonIds.includes(lesson.id);

                                      return (
                                        <div
                                          key={lesson.id}
                                          onClick={() => {
                                            if (!isLocked) {
                                              setViewingLesson(lesson);
                                            }
                                          }}
                                          className={`p-4 flex items-center justify-between border-b dark:border-gray-800 last:border-0 ${
                                            isLocked
                                              ? 'opacity-60'
                                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div
                                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                isCompleted
                                                  ? 'bg-green-100 dark:bg-green-900/50 text-green-600'
                                                  : lesson.type === 'video'
                                                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
                                                  : lesson.type === 'quiz'
                                                  ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600'
                                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                                              }`}
                                            >
                                              {isCompleted ? (
                                                <Check className="w-4 h-4" />
                                              ) : (
                                                <LessonIcon className="w-4 h-4" />
                                              )}
                                            </div>
                                            <div>
                                              <p className={`font-medium text-sm ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                                {lesson.title}
                                              </p>
                                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="capitalize">{lesson.type}</span>
                                                {lesson.duration && (
                                                  <>
                                                    <span>•</span>
                                                    <span>{formatDuration(lesson.duration)}</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {lesson.isPreviewable && !userEnrolled && (
                                              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 text-xs rounded-full">
                                                Preview
                                              </span>
                                            )}
                                            {isLocked ? (
                                              <Lock className="w-4 h-4 text-gray-400" />
                                            ) : (
                                              <Play className="w-4 h-4 text-indigo-600" />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Rating Overview */}
                  <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-gray-900 dark:text-white">
                          {course.rating.toFixed(1)}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round(course.rating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {course.totalReviews} reviews
                        </p>
                      </div>
                      
                      {/* Write Review Button */}
                      {user && !userReview && (
                        <Button 
                          onClick={() => setShowReviewForm(true)}
                          className="ml-auto"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Write a Review
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Review Form */}
                  {showReviewForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800"
                    >
                      <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
                      
                      {/* Star Rating */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Rating</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= (hoverRating || reviewRating)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-500">
                            {reviewRating === 5 ? 'Excellent!' : 
                             reviewRating === 4 ? 'Very Good' :
                             reviewRating === 3 ? 'Good' :
                             reviewRating === 2 ? 'Fair' : 'Poor'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Review Text */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Review</p>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your experience with this course..."
                          className="w-full h-32 p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowReviewForm(false);
                            setReviewText('');
                            setReviewRating(5);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitReview}
                          disabled={!reviewText.trim()}
                        >
                          Submit Review
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Reviews List */}
                  {courseReviews.length === 0 && !showReviewForm ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No reviews yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Be the first to review this course!
                      </p>
                      {user && (
                        <Button onClick={() => setShowReviewForm(true)} className="mt-4">
                          <Star className="w-4 h-4 mr-2" />
                          Write a Review
                        </Button>
                      )}
                    </div>
                  ) : courseReviews.length > 0 && (
                    <div className="space-y-4">
                      {courseReviews.map((review) => (
                        <div
                          key={review.id}
                          className="p-4 bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-sm font-medium">
                              {review.studentName[0]}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {review.studentName}
                                </p>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= review.rating
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                                {review.review}
                              </p>

                              {/* Teacher Reply Section */}
                              {review.teacherReply && (
                                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
                                  <div className="flex items-center gap-2 mb-1">
                                    <BadgeCheck className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                                      Teacher's Response
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {review.teacherReply}
                                  </p>
                                </div>
                              )}

                              {/* Reply Button for Teacher */}
                              {isTeacher && !review.teacherReply && (
                                <>
                                  {replyingToReviewId === review.id ? (
                                    <div className="mt-3 space-y-2">
                                      <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write your response..."
                                        className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        rows={3}
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setReplyingToReviewId(null);
                                            setReplyText('');
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          disabled={!replyText.trim()}
                                          onClick={() => {
                                            updateReview({
                                              ...review,
                                              teacherReply: replyText.trim(),
                                              teacherRepliedAt: Date.now(),
                                              updatedAt: Date.now(),
                                            });
                                            setReplyingToReviewId(null);
                                            setReplyText('');
                                          }}
                                        >
                                          <MessageCircle className="w-4 h-4 mr-1" />
                                          Reply
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2 text-indigo-600"
                                      onClick={() => setReplyingToReviewId(review.id)}
                                    >
                                      <MessageCircle className="w-4 h-4 mr-1" />
                                      Reply as Teacher
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      <AnimatePresence>
        {showEnrollModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowEnrollModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {course.price === 0 ? 'Free Enrollment' : 'Enroll in Course'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {course.price === 0
                    ? 'Start learning today for free!'
                    : `Get full access for ${course.currency === 'INR' ? '₹' : course.currency === 'BDT' ? '৳' : '$'}${course.discountPrice || course.price}`}
                </p>

                <div className="space-y-3">
                  <Button className="w-full" size="lg" onClick={handleEnroll}>
                    {course.price === 0 ? 'Enroll for Free' : 'Proceed to Payment'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowEnrollModal(false)}
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  30-day money-back guarantee
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enrollment Success Toast */}
      <AnimatePresence>
        {showEnrollSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Successfully enrolled! Start learning now.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson Viewer Modal */}
      <AnimatePresence>
        {viewingLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setViewingLesson(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    viewingLesson.type === 'video'
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
                      : viewingLesson.type === 'quiz'
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                  }`}>
                    {viewingLesson.type === 'video' ? (
                      <Video className="w-5 h-5" />
                    ) : viewingLesson.type === 'quiz' ? (
                      <FileQuestion className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {viewingLesson.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {viewingLesson.type === 'video' ? 'Video Lesson' : 
                       viewingLesson.type === 'quiz' ? 'Quiz' : 'Reading Material'}
                      {viewingLesson.duration && ` • ${formatDuration(viewingLesson.duration)}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingLesson(null)}
                >
                  ✕
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                {viewingLesson.type === 'video' && viewingLesson.content ? (
                  <div className="aspect-video bg-black rounded-xl overflow-hidden">
                    {viewingLesson.content.includes('youtube.com') || viewingLesson.content.includes('youtu.be') ? (
                      <iframe
                        src={viewingLesson.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : viewingLesson.content.includes('vimeo.com') ? (
                      <iframe
                        src={viewingLesson.content.replace('vimeo.com', 'player.vimeo.com/video')}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={viewingLesson.content}
                        className="w-full h-full"
                        controls
                      />
                    )}
                  </div>
                ) : viewingLesson.type === 'note' && viewingLesson.content ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: viewingLesson.content }} />
                  </div>
                ) : viewingLesson.type === 'pdf' && viewingLesson.content ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">PDF Document</h4>
                    <p className="text-gray-500 mb-4">Click below to open the PDF.</p>
                    <Button
                      onClick={() => window.open(viewingLesson.content, '_blank')}
                    >
                      Open PDF
                    </Button>
                  </div>
                ) : viewingLesson.type === 'link' && viewingLesson.content ? (
                  <div className="text-center py-12">
                    <Link2 className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">External Resource</h4>
                    <p className="text-gray-500 mb-4">This lesson links to an external resource.</p>
                    <Button
                      onClick={() => window.open(viewingLesson.content, '_blank')}
                    >
                      Open Link
                    </Button>
                  </div>
                ) : viewingLesson.type === 'live-class' ? (
                  <div className="text-center py-12">
                    <Video className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">Live Class</h4>
                    {viewingLesson.liveClassStartTime && (
                      <p className="text-gray-500 mb-4">
                        Scheduled: {new Date(viewingLesson.liveClassStartTime).toLocaleString()}
                      </p>
                    )}
                    {viewingLesson.liveClassLink && (
                      <Button
                        onClick={() => window.open(viewingLesson.liveClassLink, '_blank')}
                      >
                        Join Live Class
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Content not available</p>
                  </div>
                )}
              </div>

              {/* Footer - Mark Complete */}
              {userEnrolled && userEnrollment && (
                <div className="p-4 border-t dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    {completedLessonIds.includes(viewingLesson.id) ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Completed
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">Mark this lesson as complete</span>
                    )}
                  </div>
                  <Button
                    onClick={async () => {
                      if (!completedLessonIds.includes(viewingLesson.id)) {
                        await markLessonComplete(userEnrollment.id, viewingLesson.id);
                      }
                      setViewingLesson(null);
                    }}
                    className={completedLessonIds.includes(viewingLesson.id) 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : ''
                    }
                  >
                    {completedLessonIds.includes(viewingLesson.id) ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Done
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
