import { create } from 'zustand'
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  updateDoc,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { UserNotification, ContentReport } from '@/types'

// Collection names
const NOTIFICATIONS = 'notifications'
const REPORTS = 'content-reports'

interface NotificationState {
  notifications: UserNotification[]
  unreadCount: number
  isLoading: boolean
  
  // Actions
  setNotifications: (notifications: UserNotification[]) => void
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: (userId: string) => Promise<void>
  createNotification: (notification: UserNotification) => Promise<void>
  
  // Report actions
  createReport: (report: ContentReport) => Promise<void>
  
  // Subscriptions
  subscribeToNotifications: (userId: string) => Unsubscribe
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.isRead).length
    set({ notifications, unreadCount })
  },
  
  markAsRead: async (notificationId) => {
    try {
      await updateDoc(doc(db, NOTIFICATIONS, notificationId), { isRead: true })
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  },
  
  markAllAsRead: async (userId) => {
    try {
      const unreadNotifications = get().notifications.filter(n => !n.isRead)
      for (const notification of unreadNotifications) {
        await updateDoc(doc(db, NOTIFICATIONS, notification.id), { isRead: true })
      }
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }))
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  },
  
  createNotification: async (notification) => {
    try {
      await setDoc(doc(db, NOTIFICATIONS, notification.id), notification)
    } catch (err) {
      console.error('Error creating notification:', err)
    }
  },
  
  createReport: async (report) => {
    try {
      // Save report
      await setDoc(doc(db, REPORTS, report.id), report)
      
      // Create notification for content creator
      const notification: UserNotification = {
        id: `notif-${Date.now()}`,
        userId: report.creatorId,
        type: 'report',
        title: 'Content Reported',
        message: `Your ${report.contentType} "${report.contentTitle}" has been reported: ${report.reportType}`,
        link: `/library-admin`,
        isRead: false,
        createdAt: Date.now(),
      }
      
      await setDoc(doc(db, NOTIFICATIONS, notification.id), notification)
    } catch (err) {
      console.error('Error creating report:', err)
      throw err
    }
  },
  
  subscribeToNotifications: (userId) => {
    set({ isLoading: true })
    
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => doc.data() as UserNotification)
      const unreadCount = notifications.filter(n => !n.isRead).length
      set({ notifications, unreadCount, isLoading: false })
    }, (error) => {
      console.error('Error subscribing to notifications:', error)
      set({ isLoading: false })
    })
  },
}))
