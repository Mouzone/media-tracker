import { addDoc, collection, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db, MEDIA_COLLECTION } from '../lib/firebase'
import type { MediaItemData } from '../types'

/**
 * Writes go straight to Firestore — no cache juggling required.
 *
 * With the persistent local cache enabled (`src/lib/firebase.ts`), Firestore
 * applies each write to the local cache first and fires the `onSnapshot`
 * listener in `MediaLibraryProvider` immediately, before the server responds.
 * That latency compensation *is* the optimistic update: the UI reflects a save
 * or delete instantly, and rolls back on its own if the server rejects it.
 */

const mediaCollection = () => collection(db, MEDIA_COLLECTION)

export async function createItem(data: MediaItemData): Promise<string> {
  const ref = await addDoc(mediaCollection(), data)
  return ref.id
}

export async function updateItem(id: string, data: Partial<MediaItemData>): Promise<void> {
  await updateDoc(doc(db, MEDIA_COLLECTION, id), data)
}

export async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(db, MEDIA_COLLECTION, id))
}

/** Firestore caps a batch at 500 operations, so large imports are chunked. */
const BATCH_LIMIT = 500

export async function bulkCreateItems(records: MediaItemData[]): Promise<void> {
  for (let i = 0; i < records.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const record of records.slice(i, i + BATCH_LIMIT)) {
      batch.set(doc(mediaCollection()), record)
    }
    await batch.commit()
  }
}
