import { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCoachingStore } from '@/stores/coaching-store';
import type { CourseSection, CourseLesson } from '@/types';

interface CourseContentManagerProps {
  courseId: string;
  onBack: () => void;
}

type LessonType = 'video' | 'note' | 'quiz' | 'link' | 'live-class' | 'pdf';

const LESSON_TYPES: { type: LessonType; label: string; icon: any; color: string }[] = [
  { type: 'video', label: 'Video', icon: Video, color: 'blue' },
  { type: 'note', label: 'Notes', icon: FileText, color: 'emerald' },
  { type: 'quiz', label: 'Quiz', icon: FileQuestion, color: 'amber' },
  { type: 'link', label: 'Link', icon: Link2, color: 'purple' },
  { type: 'live-class', label: 'Live Class', icon: Calendar, color: 'rose' },
];

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

  // Form State
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<LessonType>('video');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [newLessonPreviewable, setNewLessonPreviewable] = useState(false);

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

    const newLesson: CourseLesson = {
      id: `lesson_${Date.now()}`,
      courseId,
      sectionId,
      title: newLessonTitle.trim(),
      type: newLessonType,
      content: newLessonContent.trim(),
      duration: newLessonDuration ? parseInt(newLessonDuration) : undefined,
      isPreviewable: newLessonPreviewable,
      isPublished: true,
      order: sectionLessons.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addLesson(newLesson);
    resetLessonForm();
    setShowNewLessonForm(null);
  };

  // Reset lesson form
  const resetLessonForm = () => {
    setNewLessonTitle('');
    setNewLessonType('video');
    setNewLessonContent('');
    setNewLessonDuration('');
    setNewLessonPreviewable(false);
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
                              className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <div className="cursor-grab">
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
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
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
                                  onClick={() => setEditingLesson(lesson.id)}
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
                                <Input
                                  placeholder="Video URL (YouTube, Vimeo, etc.)"
                                  value={newLessonContent}
                                  onChange={(e) => setNewLessonContent(e.target.value)}
                                />
                              )}
                              {newLessonType === 'note' && (
                                <Textarea
                                  placeholder="Note content (supports HTML)"
                                  value={newLessonContent}
                                  onChange={(e) => setNewLessonContent(e.target.value)}
                                  rows={4}
                                />
                              )}
                              {newLessonType === 'link' && (
                                <Input
                                  placeholder="External URL"
                                  value={newLessonContent}
                                  onChange={(e) => setNewLessonContent(e.target.value)}
                                />
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
    </div>
  );
}
