import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { MediaItem, MediaType, StatusType } from '../types'
import { searchMedia, SearchResult } from '../services/api'
import { supabase } from '../utils/supabase'
import { X, Search, Plus, Loader2, Calendar, CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'

interface MediaModalProps {
  item: MediaItem | null
  isOpen: boolean
  onClose: () => void
  existingTags?: string[]
}

export function MediaModal({ item, isOpen, onClose, existingTags = [] }: MediaModalProps) {
  const [type, setType] = useState<MediaType>('movie')
  const [status, setStatus] = useState<StatusType>('finished')
  const [seasons, setSeasons] = useState<number | ''>('')
  const [language, setLanguage] = useState('English')
  const [title, setTitle] = useState('')
  const [review, setReview] = useState('')
  const [dateFinished, setDateFinished] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [coverUrl, setCoverUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form when item changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setType(item.type)
        setStatus(item.status || 'finished')
        setSeasons(item.seasons || '')
        setLanguage(item.language || 'English')
        setTitle(item.title)
        setReview(item.review || '')
        setDateFinished(item.date_finished || '')
        setRating(item.rating || 0)
        setCoverUrl(item.cover_url || '')
        setTags(item.tags || [])
      } else {
        // Reset defaults for new item
        setType('movie')
        setStatus('finished')
        setSeasons('')
        setLanguage('English')
        setTitle('')
        setReview('')
        setDateFinished(new Date().toISOString().split('T')[0]) // Default to today
        setRating(0)
        setCoverUrl('')
        setTags([])
      }
      setSearchResults([])
      setShowResults(false)
      setTagInput('')
    }
  }, [isOpen, item])

  // Search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (title.length > 2 && !item) { // Only search on new items or if explicitly requested
         setIsSearching(true)
         const results = await searchMedia(title, type)
         setSearchResults(results)
         setIsSearching(false)
         setShowResults(true)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [title, type, item])

  const handleSave = async () => {
    setIsLoading(true)
    
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id

    if (!userId) return

    const itemData = {
        user_id: userId,
        title,
        type,
        status,
        seasons: seasons ? Number(seasons) : null,
        language,
        cover_url: coverUrl,
        date_finished: dateFinished || null,
        review,
        tags,
        rating: rating > 0 ? rating : null
    }

    let error
    if (item) {
        const { error: updateError } = await supabase
            .from('media_items')
            .update(itemData)
            .eq('id', item.id)
        error = updateError
    } else {
        const { error: insertError } = await supabase
            .from('media_items')
            .insert(itemData)
        error = insertError
    }

    setIsLoading(false)
    if (!error) {
        onClose()
        window.location.reload() // Simple refresh to show new data
    } else {
        console.error("Error saving:", error)
        alert("Failed to save item")
    }
  }

  const handleResultSelect = (result: SearchResult) => {
    setTitle(result.title)
    if (result.cover_url) setCoverUrl(result.cover_url)
    setShowResults(false)
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
        e.preventDefault()
        if (!tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
        }
        setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
        setTags(tags.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove))
  }
  
  const suggestedTags = tagInput 
    ? existingTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
    : []

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 dark:text-white mb-6 flex justify-between items-center">
                  {item ? 'Edit Media' : 'Add New Media'}
                  <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Title>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Cover & Type */}
                    <div className="space-y-6">
                         {/* Type Selection */}
                         <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            {(['movie', 'tv', 'book'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={clsx(
                                        "flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all",
                                        type === t 
                                            ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" 
                                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                    )}
                                >
                                    {t === 'tv' ? 'TV Show' : t}
                                </button>
                            ))}
                        </div>

                         {/* Status Selection */}
                         <div className="flex gap-2">
                            <button
                                onClick={() => setStatus('finished')}
                                className={clsx(
                                    "flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all flex items-center justify-center gap-2",
                                    status === 'finished' 
                                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 ring-1 ring-green-500" 
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                )}
                            >
                                <CheckCircle className="w-4 h-4" />
                                Finished
                            </button>
                            <button
                                onClick={() => setStatus('dropped')}
                                className={clsx(
                                    "flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all flex items-center justify-center gap-2",
                                    status === 'dropped' 
                                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 ring-1 ring-red-500" 
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                )}
                            >
                                <XCircle className="w-4 h-4" />
                                Dropped
                            </button>
                        </div>
                        
                        {/* Seasons Input (TV Only) */}
                        {type === 'tv' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seasons Watched</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. 1"
                                    value={seasons}
                                    onChange={(e) => setSeasons(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                        )}

                        {/* Cover Image */}
                        <div className="relative aspect-[2/3] w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 group">
                            {coverUrl ? (
                                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="mb-2">No Cover</div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <input 
                                    type="text" 
                                    placeholder="Paste URL..." 
                                    className="w-3/4 p-2 text-sm rounded bg-white/90 text-black placeholder-gray-500 outline-none"
                                    value={coverUrl}
                                    onChange={(e) => setCoverUrl(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="space-y-4">
                        {/* Language Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
                            <select
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                {['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese', 'Hindi', 'Italian', 'Portuguese', 'Russian', 'Arabic'].map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>

                        {/* Title with Search */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="text" 
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Search title..."
                                        value={title}
                                        onChange={(e) => {
                                            setTitle(e.target.value)
                                            setShowResults(true)
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                setIsSearching(true)
                                                searchMedia(title, type).then(results => {
                                                    setSearchResults(results)
                                                    setIsSearching(false)
                                                    setShowResults(true)
                                                })
                                            }
                                        }}
                                    />
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setIsSearching(true)
                                        const results = await searchMedia(title, type)
                                        setSearchResults(results)
                                        setIsSearching(false)
                                        setShowResults(true)
                                    }}
                                    className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                    disabled={isSearching || !title}
                                >
                                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
                                </button>
                            </div>
                            
                            {/* Search Results Dropdown */}
                            {showResults && (searchResults.length > 0 || isSearching || (title.length > 2 && searchResults.length === 0 && !isSearching)) && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                                    {isSearching && (
                                        <div className="p-4 text-center text-gray-500">Searching...</div>
                                    )}
                                    {!isSearching && searchResults.length === 0 && (
                                        <div className="p-4 text-center text-gray-500">No results found</div>
                                    )}
                                    {!isSearching && searchResults.map((result) => (
                                        <button
                                            key={result.id}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b last:border-0 dark:border-gray-700"
                                            onClick={() => handleResultSelect(result)}
                                        >
                                            {result.cover_url && <img src={result.cover_url} className="w-8 h-12 object-cover rounded" />}
                                            <div>
                                                <div className="font-medium">{result.title}</div>
                                                <div className="text-xs text-gray-500">{result.year}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Date Finished */}
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Finished</label>
                            <div className="relative">
                                <input 
                                    type="date" 
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={dateFinished}
                                    onChange={(e) => setDateFinished(e.target.value)}
                                />
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Rating */}
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                             <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-2xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                             </div>
                        </div>

                         {/* Tags */}
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                            <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[42px]">
                                {tags.map(tag => (
                                    <span key={tag} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        {tag}
                                        <button onClick={() => removeTag(tag)} className="hover:text-blue-600 dark:hover:text-blue-300"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                                <input 
                                    className="flex-1 bg-transparent text-sm min-w-[60px] outline-none"
                                    placeholder={tags.length === 0 ? "Type and enter..." : ""}
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                />
                            </div>
                            {/* Tag Suggestions */}
                            {suggestedTags.length > 0 && (
                                <div className="absolute z-10 mt-1 max-h-32 w-full overflow-y-auto rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                                    {suggestedTags.map(tag => (
                                        <button
                                            key={tag}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                            onClick={() => {
                                                setTags([...tags, tag])
                                                setTagInput('')
                                            }}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Review */}
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Review</label>
                             <textarea 
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="What did you think?"
                             />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-lg border border-transparent bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSave}
                    disabled={!title || isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Item
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
