import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Loader2, UserCircle } from 'lucide-react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

type RegisterData = z.infer<typeof registerSchema>

export function LoginForm() {
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useAuthStore()

  const form = useForm<RegisterData>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: { email: '', password: '', name: '' },
  })

  const createUserDoc = async (uid: string, email: string, name: string) => {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid,
        email,
        displayName: name,
        role: 'student',
        institution: '',
        groups: [],
        createdAt: new Date(),
        lastActive: new Date(),
      })
    }
  }

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true)
    setError('')
    try {
      if (isRegister) {
        const result = await createUserWithEmailAndPassword(auth, data.email, data.password)
        await createUserDoc(result.user.uid, data.email, data.name)
      } else {
        await signInWithEmailAndPassword(auth, data.email, data.password)
      }
    } catch (err: any) {
      const errorCode = err.code || ''
      let errorMessage = 'Something went wrong. Please try again.'
      
      if (errorCode === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.'
      } else if (errorCode === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.'
      } else if (errorCode === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered.'
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.'
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'Password is too weak.'
      } else if (errorCode === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.'
      } else if (errorCode === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please check email and password.'
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      // Try popup first, fallback to redirect if blocked
      try {
        const result = await signInWithPopup(auth, provider)
        await createUserDoc(
          result.user.uid,
          result.user.email || '',
          result.user.displayName || result.user.email?.split('@')[0] || 'User'
        )
      } catch (popupError: any) {
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          // Fallback to redirect
          await signInWithRedirect(auth, provider)
        } else {
          throw popupError
        }
      }
    } catch (err: any) {
      const errorCode = err.code || ''
      let errorMessage = 'Google sign-in failed. Please try again.'
      
      console.error('Google Sign-in Error:', errorCode, err.message)
      
      if (errorCode === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Redirecting to sign in...'
        // Don't show error, just redirect
        const provider = new GoogleAuthProvider()
        await signInWithRedirect(auth, provider)
        return
      } else if (errorCode === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in cancelled.'
      } else if (errorCode === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.'
      } else if (errorCode === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized. Please contact the administrator.'
      } else if (errorCode === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled. Please contact the administrator.'
      } else if (errorCode.includes('auth/')) {
        errorMessage = `Authentication error: ${err.message}`
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = () => {
    // Create a guest user object
    const guestUser = {
      id: 'guest-' + Date.now(),
      email: 'guest@studycircle.app',
      displayName: 'Guest User',
      photoURL: undefined,
      institution: '',
      groups: [],
      role: 'student' as const,
      createdAt: new Date(),
      lastActive: new Date(),
      isGuest: true,
    }
    setUser(guestUser)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="text-4xl mb-2"
            >
              📚
            </motion.div>
            <CardTitle className="text-2xl font-bold">Group Study 2.0</CardTitle>
            <CardDescription>Learn together, grow together</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="relative"
                >
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...form.register('name')}
                    placeholder="Your Name"
                    className="pl-10"
                    disabled={isLoading}
                  />
                  {form.formState.errors.name && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>
                  )}
                </motion.div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...form.register('email')}
                  type="email"
                  placeholder="Email"
                  className="pl-10"
                  disabled={isLoading}
                />
                {form.formState.errors.email && (
                  <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...form.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {form.formState.errors.password && (
                  <p className="text-destructive text-xs mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isRegister ? 'Register' : 'Login'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleGuestLogin}
              disabled={isLoading}
            >
              <UserCircle className="h-4 w-4 mr-2" />
              Continue as Guest
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isRegister ? 'Already have an account?' : 'New user?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError('')
                  form.reset()
                }}
                className="text-primary hover:underline font-medium"
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
