import React, { useState } from 'react'
import { MediaItem } from '../types'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import { Marquee } from './Marquee'

interface MediaCardProps {
  item: MediaItem
  onClick: (item: MediaItem) => void
  index?: number
}

export const MediaCard = React.memo(function MediaCard({ item, onClick, index = 100 }: MediaCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const isAboveFold = index < 15

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      layoutId={`card-${item.id}`}
      layout
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative aspect-[2/3] cursor-pointer overflow-hidden group bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl m-0 p-0"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '200px 300px' }}
      onClick={() => onClick(item)}
    >
      {item.signed_url || item.cover_url ? (
        <div className="relative w-full h-full bg-gray-200 dark:bg-gray-800">
           {/* Skeleton background while loading */}
           {!isLoaded && (
               <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent -translate-x-full animate-shimmer" />
               </div>
           )}
           <img 
             src={item.signed_url || item.cover_url || ''} 
             alt={item.title} 
             loading={isAboveFold ? "eager" : "lazy"}
             // @ts-ignore - React types don't officially support fetchpriority yet but it works in DOM
             fetchpriority={isAboveFold ? "high" : "auto"}
             className={`w-full h-full object-cover rounded-2xl ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
             onLoad={() => setIsLoaded(true)}
           />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-center p-2 bg-gray-200 dark:bg-gray-800">
          <span className="text-sm font-semibold text-gray-400 dark:text-gray-300">{item.title}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 top-[40%] bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4 pointer-events-none">
        <div className="text-white w-full drop-shadow-md">
          <Marquee text={item.title} className="font-extrabold text-lg tracking-tight mb-1" />
          <p className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
            {item.type === 'tv' 
              ? (item.seasons ? `TV (${item.seasons} season${item.seasons === 1 ? '' : 's'})` : 'TV')
              : <span className="capitalize">{item.type}</span>} 
            <span className="text-gray-500">•</span>
            {item.rating === 'like' && <ThumbsUp className="w-4 h-4 inline text-green-400" />}
            {item.rating === 'ok' && <Minus className="w-4 h-4 inline text-gray-400 dark:text-gray-300" />}
            {item.rating === 'dislike' && <ThumbsDown className="w-4 h-4 inline text-red-400" />}
            {!item.rating && 'Unrated'}
          </p>
        </div>
      </div>
    </motion.div>
  )
})
