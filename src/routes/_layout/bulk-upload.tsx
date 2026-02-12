import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useRef } from 'react'
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
  date_finished: string
  seasons?: number
  language: string
  // UI state
  selected?: boolean
  error?: string
  isUploadingCover?: boolean
}

function BulkUpload() {
  const router = useRouter()
  const [inputData, setInputData] = useState('')
  const [items, setItems] = useState<BulkItem[]>([])
  const [isReviewing, setIsReviewing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

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
        language: 'English',
        date_finished: new Date().toISOString().split('T')[0],
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
            const url = await uploadCoverImage(file, user.data.user.id)
            if (url) {
                updateItem(id, { cover_url: url })
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
        cover_url: item.cover_url || null,
        date_finished: item.date_finished || null,
        seasons: item.type === 'tv' && item.seasons ? item.seasons : null,
        language: item.language || 'English',
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Bulk Upload</h1>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">Paste Data (List or Table)</label>
                <div className="text-xs text-gray-500 mb-2">
                    Paste a list of titles (one per line) or a spreadsheet selection.
                </div>
                <textarea
                    className="w-full h-64 p-4 border rounded-lg dark:bg-gray-900 dark:border-gray-700 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Inception&#10;The Matrix&#10;Interstellar"
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                />
            </div>
            <div className="flex justify-end">
                 <button 
                    onClick={handleParse}
                    disabled={!inputData.trim()} 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    Parse Data
                 </button>
            </div>
          </div>
        </div>
      )
  }

  return (
    <div className="max-w-[95%] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review Items ({items.length})</h1>
        <div className="flex gap-3">
             <button onClick={handleClear} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg">
                Cancel / Clear
             </button>
             <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || items.filter(i => i.selected).length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium"
            >
                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                Save Selected ({items.filter(i => i.selected).length})
             </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden overflow-x-auto">
         <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 font-medium">
                <tr>
                    <th className="px-4 py-3 w-10">
                        <input type="checkbox" 
                            checked={items.every(i => i.selected)}
                            onChange={(e) => {
                                setItems(prev => prev.map(i => ({ ...i, selected: e.target.checked })))
                            }}
                        />
                    </th>
                    <th className="px-4 py-3 w-20">Cover</th>
                    <th className="px-4 py-3 min-w-[200px]">Title</th>
                    <th className="px-4 py-3 w-32">Type</th>
                    <th className="px-4 py-3 w-32">Status</th>
                    <th className="px-4 py-3 w-24">Seasons</th>
                    <th className="px-4 py-3 w-32">Language</th>
                    <th className="px-4 py-3 w-32">Rating</th>
                    <th className="px-4 py-3 w-40">Date Finished</th>
                    <th className="px-4 py-3 min-w-[200px]">Review</th>
                    <th className="px-4 py-3 w-48">Tags</th>
                    <th className="px-4 py-3 w-10">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map(item => (
                    <tr key={item.id} className={clsx("hover:bg-gray-50 dark:hover:bg-gray-750", !item.selected && "opacity-50")}>
                        <td className="px-4 py-3">
                             <input type="checkbox" checked={!!item.selected} onChange={(e) => updateItem(item.id, { selected: e.target.checked })} />
                        </td>
                        <td className="px-4 py-3">
                            <div 
                                className="relative w-12 h-16 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex items-center justify-center cursor-pointer group border border-transparent hover:border-blue-500"
                                onClick={() => fileInputRefs.current[item.id]?.click()}
                            >
                                {item.cover_url ? (
                                    <img src={item.cover_url} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-5 h-5 text-gray-400" />
                                )}
                                {item.isUploadingCover && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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
                        <td className="px-4 py-3">
                            <input 
                                className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5"
                                value={item.title}
                                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                placeholder="Title required"
                            />
                        </td>
                        <td className="px-4 py-3">
                             <select 
                                className="w-full bg-transparent border rounded p-1 text-xs"
                                value={item.type}
                                onChange={(e) => updateItem(item.id, { type: e.target.value as MediaType })}
                             >
                                <option value="movie">Movie</option>
                                <option value="tv">TV</option>
                                <option value="book">Book</option>
                             </select>
                        </td>
                         <td className="px-4 py-3">
                             <select 
                                className="w-full bg-transparent border rounded p-1 text-xs"
                                value={item.status}
                                onChange={(e) => updateItem(item.id, { status: e.target.value as StatusType })}
                             >
                                <option value="finished">Finished</option>
                                <option value="dropped">Dropped</option>
                             </select>
                        </td>
                        <td className="px-4 py-3">
                            {item.type === 'tv' ? (
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-16 bg-transparent border rounded p-1 text-xs"
                                    placeholder="S"
                                    value={item.seasons || ''}
                                    onChange={(e) => updateItem(item.id, { seasons: e.target.value ? Number(e.target.value) : undefined })}
                                />
                            ) : (
                                <span className="text-gray-400 text-xs">-</span>
                            )}
                        </td>
                        <td className="px-4 py-3">
                             <select
                                className="w-24 bg-transparent border rounded p-1 text-xs"
                                value={item.language}
                                onChange={(e) => updateItem(item.id, { language: e.target.value })}
                            >
                                {['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese', 'Hindi', 'Italian', 'Portuguese', 'Russian', 'Arabic'].map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => updateItem(item.id, { rating: item.rating === 'like' ? null : 'like' })}
                                    className={clsx(
                                        "p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700",
                                        item.rating === 'like' ? "text-green-500" : "text-gray-300"
                                    )}
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => updateItem(item.id, { rating: item.rating === 'dislike' ? null : 'dislike' })}
                                    className={clsx(
                                        "p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700",
                                        item.rating === 'dislike' ? "text-red-500" : "text-gray-300"
                                    )}
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            <input 
                                type="date"
                                className="bg-transparent border rounded p-1 text-xs w-32"
                                value={item.date_finished}
                                onChange={(e) => updateItem(item.id, { date_finished: e.target.value })}
                            />
                        </td>
                        <td className="px-4 py-3">
                            <input
                                className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5 text-xs truncate focus:truncate-0"
                                value={item.review}
                                onChange={(e) => updateItem(item.id, { review: e.target.value })}
                                placeholder="Write a review..."
                            />
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                                {item.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded flex items-center">
                                        {tag}
                                        <button onClick={() => updateItem(item.id, { tags: item.tags.filter(t => t !== tag) })} className="ml-1 hover:text-red-500">×</button>
                                    </span>
                                ))}
                                <input 
                                    className="text-xs bg-transparent outline-none w-20 min-w-[50px] placeholder:text-gray-400"
                                    placeholder="+Tag"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value.trim()
                                            if (val && !item.tags.includes(val)) {
                                                updateItem(item.id, { tags: [...item.tags, val] })
                                                e.currentTarget.value = ''
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
         {items.length > 5 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-center">
                 <button onClick={handleParse} className="text-sm text-blue-600 hover:underline">
                    Paste More Items (Append)
                 </button>
            </div>
         )}
      </div>

       <div className="mt-8">
            <h2 className="text-lg font-medium mb-4">Paste More to Append</h2>
             <textarea
                className="w-full h-24 p-4 border rounded-lg dark:bg-gray-900 dark:border-gray-700 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
             <div className="flex justify-end mt-2">
                 <button 
                    onClick={() => {
                        handleParse()
                        setInputData('')
                    }}
                    disabled={!inputData.trim()} 
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
                >
                    Parse & Append
                 </button>
            </div>
       </div>
    </div>
  )
}
