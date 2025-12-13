import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Users,
  UserPlus,
  UserX,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  X,
  Filter,
  Download,
  MoreVertical,
  Crown,
  Star,
  BarChart3,
  Target,
  Award,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useCoachingStore } from '@/stores/coaching-store';
import { useAuthStore } from '@/stores/auth-store';
import type { CourseEnrollment, Course } from '@/types';

// Student type for UI
interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  enrolledAt: number;
  lastActiveAt?: number;
  totalProgress: number;
  coursesEnrolled: number;
  testsCompleted: number;
  avgScore: number;
  status: 'active' | 'inactive' | 'blocked';
  customPlan?: StudentPlan;
}

// Custom Course Plan
interface StudentPlan {
  id: string;
  studentId: string;
  courseId: string;
  startDate: number;
  endDate: number;
  accessType: 'full' | 'limited';
  allowedSections: string[];
  allowedLessons: string[];
  testAccess: boolean;
  certificateEligible: boolean;
  notes: string;
}

interface StudentManagementProps {
  courseId?: string;
}

export function StudentManagement({ courseId }: StudentManagementProps) {
  const { user } = useAuthStore();
  const { enrollments, myCourses, courses } = useCoachingStore();
  
  // UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'add' | 'analytics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'recent' | 'score'>('recent');
  
  // Student Detail/Edit States
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [showCustomizePlan, setShowCustomizePlan] = useState(false);
  
  // Add Student States
  const [addStudentEmail, setAddStudentEmail] = useState('');
  const [addStudentName, setAddStudentName] = useState('');
  const [addStudentPhone, setAddStudentPhone] = useState('');
  const [addStudentCourse, setAddStudentCourse] = useState('');
  const [addStudentAccessType, setAddStudentAccessType] = useState<'full' | 'limited'>('full');
  
  // Mock Students (in real app, these would come from enrollments)
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Rahim Ahmed',
      email: 'rahim@example.com',
      phone: '+880 1712-345678',
      enrolledAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      lastActiveAt: Date.now() - 2 * 60 * 60 * 1000,
      totalProgress: 75,
      coursesEnrolled: 2,
      testsCompleted: 8,
      avgScore: 82,
      status: 'active',
    },
    {
      id: '2',
      name: 'Fatima Begum',
      email: 'fatima@example.com',
      enrolledAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
      lastActiveAt: Date.now() - 24 * 60 * 60 * 1000,
      totalProgress: 45,
      coursesEnrolled: 1,
      testsCompleted: 4,
      avgScore: 68,
      status: 'active',
    },
    {
      id: '3',
      name: 'Karim Hossain',
      email: 'karim@example.com',
      phone: '+880 1823-456789',
      enrolledAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      lastActiveAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      totalProgress: 90,
      coursesEnrolled: 3,
      testsCompleted: 15,
      avgScore: 91,
      status: 'active',
    },
    {
      id: '4',
      name: 'Nusrat Jahan',
      email: 'nusrat@example.com',
      enrolledAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      lastActiveAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      totalProgress: 20,
      coursesEnrolled: 1,
      testsCompleted: 2,
      avgScore: 55,
      status: 'inactive',
    },
  ]);
  
  // Filtered and Sorted Students
  const filteredStudents = useMemo(() => {
    let result = [...students];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(s => s.status === filterStatus);
    }
    
    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'progress':
        result.sort((a, b) => b.totalProgress - a.totalProgress);
        break;
      case 'recent':
        result.sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0));
        break;
      case 'score':
        result.sort((a, b) => b.avgScore - a.avgScore);
        break;
    }
    
    return result;
  }, [students, searchQuery, filterStatus, sortBy]);
  
  // Stats
  const stats = useMemo(() => ({
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    avgProgress: Math.round(students.reduce((a, s) => a + s.totalProgress, 0) / students.length),
    avgScore: Math.round(students.reduce((a, s) => a + s.avgScore, 0) / students.length),
    topPerformer: students.reduce((a, b) => a.avgScore > b.avgScore ? a : b),
  }), [students]);
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(timestamp);
  };
  
  const handleAddStudent = () => {
    if (!addStudentEmail.trim() || !addStudentName.trim()) {
      alert('Please fill in name and email');
      return;
    }
    
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      name: addStudentName.trim(),
      email: addStudentEmail.trim(),
      phone: addStudentPhone.trim() || undefined,
      enrolledAt: Date.now(),
      lastActiveAt: Date.now(),
      totalProgress: 0,
      coursesEnrolled: 1,
      testsCompleted: 0,
      avgScore: 0,
      status: 'active',
    };
    
    setStudents([newStudent, ...students]);
    
    // Reset form
    setAddStudentName('');
    setAddStudentEmail('');
    setAddStudentPhone('');
    setAddStudentCourse('');
    setActiveTab('students');
  };
  
  const handleRemoveStudent = (studentId: string) => {
    if (confirm('Are you sure you want to remove this student?')) {
      setStudents(students.filter(s => s.id !== studentId));
    }
  };
  
  const handleToggleStatus = (studentId: string) => {
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return { ...s, status: s.status === 'active' ? 'inactive' : 'active' };
      }
      return s;
    }));
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'inactive': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'blocked': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          👥 Students
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'add'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ➕ Add New
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📈 Analytics
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-xs text-muted-foreground">Total Students</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
              <p className="text-xs text-green-600">{stats.activeStudents} active</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-xs text-muted-foreground">Avg Progress</span>
              </div>
              <p className="text-2xl font-bold">{stats.avgProgress}%</p>
              <Progress value={stats.avgProgress} className="h-1.5 mt-2" />
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                <span className="text-xs text-muted-foreground">Avg Score</span>
              </div>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="text-xs text-muted-foreground">Top Performer</span>
              </div>
              <p className="text-sm font-bold truncate">{stats.topPerformer.name}</p>
              <p className="text-xs text-muted-foreground">{stats.topPerformer.avgScore}% avg</p>
            </div>
          </div>
          
          {/* Top Performers */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Top Performers
            </h4>
            <div className="space-y-2">
              {students.sort((a, b) => b.avgScore - a.avgScore).slice(0, 3).map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-amber-500 text-white' :
                    idx === 1 ? 'bg-gray-400 text-white' :
                    'bg-amber-700 text-white'
                  }`}>
                    {idx + 1}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.avgScore}% avg score</p>
                  </div>
                  <Star className={`h-4 w-4 ${idx === 0 ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Recent Activity
            </h4>
            <div className="space-y-2">
              {students.sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0)).slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{s.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{s.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {s.lastActiveAt ? formatTimeAgo(s.lastActiveAt) : 'Never'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Students List Tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search students..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="score">Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Students List */}
          <div className="space-y-2 max-h-[450px] overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No students found</p>
              </div>
            ) : (
              filteredStudents.map(student => (
                <div 
                  key={student.id} 
                  className="p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{student.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> {student.coursesEnrolled} courses
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" /> {student.avgScore}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {student.lastActiveAt ? formatTimeAgo(student.lastActiveAt) : 'Never'}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{student.totalProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getProgressColor(student.totalProgress)} transition-all`}
                            style={{ width: `${student.totalProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowStudentDetail(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleToggleStatus(student.id)}
                      >
                        {student.status === 'active' ? 
                          <AlertCircle className="h-4 w-4 text-yellow-500" /> : 
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        }
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleRemoveStudent(student.id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Showing {filteredStudents.length} of {students.length} students
          </p>
        </div>
      )}
      
      {/* Add Student Tab */}
      {activeTab === 'add' && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            <h4 className="font-medium">Add New Student</h4>
          </div>
          
          <div>
            <label className="text-sm font-medium">Full Name *</label>
            <Input 
              placeholder="Enter student's full name"
              value={addStudentName}
              onChange={e => setAddStudentName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Email Address *</label>
            <Input 
              type="email"
              placeholder="student@example.com"
              value={addStudentEmail}
              onChange={e => setAddStudentEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <Input 
              type="tel"
              placeholder="+880 1XXX-XXXXXX"
              value={addStudentPhone}
              onChange={e => setAddStudentPhone(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Enroll to Course</label>
            <Select value={addStudentCourse} onValueChange={setAddStudentCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {myCourses.length > 0 ? myCourses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                )) : (
                  <SelectItem value="demo">Demo Course</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Access Type</label>
            <Select value={addStudentAccessType} onValueChange={(v) => setAddStudentAccessType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Access - All content</SelectItem>
                <SelectItem value="limited">Limited Access - Selected content only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div>
              <p className="text-sm font-medium">Send Welcome Email</p>
              <p className="text-xs text-muted-foreground">Student will receive login instructions</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setActiveTab('students')} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddStudent} className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </div>
        </div>
      )}
      
      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* Completion Rate */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Completion Rate Distribution
            </h4>
            <div className="space-y-3">
              {[
                { label: '0-25%', count: students.filter(s => s.totalProgress < 25).length, color: 'bg-red-500' },
                { label: '25-50%', count: students.filter(s => s.totalProgress >= 25 && s.totalProgress < 50).length, color: 'bg-yellow-500' },
                { label: '50-75%', count: students.filter(s => s.totalProgress >= 50 && s.totalProgress < 75).length, color: 'bg-blue-500' },
                { label: '75-100%', count: students.filter(s => s.totalProgress >= 75).length, color: 'bg-green-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs w-16">{item.label}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all`}
                      style={{ width: `${(item.count / students.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Score Distribution */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Score Distribution
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Excellent (80+)', count: students.filter(s => s.avgScore >= 80).length, color: 'bg-green-500' },
                { label: 'Good (60-79)', count: students.filter(s => s.avgScore >= 60 && s.avgScore < 80).length, color: 'bg-blue-500' },
                { label: 'Average (40-59)', count: students.filter(s => s.avgScore >= 40 && s.avgScore < 60).length, color: 'bg-yellow-500' },
                { label: 'Needs Help (<40)', count: students.filter(s => s.avgScore < 40).length, color: 'bg-red-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs w-28">{item.label}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all`}
                      style={{ width: `${(item.count / students.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Activity Stats */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Activity Status
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.lastActiveAt && s.lastActiveAt > Date.now() - 24 * 60 * 60 * 1000).length}
                </p>
                <p className="text-xs text-muted-foreground">Active Today</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {students.filter(s => s.lastActiveAt && s.lastActiveAt > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
                </p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {students.filter(s => !s.lastActiveAt || s.lastActiveAt < Date.now() - 7 * 24 * 60 * 60 * 1000).length}
                </p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </div>
          
          {/* Export Button */}
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" /> Export Student Data (CSV)
          </Button>
        </div>
      )}
      
      {/* Student Detail Modal */}
      <AnimatePresence>
        {showStudentDetail && selectedStudent && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowStudentDetail(false)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className="bg-background rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Student Details</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowStudentDetail(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl">{selectedStudent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-lg">{selectedStudent.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                    {selectedStudent.phone && (
                      <p className="text-sm text-muted-foreground">{selectedStudent.phone}</p>
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedStudent.totalProgress}%</p>
                    <p className="text-xs text-muted-foreground">Progress</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedStudent.avgScore}%</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedStudent.coursesEnrolled}</p>
                    <p className="text-xs text-muted-foreground">Courses</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedStudent.testsCompleted}</p>
                    <p className="text-xs text-muted-foreground">Tests Done</p>
                  </div>
                </div>
                
                {/* Timeline */}
                <div>
                  <h5 className="font-medium mb-2">Timeline</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Enrolled</span>
                      <span>{formatDate(selectedStudent.enrolledAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Active</span>
                      <span>{selectedStudent.lastActiveAt ? formatTimeAgo(selectedStudent.lastActiveAt) : 'Never'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => setShowCustomizePlan(true)}>
                    <Settings className="h-4 w-4 mr-2" /> Customize Course Plan
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" /> Send Message
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
