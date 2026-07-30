import { Dialog, Transition, Combobox } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { MediaItem, MediaType, StatusType } from '../types'
import { uploadCoverImage, validateImageResponse } from '../services/storage'
import { db } from '../utils/firebase'
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { X, Plus, Calendar, CheckCircle, ThumbsUp, ThumbsDown, Loader2, Edit2, Minus } from 'lucide-react'
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
  const [rating, setRating] = useState<'like' | 'ok' | 'dislike' | null>(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [newCoverPath, setNewCoverPath] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

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
        setDateFinished(item.date_finished || '')
        setRating(item.rating || null)
        setTags(item.tags || [])
        setIsEditing(false)
        
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
        setRating(null)
        setCoverUrl('')
        setTags([])
        setIsEditing(true)
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
    
    const itemData = {
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
        try {
            await updateDoc(doc(db, 'media_items', item.id), itemData)
        } catch (updateError) {
            error = updateError
        }
    } else {
        try {
            const itemDataWithDate = { ...itemData, created_at: new Date().toISOString() }
            const docRef = await addDoc(collection(db, 'media_items'), itemDataWithDate)
            insertedItem = { id: docRef.id, ...itemDataWithDate }
        } catch (insertError) {
            error = insertError
        }
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
      
      try {
          await deleteDoc(doc(db, 'media_items', item.id));
          onClose();
          queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
      } catch (error) {
          console.error("Error deleting:", error);
          alert("Failed to delete item");
      } finally {
          setIsLoading(false);
      }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-[24px] glass-panel bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 p-5 sm:p-7 text-left align-middle transition-all shadow-2xl relative">
                
                {/* Floating Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                    {item && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full transition-all"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 sm:gap-8 mt-2">
                    {/* Left Column: Cover */}
                    <div className="h-full">
                        <div className="w-full h-full min-h-[240px] relative rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 group shadow-inner border border-gray-200/50 dark:border-gray-700/50">
                            <input 
                                type="file" 
                                accept="image/*"
                                disabled={!isEditing}
                                className={clsx("absolute inset-0 w-full h-full opacity-0 z-10", isEditing ? "cursor-pointer" : "cursor-default")}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file || !isEditing) return

                                    // Validate
                                    const { valid, error } = await validateImageResponse(file)
                                    if (!valid) {
                                        alert(error)
                                        return
                                    }

                                    // Upload
                                    setIsLoading(true)
                                    try {
                                        const result = await uploadCoverImage(file)
                                        if (result) {
                                            setCoverUrl(result.signedUrl)
                                            setNewCoverPath(result.path)
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
                                    {isEditing && (
                                        <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm">
                                            <Plus className="w-8 h-8 text-gray-900 mb-2" />
                                            <div className="text-gray-900 font-bold text-sm tracking-widest uppercase">Update</div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-300 transition-colors p-4 text-center">
                                    {isEditing && <Plus className="w-8 h-8 mb-3 group-hover:text-gray-600 dark:group-hover:text-gray-400" />}
                                    <div className="text-sm font-semibold tracking-wide uppercase">{isEditing ? "Upload Art" : "No Art"}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="space-y-4 flex flex-col justify-start min-w-0 pr-8">
                        {/* Title */}
                        <div>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    className="w-full bg-transparent border-0 outline-none transition-all font-extrabold text-2xl sm:text-3xl px-0 py-1 focus:ring-0 border-b-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-primary-500 dark:focus:border-primary-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                    placeholder="Enter title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            ) : (
                                <div className="font-extrabold text-2xl sm:text-3xl px-0 py-1 text-gray-900 dark:text-white break-words">
                                    {title}
                                </div>
                            )}
                        </div>

                        {/* Type, Status, Seasons */}
                        <div className={`grid gap-3 ${type === 'tv' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">Type</label>
                                {isEditing ? (
                                    <select 
                                        className="w-full rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none appearance-none transition-all font-medium text-sm shadow-sm"
                                        value={type}
                                        onChange={(e) => setType(e.target.value as MediaType)}
                                    >
                                        <option value="movie">Movie</option>
                                        <option value="tv">TV</option>
                                        <option value="book">Book</option>
                                    </select>
                                ) : (
                                    <div className="text-base font-bold text-gray-900 dark:text-gray-100 pl-1 py-2 min-h-[38px] flex items-center">
                                        {type === 'tv' ? 'TV' : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </div>
                                )}
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">Status</label>
                                {isEditing ? (
                                    <select 
                                        className="w-full rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none appearance-none transition-all font-medium text-sm shadow-sm"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as StatusType)}
                                    >
                                        <option value="backlog">Backlog</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="finished">Finished</option>
                                        <option value="dropped">Dropped</option>
                                    </select>
                                ) : (
                                    <div className="text-base font-bold text-gray-900 dark:text-gray-100 pl-1 py-2 min-h-[38px] flex items-center capitalize">{status.replace('_', ' ')}</div>
                                )}
                            </div>
                            {type === 'tv' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">Seasons</label>
                                    {isEditing ? (
                                        <input 
                                            type="number"
                                            min="1"
                                            placeholder="#"
                                            className="w-full rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 px-3 py-2 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none transition-all font-medium text-sm shadow-sm"
                                            value={seasons}
                                            onChange={(e) => setSeasons(e.target.value ? Number(e.target.value) : '')}
                                        />
                                    ) : (
                                        <div className="text-base font-bold text-gray-900 dark:text-gray-100 pl-1 py-2 min-h-[38px] flex items-center">{seasons || '-'}</div>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Date & Rating */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">Date Finished</label>
                                {isEditing ? (
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            className="block w-full min-w-0 max-w-[100%] rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 pr-3 py-2 pl-9 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none transition-all font-medium text-sm shadow-sm"
                                            value={dateFinished}
                                            onChange={(e) => setDateFinished(e.target.value)}
                                        />
                                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                ) : (
                                    <div className="text-base font-bold text-gray-900 dark:text-gray-100 pl-1 py-2 min-h-[38px] flex items-center">{dateFinished ? new Date(dateFinished).toLocaleDateString() : '-'}</div>
                                )}
                            </div>
                            <div>
                                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">Rating</label>
                                 <div className="flex gap-2 h-[38px]">
                                    <button
                                        type="button"
                                        disabled={!isEditing}
                                        onClick={() => setRating(rating === 'like' ? null : 'like')}
                                        className={clsx(
                                            "flex-1 flex justify-center items-center rounded-lg transition-all border shadow-sm",
                                            isEditing ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-default",
                                            rating === 'like' ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100" : (isEditing ? "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100" : "bg-transparent border-gray-200/50 text-gray-400 opacity-50")
                                        )}
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!isEditing}
                                        onClick={() => setRating(rating === 'ok' ? null : 'ok')}
                                        className={clsx(
                                            "flex-1 flex justify-center items-center rounded-lg transition-all border shadow-sm",
                                            isEditing ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-default",
                                            rating === 'ok' ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100" : (isEditing ? "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100" : "bg-transparent border-gray-200/50 text-gray-400 opacity-50")
                                        )}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!isEditing}
                                        onClick={() => setRating(rating === 'dislike' ? null : 'dislike')}
                                        className={clsx(
                                            "flex-1 flex justify-center items-center rounded-lg transition-all border shadow-sm",
                                            isEditing ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-default",
                                            rating === 'dislike' ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100" : (isEditing ? "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100" : "bg-transparent border-gray-200/50 text-gray-400 opacity-50")
                                        )}
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                    </button>
                                 </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">Tags</label>
                             <div className="w-full">
                                {isEditing ? (
                                    <Combobox value={tags} onChange={(newTags) => {
                                        setTags(newTags)
                                        setTagInput('')
                                    }} multiple>
                                        <div className="relative">
                                            <div className="relative w-full cursor-text overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-left focus-within:ring-2 focus-within:ring-gray-900/10 dark:focus-within:ring-gray-100/10 focus-within:border-gray-300 dark:focus-within:border-gray-600 transition-all shadow-sm">
                                                <div className="flex flex-wrap gap-1 p-1.5 min-h-[38px] items-center">
                                                    {tags.map(tag => (
                                                        <span key={tag} className="bg-primary-600 dark:bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold tracking-wide uppercase shadow-sm">
                                                            {tag}
                                                            <button 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation()
                                                                    setTags(tags.filter(t => t !== tag))
                                                                }} 
                                                                className="hover:text-red-300 transition-colors"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                    <Combobox.Input
                                                        className="flex-1 bg-transparent text-sm min-w-[80px] outline-none border-none p-1 focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium"
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
                                ) : (
                                    <div className="flex flex-wrap gap-2 pl-1 py-1.5 min-h-[38px] items-center">
                                        {tags.length > 0 ? tags.map(tag => (
                                            <span key={tag} className="bg-primary-600 dark:bg-primary-500 text-white text-xs px-3 py-1 rounded-full flex items-center font-bold uppercase tracking-widest shadow-sm">
                                                {tag}
                                            </span>
                                        )) : <span className="text-base font-bold text-gray-400">-</span>}
                                    </div>
                                )}
                             </div>
                        </div>

                        {/* Review */}
                        <div>
                             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">Review</label>
                             {isEditing ? (
                                 <textarea 
                                    className="w-full rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-3 py-2 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-600 outline-none h-20 resize-none transition-all font-medium text-sm leading-relaxed shadow-sm"
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    placeholder="Thoughts on this?"
                                 />
                             ) : (
                                 <div className="text-base text-gray-800 dark:text-gray-200 pl-1 py-2 min-h-[80px] leading-relaxed whitespace-pre-wrap font-medium">
                                     {review || <span className="text-gray-400 italic font-normal">No review added.</span>}
                                 </div>
                             )}
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                {isEditing && (
                    <div className="mt-6 flex flex-col-reverse sm:flex-row border-t border-gray-100 dark:border-gray-800/50 pt-4 justify-between items-center sm:items-center gap-4 sm:gap-0">
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
                        className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl bg-primary-600 dark:bg-primary-500 text-white px-6 py-2.5 text-sm font-bold tracking-wide hover:bg-primary-700 dark:hover:bg-primary-400 hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSave}
                        disabled={!title || isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Changes
                    </button>
                  </div>
                </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
