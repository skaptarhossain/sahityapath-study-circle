import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface LoadingProps {
  fullScreen?: boolean
}

export function Loading({ fullScreen = false }: LoadingProps) {
  const containerClass = fullScreen 
    ? "min-h-screen flex items-center justify-center bg-background"
    : "flex items-center justify-center p-8"
    
  return (
    <div className={containerClass}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
        <p className="text-muted-foreground">Loading...</p>
      </motion.div>
    </div>
  )
}

export default Loading
