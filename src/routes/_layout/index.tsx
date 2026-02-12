import { createFileRoute, Link } from '@tanstack/react-router'
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
      try {
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
                    rating: 'like',
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
                    rating: 'like',
                    created_at: new Date().toISOString()
                }
            ]
            setMediaItems(mockData)
          } else {
              // Resolve signed URLs for private paths (or legacy public URLs)
              const urlToPathMap: Record<string, string> = {}
              const pathsToSign: string[] = []
              const items = data as MediaItem[]

              items.forEach(item => {
                  if (!item.cover_url) return

                  if (!item.cover_url.startsWith('http')) {
                      urlToPathMap[item.cover_url] = item.cover_url
                      pathsToSign.push(item.cover_url)
                  } else if (item.cover_url.includes('/covers/')) {
                      // Handle legacy public URLs that are now private
                      // Format: .../storage/v1/object/public/covers/userId/filename
                      const parts = item.cover_url.split('/covers/')
                      if (parts.length > 1) {
                          const path = parts[1] // "userId/filename"
                          urlToPathMap[item.cover_url] = path
                          pathsToSign.push(path)
                      }
                  }
              })
              
              if (pathsToSign.length > 0) {
                  const { getSignedUrls } = await import('../../services/storage')
                  const signedUrls = await getSignedUrls(pathsToSign)
                  
                  const itemsWithSignedUrls = (data as MediaItem[]).map(item => {
                      if (item.cover_url) {
                          const path = urlToPathMap[item.cover_url]
                          if (path && signedUrls[path]) {
                              return { ...item, signed_url: signedUrls[path] }
                          }
                      }
                      return item
                  })
                  setMediaItems(itemsWithSignedUrls)
              } else {
                  setMediaItems(data as MediaItem[])
              }
          }
      } catch (err) {
          console.error("Failed to fetch items:", err)
      } finally {
          setLoading(false)
      }
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


  const [activeTab, setActiveTab] = useState<'movie' | 'tv' | 'book' | null>(null)

  const handleTabClick = (type: 'movie' | 'tv' | 'book') => {
    setActiveTab(current => current === type ? null : type)
  }

  const filteredItems = activeTab 
    ? mediaItems.filter(item => item.type === activeTab)
    : mediaItems

  const getTabClass = (type: 'movie' | 'tv' | 'book') => {
    const base = "px-3 py-1.5 rounded-md font-medium transition-colors"
    const active = "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    const inactive = "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
    return `${base} ${activeTab === type ? active : inactive}`
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-4 items-center">
            <button onClick={() => handleTabClick('movie')} className={getTabClass('movie')}>Movies</button>
            <button onClick={() => handleTabClick('tv')} className={getTabClass('tv')}>TV Shows</button>
            <button onClick={() => handleTabClick('book')} className={getTabClass('book')}>Books</button>
         </div>
         <div className="flex gap-2">
            <Link 
                to="/bulk-upload"
                className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
            >
                Bulk Upload
            </Link>
            <button 
                onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
                + Add Item
            </button>
         </div>
      </div>
      
      {loading ? (
          <p className="text-center py-10">Loading...</p>
      ) : filteredItems.length === 0 ? (
          null
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredItems.map(item => (
            <MediaCard key={item.id} item={item} onClick={handleCardClick} />
            ))}
        </div>
      )}

      <MediaModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={handleClose}
        existingTags={Array.from(new Set(mediaItems.flatMap(item => item.tags || [])))}
      />
    </div>
  )
}
