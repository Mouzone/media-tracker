import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { MediaItem, MediaType, StatusType } from '../types'
import { searchMedia, SearchResult } from '../services/api'
import { uploadCoverImage, validateImageResponse } from '../services/storage'
import { supabase } from '../utils/supabase'
import { X, Search, Plus, Loader2, Calendar, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
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
  const [rating, setRating] = useState<'like' | 'dislike' | null>(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [newCoverPath, setNewCoverPath] = useState<string | null>(null)
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
        setRating(item.rating || null)
        setTags(item.tags || [])
        
        // Handle signed URL resolution
        const isPath = item.cover_url && !item.cover_url.startsWith('http')
        const isLegacyUrl = item.cover_url && item.cover_url.includes('/covers/')
        
        if (isPath || isLegacyUrl) {
             const path = isPath ? item.cover_url! : item.cover_url!.split('/covers/')[1]
             
             import('../services/storage').then(({ getSignedUrl }) => {
                 getSignedUrl(path).then(url => {
                     if (url) setCoverUrl(url)
                 })
             })
        } else {
            setCoverUrl(item.cover_url || '')
        }
      } else {
        // Reset defaults for new item
        setType('movie')
        setStatus('finished')
        setSeasons('')
        setLanguage('English')
        setTitle('')
        setReview('')
        setDateFinished(new Date().toISOString().split('T')[0]) // Default to today
        setRating(null)
        setCoverUrl('')
        setTags([])
      }
      setSearchResults([])
      setShowResults(false)
      setTagInput('')
      setNewCoverPath(null)
    }
  }, [isOpen, item])

  const suggestedTags = existingTags
    .filter(tag => !tags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase()))
    .slice(0, 5)

  const removeTag = (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault()
          const newTag = tagInput.trim()
          if (newTag && !tags.includes(newTag)) {
              setTags([...tags, newTag])
              setTagInput('')
          }
      }
  }

  const handleResultSelect = (result: SearchResult) => {
      setTitle(result.title)
      setType(result.type)
      setCoverUrl(result.cover_url || '')
      setNewCoverPath(null) // Reset custom upload if picking from search
      // Assuming result might have release date we could use?
      // For now just basic info
      setShowResults(false)
  }

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
        cover_url: newCoverPath || (item?.cover_url || null),
        date_finished: dateFinished || null,
        review,
        tags,
        rating
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
          <div className="fixed inset-0 bg-black/25" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {item ? 'Edit Item' : 'Add New Item'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                    {/* Left Column: Cover */}
                    <div>
                        <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group border border-gray-200 dark:border-gray-700">
                            <input 
                                type="file" 
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return

                                    // Validate
                                    const { valid, error } = await validateImageResponse(file)
                                    if (!valid) {
                                        alert(error)
                                        return
                                    }

                                    // Upload
                                    setIsLoading(true)
                                    try {
                                        const user = await supabase.auth.getUser()
                                        if (user.data.user?.id) {
                                            const result = await uploadCoverImage(file, user.data.user.id)
                                            if (result) {
                                                setCoverUrl(result.signedUrl)
                                                setNewCoverPath(result.path)
                                            }
                                        }
                                    } catch (err) {
                                        console.error(err)
                                        alert('Failed to upload image')
                                    } finally {
                                        setIsLoading(false)
                                    }
                                }}
                            />
                            {coverUrl ? (
                                <>
                                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <div className="text-white font-medium">Change Cover</div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
                                    <Plus className="w-8 h-8 mb-2" />
                                    <div className="text-sm font-medium">Upload Cover</div>
                                    <div className="text-xs mt-1">Min: 300x450 • Max: 5MB</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="space-y-4">
                        {/* Type & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select 
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as MediaType)}
                                >
                                    <option value="movie">Movie</option>
                                    <option value="tv">TV Show</option>
                                    <option value="book">Book</option>
                                    <option value="game">Game</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select 
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as StatusType)}
                                >
                                    <option value="backlog">Backlog</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="finished">Finished</option>
                                    <option value="dropped">Dropped</option>
                                </select>
                            </div>
                        </div>
                        
                        {type === 'tv' && (
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seasons</label>
                                <input 
                                    type="number"
                                    min="1"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={seasons}
                                    onChange={(e) => setSeasons(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                        )}

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
                                <button
                                    type="button"
                                    onClick={() => setRating(rating === 'like' ? null : 'like')}
                                    className={clsx(
                                        "p-2 rounded-full transition-colors",
                                        rating === 'like' ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <ThumbsUp className="w-6 h-6" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRating(rating === 'dislike' ? null : 'dislike')}
                                    className={clsx(
                                        "p-2 rounded-full transition-colors",
                                        rating === 'dislike' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <ThumbsDown className="w-6 h-6" />
                                </button>
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
