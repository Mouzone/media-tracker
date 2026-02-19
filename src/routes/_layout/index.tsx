import { createFileRoute, Link } from '@tanstack/react-router'
import { MediaCard } from '../../components/MediaCard'
import { MediaModal } from '../../components/MediaModal'
import { SkeletonGrid } from '../../components/SkeletonLoader'
import { useState, useEffect, useMemo } from 'react'
import { MediaItem } from '../../types'
import { useMediaItems } from '../../hooks/useMediaItems'
import { useInView } from '../../hooks/useInView'
import { useSmartPreloader } from '../../hooks/useSmartPreloader'

export const Route = createFileRoute('/_layout/')({
  component: Dashboard,
})

function Dashboard() {
  const [activeTab, setActiveTab] = useState<'movie' | 'tv' | 'book' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Debounce search query could be added here for better performance
  
  const { 
      data, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage, 
      isLoading,
      isError 
  } = useMediaItems({
      filter: {
          type: activeTab || undefined,
          search: searchQuery || undefined,
          sort: 'date'
      }
  })

  // Flatten the pages into a single array
  const mediaItems = useMemo(() => {
      return data?.pages.flatMap(page => page) || []
  }, [data])

  // Use the new smart preloader hook
  // It handles all the logic for "blocking" page 1 vs "background" preloading
  const { shouldShowSkeleton } = useSmartPreloader({ data, isLoading })

  // Aggressive prefetching: Trigger next page load when user is within 4000px of the bottom
  // This is roughly 4-5 viewports, effectively "prefetching" the next page immediately.
  const observerOptions = useMemo(() => ({ rootMargin: '4000px' }), [])
  const [ref, inView] = useInView(observerOptions)

  useEffect(() => {
      // We need to check !isFetchingNextPage to avoid spamming, but we MUST include it in dependencies
      // so that when a fetch FINISHES (isFetchingNextPage goes from true -> false), we re-evaluate
      // and fetch the NEXT page if we are still in view (which we consistently are with 4000px margin).
      if (inView && hasNextPage && !shouldShowSkeleton && !isFetchingNextPage) {
          fetchNextPage()
      }
  }, [inView, hasNextPage, fetchNextPage, shouldShowSkeleton, isFetchingNextPage])


  const handleCardClick = (item: MediaItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setSelectedItem(null)
    setIsModalOpen(false)
  }

  const handleTabClick = (type: 'movie' | 'tv' | 'book') => {
    setActiveTab(current => current === type ? null : type)
  }

  const getTabClass = (type: 'movie' | 'tv' | 'book') => {
    const base = "px-3 py-1.5 rounded-md font-medium transition-colors"
    const active = "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    const inactive = "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
    return `${base} ${activeTab === type ? active : inactive}`
  }

  // Get all unique tags for the modal autocomplete
  const allTags = useMemo(() => {
     return Array.from(new Set(mediaItems.flatMap(item => item.tags || [])))
  }, [mediaItems])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-4 items-center">
            <button onClick={() => handleTabClick('movie')} className={getTabClass('movie')}>Movies</button>
            <button onClick={() => handleTabClick('tv')} className={getTabClass('tv')}>TV Shows</button>
            <button onClick={() => handleTabClick('book')} className={getTabClass('book')}>Books</button>
         </div>
         <div className="flex-1 max-w-md mx-4">
            <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
      
      {isError ? (
          <p className="text-center py-10 text-red-500">Error loading items</p>
      ) : shouldShowSkeleton ? (
          <SkeletonGrid count={20} />
      ) : mediaItems.length === 0 ? (
          <p className="text-center py-10">No items found.</p>
      ) : (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {mediaItems.map(item => (
                <MediaCard key={item.id} item={item} onClick={handleCardClick} />
                ))}
            </div>
            {/* Loading trigger element */}
            <div ref={ref} className="h-10 flex justify-center items-center mt-4">
                {isFetchingNextPage && <span className="text-gray-500">Loading more...</span>}
            </div>
        </>
      )}

      <MediaModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={handleClose}
        existingTags={allTags}
      />
    </div>
  )
}

