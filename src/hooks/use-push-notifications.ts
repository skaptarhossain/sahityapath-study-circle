import { useState, useEffect, useCallback } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, getFCMToken, onForegroundMessage, initializeMessaging } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/components/ui/toast'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  data?: Record<string, string>
}

export function usePushNotifications() {
  const { user } = useAuthStore()
  const toast = useToast()
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fcmToken, setFcmToken] = useState<string | null>(null)

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 
        'Notification' in window && 
        'serviceWorker' in navigator && 
        'PushManager' in window

      setIsSupported(supported)
      
      if (supported && Notification.permission === 'granted') {
        setIsEnabled(true)
        // Get existing token
        const token = await getFCMToken()
        setFcmToken(token)
      }
    }
    
    checkSupport()
  }, [])

  // Listen for foreground messages
  useEffect(() => {
    if (!isEnabled) return

    onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload)
      
      // Show toast notification
      const notification = payload.notification
      if (notification) {
        toast.info(notification.title || 'New Notification', notification.body)
      }
    })
  }, [isEnabled, toast])

  // Request permission and enable notifications
  const enableNotifications = useCallback(async () => {
    if (!isSupported) {
      toast.error('Not Supported', 'Your browser does not support push notifications')
      return false
    }

    setIsLoading(true)
    try {
      // Request notification permission
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        toast.warning('Permission Required', 'Please allow notifications')
        setIsLoading(false)
        return false
      }

      // Initialize messaging
      await initializeMessaging()

      // Get FCM token
      const token = await getFCMToken()
      
      if (token) {
        setFcmToken(token)
        setIsEnabled(true)

        // Save token to user document
        if (user && !user.isGuest) {
          await updateDoc(doc(db, 'users', user.id), {
            fcmTokens: arrayUnion(token),
            notificationsEnabled: true,
            lastTokenUpdate: new Date()
          })
        }

        toast.success('Notifications Enabled!', 'You will now receive notifications')
        return true
      } else {
        toast.error('Error', 'Failed to get token')
        return false
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      toast.error('Error', 'Failed to enable notifications')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, user, toast])

  // Disable notifications
  const disableNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      if (user && !user.isGuest && fcmToken) {
        await updateDoc(doc(db, 'users', user.id), {
          fcmTokens: arrayRemove(fcmToken),
          notificationsEnabled: false
        })
      }

      setIsEnabled(false)
      setFcmToken(null)
      toast.info('Notifications Disabled', 'You will no longer receive notifications')
      return true
    } catch (error) {
      console.error('Error disabling notifications:', error)
      toast.error('Error', 'Failed to disable notifications')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, fcmToken, toast])

  // Toggle notifications
  const toggleNotifications = useCallback(async () => {
    if (isEnabled) {
      return disableNotifications()
    } else {
      return enableNotifications()
    }
  }, [isEnabled, enableNotifications, disableNotifications])

  return {
    isSupported,
    isEnabled,
    isLoading,
    fcmToken,
    enableNotifications,
    disableNotifications,
    toggleNotifications
  }
}

// Send local notification (for testing)
export function sendLocalNotification(payload: NotificationPayload) {
  if (!('Notification' in window)) return

  if (Notification.permission === 'granted') {
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'local-notification',
      data: payload.data
    })
  }
}
