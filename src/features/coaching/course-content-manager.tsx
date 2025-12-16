import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  FileText,
  HelpCircle,
  Video,
  Link2,
  Calendar,
  File,
  Pencil,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Eye,
  Save,
  Play,
  ExternalLink,
  CheckCircle2,
  ArrowLeft,
  Timer,
  Library,
  Search,
  Filter,
  Download,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCoachingStore } from '@/stores/coaching-store';
import { useLibraryStore } from '@/stores/library-store';
import { useAssetStore } from '@/stores/asset-store';
import { useAuthStore } from '@/stores/auth-store';
import { db } from '@/config/firebase';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { InlineSection, InlineLesson, InlineMCQ, AnyAsset } from '@/types';

// Asset item stored in Firestore
interface CourseAsset {
  id: string;
  title: string;
  type: ContentType;
  content?: string;
  quizQuestions?: InlineMCQ[];
  subjectId?: string;
  topicId?: string;
  subtopic?: string;
  courseId?: string;
  createdAt: number;
  createdBy?: string;
  createdByName?: string;
}

interface CourseContentManagerProps {
  courseId: string;
  onBack: () => void;
}

type ContentType = 'video' | 'note' | 'quiz' | 'pdf' | 'link' | 'live-class' | 'live-test';

const CONTENT_TYPES: { type: ContentType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { type: 'note', label: 'Notes', icon: FileText, color: 'blue' },
  { type: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'green' },
  { type: 'live-test', label: 'Live Test', icon: Timer, color: 'cyan' },
  { type: 'video', label: 'Video', icon: Video, color: 'purple' },
  { type: 'link', label: 'External Link', icon: Link2, color: 'orange' },
  { type: 'pdf', label: 'PDF', icon: File, color: 'red' },
  { type: 'live-class', label: 'Live Class', icon: Calendar, color: 'pink' },
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

export function CourseContentManager({ courseId, onBack }: CourseContentManagerProps) {
  const { courses, updateCourse } = useCoachingStore();
  const { user } = useAuthStore();
  const { subjects: librarySubjects, topics: libraryTopics } = useLibraryStore();
  const course = courses.find((c) => c.id === courseId);

  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [addContentType, setAddContentType] = useState<ContentType | null>(null);
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentData, setNewContentData] = useState('');
  
  const [quizQuestions, setQuizQuestions] = useState<InlineMCQ[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  
  const [editingLesson, setEditingLesson] = useState<InlineLesson | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonContent, setEditLessonContent] = useState('');
  
  const [viewingLesson, setViewingLesson] = useState<InlineLesson | null>(null);
  
  const [renamingSection, setRenamingSection] = useState<string | null>(null);
  const [renameSectionTitle, setRenameSectionTitle] = useState('');
  const [renamingLesson, setRenamingLesson] = useState<string | null>(null);
  const [renameLessonTitle, setRenameLessonTitle] = useState('');

  // Asset Library state
  const [showLibrary, setShowLibrary] = useState(false);
  const [courseAssets, setCourseAssets] = useState<CourseAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetFilterType, setAssetFilterType] = useState<'all' | ContentType>('all');
  const [assetFilterSubject, setAssetFilterSubject] = useState('');
  const [assetFilterTopic, setAssetFilterTopic] = useState('');
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [targetSectionForAsset, setTargetSectionForAsset] = useState<string | null>(null);
  
  // Personal Asset Library state
  const [showPersonalLibrary, setShowPersonalLibrary] = useState(false);
  const [selectedPersonalAssets, setSelectedPersonalAssets] = useState<string[]>([]);
  const [personalAssetFilterType, setPersonalAssetFilterType] = useState<'all' | 'mcq' | 'note'>('all');
  
  // Personal Asset Store
  const {
    subjects: personalSubjects,
    topics: personalTopics,
    assets: personalAssets,
    selectedSubjectId: personalSelectedSubject,
    selectedTopicId: personalSelectedTopic,
    setSelectedSubject: setPersonalSelectedSubject,
    setSelectedTopic: setPersonalSelectedTopic,
    getTopicsBySubject: getPersonalTopicsBySubject,
  } = useAssetStore();

  // Load assets from Firestore
  useEffect(() => {
    const loadAssets = async () => {
      setLoadingAssets(true);
      try {
        const snapshot = await getDocs(collection(db, 'course-assets'));
        const loaded = snapshot.docs
          .map((doc) => doc.data() as CourseAsset)
          .filter((a) => !a.courseId || a.courseId === 'global' || a.courseId === courseId);
        setCourseAssets(loaded.sort((a, b) => b.createdAt - a.createdAt));
      } catch (err) {
        console.error('Error loading assets', err);
      } finally {
        setLoadingAssets(false);
      }
    };
    loadAssets();
  }, [courseId]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return courseAssets.filter((asset) => {
      if (assetFilterType !== 'all' && asset.type !== assetFilterType) return false;
      if (assetFilterSubject && asset.subjectId !== assetFilterSubject) return false;
      if (assetFilterTopic && asset.topicId !== assetFilterTopic) return false;
      if (assetSearch && !asset.title.toLowerCase().includes(assetSearch.toLowerCase())) return false;
      return true;
    });
  }, [courseAssets, assetFilterType, assetFilterSubject, assetFilterTopic, assetSearch]);

  const assetTopicOptions = useMemo(() => {
    return assetFilterSubject
      ? libraryTopics.filter((t) => t.subjectId === assetFilterSubject && t.isActive)
      : libraryTopics.filter((t) => t.isActive);
  }, [assetFilterSubject, libraryTopics]);

  useEffect(() => {
    if (course?.sections) {
      setExpandedSections(new Set(course.sections.map((s) => s.id)));
    }
  }, [course?.id, course?.sections]);

  if (!course) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Course not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const sections: InlineSection[] = course.sections || [];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSection: InlineSection = {
      id: `section-${Date.now()}`,
      title: newSectionTitle.trim(),
      lessons: [],
      order: sections.length,
    };
    updateCourse({ ...course, sections: [...sections, newSection] });
    setNewSectionTitle('');
    setShowAddSection(false);
    setExpandedSections((prev) => new Set([...prev, newSection.id]));
  };

  const handleAddContent = () => {
    if (!addingToSection || !addContentType || !newContentTitle.trim()) return;
    const newLesson: InlineLesson = {
      id: `lesson-${Date.now()}`,
      title: newContentTitle.trim(),
      type: addContentType,
      content: (addContentType === 'quiz' || addContentType === 'live-test') ? '' : newContentData,
      quizQuestions: (addContentType === 'quiz' || addContentType === 'live-test') ? quizQuestions : undefined,
      duration: 0,
      order: sections.find((s) => s.id === addingToSection)?.lessons.length || 0,
    };
    const updatedSections = sections.map((section) => {
      if (section.id === addingToSection) {
        return { ...section, lessons: [...section.lessons, newLesson] };
      }
      return section;
    });
    updateCourse({ ...course, sections: updatedSections });

    // Auto-save to Asset Library
    const assetId = uuidv4();
    const newAsset: CourseAsset = {
      id: assetId,
      title: newContentTitle.trim(),
      type: addContentType,
      content: (addContentType === 'quiz' || addContentType === 'live-test') ? '' : newContentData,
      quizQuestions: (addContentType === 'quiz' || addContentType === 'live-test') ? quizQuestions : undefined,
      courseId: 'global', // Make available globally
      createdAt: Date.now(),
      createdBy: user?.id,
      createdByName: user?.displayName,
    };
    setCourseAssets((prev) => [newAsset, ...prev]);
    setDoc(doc(db, 'course-assets', assetId), newAsset).catch((err) => console.error('Error saving asset', err));

    setAddingToSection(null);
    setAddContentType(null);
    setNewContentTitle('');
    setNewContentData('');
    setQuizQuestions([]);
  };

  const handleAddQuizQuestion = () => {
    if (!newQuestion.trim() || newOptions.some((o) => !o.trim())) return;
    const question: InlineMCQ = {
      id: `q-${Date.now()}`,
      question: newQuestion.trim(),
      options: newOptions.map((o) => o.trim()),
      correctIndex,
    };
    setQuizQuestions([...quizQuestions, question]);
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setCorrectIndex(0);
  };

  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = sections.filter((s) => s.id !== sectionId);
    updateCourse({ ...course, sections: updatedSections });
  };

  const handleMoveSectionUp = (sectionIndex: number) => {
    if (sectionIndex === 0) return;
    const newSections = [...sections];
    [newSections[sectionIndex - 1], newSections[sectionIndex]] = [newSections[sectionIndex], newSections[sectionIndex - 1]];
    newSections.forEach((s, i) => s.order = i);
    updateCourse({ ...course, sections: newSections });
  };

  const handleMoveSectionDown = (sectionIndex: number) => {
    if (sectionIndex === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[sectionIndex], newSections[sectionIndex + 1]] = [newSections[sectionIndex + 1], newSections[sectionIndex]];
    newSections.forEach((s, i) => s.order = i);
    updateCourse({ ...course, sections: newSections });
  };

  const handleRenameSection = (sectionId: string) => {
    if (!renameSectionTitle.trim()) return;
    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, title: renameSectionTitle.trim() } : s
    );
    updateCourse({ ...course, sections: updatedSections });
    setRenamingSection(null);
    setRenameSectionTitle('');
  };

  // Load asset from library into a section
  const handleLoadAssetToSection = (asset: CourseAsset, sectionId: string) => {
    const newLesson: InlineLesson = {
      id: `lesson-${Date.now()}`,
      title: asset.title,
      type: asset.type,
      content: asset.content || '',
      quizQuestions: asset.quizQuestions,
      duration: 0,
      order: sections.find((s) => s.id === sectionId)?.lessons.length || 0,
    };
    const updatedSections = sections.map((section) => {
      if (section.id === sectionId) {
        return { ...section, lessons: [...section.lessons, newLesson] };
      }
      return section;
    });
    updateCourse({ ...course, sections: updatedSections });
    setShowLibrary(false);
    setTargetSectionForAsset(null);
  };

  // Import from Personal Asset Library
  const handleImportFromPersonalLibrary = (asset: AnyAsset, sectionId: string) => {
    let lessonType: 'note' | 'quiz' | 'video' = 'note';
    let content = '';
    let quizQuestions: InlineMCQ[] | undefined;

    if (asset.type === 'mcq') {
      lessonType = 'quiz';
      quizQuestions = (asset as any).quizQuestions || [];
    } else if (asset.type === 'note') {
      lessonType = 'note';
      content = (asset as any).content || '';
    } else if (asset.type === 'url') {
      lessonType = 'note';
      content = `<a href="${(asset as any).url}" target="_blank">${asset.title}</a>\n\n${(asset as any).description || ''}`;
    }

    const newLesson: InlineLesson = {
      id: `lesson-${Date.now()}`,
      title: asset.title,
      type: lessonType,
      content,
      quizQuestions,
      duration: 0,
      order: sections.find((s: InlineSection) => s.id === sectionId)?.lessons.length || 0,
    };

    const updatedSections = sections.map((section: InlineSection) => {
      if (section.id === sectionId) {
        return { ...section, lessons: [...section.lessons, newLesson] };
      }
      return section;
    });
    updateCourse({ ...course, sections: updatedSections });
    setTargetSectionForAsset(null);
  };

  const handleDeleteLesson = (sectionId: string, lessonId: string) => {
    const updatedSections = sections.map((section) => {
      if (section.id === sectionId) {
        return { ...section, lessons: section.lessons.filter((l) => l.id !== lessonId) };
      }
      return section;
    });
    updateCourse({ ...course, sections: updatedSections });
  };

  const handleRenameLesson = (sectionId: string, lessonId: string) => {
    if (!renameLessonTitle.trim()) return;
    const updatedSections = sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          lessons: section.lessons.map((l) =>
            l.id === lessonId ? { ...l, title: renameLessonTitle.trim() } : l
          ),
        };
      }
      return section;
    });
    updateCourse({ ...course, sections: updatedSections });
    setRenamingLesson(null);
    setRenameLessonTitle('');
  };

  const moveLessonUp = (sectionId: string, lessonIndex: number) => {
    if (lessonIndex === 0) return;
    const updatedSections = sections.map((section) => {
      if (section.id === sectionId) {
        const newLessons = [...section.lessons];
        [newLessons[lessonIndex - 1], newLessons[lessonIndex]] = [newLessons[lessonIndex], newLessons[lessonIndex - 1]];
        return { ...section, lessons: newLessons };
      }
      return section;
    });
    updateCourse({ ...course, sections: updatedSections });
  };

  const moveLessonDown = (sectionId: string, lessonIndex: number, totalLessons: number) => {
    if (lessonIndex >= totalLessons - 1) return;
    const updatedSections = sections.map((section) => {
      if (section.id === sectionId) {
        const newLessons = [...section.lessons];
        [newLessons[lessonIndex], newLessons[lessonIndex + 1]] = [newLessons[lessonIndex + 1], newLessons[lessonIndex]];
        return { ...section, lessons: newLessons };
      }
      return section;
    });
    updateCourse({ ...course, sections: updatedSections });
  };

  const handleSaveEditLesson = (sectionId: string) => {
    if (!editingLesson) return;
    const updatedSections = sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          lessons: section.lessons.map((l) =>
            l.id === editingLesson.id ? { ...l, title: editLessonTitle, content: editLessonContent } : l
          ),
        };
      }
      return section;
    });
    updateCourse({ ...course, sections: updatedSections });
    setEditingLesson(null);
  };

  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case 'note': return <FileText className="w-4 h-4" />;
      case 'quiz': return <HelpCircle className="w-4 h-4" />;
      case 'live-test': return <Timer className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'link': return <Link2 className="w-4 h-4" />;
      case 'pdf': return <File className="w-4 h-4" />;
      case 'live-class': return <Calendar className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getContentColor = (type: ContentType) => {
    switch (type) {
      case 'note': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      case 'quiz': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'live-test': return 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30';
      case 'video': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
      case 'link': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';
      case 'pdf': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'live-class': return 'text-pink-500 bg-pink-100 dark:bg-pink-900/30';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
                <p className="text-sm text-gray-500">Course Content Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isEditMode && (
                <Button variant="outline" size="sm" onClick={() => setShowLibrary(true)} className="gap-2">
                  <Library className="w-4 h-4" />
                  View Library
                </Button>
              )}
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${!isEditMode ? 'text-blue-600' : 'text-gray-400'}`}>Display</span>
                <Switch checked={isEditMode} onCheckedChange={setIsEditMode} />
                <span className={`text-sm font-medium ${isEditMode ? 'text-orange-600' : 'text-gray-400'}`}>Edit Mode</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden shadow-sm">
              <div className={`flex items-center justify-between px-4 py-3 ${isEditMode ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-900/50'}`}>
                <div className="flex items-center gap-3 flex-1">
                  <button onClick={() => toggleSection(section.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    {expandedSections.has(section.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  {renamingSection === section.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input value={renameSectionTitle} onChange={(e) => setRenameSectionTitle(e.target.value)} className="h-8" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSection(section.id); if (e.key === 'Escape') setRenamingSection(null); }} />
                      <Button size="sm" onClick={() => handleRenameSection(section.id)}><Save className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setRenamingSection(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <h3 className="font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                  )}
                  <span className="text-sm text-gray-500">({section.lessons.length} items)</span>
                </div>
                {isEditMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setRenamingSection(section.id); setRenameSectionTitle(section.title); }}><Pencil className="w-4 h-4 mr-2" />Rename</DropdownMenuItem>
                      {sectionIndex > 0 && (
                        <DropdownMenuItem onClick={() => handleMoveSectionUp(sectionIndex)}><ArrowUp className="w-4 h-4 mr-2" />Move Up</DropdownMenuItem>
                      )}
                      {sectionIndex < sections.length - 1 && (
                        <DropdownMenuItem onClick={() => handleMoveSectionDown(sectionIndex)}><ArrowDown className="w-4 h-4 mr-2" />Move Down</DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDeleteSection(section.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete Topic</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <AnimatePresence>
                {expandedSections.has(section.id) && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="p-4 space-y-2">
                      {section.lessons.length === 0 && !isEditMode && <p className="text-gray-400 text-sm text-center py-4">No content in this topic yet</p>}
                      {section.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isEditMode ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900'}`}>
                          <div className={`p-2 rounded-lg ${getContentColor(lesson.type as ContentType)}`}>{getContentIcon(lesson.type as ContentType)}</div>
                          {renamingLesson === lesson.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input value={renameLessonTitle} onChange={(e) => setRenameLessonTitle(e.target.value)} className="h-8" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleRenameLesson(section.id, lesson.id); if (e.key === 'Escape') setRenamingLesson(null); }} />
                              <Button size="sm" onClick={() => handleRenameLesson(section.id, lesson.id)}><Save className="w-4 h-4" /></Button>
                            </div>
                          ) : (
                            <button onClick={() => !isEditMode && setViewingLesson(lesson)} className="flex-1 text-left">
                              <span className="font-medium text-gray-900 dark:text-white">{lesson.title}</span>
                              <span className="text-xs text-gray-500 ml-2 capitalize">({lesson.type})</span>
                            </button>
                          )}
                          {isEditMode && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setRenamingLesson(lesson.id); setRenameLessonTitle(lesson.title); }}><Pencil className="w-4 h-4 mr-2" />Rename</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditingLesson(lesson); setEditLessonTitle(lesson.title); setEditLessonContent(lesson.content || ''); }}><FileText className="w-4 h-4 mr-2" />Edit content</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => moveLessonUp(section.id, lessonIndex)} disabled={lessonIndex === 0}><ArrowUp className="w-4 h-4 mr-2" />Move up</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => moveLessonDown(section.id, lessonIndex, section.lessons.length)} disabled={lessonIndex >= section.lessons.length - 1}><ArrowDown className="w-4 h-4 mr-2" />Move down</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteLesson(section.id, lesson.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {!isEditMode && <Button variant="ghost" size="sm" onClick={() => setViewingLesson(lesson)}><Eye className="w-4 h-4" /></Button>}
                        </div>
                      ))}
                      {isEditMode && (
                        <div className="flex gap-2">
                          <button onClick={() => setAddingToSection(section.id)} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                            <Plus className="w-4 h-4" />Add content
                          </button>
                          <button 
                            onClick={() => {
                              setTargetSectionForAsset(section.id);
                              setShowPersonalLibrary(true);
                            }} 
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                          >
                            <Library className="w-4 h-4" />Import from Library
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {isEditMode && (
            <div className="mt-4">
              {showAddSection ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                  <h4 className="font-medium mb-3">Add New Topic</h4>
                  <div className="flex gap-2">
                    <Input placeholder="Topic title..." value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddSection(); if (e.key === 'Escape') setShowAddSection(false); }} autoFocus />
                    <Button onClick={handleAddSection}><Save className="w-4 h-4 mr-2" />Add</Button>
                    <Button variant="ghost" onClick={() => setShowAddSection(false)}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowAddSection(true)} className="w-full bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" />Add Topic</Button>
              )}
            </div>
          )}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No content yet</h3>
            <p className="text-gray-500 mb-4">Enable Edit Mode to start adding topics and content</p>
            {!isEditMode && <Button onClick={() => setIsEditMode(true)}>Enable Edit Mode</Button>}
          </div>
        )}
      </div>

      <AnimatePresence>
        {addingToSection && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setAddingToSection(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Add Content</h2>
                  <Button variant="ghost" size="icon" onClick={() => { setAddingToSection(null); setAddContentType(null); }}><X className="w-5 h-5" /></Button>
                </div>
              </div>
              <div className="p-6">
                {!addContentType ? (
                  <>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Select content type:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {CONTENT_TYPES.map((ct) => (
                        <button key={ct.type} onClick={() => setAddContentType(ct.type)} className="p-4 rounded-xl border-2 hover:border-blue-400 transition-all flex flex-col items-center gap-2">
                          <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700"><ct.icon className="w-6 h-6" /></div>
                          <span className="font-medium">{ct.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <Input placeholder="Content title..." value={newContentTitle} onChange={(e) => setNewContentTitle(e.target.value)} />
                    {addContentType === 'note' && (
                      <div className="bg-white dark:bg-gray-900 rounded-lg border">
                        <ReactQuill theme="snow" value={newContentData} onChange={setNewContentData} modules={quillModules} className="min-h-[200px]" />
                      </div>
                    )}
                    {addContentType === 'video' && <Input placeholder="Video URL (YouTube, Vimeo, etc.)" value={newContentData} onChange={(e) => setNewContentData(e.target.value)} />}
                    {addContentType === 'link' && <Input placeholder="External URL" value={newContentData} onChange={(e) => setNewContentData(e.target.value)} />}
                    {addContentType === 'pdf' && <Input placeholder="PDF URL" value={newContentData} onChange={(e) => setNewContentData(e.target.value)} />}
                    {addContentType === 'live-class' && (
                      <div className="space-y-3">
                        <Input placeholder="Live class URL (Zoom, Meet, etc.)" value={newContentData} onChange={(e) => setNewContentData(e.target.value)} />
                        <p className="text-sm text-gray-500">Add the meeting link for your live class</p>
                      </div>
                    )}
                    {addContentType === 'quiz' && (
                      <div className="space-y-4">
                        {quizQuestions.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Questions ({quizQuestions.length})</h4>
                            {quizQuestions.map((q, idx) => (
                              <div key={q.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-between">
                                <span className="text-sm">{idx + 1}. {q.question}</span>
                                <Button variant="ghost" size="sm" onClick={() => setQuizQuestions(quizQuestions.filter((qq) => qq.id !== q.id))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="p-4 border dark:border-gray-700 rounded-xl space-y-3">
                          <h4 className="font-medium">Add Question</h4>
                          <Textarea placeholder="Enter question..." value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
                          <div className="grid grid-cols-2 gap-2">
                            {newOptions.map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <button onClick={() => setCorrectIndex(idx)} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${correctIndex === idx ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{String.fromCharCode(65 + idx)}</button>
                                <Input placeholder={`Option ${String.fromCharCode(65 + idx)}`} value={opt} onChange={(e) => { const newOpts = [...newOptions]; newOpts[idx] = e.target.value; setNewOptions(newOpts); }} className="flex-1" />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">Click the letter to mark correct answer (green = correct)</p>
                          <Button onClick={handleAddQuizQuestion} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Question</Button>
                        </div>
                      </div>
                    )}
                    {addContentType === 'live-test' && (
                      <div className="space-y-4">
                        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                            <Timer className="w-4 h-4" />
                            <span className="text-sm font-medium">Live Test - Students will be timed</span>
                          </div>
                        </div>
                        {quizQuestions.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Questions ({quizQuestions.length})</h4>
                            {quizQuestions.map((q, idx) => (
                              <div key={q.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-between">
                                <span className="text-sm">{idx + 1}. {q.question}</span>
                                <Button variant="ghost" size="sm" onClick={() => setQuizQuestions(quizQuestions.filter((qq) => qq.id !== q.id))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="p-4 border dark:border-gray-700 rounded-xl space-y-3">
                          <h4 className="font-medium">Add Question</h4>
                          <Textarea placeholder="Enter question..." value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
                          <div className="grid grid-cols-2 gap-2">
                            {newOptions.map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <button onClick={() => setCorrectIndex(idx)} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${correctIndex === idx ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{String.fromCharCode(65 + idx)}</button>
                                <Input placeholder={`Option ${String.fromCharCode(65 + idx)}`} value={opt} onChange={(e) => { const newOpts = [...newOptions]; newOpts[idx] = e.target.value; setNewOptions(newOpts); }} className="flex-1" />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">Click the letter to mark correct answer (green = correct)</p>
                          <Button onClick={handleAddQuizQuestion} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Question</Button>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setAddContentType(null)} className="flex-1">Back</Button>
                      <Button onClick={handleAddContent} disabled={!newContentTitle.trim() || ((addContentType === 'quiz' || addContentType === 'live-test') && quizQuestions.length === 0)} className="flex-1"><Save className="w-4 h-4 mr-2" />Save Content</Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingLesson && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingLesson(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Edit Content</h2>
                  <Button variant="ghost" size="icon" onClick={() => setEditingLesson(null)}><X className="w-5 h-5" /></Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <Input placeholder="Title" value={editLessonTitle} onChange={(e) => setEditLessonTitle(e.target.value)} />
                {editingLesson.type === 'note' && (
                  <div className="bg-white dark:bg-gray-900 rounded-lg border">
                    <ReactQuill theme="snow" value={editLessonContent} onChange={setEditLessonContent} modules={quillModules} className="min-h-[200px]" />
                  </div>
                )}
                {(editingLesson.type === 'video' || editingLesson.type === 'link' || editingLesson.type === 'pdf' || editingLesson.type === 'live-class') && (
                  <Input placeholder="URL" value={editLessonContent} onChange={(e) => setEditLessonContent(e.target.value)} />
                )}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingLesson(null)} className="flex-1">Cancel</Button>
                  <Button onClick={() => { const sectionWithLesson = sections.find((s) => s.lessons.some((l) => l.id === editingLesson.id)); if (sectionWithLesson) handleSaveEditLesson(sectionWithLesson.id); }} className="flex-1"><Save className="w-4 h-4 mr-2" />Save Changes</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingLesson && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setViewingLesson(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getContentColor(viewingLesson.type as ContentType)}`}>{getContentIcon(viewingLesson.type as ContentType)}</div>
                    <h2 className="text-xl font-bold">{viewingLesson.title}</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setViewingLesson(null)}><X className="w-5 h-5" /></Button>
                </div>
              </div>
              <div className="p-6">
                {viewingLesson.type === 'note' && <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: viewingLesson.content || '' }} />}
                {viewingLesson.type === 'video' && viewingLesson.content && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    {viewingLesson.content.includes('youtube') || viewingLesson.content.includes('youtu.be') ? (
                      <iframe src={viewingLesson.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-white">
                        <Play className="w-16 h-16 mb-4" />
                        <a href={viewingLesson.content} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-2">Open Video <ExternalLink className="w-4 h-4" /></a>
                      </div>
                    )}
                  </div>
                )}
                {viewingLesson.type === 'link' && viewingLesson.content && (
                  <div className="text-center py-8">
                    <Link2 className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                    <a href={viewingLesson.content} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-lg flex items-center justify-center gap-2">Open Link <ExternalLink className="w-5 h-5" /></a>
                  </div>
                )}
                {viewingLesson.type === 'pdf' && viewingLesson.content && (
                  <div className="text-center py-8">
                    <File className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <a href={viewingLesson.content} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-lg flex items-center justify-center gap-2">Open PDF <ExternalLink className="w-5 h-5" /></a>
                  </div>
                )}
                {viewingLesson.type === 'live-class' && (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                    {viewingLesson.content ? (
                      <a href={viewingLesson.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600"><Play className="w-5 h-5" />Join Live Class</a>
                    ) : (
                      <p className="text-gray-500">No meeting link available</p>
                    )}
                  </div>
                )}
                {viewingLesson.type === 'quiz' && viewingLesson.quizQuestions && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Quiz: {viewingLesson.quizQuestions.length} Questions</h3>
                    </div>
                    {viewingLesson.quizQuestions.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                        <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className={`px-3 py-2 rounded-lg text-sm ${oi === q.correctIndex ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border border-green-300 dark:border-green-700' : 'bg-white dark:bg-gray-800 border dark:border-gray-700'}`}>
                              <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}{oi === q.correctIndex && <CheckCircle2 className="w-4 h-4 inline ml-2 text-green-600" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset Library Modal */}
      <AnimatePresence>
        {showLibrary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setShowLibrary(false); setTargetSectionForAsset(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Library className="w-6 h-6 text-indigo-500" />
                    <div>
                      <h2 className="text-xl font-bold">Asset Library</h2>
                      <p className="text-sm text-gray-500">Browse and load saved content into your course</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setShowLibrary(false); setTargetSectionForAsset(null); }}><X className="w-5 h-5" /></Button>
                </div>
              </div>

              <div className="p-4 border-b dark:border-gray-700 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} placeholder="Search assets..." className="pl-9" />
                  </div>
                  <Select value={assetFilterType} onValueChange={(v) => setAssetFilterType(v as any)}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {CONTENT_TYPES.map((ct) => (
                        <SelectItem key={ct.type} value={ct.type}>{ct.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={assetFilterSubject || '__all__'} onValueChange={(v) => { setAssetFilterSubject(v === '__all__' ? '' : v); setAssetFilterTopic(''); }}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Subjects</SelectItem>
                      {librarySubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={assetFilterTopic || '__all__'} onValueChange={(v) => setAssetFilterTopic(v === '__all__' ? '' : v)} disabled={!assetFilterSubject}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Topic" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Topics</SelectItem>
                      {assetTopicOptions.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!targetSectionForAsset && sections.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Load to:</span>
                    <Select value={targetSectionForAsset || '__none__'} onValueChange={(v) => setTargetSectionForAsset(v === '__none__' ? null : v)}>
                      <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select section" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select a section...</SelectItem>
                        {sections.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loadingAssets ? (
                  <div className="text-center py-12 text-gray-500">Loading assets...</div>
                ) : filteredAssets.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No assets found</p>
                    <p className="text-sm text-gray-400">Content you add to courses will appear here</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredAssets.map((asset) => {
                      const subject = librarySubjects.find((s) => s.id === asset.subjectId);
                      const topic = libraryTopics.find((t) => t.id === asset.topicId);
                      return (
                        <div key={asset.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                          <div className={`p-2 rounded-lg ${getContentColor(asset.type)}`}>{getContentIcon(asset.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{asset.title}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span className="capitalize">{asset.type}</span>
                              {subject && <span>• {subject.name}</span>}
                              {topic && <span>• {topic.name}</span>}
                              {asset.quizQuestions && <span>• {asset.quizQuestions.length} questions</span>}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            disabled={!targetSectionForAsset}
                            onClick={() => targetSectionForAsset && handleLoadAssetToSection(asset, targetSectionForAsset)}
                            className="gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Load
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-xs text-gray-500 text-center">{courseAssets.length} total assets • Content added to courses is auto-saved here</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personal Asset Library Modal */}
      <AnimatePresence>
        {showPersonalLibrary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPersonalLibrary(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500">
                <div className="flex items-center gap-2 text-white">
                  <Library className="w-5 h-5" />
                  <h3 className="font-semibold">Personal Asset Library</h3>
                </div>
                <button onClick={() => setShowPersonalLibrary(false)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Type Filter */}
              <div className="p-3 border-b dark:border-gray-700 flex flex-wrap gap-2">
                {[
                  { type: 'all', label: 'All', icon: '📋' },
                  { type: 'mcq', label: 'MCQ', icon: '📝' },
                  { type: 'note', label: 'Notes', icon: '📒' },
                ].map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => setPersonalAssetFilterType(type as 'all' | 'mcq' | 'note')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      personalAssetFilterType === type
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Asset List */}
              <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)' }}>
                {personalAssets.filter((a) => personalAssetFilterType === 'all' || a.type === personalAssetFilterType).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Library className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No assets available</p>
                    <p className="text-sm">Add content to your Personal Library first</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {personalAssets
                      .filter((a) => personalAssetFilterType === 'all' || a.type === personalAssetFilterType)
                      .map((asset) => {
                        const subject = personalSubjects.find((s) => s.id === asset.subjectId);
                        const topic = personalTopics.find((t) => t.id === asset.topicId);
                        
                        return (
                          <div
                            key={asset.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              asset.type === 'mcq' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                              asset.type === 'note' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {asset.type === 'mcq' ? '📝' : asset.type === 'note' ? '📒' : '🔗'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{asset.title}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                <span className="capitalize">{asset.type}</span>
                                {subject && <span>• {subject.name}</span>}
                                {topic && <span>• {topic.name}</span>}
                                {asset.type === 'mcq' && (asset as any).quizQuestions && (
                                  <span>• {(asset as any).quizQuestions.length} questions</span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              disabled={!targetSectionForAsset}
                              onClick={() => {
                                if (targetSectionForAsset) {
                                  handleImportFromPersonalLibrary(asset, targetSectionForAsset);
                                  setShowPersonalLibrary(false);
                                }
                              }}
                              className="gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Import
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {targetSectionForAsset && (
                <div className="p-3 border-t dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-sm text-purple-700 dark:text-purple-300 text-center">
                    ✓ Importing to: {sections.find((s: InlineSection) => s.id === targetSectionForAsset)?.title || 'Selected Section'}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
