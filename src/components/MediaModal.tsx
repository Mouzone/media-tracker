import { Dialog } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { MediaItem } from '../types'


interface MediaModalProps {
  item: MediaItem | null
  isOpen: boolean
  onClose: () => void
}

export function MediaModal({ item, isOpen, onClose }: MediaModalProps) {
    // Placeholder for form state

    
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog static open={isOpen} onClose={onClose} className="relative z-50">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            aria-hidden="true" 
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
             <Dialog.Panel as={motion.div}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl"
             >
                <Dialog.Title className="text-xl font-bold mb-4">
                    {item ? 'Edit Item' : 'Add New Item'}
                </Dialog.Title>
                
                {/* Form fields here */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Title</label>
                        <input className="w-full border rounded p-2 dark:bg-gray-800" defaultValue={item?.title} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Review</label>
                        <textarea className="w-full border rounded p-2 dark:bg-gray-800" defaultValue={item?.review || ''} />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded">Save</button>
                </div>
             </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
