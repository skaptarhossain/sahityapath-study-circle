import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Trophy, Clock, Target, Play, CheckCircle, XCircle, ChevronRight, Zap, Award, Timer } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const sampleQuizzes = [
  { id: '1', title: 'HSC Physics - Wave Mechanics', questions: 25, duration: 30, difficulty: 'Medium', category: 'Physics', bestScore: 85, attempts: 3 },
  { id: '2', title: 'HSC Chemistry - Organic Compounds', questions: 30, duration: 45, difficulty: 'Hard', category: 'Chemistry', bestScore: 72, attempts: 2 },
  { id: '3', title: 'HSC English - Grammar', questions: 20, duration: 20, difficulty: 'Easy', category: 'English', bestScore: 95, attempts: 5 },
  { id: '4', title: 'HSC Math - Calculus', questions: 15, duration: 40, difficulty: 'Hard', category: 'Math', bestScore: null, attempts: 0 },
]

const sampleQuestions = [
  { id: '1', question: 'What is the SI unit of frequency?', options: ['Meter', 'Second', 'Hertz', 'Watt'], correctAnswer: 2 },
  { id: '2', question: 'What is the speed of light in a vacuum?', options: ['3×10⁶ m/s', '3×10⁸ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s'], correctAnswer: 1 },
  { id: '3', question: 'Sound waves are:', options: ['Transverse', 'Longitudinal', 'Electromagnetic', 'None of the above'], correctAnswer: 1 },
]

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

export function QuizDashboard() {
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [answered, setAnswered] = useState(false)

  const handleStartQuiz = (quizId: string) => { setActiveQuiz(quizId); setCurrentQuestion(0); setScore(0); setShowResult(false); setSelectedAnswer(null); setAnswered(false) }
  const handleAnswer = (index: number) => { if (answered) return; setSelectedAnswer(index); setAnswered(true); if (index === sampleQuestions[currentQuestion].correctAnswer) setScore(s => s + 1) }
  const handleNext = () => { if (currentQuestion < sampleQuestions.length - 1) { setCurrentQuestion(c => c + 1); setSelectedAnswer(null); setAnswered(false) } else { setShowResult(true) } }
  const handleBackToList = () => { setActiveQuiz(null); setShowResult(false) }

  if (activeQuiz && !showResult) {
    const question = sampleQuestions[currentQuestion]
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBackToList}>← Back</Button>
          <div className="flex items-center gap-4"><Timer className="h-5 w-5 text-orange-500" /><span className="font-mono text-lg">29:45</span></div>
        </div>
        <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Question {currentQuestion + 1} of {sampleQuestions.length}</span><Progress value={((currentQuestion + 1) / sampleQuestions.length) * 100} className="flex-1 h-2" /></div>
        <Card>
          <CardHeader><CardTitle className="text-xl">{question.question}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => (
              <motion.button key={index} whileHover={{ scale: answered ? 1 : 1.01 }} whileTap={{ scale: answered ? 1 : 0.99 }} onClick={() => handleAnswer(index)}
                className={cn('w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3', !answered && 'hover:border-primary/50 hover:bg-primary/5', answered && index === question.correctAnswer && 'border-green-500 bg-green-500/10', answered && index === selectedAnswer && index !== question.correctAnswer && 'border-red-500 bg-red-500/10', !answered && selectedAnswer === index && 'border-primary bg-primary/10')}>
                <div className={cn('h-8 w-8 rounded-full flex items-center justify-center font-medium', answered && index === question.correctAnswer ? 'bg-green-500 text-white' : answered && index === selectedAnswer ? 'bg-red-500 text-white' : 'bg-muted')}>
                  {answered && index === question.correctAnswer ? <CheckCircle className="h-4 w-4" /> : answered && index === selectedAnswer && index !== question.correctAnswer ? <XCircle className="h-4 w-4" /> : String.fromCharCode(65 + index)}
                </div>
                <span>{option}</span>
              </motion.button>
            ))}
          </CardContent>
        </Card>
        {answered && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end"><Button onClick={handleNext} size="lg">{currentQuestion < sampleQuestions.length - 1 ? 'Next Question' : 'View Results'}<ChevronRight className="h-4 w-4 ml-2" /></Button></motion.div>)}
      </motion.div>
    )
  }

  if (showResult) {
    const percentage = Math.round((score / sampleQuestions.length) * 100)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
        <Card className="text-center">
          <CardHeader><div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4"><Trophy className={cn('h-12 w-12', percentage >= 80 ? 'text-yellow-500' : percentage >= 60 ? 'text-blue-500' : 'text-muted-foreground')} /></div><CardTitle className="text-2xl">Quiz Complete!</CardTitle><CardDescription>Your Results</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="text-5xl font-bold text-primary">{percentage}%</div>
            <div className="flex justify-center gap-8"><div className="text-center"><p className="text-2xl font-bold text-green-500">{score}</p><p className="text-sm text-muted-foreground">Correct</p></div><div className="text-center"><p className="text-2xl font-bold text-red-500">{sampleQuestions.length - score}</p><p className="text-sm text-muted-foreground">Incorrect</p></div></div>
            <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={handleBackToList}>Back to Quizzes</Button><Button className="flex-1" onClick={() => handleStartQuiz(activeQuiz!)}>Try Again</Button></div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Brain className="h-8 w-8" />Quiz Center</h1>
        <p className="text-muted-foreground mt-1">Test your knowledge</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Target className="h-5 w-5" /></div><div><p className="text-2xl font-bold">10</p><p className="text-xs text-muted-foreground">Quizzes Taken</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10 text-green-500"><Zap className="h-5 w-5" /></div><div><p className="text-2xl font-bold">84%</p><p className="text-xs text-muted-foreground">Avg. Score</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><Clock className="h-5 w-5" /></div><div><p className="text-2xl font-bold">5.2h</p><p className="text-xs text-muted-foreground">Quiz Time</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-orange-500/10 text-orange-500"><Award className="h-5 w-5" /></div><div><p className="text-2xl font-bold">3</p><p className="text-xs text-muted-foreground">Achievements</p></div></div></CardContent></Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold mb-4">Available Quizzes</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {sampleQuizzes.map((quiz) => (
            <motion.div key={quiz.id} variants={itemVariants}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1"><h4 className="font-medium">{quiz.title}</h4><p className="text-sm text-muted-foreground mt-1">{quiz.category}</p></div>
                    <span className={cn('px-2 py-1 rounded text-xs font-medium', quiz.difficulty === 'Easy' && 'bg-green-500/10 text-green-500', quiz.difficulty === 'Medium' && 'bg-yellow-500/10 text-yellow-500', quiz.difficulty === 'Hard' && 'bg-red-500/10 text-red-500')}>{quiz.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground"><span>{quiz.questions} questions</span><span>{quiz.duration} min</span>{quiz.attempts > 0 && <span>Attempted {quiz.attempts} times</span>}</div>
                  {quiz.bestScore && (<div className="mt-2 flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /><span className="text-sm">Best: {quiz.bestScore}%</span></div>)}
                  <div className="flex gap-2 mt-4"><Button className="flex-1" onClick={() => handleStartQuiz(quiz.id)}><Play className="h-4 w-4 mr-2" />{quiz.attempts > 0 ? 'Retake' : 'Start'}</Button>{quiz.attempts > 0 && <Button variant="outline">View Results</Button>}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
