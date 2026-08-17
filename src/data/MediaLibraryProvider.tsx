import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, MEDIA_COLLECTION } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { normalizeMediaDoc } from './normalize'
import type { MediaItem } from '../types'

export type LibraryStatus = 'loading' | 'ready' | 'error'

interface MediaLibraryValue {
  /** Every item in the library, newest first. */
  items: MediaItem[]
  status: LibraryStatus
  error: Error | null
  /** True while the data on screen came from disk and hasn't been confirmed by the server yet. */
  isFromCache: boolean
}

const MediaLibraryContext = createContext<MediaLibraryValue | undefined>(undefined)

/**
 * Subscribes to the entire `media_items` collection once and holds it in memory.
 *
 * This replaces the previous paginated fetching. The library is ~700 documents —
 * a few hundred KB of JSON — so loading all of it is both cheaper and simpler than
 * paging: filtering, sorting, and search become instant in-memory operations with
 * no network round trip and no composite indexes.
 *
 * See `docs`/CLAUDE.md for the threshold at which this stops being the right call.
 *
 * Deliberately no `orderBy` in the query: Firestore excludes documents that are
 * missing the ordered field, which would silently hide items. Sorting happens in
 * `selectors.ts` where we control the semantics.
 */
export function MediaLibraryProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<MediaItem[]>([])
  const [status, setStatus] = useState<LibraryStatus>('loading')
  const [error, setError] = useState<Error | null>(null)
  const [isFromCache, setIsFromCache] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([])
      setStatus('loading')
      return
    }

    const unsubscribe = onSnapshot(
      collection(db, MEDIA_COLLECTION),
      { includeMetadataChanges: true },
      (snapshot) => {
        // Fires immediately from the IndexedDB cache, then again with server data.
        setItems(snapshot.docs.map((doc) => normalizeMediaDoc(doc.id, doc.data())))
        setIsFromCache(snapshot.metadata.fromCache)
        setStatus('ready')
        setError(null)
      },
      (err) => {
        console.error('Media library subscription failed:', err)
        setError(err)
        setStatus('error')
      },
    )

    return unsubscribe
  }, [isAuthenticated])

  const value = useMemo<MediaLibraryValue>(
    () => ({ items, status, error, isFromCache }),
    [items, status, error, isFromCache],
  )

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>
}

export function useMediaLibrary() {
  const context = useContext(MediaLibraryContext)
  if (context === undefined) {
    throw new Error('useMediaLibrary must be used within a MediaLibraryProvider')
  }
  return context
}
