import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus,
  GripVertical,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Video,
  FileText,
  FileQuestion,
  Link2,
  Calendar,
  Save,
  X,
  Eye,
  EyeOff,
  Clock,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Upload,
  ExternalLink,
  Play,
  BookOpen,
  Youtube,
  Code,
  ImageIcon,
  File,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCoachingStore } from '@/stores/coaching-store';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { CourseSection, CourseLesson, CourseMCQ } from '@/types';

interface CourseContentManagerProps {
  courseId: string;
  onBack: () => void;
}

type LessonType = 'video' | 'note' | 'quiz' | 'link' | 'live-class' | 'pdf';

const LESSON_TYPES: { type: LessonType; label: string; icon: any; color: string }[] = [
  { type: 'video', label: 'Video', icon: Video, color: 'blue' },
  { type: 'note', label: 'Notes', icon: FileText, color: 'emerald' },
  { type: 'quiz', label: 'Quiz', icon: FileQuestion, color: 'amber' },
  { type: 'pdf', label: 'PDF', icon: File, color: 'red' },
  { type: 'link', label: 'Link', icon: Link2, color: 'purple' },
  { type: 'live-class', label: 'Live Class', icon: Calendar, color: 'rose' },
];

// Rich Text Editor modules
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

export function CourseContentManager({ courseId, onBack }: CourseContentManagerProps) {
  const {
    courses,
    sections,
    lessons,
    addSection,
    updateSection,
    removeSection,
    reorderSections,
    addLesson,
    updateLesson,
    removeLesson,
    reorderLessons,
    getSectionsByCourse,
    getLessonsBySection,
  } = useCoachingStore();

  // Get course and its content
  const course = courses.find((c) => c.id === courseId);
  const courseSections = getSectionsByCourse(courseId).sort((a, b) => a.order - b.order);

  // UI State
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [showNewLessonForm, setShowNewLessonForm] = useState<string | null>(null);
  const [viewingLesson, setViewingLesson] = useState<CourseLesson | null>(null);

  // Form State
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<LessonType>('video');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [newLessonPreviewable, setNewLessonPreviewable] = useState(false);

  // Quiz Form State
  const [quizQuestions, setQuizQuestions] = useState<CourseMCQ[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentOptions, setCurrentOptions] = useState(['', '', '', '']);
  const [currentCorrect, setCurrentCorrect] = useState(0);
  const [quizTimeLimit, setQuizTimeLimit] = useState('');
  const [quizPassingScore, setQuizPassingScore] = useState('60');

  // Edit Lesson State
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonContent, setEditLessonContent] = useState('');
  const [editLessonDuration, setEditLessonDuration] = useState('');
  const [editLessonPreviewable, setEditLessonPreviewable] = useState(false);
  const [editQuizQuestions, setEditQuizQuestions] = useState<CourseMCQ[]>([]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Create new section
  const handleCreateSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection: CourseSection = {
      id: `section_${Date.now()}`,
      courseId,
      title: newSectionTitle.trim(),
      description: newSectionDescription.trim() || undefined,
      order: courseSections.length,
      isPublished: true,
      createdAt: Date.now(),
    };

    addSection(newSection);
    setNewSectionTitle('');
    setNewSectionDescription('');
    setShowNewSectionForm(false);
    setExpandedSections([...expandedSections, newSection.id]);
  };

  // Update section
  const handleUpdateSection = (section: CourseSection, title: string, description?: string) => {
    updateSection({
      ...section,
      title,
      description,
    });
    setEditingSection(null);
  };

  // Delete section
  const handleDeleteSection = (sectionId: string) => {
    if (confirm('Delete this section and all its lessons?')) {
      removeSection(sectionId);
    }
  };

  // Create new lesson
  const handleCreateLesson = (sectionId: string) => {
    if (!newLessonTitle.trim()) return;

    const sectionLessons = getLessonsBySection(sectionId);

    // For quiz type, save questions in content as JSON
    let content = newLessonContent.trim();
    if (newLessonType === 'quiz' && quizQuestions.length > 0) {
      content = JSON.stringify({
        questions: quizQuestions,
        timeLimit: quizTimeLimit ? parseInt(quizTimeLimit) : null,
        passingScore: parseInt(quizPassingScore) || 60,
      });
    }

    const newLesson: CourseLesson = {
      id: `lesson_${Date.now()}`,
      courseId,
      sectionId,
      title: newLessonTitle.trim(),
      type: newLessonType,
      content,
      duration: newLessonDuration ? parseInt(newLessonDuration) : undefined,
      isPreviewable: newLessonPreviewable,
      isPublished: true,
      order: sectionLessons.length,
      quizQuestions: newLessonType === 'quiz' ? quizQuestions : undefined,
      quizTimeLimit: newLessonType === 'quiz' && quizTimeLimit ? parseInt(quizTimeLimit) : undefined,
      quizPassingScore: newLessonType === 'quiz' ? parseInt(quizPassingScore) || 60 : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addLesson(newLesson);
    resetLessonForm();
    setShowNewLessonForm(null);
  };

  // Add question to quiz
  const handleAddQuestion = () => {
    if (!currentQuestion.trim() || currentOptions.some(o => !o.trim())) return;
    
    const newQuestion: CourseMCQ = {
      id: `mcq_${Date.now()}`,
      courseId,
      question: currentQuestion.trim(),
      options: currentOptions.map(o => o.trim()),
      correctIndex: currentCorrect,
      marks: 1,
      negativeMarks: 0,
      difficulty: 'medium',
      order: quizQuestions.length,
    };
    
    setQuizQuestions([...quizQuestions, newQuestion]);
    setCurrentQuestion('');
    setCurrentOptions(['', '', '', '']);
    setCurrentCorrect(0);
  };

  // Remove question from quiz
  const handleRemoveQuestion = (questionId: string) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== questionId));
  };

  // Reset lesson form
  const resetLessonForm = () => {
    setNewLessonTitle('');
    setNewLessonType('video');
    setNewLessonContent('');
    setNewLessonDuration('');
    setNewLessonPreviewable(false);
    setQuizQuestions([]);
    setCurrentQuestion('');
    setCurrentOptions(['', '', '', '']);
    setCurrentCorrect(0);
    setQuizTimeLimit('');
    setQuizPassingScore('60');
  };

  // Start editing a lesson
  const handleStartEditLesson = (lesson: CourseLesson) => {
    setEditingLesson(lesson.id);
    setEditLessonTitle(lesson.title);
    setEditLessonContent(lesson.content);
    setEditLessonDuration(lesson.duration?.toString() || '');
    setEditLessonPreviewable(lesson.isPreviewable);
    if (lesson.type === 'quiz' && lesson.quizQuestions) {
      setEditQuizQuestions(lesson.quizQuestions);
    }
  };

  // Save edited lesson
  const handleSaveEditLesson = (lesson: CourseLesson) => {
    let content = editLessonContent;
    if (lesson.type === 'quiz' && editQuizQuestions.length > 0) {
      content = JSON.stringify({
        questions: editQuizQuestions,
        timeLimit: lesson.quizTimeLimit,
        passingScore: lesson.quizPassingScore || 60,
      });
    }

    updateLesson({
      ...lesson,
      title: editLessonTitle,
      content,
      duration: editLessonDuration ? parseInt(editLessonDuration) : undefined,
      isPreviewable: editLessonPreviewable,
      quizQuestions: lesson.type === 'quiz' ? editQuizQuestions : undefined,
      updatedAt: Date.now(),
    });
    setEditingLesson(null);
  };

  // Convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  // Delete lesson
  const handleDeleteLesson = (lessonId: string) => {
    if (confirm('Delete this lesson?')) {
      removeLesson(lessonId);
    }
  };

  // Toggle lesson preview
  const toggleLessonPreview = (lesson: CourseLesson) => {
    updateLesson({
      ...lesson,
      isPreviewable: !lesson.isPreviewable,
      updatedAt: Date.now(),
    });
  };

  // Get lesson icon
  const getLessonIcon = (type: LessonType) => {
    return LESSON_TYPES.find((t) => t.type === type)?.icon || FileText;
  };

  // Get lesson color
  const getLessonColor = (type: LessonType) => {
    return LESSON_TYPES.find((t) => t.type === type)?.color || 'gray';
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Course not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={onBack}>
                ← Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Course Content
                </h1>
                <p className="text-sm text-gray-500">{course.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{courseSections.length} sections</span>
              <span>•</span>
              <span>
                {courseSections.reduce(
                  (acc, s) => acc + getLessonsBySection(s.id).length,
                  0
                )}{' '}
                lessons
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <motion.div layout className="space-y-4">
          {/* Sections */}
          {courseSections.map((section, sectionIndex) => {
            const sectionLessons = getLessonsBySection(section.id).sort(
              (a, b) => a.order - b.order
            );
            const isExpanded = expandedSections.includes(section.id);
            const isEditing = editingSection === section.id;

            return (
              <motion.div
                key={section.id}
                layout
                className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 overflow-hidden"
              >
                {/* Section Header */}
                <div className="p-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="cursor-grab">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>

                  <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 font-semibold text-sm flex items-center justify-center">
                    {sectionIndex + 1}
                  </span>

                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          updateSection({ ...section, title: e.target.value })
                        }
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => setEditingSection(null)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleSection(section.id)}
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {sectionLessons.length} lessons
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingSection(section.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Lessons */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="divide-y dark:divide-gray-800">
                        {sectionLessons.map((lesson, lessonIndex) => {
                          const LessonIcon = getLessonIcon(lesson.type);
                          const lessonColor = getLessonColor(lesson.type);

                          return (
                            <div
                              key={lesson.id}
                              className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                              onClick={() => setViewingLesson(lesson)}
                            >
                              <div className="cursor-grab" onClick={(e) => e.stopPropagation()}>
                                <GripVertical className="w-4 h-4 text-gray-300" />
                              </div>

                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${lessonColor}-100 dark:bg-${lessonColor}-900/50 text-${lessonColor}-600`}
                              >
                                <LessonIcon className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {lesson.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className="capitalize">{lesson.type}</span>
                                  {lesson.duration && (
                                    <>
                                      <span>•</span>
                                      <span>{lesson.duration} min</span>
                                    </>
                                  )}
                                  {lesson.type === 'quiz' && lesson.quizQuestions && (
                                    <>
                                      <span>•</span>
                                      <span>{lesson.quizQuestions.length} questions</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {/* Preview Toggle */}
                                <button
                                  onClick={() => toggleLessonPreview(lesson)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    lesson.isPreviewable
                                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                  }`}
                                  title={
                                    lesson.isPreviewable
                                      ? 'Preview enabled'
                                      : 'Enable preview'
                                  }
                                >
                                  {lesson.isPreviewable ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleStartEditLesson(lesson)}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* New Lesson Form */}
                        {showNewLessonForm === section.id ? (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t dark:border-gray-800">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  Add New Lesson
                                </h4>
                                <button
                                  onClick={() => {
                                    resetLessonForm();
                                    setShowNewLessonForm(null);
                                  }}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              {/* Lesson Type Selection */}
                              <div className="flex flex-wrap gap-2">
                                {LESSON_TYPES.map((type) => (
                                  <button
                                    key={type.type}
                                    onClick={() => setNewLessonType(type.type)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                      newLessonType === type.type
                                        ? `bg-${type.color}-500 text-white`
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border dark:border-gray-700 hover:border-gray-400'
                                    }`}
                                  >
                                    <type.icon className="w-4 h-4" />
                                    {type.label}
                                  </button>
                                ))}
                              </div>

                              {/* Lesson Title */}
                              <Input
                                placeholder="Lesson title"
                                value={newLessonTitle}
                                onChange={(e) => setNewLessonTitle(e.target.value)}
                              />

                              {/* Content based on type */}
                              {newLessonType === 'video' && (
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Video URL (YouTube, Vimeo, Google Drive, etc.)"
                                    value={newLessonContent}
                                    onChange={(e) => setNewLessonContent(e.target.value)}
                                  />
                                  {newLessonContent && getYouTubeEmbedUrl(newLessonContent) && (
                                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                      <iframe
                                        src={getYouTubeEmbedUrl(newLessonContent) || ''}
                                        className="w-full h-full"
                                        allowFullScreen
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                              {newLessonType === 'note' && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg">
                                  <ReactQuill
                                    theme="snow"
                                    value={newLessonContent}
                                    onChange={setNewLessonContent}
                                    modules={quillModules}
                                    placeholder="Write your notes here..."
                                    className="min-h-[200px]"
                                  />
                                </div>
                              )}
                              {newLessonType === 'pdf' && (
                                <Input
                                  placeholder="PDF URL (Google Drive, Dropbox, etc.)"
                                  value={newLessonContent}
                                  onChange={(e) => setNewLessonContent(e.target.value)}
                                />
                              )}
                              {newLessonType === 'link' && (
                                <Input
                                  placeholder="External URL"
                                  value={newLessonContent}
                                  onChange={(e) => setNewLessonContent(e.target.value)}
                                />
                              )}
                              {newLessonType === 'live-class' && (
                                <div className="space-y-3">
                                  <Input
                                    placeholder="Meeting Link (Zoom, Google Meet, etc.)"
                                    value={newLessonContent}
                                    onChange={(e) => setNewLessonContent(e.target.value)}
                                  />
                                </div>
                              )}
                              {newLessonType === 'quiz' && (
                                <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-gray-900 dark:text-white">Quiz Questions ({quizQuestions.length})</h5>
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        placeholder="Time (min)"
                                        value={quizTimeLimit}
                                        onChange={(e) => setQuizTimeLimit(e.target.value)}
                                        className="w-24"
                                      />
                                      <Input
                                        type="number"
                                        placeholder="Pass %"
                                        value={quizPassingScore}
                                        onChange={(e) => setQuizPassingScore(e.target.value)}
                                        className="w-20"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Existing Questions */}
                                  {quizQuestions.map((q, idx) => (
                                    <div key={q.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{idx + 1}. {q.question}</p>
                                          <div className="grid grid-cols-2 gap-1 mt-2">
                                            {q.options.map((opt, oi) => (
                                              <span key={oi} className={`text-xs px-2 py-1 rounded ${oi === q.correctIndex ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                {String.fromCharCode(65 + oi)}. {opt}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                        <button onClick={() => handleRemoveQuestion(q.id)} className="text-red-500 hover:text-red-700">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Add New Question */}
                                  <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                                    <Textarea
                                      placeholder="Enter question..."
                                      value={currentQuestion}
                                      onChange={(e) => setCurrentQuestion(e.target.value)}
                                      rows={2}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      {currentOptions.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <button
                                            onClick={() => setCurrentCorrect(idx)}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                              currentCorrect === idx 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}
                                          >
                                            {String.fromCharCode(65 + idx)}
                                          </button>
                                          <Input
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                            value={opt}
                                            onChange={(e) => {
                                              const newOpts = [...currentOptions];
                                              newOpts[idx] = e.target.value;
                                              setCurrentOptions(newOpts);
                                            }}
                                            className="flex-1"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                    <Button size="sm" onClick={handleAddQuestion} disabled={!currentQuestion.trim() || currentOptions.some(o => !o.trim())}>
                                      <Plus className="w-4 h-4 mr-1" /> Add Question
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Duration & Preview */}
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <label className="text-sm text-gray-500 mb-1 block">
                                    Duration (minutes)
                                  </label>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 15"
                                    value={newLessonDuration}
                                    onChange={(e) => setNewLessonDuration(e.target.value)}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={newLessonPreviewable}
                                    onCheckedChange={setNewLessonPreviewable}
                                  />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Free Preview
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    resetLessonForm();
                                    setShowNewLessonForm(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={() => handleCreateLesson(section.id)}>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Lesson
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowNewLessonForm(section.id)}
                            className="w-full p-4 flex items-center justify-center gap-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Add Lesson
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* New Section Form */}
          {showNewSectionForm ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 p-6"
            >
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Add New Section
              </h3>
              <div className="space-y-4">
                <Input
                  placeholder="Section title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Section description (optional)"
                  value={newSectionDescription}
                  onChange={(e) => setNewSectionDescription(e.target.value)}
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewSectionTitle('');
                      setNewSectionDescription('');
                      setShowNewSectionForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSection}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Section
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowNewSectionForm(true)}
              className="w-full p-6 flex items-center justify-center gap-2 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Section
            </button>
          )}
        </motion.div>

        {/* Empty State */}
        {courseSections.length === 0 && !showNewSectionForm && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No content yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start building your course by adding sections and lessons.
            </p>
            <Button onClick={() => setShowNewSectionForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Section
            </Button>
          </div>
        )}
      </div>

      {/* Lesson View Modal */}
      <AnimatePresence>
        {viewingLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setViewingLesson(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
                <div className="flex items-center gap-3">
                  {(() => {
                    const LessonIcon = getLessonIcon(viewingLesson.type);
                    return <LessonIcon className="w-5 h-5 text-indigo-600" />;
                  })()}
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{viewingLesson.title}</h2>
                    <p className="text-sm text-gray-500 capitalize">{viewingLesson.type} {viewingLesson.duration && `• ${viewingLesson.duration} min`}</p>
                  </div>
                </div>
                <button onClick={() => setViewingLesson(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {viewingLesson.type === 'video' && (
                  <div className="space-y-4">
                    {getYouTubeEmbedUrl(viewingLesson.content) ? (
                      <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <iframe
                          src={getYouTubeEmbedUrl(viewingLesson.content) || ''}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    ) : viewingLesson.content.includes('drive.google.com') ? (
                      <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <iframe
                          src={viewingLesson.content.replace('/view', '/preview')}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <a href={viewingLesson.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline">
                          <ExternalLink className="w-4 h-4" />
                          Open Video Link
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {viewingLesson.type === 'note' && (
                  <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: viewingLesson.content }} />
                )}

                {viewingLesson.type === 'pdf' && (
                  <div className="space-y-4">
                    {viewingLesson.content.includes('drive.google.com') ? (
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <iframe
                          src={viewingLesson.content.replace('/view', '/preview')}
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <a href={viewingLesson.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline">
                          <ExternalLink className="w-4 h-4" />
                          Open PDF
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {viewingLesson.type === 'link' && (
                  <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl text-center">
                    <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <a href={viewingLesson.content} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-lg">
                      {viewingLesson.content}
                    </a>
                  </div>
                )}

                {viewingLesson.type === 'quiz' && viewingLesson.quizQuestions && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">{viewingLesson.quizQuestions.length} Questions</p>
                        {viewingLesson.quizTimeLimit && <p className="text-sm text-amber-600">Time Limit: {viewingLesson.quizTimeLimit} minutes</p>}
                      </div>
                      <div className="text-right">
                        {viewingLesson.quizPassingScore && <p className="text-sm text-amber-600">Passing Score: {viewingLesson.quizPassingScore}%</p>}
                      </div>
                    </div>
                    {viewingLesson.quizQuestions.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <div
                              key={oi}
                              className={`px-3 py-2 rounded-lg text-sm ${
                                oi === q.correctIndex
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                                  : 'bg-white dark:bg-gray-900 border dark:border-gray-700'
                              }`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                              {opt}
                              {oi === q.correctIndex && <CheckCircle2 className="w-4 h-4 inline ml-2 text-emerald-600" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewingLesson.type === 'live-class' && (
                  <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-center">
                    <Calendar className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                    <h3 className="font-medium text-rose-800 dark:text-rose-200 mb-2">Live Class</h3>
                    <a href={viewingLesson.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
                      <Play className="w-4 h-4" />
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Lesson Modal */}
      <AnimatePresence>
        {editingLesson && (() => {
          const lesson = lessons.find(l => l.id === editingLesson);
          if (!lesson) return null;
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setEditingLesson(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Edit Lesson</h2>
                  <button onClick={() => setEditingLesson(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                  <Input
                    placeholder="Lesson title"
                    value={editLessonTitle}
                    onChange={(e) => setEditLessonTitle(e.target.value)}
                  />

                  {lesson.type === 'video' && (
                    <Input
                      placeholder="Video URL"
                      value={editLessonContent}
                      onChange={(e) => setEditLessonContent(e.target.value)}
                    />
                  )}

                  {lesson.type === 'note' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg">
                      <ReactQuill
                        theme="snow"
                        value={editLessonContent}
                        onChange={setEditLessonContent}
                        modules={quillModules}
                        className="min-h-[200px]"
                      />
                    </div>
                  )}

                  {lesson.type === 'pdf' && (
                    <Input
                      placeholder="PDF URL"
                      value={editLessonContent}
                      onChange={(e) => setEditLessonContent(e.target.value)}
                    />
                  )}

                  {lesson.type === 'link' && (
                    <Input
                      placeholder="External URL"
                      value={editLessonContent}
                      onChange={(e) => setEditLessonContent(e.target.value)}
                    />
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 mb-1 block">Duration (minutes)</label>
                      <Input
                        type="number"
                        value={editLessonDuration}
                        onChange={(e) => setEditLessonDuration(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={editLessonPreviewable} onCheckedChange={setEditLessonPreviewable} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Free Preview</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-800">
                  <Button variant="outline" onClick={() => setEditingLesson(null)}>Cancel</Button>
                  <Button onClick={() => handleSaveEditLesson(lesson)}>
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
