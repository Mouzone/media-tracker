import { Dialog, Transition, Combobox } from '@headlessui/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { X, Plus, Calendar, ThumbsUp, ThumbsDown, Loader2, Edit2, Minus } from 'lucide-react'
import clsx from 'clsx'
import { createItem, deleteItem, updateItem } from '../data/mutations'
import { canonicalizeTag, suggestTags } from '../data/selectors'
import { uploadCoverImage, resolveCoverUrl } from '../services/storage'
import { CoverProcessingError } from '../lib/image'
import { useToast } from './Toast'
import { ConfirmDialog } from './ConfirmDialog'
import { STATUS_LABELS, STATUS_VALUES } from '../types'
import type { MediaItem, MediaItemData, MediaType, Rating, StatusType } from '../types'

interface MediaModalProps {
  item: MediaItem | null
  isOpen: boolean
  onClose: () => void
  existingTags?: string[]
}

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'movie', label: 'Movie' },
  { value: 'tv', label: 'TV' },
  { value: 'book', label: 'Book' },
]

const RATING_BUTTONS: { value: Rating; Icon: typeof ThumbsUp; label: string }[] = [
  { value: 'like', Icon: ThumbsUp, label: 'Liked it' },
  { value: 'ok', Icon: Minus, label: 'It was fine' },
  { value: 'dislike', Icon: ThumbsDown, label: 'Disliked it' },
]

const INPUT_CLASSES =
  'focus-ring w-full rounded-lg border border-gray-200/60 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-100'

const FIELD_LABEL_CLASSES =
  'mb-1 block pl-1 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500'

const READONLY_VALUE_CLASSES =
  'flex min-h-[38px] items-center py-2 pl-1 text-base font-bold text-gray-900 dark:text-gray-100'

interface FormState {
  title: string
  type: MediaType
  status: StatusType
  seasons: number | ''
  review: string
  dateFinished: string
  rating: Rating | null
  tags: string[]
  coverUrl: string
  coverPath: string | null
}

function initialForm(item: MediaItem | null): FormState {
  if (!item) {
    return {
      title: '',
      type: 'movie',
      status: 'finished',
      seasons: '',
      review: '',
      dateFinished: new Date().toISOString().slice(0, 10),
      rating: null,
      tags: [],
      coverUrl: '',
      coverPath: null,
    }
  }

  return {
    title: item.title,
    type: item.type,
    status: item.status,
    seasons: item.seasons ?? '',
    review: item.review ?? '',
    dateFinished: item.date_finished ?? '',
    rating: item.rating,
    tags: item.tags,
    // Covers hold a full URL after the migration; anything else resolves below.
    coverUrl: item.cover_url?.startsWith('http') ? item.cover_url : '',
    coverPath: item.cover_path ?? null,
  }
}

export function MediaModal({ item, isOpen, onClose, existingTags = [] }: MediaModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<FormState>(() => initialForm(item))
  const [tagInput, setTagInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const patch = (updates: Partial<FormState>) => setForm((current) => ({ ...current, ...updates }))

  useEffect(() => {
    if (!isOpen) return

    setForm(initialForm(item))
    setTagInput('')
    setIsEditing(!item) // New items open straight into edit mode.
    setIsConfirmingDelete(false)

    // Fallback for any legacy row still holding a bare storage path. After the
    // cover migration this should never fire.
    if (item?.cover_url && !item.cover_url.startsWith('http')) {
      let cancelled = false
      resolveCoverUrl(item.cover_url).then((url) => {
        if (!cancelled && url) patch({ coverUrl: url })
      })
      return () => {
        cancelled = true
      }
    }
  }, [isOpen, item])

  // Every tag in the library is searchable here, not just the first few matches.
  // `existingTags` comes from the live library snapshot, so tags added elsewhere
  // show up without a reload.
  const suggestedTags = suggestTags(existingTags, tagInput, form.tags)
  const trimmedTagInput = tagInput.trim()
  const isKnownTag = [...existingTags, ...form.tags].some(
    (tag) => tag.toLowerCase() === trimmedTagInput.toLowerCase(),
  )
  const canCreateTag = trimmedTagInput.length > 0 && !isKnownTag

  const handleCoverChange = async (file: File | undefined) => {
    if (!file || !isEditing) return

    setIsUploading(true)
    try {
      const { url, path, originalBytes, uploadedBytes } = await uploadCoverImage(file)
      patch({ coverUrl: url, coverPath: path })

      const saved = Math.round((1 - uploadedBytes / originalBytes) * 100)
      toast(saved > 5 ? `Cover uploaded — ${saved}% smaller.` : 'Cover uploaded.', 'success')
    } catch (error) {
      const message =
        error instanceof CoverProcessingError ? error.message : 'Could not upload that cover.'
      console.error('Cover upload failed:', error)
      toast(message, 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    const title = form.title.trim()
    if (!title) {
      toast('A title is required.', 'error')
      titleRef.current?.focus()
      return
    }

    setIsSaving(true)

    const data: Omit<MediaItemData, 'created_at'> = {
      title,
      type: form.type,
      status: form.status,
      seasons: form.type === 'tv' && form.seasons ? Number(form.seasons) : null,
      cover_url: form.coverUrl || null,
      cover_path: form.coverPath,
      date_finished: form.dateFinished || null,
      review: form.review.trim() || null,
      tags: form.tags,
      rating: form.rating,
    }

    try {
      if (item) {
        await updateItem(item.id, data)
      } else {
        await createItem({ ...data, created_at: new Date().toISOString() })
      }
      // The library listener reflects the write from the local cache immediately,
      // so there's nothing to invalidate or refetch here.
      onClose()
      toast(item ? 'Changes saved.' : `Added “${title}”.`, 'success')
    } catch (error) {
      console.error('Save failed:', error)
      toast('Could not save. Check your connection and try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    setIsConfirmingDelete(false)
    setIsSaving(true)

    try {
      await deleteItem(item.id)
      onClose()
      toast(`Deleted “${item.title}”.`, 'success')
    } catch (error) {
      console.error('Delete failed:', error)
      toast('Could not delete that item.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const addTag = (tag: string) => {
    // Reuse the library's existing casing so "Sci-Fi" doesn't become a second
    // tag next to "sci-fi".
    const next = canonicalizeTag(tag, existingTags)
    const alreadyApplied = form.tags.some((t) => t.toLowerCase() === next.toLowerCase())
    if (next && !alreadyApplied) patch({ tags: [...form.tags, next] })
    setTagInput('')
  }

  const isBusy = isSaving || isUploading

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={isBusy ? () => {} : onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="glass-panel relative w-full max-w-3xl transform overflow-hidden rounded-3xl p-5 text-left align-middle shadow-2xl transition-all sm:p-7">
                  <div className="absolute right-4 top-4 z-20 flex items-center gap-1">
                    {item && !isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="focus-ring rounded-full p-2 text-gray-500 transition-all hover:bg-gray-200/50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-gray-100"
                        aria-label="Edit this item"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="focus-ring rounded-full p-2 text-gray-500 transition-all hover:bg-gray-200/50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-gray-100"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      handleSave()
                    }}
                  >
                    <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] sm:gap-8">
                      {/* Cover */}
                      <div className="h-full">
                        <div className="group relative h-full min-h-[240px] overflow-hidden rounded-xl border border-gray-200/50 bg-gray-50 shadow-inner dark:border-gray-700/50 dark:bg-gray-800">
                          {isEditing && (
                            <input
                              type="file"
                              accept="image/*"
                              aria-label="Upload cover art"
                              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                              onChange={(event) => handleCoverChange(event.target.files?.[0])}
                            />
                          )}

                          {form.coverUrl ? (
                            <>
                              <img
                                src={form.coverUrl}
                                alt={`Cover of ${form.title || 'this item'}`}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              {isEditing && (
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-white/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                                  <Plus className="mb-2 h-8 w-8 text-gray-900" />
                                  <span className="text-sm font-bold uppercase tracking-widest text-gray-900">
                                    Replace
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center p-4 text-center text-gray-400 dark:text-gray-500">
                              {isEditing && <Plus className="mb-3 h-8 w-8" />}
                              <span className="text-sm font-semibold uppercase tracking-wide">
                                {isEditing ? 'Upload art' : 'No art'}
                              </span>
                              {isEditing && (
                                <span className="mt-1 text-xs font-medium normal-case tracking-normal text-gray-400">
                                  Any image — cropped to 2:3 and compressed automatically
                                </span>
                              )}
                            </div>
                          )}

                          {isUploading && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
                              <Loader2 className="h-6 w-6 animate-spin text-gray-900 dark:text-gray-100" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex min-w-0 flex-col justify-start space-y-4 pr-8">
                        {isEditing ? (
                          <input
                            ref={titleRef}
                            type="text"
                            className="focus-ring w-full border-0 border-b-2 border-transparent bg-transparent px-0 py-1 text-2xl font-extrabold text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-200 focus:border-primary-500 dark:text-gray-100 dark:hover:border-gray-700 sm:text-3xl"
                            placeholder="Enter title..."
                            value={form.title}
                            onChange={(event) => patch({ title: event.target.value })}
                            aria-label="Title"
                          />
                        ) : (
                          <Dialog.Title className="break-words px-0 py-1 text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
                            {form.title}
                          </Dialog.Title>
                        )}

                        <div
                          className={clsx(
                            'grid gap-3',
                            form.type === 'tv' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2',
                          )}
                        >
                          <div>
                            <label htmlFor="media-type" className={FIELD_LABEL_CLASSES}>
                              Type
                            </label>
                            {isEditing ? (
                              <select
                                id="media-type"
                                className={INPUT_CLASSES}
                                value={form.type}
                                onChange={(event) => patch({ type: event.target.value as MediaType })}
                              >
                                {MEDIA_TYPES.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className={READONLY_VALUE_CLASSES}>
                                {MEDIA_TYPES.find((t) => t.value === form.type)?.label}
                              </div>
                            )}
                          </div>

                          <div>
                            <label htmlFor="media-status" className={FIELD_LABEL_CLASSES}>
                              Status
                            </label>
                            {isEditing ? (
                              <select
                                id="media-status"
                                className={INPUT_CLASSES}
                                value={form.status}
                                onChange={(event) => patch({ status: event.target.value as StatusType })}
                              >
                                {STATUS_VALUES.map((value) => (
                                  <option key={value} value={value}>
                                    {STATUS_LABELS[value]}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className={READONLY_VALUE_CLASSES}>{STATUS_LABELS[form.status]}</div>
                            )}
                          </div>

                          {form.type === 'tv' && (
                            <div>
                              <label htmlFor="media-seasons" className={FIELD_LABEL_CLASSES}>
                                Seasons
                              </label>
                              {isEditing ? (
                                <input
                                  id="media-seasons"
                                  type="number"
                                  min="1"
                                  placeholder="#"
                                  className={INPUT_CLASSES}
                                  value={form.seasons}
                                  onChange={(event) =>
                                    patch({ seasons: event.target.value ? Number(event.target.value) : '' })
                                  }
                                />
                              ) : (
                                <div className={READONLY_VALUE_CLASSES}>{form.seasons || '—'}</div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label htmlFor="media-date" className={FIELD_LABEL_CLASSES}>
                              Date Finished
                            </label>
                            {isEditing ? (
                              <div className="relative">
                                <input
                                  id="media-date"
                                  type="date"
                                  className={clsx(INPUT_CLASSES, 'pl-9')}
                                  value={form.dateFinished}
                                  onChange={(event) => patch({ dateFinished: event.target.value })}
                                />
                                <Calendar
                                  className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                                  aria-hidden="true"
                                />
                              </div>
                            ) : (
                              <div className={READONLY_VALUE_CLASSES}>
                                {form.dateFinished
                                  ? new Date(`${form.dateFinished}T00:00:00`).toLocaleDateString()
                                  : '—'}
                              </div>
                            )}
                          </div>

                          <div>
                            <span className={FIELD_LABEL_CLASSES}>Rating</span>
                            <div className="flex h-[38px] gap-2" role="group" aria-label="Rating">
                              {RATING_BUTTONS.map(({ value, Icon, label }) => (
                                <button
                                  key={value}
                                  type="button"
                                  disabled={!isEditing}
                                  aria-label={label}
                                  aria-pressed={form.rating === value}
                                  onClick={() => patch({ rating: form.rating === value ? null : value })}
                                  className={clsx(
                                    'focus-ring flex flex-1 items-center justify-center rounded-lg border shadow-sm transition-all',
                                    isEditing ? 'cursor-pointer active:scale-95' : 'cursor-default',
                                    form.rating === value
                                      ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                                      : isEditing
                                        ? 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                                        : 'border-gray-200/50 bg-transparent text-gray-400 opacity-50',
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        <div>
                          <span className={FIELD_LABEL_CLASSES}>Tags</span>
                          {isEditing ? (
                            <Combobox
                              value={form.tags}
                              onChange={(tags: string[]) => {
                                patch({ tags })
                                setTagInput('')
                              }}
                              multiple
                            >
                              <div className="relative">
                                <div className="relative w-full cursor-text overflow-hidden rounded-lg border border-gray-200/60 bg-gray-50 text-left shadow-sm transition-all focus-within:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/20 dark:border-gray-700/60 dark:bg-gray-800/60">
                                  <div className="flex min-h-[38px] flex-wrap items-center gap-1 p-1.5">
                                    {form.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="flex items-center gap-1 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-primary-500"
                                      >
                                        {tag}
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            patch({ tags: form.tags.filter((t) => t !== tag) })
                                          }}
                                          className="focus-ring rounded transition-colors hover:text-red-300"
                                          aria-label={`Remove tag ${tag}`}
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </span>
                                    ))}
                                    <Combobox.Input
                                      className="min-w-[80px] flex-1 border-none bg-transparent p-1 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-gray-100"
                                      placeholder={form.tags.length === 0 ? 'Add tags...' : ''}
                                      onChange={(event) => setTagInput(event.target.value)}
                                      onKeyDown={(event) => {
                                        if (event.key === 'Enter' && tagInput.trim()) {
                                          event.preventDefault()
                                          addTag(tagInput)
                                        }
                                        if (event.key === 'Backspace' && !tagInput && form.tags.length) {
                                          patch({ tags: form.tags.slice(0, -1) })
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
                                  <Combobox.Options className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-xl focus:outline-none dark:border-gray-700 dark:bg-gray-800">
                                    {/* Creating stays available even when the query
                                        also matches existing tags. */}
                                    {canCreateTag && (
                                      <Combobox.Option
                                        value={trimmedTagInput}
                                        className="relative cursor-pointer select-none px-4 py-2 font-medium text-gray-700 transition-colors ui-active:bg-gray-50 ui-active:text-gray-900 dark:text-gray-300 dark:ui-active:bg-gray-700 dark:ui-active:text-gray-100"
                                      >
                                        Create “{trimmedTagInput}”
                                      </Combobox.Option>
                                    )}

                                    {suggestedTags.map((tag) => (
                                      <Combobox.Option
                                        key={tag}
                                        value={tag}
                                        className={({ active }) =>
                                          clsx(
                                            'relative cursor-pointer select-none px-4 py-2 font-medium transition-colors',
                                            active
                                              ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                                              : 'text-gray-700 dark:text-gray-300',
                                          )
                                        }
                                      >
                                        <span className="block truncate">{tag}</span>
                                      </Combobox.Option>
                                    ))}

                                    {!canCreateTag && suggestedTags.length === 0 && (
                                      <div className="select-none px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                                        {trimmedTagInput ? 'Already added.' : 'No tags yet.'}
                                      </div>
                                    )}
                                  </Combobox.Options>
                                </Transition>
                              </div>
                            </Combobox>
                          ) : (
                            <div className="flex min-h-[38px] flex-wrap items-center gap-2 py-1.5 pl-1">
                              {form.tags.length ? (
                                form.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-primary-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm dark:bg-primary-500"
                                  >
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-base font-bold text-gray-400">—</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Review */}
                        <div>
                          <label htmlFor="media-review" className={FIELD_LABEL_CLASSES}>
                            Review
                          </label>
                          {isEditing ? (
                            <textarea
                              id="media-review"
                              className={clsx(INPUT_CLASSES, 'h-24 resize-none leading-relaxed')}
                              value={form.review}
                              onChange={(event) => patch({ review: event.target.value })}
                              placeholder="Thoughts on this?"
                            />
                          ) : (
                            <div className="min-h-[80px] whitespace-pre-wrap py-2 pl-1 text-base font-medium leading-relaxed text-gray-800 dark:text-gray-200">
                              {form.review || (
                                <span className="font-normal italic text-gray-400">No review added.</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-6 flex flex-col-reverse items-center justify-between gap-4 border-t border-gray-100 pt-4 dark:border-gray-800/50 sm:flex-row sm:gap-0">
                        <div className="w-full sm:w-auto">
                          {item && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setIsConfirmingDelete(true)}
                              className="focus-ring inline-flex w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-bold tracking-wide text-red-600 shadow-sm transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 sm:w-auto"
                            >
                              Delete Item
                            </button>
                          )}
                        </div>

                        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                          <button
                            type="button"
                            onClick={onClose}
                            className="focus-ring w-full rounded-xl border border-transparent px-3 py-2.5 text-sm font-bold tracking-wide text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 sm:w-auto"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!form.title.trim() || isBusy}
                            className="focus-ring inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold tracking-wide text-white shadow-md transition-all hover:bg-primary-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-400 sm:w-auto"
                          >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {item ? 'Save Changes' : 'Add Item'}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title="Delete this item?"
        message={`“${item?.title ?? ''}” will be removed from your library. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </>
  )
}
