import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  hapticEnabled: boolean
  setTheme: (theme: Theme) => void
  setHapticEnabled: (enabled: boolean) => void
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void
}

// Update status bar color based on theme
const updateStatusBarColor = (isDark: boolean) => {
  const metaThemeColor = document.getElementById('theme-color-meta')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#ffffff')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      hapticEnabled: true,
      setTheme: (theme) => {
        set({ theme })
        
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        
        let isDark = false
        if (theme === 'system') {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          root.classList.add(isDark ? 'dark' : 'light')
        } else {
          isDark = theme === 'dark'
          root.classList.add(theme)
        }
        
        // Update status bar color
        updateStatusBarColor(isDark)
      },
      setHapticEnabled: (enabled) => {
        set({ hapticEnabled: enabled })
      },
      triggerHaptic: (type = 'light') => {
        const { hapticEnabled } = get()
        if (!hapticEnabled) return
        
        // Use Vibration API if available
        if ('vibrate' in navigator) {
          const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30
          navigator.vibrate(duration)
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)
