import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  Clock,
  Target,
  Timer,
  RefreshCw,
  X,
  Trash2,
  Eye,
  Play,
  Trophy,
  History,
  CheckCircle2,
  AlertTriangle,
  Settings,
  HelpCircle,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCoachingStore } from '@/stores/coaching-store';
import { useAuthStore } from '@/stores/auth-store';
import type { CourseLiveTest, CourseMCQ } from '@/types';

interface LiveTestManagerProps {
  courseId?: string;
}

export function LiveTestManager({ courseId }: LiveTestManagerProps) {
  const { user } = useAuthStore();
  const { 
    liveTests, 
    mcqs,
    addLiveTest, 
    updateLiveTest, 
    removeLiveTest,
    getLiveTestsByCourse,
    getMCQsByLesson 
  } = useCoachingStore();
  
  // UI States
  const [activeTab, setActiveTab] = useState<'schedule' | 'auto'>('schedule');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // New Live Test Form States
  const [newTitle, setNewTitle] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newDuration, setNewDuration] = useState('30');
  const [newQuestionCount, setNewQuestionCount] = useState('20');
  const [newAutoRelease, setNewAutoRelease] = useState(true);
  const [newShowSolutions, setNewShowSolutions] = useState(true);
  const [newShowLeaderboard, setNewShowLeaderboard] = useState(true);
  const [newShuffleQuestions, setNewShuffleQuestions] = useState(true);
  const [newNegativeMarking, setNewNegativeMarking] = useState(false);
  
  // Auto Daily Test States
  const [autoTestEnabled, setAutoTestEnabled] = useState(false);
  const [autoTestTitle, setAutoTestTitle] = useState('Daily Practice Test');
  const [autoTestStartTime, setAutoTestStartTime] = useState('10:00');
  const [autoTestEndTime, setAutoTestEndTime] = useState('22:00');
  const [autoTestDuration, setAutoTestDuration] = useState('30');
  const [autoTestQuestionCount, setAutoTestQuestionCount] = useState('20');
  const [autoTestDays, setAutoTestDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  
  // Get tests for this course
  const courseLiveTests = useMemo(() => {
    if (!courseId) return liveTests;
    return liveTests.filter(t => t.courseId === courseId);
  }, [liveTests, courseId]);
  
  const upcomingTests = useMemo(() => {
    const now = Date.now();
    return courseLiveTests
      .filter(t => t.startTime > now)
      .sort((a, b) => a.startTime - b.startTime);
  }, [courseLiveTests]);
  
  const activeTests = useMemo(() => {
    const now = Date.now();
    return courseLiveTests
      .filter(t => t.startTime <= now && t.endTime > now && t.status === 'active')
      .sort((a, b) => a.startTime - b.startTime);
  }, [courseLiveTests]);
  
  const pastTests = useMemo(() => {
    const now = Date.now();
    return courseLiveTests
      .filter(t => t.endTime <= now)
      .sort((a, b) => b.endTime - a.endTime);
  }, [courseLiveTests]);
  
  // Get all MCQs available for tests
  const availableMCQs = useMemo(() => {
    return mcqs.filter(m => !courseId || m.lessonId?.startsWith(courseId));
  }, [mcqs, courseId]);
  
  const resetForm = () => {
    setNewTitle('');
    setNewStartDate('');
    setNewStartTime('');
    setNewEndDate('');
    setNewEndTime('');
    setNewDuration('30');
    setNewQuestionCount('20');
    setNewAutoRelease(true);
    setNewShowSolutions(true);
    setNewShowLeaderboard(true);
    setNewShuffleQuestions(true);
    setNewNegativeMarking(false);
    setShowCreateForm(false);
  };
  
  const handleCreateTest = () => {
    if (!newTitle.trim() || !newStartDate || !newStartTime || !newEndDate || !newEndTime) {
      alert('Please fill in all required fields');
      return;
    }
    
    const startTime = new Date(`${newStartDate}T${newStartTime}`).getTime();
    const endTime = new Date(`${newEndDate}T${newEndTime}`).getTime();
    
    if (startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }
    
    // Select random questions
    const count = Math.min(parseInt(newQuestionCount), availableMCQs.length);
    const shuffled = [...availableMCQs].sort(() => Math.random() - 0.5);
    const selectedMCQIds = shuffled.slice(0, count).map(m => m.id);
    
    const newTest: CourseLiveTest = {
      id: `live-test-${Date.now()}`,
      courseId: courseId || '',
      title: newTitle.trim(),
      description: '',
      startTime,
      endTime,
      duration: parseInt(newDuration),
      totalQuestions: count,
      totalMarks: count,
      passingMarks: Math.ceil(count * 0.4),
      negativeMarking: newNegativeMarking,
      negativeMarksPerQuestion: newNegativeMarking ? 0.25 : 0,
      shuffleQuestions: newShuffleQuestions,
      autoReleaseResult: newAutoRelease,
      showSolutions: newShowSolutions,
      showLeaderboard: newShowLeaderboard,
      status: 'scheduled',
      isPublished: true,
      order: courseLiveTests.length,
      createdAt: Date.now(),
    };
    
    addLiveTest(newTest);
    resetForm();
  };
  
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const formatCountdown = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div className="flex gap-2">
        <Button 
          variant={activeTab === 'schedule' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('schedule')}
          className="flex-1 sm:flex-none"
        >
          <Calendar className="h-4 w-4 mr-1.5" />
          Schedule Tests
        </Button>
        <Button 
          variant={activeTab === 'auto' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('auto')}
          className="flex-1 sm:flex-none"
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Auto Daily
          {autoTestEnabled && <span className="ml-1.5 w-2 h-2 bg-green-500 rounded-full" />}
        </Button>
      </div>
      
      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Create Button or Form */}
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Schedule New Live Test
            </Button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 border rounded-lg bg-muted/30 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Schedule New Live Test</h4>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <label className="text-sm font-medium">Test Title *</label>
                <Input 
                  placeholder="e.g., Weekly Quiz #1"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date *</label>
                  <Input 
                    type="date"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Start Time *</label>
                  <Input 
                    type="time"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">End Date *</label>
                  <Input 
                    type="date"
                    value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time *</label>
                  <Input 
                    type="time"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Test Duration</label>
                  <Select value={newDuration} onValueChange={setNewDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Question Count</label>
                  <Select value={newQuestionCount} onValueChange={setNewQuestionCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="20">20 Questions</SelectItem>
                      <SelectItem value="30">30 Questions</SelectItem>
                      <SelectItem value="50">50 Questions</SelectItem>
                      <SelectItem value="100">100 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {availableMCQs.length} questions available in your question bank
              </p>
              
              <div className="space-y-3 pt-3 border-t">
                <label className="text-sm font-medium">Test Settings</label>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-release result after test ends</span>
                  <Switch checked={newAutoRelease} onCheckedChange={setNewAutoRelease} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show solutions after submission</span>
                  <Switch checked={newShowSolutions} onCheckedChange={setNewShowSolutions} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show leaderboard</span>
                  <Switch checked={newShowLeaderboard} onCheckedChange={setNewShowLeaderboard} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shuffle questions</span>
                  <Switch checked={newShuffleQuestions} onCheckedChange={setNewShuffleQuestions} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Negative marking</span>
                  <Switch checked={newNegativeMarking} onCheckedChange={setNewNegativeMarking} />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateTest} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" /> Create Test
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Scheduled Tests List */}
          {upcomingTests.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Upcoming Tests ({upcomingTests.length})</h4>
              {upcomingTests.map(test => (
                <div key={test.id} className="p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{test.title}</h5>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span><Calendar className="h-3 w-3 inline mr-1" />{formatDateTime(test.startTime)}</span>
                        <span><Timer className="h-3 w-3 inline mr-1" />{test.duration} min</span>
                        <span><Target className="h-3 w-3 inline mr-1" />{test.totalQuestions} Qs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        {formatCountdown(test.startTime)}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => removeLiveTest(test.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Active Tests */}
          {activeTests.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-green-600">Active Now ({activeTests.length})</h4>
              {activeTests.map(test => (
                <div key={test.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">LIVE</span>
                  </div>
                  <h5 className="font-medium">{test.title}</h5>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span><Clock className="h-3 w-3 inline mr-1" />Ends {formatDateTime(test.endTime)}</span>
                    <span><Target className="h-3 w-3 inline mr-1" />{test.totalQuestions} Qs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Past Tests */}
          {pastTests.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Past Tests ({pastTests.length})</h4>
              {pastTests.slice(0, 5).map(test => (
                <div key={test.id} className="p-3 bg-muted/30 rounded-lg border opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{test.title}</h5>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span><Calendar className="h-3 w-3 inline mr-1" />{formatDateTime(test.endTime)}</span>
                        <span className="text-green-600"><CheckCircle2 className="h-3 w-3 inline mr-1" />Completed</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" /> Results
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Empty State */}
          {courseLiveTests.length === 0 && !showCreateForm && (
            <div className="text-center py-8 text-muted-foreground">
              <Timer className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No live tests scheduled yet</p>
              <p className="text-xs mt-1">Create your first live test to engage students</p>
            </div>
          )}
        </div>
      )}
      
      {/* Auto Daily Tab */}
      {activeTab === 'auto' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <div>
              <h4 className="font-medium">Auto Daily Test</h4>
              <p className="text-xs text-muted-foreground">
                Automatically generate daily practice tests
              </p>
            </div>
            <Switch 
              checked={autoTestEnabled} 
              onCheckedChange={setAutoTestEnabled}
            />
          </div>
          
          {autoTestEnabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 p-4 border rounded-lg"
            >
              <div>
                <label className="text-sm font-medium">Test Title</label>
                <Input 
                  placeholder="Daily Practice Test"
                  value={autoTestTitle}
                  onChange={e => setAutoTestTitle(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input 
                    type="time"
                    value={autoTestStartTime}
                    onChange={e => setAutoTestStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input 
                    type="time"
                    value={autoTestEndTime}
                    onChange={e => setAutoTestEndTime(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <Select value={autoTestDuration} onValueChange={setAutoTestDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Questions</label>
                  <Select value={autoTestQuestionCount} onValueChange={setAutoTestQuestionCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="20">20 Questions</SelectItem>
                      <SelectItem value="30">30 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Active Days</label>
                <div className="flex gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => {
                        if (autoTestDays.includes(index)) {
                          setAutoTestDays(autoTestDays.filter(d => d !== index));
                        } else {
                          setAutoTestDays([...autoTestDays, index]);
                        }
                      }}
                      className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                        autoTestDays.includes(index)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Auto test will run daily from {autoTestStartTime} to {autoTestEndTime}</span>
              </div>
            </motion.div>
          )}
          
          {!autoTestEnabled && (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Auto daily test is disabled</p>
              <p className="text-xs mt-1">Enable to automatically create practice tests</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
