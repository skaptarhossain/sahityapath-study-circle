import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDAY6SbxMjFxgzzV4_drApxuiit4lnJmfw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "group-study-3b0ee.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "group-study-3b0ee",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "group-study-3b0ee.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "209242981722",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:209242981722:web:817829ea089db024851f63",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BYKDT76GTT"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence.')
  }
})

// Firebase Cloud Messaging (FCM) for push notifications
let messaging: ReturnType<typeof getMessaging> | null = null

// Initialize messaging only if supported
export const initializeMessaging = async () => {
  try {
    const supported = await isSupported()
    if (supported) {
      messaging = getMessaging(app)
      return messaging
    }
    return null
  } catch (error) {
    console.warn('FCM not supported:', error)
    return null
  }
}

// Get FCM token for push notifications
export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      messaging = await initializeMessaging()
    }
    if (!messaging) return null

    // Get the service worker registration
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      console.warn('No service worker registration found')
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BKagOny0KF_2pCJQ3m....', // You need to generate this
      serviceWorkerRegistration: registration
    })

    return token
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) {
    initializeMessaging().then((msg) => {
      if (msg) {
        onMessage(msg, callback)
      }
    })
  } else {
    onMessage(messaging, callback)
  }
}

export default app
