import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Trophy, ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react'
import type { MCQ } from '@/stores/personal-store'
import { usePersonalStore } from '@/stores/personal-store'

type TestRunnerProps = {
  questions: MCQ[]
  timePerQuestion?: number // seconds per question, default 30
  testTitle: string
  onFinish: (result: TestResult) => void
  onBack: () => void
}

export type TestResult = {
  total: number
  correct: number
  wrong: number
  skipped: number
  unanswered: number
  percentage: number
  timeTaken: number // seconds
  answers: { questionId: string; selected: number | null; correct: number }[]
}

export function TestRunner({ questions, timePerQuestion = 30, testTitle, onFinish, onBack }: TestRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null))
  const [timeLeft, setTimeLeft] = useState(questions.length * timePerQuestion)
  const [startTime] = useState(Date.now())
  const [isFinished, setIsFinished] = useState(false)
  const [showReview, setShowReview] = useState(false)

  const currentQuestion = questions[currentIndex]

  // Timer
  useEffect(() => {
    if (isFinished) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isFinished])

  const handleSelectOption = (optionIndex: number) => {
    if (isFinished) return
    const newAnswers = [...answers]
    newAnswers[currentIndex] = optionIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSubmit = useCallback(() => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    let correct = 0
    let wrong = 0
    let unanswered = 0

    const answerDetails = questions.map((q, i) => {
      const selected = answers[i]
      if (selected === null) {
        unanswered++
      } else if (selected === q.correctIndex) {
        correct++
      } else {
        wrong++
      }
      return { questionId: q.id, selected, correct: q.correctIndex }
    })

    const result: TestResult = {
      total: questions.length,
      correct,
      wrong,
      skipped: unanswered,
      unanswered,
      percentage: Math.round((correct / questions.length) * 100),
      timeTaken,
      answers: answerDetails
    }

    setIsFinished(true)
    onFinish(result)
  }, [answers, questions, startTime, onFinish])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Results screen
  if (isFinished && !showReview) {
    const correct = answers.filter((a, i) => a === questions[i].correctIndex).length
    const wrong = answers.filter((a, i) => a !== null && a !== questions[i].correctIndex).length
    const unanswered = answers.filter(a => a === null).length
    const percentage = Math.round((correct / questions.length) * 100)
    
    // Get last 10 test results for graph
    const testResults = usePersonalStore.getState().testResults
    const last10Results = testResults.slice(-10)

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Trophy className={cn("h-16 w-16", percentage >= 70 ? "text-yellow-500" : percentage >= 40 ? "text-blue-500" : "text-muted-foreground")} />
            </div>
            <CardTitle className="text-2xl">Test Complete!</CardTitle>
            <CardDescription>{testTitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{percentage}%</div>
              <p className="text-muted-foreground mt-2">Your Score</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-500">{correct}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="p-4 bg-red-500/10 rounded-lg">
                <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-500">{wrong}</p>
                <p className="text-sm text-muted-foreground">Wrong</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold">{unanswered}</p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
            </div>

            {/* Progress Analytics Graph */}
            {last10Results.length > 1 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4" /> Progress Analytics (Last {last10Results.length} Tests)
                </h4>
                <div className="flex items-end justify-between gap-1 h-32">
                  {last10Results.map((result, idx) => (
                    <div key={result.id} className="flex-1 flex flex-col items-center">
                      <div 
                        className={cn(
                          "w-full rounded-t transition-all",
                          result.score >= 70 ? "bg-green-500" : result.score >= 40 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ height: `${result.score}%` }}
                        title={`${result.score}%`}
                      />
                      <span className="text-xs text-muted-foreground mt-1">{idx + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Oldest</span>
                  <span>Average: {Math.round(last10Results.reduce((a, b) => a + b.score, 0) / last10Results.length)}%</span>
                  <span>Latest</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowReview(true)}>
                Review Answers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Review screen
  if (showReview) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Review Answers</h2>
          <Button variant="outline" onClick={() => setShowReview(false)}>Back to Results</Button>
        </div>
        {questions.map((q, i) => {
          const userAnswer = answers[i]
          const isCorrect = userAnswer === q.correctIndex
          const isWrong = userAnswer !== null && userAnswer !== q.correctIndex
          return (
            <Card key={q.id} className={cn(isCorrect && "border-green-500", isWrong && "border-red-500")}>
              <CardContent className="pt-4">
                <p className="font-medium mb-3">Q{i + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={cn(
                        "p-2 rounded border text-sm",
                        oi === q.correctIndex && "bg-green-500/10 border-green-500",
                        userAnswer === oi && oi !== q.correctIndex && "bg-red-500/10 border-red-500"
                      )}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                      {oi === q.correctIndex && <CheckCircle className="h-4 w-4 text-green-500 inline ml-2" />}
                      {userAnswer === oi && oi !== q.correctIndex && <XCircle className="h-4 w-4 text-red-500 inline ml-2" />}
                    </div>
                  ))}
                </div>
                {userAnswer === null && <p className="text-sm text-muted-foreground mt-2">You did not answer this question.</p>}
              </CardContent>
            </Card>
          )
        })}
        <Button variant="outline" className="w-full" onClick={onBack}>Back to Tests</Button>
      </div>
    )
  }

  // Test in progress
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{testTitle}</h2>
        <div className="flex items-center gap-4">
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full", timeLeft < 60 ? "bg-red-500/10 text-red-500" : "bg-muted")}>
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
          <Button variant="destructive" size="sm" onClick={handleSubmit}>Submit</Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answers.filter(a => a !== null).length} answered</span>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} />
      </div>

      {/* Question navigation pills */}
      <div className="flex flex-wrap gap-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "h-8 w-8 rounded-full text-sm font-medium transition-colors",
              i === currentIndex && "bg-primary text-primary-foreground",
              i !== currentIndex && answers[i] !== null && "bg-green-500 text-white",
              i !== currentIndex && answers[i] === null && "bg-muted hover:bg-muted/80"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Q{currentIndex + 1}. {currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, oi) => (
            <button
              key={oi}
              onClick={() => handleSelectOption(oi)}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3",
                answers[currentIndex] === oi ? "border-primary bg-primary/10" : "hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <span className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center font-medium",
                answers[currentIndex] === oi ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {String.fromCharCode(65 + oi)}
              </span>
              <span>{option}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        {currentIndex === questions.length - 1 ? (
          <Button onClick={handleSubmit}>Submit Test</Button>
        ) : (
          <Button onClick={handleNext}>
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default TestRunner
