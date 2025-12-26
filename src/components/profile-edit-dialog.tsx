import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Loader2, User, Building, Save } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from '@/config/firebase'
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

interface ProfileEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { user, setUser } = useAuthStore()
  const toast = useToast()
  
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [institution, setInstitution] = useState(user?.institution || '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('ফাইল সাইজ বড়', 'সর্বোচ্চ ২MB পর্যন্ত আপলোড করা যাবে')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('ভুল ফাইল টাইপ', 'শুধুমাত্র ছবি আপলোড করুন')
        return
      }

      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!user || user.isGuest) return

    setIsLoading(true)
    try {
      let photoURL = user.photoURL

      // Upload photo if changed
      if (photoFile && storage) {
        const storageRef = ref(storage, `avatars/${user.id}/${Date.now()}_${photoFile.name}`)
        const snapshot = await uploadBytes(storageRef, photoFile)
        photoURL = await getDownloadURL(snapshot.ref)
      }

      // Update Firestore
      const userRef = doc(db, 'users', user.id)
      await updateDoc(userRef, {
        displayName: displayName.trim() || user.displayName,
        institution: institution.trim(),
        photoURL,
        lastActive: new Date(),
      })

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim() || user.displayName,
          photoURL,
        })
      }

      // Update local state
      setUser({
        ...user,
        displayName: displayName.trim() || user.displayName,
        institution: institution.trim(),
        photoURL,
      })

      toast.success('Profile Updated!', 'Your information has been saved successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error', 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setDisplayName(user?.displayName || '')
      setInstitution(user?.institution || '')
      setPhotoFile(null)
      setPhotoPreview(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your name, institution and photo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-4 border-background shadow-lg"
              >
                {photoPreview || user?.photoURL ? (
                  <img
                    src={photoPreview || user?.photoURL}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                )}
              </motion.div>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              সর্বোচ্চ ২MB • JPG, PNG
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              নাম
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="আপনার নাম"
              maxLength={50}
            />
          </div>

          {/* Institution Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              প্রতিষ্ঠান
            </label>
            <Input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="আপনার স্কুল/কলেজ/বিশ্ববিদ্যালয়"
              maxLength={100}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            বাতিল
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            সংরক্ষণ করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
