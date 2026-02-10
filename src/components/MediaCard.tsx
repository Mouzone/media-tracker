import { MediaItem } from '../types'
import { motion } from 'framer-motion'

interface MediaCardProps {
  item: MediaItem
  onClick: (item: MediaItem) => void
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  return (
    <motion.div 
      layoutId={`card-${item.id}`}
      className="relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-shadow group bg-gray-200 dark:bg-gray-800"
      onClick={() => onClick(item)}
      whileHover={{ scale: 1.02 }}
    >
      {item.cover_url ? (
        <img 
          src={item.cover_url} 
          alt={item.title} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-center p-2">
          <span className="text-sm font-semibold">{item.title}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
        <div className="text-white text-sm">
          <p className="font-bold truncate">{item.title}</p>
          <p className="text-xs">{item.type} • {item.rating ? `${item.rating}/5` : 'Unrated'}</p>
        </div>
      </div>
    </motion.div>
  )
}
