import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Loader2, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/config/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PasswordResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail?: string
}

export function PasswordResetDialog({ open, onOpenChange, defaultEmail = '' }: PasswordResetDialogProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')

  const handleSendReset = async () => {
    if (!email) {
      setError('ইমেইল দিন')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('সঠিক ইমেইল দিন')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin, // Redirect URL after password reset
      })
      setIsSent(true)
    } catch (err: any) {
      console.error('Password reset error:', err)
      
      const errorCode = err.code || ''
      if (errorCode === 'auth/user-not-found') {
        setError('এই ইমেইলে কোনো একাউন্ট নেই')
      } else if (errorCode === 'auth/invalid-email') {
        setError('ইমেইল ঠিকানা সঠিক নয়')
      } else if (errorCode === 'auth/too-many-requests') {
        setError('অনেক বার চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন')
      } else {
        setError('কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEmail(defaultEmail)
      setIsSent(false)
      setError('')
    } else {
      setEmail(defaultEmail)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            পাসওয়ার্ড রিসেট করুন
          </DialogTitle>
          <DialogDescription>
            {isSent 
              ? 'পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে' 
              : 'আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হবে'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!isSent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  ইমেইল ঠিকানা
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}

              {/* Send Button */}
              <Button
                onClick={handleSendReset}
                disabled={isLoading || !email}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                রিসেট লিংক পাঠান
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              {/* Success Icon */}
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Success Message */}
              <h3 className="text-lg font-semibold mb-2">ইমেইল পাঠানো হয়েছে!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">{email}</span> এ পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।
                ইমেইল না পেলে স্প্যাম ফোল্ডার চেক করুন।
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  বন্ধ করুন
                </Button>
                <button
                  onClick={() => setIsSent(false)}
                  className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  অন্য ইমেইলে পাঠান
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
