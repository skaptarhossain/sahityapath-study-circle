import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        setShowReconnected(true)
        setTimeout(() => setShowReconnected(false), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <AnimatePresence>
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white px-4 py-3 shadow-lg"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <WifiOff className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">ইন্টারনেট সংযোগ নেই</p>
                <p className="text-xs text-white/80">অফলাইন মোডে সীমিত ফিচার কাজ করবে</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRefresh}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              রিফ্রেশ
            </Button>
          </div>
        </motion.div>
      )}

      {/* Reconnected Toast */}
      {showReconnected && isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-emerald-500 text-white px-4 py-3 shadow-lg"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Wifi className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">সংযোগ পুনরায় স্থাপিত!</p>
              <p className="text-xs text-white/80">আপনি এখন অনলাইনে আছেন</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for checking online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
