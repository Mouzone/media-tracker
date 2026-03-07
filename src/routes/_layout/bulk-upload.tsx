import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { MediaType, StatusType } from '../../types'
import { Save, Trash2, Loader2, Image as ImageIcon, ThumbsUp, ThumbsDown } from 'lucide-react'
import { supabase } from '../../utils/supabase'
import { uploadCoverImage, validateImageResponse } from '../../services/storage'
import clsx from 'clsx'


export const Route = createFileRoute('/_layout/bulk-upload')({
  component: BulkUpload,
})

interface BulkItem {
  id: string
  title: string
  type: MediaType
  status: StatusType
  rating: 'like' | 'dislike' | null
  review: string
  tags: string[]
  cover_url?: string
  cover_path?: string
  date_finished: string
  seasons?: number
  // UI state
  selected?: boolean
  error?: string
  isUploadingCover?: boolean
}

function BulkUpload() {
  const router = useRouter()
  const [inputData, setInputData] = useState('')
  
  // Initialize from localStorage if available
  const [items, setItems] = useState<BulkItem[]>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('media-tracker-bulk-items')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch (e) {
                console.error("Failed to parse saved items", e)
            }
        }
    }
    return []
  })

  // If we have items, we are reviewing
  const [isReviewing, setIsReviewing] = useState(() => items.length > 0)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (items.length > 0) {
        localStorage.setItem('media-tracker-bulk-items', JSON.stringify(items))
    } else {
        localStorage.removeItem('media-tracker-bulk-items')
    }
  }, [items])

  // Fetch existing tags for autocomplete
  const [allTags, setAllTags] = useState<string[]>([])
  useEffect(() => {
      supabase
        .from('media_items')
        .select('tags')
        .not('tags', 'is', null)
        .then(({ data }) => {
            if (data) {
                const tags = Array.from(new Set(data.flatMap(d => d.tags || []))).sort()
                setAllTags(tags)
            }
        })
  }, [])

  const [focusedTagInputId, setFocusedTagInputId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')

  // Parsing Logic
  const handleParse = () => {
    if (!inputData.trim()) return

    const lines = inputData.split(/\r?\n/).filter(line => line.trim())
    const newItems: BulkItem[] = lines.map(line => {
      const parts = line.split('\t')
      const title = parts[0].trim()
      
      return {
        id: crypto.randomUUID(),
        title,
        type: 'movie', 
        status: 'finished',
        rating: null,
        tags: [],
        review: '',
        date_finished: '',
        selected: true
      }
    })

    setItems(newItems)
    setIsReviewing(true)
  }

  const handleClear = () => {
    setInputData('')
    setItems([])
    setIsReviewing(false)
    localStorage.removeItem('media-tracker-bulk-items')
  }

  const updateItem = (id: string, updates: Partial<BulkItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const handleCoverUpload = async (id: string, file: File) => {
    const { valid, error } = await validateImageResponse(file)
    if (!valid) {
      alert(error)
      return
    }

    updateItem(id, { isUploadingCover: true })
    
    try {
        const user = await supabase.auth.getUser()
        if (user.data.user?.id) {
            const result = await uploadCoverImage(file, user.data.user.id)
            if (result) {
                updateItem(id, { cover_url: result.signedUrl, cover_path: result.path })
            }
        }
    } catch (err) {
        console.error("Upload failed", err)
        alert("Failed to upload cover")
    } finally {
        updateItem(id, { isUploadingCover: false })
    }
  }

  const handleSubmit = async () => {
    const selectedItems = items.filter(i => i.selected)
    if (selectedItems.length === 0) return

    const invalidItems = selectedItems.filter(i => !i.title)
    if (invalidItems.length > 0) {
        alert(`Please fix ${invalidItems.length} items with missing titles.`)
        return
    }

    setIsSubmitting(true)
    
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id
    if (!userId) return

    const records = selectedItems.map(item => ({
        user_id: userId,
        title: item.title,
        type: item.type,
        status: item.status,
        rating: item.rating || null,
        review: item.review || null,
        tags: item.tags.length ? item.tags : null,
        cover_url: item.cover_path || item.cover_url || null,
        date_finished: item.date_finished || null,
        seasons: item.type === 'tv' && item.seasons ? item.seasons : null,
    }))

    const { error } = await supabase.from('media_items').insert(records)

    setIsSubmitting(false)

    if (error) {
        console.error("Bulk insert failed", error)
        alert("Failed to save items: " + error.message)
    } else {
        const uploadedIds = new Set(selectedItems.map(i => i.id))
        setItems(prev => prev.filter(i => !uploadedIds.has(i.id)))
        
        if (window.confirm(`Successfully added ${selectedItems.length} items! Go to dashboard?`)) {
            router.navigate({ to: '/' })
        }
    }
  }

  if (!isReviewing) {
    return (
        <div className="max-w-4xl mx-auto pt-10 px-4 sm:px-6">
          <div className="mb-10 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex justify-center items-center mb-6 border border-gray-200 shadow-sm">
                  <Save className="w-8 h-8 text-gray-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-widest text-gray-900 mb-3 uppercase">Bulk Upload</h1>
              <p className="text-gray-500 text-sm sm:text-base tracking-wide max-w-lg font-medium">Paste a list of titles (one per line) or a spreadsheet selection and quickly batch add them to your tracker.</p>
          </div>
          
          <div className="bg-white/95 backdrop-blur-3xl p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden group">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50"></div>
            
            <textarea
                className="w-full h-72 sm:h-96 p-6 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-mono text-sm sm:text-base leading-relaxed placeholder-gray-400 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all resize-none font-medium"
                placeholder="Inception&#10;The Matrix&#10;Interstellar"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
            />
            
            <div className="flex justify-end mt-8">
                 <button 
                    onClick={handleParse}
                    disabled={!inputData.trim()} 
                    className="px-8 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-black hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-3 text-sm"
                >
                    Parse Data
                 </button>
            </div>
          </div>
        </div>
      )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pt-8 pb-32 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
        <div>
            <h1 className="text-3xl font-semibold tracking-wide text-gray-900 mb-2">Review Items</h1>
            <p className="text-gray-500 text-sm tracking-wide font-medium">{items.length} items to process</p>
        </div>
        <div className="flex gap-4">
             <button onClick={handleClear} className="px-6 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-bold tracking-wide rounded-xl transition-colors text-sm">
                Cancel
             </button>
             <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || items.filter(i => i.selected).length === 0}
                className="px-6 py-3 bg-gray-900 text-white font-bold tracking-wide rounded-xl hover:bg-black hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-lg flex items-center gap-2 text-sm"
            >
                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                Save ({items.filter(i => i.selected).length})
             </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
         <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                <tr>
                    <th className="px-5 py-4 w-10">
                        <input type="checkbox" 
                            className="rounded border-gray-300 bg-white focus:ring-gray-900 text-gray-900 w-4 h-4 cursor-pointer transition-all"
                            checked={items.every(i => i.selected)}
                            onChange={(e) => {
                                setItems(prev => prev.map(i => ({ ...i, selected: e.target.checked })))
                            }}
                        />
                    </th>
                    <th className="px-5 py-4 w-20">Cover</th>
                    <th className="px-5 py-4 min-w-[200px]">Title</th>
                    <th className="px-5 py-4 w-32">Type</th>
                    <th className="px-5 py-4 w-32">Status</th>
                    <th className="px-5 py-4 w-24">Seasons</th>
                    <th className="px-5 py-4 w-32">Rating</th>
                    <th className="px-5 py-4 w-40">Date Finished</th>
                    <th className="px-5 py-4 min-w-[200px]">Review</th>
                    <th className="px-5 py-4 w-48">Tags</th>
                    <th className="px-5 py-4 w-10 pr-6"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-900">
                {items.map(item => (
                    <tr key={item.id} className={clsx("hover:bg-gray-50 transition-colors", !item.selected && "opacity-40")}>
                        <td className="px-5 py-4">
                             <input type="checkbox" 
                                className="rounded border-gray-300 bg-white focus:ring-gray-900 text-gray-900 w-4 h-4 cursor-pointer transition-all"
                                checked={!!item.selected} onChange={(e) => updateItem(item.id, { selected: e.target.checked })} />
                        </td>
                        <td className="px-5 py-4">
                            <div 
                                className="relative w-12 h-16 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center cursor-pointer group border border-gray-200 hover:border-gray-400 transition-all shadow-sm"
                                onClick={() => fileInputRefs.current[item.id]?.click()}
                            >
                                {item.cover_url ? (
                                    <img src={item.cover_url} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform" />
                                )}
                                {item.isUploadingCover && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                                        <Loader2 className="w-4 h-4 text-gray-900 animate-spin" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                            </div>
                            <input 
                                type="file" 
                                hidden 
                                ref={el => fileInputRefs.current[item.id] = el}
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) handleCoverUpload(item.id, e.target.files[0])
                                }}
                            />
                        </td>
                        <td className="px-5 py-4">
                            <input 
                                className="w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-gray-400 text-gray-900 outline-none px-1 py-1 transition-colors placeholder-gray-400 font-bold"
                                value={item.title}
                                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                placeholder="Title required"
                            />
                        </td>
                        <td className="px-5 py-4">
                             <select 
                                className="w-full bg-transparent text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-gray-400 outline-none py-1 appearance-none cursor-pointer text-[13px] font-bold"
                                value={item.type}
                                onChange={(e) => updateItem(item.id, { type: e.target.value as MediaType })}
                             >
                                <option value="movie">Movie</option>
                                <option value="tv">TV Show</option>
                                <option value="book">Book</option>
                             </select>
                        </td>
                         <td className="px-5 py-4">
                             <select 
                                className="w-full bg-transparent text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-gray-400 outline-none py-1 appearance-none cursor-pointer text-[13px] font-bold"
                                value={item.status}
                                onChange={(e) => updateItem(item.id, { status: e.target.value as StatusType })}
                             >
                                <option value="finished">Finished</option>
                                <option value="dropped">Dropped</option>
                                <option value="in_progress">In Progress</option>
                                <option value="backlog">Backlog</option>
                             </select>
                        </td>
                        <td className="px-5 py-4">
                            {item.type === 'tv' ? (
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-16 bg-transparent text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-gray-400 outline-none py-1 transition-colors placeholder-gray-400 text-center font-bold"
                                    placeholder="S"
                                    value={item.seasons || ''}
                                    onChange={(e) => updateItem(item.id, { seasons: e.target.value ? Number(e.target.value) : undefined })}
                                />
                            ) : (
                                <span className="text-gray-400 text-[13px] flex w-full justify-center font-bold">-</span>
                            )}
                        </td>

                        <td className="px-5 py-4">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => updateItem(item.id, { rating: item.rating === 'like' ? null : 'like' })}
                                    className={clsx(
                                        "p-1.5 rounded-full transition-colors",
                                        item.rating === 'like' ? "text-gray-900 bg-gray-200" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                                    )}
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => updateItem(item.id, { rating: item.rating === 'dislike' ? null : 'dislike' })}
                                    className={clsx(
                                        "p-1.5 rounded-full transition-colors",
                                        item.rating === 'dislike' ? "text-gray-900 bg-gray-200" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                                    )}
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                        <td className="px-5 py-4">
                            <input 
                                type="date"
                                className="bg-transparent text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-gray-400 outline-none py-1 w-32 transition-colors text-[13px] font-bold"
                                value={item.date_finished}
                                onChange={(e) => updateItem(item.id, { date_finished: e.target.value })}
                            />
                        </td>
                        <td className="px-5 py-4">
                            <input
                                className="w-full bg-transparent text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-gray-400 outline-none px-1 py-1 truncate focus:truncate-0 transition-colors placeholder-gray-400 text-[13px] font-medium"
                                value={item.review}
                                onChange={(e) => updateItem(item.id, { review: e.target.value })}
                                placeholder="Thoughts..."
                            />
                        </td>
                        <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5 items-center">
                                {item.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-gray-200 text-gray-900 px-2 py-1 rounded-sm flex items-center tracking-wide font-bold uppercase">
                                        {tag}
                                        <button onClick={() => updateItem(item.id, { tags: item.tags.filter(t => t !== tag) })} className="ml-1 hover:text-red-500 transition-colors">×</button>
                                    </span>
                                ))}
                                <div className="relative">
                                    <input 
                                        className="text-xs bg-transparent text-gray-900 outline-none w-20 min-w-[60px] placeholder:text-gray-400 placeholder:font-bold font-medium"
                                        placeholder="+ tag"
                                        value={item.id === focusedTagInputId ? tagInput : ''}
                                        onFocus={() => {
                                            setFocusedTagInputId(item.id)
                                            setTagInput('')
                                        }}
                                        onBlur={() => {
                                            // Delay to allow clicking suggestions
                                            setTimeout(() => {
                                                if (focusedTagInputId === item.id) {
                                                    setFocusedTagInputId(null)
                                                    setTagInput('')
                                                }
                                            }, 200)
                                        }}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.currentTarget.value.trim()
                                                if (val && !item.tags.includes(val)) {
                                                    updateItem(item.id, { tags: [...item.tags, val] })
                                                    setTagInput('')
                                                }
                                            }
                                        }}
                                    />
                                    {/* Tag Suggestions */}
                                    {focusedTagInputId === item.id && tagInput.trim().length > 0 && (
                                        <div className="absolute z-20 top-full mt-2 left-0 w-48 max-h-48 overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden py-1">
                                            {allTags
                                                .filter(t => !item.tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase()))
                                                .slice(0, 5)
                                                .map(tag => (
                                                <button
                                                    key={tag}
                                                    className="w-full text-left px-4 py-3 text-xs text-gray-700 font-medium hover:text-gray-900 hover:bg-gray-50 block transition-colors border-b border-gray-100 last:border-0"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault() // Prevent blur
                                                        updateItem(item.id, { tags: [...item.tags, tag] })
                                                        setTagInput('')
                                                    }}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                            {allTags.filter(t => !item.tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase())).length === 0 && (
                                                <div className="px-4 py-3 text-xs text-gray-500 italic font-medium">No exact tags found. Press enter to create "{tagInput}"</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </td>
                        <td className="px-5 py-4 pr-6 text-right">
                            <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 rounded-full inline-flex">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
         {items.length > 5 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center">
                 <button onClick={handleParse} className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    Paste More Items (Append)
                 </button>
            </div>
         )}
      </div>

       <div className="mt-12 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 relative overflow-hidden group shadow-sm">
            <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-4">Paste More to Append</h2>
             <textarea
                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono text-sm leading-relaxed placeholder-gray-400 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all resize-none font-medium"
                placeholder="Paste more items here..."
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                        handleParse()
                        setInputData('')
                    }
                }}
            />
             <div className="flex justify-end mt-4">
                 <button 
                    onClick={() => {
                        handleParse()
                        setInputData('')
                    }}
                    disabled={!inputData.trim()} 
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-widest transition-all shadow-md"
                >
                    Parse & Append
                 </button>
            </div>
       </div>
    </div>
  )
}
