import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

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

export default app
