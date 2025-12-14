import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import type { User } from '@/types'
import { cn } from '@/lib/utils'

// Dashboard Components
import { PersonalDashboard } from '@/features/personal/personal-dashboard'
import { GroupDashboard } from '@/features/group/group-dashboard'
import { CoachingDashboard } from '@/features/coaching/coaching-dashboard'
import { SettingsPage } from '@/features/settings/settings-page'

type Tab = 'personal' | 'group' | 'coaching' | 'settings'

const navItems = [
  { id: 'personal' as Tab, label: 'Personal', icon: Home },
  { id: 'group' as Tab, label: 'Group Study', icon: Users },
  { id: 'coaching' as Tab, label: 'Coaching', icon: GraduationCap },
  { id: 'settings' as Tab, label: 'Settings', icon: Settings },
]

export function MainLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, setUser } = useAuthStore()

  const handleLogout = async () => {
    try {
      // Check if guest user
      if (user?.isGuest) {
        setUser(null)
        return
      }
      await signOut(auth)
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalDashboard />
      case 'group':
        return <GroupDashboard />
      case 'coaching':
        return <CoachingDashboard />
      case 'settings':
        return <SettingsPage />
      default:
        return <PersonalDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 px-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold text-primary">
          📚 Group Study 2.0
        </h1>
        <ThemeToggle />
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 p-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-primary">📚 Group Study</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarContent
                user={user}
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab)
                  setSidebarOpen(false)
                }}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex-col p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            📚 Group Study 2.0
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            World-class learning platform
          </p>
        </div>
        <SidebarContent
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 px-2 py-1 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[64px]',
                activeTab === item.id
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 mb-1 transition-transform',
                activeTab === item.id && 'scale-110'
              )} />
              <span className={cn(
                'text-[10px] font-medium',
                activeTab === item.id && 'font-semibold'
              )}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

interface SidebarContentProps {
  user: User | null
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  onLogout: () => void
}

function SidebarContent({
  user,
  activeTab,
  setActiveTab,
  onLogout,
}: SidebarContentProps) {
  return (
    <>
      {/* User Info */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-6">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.photoURL} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {user?.displayName?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user?.displayName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.isGuest ? 'Guest User' : (user?.institution || user?.email)}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
              activeTab === item.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-border space-y-2">
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </>
  )
}
