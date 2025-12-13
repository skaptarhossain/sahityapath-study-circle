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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCoachingStore } from '@/stores/coaching-store';
import { useAuthStore } from '@/stores/auth-store';
import type { CourseMCQ } from '@/types';

// Local Category type for organizing questions
interface QuestionCategory {
  id: string;
  name: string;
  color: string;
  questionCount: number;
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
  
  // UI States
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'view'>('single');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Local Categories (stored in component state for now - can be moved to store later)
  const [categories, setCategories] = useState<QuestionCategory[]>([
    { id: 'general', name: 'General', color: 'blue', questionCount: 0 },
    { id: 'math', name: 'Mathematics', color: 'green', questionCount: 0 },
    { id: 'science', name: 'Science', color: 'purple', questionCount: 0 },
  ]);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Single Question Form States
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [newExplanation, setNewExplanation] = useState('');
  
  // Editing States
  const [editingQuestion, setEditingQuestion] = useState<CourseMCQ | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editOptions, setEditOptions] = useState(['', '', '', '']);
  const [editCorrectIndex, setEditCorrectIndex] = useState(0);
  const [editCategory, setEditCategory] = useState('');
  
  // Bulk Upload States
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('general');
  const [parsedQuestions, setParsedQuestions] = useState<{ question: string; options: string[]; correctIndex: number }[]>([]);
  const [parseError, setParseError] = useState('');

  // Get all MCQs (filter by course if needed)
  const allQuestions = useMemo(() => {
    return mcqs;
  }, [mcqs]);
  
  // Filter questions
  const filteredQuestions = useMemo(() => {
    let result = allQuestions;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(q => 
        q.question.toLowerCase().includes(query) ||
        q.options.some(o => o.toLowerCase().includes(query))
      );
    }
    
    // Filter by category (using a custom field if exists)
    if (filterCategory !== 'all') {
      result = result.filter(q => (q as any).categoryId === filterCategory);
    }
    
    return result;
  }, [allQuestions, searchQuery, filterCategory]);
  
  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    allQuestions.forEach(q => {
      const catId = (q as any).categoryId || 'general';
      stats[catId] = (stats[catId] || 0) + 1;
    });
    return stats;
  }, [allQuestions]);
  
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'red', 'yellow'];
    const newCategory: QuestionCategory = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      color: colors[categories.length % colors.length],
      questionCount: 0,
    };
    
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
  };
  
  const handleAddQuestion = () => {
    if (!newQuestion.trim() || newOptions.some(o => !o.trim())) {
      alert('Please fill in question and all options');
      return;
    }
    
    const mcq: CourseMCQ = {
      id: `mcq-${Date.now()}`,
      courseId: courseId || '',
      lessonId: courseId || '',
      question: newQuestion.trim(),
      options: newOptions.map(o => o.trim()),
      correctIndex,
      explanation: newExplanation.trim() || undefined,
      marks: 1,
      negativeMarks: 0,
      difficulty: 'medium',
      order: allQuestions.length,
    };
    
    // Add category as custom field
    (mcq as any).categoryId = selectedCategory;
    
    addMCQ(mcq);
    
    // Reset form
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setCorrectIndex(0);
    setNewExplanation('');
  };
  
  const handleEditQuestion = (mcq: CourseMCQ) => {
    setEditingQuestion(mcq);
    setEditQuestion(mcq.question);
    setEditOptions([...mcq.options]);
    setEditCorrectIndex(mcq.correctIndex);
    setEditCategory((mcq as any).categoryId || 'general');
  };
  
  const handleSaveEdit = () => {
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
    setEditingQuestion(null);
  };
  
  const parseBulkQuestions = () => {
    if (!bulkText.trim()) {
      setParseError('Please enter questions to parse');
      return;
    }
    
    setParseError('');
    const questions: { question: string; options: string[]; correctIndex: number }[] = [];
    
    // Parse format:
    // 1. Question text
    // 1) Option 1
    // 2) Option 2
    // 3) Option 3
    // 4) Option 4
    // Ans: 1
    
    const blocks = bulkText.split(/\n\s*\n/).filter(b => b.trim());
    
    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      
      if (lines.length < 6) continue;
      
      // Find question (starts with number and dot or just the first line)
      let questionLine = lines[0].replace(/^\d+\.\s*/, '');
      
      // Find options
      const options: string[] = [];
      let correctIndex = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for option patterns: 1) or a) or (1) or (a)
        const optionMatch = line.match(/^[1-4a-d][\)\.]|^\([1-4a-d]\)\s*/i);
        if (optionMatch && options.length < 4) {
          options.push(line.replace(/^[1-4a-d][\)\.]|^\([1-4a-d]\)\s*/i, '').trim());
        }
        
        // Check for answer line
        const ansMatch = line.match(/^ans[:\.]?\s*(\d)/i);
        if (ansMatch) {
          correctIndex = parseInt(ansMatch[1]) - 1;
        }
      }
      
      if (questionLine && options.length === 4) {
        questions.push({ question: questionLine, options, correctIndex });
      }
    }
    
    if (questions.length === 0) {
      setParseError('Could not parse any questions. Please check the format.');
      return;
    }
    
    setParsedQuestions(questions);
  };
  
  const handleBulkSave = () => {
    if (parsedQuestions.length === 0) return;
    
    const mcqs: CourseMCQ[] = parsedQuestions.map((q, idx) => ({
      id: `mcq-${Date.now()}-${idx}`,
      courseId: courseId || '',
      lessonId: courseId || '',
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      marks: 1,
      negativeMarks: 0,
      difficulty: 'medium' as const,
      order: allQuestions.length + idx,
      categoryId: bulkCategory,
    }));
    
    bulkAddMCQs(mcqs);
    
    // Reset
    setBulkText('');
    setParsedQuestions([]);
    setActiveTab('view');
  };
  
  const getCategoryColor = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return 'gray';
    
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    };
    
    return colorMap[cat.color] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <span className="font-medium">{allQuestions.length} Questions</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {categories.length} categories
        </span>
      </div>
      
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
          <FolderPlus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      
      {/* Categories List */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <div 
            key={cat.id} 
            className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(cat.id)}`}
          >
            {cat.name} ({categoryStats[cat.id] || 0})
          </div>
        ))}
      </div>
      
      {/* Tab Buttons */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'single'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ✏️ Single
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'bulk'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📋 Bulk
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'view'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          👁️ View All
        </button>
      </div>
      
      {/* Single Question Tab */}
      {activeTab === 'single' && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <p className="text-sm font-medium">Add Single Question (MCQ)</p>
          
          <Textarea 
            placeholder="Enter your question here..." 
            value={newQuestion} 
            onChange={e => setNewQuestion(e.target.value)} 
            rows={3} 
          />
          
          <div className="space-y-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <button 
                  onClick={() => setCorrectIndex(i)} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    correctIndex === i 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </button>
                <Input 
                  placeholder={`Option ${String.fromCharCode(65 + i)}`} 
                  value={newOptions[i]} 
                  onChange={e => {
                    const newOpts = [...newOptions];
                    newOpts[i] = e.target.value;
                    setNewOptions(newOpts);
                  }}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Click the letter to mark correct answer (green = correct)
          </p>
          
          <Textarea 
            placeholder="Explanation (optional)..." 
            value={newExplanation} 
            onChange={e => setNewExplanation(e.target.value)} 
            rows={2}
          />
          
          <div className="flex items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={handleAddQuestion} className="flex-1">
              <Plus className="h-4 w-4 mr-2" /> Add Question
            </Button>
          </div>
        </div>
      )}
      
      {/* Bulk Upload Tab */}
      {activeTab === 'bulk' && (
        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">📋 Bulk Upload Questions</p>
            <p className="text-xs text-muted-foreground mt-1">
              Paste multiple questions in the format below
            </p>
          </div>
          
          {/* Format Info */}
          <div className="text-xs bg-white dark:bg-gray-900 p-3 rounded border space-y-2">
            <p className="font-medium">Format:</p>
            <pre className="text-muted-foreground whitespace-pre-line">
{`1. Question text here
1) Option 1
2) Option 2
3) Option 3
4) Option 4
Ans: 1

2. Another question
1) Option A
2) Option B
3) Option C
4) Option D
Ans: 3`}
            </pre>
          </div>
          
          <Textarea 
            placeholder="Paste your questions here..."
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          
          <Button onClick={parseBulkQuestions} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" /> Parse Questions
          </Button>
          
          {parseError && (
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs">
              ❌ {parseError}
            </div>
          )}
          
          {/* Parsed Preview */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✅ {parsedQuestions.length} questions parsed
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setParsedQuestions([])}
                  className="h-6 text-xs"
                >
                  Clear
                </Button>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2 bg-white dark:bg-gray-900">
                {parsedQuestions.slice(0, 5).map((q, idx) => (
                  <div key={idx} className="text-xs border-b pb-2 last:border-0">
                    <p className="font-medium truncate">{idx + 1}. {q.question}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {q.options.map((opt, i) => (
                        <span 
                          key={i} 
                          className={`px-1.5 py-0.5 rounded ${i === q.correctIndex ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {String.fromCharCode(65 + i)}. {opt.slice(0, 15)}{opt.length > 15 ? '...' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {parsedQuestions.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{parsedQuestions.length - 5} more questions...
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={bulkCategory} onValueChange={setBulkCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button onClick={handleBulkSave} className="flex-1 bg-green-500 hover:bg-green-600">
                  <Upload className="h-4 w-4 mr-2" /> Save All ({parsedQuestions.length})
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* View All Tab */}
      {activeTab === 'view' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search questions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Questions List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No questions found</p>
                <p className="text-xs mt-1">Add questions using Single or Bulk upload</p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div key={q.id} className="p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor((q as any).categoryId || 'general')}`}>
                          {categories.find(c => c.id === (q as any).categoryId)?.name || 'General'}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{q.question}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {q.options.map((opt, i) => (
                          <span 
                            key={i} 
                            className={`px-2 py-1 rounded text-xs ${
                              i === q.correctIndex 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditQuestion(q)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => removeMCQ(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Showing {filteredQuestions.length} of {allQuestions.length} questions
          </p>
        </div>
      )}
      
      {/* Edit Question Modal */}
      <AnimatePresence>
        {editingQuestion && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setEditingQuestion(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className="bg-background rounded-xl w-full max-w-lg p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Edit Question</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditingQuestion(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Textarea 
                placeholder="Question..."
                value={editQuestion}
                onChange={e => setEditQuestion(e.target.value)}
                rows={3}
              />
              
              <div className="space-y-2">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditCorrectIndex(i)} 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        editCorrectIndex === i 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                    <Input 
                      placeholder={`Option ${String.fromCharCode(65 + i)}`} 
                      value={editOptions[i]} 
                      onChange={e => {
                        const newOpts = [...editOptions];
                        newOpts[i] = e.target.value;
                        setEditOptions(newOpts);
                      }}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
              
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingQuestion(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
