import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Award,
  BookOpen,
  Camera,
  Save,
  X,
  Plus,
  Trash2,
  GraduationCap,
  Briefcase,
  Globe,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Upload,
  MapPin,
  Shield,
  FileCheck,
  Image,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCoachingStore } from '@/stores/coaching-store';
import { useAuthStore } from '@/stores/auth-store';
import type { TeacherProfile, TeacherCertificate } from '@/types';

interface TeacherProfileFormProps {
  onClose: () => void;
  existingProfile?: TeacherProfile;
}

export function TeacherProfileForm({ onClose, existingProfile }: TeacherProfileFormProps) {
  const { user } = useAuthStore();
  const { addTeacher, updateTeacher } = useCoachingStore();

  // Form state
  const [displayName, setDisplayName] = useState(existingProfile?.displayName || user?.displayName || '');
  const [bio, setBio] = useState(existingProfile?.bio || '');
  const [photoURL, setPhotoURL] = useState(existingProfile?.photoURL || user?.photoURL || '');
  const [phone, setPhone] = useState(existingProfile?.phone || '');
  const [website, setWebsite] = useState(existingProfile?.website || '');
  const [offlineAddress, setOfflineAddress] = useState(existingProfile?.offlineAddress || '');
  
  // Qualifications (text-based)
  const [qualifications, setQualifications] = useState<string[]>(
    existingProfile?.qualifications || []
  );
  const [newQualification, setNewQualification] = useState('');
  
  // Certificates (with upload for verification)
  const [certificates, setCertificates] = useState<TeacherCertificate[]>(
    existingProfile?.certificates || []
  );
  const [newCertificate, setNewCertificate] = useState({
    name: '',
    institution: '',
    year: '',
    documentURL: '',
  });
  
  // Subjects
  const [subjects, setSubjects] = useState<string[]>(
    existingProfile?.subjects || []
  );
  const [newSubject, setNewSubject] = useState('');
  
  // Experience - offline/external experience (user input)
  const [experience, setExperience] = useState(
    existingProfile?.experience?.toString() || ''
  );
  
  // GS Experience is auto-calculated
  const gsJoinedAt = existingProfile?.gsJoinedAt || existingProfile?.createdAt || new Date();
  const gsExperience = useMemo(() => {
    const joinDate = new Date(gsJoinedAt);
    const now = new Date();
    const diffMs = now.getTime() - joinDate.getTime();
    const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  }, [gsJoinedAt]);
  
  // Social links
  const [socialLinks, setSocialLinks] = useState({
    youtube: existingProfile?.socialLinks?.youtube || '',
    facebook: existingProfile?.socialLinks?.facebook || '',
    twitter: existingProfile?.socialLinks?.twitter || '',
    linkedin: existingProfile?.socialLinks?.linkedin || '',
    instagram: existingProfile?.socialLinks?.instagram || '',
  });
  
  // Consultation settings
  const [consultationEnabled, setConsultationEnabled] = useState(
    existingProfile?.consultationEnabled || false
  );
  const [consultationRate, setConsultationRate] = useState(
    existingProfile?.consultationRate?.toString() || ''
  );
  const [consultationDuration, setConsultationDuration] = useState(
    existingProfile?.consultationDuration?.toString() || '30'
  );
  
  // UI states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'basic' | 'qualifications' | 'consultation'>('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certFileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to format GS Experience
  const formatGSExperience = (months: number): string => {
    if (months < 1) return 'New';
    if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  };

  // Handlers
  const handleAddQualification = () => {
    if (newQualification.trim()) {
      setQualifications([...qualifications, newQualification.trim()]);
      setNewQualification('');
    }
  };

  const handleRemoveQualification = (index: number) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const handleAddCertificate = () => {
    if (newCertificate.name.trim()) {
      const cert: TeacherCertificate = {
        id: `cert_${Date.now()}`,
        name: newCertificate.name.trim(),
        institution: newCertificate.institution.trim() || undefined,
        year: newCertificate.year.trim() || undefined,
        documentURL: newCertificate.documentURL.trim() || undefined,
        isVerified: false,
      };
      setCertificates([...certificates, cert]);
      setNewCertificate({ name: '', institution: '', year: '', documentURL: '' });
    }
  };

  const handleRemoveCertificate = (id: string) => {
    setCertificates(certificates.filter(c => c.id !== id));
  };

  const handleCertificateUpload = () => {
    // In a real app, this would upload to storage
    const url = prompt('Enter certificate document URL (image or PDF):');
    if (url) {
      setNewCertificate({ ...newCertificate, documentURL: url });
    }
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = () => {
    // In a real app, this would handle file upload to storage
    // For now, we'll use a URL input approach
    const url = prompt('Enter photo URL:');
    if (url) {
      setPhotoURL(url);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }
    if (!bio.trim()) {
      setError('Bio is required');
      return;
    }
    if (subjects.length === 0) {
      setError('Add at least one subject');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const profileData: Omit<TeacherProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.id,
        email: user.email || '',
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: photoURL || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        offlineAddress: offlineAddress.trim() || undefined,
        qualifications,
        certificates,
        subjects,
        experience: experience ? parseInt(experience) : undefined,
        gsExperience,
        gsJoinedAt: existingProfile?.gsJoinedAt || existingProfile?.createdAt || new Date(),
        rating: existingProfile?.rating || 0,
        totalRatings: existingProfile?.totalRatings || 0,
        totalStudents: existingProfile?.totalStudents || 0,
        totalCourses: existingProfile?.totalCourses || 0,
        totalEarnings: existingProfile?.totalEarnings || 0,
        isVerified: existingProfile?.isVerified || false,
        verificationStatus: existingProfile?.verificationStatus || (certificates.length > 0 ? 'pending' : undefined),
        isActive: true,
        socialLinks: Object.fromEntries(
          Object.entries(socialLinks).filter(([_, v]) => v.trim())
        ) as TeacherProfile['socialLinks'],
        consultationEnabled,
        consultationRate: consultationRate ? parseFloat(consultationRate) : undefined,
        consultationDuration: consultationDuration ? parseInt(consultationDuration) : undefined,
      };

      if (existingProfile) {
        updateTeacher(existingProfile.id, profileData);
      } else {
        addTeacher({
          id: `teacher_${user.id}`,
          ...profileData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      onClose();
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sectionButtons = [
    { id: 'basic' as const, label: 'Basic Info', icon: User },
    { id: 'qualifications' as const, label: 'Qualification Certificate', icon: GraduationCap },
    { id: 'consultation' as const, label: 'Consultation', icon: MessageSquare },
  ];

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
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white/20 overflow-hidden border-2 border-white/40">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white/60" />
                  </div>
                )}
              </div>
              <button
                onClick={handlePhotoUpload}
                className="absolute bottom-0 right-0 p-2 bg-white text-indigo-600 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {existingProfile ? 'Edit Teacher Profile' : 'Create Teacher Profile'}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Set up your profile to start teaching
              </p>
              {/* GS Experience Badge */}
              {existingProfile && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    GS Experience: {formatGSExperience(gsExperience)}
                  </div>
                  {existingProfile.isVerified && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/30 rounded-full text-xs font-medium">
                      <Shield className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-2 mt-6 -mb-6 relative z-10">
            {sectionButtons.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-xl font-medium text-sm transition-all ${
                  activeSection === section.id
                    ? 'bg-white dark:bg-gray-900 text-indigo-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <section.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{section.label}</span>
              </button>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            {activeSection === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                {/* Photo Upload Section */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                      {photoURL ? (
                        <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePhotoUpload}
                        className="mb-2"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </Button>
                      <p className="text-xs text-gray-500">
                        Recommended: 400x400px, JPG or PNG
                      </p>
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your full name"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio *
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell students about yourself, your teaching style, and experience..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website (Optional)
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Offline Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Offline Teaching Address (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Textarea
                      value={offlineAddress}
                      onChange={(e) => setOfflineAddress(e.target.value)}
                      placeholder="Enter your coaching center or offline teaching address..."
                      rows={2}
                      className="pl-10 resize-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This helps students find you for offline classes
                  </p>
                </div>

                {/* Experience - Now shows both offline and GS experience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Offline Teaching Experience (Years)
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="number"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder="e.g., 5"
                        min="0"
                        max="50"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      GS Platform Experience
                    </label>
                    <div className="relative">
                      <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                        <BadgeCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                          {existingProfile ? formatGSExperience(gsExperience) : 'New Teacher'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-calculated based on your GS journey
                    </p>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Social Links (Optional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(socialLinks).map(([key, value]) => (
                      <Input
                        key={key}
                        value={value}
                        onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
                        placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} URL`}
                        className="text-sm"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'qualifications' && (
              <motion.div
                key="qualifications"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Subjects */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subjects You Teach *
                  </label>
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="e.g., Mathematics, Physics"
                        className="pl-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                      />
                    </div>
                    <Button onClick={handleAddSubject} size="sm" className="px-4">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject, index) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                      >
                        {subject}
                        <button
                          onClick={() => handleRemoveSubject(index)}
                          className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                    {subjects.length === 0 && (
                      <span className="text-sm text-gray-500">No subjects added yet</span>
                    )}
                  </div>
                </div>

                {/* Qualifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Qualifications
                  </label>
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={newQualification}
                        onChange={(e) => setNewQualification(e.target.value)}
                        placeholder="e.g., M.Sc. in Physics, B.Ed."
                        className="pl-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddQualification()}
                      />
                    </div>
                    <Button onClick={handleAddQualification} size="sm" className="px-4">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {qualifications.map((qual, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{qual}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveQualification(index)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                    {qualifications.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Add your qualifications to build trust</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificate Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Certificates for Verification
                  </label>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-700 dark:text-amber-300">
                        <p className="font-medium mb-1">Get Verified Badge</p>
                        <p className="text-amber-600 dark:text-amber-400">
                          Upload your certificates to get verified by admin. Verified teachers get a badge that builds trust with students.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Add Certificate Form */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4 space-y-3">
                    <Input
                      value={newCertificate.name}
                      onChange={(e) => setNewCertificate({ ...newCertificate, name: e.target.value })}
                      placeholder="Certificate name (e.g., B.Ed. Certificate)"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={newCertificate.institution}
                        onChange={(e) => setNewCertificate({ ...newCertificate, institution: e.target.value })}
                        placeholder="Institution (optional)"
                      />
                      <Input
                        value={newCertificate.year}
                        onChange={(e) => setNewCertificate({ ...newCertificate, year: e.target.value })}
                        placeholder="Year (optional)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newCertificate.documentURL}
                        onChange={(e) => setNewCertificate({ ...newCertificate, documentURL: e.target.value })}
                        placeholder="Document URL (link to certificate image/PDF)"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCertificateUpload}
                        className="px-3"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button 
                      onClick={handleAddCertificate} 
                      disabled={!newCertificate.name.trim()}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Certificate
                    </Button>
                  </div>

                  {/* Uploaded Certificates */}
                  {certificates.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Your Certificates ({certificates.length})
                      </h4>
                      <div className="space-y-2">
                        {certificates.map((cert) => (
                          <motion.div
                            key={cert.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileCheck className="w-5 h-5 text-indigo-500" />
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cert.name}</span>
                                {(cert.institution || cert.year) && (
                                  <p className="text-xs text-gray-500">
                                    {cert.institution}{cert.institution && cert.year ? ' • ' : ''}{cert.year}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-0.5">
                                  {cert.isVerified ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                      <BadgeCheck className="w-3 h-3" />
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                      <Clock className="w-3 h-3" />
                                      Pending Verification
                                    </span>
                                  )}
                                  {cert.documentURL && (
                                    <a 
                                      href={cert.documentURL} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                      View Document
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveCertificate(cert.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {certificates.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No certificates added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Add certificates above to get verified</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeSection === 'consultation' && (
              <motion.div
                key="consultation"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Consultation Toggle */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Enable 1-on-1 Consultation
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Allow students to book private sessions with you
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={consultationEnabled}
                    onCheckedChange={setConsultationEnabled}
                  />
                </div>

                <AnimatePresence>
                  {consultationEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {/* Consultation Rate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Rate per Session (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <Input
                            type="number"
                            value={consultationRate}
                            onChange={(e) => setConsultationRate(e.target.value)}
                            placeholder="500"
                            min="0"
                            className="pl-8"
                          />
                        </div>
                      </div>

                      {/* Session Duration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Session Duration (minutes)
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select
                            value={consultationDuration}
                            onChange={(e) => setConsultationDuration(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="45">45 minutes</option>
                            <option value="60">60 minutes</option>
                            <option value="90">90 minutes</option>
                          </select>
                        </div>
                      </div>

                      {/* Preview Card */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-xs text-gray-500 mb-2">Preview</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {consultationDuration} min session
                            </span>
                          </div>
                          <span className="text-lg font-bold text-indigo-600">
                            ₹{consultationRate || '0'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!consultationEnabled && (
                  <div className="text-center py-8 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Enable consultation to offer personal guidance<br />
                      and earn extra income
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Profile
                </div>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
