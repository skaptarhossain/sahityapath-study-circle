import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, Trophy, TrendingUp, Clock, Target, Award, Medal } from 'lucide-react'

// Types
export interface TestResultData {
  id: string
  userId: string
  userName?: string
  score: number
  correct: number
  wrong: number
  unanswered: number
  total: number
  timeTaken: number // seconds
  submittedAt: number
  answers: {
    questionId: string
    selected: number | null
    correct: number
    categoryId?: string
    categoryName?: string
  }[]
}

export interface CategoryInfo {
  id: string
  name: string
}

export interface LeaderboardEntry {
  rank: number
  userName: string
  userId: string
  score: number
  correct: number
  total: number
  timeTaken: number
  isCurrentUser?: boolean
}

interface ResultAnalysisProps {
  result: TestResultData
  categories?: CategoryInfo[]
  leaderboard?: LeaderboardEntry[]
  showLeaderboard?: boolean
  showCategoryBreakdown?: boolean
  showDetailedAnalysis?: boolean
  onViewSolutions?: () => void
  onClose?: () => void
  currentUserId?: string
}

export function ResultAnalysis({
  result,
  categories = [],
  leaderboard = [],
  showLeaderboard = true,
  showCategoryBreakdown = true,
  showDetailedAnalysis = true,
  onViewSolutions,
  onClose,
  currentUserId
}: ResultAnalysisProps) {
  
  // Calculate category-wise breakdown
  const categoryBreakdown = useMemo(() => {
    if (!showCategoryBreakdown || categories.length === 0) return []
    
    const breakdown: Record<string, { total: number; correct: number; wrong: number; name: string }> = {}
    
    result.answers.forEach(ans => {
      const catId = ans.categoryId || 'unknown'
      const catName = ans.categoryName || categories.find(c => c.id === catId)?.name || 'Other'
      
      if (!breakdown[catId]) {
        breakdown[catId] = { total: 0, correct: 0, wrong: 0, name: catName }
      }
      
      breakdown[catId].total++
      if (ans.selected === ans.correct) {
        breakdown[catId].correct++
      } else if (ans.selected !== null) {
        breakdown[catId].wrong++
      }
    })
    
    return Object.entries(breakdown)
      .map(([id, data]) => ({
        id,
        name: data.name,
        total: data.total,
        correct: data.correct,
        wrong: data.wrong,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
  }, [result.answers, categories, showCategoryBreakdown])

  // Find current user's rank
  const currentUserRank = useMemo(() => {
    if (!currentUserId || leaderboard.length === 0) return null
    const entry = leaderboard.find(e => e.userId === currentUserId)
    return entry?.rank || null
  }, [leaderboard, currentUserId])

  // Grade calculation
  const grade = useMemo(() => {
    if (result.score >= 90) return { label: '⭐ Excellent!', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' }
    if (result.score >= 80) return { label: '👍 Great Job!', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' }
    if (result.score >= 70) return { label: '✓ Good', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' }
    if (result.score >= 50) return { label: '📚 Keep Practicing', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' }
    return { label: '💪 Needs Improvement', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' }
  }, [result.score])

  // Accuracy calculation
  const accuracy = Math.round((result.correct / (result.correct + result.wrong || 1)) * 100)
  const attemptRate = Math.round(((result.total - result.unanswered) / result.total) * 100)
  const avgTimePerQuestion = Math.round(result.timeTaken / result.total)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          📊 Test Result Analysis
        </h3>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕ Close
          </Button>
        )}
      </div>

      {/* Score Circle & Grade */}
      <div className="text-center py-4">
        <div className="relative w-36 h-36 mx-auto mb-3">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72" cy="72" r="60"
              fill="none"
              stroke="currentColor"
              className="text-muted"
              strokeWidth="12"
            />
            <circle
              cx="72" cy="72" r="60"
              fill="none"
              stroke={result.score >= 80 ? '#22c55e' : result.score >= 50 ? '#eab308' : '#ef4444'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${result.score * 3.77} 377`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${result.score >= 80 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {result.score}%
            </span>
            <span className="text-xs text-muted-foreground">Score</span>
          </div>
        </div>
        
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${grade.color}`}>
          {grade.label}
        </span>
        
        {/* Rank Badge */}
        {currentUserRank && (
          <div className="mt-2">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              🏆 Rank #{currentUserRank} of {leaderboard.length}
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{result.correct}</div>
          <p className="text-[10px] sm:text-xs text-green-600/70 dark:text-green-400/70">✓ Correct</p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{result.wrong}</div>
          <p className="text-[10px] sm:text-xs text-red-600/70 dark:text-red-400/70">✗ Wrong</p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{result.unanswered || 0}</div>
          <p className="text-[10px] sm:text-xs text-gray-600/70 dark:text-gray-400/70">⊘ Skipped</p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {Math.floor(result.timeTaken / 60)}:{String(result.timeTaken % 60).padStart(2, '0')}
          </div>
          <p className="text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70">⏱ Time</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {showCategoryBreakdown && categoryBreakdown.length > 1 && (
        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" /> Category-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y dark:divide-gray-800">
              {categoryBreakdown.map(cat => (
                <div key={cat.id} className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.correct}/{cat.total} correct
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          cat.accuracy >= 80 ? 'bg-green-500' :
                          cat.accuracy >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${cat.accuracy}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold w-12 text-right ${
                      cat.accuracy >= 80 ? 'text-green-600' :
                      cat.accuracy >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {cat.accuracy}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {showDetailedAnalysis && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Performance Metrics
          </h4>
          
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Accuracy</span>
                <span className="font-medium">{accuracy}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Attempt Rate</span>
                <span className="font-medium">{attemptRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                  style={{ width: `${attemptRate}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Avg Time/Question</span>
                <span className="font-medium">{avgTimePerQuestion}s</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, 100 - (avgTimePerQuestion / 60) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {showLeaderboard && leaderboard.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y dark:divide-gray-800 max-h-60 overflow-y-auto">
              {leaderboard.slice(0, 10).map((entry, idx) => (
                <div 
                  key={entry.userId} 
                  className={`p-3 flex items-center gap-3 ${
                    entry.isCurrentUser || entry.userId === currentUserId 
                      ? 'bg-primary/5 border-l-2 border-l-primary' 
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0">
                    {entry.rank === 1 && <span className="text-lg">🥇</span>}
                    {entry.rank === 2 && <span className="text-lg">🥈</span>}
                    {entry.rank === 3 && <span className="text-lg">🥉</span>}
                    {entry.rank > 3 && (
                      <span className="text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                    )}
                  </div>
                  
                  {/* Name & Stats */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      entry.isCurrentUser || entry.userId === currentUserId ? 'text-primary' : ''
                    }`}>
                      {entry.userName}
                      {(entry.isCurrentUser || entry.userId === currentUserId) && 
                        <span className="text-xs ml-1">(You)</span>
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.correct}/{entry.total} • {Math.floor(entry.timeTaken / 60)}:{String(entry.timeTaken % 60).padStart(2, '0')}
                    </p>
                  </div>
                  
                  {/* Score */}
                  <div className={`text-lg font-bold ${
                    entry.score >= 80 ? 'text-green-600' :
                    entry.score >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {entry.score}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Insights */}
      {showDetailedAnalysis && (
        <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-2">💡 Quick Insights</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {result.score >= 80 && (
              <li>✨ Outstanding performance! You've mastered this topic.</li>
            )}
            {result.score >= 50 && result.score < 80 && (
              <li>📖 Good effort! Review incorrect answers to improve.</li>
            )}
            {result.score < 50 && (
              <li>📚 Focus on understanding core concepts. Try reading notes first.</li>
            )}
            {result.unanswered > 0 && (
              <li>⏰ You skipped {result.unanswered} questions. Try attempting all next time.</li>
            )}
            {avgTimePerQuestion < 30 && (
              <li>🚀 Great speed! But ensure you're reading questions carefully.</li>
            )}
            {avgTimePerQuestion > 120 && (
              <li>⏱ Try to improve your speed while maintaining accuracy.</li>
            )}
            {categoryBreakdown.length > 1 && (
              <>
                {categoryBreakdown.filter(c => c.accuracy >= 80).length > 0 && (
                  <li>💪 Strong in: {categoryBreakdown.filter(c => c.accuracy >= 80).map(c => c.name).join(', ')}</li>
                )}
                {categoryBreakdown.filter(c => c.accuracy < 50).length > 0 && (
                  <li>📝 Needs work: {categoryBreakdown.filter(c => c.accuracy < 50).map(c => c.name).join(', ')}</li>
                )}
              </>
            )}
          </ul>
        </div>
      )}

      {/* View Solutions Button */}
      {onViewSolutions && (
        <Button onClick={onViewSolutions} className="w-full">
          <Eye className="h-4 w-4 mr-2" /> View Solutions
        </Button>
      )}
    </div>
  )
}

// Export types for use in other components
export type { ResultAnalysisProps }
