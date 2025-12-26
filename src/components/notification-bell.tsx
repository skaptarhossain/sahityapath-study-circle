import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Flag, AlertCircle, Info, MessageSquare, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotificationStore } from '@/stores/notification-store'
import { useAuthStore } from '@/stores/auth-store'
import { useLiveTestStore } from '@/stores/live-test-store'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  onLiveTestClick?: () => void
}

export function NotificationBell({ onLiveTestClick }: NotificationBellProps) {
  const { user } = useAuthStore()
  const { 
    notifications, 
    unreadCount, 
    subscribeToNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationStore()
  const { isLiveTestActive, activeTestTitle } = useLiveTestStore()
  
  useEffect(() => {
    if (!user?.id) return
    
    const unsubscribe = subscribeToNotifications(user.id)
    return () => unsubscribe()
  }, [user?.id, subscribeToNotifications])
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'report':
        return <Flag className="h-4 w-4 text-orange-500" />
      case 'system':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />
    }
  }
  
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {/* Live Test Active Indicator - Red Blinking Dot */}
          {isLiveTestActive && (
            <span className="absolute top-0 left-0 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Live Test Banner - Show when active */}
        {isLiveTestActive && (
          <>
            <DropdownMenuItem
              className="flex items-center gap-3 p-3 cursor-pointer bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800"
              onClick={() => {
                if (onLiveTestClick) onLiveTestClick()
              }}
            >
              <div className="flex-shrink-0">
                <div className="relative">
                  <Radio className="h-5 w-5 text-red-500" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="animate-pulse">LIVE</span> Test Available!
                </p>
                <p className="text-xs text-red-500/80">
                  {activeTestTitle || 'Tap to start'}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-red-500 text-white font-medium">
                Go →
              </span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => user?.id && markAllAsRead(user.id)}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.isRead && "bg-primary/5"
                )}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id)
                  }
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm",
                    !notification.isRead && "font-medium"
                  )}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
