import { createFileRoute } from '@tanstack/react-router'
import { MediaCard } from '../../components/MediaCard'
import { MediaModal } from '../../components/MediaModal'
import { useState, useEffect } from 'react'
import { MediaItem } from '../../types'
import { supabase } from '../../utils/supabase'

export const Route = createFileRoute('/_layout/')({
  component: Dashboard,
})

function Dashboard() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchItems = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('media_items').select('*').order('created_at', { ascending: false })
      
      if (error || !data) {
          console.warn("Using mock data")
           const mockData: MediaItem[] = [
            {
                id: '1',
                user_id: 'mock',
                title: 'Inception',
                type: 'movie',
                cover_url: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
                date_finished: '2023-11-15',
                review: 'Mind bending!',
                tags: ['scifi', 'thriller'],
                rating: 5,
                created_at: new Date().toISOString()
            },
            {
                id: '2',
                user_id: 'mock',
                title: 'Breaking Bad',
                type: 'tv',
                cover_url: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
                date_finished: '2023-10-01',
                review: 'Best show ever.',
                tags: ['drama', 'crime'],
                rating: 5,
                created_at: new Date().toISOString()
            }
        ]
        setMediaItems(mockData)
      } else {
          setMediaItems(data as MediaItem[])
      }
      setLoading(false)
  }

  useEffect(() => {
      fetchItems()
  }, [])

  const handleCardClick = (item: MediaItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setSelectedItem(null)
    setIsModalOpen(false)
  }



  return (
    <div>
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-bold tracking-tight">My Wall</h1>
         <button 
            onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
         >
            + Add Item
         </button>
      </div>
      
      {loading ? (
          <p className="text-center py-10">Loading...</p>
      ) : mediaItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
              <p className="text-xl">Your wall is empty.</p>
              <p>Start tracking your movies, TV shows, and books!</p>
          </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {mediaItems.map(item => (
            <MediaCard key={item.id} item={item} onClick={handleCardClick} />
            ))}
        </div>
      )}

      <MediaModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={handleClose}
      />
    </div>
  )
}
