import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Trophy, ArrowLeft, ArrowRight, TrendingUp, Medal, Users, Flag } from 'lucide-react'
import type { GroupMCQ, GroupQuizResult, GroupContentItem } from '@/types'
import { useGroupStore } from '@/stores/group-store'
import { useAuthStore } from '@/stores/auth-store'
import { v4 as uuidv4 } from 'uuid'
import { ReportDialog } from './report-dialog'

type GroupQuizRunnerProps = {
  questions: GroupMCQ[]
  quizItem: GroupContentItem
  timeLimit?: number // total minutes, null = no limit
  onBack: () => void
}

export function GroupQuizRunner({ questions, quizItem, timeLimit, onBack }: GroupQuizRunnerProps) {
  const user = useAuthStore(s => s.user)
  const addQuizResult = useGroupStore(s => s.addQuizResult)
  const getLeaderboard = useGroupStore(s => s.getLeaderboard)
  const getUserQuizHistory = useGroupStore(s => s.getUserQuizHistory)
  const getQuizResultsByQuiz = useGroupStore(s => s.getQuizResultsByQuiz)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null))
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : 0)
  const [startTime] = useState(Date.now())
  const [isFinished, setIsFinished] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [lastResult, setLastResult] = useState<GroupQuizResult | null>(null)

  const currentQuestion = questions[currentIndex]

  // Timer - only if timeLimit is set
  useEffect(() => {
    if (isFinished || !timeLimit) return
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
  }, [isFinished, timeLimit])

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
    if (!user) return
    
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

    const result: GroupQuizResult = {
      id: uuidv4(),
      groupId: quizItem.groupId,
      quizItemId: quizItem.id,
      quizTitle: quizItem.title,
      userId: user.id,
      userName: user.displayName,
      score: Math.round((correct / questions.length) * 100),
      correct,
      wrong,
      unanswered,
      total: questions.length,
      timeTaken,
      answers: answerDetails,
      createdAt: Date.now()
    }

    addQuizResult(result)
    setLastResult(result)
    setIsFinished(true)
  }, [answers, questions, startTime, user, quizItem, addQuizResult])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Leaderboard view
  if (showLeaderboard) {
    const leaderboard = getLeaderboard(quizItem.id)
    
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Leaderboard
          </h2>
          <Button variant="outline" onClick={() => setShowLeaderboard(false)}>
            Back to Results
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{quizItem.title}</CardTitle>
            <CardDescription>{leaderboard.length} participants</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No results yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((result, idx) => (
                  <div 
                    key={result.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      idx === 0 && "bg-yellow-500/10 border border-yellow-500",
                      idx === 1 && "bg-gray-300/10 border border-gray-400",
                      idx === 2 && "bg-orange-500/10 border border-orange-400",
                      idx > 2 && "bg-muted",
                      result.userId === user?.id && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background font-bold">
                      {idx === 0 ? <Medal className="h-5 w-5 text-yellow-500" /> :
                       idx === 1 ? <Medal className="h-5 w-5 text-gray-400" /> :
                       idx === 2 ? <Medal className="h-5 w-5 text-orange-400" /> :
                       idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{result.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.correct}/{result.total} correct • {formatTime(result.timeTaken)}
                      </p>
                    </div>
                    <div className={cn(
                      "text-xl font-bold",
                      result.score >= 70 ? "text-green-500" : result.score >= 40 ? "text-yellow-500" : "text-red-500"
                    )}>
                      {result.score}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to Course
        </Button>
      </div>
    )
  }

  // Results screen
  if (isFinished && !showReview && lastResult) {
    const { correct, wrong, unanswered, score } = lastResult
    
    // Get user's last 10 attempts for this group
    const userHistory = getUserQuizHistory(quizItem.groupId, user?.id || '', 10)
    
    // Get all results for this quiz to calculate group average
    const allQuizResults = getQuizResultsByQuiz(quizItem.id)
    const groupAverage = allQuizResults.length > 0 
      ? Math.round(allQuizResults.reduce((a, b) => a + b.score, 0) / allQuizResults.length)
      : 0
    const userAverage = userHistory.length > 0
      ? Math.round(userHistory.reduce((a, b) => a + b.score, 0) / userHistory.length)
      : score

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Trophy className={cn("h-16 w-16", score >= 70 ? "text-yellow-500" : score >= 40 ? "text-blue-500" : "text-muted-foreground")} />
            </div>
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            <CardDescription>{quizItem.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{score}%</div>
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

            {/* Progress Analytics - Your Progress vs Group Average */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4" /> Progress Analytics
              </h4>
              
              {/* Comparison Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{userAverage}%</p>
                  <p className="text-xs text-muted-foreground">Your Average</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{groupAverage}%</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" /> Group Average
                  </p>
                </div>
              </div>
              
              {/* Graph - Last 10 Attempts */}
              {userHistory.length > 0 && (
                <>
                  <p className="text-sm text-muted-foreground mb-2">Your Last {Math.min(userHistory.length, 10)} Attempts</p>
                  <div className="relative">
                    {/* Group Average Line */}
                    <div 
                      className="absolute w-full border-t-2 border-dashed border-blue-500 z-10"
                      style={{ bottom: `${groupAverage}%` }}
                      title={`Group Avg: ${groupAverage}%`}
                    >
                      <span className="absolute right-0 -top-4 text-xs text-blue-500 bg-background px-1">
                        Group {groupAverage}%
                      </span>
                    </div>
                    
                    <div className="flex items-end justify-between gap-1 h-32">
                      {[...userHistory].reverse().map((result, idx) => (
                        <div key={result.id} className="flex-1 flex flex-col items-center">
                          <div 
                            className={cn(
                              "w-full rounded-t transition-all",
                              result.score >= groupAverage ? "bg-green-500" : "bg-orange-500"
                            )}
                            style={{ height: `${result.score}%` }}
                            title={`${result.score}%`}
                          />
                          <span className="text-xs text-muted-foreground mt-1">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Oldest</span>
                    <span className="text-green-500">■ Above Avg</span>
                    <span className="text-orange-500">■ Below Avg</span>
                    <span>Latest</span>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button variant="outline" onClick={() => setShowLeaderboard(true)}>
                <Trophy className="h-4 w-4 mr-2" /> Leaderboard
              </Button>
              <Button variant="outline" className="col-span-2" onClick={() => setShowReview(true)}>
                View Solutions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Review screen - View Solutions
  if (showReview) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">View Solutions</h2>
          <Button variant="outline" onClick={() => setShowReview(false)}>Back to Results</Button>
        </div>
        {questions.map((q, i) => {
          const userAnswer = answers[i]
          const isCorrect = userAnswer === q.correctIndex
          const isWrong = userAnswer !== null && userAnswer !== q.correctIndex
          return (
            <Card key={q.id} className={cn(isCorrect && "border-green-500", isWrong && "border-red-500")}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <p className="font-medium flex-1">Q{i + 1}. {q.question}</p>
                  <ReportDialog
                    groupId={quizItem.groupId}
                    contentId={quizItem.id}
                    contentType="mcq"
                    contentTitle={quizItem.title}
                    creatorId={q.createdBy}
                    creatorName={q.createdByName}
                    questionId={q.id}
                    questionText={q.question}
                    trigger={
                      <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 h-8 px-2">
                        <Flag className="w-3 h-3" />
                      </Button>
                    }
                  />
                </div>
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
        <Button variant="outline" className="w-full" onClick={onBack}>Back to Course</Button>
      </div>
    )
  }

  // Test in progress
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{quizItem.title}</h2>
        <div className="flex items-center gap-4">
          {timeLimit && (
            <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full", timeLeft < 60 ? "bg-red-500/10 text-red-500" : "bg-muted")}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          )}
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
          <Button onClick={handleSubmit}>Submit Quiz</Button>
        ) : (
          <Button onClick={handleNext}>
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default GroupQuizRunner
