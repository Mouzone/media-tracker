import { createFileRoute, Link } from '@tanstack/react-router'
import { MediaCard } from '../../components/MediaCard'
import { MediaModal } from '../../components/MediaModal'
import { SkeletonGrid } from '../../components/SkeletonLoader'
import React, { useState, useEffect, useMemo } from 'react'
import { MediaItem } from '../../types'
import { useMediaItems } from '../../hooks/useMediaItems'
import { useInView } from '../../hooks/useInView'
import { useSmartPreloader } from '../../hooks/useSmartPreloader'
import { useDebounce } from '../../hooks/useDebounce'
import { useTheme } from '../../contexts/ThemeContext'

import { FilterBar } from '../../components/FilterBar'

export const Route = createFileRoute('/_layout/')({
  component: Dashboard,
})

function Dashboard() {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'movie' | 'tv' | 'book' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Floating Search/Filter Panel State
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false)

  // FAB Drawer State
  const [isFabOpen, setIsFabOpen] = useState(false)

  // Filter & Sort State
  const [filterStatus, setFilterStatus] = useState<'finished' | 'dropped' | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'rating'>('date')
  const [filterTags, setFilterTags] = useState<string[]>([])

  const handleReset = () => {
    setSearchQuery('')
    setActiveTab(null)
    setFilterStatus('all')
    setSortBy('date')
    setFilterTags([])
  }

  // Debounce search query to prevent excessive API calls while typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  
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
          search: debouncedSearchQuery || undefined,
          sort: sortBy,
          status: filterStatus === 'all' ? undefined : filterStatus,
          tags: filterTags,
      }
  })

  // Flatten the pages into a single array
  const mediaItems = useMemo(() => {
      return data?.pages.flatMap(page => page) || []
  }, [data])

  // Use the new smart preloader hook
  // It handles all the logic for "blocking" page 1 vs "background" preloading
  const { shouldShowSkeleton } = useSmartPreloader({ data, isLoading })

  // Normal prefetching: Trigger next page load when user is within 400px of the bottom
  // This provides a balance between seamless scrolling and performance.
  const observerOptions = useMemo(() => ({ rootMargin: '400px' }), [])
  const [ref, inView] = useInView(observerOptions)

  useEffect(() => {
      // We need to check !isFetchingNextPage to avoid spamming, but we MUST include it in dependencies
      // so that when a fetch FINISHES (isFetchingNextPage goes from true -> false), we re-evaluate
      // and fetch the NEXT page if we are still in view (which we consistently are with 4000px margin).
      if (inView && hasNextPage && !shouldShowSkeleton && !isFetchingNextPage) {
          fetchNextPage()
      }
  }, [inView, hasNextPage, fetchNextPage, shouldShowSkeleton, isFetchingNextPage])


  const handleCardClick = React.useCallback((item: MediaItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }, [])

  const handleClose = () => {
    setSelectedItem(null)
    setIsModalOpen(false)
  }

  const handleTabClick = (type: 'movie' | 'tv' | 'book') => {
    setActiveTab(current => current === type ? null : type)
  }

  // Get all unique tags for the modal autocomplete and filter bar
  // Ideally this should come from a separate query or be aggregated from all loaded data
  // For now, deriving from loaded items is a good start, though imperfect for global filtering
  const allTags = useMemo(() => {
     return Array.from(new Set(mediaItems.flatMap(item => item.tags || []))).sort()
  }, [mediaItems])

  // Click outside to close search panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const panel = document.getElementById('search-filter-panel');
      const searchBtn = document.getElementById('search-toggle-btn');
      if (
        isSearchPanelOpen && 
        panel && 
        !panel.contains(event.target as Node) &&
        searchBtn &&
        !searchBtn.contains(event.target as Node)
      ) {
        setIsSearchPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchPanelOpen]);

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-gray-900 pb-32 overflow-x-hidden transition-colors duration-300">
      
      {/* Media Wall Grid */}
      <div className="w-full relative">
        {isError ? (
            <div className="flex justify-center items-center h-64"><p className="text-red-400 font-medium">Error loading media. Please try again.</p></div>
        ) : shouldShowSkeleton ? (
            <SkeletonGrid count={20} />
        ) : mediaItems.length === 0 ? (
            <div className="flex justify-center items-center h-64"><p className="text-gray-500 font-medium tracking-wide">Nothing found in this view.</p></div>
        ) : (
          <>
              {/* Flush Grid Layout */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-0">
                  {mediaItems.map(item => (
                    <MediaCard key={item.id} item={item} onClick={handleCardClick} />
                  ))}
              </div>
              {/* Loading trigger element for infinite scroll */}
              <div ref={ref} className="h-16 flex justify-center items-center mt-4 mb-8">
                  {isFetchingNextPage && (
                      <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
                          <span className="text-gray-500 font-medium tracking-wider uppercase">Loading...</span>
                      </div>
                  )}
              </div>
          </>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col items-center gap-3 sm:gap-4">
        {/* Expandable Menu Items */}
        <div className={`flex flex-col items-center gap-3 sm:gap-4 transition-all duration-300 ease-out origin-bottom ${isFabOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-50 pointer-events-none'}`}>
            {/* Toggle Theme Button */}
            <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-md hover:scale-110 active:scale-95 border border-gray-200/60 dark:border-gray-700/60 transition-all duration-300"
                aria-label="Toggle Dark Mode"
                title="Toggle Theme"
            >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                )}
            </button>

            {/* Toggle Search/Filter Panel */}
            <button 
                id="search-toggle-btn"
                onClick={() => setIsSearchPanelOpen(!isSearchPanelOpen)}
                className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-md transition-all duration-300 ${isSearchPanelOpen ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white scale-110 border-gray-300 dark:border-gray-600' : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 hover:scale-110 active:scale-95 border border-gray-200/60 dark:border-gray-700/60'}`}
                aria-label="Toggle Search and Filters"
                title="Search & Filter"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>

            {/* Bulk Upload Button */}
            <Link 
                to="/bulk-upload"
                className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-md hover:scale-110 active:scale-95 border border-gray-200/60 dark:border-gray-700/60 transition-all duration-300"
                aria-label="Bulk Add"
                title="Bulk Add"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </Link>

            {/* Create Media Button */}
            <button 
                onClick={() => { setIsFabOpen(false); setSelectedItem(null); setIsModalOpen(true); }}
                className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full shadow-xl dark:shadow-gray-900/50 hover:shadow-2xl hover:scale-110 active:scale-95 border border-gray-200 dark:border-gray-700 transition-all duration-300 group"
                aria-label="Add new item"
                title="Add Single Item"
            >
                <svg className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </button>
        </div>

        {/* Main Drawer Button */}
        <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`flex items-center justify-center w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-full shadow-xl dark:shadow-gray-900/50 hover:shadow-2xl active:scale-95 transition-all duration-300 z-50 ${isFabOpen ? 'rotate-180' : 'hover:scale-105'}`}
            aria-label="Toggle Actions"
        >
            <svg 
              className="w-7 h-7" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isFabOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
        </button>
      </div>

      {/* Solid Compact Floating Bottom Search/Filter Panel */}
      <div className={`fixed bottom-0 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:bottom-6 sm:w-[90%] sm:max-w-2xl z-40 transition-transform duration-500 ease-out ${isSearchPanelOpen ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0 pointer-events-none'}`}>
        <div id="search-filter-panel" className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 p-4 sm:p-5 mx-2 sm:mx-0 mb-2 sm:mb-0">
          <div className="flex flex-col gap-3">
             {/* Top Row: Search & Tabs */}
             <div className="flex flex-col sm:flex-row gap-3">
               <div className="relative flex-1">
                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                   <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                 </div>
                 <input
                     type="text"
                     placeholder="Search titles..."
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-10 py-2.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 transition-all font-medium text-sm"
                 />
                 {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Clear search"
                        title="Clear Search"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    </button>
                 )}
               </div>
               
               <div className="flex p-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shrink-0">
                  <button onClick={() => handleTabClick('movie')} className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${activeTab === 'movie' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-200/60 dark:border-gray-600' : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200'}`}>Movies</button>
                  <button onClick={() => handleTabClick('tv')} className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${activeTab === 'tv' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-200/60 dark:border-gray-600' : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200'}`}>TV Series</button>
                  <button onClick={() => handleTabClick('book')} className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${activeTab === 'book' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-200/60 dark:border-gray-600' : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200'}`}>Books</button>
               </div>
             </div>
             
             {/* Bottom Row: Filter Bar */}
             <FilterBar 
               status={filterStatus}
               setStatus={setFilterStatus}
               sortBy={sortBy}
               setSortBy={setSortBy}
               selectedTags={filterTags}
               setSelectedTags={setFilterTags}
               availableTags={allTags}
               onReset={handleReset}
             />
          </div>
        </div>
      </div>

      <MediaModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={handleClose}
        existingTags={allTags}
      />
    </div>
  )
}

