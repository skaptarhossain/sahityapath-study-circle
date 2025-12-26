import { Input } from '@/components/ui/input'

interface ResultAnalysisSettingsProps {
  // Context
  context: 'personal' | 'group' | 'coaching'
  disabled?: boolean
  
  // Values
  resultReleaseTime: string
  showLeaderboard: boolean
  showDetailedAnalysis: boolean
  
  // Handlers
  onResultReleaseTimeChange: (time: string) => void
  onShowLeaderboardChange: (show: boolean) => void
  onShowDetailedAnalysisChange: (show: boolean) => void
}

export function ResultAnalysisSettings({
  context,
  disabled = false,
  resultReleaseTime,
  showLeaderboard,
  showDetailedAnalysis,
  onResultReleaseTimeChange,
  onShowLeaderboardChange,
  onShowDetailedAnalysisChange,
}: ResultAnalysisSettingsProps) {
  return (
    <div className={`p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800 space-y-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
        📊 Result Analysis Settings
      </h5>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Result Release Time</label>
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={resultReleaseTime}
            onChange={e => onResultReleaseTimeChange(e.target.value)}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground">
            Results visible after this time
          </span>
        </div>
      </div>
      
      {/* Leaderboard - Only for Group and Coaching */}
      {(context === 'group' || context === 'coaching') && (
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Show Leaderboard</span>
            <p className="text-xs text-muted-foreground">Rank participants by score</p>
          </div>
          <input
            type="checkbox"
            checked={showLeaderboard}
            onChange={e => onShowLeaderboardChange(e.target.checked)}
            className="h-4 w-4"
          />
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">Detailed Analysis</span>
          <p className="text-xs text-muted-foreground">Charts, topic breakdown, insights</p>
        </div>
        <input
          type="checkbox"
          checked={showDetailedAnalysis}
          onChange={e => onShowDetailedAnalysisChange(e.target.checked)}
          className="h-4 w-4"
        />
      </div>
    </div>
  )
}
