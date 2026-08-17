import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { signOut } from 'firebase/auth'
import { LogOut, Menu, Moon, Plus, Search, Sun, Upload, X } from 'lucide-react'
import clsx from 'clsx'
import { MediaCard } from '../../components/MediaCard'
import { SkeletonGrid } from '../../components/SkeletonLoader'
import { FilterBar } from '../../components/FilterBar'
import { useToast } from '../../components/Toast'
import { useMediaLibrary } from '../../data/MediaLibraryProvider'
import { DEFAULT_FILTER, isDefaultFilter, useAllTags, useFilteredMedia } from '../../data/selectors'
import type { LibraryFilter } from '../../data/selectors'
import { useInView } from '../../hooks/useInView'
import { useTheme } from '../../contexts/ThemeContext'
import { auth } from '../../lib/firebase'
import { MEDIA_TYPE_LABELS } from '../../types'
import type { MediaItem, MediaType } from '../../types'

/**
 * The modal pulls in Headless UI's Dialog and Combobox, which most page loads
 * never need. It's fetched on idle so the first open is still instant.
 */
const MediaModal = lazy(() =>
  import('../../components/MediaModal').then((m) => ({ default: m.MediaModal })),
)

export const Route = createFileRoute('/_layout/')({
  component: Dashboard,
})

/**
 * The whole library lives in memory, so "pagination" is purely about how much
 * DOM we create. We render a window and grow it as the user scrolls — no network
 * involved, so it's instant.
 */
const INITIAL_WINDOW = 60
const WINDOW_STEP = 60

const FAB_CLASSES =
  'focus-ring glass flex h-12 w-12 items-center justify-center rounded-full text-gray-700 shadow-md transition-all duration-300 hover:scale-110 hover:text-primary-600 active:scale-95 dark:text-gray-300 dark:hover:text-primary-400 sm:h-14 sm:w-14'

function Dashboard() {
  const router = useRouter()
  const toast = useToast()
  const { theme, toggleTheme } = useTheme()
  const { items, status, error, isFromCache } = useMediaLibrary()

  const [filter, setFilter] = useState<LibraryFilter>(DEFAULT_FILTER)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false)
  const [isFabOpen, setIsFabOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(INITIAL_WINDOW)

  const panelRef = useRef<HTMLDivElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)

  const allTags = useAllTags(items)
  const visibleItems = useFilteredMedia(items, filter)
  const hasMore = visibleCount < visibleItems.length

  const patchFilter = useCallback((updates: Partial<LibraryFilter>) => {
    setFilter((current) => ({ ...current, ...updates }))
  }, [])

  // Any filter change starts the render window over from the top.
  useEffect(() => {
    setVisibleCount(INITIAL_WINDOW)
  }, [filter])

  // Warm the modal chunk once the page is idle.
  useEffect(() => {
    const schedule = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500))
    const handle = schedule(() => void import('../../components/MediaModal'))
    return () => window.cancelIdleCallback?.(handle as number)
  }, [])

  const observerOptions = useMemo(() => ({ rootMargin: '600px' }), [])
  const [sentinelRef, isSentinelInView] = useInView(observerOptions)

  useEffect(() => {
    if (isSentinelInView && hasMore) {
      setVisibleCount((current) => current + WINDOW_STEP)
    }
  }, [isSentinelInView, hasMore, visibleCount])

  // Close the search panel on an outside click or Escape.
  useEffect(() => {
    if (!isSearchPanelOpen) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!panelRef.current?.contains(target) && !searchButtonRef.current?.contains(target)) {
        setIsSearchPanelOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSearchPanelOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isSearchPanelOpen])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.invalidate()
    } catch (err) {
      console.error('Sign out failed:', err)
      toast('Could not sign out.', 'error')
    }
  }

  const handleCardClick = useCallback((item: MediaItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }, [])

  const handleTypeClick = (type: MediaType) => {
    patchFilter({ type: filter.type === type ? null : type })
  }

  const canReset = !isDefaultFilter(filter)

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 pb-[calc(8rem+env(safe-area-inset-bottom))] transition-colors duration-150 dark:from-gray-900 dark:to-gray-950">
      <div className="relative w-full">
        {status === 'error' ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 px-4">
            <p className="font-semibold text-red-500">Couldn’t load your library.</p>
            <p className="max-w-xl rounded-lg bg-red-500/10 p-4 text-center font-mono text-sm text-red-400">
              {error?.message ?? 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="focus-ring rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              Reload
            </button>
          </div>
        ) : status === 'loading' ? (
          <div className="px-2 py-4 sm:px-4">
            <SkeletonGrid count={24} />
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="font-medium tracking-wide text-gray-500">
              {items.length === 0 ? 'Your library is empty.' : 'Nothing matches these filters.'}
            </p>
            {items.length === 0 ? (
              <button
                onClick={() => {
                  setSelectedItem(null)
                  setIsModalOpen(true)
                }}
                className="focus-ring rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary-700"
              >
                Add your first item
              </button>
            ) : (
              <button
                onClick={() => setFilter(DEFAULT_FILTER)}
                className="focus-ring rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 px-2 py-4 sm:grid-cols-3 sm:gap-4 sm:px-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5 xl:grid-cols-6 2xl:grid-cols-8">
              {visibleItems.slice(0, visibleCount).map((item, index) => (
                <MediaCard key={item.id} item={item} index={index} onClick={handleCardClick} />
              ))}
            </div>

            <div ref={sentinelRef} className="mb-8 mt-4 flex h-12 items-center justify-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {hasMore
                  ? `${visibleItems.length - visibleCount} more`
                  : `${visibleItems.length} ${visibleItems.length === 1 ? 'item' : 'items'}${
                      canReset ? ` of ${items.length}` : ''
                    }`}
              </p>
            </div>
          </>
        )}

        {status === 'ready' && isFromCache && (
          <p className="pb-4 text-center text-[11px] font-medium uppercase tracking-widest text-gray-400">
            Offline — showing saved library
          </p>
        )}
      </div>

      {/* Floating actions */}
      <div className="fixed bottom-6 right-4 z-50 mb-[env(safe-area-inset-bottom)] flex flex-col items-center gap-3 sm:bottom-8 sm:right-8 sm:gap-4">
        <div
          className={clsx(
            'flex origin-bottom flex-col items-center gap-3 transition-all duration-300 ease-emphasis sm:gap-4',
            isFabOpen
              ? 'translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-8 scale-50 opacity-0',
          )}
          aria-hidden={!isFabOpen}
        >
          <button onClick={handleLogout} className={FAB_CLASSES} aria-label="Sign out" title="Sign out">
            <LogOut className="h-5 w-5" />
          </button>

          <button
            onClick={toggleTheme}
            className={FAB_CLASSES}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            ref={searchButtonRef}
            onClick={() => setIsSearchPanelOpen((open) => !open)}
            aria-expanded={isSearchPanelOpen}
            aria-label="Search and filter"
            title="Search & filter"
            className={clsx(
              'focus-ring flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-all duration-300 sm:h-14 sm:w-14',
              isSearchPanelOpen
                ? 'scale-110 border border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-700/50 dark:bg-primary-900/30 dark:text-primary-400'
                : 'glass text-gray-700 hover:scale-110 hover:text-primary-600 active:scale-95 dark:text-gray-300 dark:hover:text-primary-400',
            )}
          >
            <Search className="h-5 w-5" />
            {canReset && !isSearchPanelOpen && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary-500 ring-2 ring-white dark:ring-gray-900" />
            )}
          </button>

          <Link to="/bulk-upload" className={FAB_CLASSES} aria-label="Bulk add items" title="Bulk add">
            <Upload className="h-5 w-5" />
          </Link>

          <button
            onClick={() => {
              setIsFabOpen(false)
              setSelectedItem(null)
              setIsModalOpen(true)
            }}
            className="focus-ring group flex h-12 w-12 items-center justify-center rounded-full border border-primary-200 bg-primary-100 text-primary-700 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 dark:border-primary-800/60 dark:bg-primary-900/40 dark:text-primary-300 sm:h-14 sm:w-14"
            aria-label="Add a new item"
            title="Add item"
          >
            <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" strokeWidth={3} />
          </button>
        </div>

        <button
          onClick={() => setIsFabOpen((open) => !open)}
          aria-expanded={isFabOpen}
          aria-label={isFabOpen ? 'Close actions' : 'Open actions'}
          className={clsx(
            'focus-ring z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 active:scale-95 sm:h-[60px] sm:w-[60px]',
            isFabOpen
              ? 'rotate-180 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'
              : 'bg-primary-500 hover:scale-105 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500 dark:shadow-primary-900/50',
          )}
        >
          {isFabOpen ? <X className="h-6 w-6" strokeWidth={2.5} /> : <Menu className="h-6 w-6" strokeWidth={2.5} />}
        </button>
      </div>

      {/* Search & filter panel */}
      <div
        className={clsx(
          'fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] transition-transform duration-500 ease-emphasis sm:bottom-6 sm:left-1/2 sm:w-[90%] sm:max-w-2xl sm:-translate-x-1/2 sm:pb-0',
          isSearchPanelOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-[150%] opacity-0',
        )}
      >
        <div ref={panelRef} className="glass-panel mx-2 mb-2 rounded-t-3xl p-4 sm:mx-0 sm:mb-0 sm:rounded-3xl sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Search titles and tags..."
                  aria-label="Search titles and tags"
                  value={filter.search}
                  onChange={(event) => patchFilter({ search: event.target.value })}
                  className="focus-ring w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-11 text-base font-medium text-gray-900 shadow-inner transition-all placeholder:text-gray-400 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                {filter.search && (
                  <button
                    onClick={() => patchFilter({ search: '' })}
                    className="focus-ring absolute inset-y-0 right-3.5 my-auto h-5 rounded text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div
                className="flex shrink-0 rounded-full border border-gray-200/50 bg-gray-100/50 p-1 dark:border-gray-700/50 dark:bg-gray-800/50"
                role="group"
                aria-label="Filter by media type"
              >
                {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeClick(type)}
                    aria-pressed={filter.type === type}
                    className={clsx(
                      'focus-ring rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors',
                      filter.type === type
                        ? 'border border-gray-200/60 bg-white text-primary-700 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-primary-300'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
                    )}
                  >
                    {MEDIA_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <FilterBar
              filter={filter}
              onChange={patchFilter}
              availableTags={allTags}
              onReset={() => setFilter(DEFAULT_FILTER)}
              canReset={canReset}
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <Suspense fallback={null}>
          <MediaModal
            item={selectedItem}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedItem(null)
            }}
            existingTags={allTags}
          />
        </Suspense>
      )}
    </div>
  )
}
