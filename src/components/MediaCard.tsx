import React, { useState } from 'react'
import { MediaItem } from '../types'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Marquee } from './Marquee'

interface MediaCardProps {
  item: MediaItem
  onClick: (item: MediaItem) => void
}

export const MediaCard = React.memo(function MediaCard({ item, onClick }: MediaCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div 
      layoutId={`card-${item.id}`}
      className="relative aspect-[2/3] cursor-pointer overflow-hidden group bg-gray-100 m-0 p-0"
      onClick={() => onClick(item)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {item.signed_url || item.cover_url ? (
        <div className="relative w-full h-full bg-gray-100">
           {/* Skeleton background while loading */}
           {!isLoaded && (
               <div className="absolute inset-0 bg-gray-200 animate-pulse" />
           )}
           <img 
             src={item.signed_url || item.cover_url || ''} 
             alt={item.title} 
             className={`w-full h-full object-cover transition-all duration-300 ease-out group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
             loading="lazy"
             onLoad={() => setIsLoaded(true)}
           />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-center p-2 bg-gray-100">
          <span className="text-sm font-semibold text-gray-400">{item.title}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-white via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        <div className="text-gray-900 text-sm w-full">
          <Marquee text={item.title} className="font-bold text-sm tracking-tight" isHovered={isHovered} />
          <p className="text-xs">
            {item.type === 'tv' && item.seasons 
              ? `TV (${item.seasons} season${item.seasons === 1 ? '' : 's'})` 
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
