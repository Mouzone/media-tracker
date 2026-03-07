import { Dialog, Transition, Combobox } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { MediaItem, MediaType, StatusType } from '../types'
import { uploadCoverImage, validateImageResponse } from '../services/storage'
import { supabase } from '../utils/supabase'
import { X, Plus, Calendar, CheckCircle, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
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
  const [title, setTitle] = useState('')
  const [review, setReview] = useState('')
  const [dateFinished, setDateFinished] = useState('')
  const [rating, setRating] = useState<'like' | 'dislike' | null>(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [newCoverPath, setNewCoverPath] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form when item changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setType(item.type)
        setStatus(item.status || 'finished')
        setSeasons(item.seasons || '')
        setTitle(item.title)
        setReview(item.review || '')
        setDateFinished(item.date_finished || '')
        setRating(item.rating || null)
        setTags(item.tags || [])
        
        // Handle signed URL resolution
        // Optimization: Use existing signed_url if available for instant display
        const isPath = item.cover_url && !item.cover_url.startsWith('http')
        const isLegacyUrl = item.cover_url && item.cover_url.includes('/covers/')
        
        if (item.signed_url) {
            setCoverUrl(item.signed_url)
        } else if (isPath || isLegacyUrl) {
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
        setTitle('')
        setReview('')
        setDateFinished(new Date().toISOString().split('T')[0]) // Default to today
        setRating(null)
        setCoverUrl('')
        setTags([])
      }
      setTagInput('')
      setNewCoverPath(null)
    }
  }, [isOpen, item])

  const suggestedTags = existingTags
    .filter(tag => !tags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase()))
    .slice(0, 5)

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
        cover_url: newCoverPath || (item?.cover_url || null),
        date_finished: dateFinished || null,
        review,
        tags,
        rating
    }

    let error
    let insertedItem = null

    if (item) {
        const { error: updateError } = await supabase
            .from('media_items')
            .update(itemData)
            .eq('id', item.id)
        error = updateError
    } else {
        const { data, error: insertError } = await supabase
            .from('media_items')
            .insert(itemData)
            .select()
            .single()
        error = insertError
        if (data) insertedItem = data
    }

    setIsLoading(false)
    if (!error) {
        onClose()
        
        if (insertedItem) {
            // Optimistically add to the beginning of the cached list
            queryClient.setQueriesData({ queryKey: ['mediaItems'] }, (oldData: any) => {
                if (!oldData || !oldData.pages) return oldData;
                const newPages = [...oldData.pages];
                if (newPages.length > 0) {
                    newPages[0] = [insertedItem, ...newPages[0]];
                } else {
                    newPages.push([insertedItem]);
                }
                return { ...oldData, pages: newPages };
            });
        }
        
        // Invalidate queries to refresh the list without full reload
        queryClient.invalidateQueries({ queryKey: ['mediaItems'] })
    } else {
        console.error("Error saving:", error)
        alert("Failed to save item")
    }
  }

  const handleDelete = async () => {
      if (!item || !window.confirm('Are you sure you want to delete this item?')) return;
      setIsLoading(true);
      const { error } = await supabase.from('media_items').delete().eq('id', item.id);
      setIsLoading(false);
      if (!error) {
          onClose();
          queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
      } else {
          console.error("Error deleting:", error);
          alert("Failed to delete item");
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
              enter="ease-out duration-500"
              enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl border border-gray-200 dark:border-gray-800 p-4 sm:p-8 text-left align-middle shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    {item ? 'Edit Details' : 'New Entry'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 sm:gap-8">
                    {/* Left Column: Cover */}
                    <div className="h-full">
                        <div className="w-full h-full min-h-[300px] relative rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 group shadow-inner border border-gray-200/50 dark:border-gray-700/50">
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
                                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm">
                                        <Plus className="w-8 h-8 text-gray-900 mb-2" />
                                        <div className="text-gray-900 font-bold text-sm tracking-widest uppercase">Update</div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-300 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors p-4 text-center">
                                    <Plus className="w-8 h-8 mb-3" />
                                    <div className="text-sm font-semibold tracking-wide uppercase">Upload Art</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="space-y-4 flex flex-col justify-center min-w-0">
                        {/* Title */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-1.5 pl-1">Title</label>
                            <input 
                                type="text" 
                                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 px-4 py-2.5 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none transition-all font-medium text-sm"
                                placeholder="Enter title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Type, Status, Seasons */}
                        <div className={`grid gap-3 ${type === 'tv' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-1.5 pl-1">Type</label>
                                <select 
                                    className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none appearance-none transition-all font-medium text-sm"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as MediaType)}
                                >
                                    <option value="movie">Movie</option>
                                    <option value="tv">TV</option>
                                    <option value="book">Book</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-1.5 pl-1">Status</label>
                                <select 
                                    className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none appearance-none transition-all font-medium text-sm"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as StatusType)}
                                >
                                    <option value="backlog">Backlog</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="finished">Finished</option>
                                    <option value="dropped">Dropped</option>
                                </select>
                            </div>
                            {type === 'tv' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-1.5 pl-1">Seasons</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        placeholder="#"
                                        className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 px-3 py-2.5 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none transition-all font-medium text-sm text-center"
                                        value={seasons}
                                        onChange={(e) => setSeasons(e.target.value ? Number(e.target.value) : '')}
                                    />
                                </div>
                            )}
                        </div>
                        {/* Date & Rating */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-1.5 pl-1">Date Finished</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        className="block w-full min-w-0 max-w-[100%] rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 pr-3 py-2.5 pl-9 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none transition-all font-medium text-sm"
                                        value={dateFinished}
                                        onChange={(e) => setDateFinished(e.target.value)}
                                    />
                                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                 <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-1.5 pl-1">Rating</label>
                                 <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRating(rating === 'like' ? null : 'like')}
                                        className={clsx(
                                            "flex-1 flex justify-center items-center py-2.5 rounded-xl transition-all border shadow-sm hover:scale-105 active:scale-95",
                                            rating === 'like' ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100" : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                                        )}
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRating(rating === 'dislike' ? null : 'dislike')}
                                        className={clsx(
                                            "flex-1 flex justify-center items-center py-2.5 rounded-xl transition-all border shadow-sm hover:scale-105 active:scale-95",
                                            rating === 'dislike' ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100" : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                                        )}
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                    </button>
                                 </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                             <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-1.5 pl-1">Tags</label>
                             <div className="w-full">
                                <Combobox value={tags} onChange={setTags} multiple>
                                    <div className="relative">
                                        <div className="relative w-full cursor-text overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left focus-within:ring-2 focus-within:ring-gray-900/10 dark:focus-within:ring-gray-100/10 focus-within:border-gray-300 dark:focus-within:border-gray-600 transition-all">
                                            <div className="flex flex-wrap gap-1.5 p-2 min-h-[44px] items-center">
                                                {tags.map(tag => (
                                                    <span key={tag} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-bold tracking-wide uppercase">
                                                        {tag}
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation()
                                                                setTags(tags.filter(t => t !== tag))
                                                            }} 
                                                            className="hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <Combobox.Input
                                                    className="flex-1 bg-transparent text-sm min-w-[80px] outline-none border-none p-1 focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 font-medium"
                                                    placeholder={tags.length === 0 ? "Add tags..." : ""}
                                                    onChange={(event) => setTagInput(event.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && tagInput) {
                                                             const filtered = existingTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()))
                                                             if (!filtered.includes(tagInput) && !tags.includes(tagInput)) {
                                                                 e.preventDefault()
                                                                 setTags([...tags, tagInput])
                                                                 setTagInput('')
                                                             }
                                                        }
                                                        if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
                                                            setTags(tags.slice(0, -1))
                                                        }
                                                    }}
                                                    displayValue={() => tagInput}
                                                    value={tagInput}
                                                />
                                            </div>
                                        </div>
                                        <Transition
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                            afterLeave={() => setTagInput('')}
                                        >
                                            <Combobox.Options className="absolute mt-2 max-h-48 w-full z-20 overflow-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1 text-sm shadow-xl focus:outline-none">
                                                {suggestedTags.length === 0 && tagInput !== '' ? (
                                                    <Combobox.Option
                                                        className="relative cursor-pointer select-none py-2 px-4 text-gray-700 dark:text-gray-300 ui-active:bg-gray-50 dark:ui-active:bg-gray-700 ui-active:text-gray-900 dark:ui-active:text-gray-100 transition-colors font-medium"
                                                        value={tagInput}
                                                    >
                                                        Create "{tagInput}"
                                                    </Combobox.Option>
                                                ) : (
                                                    suggestedTags.map((tag) => (
                                                        <Combobox.Option
                                                            key={tag}
                                                            className={({ active }) =>
                                                                `relative cursor-pointer select-none py-2 pl-9 pr-4 transition-colors ${
                                                                    active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                                                                }`
                                                            }
                                                            value={tag}
                                                        >
                                                            {({ active }) => (
                                                                <>
                                                                    <span className={`block truncate ${tags.includes(tag) ? 'font-bold text-gray-900' : 'font-medium'}`}>
                                                                        {tag}
                                                                    </span>
                                                                    {tags.includes(tag) ? (
                                                                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-gray-900' : 'text-gray-900'}`}>
                                                                            <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                                                        </span>
                                                                    ) : null}
                                                                </>
                                                            )}
                                                        </Combobox.Option>
                                                    ))
                                                )}
                                            </Combobox.Options>
                                        </Transition>
                                    </div>
                                </Combobox>
                             </div>
                        </div>

                        {/* Review */}
                        <div>
                             <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-1.5 pl-1">Review</label>
                             <textarea 
                                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 px-4 py-2.5 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none h-20 resize-none transition-all font-medium text-sm leading-snug"
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="Thoughts on this?"
                             />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse sm:flex-row border-t border-gray-100 dark:border-gray-800 pt-5 justify-between items-center sm:items-center gap-4 sm:gap-0">
                  <div className="w-full sm:w-auto">
                      {item && (
                          <button
                              type="button"
                              className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2.5 text-sm font-bold tracking-wide hover:bg-red-100 dark:hover:bg-red-900/50 hover:scale-105 active:scale-95 transition-all shadow-sm border border-red-100 dark:border-red-900/50"
                              onClick={handleDelete}
                          >
                              Delete Item
                          </button>
                      )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
                    <button
                        type="button"
                        className="w-full sm:w-auto text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 text-sm font-bold tracking-wide transition-colors px-3 py-2.5 rounded-xl border border-transparent"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2.5 text-sm font-bold tracking-wide hover:bg-black dark:hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSave}
                        disabled={!title || isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Changes
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
