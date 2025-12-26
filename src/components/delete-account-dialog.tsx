import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2, Trash2, ShieldAlert } from 'lucide-react'
import { 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithPopup
} from 'firebase/auth'
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore'
import { db, auth } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const { user, logout } = useAuthStore()
  const toast = useToast()
  
  const [step, setStep] = useState<'confirm' | 'reauthenticate'>('confirm')
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isGoogleUser = auth.currentUser?.providerData.some(
    (provider) => provider.providerId === 'google.com'
  )

  const handleReauthenticate = async () => {
    if (!auth.currentUser) return false

    try {
      if (isGoogleUser) {
        // Re-authenticate with Google
        const provider = new GoogleAuthProvider()
        await reauthenticateWithPopup(auth.currentUser, provider)
      } else {
        // Re-authenticate with email/password
        if (!password) {
          toast.error('পাসওয়ার্ড দিন', 'একাউন্ট ডিলিট করতে পাসওয়ার্ড প্রয়োজন')
          return false
        }
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email || '',
          password
        )
        await reauthenticateWithCredential(auth.currentUser, credential)
      }
      return true
    } catch (error: any) {
      console.error('Re-authentication error:', error)
      if (error.code === 'auth/wrong-password') {
        toast.error('ভুল পাসওয়ার্ড', 'সঠিক পাসওয়ার্ড দিন')
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error('বাতিল হয়েছে', 'Google সাইন-ইন বাতিল করা হয়েছে')
      } else {
        toast.error('যাচাইকরণ ব্যর্থ', 'আবার চেষ্টা করুন')
      }
      return false
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || !auth.currentUser) return

    // Verify confirmation text
    if (confirmText !== 'DELETE') {
      toast.error('নিশ্চিতকরণ ভুল', 'DELETE লিখুন')
      return
    }

    setIsLoading(true)
    try {
      // Step 1: Re-authenticate
      const reauthSuccess = await handleReauthenticate()
      if (!reauthSuccess) {
        setIsLoading(false)
        return
      }

      // Step 2: Delete user data from Firestore
      const batch = writeBatch(db)

      // Delete user document
      batch.delete(doc(db, 'users', user.id))

      // Delete user's personal test results
      try {
        const resultsQuery = query(
          collection(db, 'testResults'),
          where('userId', '==', user.id)
        )
        const resultsSnapshot = await getDocs(resultsQuery)
        resultsSnapshot.forEach((doc) => {
          batch.delete(doc.ref)
        })
      } catch (e) {
        console.warn('Could not delete test results:', e)
      }

      // Delete user's live test results
      try {
        const liveResultsQuery = query(
          collection(db, 'liveTestResults'),
          where('userId', '==', user.id)
        )
        const liveResultsSnapshot = await getDocs(liveResultsQuery)
        liveResultsSnapshot.forEach((doc) => {
          batch.delete(doc.ref)
        })
      } catch (e) {
        console.warn('Could not delete live test results:', e)
      }

      // Commit batch delete
      await batch.commit()

      // Step 3: Delete Firebase Auth account
      await deleteUser(auth.currentUser)

      // Step 4: Clear local state and logout
      logout()
      
      toast.success('একাউন্ট ডিলিট হয়েছে', 'আপনার সব ডাটা মুছে ফেলা হয়েছে')
      onOpenChange(false)
    } catch (error: any) {
      console.error('Delete account error:', error)
      
      if (error.code === 'auth/requires-recent-login') {
        setStep('reauthenticate')
        toast.warning('পুনরায় লগইন প্রয়োজন', 'নিরাপত্তার জন্য আবার পাসওয়ার্ড দিন')
      } else {
        toast.error('সমস্যা হয়েছে', 'একাউন্ট ডিলিট করা যায়নি')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep('confirm')
      setPassword('')
      setConfirmText('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            একাউন্ট ডিলিট করুন
          </DialogTitle>
          <DialogDescription>
            এই কাজটি অপরিবর্তনীয়। আপনার সমস্ত ডাটা স্থায়ীভাবে মুছে যাবে।
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Warning Box */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 mb-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive mb-2">The following data will be deleted:</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Your profile information</li>
                  <li>All test results & performance data</li>
                  <li>Group memberships</li>
                  <li>All settings & preferences</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Confirmation Input */}
          <div className="space-y-3">
            {!isGoogleUser && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Confirm your password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">
                Type <span className="font-mono bg-muted px-1 rounded">DELETE</span> to confirm
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            বাতিল
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isLoading || confirmText !== 'DELETE'}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            স্থায়ীভাবে ডিলিট করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
