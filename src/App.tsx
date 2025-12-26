import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './config/firebase'
import { useAuthStore } from './stores/auth-store'
import { useThemeStore } from './stores/theme-store'
import { LoginForm } from './features/auth/login-form'
import { MainLayout } from './components/layout/main-layout'
import { Loading } from './components/loading'
import { ToastProvider } from './components/ui/toast'
import { ErrorBoundary } from './components/error-boundary'
import { OfflineIndicator } from './components/offline-indicator'
import type { User } from './types'

function App() {
  const { user, setUser, setLoading, isLoading } = useAuthStore()
  const { theme } = useThemeStore()

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>
            setUser({
              id: firebaseUser.uid,
              ...userData,
            })
          } else {
            // Create basic user data if doesn't exist
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'ব্যবহারকারী',
              photoURL: firebaseUser.photoURL || undefined,
              institution: '',
              groups: [],
              role: 'student',
              createdAt: new Date(),
              lastActive: new Date(),
            })
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, setLoading])

  if (isLoading) {
    return <Loading fullScreen />
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <ToastProvider>
          <OfflineIndicator />
          <LoginForm />
        </ToastProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <OfflineIndicator />
        <MainLayout />
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
