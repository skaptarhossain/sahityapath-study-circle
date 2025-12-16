import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Flag, AlertCircle, Copyright, HelpCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNotificationStore } from '@/stores/notification-store'
import { useAuthStore } from '@/stores/auth-store'
import type { ContentReport } from '@/types'

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: 'mcq' | 'note' | 'quiz' | 'pack'
  contentId: string
  contentTitle: string
  creatorId: string
}

const reportTypes = [
  { id: 'error', label: 'ভুল তথ্য / Error', icon: AlertCircle, color: 'text-red-500' },
  { id: 'inappropriate', label: 'অনুপযুক্ত / Inappropriate', icon: Flag, color: 'text-orange-500' },
  { id: 'copyright', label: 'কপিরাইট / Copyright', icon: Copyright, color: 'text-blue-500' },
  { id: 'other', label: 'অন্যান্য / Other', icon: HelpCircle, color: 'text-muted-foreground' },
] as const

export function ReportDialog({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
  creatorId,
}: ReportDialogProps) {
  const { user } = useAuthStore()
  const { createReport } = useNotificationStore()
  
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const handleSubmit = async () => {
    if (!selectedType || !user) return
    
    setIsSubmitting(true)
    try {
      const report: ContentReport = {
        id: uuidv4(),
        contentType,
        contentId,
        contentTitle,
        reportType: selectedType as 'error' | 'inappropriate' | 'copyright' | 'other',
        description,
        reportedBy: user.id,
        reporterName: user.displayName,
        creatorId,
        status: 'pending',
        createdAt: Date.now(),
      }
      
      await createReport(report)
      setSubmitted(true)
      
      // Reset and close after 2 seconds
      setTimeout(() => {
        setSelectedType(null)
        setDescription('')
        setSubmitted(false)
        onOpenChange(false)
      }, 2000)
    } catch (err) {
      console.error('Error submitting report:', err)
      alert('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-orange-500" />
            Report Content
          </DialogTitle>
        </DialogHeader>
        
        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-lg">রিপোর্ট পাঠানো হয়েছে!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              আপনার রিপোর্ট content creator-কে জানানো হবে।
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                "{contentTitle}" সম্পর্কে রিপোর্ট করুন:
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {reportTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedType === type.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1 ${type.color}`} />
                      <p className="text-sm font-medium">{type.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">
                বিস্তারিত (Optional)
              </label>
              <Textarea
                placeholder="সমস্যাটি বিস্তারিত লিখুন..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!selectedType || isSubmitting}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? 'Sending...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
