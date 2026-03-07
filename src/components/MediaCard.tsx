import React, { useState, useEffect } from 'react'
import { MediaItem } from '../types'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Marquee } from './Marquee'
import { useInView } from '../hooks/useInView'

interface MediaCardProps {
  item: MediaItem
  onClick: (item: MediaItem) => void
}

export const MediaCard = React.memo(function MediaCard({ item, onClick }: MediaCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [ref, inView] = useInView({ rootMargin: '600px' })
  const [hasEnteredView, setHasEnteredView] = useState(false)

  useEffect(() => {
    if (inView && !hasEnteredView) {
      setHasEnteredView(true)
    }
  }, [inView, hasEnteredView])

  return (
    <motion.div 
      layoutId={`card-${item.id}`}
      className="relative aspect-[2/3] cursor-pointer overflow-hidden group bg-gray-200 dark:bg-gray-800 m-0 p-0"
      onClick={() => onClick(item)}
    >
      {item.signed_url || item.cover_url ? (
        <div ref={ref} className="relative w-full h-full bg-gray-200 dark:bg-gray-800">
           {/* Skeleton background while loading */}
           {!isLoaded && (
               <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 animate-pulse" />
           )}
           {hasEnteredView && (
             <img 
               src={item.signed_url || item.cover_url || ''} 
               alt={item.title} 
               className={`w-full h-full object-cover transition duration-500 ease-out group-hover:scale-105 transform-gpu ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
               onLoad={() => setIsLoaded(true)}
             />
           )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-center p-2 bg-gray-200 dark:bg-gray-800">
          <span className="text-sm font-semibold text-gray-400 dark:text-gray-300">{item.title}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-white dark:from-gray-900 via-white/80 dark:via-gray-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end p-3 pointer-events-none">
        <div className="text-gray-900 dark:text-gray-100 text-sm w-full">
          <Marquee text={item.title} className="font-bold text-sm tracking-tight" />
          <p className="text-xs">
            {item.type === 'tv' 
              ? (item.seasons ? `TV (${item.seasons} season${item.seasons === 1 ? '' : 's'})` : 'TV')
              : <span className="capitalize">{item.type}</span>} 
            {' • '}
            {item.rating === 'like' && <ThumbsUp className="w-4 h-4 inline text-green-500" />}
            {item.rating === 'dislike' && <ThumbsDown className="w-4 h-4 inline text-red-500" />}
            {!item.rating && 'Unrated'}
          </p>
        </div>
      </div>
    </motion.div>
  )
})
