import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Users,
  BookOpen,
  Plus,
  Search,
  Star,
  Clock,
  Grid3X3,
  List,
  TrendingUp,
  DollarSign,
  Play,
  ChevronRight,
  Settings,
  BarChart3,
  MessageSquare,
  Award,
  MoreVertical,
  UserCheck,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Brain,
  HelpCircle,
  Calendar,
  RefreshCw,
  Trash2,
  Eye,
  Copy,
  Crown,
  Timer,
  Cloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCoachingStore } from '@/stores/coaching-store';
import { useAuthStore } from '@/stores/auth-store';
import { TeacherProfileForm } from './teacher-profile-form';
import { CreateCourseForm } from './create-course-form';
import { CourseDetailPage } from './course-detail-page';
import { CourseContentManager } from './course-content-manager';
import { LiveTestManager } from './live-test-manager';
import { QuestionBankManager } from './question-bank-manager';
import { StudentManagement } from './student-management';
import { syncLocalToFirestore } from '@/services/coaching-firestore';
import { useToast } from '@/components/ui/toast';
import type { Course } from '@/types';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const SAMPLE_COURSES: Course[] = [
  {
    id: 'course_1',
    teacherId: 'teacher_1',
    teacherName: 'Dr. Rahman',
    title: 'BCS Bengali Literature Complete',
    subtitle: 'From Charyapada to Modern Literature',
    description: 'Complete preparation for BCS exam',
    category: 'BCS',
    level: 'all',
    language: 'Bengali',
    price: 999,
    discountPrice: 499,
    currency: 'BDT',
    totalSections: 12,
    totalLessons: 85,
    totalDuration: 1200,
    rating: 4.8,
    totalReviews: 234,
    totalStudents: 1250,
    hasPreview: true,
    hasCertificate: true,
    isPublished: true,
    tags: ['BCS', 'Bengali', 'Literature'],
    whatYouWillLearn: ['Ancient Literature', 'Medieval Literature', 'Modern Literature'],
    requirements: ['Can read Bengali'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'course_2',
    teacherId: 'teacher_1',
    teacherName: 'Prof. Karim',
    title: 'Bank Job Mathematics',
    subtitle: 'All Math Topics - Easy Method',
    description: 'Complete Mathematics course for Bank Jobs',
    category: 'Bank Job',
    level: 'intermediate',
    language: 'Bengali',
    price: 799,
    currency: 'BDT',
    totalSections: 8,
    totalLessons: 64,
    totalDuration: 900,
    rating: 4.6,
    totalReviews: 156,
    totalStudents: 890,
    hasPreview: true,
    hasCertificate: true,
    isPublished: true,
    tags: ['Bank', 'Math'],
    whatYouWillLearn: ['Percentage', 'Profit-Loss', 'Interest'],
    requirements: ['Basic Math'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'course_3',
    teacherId: 'teacher_2',
    teacherName: 'Ms. Fatima',
    title: 'English Grammar Mastery',
    subtitle: 'From Basics to Advanced',
    description: 'Complete English Grammar course',
    category: 'English',
    level: 'beginner',
    language: 'English',
    price: 0,
    currency: 'BDT',
    totalSections: 10,
    totalLessons: 72,
    totalDuration: 800,
    rating: 4.9,
    totalReviews: 312,
    totalStudents: 2100,
    hasPreview: true,
    hasCertificate: false,
    isPublished: true,
    tags: ['English', 'Grammar', 'Free'],
    whatYouWillLearn: ['Parts of Speech', 'Tenses', 'Voice'],
    requirements: ['Basic English reading'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function CourseCard({ course, onView, onEdit, onManage, isTeacher = false }: { course: Course; onView: () => void; onEdit?: () => void; onManage?: () => void; isTeacher?: boolean }) {
  return (
    <motion.div variants={fadeIn} whileHover={{ y: -4 }} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="relative h-40 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-16 h-16 text-white/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {course.price === 0 && <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">Free</span>}
          {course.discountPrice && course.price > 0 && <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">{Math.round((1 - course.discountPrice / course.price) * 100)}% OFF</span>}
        </div>
        {course.hasPreview && (
          <button onClick={onView} className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
              <Play className="w-5 h-5 text-indigo-600 ml-1" />
            </div>
          </button>
        )}
        {isTeacher && (
          <div className="absolute top-3 right-3">
            <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded">{course.category}</span>
          <span className="text-xs text-gray-500 capitalize">{course.level}</span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 cursor-pointer hover:text-indigo-600 transition-colors" onClick={onView}>{course.title}</h3>
        {course.teacherName && <p className="text-sm text-gray-500 mb-3">{course.teacherName}</p>}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{course.rating.toFixed(1)}</span>
          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.totalStudents}</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{Math.floor(course.totalDuration / 60)}h</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t dark:border-gray-800">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {course.price === 0 ? 'Free' : <>{course.currency === 'BDT' ? '৳' : '$'}{course.discountPrice || course.price}</>}
            </span>
            {course.discountPrice && course.price > 0 && <span className="text-sm text-gray-400 line-through">{course.currency === 'BDT' ? '৳' : '$'}{course.price}</span>}
          </div>
          {isTeacher ? (
            <Button size="sm" onClick={onManage}>
              <BookOpen className="w-4 h-4 mr-1" />
              Manage
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onView}>View <ChevronRight className="w-4 h-4 ml-1" /></Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatsCard({ icon: Icon, label, value, trend, color }: { icon: React.ElementType; label: string; value: string | number; trend?: string; color: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600',
    rose: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600',
  };
  return (
    <motion.div variants={fadeIn} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}><Icon className="w-6 h-6" /></div>
        {trend && <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3" />{trend}</span>}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </motion.div>
  );
}

export function CoachingDashboard() {
  const { user } = useAuthStore();
  const { courses, teachers, myCourses, teacherProfile, loadFromFirestore } = useCoachingStore();
  const toast = useToast();
  const [view, setView] = useState<'teacher' | 'student'>('student');
  const [teacherTab, setTeacherTab] = useState<'courses' | 'settings'>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [managingCourse, setManagingCourse] = useState<string | null>(null);
  
  // New filter states
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // Load data from Firestore on mount
  useEffect(() => {
    if (user?.id) {
      loadFromFirestore(user.id);
    }
  }, [user?.id, loadFromFirestore]);

  // Check both teachers array and teacherProfile for current user
  const currentTeacher = teachers.find((t) => t.userId === user?.id) ?? 
    (teacherProfile?.userId === user?.id ? teacherProfile : undefined);
  const hasTeacherProfile = !!currentTeacher;
  
  // Show sample courses only if no real courses exist
  const allCourses = courses.length > 0 ? courses : [...courses, ...SAMPLE_COURSES];
  
  // Get unique teachers from courses
  const uniqueTeachers = useMemo(() => {
    const teacherSet = new Set<string>();
    allCourses.forEach(c => c.teacherName && teacherSet.add(c.teacherName));
    return Array.from(teacherSet).sort();
  }, [allCourses]);
  
  // Alphabet for scrolling
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = allCourses.filter((course) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        course.title.toLowerCase().includes(query) || 
        course.category.toLowerCase().includes(query) ||
        (course.teacherName && course.teacherName.toLowerCase().includes(query)) ||
        (course.tags && course.tags.some(tag => tag.toLowerCase().includes(query)));
      const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
      const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
      const matchesPrice = priceFilter === 'all' || 
        (priceFilter === 'free' && course.price === 0) || 
        (priceFilter === 'paid' && course.price > 0);
      const matchesRating = ratingFilter === 'all' || course.rating >= parseFloat(ratingFilter);
      const matchesTeacher = selectedTeacher === 'all' || course.teacherName === selectedTeacher;
      const matchesLetter = !activeLetter || 
        course.title.toUpperCase().startsWith(activeLetter) ||
        (course.teacherName && course.teacherName.toUpperCase().startsWith(activeLetter));
      
      return matchesSearch && matchesCategory && matchesLevel && matchesPrice && matchesRating && matchesTeacher && matchesLetter && course.isPublished;
    });
    
    // Sort courses
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.totalStudents - a.totalStudents);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-low':
        result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        break;
      case 'price-high':
        result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        break;
      case 'title-az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-za':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'teacher-az':
        result.sort((a, b) => (a.teacherName || '').localeCompare(b.teacherName || ''));
        break;
    }
    
    return result;
  }, [allCourses, searchQuery, selectedCategory, levelFilter, priceFilter, ratingFilter, selectedTeacher, activeLetter, sortBy]);
  
  const categories = ['all', ...new Set(allCourses.map((c) => c.category))];
  const activeFiltersCount = [levelFilter, priceFilter, ratingFilter, selectedTeacher].filter(f => f !== 'all').length + (activeLetter ? 1 : 0);
  
  const clearAllFilters = () => {
    setLevelFilter('all');
    setPriceFilter('all');
    setRatingFilter('all');
    setSelectedTeacher('all');
    setActiveLetter(null);
    setSortBy('popular');
  };
  const teacherStats = { 
    totalCourses: myCourses.length, 
    totalStudents: myCourses.reduce((acc, c) => acc + (c.totalStudents || 0), 0), 
    totalRevenue: myCourses.reduce((acc, c) => acc + ((c.discountPrice || c.price) * (c.totalStudents || 0)), 0), 
    avgRating: myCourses.length > 0 ? (myCourses.reduce((acc, c) => acc + (c.rating || 0), 0) / myCourses.length).toFixed(1) : 0
  };

  if (selectedCourse) return <CourseDetailPage courseId={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  if (managingCourse) return <CourseContentManager courseId={managingCourse} onBack={() => setManagingCourse(null)} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><GraduationCap className="w-8 h-8" /></div>
              <div>
                <h1 className="text-2xl font-bold">Coaching Desk</h1>
                <p className="text-white/80 text-sm">{view === 'teacher' ? 'Manage your courses' : 'Learn from the best'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
              <button onClick={() => setView('student')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'student' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'}`}><BookOpen className="w-4 h-4 inline mr-2" />Student</button>
              <button onClick={() => setView('teacher')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'teacher' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'}`}><UserCheck className="w-4 h-4 inline mr-2" />Teacher</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {view === 'teacher' && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
            {!hasTeacherProfile ? (
              <motion.div variants={fadeIn} className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl"><Award className="w-8 h-8 text-amber-600" /></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Complete Your Teacher Profile</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Set up your teacher profile to start creating courses.</p>
                    <Button onClick={() => setShowProfileForm(true)}><Plus className="w-4 h-4 mr-2" />Complete Profile</Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard icon={BookOpen} label="My Courses" value={teacherStats.totalCourses} color="indigo" />
                  <StatsCard icon={Users} label="Total Students" value={teacherStats.totalStudents.toLocaleString()} trend="+12%" color="emerald" />
                  <StatsCard icon={DollarSign} label="Revenue" value={`৳${teacherStats.totalRevenue.toLocaleString()}`} trend="+8%" color="amber" />
                  <StatsCard icon={Star} label="Avg Rating" value={teacherStats.avgRating} color="rose" />
                </div>
                
                {/* Teacher Tabs */}
                <Tabs value={teacherTab} onValueChange={(v) => setTeacherTab(v as typeof teacherTab)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="courses"><BookOpen className="h-4 w-4 mr-2" /> My Courses</TabsTrigger>
                    <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" /> Settings</TabsTrigger>
                  </TabsList>
                  
                  {/* Courses Tab */}
                  <TabsContent value="courses" className="space-y-6">
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => setShowCourseForm(true)}><Plus className="w-4 h-4 mr-2" />Create Course</Button>
                      <Button variant="outline" onClick={() => setShowProfileForm(true)}><Settings className="w-4 h-4 mr-2" />Edit Profile</Button>
                      <Button variant="outline" onClick={async () => {
                        try {
                          await syncLocalToFirestore(teacherProfile, myCourses);
                          toast.success('Cloud Sync সম্পন্ন!', 'আপনার সব data cloud এ save হয়েছে');
                        } catch (err) {
                          console.error('Sync failed:', err);
                          toast.error('Sync ব্যর্থ!', (err as Error).message);
                        }
                      }}><Cloud className="w-4 h-4 mr-2" />Sync to Cloud</Button>
                      <Button variant="outline"><BarChart3 className="w-4 h-4 mr-2" />Analytics</Button>
                      <Button variant="outline"><MessageSquare className="w-4 h-4 mr-2" />Messages</Button>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">My Courses</h2>
                      {myCourses.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {myCourses.map((course) => (
                            <CourseCard key={course.id} course={course} isTeacher onView={() => setSelectedCourse(course.id)} onEdit={() => { setEditingCourse(course); setShowCourseForm(true); }} onManage={() => setManagingCourse(course.id)} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses yet</h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first course and start teaching!</p>
                          <Button onClick={() => setShowCourseForm(true)}><Plus className="w-4 h-4 mr-2" />Create Course</Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-6">
                    {/* Page Title */}
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">Teacher Settings</h2>
                    </div>

                    {/* Students Section */}
                    <StudentManagement />

                    {/* Live Test Management */}
                    <Card className="border-2 border-cyan-200 dark:border-cyan-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Timer className="h-5 w-5 text-cyan-500" />
                          Live Test Management
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Schedule and manage live tests for your students
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <LiveTestManager />
                      </CardContent>
                    </Card>

                    {/* Question Bank */}
                    <Card className="border-2 border-green-200 dark:border-green-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <HelpCircle className="h-5 w-5 text-green-500" />
                          Question Bank
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Create and manage your question bank for quizzes and tests
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <QuestionBankManager />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </motion.div>
        )}

        {view === 'student' && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
            {/* Search and Category Bar */}
            <motion.div variants={fadeIn} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input placeholder="Search courses, teachers, subjects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowFilters(!showFilters)} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showFilters ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-white text-indigo-600 rounded-full">{activeFiltersCount}</span>
                    )}
                  </button>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}><Grid3X3 className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}><List className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
              
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mt-4 scrollbar-thin">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{cat === 'all' ? 'All' : cat}</button>
                ))}
              </div>
            </motion.div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
                      </div>
                      {activeFiltersCount > 0 && (
                        <button onClick={clearAllFilters} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                          <X className="w-4 h-4" /> Clear all
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {/* Teacher Filter */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Teacher</label>
                        <select 
                          value={selectedTeacher} 
                          onChange={(e) => setSelectedTeacher(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="all">All Teachers</option>
                          {uniqueTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      
                      {/* Level Filter */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Level</label>
                        <select 
                          value={levelFilter} 
                          onChange={(e) => setLevelFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="all">All Levels</option>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      
                      {/* Price Filter */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Price</label>
                        <select 
                          value={priceFilter} 
                          onChange={(e) => setPriceFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="all">All Prices</option>
                          <option value="free">Free</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                      
                      {/* Rating Filter */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Rating</label>
                        <select 
                          value={ratingFilter} 
                          onChange={(e) => setRatingFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="all">All Ratings</option>
                          <option value="4.5">4.5+ ⭐</option>
                          <option value="4">4+ ⭐</option>
                          <option value="3.5">3.5+ ⭐</option>
                        </select>
                      </div>
                      
                      {/* Sort By */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Sort By</label>
                        <select 
                          value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="popular">Most Popular</option>
                          <option value="rating">Highest Rated</option>
                          <option value="newest">Newest</option>
                          <option value="price-low">Price: Low to High</option>
                          <option value="price-high">Price: High to Low</option>
                          <option value="title-az">Title: A-Z</option>
                          <option value="title-za">Title: Z-A</option>
                          <option value="teacher-az">Teacher: A-Z</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Alphabetic Scrolling */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <label className="text-xs font-medium text-gray-500 mb-2 block">Browse by Letter (Course/Teacher)</label>
                      <div className="flex flex-wrap gap-1">
                        <button 
                          onClick={() => setActiveLetter(null)}
                          className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${!activeLetter ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'}`}
                        >
                          All
                        </button>
                        {alphabet.map(letter => (
                          <button 
                            key={letter}
                            onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
                            className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${activeLetter === letter ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'}`}
                          >
                            {letter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedCategory === 'all' ? 'All Courses' : selectedCategory}</h2>
                  {activeLetter && (
                    <span className="px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      Starting with "{activeLetter}"
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{filteredCourses.length} courses found</p>
              </div>
              {filteredCourses.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearAllFilters} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredCourses.map((course) => <CourseCard key={course.id} course={course} onView={() => setSelectedCourse(course.id)} />)}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showProfileForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowProfileForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <TeacherProfileForm onClose={() => setShowProfileForm(false)} existingProfile={currentTeacher || undefined} />
            </motion.div>
          </motion.div>
        )}
        {showCourseForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CreateCourseForm onClose={() => { setShowCourseForm(false); setEditingCourse(null); }} existingCourse={editingCourse || undefined} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
