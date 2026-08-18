import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Minus,
  Save,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import clsx from 'clsx'
import { bulkCreateItems } from '../../data/mutations'
import { useMediaLibrary } from '../../data/MediaLibraryProvider'
import { canonicalizeTag, suggestTags, useAllTags } from '../../data/selectors'
import { uploadCoverImage } from '../../services/storage'
import { CoverProcessingError } from '../../lib/image'
import { useToast } from '../../components/Toast'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { STATUS_LABELS, STATUS_VALUES } from '../../types'
import type { MediaItemData, MediaType, Rating, StatusType } from '../../types'

/**
 * A lazy route: this screen is rarely opened and pulls in its own tree, so it is
 * kept out of the initial bundle and fetched on navigation.
 */
export const Route = createLazyFileRoute('/_layout/bulk-upload')({
  component: BulkUpload,
})

const DRAFT_STORAGE_KEY = 'media-tracker-bulk-items'

interface BulkItem {
  id: string
  title: string
  type: MediaType
  status: StatusType
  rating: Rating | null
  review: string
  tags: string[]
  cover_url?: string
  cover_path?: string
  date_finished: string
  seasons?: number
  selected: boolean
  isUploadingCover?: boolean
}

const RATING_BUTTONS: { value: Rating; Icon: typeof ThumbsUp; label: string }[] = [
  { value: 'like', Icon: ThumbsUp, label: 'Liked it' },
  { value: 'ok', Icon: Minus, label: 'It was fine' },
  { value: 'dislike', Icon: ThumbsDown, label: 'Disliked it' },
]

const CELL_INPUT_CLASSES =
  'focus-ring w-full border-b border-transparent bg-transparent px-1 py-1 text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-200 focus:border-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:border-gray-700 dark:focus:border-gray-500'

function readDraft(): BulkItem[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
    return saved ? (JSON.parse(saved) as BulkItem[]) : []
  } catch (error) {
    console.error('Could not restore the bulk-upload draft:', error)
    return []
  }
}

function BulkUpload() {
  const router = useRouter()
  const toast = useToast()
  const { items: libraryItems } = useMediaLibrary()

  const [inputData, setInputData] = useState('')
  const [items, setItems] = useState<BulkItem[]>(readDraft)
  const [isReviewing, setIsReviewing] = useState(() => items.length > 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)
  const [focusedTagRowId, setFocusedTagRowId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Tags come from the library already in memory. This screen used to run its own
  // getDocs() over the whole collection purely to build this list.
  const allTags = useAllTags(libraryItems)

  const selectedCount = useMemo(() => items.filter((i) => i.selected).length, [items])

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(items))
    } else {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [items])

  const updateItem = (id: string, updates: Partial<BulkItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  const handleParse = () => {
    // Accepts a plain list of titles or a pasted spreadsheet column; only the
    // first tab-separated field is treated as the title.
    const parsed = inputData
      .split(/\r?\n/)
      .map((line) => line.split('\t')[0].trim())
      .filter(Boolean)
      .map<BulkItem>((title) => ({
        id: crypto.randomUUID(),
        title,
        type: 'movie',
        status: 'finished',
        rating: null,
        tags: [],
        review: '',
        date_finished: '',
        selected: true,
      }))

    if (parsed.length === 0) {
      toast('Nothing to parse — add at least one title.', 'error')
      return
    }

    setItems(parsed)
    setIsReviewing(true)
  }

  const handleClear = () => {
    setInputData('')
    setItems([])
    setIsReviewing(false)
    setIsConfirmingClear(false)
    localStorage.removeItem(DRAFT_STORAGE_KEY)
  }

  const handleCoverUpload = async (id: string, file: File) => {
    updateItem(id, { isUploadingCover: true })
    try {
      const { url, path } = await uploadCoverImage(file)
      updateItem(id, { cover_url: url, cover_path: path })
    } catch (error) {
      const message =
        error instanceof CoverProcessingError ? error.message : 'Could not upload that cover.'
      console.error('Bulk cover upload failed:', error)
      toast(message, 'error')
    } finally {
      updateItem(id, { isUploadingCover: false })
    }
  }

  const handleSubmit = async () => {
    const selected = items.filter((item) => item.selected)
    if (selected.length === 0) return

    const untitled = selected.filter((item) => !item.title.trim()).length
    if (untitled > 0) {
      toast(`${untitled} selected ${untitled === 1 ? 'row is' : 'rows are'} missing a title.`, 'error')
      return
    }

    setIsSubmitting(true)
    const createdAt = new Date().toISOString()

    const records: MediaItemData[] = selected.map((item) => ({
      title: item.title.trim(),
      type: item.type,
      status: item.status,
      rating: item.rating,
      review: item.review.trim() || null,
      tags: item.tags,
      cover_url: item.cover_url ?? null,
      cover_path: item.cover_path ?? null,
      date_finished: item.date_finished || null,
      seasons: item.type === 'tv' && item.seasons ? item.seasons : null,
      created_at: createdAt,
    }))

    try {
      await bulkCreateItems(records)

      const uploadedIds = new Set(selected.map((item) => item.id))
      const remaining = items.filter((item) => !uploadedIds.has(item.id))
      setItems(remaining)

      toast(`Added ${records.length} ${records.length === 1 ? 'item' : 'items'}.`, 'success')
      if (remaining.length === 0) router.navigate({ to: '/' })
    } catch (error) {
      console.error('Bulk insert failed:', error)
      toast('Could not save those items. Nothing was added.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isReviewing) {
    return (
      <div className="relative mx-auto max-w-4xl px-4 pt-10 sm:px-6">
        <button
          onClick={() => router.navigate({ to: '/' })}
          className="focus-ring absolute left-4 top-10 z-10 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold tracking-wide text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 sm:left-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-10 mt-12 flex flex-col items-center text-center sm:mt-0">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-gray-50 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <Save className="h-8 w-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          </div>
          <h1 className="mb-3 text-3xl font-semibold uppercase tracking-widest text-gray-900 dark:text-gray-100 sm:text-4xl">
            Bulk Upload
          </h1>
          <p className="max-w-lg text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400 sm:text-base">
            Paste a list of titles, one per line, or a column copied from a spreadsheet. You can fill
            in the details on the next screen.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-3xl dark:border-gray-800 dark:bg-gray-900/95 sm:p-10">
          <label htmlFor="bulk-input" className="sr-only">
            Titles to import
          </label>
          <textarea
            id="bulk-input"
            className="focus-ring h-72 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-6 font-mono text-sm font-medium leading-relaxed text-gray-900 transition-all placeholder:text-gray-400 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 sm:h-96 sm:text-base"
            placeholder={'Inception\nThe Matrix\nInterstellar'}
            value={inputData}
            onChange={(event) => setInputData(event.target.value)}
          />

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleParse}
              disabled={!inputData.trim()}
              className="focus-ring flex items-center justify-center gap-3 rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:bg-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Parse Data
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-6">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-semibold tracking-wide text-gray-900 dark:text-gray-100">
            Review Items
          </h1>
          <p className="text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400">
            {items.length} {items.length === 1 ? 'item' : 'items'} to process · {selectedCount} selected
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
            <tr>
              <th scope="col" className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  className="focus-ring h-4 w-4 cursor-pointer rounded border-gray-300 text-gray-900 dark:border-gray-700 dark:bg-gray-800"
                  checked={items.length > 0 && items.every((item) => item.selected)}
                  onChange={(event) =>
                    setItems((prev) => prev.map((item) => ({ ...item, selected: event.target.checked })))
                  }
                />
              </th>
              <th scope="col" className="w-20 px-3 py-2">Cover</th>
              <th scope="col" className="min-w-[200px] px-3 py-2">Title</th>
              <th scope="col" className="w-32 px-3 py-2">Type</th>
              <th scope="col" className="w-32 px-3 py-2">Status</th>
              <th scope="col" className="w-24 px-3 py-2">Seasons</th>
              <th scope="col" className="w-32 px-3 py-2">Rating</th>
              <th scope="col" className="w-40 px-3 py-2">Date Finished</th>
              <th scope="col" className="min-w-[200px] px-3 py-2">Review</th>
              <th scope="col" className="w-48 px-3 py-2">Tags</th>
              <th scope="col" className="w-10 px-3 py-2 pr-6">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-900 dark:divide-gray-800 dark:text-gray-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className={clsx(
                  'transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  !item.selected && 'opacity-40',
                )}
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Include ${item.title || 'this row'}`}
                    className="focus-ring h-4 w-4 cursor-pointer rounded border-gray-300 text-gray-900 dark:border-gray-700 dark:bg-gray-800"
                    checked={item.selected}
                    onChange={(event) => updateItem(item.id, { selected: event.target.checked })}
                  />
                </td>

                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="focus-ring group relative flex h-14 w-10 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm transition-all hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800"
                    onClick={() => fileInputRefs.current[item.id]?.click()}
                    aria-label={`Upload cover for ${item.title || 'this row'}`}
                  >
                    {item.cover_url ? (
                      <img src={item.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-gray-400 transition-transform group-hover:scale-110" />
                    )}
                    {item.isUploadingCover && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-900 dark:text-gray-100" />
                      </span>
                    )}
                  </button>
                  <input
                    type="file"
                    hidden
                    ref={(el) => {
                      fileInputRefs.current[item.id] = el
                    }}
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) handleCoverUpload(item.id, file)
                    }}
                  />
                </td>

                <td className="px-3 py-2">
                  <input
                    className={clsx(CELL_INPUT_CLASSES, 'font-bold')}
                    value={item.title}
                    onChange={(event) => updateItem(item.id, { title: event.target.value })}
                    placeholder="Title required"
                    aria-label="Title"
                  />
                </td>

                <td className="px-3 py-2">
                  <select
                    className={clsx(CELL_INPUT_CLASSES, 'cursor-pointer appearance-none text-[13px] font-bold')}
                    value={item.type}
                    onChange={(event) => updateItem(item.id, { type: event.target.value as MediaType })}
                    aria-label="Type"
                  >
                    <option value="movie">Movie</option>
                    <option value="tv">TV Show</option>
                    <option value="book">Book</option>
                  </select>
                </td>

                <td className="px-3 py-2">
                  <select
                    className={clsx(CELL_INPUT_CLASSES, 'cursor-pointer appearance-none text-[13px] font-bold')}
                    value={item.status}
                    onChange={(event) => updateItem(item.id, { status: event.target.value as StatusType })}
                    aria-label="Status"
                  >
                    {STATUS_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-3 py-2">
                  {item.type === 'tv' ? (
                    <input
                      type="number"
                      min="0"
                      className={clsx(CELL_INPUT_CLASSES, 'w-16 text-center font-bold')}
                      placeholder="S"
                      value={item.seasons ?? ''}
                      onChange={(event) =>
                        updateItem(item.id, {
                          seasons: event.target.value ? Number(event.target.value) : undefined,
                        })
                      }
                      aria-label="Seasons"
                    />
                  ) : (
                    <span className="flex w-full justify-center text-[13px] font-bold text-gray-400">—</span>
                  )}
                </td>

                <td className="px-3 py-2">
                  <div className="flex gap-1.5">
                    {RATING_BUTTONS.map(({ value, Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={label}
                        aria-pressed={item.rating === value}
                        onClick={() => updateItem(item.id, { rating: item.rating === value ? null : value })}
                        className={clsx(
                          'focus-ring rounded-full p-1.5 transition-colors',
                          item.rating === value
                            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </td>

                <td className="px-3 py-2">
                  <input
                    type="date"
                    className={clsx(CELL_INPUT_CLASSES, 'w-32 text-[13px] font-bold')}
                    value={item.date_finished}
                    onChange={(event) => updateItem(item.id, { date_finished: event.target.value })}
                    aria-label="Date finished"
                  />
                </td>

                <td className="px-3 py-2">
                  <input
                    className={clsx(CELL_INPUT_CLASSES, 'text-[13px] font-medium')}
                    value={item.review}
                    onChange={(event) => updateItem(item.id, { review: event.target.value })}
                    placeholder="Thoughts..."
                    aria-label="Review"
                  />
                </td>

                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center rounded bg-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(item.id, { tags: item.tags.filter((t) => t !== tag) })
                          }
                          className="focus-ring ml-1 rounded transition-colors hover:text-red-500"
                          aria-label={`Remove tag ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    <div className="relative">
                      <input
                        className="focus-ring w-20 min-w-[60px] bg-transparent text-xs font-medium text-gray-900 outline-none placeholder:font-bold placeholder:text-gray-400 dark:text-gray-100"
                        placeholder="+ tag"
                        aria-label="Add tag"
                        value={focusedTagRowId === item.id ? tagInput : ''}
                        onFocus={() => {
                          setFocusedTagRowId(item.id)
                          setTagInput('')
                        }}
                        onBlur={() => {
                          // Delayed so a suggestion click lands before the list unmounts.
                          window.setTimeout(() => {
                            setFocusedTagRowId((current) => (current === item.id ? null : current))
                          }, 150)
                        }}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return
                          event.preventDefault()
                          // Match an existing tag's casing rather than spawning a
                          // near-duplicate.
                          const value = canonicalizeTag(tagInput, allTags)
                          const applied = item.tags.some((t) => t.toLowerCase() === value.toLowerCase())
                          if (value && !applied) {
                            updateItem(item.id, { tags: [...item.tags, value] })
                          }
                          setTagInput('')
                        }}
                      />

                      {focusedTagRowId === item.id && tagInput.trim() && (
                        <div className="absolute left-0 top-full z-20 mt-2 max-h-48 w-48 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                          {suggestTags(allTags, tagInput, item.tags)
                            .map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                className="block w-full border-b border-gray-100 px-4 py-3 text-left text-xs font-medium text-gray-700 transition-colors last:border-0 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
                                onMouseDown={(event) => {
                                  event.preventDefault() // keep focus so blur doesn't fire first
                                  updateItem(item.id, { tags: [...item.tags, tag] })
                                  setTagInput('')
                                }}
                              >
                                {tag}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-3 py-2 pr-6 text-right">
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                    className="focus-ring inline-flex rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                    aria-label={`Remove ${item.title || 'this row'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={() => setIsConfirmingClear(true)}
          className="focus-ring rounded-xl px-6 py-3 text-sm font-bold tracking-wide text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          Discard
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedCount === 0}
          className="focus-ring flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold tracking-wide text-white shadow-lg transition-all hover:bg-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save ({selectedCount})
        </button>
      </div>

      <ConfirmDialog
        isOpen={isConfirmingClear}
        title="Discard these rows?"
        message={`${items.length} unsaved ${items.length === 1 ? 'row' : 'rows'} will be lost.`}
        confirmLabel="Discard"
        onConfirm={handleClear}
        onCancel={() => setIsConfirmingClear(false)}
      />
    </div>
  )
}
