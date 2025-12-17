import { motion } from 'framer-motion'
import { Settings, User, Bell, Shield, Palette, Globe, Download, Trash2, LogOut, ChevronRight, Moon, Sun, Monitor, Vibrate } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useThemeStore } from '@/stores/theme-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

export function SettingsPage() {
  const { theme, setTheme, hapticEnabled, setHapticEnabled, triggerHaptic } = useThemeStore()
  const { user, logout } = useAuthStore()

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-3xl">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="h-8 w-8" />Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile</CardTitle><CardDescription>Manage your account</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-bold">{user?.displayName?.[0] || user?.email?.[0] || 'U'}</div>
              <div className="flex-1"><p className="font-medium">{user?.displayName || 'User'}</p><p className="text-sm text-muted-foreground">{user?.email || 'guest@local'}</p>{user?.isGuest && <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded mt-1 inline-block">Guest Account</span>}</div>
              {!user?.isGuest && <Button variant="outline" onClick={() => alert('🚧 Coming Soon!')}>Edit Profile</Button>}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Appearance</CardTitle><CardDescription>Customize the look</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div><p className="text-sm font-medium mb-3">Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button key={option.value} onClick={() => { setTheme(option.value); triggerHaptic('light'); }}
                        className={cn('p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2', theme === option.value ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted')}>
                        <Icon className="h-6 w-6" /><span className="text-sm font-medium">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Haptic Feedback Toggle */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-3">
                  <Vibrate className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Haptic Feedback</p>
                    <p className="text-sm text-muted-foreground">Vibration on button press</p>
                  </div>
                </div>
                <Switch 
                  checked={hapticEnabled} 
                  onCheckedChange={(checked) => {
                    setHapticEnabled(checked)
                    if (checked) triggerHaptic('medium')
                  }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notifications</CardTitle><CardDescription>Notification preferences</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><p className="font-medium">Push Notifications</p><p className="text-sm text-muted-foreground">Receive push notifications</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><p className="font-medium">Email Notifications</p><p className="text-sm text-muted-foreground">Receive updates via email</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><p className="font-medium">Study Reminders</p><p className="text-sm text-muted-foreground">Get study session reminders</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><p className="font-medium">Group Activity</p><p className="text-sm text-muted-foreground">Notifications for group activities</p></div><Switch /></div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Privacy & Security</CardTitle><CardDescription>Account security settings</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <button onClick={() => alert('🚧 Coming Soon!')} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"><div className="flex items-center gap-3"><Globe className="h-5 w-5 text-muted-foreground" /><div className="text-left"><p className="font-medium">Profile Visibility</p><p className="text-sm text-muted-foreground">Friends only</p></div></div><ChevronRight className="h-5 w-5 text-muted-foreground" /></button>
            {!user?.isGuest && <button onClick={() => alert('🚧 Coming Soon!')} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-muted-foreground" /><div className="text-left"><p className="font-medium">Two-Factor Authentication</p><p className="text-sm text-muted-foreground">Not enabled</p></div></div><ChevronRight className="h-5 w-5 text-muted-foreground" /></button>}
            <button onClick={() => alert('🚧 Coming Soon!')} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"><div className="flex items-center gap-3"><Download className="h-5 w-5 text-muted-foreground" /><div className="text-left"><p className="font-medium">Export Data</p><p className="text-sm text-muted-foreground">Download your data</p></div></div><ChevronRight className="h-5 w-5 text-muted-foreground" /></button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-destructive/50">
          <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" />Danger Zone</CardTitle><CardDescription>Irreversible actions</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
              <div><p className="font-medium">Delete Account</p><p className="text-sm text-muted-foreground">Permanently delete your account</p></div>
              <Button variant="destructive" size="sm" onClick={() => alert('⚠️ This feature requires email confirmation. Coming Soon!')}>Delete</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Button variant="outline" className="w-full" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
      </motion.div>
    </motion.div>
  )
}
