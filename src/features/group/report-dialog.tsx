import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Flag, Send, AlertCircle } from 'lucide-react'
import { useGroupStore } from '@/stores/group-store'
import { useAuthStore } from '@/stores/auth-store'
import type { ContentReport } from '@/types'
import { v4 as uuidv4 } from 'uuid'

type ReportDialogProps = {
  groupId: string
  contentId: string
  contentType: 'note' | 'quiz' | 'mcq'
  contentTitle: string
  creatorId: string
  creatorName: string
  questionId?: string  // For specific question in quiz
  questionText?: string  // Display which question
  trigger?: React.ReactNode
}

export function ReportDialog({
  groupId,
  contentId,
  contentType,
  contentTitle,
  creatorId,
  creatorName,
  questionId,
  questionText,
  trigger
}: ReportDialogProps) {
  const user = useAuthStore(s => s.user)
  const addContentReport = useGroupStore(s => s.addContentReport)
  
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  
  const handleSubmit = () => {
    if (!user || !message.trim()) return
    
    const report: ContentReport = {
      id: uuidv4(),
      groupId,
      contentId,
      contentType,
      contentTitle,
      reportedBy: user.id,
      reportedByName: user.displayName,
      creatorId,
      creatorName,
      message: message.trim(),
      questionId,
      status: 'pending',
      createdAt: Date.now()
    }
    
    addContentReport(report)
    setSubmitted(true)
    
    // Auto close after 2 seconds
    setTimeout(() => {
      setOpen(false)
      setSubmitted(false)
      setMessage('')
    }, 2000)
  }
  
  const contentTypeLabel = {
    note: 'Notes',
    quiz: 'Quiz',
    mcq: 'Question'
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
            <Flag className="w-4 h-4 mr-1" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Report for Correction
          </DialogTitle>
          <DialogDescription>
            {contentTypeLabel[contentType]}: <span className="font-medium">{contentTitle}</span>
            <br />
            <span className="text-xs">Created by: {creatorName}</span>
          </DialogDescription>
        </DialogHeader>
        
        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-green-600">Report Submitted!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {creatorName} will be notified
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questionText && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <span className="font-medium">Question:</span> {questionText}
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                What needs to be corrected?
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue... e.g., 'Wrong answer marked', 'Spelling error', 'Incorrect information'"
                rows={4}
                className="resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!message.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
