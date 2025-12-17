import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  BookOpen,
  Brain,
  Zap,
  Play,
  FileText,
  Library,
  Shield,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/notification-bell'
import type { User } from '@/types'
import { cn } from '@/lib/utils'

// Dashboard Components
import { PersonalDashboard } from '@/features/personal/personal-dashboard'
import { GroupDashboard } from '@/features/group/group-dashboard'
import { CoachingDashboard } from '@/features/coaching/coaching-dashboard'
import { SettingsPage } from '@/features/settings/settings-page'
import { AssetLibrary } from '@/features/library/asset-library'
import { LibraryAdmin } from '@/features/library/library-admin'

// Admin emails
const ADMIN_EMAILS = ['admin@sahityapath.com', 'info@banglasahityapath.com', 'saptarn90@gmail.com']

type MainTab = 'personal' | 'group' | 'library' | 'library-admin' | 'coaching' | 'settings'
export type PersonalSubTab = 'dashboard' | 'course' | 'live-test' | 'settings'
export type GroupSubTab = 'whats-new' | 'course' | 'live-test' | 'settings'
export type CoachingSubTab = 'browse' | 'my-courses' | 'settings'

// Storage keys
const STORAGE_KEY_MAIN_TAB = 'lastMainTab'
const STORAGE_KEY_PERSONAL_TAB = 'lastPersonalTab'
const STORAGE_KEY_GROUP_TAB = 'lastGroupTab'
const STORAGE_KEY_COACHING_TAB = 'lastCoachingTab'

const mainNavItems = [
  { id: 'personal' as MainTab, label: 'Personal', icon: Home },
  { id: 'group' as MainTab, label: 'Group Study', icon: Users },
  { id: 'coaching' as MainTab, label: 'Coaching', icon: GraduationCap },
  { id: 'library' as MainTab, label: 'Library', icon: Library },
  { id: 'settings' as MainTab, label: 'Settings', icon: Settings },
]

// Admin-only nav item
const adminNavItem = { id: 'library-admin' as MainTab, label: 'Library Admin', icon: Shield, adminOnly: true }

const personalSubTabs = [
  { id: 'dashboard' as PersonalSubTab, label: 'Dashboard', icon: Zap },
  { id: 'course' as PersonalSubTab, label: 'Course', icon: BookOpen },
  { id: 'live-test' as PersonalSubTab, label: 'Live Test', icon: Brain },
  { id: 'settings' as PersonalSubTab, label: 'Settings', icon: Settings },
]

const groupSubTabs = [
  { id: 'whats-new' as GroupSubTab, label: "What's New", icon: Sparkles },
  { id: 'course' as GroupSubTab, label: 'Course', icon: BookOpen },
  { id: 'live-test' as GroupSubTab, label: 'Live Test', icon: Brain },
  { id: 'settings' as GroupSubTab, label: 'Settings', icon: Settings },
]

const coachingSubTabs = [
  { id: 'browse' as CoachingSubTab, label: 'Browse', icon: BookOpen },
  { id: 'my-courses' as CoachingSubTab, label: 'My Courses', icon: GraduationCap },
  { id: 'settings' as CoachingSubTab, label: 'Settings', icon: Settings },
]

export function MainLayout() {
  // Load saved tabs from localStorage
  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MAIN_TAB)
    return (saved as MainTab) || 'personal'
  })
  
  const [personalTab, setPersonalTab] = useState<PersonalSubTab>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PERSONAL_TAB)
    return (saved as PersonalSubTab) || 'dashboard'
  })
  
  const [groupTab, setGroupTab] = useState<GroupSubTab>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GROUP_TAB)
    return (saved as GroupSubTab) || 'whats-new'
  })
  
  const [coachingTab, setCoachingTab] = useState<CoachingSubTab>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COACHING_TAB)
    return (saved as CoachingSubTab) || 'browse'
  })
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, setUser } = useAuthStore()

  // Android Back Button Handling
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      
      // Close sidebar if open
      if (sidebarOpen) {
        setSidebarOpen(false)
        window.history.pushState(null, '', window.location.href)
        return
      }
      
      // Navigate back in sub-tabs first
      if (activeTab === 'personal' && personalTab !== 'dashboard') {
        setPersonalTab('dashboard')
        window.history.pushState(null, '', window.location.href)
        return
      }
      if (activeTab === 'group' && groupTab !== 'whats-new') {
        setGroupTab('whats-new')
        window.history.pushState(null, '', window.location.href)
        return
      }
      if (activeTab === 'coaching' && coachingTab !== 'browse') {
        setCoachingTab('browse')
        window.history.pushState(null, '', window.location.href)
        return
      }
      
      // If on main tab, go to personal
      if (activeTab !== 'personal') {
        setActiveTab('personal')
        window.history.pushState(null, '', window.location.href)
        return
      }
    }
    
    // Push initial state
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)
    
    return () => window.removeEventListener('popstate', handlePopState)
  }, [sidebarOpen, activeTab, personalTab, groupTab, coachingTab])

  // Save tabs to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MAIN_TAB, activeTab)
  }, [activeTab])
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PERSONAL_TAB, personalTab)
  }, [personalTab])
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GROUP_TAB, groupTab)
  }, [groupTab])
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COACHING_TAB, coachingTab)
  }, [coachingTab])

  // Get current sub-tabs based on active main tab
  const getCurrentSubTabs = () => {
    switch (activeTab) {
      case 'personal':
        return { tabs: personalSubTabs, active: personalTab, setActive: setPersonalTab }
      case 'group':
        return { tabs: groupSubTabs, active: groupTab, setActive: setGroupTab }
      case 'coaching':
        return { tabs: coachingSubTabs, active: coachingTab, setActive: setCoachingTab }
      default:
        return null
    }
  }

  const subTabsConfig = getCurrentSubTabs()

  const handleLogout = async () => {
    try {
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

  // Check if user is admin
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email))

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalDashboard activeSubTab={personalTab} setActiveSubTab={setPersonalTab} />
      case 'group':
        return <GroupDashboard activeSubTab={groupTab} setActiveSubTab={setGroupTab} />
      case 'library':
        return <AssetLibrary />
      case 'library-admin':
        return isAdmin ? <LibraryAdmin /> : <AssetLibrary />
      case 'coaching':
        return <CoachingDashboard activeSubTab={coachingTab} setActiveSubTab={setCoachingTab} />
      case 'settings':
        return <SettingsPage />
      default:
        return <PersonalDashboard activeSubTab={personalTab} setActiveSubTab={setPersonalTab} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 px-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold text-primary">
          📚 Group Study 2.0
        </h1>
        <NotificationBell />
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
                isAdmin={isAdmin}
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
          isAdmin={isAdmin}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-14 lg:pt-0 pb-16 lg:pb-0 min-h-screen">
        <div className="p-3 sm:p-4 lg:p-8">
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

      {/* Mobile Bottom Navigation - Contextual Sub-tabs */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-[100] safe-area-inset-bottom">
        {subTabsConfig ? (
          <div className="flex items-center justify-around py-1 px-1">
            {subTabsConfig.tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => subTabsConfig.setActive(item.id as never)}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all flex-1 min-w-0',
                  subTabsConfig.active === item.id
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 mb-0.5 transition-transform',
                  subTabsConfig.active === item.id && 'scale-110'
                )} />
                <span className={cn(
                  'text-[9px] font-medium truncate w-full text-center',
                  subTabsConfig.active === item.id && 'font-semibold'
                )}>{item.label}</span>
              </button>
            ))}
          </div>
        ) : (
          // Settings page - show main nav
          <div className="flex items-center justify-around py-1 px-1">
            {mainNavItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all flex-1 min-w-0',
                  activeTab === item.id
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 mb-0.5 transition-transform',
                  activeTab === item.id && 'scale-110'
                )} />
                <span className={cn(
                  'text-[9px] font-medium truncate w-full text-center',
                  activeTab === item.id && 'font-semibold'
                )}>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </nav>
    </div>
  )
}

interface SidebarContentProps {
  user: User | null
  activeTab: MainTab
  setActiveTab: (tab: MainTab) => void
  onLogout: () => void
  isAdmin: boolean
}

function SidebarContent({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  isAdmin,
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
        {mainNavItems.map((item) => (
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
        
        {/* Admin-only: Library Admin */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab(adminNavItem.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
              activeTab === adminNavItem.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'hover:bg-orange-500/10 text-orange-500 hover:text-orange-600'
            )}
          >
            <adminNavItem.icon className="h-5 w-5" />
            <span className="font-medium">{adminNavItem.label}</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-border space-y-2">
        <div className="hidden lg:block">
          <NotificationBell />
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
