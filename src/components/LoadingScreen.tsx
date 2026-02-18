
import { motion } from 'framer-motion'

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center">
        <motion.div
           className="w-16 h-16 border-4 border-gray-300 dark:border-gray-700 border-t-blue-500 rounded-full"
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="mt-4 text-gray-500 dark:text-gray-400 font-medium"
        >
          Loading your library...
        </motion.p>
      </div>
    </div>
  )
}
