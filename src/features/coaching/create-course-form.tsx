import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  DollarSign,
  Image,
  FileText,
  Tag,
  Clock,
  Users,
  Eye,
  EyeOff,
  Save,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Video,
  FileQuestion,
  Link2,
  GraduationCap,
  Globe,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCoachingStore } from '@/stores/coaching-store';
import { useAuthStore } from '@/stores/auth-store';
import type { Course, TeacherProfile } from '@/types';

interface CreateCourseFormProps {
  onClose: () => void;
  existingCourse?: Course;
}

type Step = 'basic' | 'content' | 'pricing' | 'settings';

const CATEGORIES = [
  'Science',
  'Mathematics',
  'Languages',
  'Computer Science',
  'Business',
  'Arts',
  'Music',
  'Health & Fitness',
  'Personal Development',
  'Test Preparation',
  'Competitive Exams',
  'School Education',
  'Other',
];

const LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'No prior knowledge needed' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some basics required' },
  { value: 'advanced', label: 'Advanced', description: 'Strong foundation needed' },
  { value: 'all', label: 'All Levels', description: 'Suitable for everyone' },
];

export function CreateCourseForm({ onClose, existingCourse }: CreateCourseFormProps) {
  const { user } = useAuthStore();
  const { addCourse, updateCourse, teachers, teacherProfile: storedProfile } = useCoachingStore();
  
  // Find teacher profile - check both teachers array and stored teacherProfile
  const teacherProfile = teachers.find((t: TeacherProfile) => t.userId === user?.id) ?? 
    (storedProfile?.userId === user?.id ? storedProfile : undefined);

  // Current step
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  
  // Basic Info
  const [title, setTitle] = useState(existingCourse?.title || '');
  const [subtitle, setSubtitle] = useState(existingCourse?.subtitle || '');
  const [description, setDescription] = useState(existingCourse?.description || '');
  const [thumbnail, setThumbnail] = useState(existingCourse?.thumbnail || '');
  const [category, setCategory] = useState(existingCourse?.category || '');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all'>(
    existingCourse?.level || 'beginner'
  );
  const [language, setLanguage] = useState(existingCourse?.language || 'English');
  
  // Content Overview
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>(
    existingCourse?.whatYouWillLearn || ['']
  );
  const [requirements, setRequirements] = useState<string[]>(
    existingCourse?.requirements || ['']
  );
  const [tags, setTags] = useState<string[]>(existingCourse?.tags || []);
  const [newTag, setNewTag] = useState('');
  
  // Pricing
  const [price, setPrice] = useState(existingCourse?.price?.toString() || '');
  const [discountPrice, setDiscountPrice] = useState(existingCourse?.discountPrice?.toString() || '');
  const [currency, setCurrency] = useState(existingCourse?.currency || 'INR');
  
  // Settings
  const [isPublished, setIsPublished] = useState(existingCourse?.isPublished || false);
  const [hasCertificate, setHasCertificate] = useState(existingCourse?.hasCertificate || false);
  const [hasPreview, setHasPreview] = useState(existingCourse?.hasPreview !== false);
  const [estimatedDuration, setEstimatedDuration] = useState(
    existingCourse?.estimatedDuration?.toString() || ''
  );
  
  // UI States
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'basic', label: 'Basic Info', icon: BookOpen },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Tag },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Handlers
  const handleAddLearningPoint = () => {
    setWhatYouWillLearn([...whatYouWillLearn, '']);
  };

  const handleUpdateLearningPoint = (index: number, value: string) => {
    const updated = [...whatYouWillLearn];
    updated[index] = value;
    setWhatYouWillLearn(updated);
  };

  const handleRemoveLearningPoint = (index: number) => {
    setWhatYouWillLearn(whatYouWillLearn.filter((_, i) => i !== index));
  };

  const handleAddRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const handleUpdateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 'basic':
        if (!title.trim()) {
          setError('Course title is required');
          return false;
        }
        if (!category) {
          setError('Please select a category');
          return false;
        }
        break;
      case 'content':
        // Learning outcomes are now optional
        break;
      case 'pricing':
        if (!price || parseFloat(price) < 0) {
          setError('Please set a valid price');
          return false;
        }
        if (discountPrice && parseFloat(discountPrice) >= parseFloat(price)) {
          setError('Discount price must be less than original price');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
      setError('');
    }
  };

  const handleSave = async () => {
    if (!user || !teacherProfile) {
      setError('Teacher profile not found');
      return;
    }

    // Validate all steps
    for (const step of steps) {
      if (!validateStep(step.id)) {
        setCurrentStep(step.id);
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      const courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'> = {
        teacherId: teacherProfile.id,
        teacherName: teacherProfile.displayName,
        teacherPhoto: teacherProfile.photoURL,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim(),
        thumbnail: thumbnail.trim() || undefined,
        category,
        level,
        language,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        currency,
        isPublished,
        hasCertificate,
        hasPreview,
        whatYouWillLearn: whatYouWillLearn.filter(p => p.trim()),
        requirements: requirements.filter(r => r.trim()),
        tags,
        totalSections: existingCourse?.totalSections || 0,
        totalLessons: existingCourse?.totalLessons || 0,
        totalDuration: existingCourse?.totalDuration || 0,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        rating: existingCourse?.rating || 0,
        totalReviews: existingCourse?.totalReviews || 0,
        totalStudents: existingCourse?.totalStudents || 0,
      };

      if (existingCourse) {
        updateCourse({ ...existingCourse, ...courseData, updatedAt: new Date() });
      } else {
        addCourse({
          id: `course_${Date.now()}`,
          ...courseData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      onClose();
    } catch (err) {
      setError('Failed to save course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {existingCourse ? 'Edit Course' : 'Create New Course'}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Share your knowledge with students
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6 -mb-6 relative z-10">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    if (index <= currentStepIndex) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-xl font-medium text-sm transition-all ${
                    currentStep === step.id
                      ? 'bg-white dark:bg-gray-900 text-emerald-600'
                      : index < currentStepIndex
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/20 text-white/70'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-emerald-400' : 'bg-white/30'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-50 dark:bg-red-900/30 px-6 py-3 flex items-center gap-2 text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {currentStep === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Complete Mathematics for Class 10"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subtitle (Optional)
                  </label>
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="A brief tagline for your course"
                    maxLength={150}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what students will learn, what's included, and who this course is for..."
                    rows={5}
                    className="resize-none"
                  />
                </div>

                {/* Category & Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Marathi">Marathi</option>
                    </select>
                  </div>
                </div>

                {/* Level Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Course Level *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {LEVELS.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => setLevel(l.value as any)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          level === l.value
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                        }`}
                      >
                        <p className={`font-medium text-sm ${
                          level === l.value ? 'text-emerald-600' : 'text-gray-900 dark:text-white'
                        }`}>
                          {l.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{l.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thumbnail URL (Optional)
                  </label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="https://example.com/course-image.jpg"
                      className="pl-10"
                    />
                  </div>
                  {thumbnail && (
                    <div className="mt-3 rounded-xl overflow-hidden">
                      <img src={thumbnail} alt="Thumbnail preview" className="w-full h-40 object-cover" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Content */}
            {currentStep === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* What You'll Learn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What Students Will Learn (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Add learning outcomes to describe what students will achieve
                  </p>
                  <div className="space-y-2">
                    {whatYouWillLearn.map((point, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <Input
                          value={point}
                          onChange={(e) => handleUpdateLearningPoint(index, e.target.value)}
                          placeholder={`Learning outcome ${index + 1}`}
                        />
                        {whatYouWillLearn.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLearningPoint(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddLearningPoint}
                    className="mt-3"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Add Learning Outcome
                  </Button>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requirements (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    What do students need before starting?
                  </p>
                  <div className="space-y-2">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={req}
                          onChange={(e) => handleUpdateRequirement(index, e.target.value)}
                          placeholder={`Requirement ${index + 1}`}
                        />
                        {requirements.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRequirement(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRequirement}
                    className="mt-3"
                  >
                    Add Requirement
                  </Button>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (Optional)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        className="pl-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      />
                    </div>
                    <Button onClick={handleAddTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-sm"
                      >
                        #{tag}
                        <button onClick={() => handleRemoveTag(index)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Content Types Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Content types you can add:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: Video, label: 'Video Lessons' },
                      { icon: FileText, label: 'Notes' },
                      { icon: FileQuestion, label: 'Mock Tests' },
                      { icon: Link2, label: 'Resources' },
                    ].map((type) => (
                      <div key={type.label} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <type.icon className="w-4 h-4 text-emerald-500" />
                        <span>{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Pricing */}
            {currentStep === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Price *
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-24 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                      <option value="BDT">৳ BDT</option>
                    </select>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="999"
                        min="0"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Discount Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discount Price (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="499"
                      min="0"
                      className="pl-10"
                    />
                  </div>
                  {discountPrice && price && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Students save {Math.round((1 - parseFloat(discountPrice) / parseFloat(price)) * 100)}% ({currency === 'INR' ? '₹' : currency === 'BDT' ? '৳' : '$'}{parseFloat(price) - parseFloat(discountPrice)})
                      </p>
                    </div>
                  )}
                </div>

                {/* Price Preview Card */}
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                    Price Preview
                  </h4>
                  <div className="flex items-end gap-3">
                    {discountPrice ? (
                      <>
                        <span className="text-3xl font-bold text-emerald-600">
                          {currency === 'INR' ? '₹' : currency === 'BDT' ? '৳' : '$'}{discountPrice}
                        </span>
                        <span className="text-xl text-gray-400 line-through">
                          {currency === 'INR' ? '₹' : currency === 'BDT' ? '৳' : '$'}{price}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-emerald-600">
                        {currency === 'INR' ? '₹' : currency === 'BDT' ? '৳' : '$'}{price || '0'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Free Course Option */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Make it Free?</p>
                    <p className="text-sm text-gray-500">Set price to 0 for free courses</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPrice('0');
                      setDiscountPrice('');
                    }}
                  >
                    Set Free
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Settings */}
            {currentStep === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Estimated Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estimated Course Duration (hours)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      placeholder="e.g., 10"
                      min="1"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Toggle Settings */}
                <div className="space-y-4">
                  {/* Preview Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                        {hasPreview ? (
                          <Eye className="w-5 h-5 text-blue-600" />
                        ) : (
                          <EyeOff className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Enable Preview
                        </p>
                        <p className="text-sm text-gray-500">
                          Let students preview some content before buying
                        </p>
                      </div>
                    </div>
                    <Switch checked={hasPreview} onCheckedChange={setHasPreview} />
                  </div>

                  {/* Certificate Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Certificate of Completion
                        </p>
                        <p className="text-sm text-gray-500">
                          Students get a certificate after completing
                        </p>
                      </div>
                    </div>
                    <Switch checked={hasCertificate} onCheckedChange={setHasCertificate} />
                  </div>

                  {/* Publish Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                        {isPublished ? (
                          <Globe className="w-5 h-5 text-white" />
                        ) : (
                          <Lock className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Publish Course
                        </p>
                        <p className="text-sm text-gray-500">
                          {isPublished 
                            ? 'Course is visible to students'
                            : 'Course is hidden, only you can see it'
                          }
                        </p>
                      </div>
                    </div>
                    <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Course Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Title</span>
                      <span className="text-gray-900 dark:text-white font-medium">{title || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category</span>
                      <span className="text-gray-900 dark:text-white">{category || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Level</span>
                      <span className="text-gray-900 dark:text-white capitalize">{level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price</span>
                      <span className="text-emerald-600 font-bold">
                        {currency === 'INR' ? '₹' : currency === 'BDT' ? '৳' : '$'}{discountPrice || price || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0 || saving}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            {currentStepIndex < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {existingCourse ? 'Update Course' : 'Create Course'}
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
