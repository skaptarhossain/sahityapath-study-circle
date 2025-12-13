import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Upload,
  Download,
  HelpCircle,
  FolderPlus,
  CheckCircle2,
  X,
  Brain,
  RefreshCw,
  Eye,
  Filter,
  ChevronDown,
  ChevronRight,
  Package,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCoachingStore } from '@/stores/coaching-store';
import { useLibraryStore } from '@/stores/library-store';
import { useAuthStore } from '@/stores/auth-store';
import { db } from '@/config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import type { CourseMCQ, LibraryContentPack } from '@/types';

// Local Category type for organizing questions
interface QuestionCategory {
  id: string;
  name: string;
  createdAt: number;
}

interface QuestionBankManagerProps {
  courseId?: string;
}

export function QuestionBankManager({ courseId }: QuestionBankManagerProps) {
  const { user } = useAuthStore();
  const { 
    mcqs,
    addMCQ, 
    updateMCQ, 
    removeMCQ,
    bulkAddMCQs,
  } = useCoachingStore();
  
  // Library store for instant download
  const {
    subjects: librarySubjects,
    topics: libraryTopics,
    contentPacks: libraryPacks,
    mcqs: libraryMcqs,
    selectedSubjectId: librarySubjectId,
    selectedTopicId: libraryTopicId,
    filterPricing: libraryFilterPricing,
    setSelectedSubject: setLibrarySubject,
    setSelectedTopic: setLibraryTopic,
    setFilterPricing: setLibraryFilterPricing,
    getTopicsBySubject: getLibraryTopicsBySubject,
    getPacksBySubject: getLibraryPacksBySubject,
    getPacksByTopic: getLibraryPacksByTopic,
    getMcqsByPack: getLibraryMcqsByPack,
    addDownload: addLibraryDownload,
    hasDownloaded: hasLibraryDownloaded,
  } = useLibraryStore();
  
  // Tab state - same as Group Study: 'single' | 'group' | 'instant'
  const [questionBankTab, setQuestionBankTab] = useState<'single' | 'group' | 'instant'>('single');
  
  // Categories
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Single Question Form
  const [qbQuestion, setQbQuestion] = useState('');
  const [qbOptions, setQbOptions] = useState(['', '', '', '']);
  const [qbCorrect, setQbCorrect] = useState(0);
  const [qbCategoryId, setQbCategoryId] = useState('');
  
  // Group Upload States (Excel/Word)
  const [groupUploadFile, setGroupUploadFile] = useState<File | null>(null);
  const [groupUploadParsedQuestions, setGroupUploadParsedQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctIndex: number;
  }>>([]);
  const [groupUploadCategory, setGroupUploadCategory] = useState('');
  const [groupUploadLoading, setGroupUploadLoading] = useState(false);
  const [groupUploadError, setGroupUploadError] = useState('');
  
  // JSON Upload States
  const [jsonText, setJsonText] = useState('');
  const [jsonParsedQuestions, setJsonParsedQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctIndex: number;
  }>>([]);
  const [jsonParseError, setJsonParseError] = useState('');
  const [jsonUploadMode, setJsonUploadMode] = useState<'file' | 'text'>('file');
  
  // Library Download States
  const [librarySelectedPack, setLibrarySelectedPack] = useState<LibraryContentPack | null>(null);
  const [libraryDownloadCategory, setLibraryDownloadCategory] = useState('');
  const [libraryDownloadMode, setLibraryDownloadMode] = useState<'new' | 'merge'>('new');
  const [libraryNewCategoryName, setLibraryNewCategoryName] = useState('');
  
  // Editing
  const [editingQuestion, setEditingQuestion] = useState<CourseMCQ | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editOptions, setEditOptions] = useState(['', '', '', '']);
  const [editCorrectIndex, setEditCorrectIndex] = useState(0);
  const [editCategory, setEditCategory] = useState('');

  // Get questions by category
  const getQuestionsByCategory = (categoryId: string) => {
    return mcqs.filter(q => (q as any).categoryId === categoryId);
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  // Add Category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const category: QuestionCategory = {
      id: uuidv4(),
      name: newCategoryName.trim(),
      createdAt: Date.now(),
    };
    
    setCategories(prev => [...prev, category]);
    setNewCategoryName('');
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'coaching-categories', category.id), {
        ...category,
        courseId: courseId || 'global',
        userId: user?.id,
      });
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  // Add Single Question
  const handleAddQuestion = async () => {
    if (!qbQuestion.trim() || !qbCategoryId || !user) return;
    if (qbOptions.some(o => !o.trim())) {
      alert('Please fill all options');
      return;
    }
    
    const mcq: CourseMCQ = {
      id: uuidv4(),
      courseId: courseId || '',
      lessonId: '',
      question: qbQuestion.trim(),
      options: qbOptions.map(o => o.trim()),
      correctIndex: qbCorrect,
      marks: 1,
      negativeMarks: 0,
      difficulty: 'medium',
      order: mcqs.length,
    };
    
    // Add category
    (mcq as any).categoryId = qbCategoryId;
    (mcq as any).createdBy = user.id;
    (mcq as any).createdByName = user.displayName;
    (mcq as any).createdAt = Date.now();
    
    addMCQ(mcq);
    
    // Reset form
    setQbQuestion('');
    setQbOptions(['', '', '', '']);
    setQbCorrect(0);
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'coaching-mcqs', mcq.id), mcq);
    } catch (err) {
      console.error('Error saving MCQ:', err);
    }
  };

  // Parse Excel file - same as Group Study
  const parseExcelFile = async (file: File) => {
    setGroupUploadLoading(true);
    setGroupUploadError('');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      
      // Find header row
      const headerRow = jsonData.find(row => row.some(cell => cell));
      if (!headerRow) {
        setGroupUploadError('Empty file or no header found');
        return;
      }
      
      // Parse questions (skip header)
      const questions: Array<{ question: string; options: string[]; correctIndex: number }> = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !row[0]) continue;
        
        // Expected format: Question | Option A | Option B | Option C | Option D | Correct Answer (A/B/C/D or 1/2/3/4)
        const question = String(row[0] || '').trim();
        const optionA = String(row[1] || '').trim();
        const optionB = String(row[2] || '').trim();
        const optionC = String(row[3] || '').trim();
        const optionD = String(row[4] || '').trim();
        const correctAnswer = String(row[5] || '').trim().toUpperCase();
        
        if (!question || !optionA || !optionB || !optionC || !optionD) continue;
        
        let correctIndex = 0;
        if (correctAnswer === 'A' || correctAnswer === '1') correctIndex = 0;
        else if (correctAnswer === 'B' || correctAnswer === '2') correctIndex = 1;
        else if (correctAnswer === 'C' || correctAnswer === '3') correctIndex = 2;
        else if (correctAnswer === 'D' || correctAnswer === '4') correctIndex = 3;
        
        questions.push({
          question,
          options: [optionA, optionB, optionC, optionD],
          correctIndex
        });
      }
      
      if (questions.length === 0) {
        setGroupUploadError('No valid questions found. Format: Question | Option 1 | Option 2 | Option 3 | Option 4 | Correct (1/2/3/4)');
      } else {
        setGroupUploadParsedQuestions(questions);
      }
    } catch (err) {
      console.error('Excel parse error:', err);
      setGroupUploadError('Error parsing Excel file');
    } finally {
      setGroupUploadLoading(false);
    }
  };

  // Parse Word file - same as Group Study
  const parseWordFile = async (file: File) => {
    setGroupUploadLoading(true);
    setGroupUploadError('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      const questions: Array<{ question: string; options: string[]; correctIndex: number }> = [];
      
      // Split by question numbers
      const questionBlocks = text.split(/(?=\n\s*(?:\d+|[১২৩৪৫৬৭৮৯০]+)[\.\)]\s*)/g);
      
      for (const block of questionBlocks) {
        if (!block.trim()) continue;
        
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 5) continue;
        
        // First line is question (remove number prefix)
        const questionLine = lines[0].replace(/^(?:\d+|[১২৩৪৫৬৭৮৯০]+)[\.\)]\s*/, '').trim();
        if (!questionLine) continue;
        
        // Option patterns
        const optionPatterns = [
          /^[1১AaAক][\.\)\s]/,
          /^[2২BbBখ][\.\)\s]/,
          /^[3৩CcCগ][\.\)\s]/,
          /^[4৪DdDঘ][\.\)\s]/
        ];
        
        const options: string[] = ['', '', '', ''];
        let correctIndex = 0;
        
        for (const line of lines.slice(1)) {
          // Check for answer line
          const answerMatch = line.match(/(?:Ans|Answer|উত্তর|সঠিক উত্তর|Correct)[:\s]*([1234১২৩৪AaBbCcDd])/i);
          if (answerMatch) {
            const ans = answerMatch[1].toUpperCase();
            if (ans === '1' || ans === '১' || ans === 'A') correctIndex = 0;
            else if (ans === '2' || ans === '২' || ans === 'B') correctIndex = 1;
            else if (ans === '3' || ans === '৩' || ans === 'C') correctIndex = 2;
            else if (ans === '4' || ans === '৪' || ans === 'D') correctIndex = 3;
            continue;
          }
          
          // Check for * marked correct answer
          if (line.startsWith('*')) {
            const optLine = line.substring(1).trim();
            for (let i = 0; i < optionPatterns.length; i++) {
              if (optionPatterns[i].test(optLine)) {
                options[i] = optLine.replace(optionPatterns[i], '').trim();
                correctIndex = i;
                break;
              }
            }
            continue;
          }
          
          // Check which option this is
          for (let i = 0; i < optionPatterns.length; i++) {
            if (optionPatterns[i].test(line)) {
              options[i] = line.replace(optionPatterns[i], '').trim();
              break;
            }
          }
        }
        
        // Validate we have all options
        if (questionLine && options.every(o => o)) {
          questions.push({
            question: questionLine,
            options,
            correctIndex
          });
        }
      }
      
      if (questions.length === 0) {
        setGroupUploadError('No valid questions found. Check the format.');
      } else {
        setGroupUploadParsedQuestions(questions);
      }
    } catch (err) {
      console.error('Word parse error:', err);
      setGroupUploadError('Error parsing Word file');
    } finally {
      setGroupUploadLoading(false);
    }
  };

  // Parse JSON array
  const parseJsonQuestions = () => {
    if (!jsonText.trim()) {
      setJsonParseError('Please enter JSON data');
      return;
    }
    
    setJsonParseError('');
    try {
      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        setJsonParseError('JSON must be an array of questions');
        return;
      }
      
      const questions: Array<{ question: string; options: string[]; correctIndex: number }> = [];
      
      for (const item of parsed) {
        // Support multiple JSON formats
        const question = item.question || item.q || item.text || '';
        const options = item.options || item.opts || item.choices || [];
        let correctIndex = 0;
        
        if (typeof item.correctIndex === 'number') {
          correctIndex = item.correctIndex;
        } else if (typeof item.correct === 'number') {
          correctIndex = item.correct;
        } else if (typeof item.answer === 'number') {
          correctIndex = item.answer - 1; // 1-based to 0-based
        } else if (typeof item.ans === 'number') {
          correctIndex = item.ans - 1;
        } else if (typeof item.correct === 'string') {
          const c = item.correct.toUpperCase();
          if (c === 'A' || c === '1') correctIndex = 0;
          else if (c === 'B' || c === '2') correctIndex = 1;
          else if (c === 'C' || c === '3') correctIndex = 2;
          else if (c === 'D' || c === '4') correctIndex = 3;
        }
        
        if (question && options.length >= 4) {
          questions.push({
            question,
            options: options.slice(0, 4),
            correctIndex
          });
        }
      }
      
      if (questions.length === 0) {
        setJsonParseError('No valid questions found in JSON');
        return;
      }
      
      setJsonParsedQuestions(questions);
    } catch (err) {
      setJsonParseError('Invalid JSON format');
    }
  };

  // Handle file selection
  const handleGroupUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setGroupUploadFile(file);
    setGroupUploadParsedQuestions([]);
    setGroupUploadError('');
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      parseExcelFile(file);
    } else if (ext === 'docx') {
      parseWordFile(file);
    } else if (ext === 'json') {
      // Parse JSON file
      const reader = new FileReader();
      reader.onload = (e) => {
        setJsonText(e.target?.result as string || '');
        setJsonUploadMode('text');
      };
      reader.readAsText(file);
    } else {
      setGroupUploadError('Unsupported file type. Use .xlsx, .xls, .docx, or .json');
    }
  };

  // Save all parsed questions
  const handleGroupUploadSave = async () => {
    if (!groupUploadCategory || !user || groupUploadParsedQuestions.length === 0) return;
    
    setGroupUploadLoading(true);
    try {
      for (const q of groupUploadParsedQuestions) {
        const mcq: CourseMCQ = {
          id: uuidv4(),
          courseId: courseId || '',
          lessonId: '',
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          marks: 1,
          negativeMarks: 0,
          difficulty: 'medium',
          order: mcqs.length,
        };
        
        (mcq as any).categoryId = groupUploadCategory;
        (mcq as any).createdBy = user.id;
        (mcq as any).createdByName = user.displayName;
        (mcq as any).createdAt = Date.now();
        
        addMCQ(mcq);
        await setDoc(doc(db, 'coaching-mcqs', mcq.id), mcq);
      }
      
      alert(`✅ ${groupUploadParsedQuestions.length} questions uploaded successfully!`);
      setGroupUploadFile(null);
      setGroupUploadParsedQuestions([]);
      setGroupUploadCategory('');
    } catch (err) {
      console.error('Error saving questions:', err);
      setGroupUploadError('Error saving questions to database');
    } finally {
      setGroupUploadLoading(false);
    }
  };

  // Save JSON questions
  const handleJsonSave = async () => {
    if (!groupUploadCategory || !user || jsonParsedQuestions.length === 0) return;
    
    setGroupUploadLoading(true);
    try {
      for (const q of jsonParsedQuestions) {
        const mcq: CourseMCQ = {
          id: uuidv4(),
          courseId: courseId || '',
          lessonId: '',
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          marks: 1,
          negativeMarks: 0,
          difficulty: 'medium',
          order: mcqs.length,
        };
        
        (mcq as any).categoryId = groupUploadCategory;
        (mcq as any).createdBy = user.id;
        (mcq as any).createdByName = user.displayName;
        (mcq as any).createdAt = Date.now();
        
        addMCQ(mcq);
        await setDoc(doc(db, 'coaching-mcqs', mcq.id), mcq);
      }
      
      alert(`✅ ${jsonParsedQuestions.length} questions uploaded successfully!`);
      setJsonText('');
      setJsonParsedQuestions([]);
      setGroupUploadCategory('');
    } catch (err) {
      console.error('Error saving questions:', err);
    } finally {
      setGroupUploadLoading(false);
    }
  };

  // Handle Library Download
  const handleLibraryDownload = async () => {
    if (!librarySelectedPack || !user) return;
    
    // Get target category
    let targetCategoryId = '';
    
    if (libraryDownloadMode === 'new') {
      if (!libraryNewCategoryName.trim()) {
        alert('Please enter a category name');
        return;
      }
      // Create new category
      const newCat: QuestionCategory = {
        id: uuidv4(),
        name: libraryNewCategoryName.trim(),
        createdAt: Date.now(),
      };
      setCategories(prev => [...prev, newCat]);
      targetCategoryId = newCat.id;
      
      await setDoc(doc(db, 'coaching-categories', newCat.id), {
        ...newCat,
        courseId: courseId || 'global',
        userId: user.id,
      });
    } else {
      if (!libraryDownloadCategory) {
        alert('Please select a category');
        return;
      }
      targetCategoryId = libraryDownloadCategory;
    }
    
    // Get MCQs from the pack
    const packMcqs = getLibraryMcqsByPack(librarySelectedPack.id);
    
    // Add MCQs to coaching store
    for (const libMcq of packMcqs) {
      const mcq: CourseMCQ = {
        id: uuidv4(),
        courseId: courseId || '',
        lessonId: '',
        question: libMcq.question,
        options: libMcq.options,
        correctIndex: libMcq.correctIndex,
        explanation: libMcq.explanation,
        marks: 1,
        negativeMarks: 0,
        difficulty: 'medium',
        order: mcqs.length,
      };
      
      (mcq as any).categoryId = targetCategoryId;
      (mcq as any).createdBy = user.id;
      (mcq as any).createdByName = user.displayName;
      (mcq as any).createdAt = Date.now();
      (mcq as any).sourcePackId = librarySelectedPack.id;
      
      addMCQ(mcq);
      await setDoc(doc(db, 'coaching-mcqs', mcq.id), mcq);
    }
    
    // Record download
    addLibraryDownload({
      id: uuidv4(),
      userId: user.id,
      packId: librarySelectedPack.id,
      packTitle: librarySelectedPack.title,
      subjectId: librarySelectedPack.subjectId,
      topicId: librarySelectedPack.topicId,
      pricing: librarySelectedPack.pricing,
      pricePaid: librarySelectedPack.pricing === 'paid' ? librarySelectedPack.price : 0,
      downloadedAt: Date.now(),
    });
    
    alert(`✅ ${packMcqs.length} questions downloaded to your Question Bank!`);
    setLibrarySelectedPack(null);
    setLibraryNewCategoryName('');
    setLibraryDownloadCategory('');
  };

  // Edit question handlers
  const handleEditQuestion = (mcq: CourseMCQ) => {
    setEditingQuestion(mcq);
    setEditQuestion(mcq.question);
    setEditOptions([...mcq.options]);
    setEditCorrectIndex(mcq.correctIndex);
    setEditCategory((mcq as any).categoryId || '');
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion || !editQuestion.trim() || editOptions.some(o => !o.trim())) {
      return;
    }
    
    const updated: CourseMCQ = {
      ...editingQuestion,
      question: editQuestion.trim(),
      options: editOptions.map(o => o.trim()),
      correctIndex: editCorrectIndex,
    };
    (updated as any).categoryId = editCategory;
    
    updateMCQ(updated);
    
    try {
      await setDoc(doc(db, 'coaching-mcqs', updated.id), updated);
    } catch (err) {
      console.error('Error updating MCQ:', err);
    }
    
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    removeMCQ(id);
  };

  return (
    <div className="space-y-4">
      {/* Add Category */}
      <div className="flex gap-2">
        <Input
          placeholder="New category name..."
          value={newCategoryName}
          onChange={e => setNewCategoryName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
          className="flex-1"
        />
        <Button onClick={handleAddCategory} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* Tab Buttons - Same as Group Study */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setQuestionBankTab('single')}
          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            questionBankTab === 'single'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ✏️ Single
        </button>
        <button
          onClick={() => setQuestionBankTab('group')}
          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            questionBankTab === 'group'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📋 Group
        </button>
        <button
          onClick={() => setQuestionBankTab('instant')}
          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            questionBankTab === 'instant'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ⚡ Instant
        </button>
      </div>

      {/* Single Upload Tab */}
      {questionBankTab === 'single' && categories.length > 0 && (
        <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
          <p className="text-sm font-medium">Add Single Question (MCQ)</p>
          <Textarea
            placeholder="Enter your question here..."
            value={qbQuestion}
            onChange={e => setQbQuestion(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="qbCorrect"
                  checked={qbCorrect === i}
                  onChange={() => setQbCorrect(i)}
                  className="w-3.5 h-3.5"
                />
                <span className={`font-medium text-sm w-5 ${qbCorrect === i ? 'text-green-600' : ''}`}>
                  {i + 1}.
                </span>
                <Input
                  placeholder={`Option ${i + 1}`}
                  value={qbOptions[i]}
                  onChange={e => {
                    const newOpts = [...qbOptions];
                    newOpts[i] = e.target.value;
                    setQbOptions(newOpts);
                  }}
                  className="flex-1 h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={qbCategoryId} onValueChange={setQbCategoryId}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddQuestion} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Question
            </Button>
          </div>
        </div>
      )}

      {questionBankTab === 'single' && categories.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center py-4">
          ⚠️ Add a category first before adding questions
        </p>
      )}

      {/* Group Upload Tab - Excel/Word/JSON */}
      {questionBankTab === 'group' && (
        <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">📋 Bulk Upload Questions</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload Excel (.xlsx), Word (.docx), or JSON file
            </p>
          </div>

          {/* Format Info */}
          <div className="text-xs bg-white dark:bg-gray-900 p-3 rounded border space-y-2">
            <p className="font-medium">📄 Excel Format (6 columns):</p>
            <p className="text-muted-foreground pl-2">Question | Option 1 | Option 2 | Option 3 | Option 4 | Correct (1/2/3/4)</p>
            
            <p className="font-medium mt-2">📝 Word Format:</p>
            <div className="text-muted-foreground pl-2 whitespace-pre-line">
{`1. Question text here
1) Option 1
2) Option 2
3) Option 3
4) Option 4
Ans: 1`}
            </div>

            <p className="font-medium mt-2">📦 JSON Array Format:</p>
            <div className="text-muted-foreground pl-2 text-[10px] font-mono">
{`[{"question": "Q1", "options": ["A","B","C","D"], "correctIndex": 0}]`}
            </div>
          </div>

          {/* Upload Mode Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded">
            <button
              onClick={() => setJsonUploadMode('file')}
              className={`flex-1 px-2 py-1 rounded text-xs ${jsonUploadMode === 'file' ? 'bg-background shadow' : ''}`}
            >
              <FileSpreadsheet className="h-3 w-3 inline mr-1" />
              File Upload
            </button>
            <button
              onClick={() => setJsonUploadMode('text')}
              className={`flex-1 px-2 py-1 rounded text-xs ${jsonUploadMode === 'text' ? 'bg-background shadow' : ''}`}
            >
              <FileText className="h-3 w-3 inline mr-1" />
              JSON Text
            </button>
          </div>

          {/* File Upload */}
          {jsonUploadMode === 'file' && (
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept=".xlsx,.xls,.docx,.json"
                onChange={handleGroupUploadFile}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              />
              {groupUploadFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {groupUploadFile.name}
                </p>
              )}
            </div>
          )}

          {/* JSON Text Input */}
          {jsonUploadMode === 'text' && (
            <div className="space-y-2">
              <Textarea
                placeholder='Paste JSON array here... e.g., [{"question": "...", "options": [...], "correctIndex": 0}]'
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                rows={4}
                className="text-xs font-mono"
              />
              <Button onClick={parseJsonQuestions} size="sm" variant="outline" className="w-full">
                <RefreshCw className="h-3 w-3 mr-1" /> Parse JSON
              </Button>
              {jsonParseError && (
                <p className="text-xs text-red-500">❌ {jsonParseError}</p>
              )}
            </div>
          )}

          {/* Loading */}
          {groupUploadLoading && (
            <div className="text-center py-4">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto text-blue-500" />
              <p className="text-xs text-muted-foreground mt-2">Processing...</p>
            </div>
          )}

          {/* Error */}
          {groupUploadError && (
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs">
              ❌ {groupUploadError}
            </div>
          )}

          {/* Parsed Questions Preview (Excel/Word) */}
          {groupUploadParsedQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✅ {groupUploadParsedQuestions.length} questions parsed
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGroupUploadFile(null);
                    setGroupUploadParsedQuestions([]);
                  }}
                  className="h-6 text-xs"
                >
                  Clear
                </Button>
              </div>

              {/* Preview */}
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2 bg-white dark:bg-gray-900">
                {groupUploadParsedQuestions.slice(0, 5).map((q, idx) => (
                  <div key={idx} className="text-xs border-b pb-2 last:border-0">
                    <p className="font-medium truncate">{idx + 1}. {q.question}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {q.options.map((opt, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded ${i === q.correctIndex ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {i + 1}. {opt.slice(0, 15)}{opt.length > 15 ? '...' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {groupUploadParsedQuestions.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{groupUploadParsedQuestions.length - 5} more questions...
                  </p>
                )}
              </div>

              {/* Category & Save */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={groupUploadCategory} onValueChange={setGroupUploadCategory}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGroupUploadSave}
                  disabled={!groupUploadCategory || groupUploadLoading}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Save All ({groupUploadParsedQuestions.length})
                </Button>
              </div>
            </div>
          )}

          {/* JSON Parsed Questions Preview */}
          {jsonParsedQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✅ {jsonParsedQuestions.length} questions parsed from JSON
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setJsonText('');
                    setJsonParsedQuestions([]);
                  }}
                  className="h-6 text-xs"
                >
                  Clear
                </Button>
              </div>

              {/* Preview */}
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2 bg-white dark:bg-gray-900">
                {jsonParsedQuestions.slice(0, 5).map((q, idx) => (
                  <div key={idx} className="text-xs border-b pb-2 last:border-0">
                    <p className="font-medium truncate">{idx + 1}. {q.question}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {q.options.map((opt, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded ${i === q.correctIndex ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {i + 1}. {opt.slice(0, 15)}{opt.length > 15 ? '...' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {jsonParsedQuestions.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{jsonParsedQuestions.length - 5} more questions...
                  </p>
                )}
              </div>

              {/* Category & Save */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={groupUploadCategory} onValueChange={setGroupUploadCategory}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleJsonSave}
                  disabled={!groupUploadCategory || groupUploadLoading}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Save All ({jsonParsedQuestions.length})
                </Button>
              </div>
            </div>
          )}

          {categories.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              ⚠️ Add a category first before uploading
            </p>
          )}
        </div>
      )}

      {/* Instant Download Tab - Content Library */}
      {questionBankTab === 'instant' && (
        <div className="space-y-4">
          {/* Library Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Content Library</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {libraryPacks.length} packs available
            </span>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-2">
            {/* Subject Filter */}
            <select
              className="text-xs px-2 py-1.5 border rounded bg-background"
              value={librarySubjectId || ''}
              onChange={(e) => {
                setLibrarySubject(e.target.value || null);
                setLibraryTopic(null);
              }}
            >
              <option value="">All Subjects</option>
              {librarySubjects.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>

            {/* Topic Filter */}
            <select
              className="text-xs px-2 py-1.5 border rounded bg-background"
              value={libraryTopicId || ''}
              onChange={(e) => setLibraryTopic(e.target.value || null)}
              disabled={!librarySubjectId}
            >
              <option value="">All Topics</option>
              {librarySubjectId && getLibraryTopicsBySubject(librarySubjectId).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {/* Price Filter */}
            <select
              className="text-xs px-2 py-1.5 border rounded bg-background"
              value={libraryFilterPricing}
              onChange={(e) => setLibraryFilterPricing(e.target.value as 'all' | 'free' | 'paid')}
            >
              <option value="all">All</option>
              <option value="free">🆓 Free Only</option>
              <option value="paid">💎 Paid Only</option>
            </select>
          </div>

          {/* Content Packs Grid */}
          <div className="grid gap-2 max-h-[350px] overflow-y-auto">
            {(() => {
              let filteredPacks = libraryPacks;

              if (librarySubjectId) {
                filteredPacks = getLibraryPacksBySubject(librarySubjectId);
              }

              if (libraryTopicId) {
                filteredPacks = getLibraryPacksByTopic(libraryTopicId);
              }

              if (libraryFilterPricing !== 'all') {
                filteredPacks = filteredPacks.filter(p => p.pricing === libraryFilterPricing);
              }

              if (filteredPacks.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No content packs found</p>
                    <p className="text-xs mt-1">Try changing your filters</p>
                  </div>
                );
              }

              return filteredPacks.map(pack => {
                const subject = librarySubjects.find(s => s.id === pack.subjectId);
                const topic = libraryTopics.find(t => t.id === pack.topicId);
                const downloaded = user ? hasLibraryDownloaded(pack.id, user.id) : false;

                return (
                  <div
                    key={pack.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      librarySelectedPack?.id === pack.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    } ${downloaded ? 'opacity-60' : ''}`}
                    onClick={() => setLibrarySelectedPack(pack)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📝</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pack.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {subject?.icon} {subject?.name} • {topic?.name}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {pack.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px]">
                          {pack.mcqCount > 0 && (
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                              {pack.mcqCount} MCQs
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            ⬇️ {pack.downloadCount}
                          </span>
                          {downloaded && (
                            <span className="text-green-600 font-medium">✓ Downloaded</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {pack.pricing === 'free' ? (
                          <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                            FREE
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                            ₹{pack.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Download Section */}
          {librarySelectedPack && (
            <div className="p-4 border-2 border-primary rounded-lg bg-primary/5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{librarySelectedPack.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {librarySelectedPack.mcqCount} MCQs
                  </p>
                </div>
                <button
                  onClick={() => setLibrarySelectedPack(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Preview */}
              <div className="bg-background rounded-md p-2 max-h-[120px] overflow-y-auto">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Preview:</p>
                <div className="space-y-1">
                  {getLibraryMcqsByPack(librarySelectedPack.id).slice(0, 3).map((mcq, idx) => (
                    <p key={mcq.id} className="text-xs truncate">
                      {idx + 1}. {mcq.question}
                    </p>
                  ))}
                  {librarySelectedPack.mcqCount > 3 && (
                    <p className="text-[10px] text-muted-foreground italic">
                      +{librarySelectedPack.mcqCount - 3} more questions...
                    </p>
                  )}
                </div>
              </div>

              {/* Download Options */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium flex-1">Download to:</label>
                  <select
                    className="text-xs px-2 py-1.5 border rounded bg-background flex-1"
                    value={libraryDownloadMode}
                    onChange={(e) => setLibraryDownloadMode(e.target.value as 'new' | 'merge')}
                  >
                    <option value="new">New Category</option>
                    <option value="merge">Existing Category</option>
                  </select>
                </div>

                {libraryDownloadMode === 'new' ? (
                  <Input
                    placeholder="New category name..."
                    value={libraryNewCategoryName}
                    onChange={(e) => setLibraryNewCategoryName(e.target.value)}
                    className="h-8 text-sm"
                  />
                ) : (
                  <select
                    className="w-full text-xs px-2 py-1.5 border rounded bg-background"
                    value={libraryDownloadCategory}
                    onChange={(e) => setLibraryDownloadCategory(e.target.value)}
                  >
                    <option value="">Select category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Download Button */}
              <Button
                className="w-full"
                onClick={handleLibraryDownload}
                disabled={libraryDownloadMode === 'new' ? !libraryNewCategoryName : !libraryDownloadCategory}
              >
                <Download className="h-4 w-4 mr-2" />
                Download {librarySelectedPack.mcqCount} MCQs
              </Button>
            </div>
          )}
        </div>
      )}

      {/* View All Questions - Category-wise */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            All Questions ({mcqs.length})
          </h4>
        </div>

        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No categories yet. Add a category to start adding questions.
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map(category => {
              const categoryQuestions = getQuestionsByCategory(category.id);
              const isExpanded = expandedCategories.includes(category.id);

              return (
                <div key={category.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium text-sm">{category.name}</span>
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {categoryQuestions.length}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategories(prev => prev.filter(c => c.id !== category.id));
                      }}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                          {categoryQuestions.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              No questions in this category
                            </p>
                          ) : (
                            categoryQuestions.map((q, idx) => (
                              <div key={q.id} className="p-2 bg-background rounded border text-xs">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="font-medium">{idx + 1}. {q.question}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {q.options.map((opt, i) => (
                                        <span
                                          key={i}
                                          className={`px-1.5 py-0.5 rounded ${
                                            i === q.correctIndex
                                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                          }`}
                                        >
                                          {i + 1}. {opt.slice(0, 20)}{opt.length > 20 ? '...' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditQuestion(q)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteQuestion(q.id)}
                                      className="h-6 w-6 p-0 text-red-500"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setEditingQuestion(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background rounded-lg p-4 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Question
              </h3>

              <div className="space-y-3">
                <Textarea
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  rows={2}
                  className="text-sm"
                  placeholder="Question"
                />

                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={editCorrectIndex === i}
                        onChange={() => setEditCorrectIndex(i)}
                        className="w-3 h-3"
                      />
                      <Input
                        value={editOptions[i]}
                        onChange={(e) => {
                          const newOpts = [...editOptions];
                          newOpts[i] = e.target.value;
                          setEditOptions(newOpts);
                        }}
                        className="h-8 text-xs"
                        placeholder={`Option ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>

                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingQuestion(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
