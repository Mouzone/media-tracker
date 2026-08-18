# CLAUDE.md

Reference for AI-assisted edits to this codebase. Read this before changing
anything in `src/` or `scripts/`.

## What this app is

A personal single-user PWA for tracking finished media (movies, TV, books).
Firebase back-end (Firestore + Storage + Auth). React + TanStack Router +
Tailwind. Not for public use — security rules hardcode the owner's email.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc --noEmit && vite build (typechecks first)
npm run typecheck    # tsc --noEmit only
npm run preview      # serve the production build
```

Node-side scripts (use the Firebase Admin SDK — require `service-account.json`
in the project root, generated via Firebase Console > Project Settings >
Service Accounts > Generate new private key):

```bash
npm run backup              # export library + mirror covers
npm run optimize-covers     # one-time cover compression (supports --dry-run, --limit N)
npm run normalize-tags      # audit/repair tag spelling (dry run; --apply to write)
npm run generate-icons      # regenerate PWA icons from public/icon.svg
```

No email/password or gcloud needed — the service account key bypasses security
rules. In CI, set `BASE64_FIREBASE_SERVICE_ACCOUNT` as a repository secret (the
workflow decodes it to `service-account.json`).

## The load-everything-once invariant

`MediaLibraryProvider` holds the **entire** `media_items` collection in memory
via a single `onSnapshot` subscription. Filter, sort, and search are all
in-memory (`src/data/selectors.ts`). There is no pagination, no React Query, no
server-side filtering.

**This is correct because the library is ~700 documents (~few hundred KB of
JSON).** Loading all of it is cheaper and simpler than paging.

**When to revisit:** if the library grows past ~5,000 items, switch to
`@tanstack/react-virtual` for the grid (rendering 5,000 DOM cards will jank) and
consider reintroducing server-side filtering. The threshold is about DOM cost,
not memory — 5,000 items in memory is trivial; 5,000 `<img>` elements is not.

**Do not reintroduce paginated Firestore queries.** The previous implementation
had real bugs (see "Firestore gotchas" below). If you must paginate, use cursor
pagination (`startAfter` with the last document), never the `limit((page+1)*n)`
pattern that was here before.

## Mutations

`src/data/mutations.ts` — `createItem`, `updateItem`, `deleteItem`,
`bulkCreateItems`. These write straight to Firestore. The persistent local cache
fires `onSnapshot` immediately with the local write, so the UI updates
optimistically with **no manual cache code**. Do not add React Query, optimistic
update helpers, or `invalidateQueries` calls — they are not needed and will
conflict with the listener.

## Tags

Free text, no controlled vocabulary. Kept consistent by convention rather than
constraint: **Title Case, multi-word tags spaced** (`Comedy Special`, `Slice of
Life`, `Talk Show`). As of the 2026-08 cleanup there are 59 distinct tags and no
case/spacing duplicates.

`suggestTags()` and `canonicalizeTag()` in `src/data/selectors.ts` back every tag
input (modal, filter bar, bulk upload). `canonicalizeTag` folds a typed tag onto
an existing one differing only by case, which is what keeps the convention from
drifting. Autocomplete searches the **whole** tag list — do not re-add a
`.slice(0, N)`, which is what previously made older tags unreachable.

`scripts/normalize-tags.mjs` repairs drift after the fact. Its `RENAMES` table
is deliberately explicit: semantic merges are taxonomy calls, not spelling
fixes. Two pairs that look like duplicates and are not — `Football` (American)
vs `Soccer`, and `Music` (subject) vs `Musical` (genre).

## Cover image contract

- Every cover is **2:3, max 600×900, WebP q82** (~40–60 KB).
- `cover_url` on the document holds a **full Storage download URL** (starts with
  `https://`). It is rendered directly in `<img src>`.
- `cover_path` holds the Storage path (e.g. `covers/1770860313421.webp`).
- **Never call `getDownloadURL()` in a render path.** The old code did this per
  image per page — 20 sequential round trips before a single cover rendered.
  `resolveCoverUrl()` in `src/services/storage.ts` exists only as a fallback for
  legacy bare-path rows and is memoised per session.
- New uploads go through `processCoverImage()` in `src/lib/image.ts`, which
  compresses via canvas before upload. Any aspect ratio is accepted; non-2:3
  images are centre-cropped (`fit: 'cover'`).
- The service worker caches covers with `CacheFirst` for 90 days
  (`vite.config.ts`). Covers are immutable (unique filename per upload), so this
  is safe.

## Firestore gotchas that caused real bugs here

1. **`orderBy` silently drops documents missing the field.** The old code's
   `orderBy('rating', 'desc')` hid every unrated item. `orderBy('status')` would
   do the same. **Sort in memory** (`src/data/selectors.ts`), never with
   `orderBy` on a nullable field.

2. **`array-contains-any` + `orderBy` requires a composite index.** The old
   tag-filter + sort combos failed at runtime because the indexes didn't exist.
   In-memory filtering avoids this entirely.

3. **`orderBy('rating', 'desc')` sorts lexicographically** — `ok` > `like` >
   `dislike`, which is wrong. Ratings sort by `RATING_RANK` (`like` 3 / `ok` 2 /
   `dislike` 1 / null 0) in `selectors.ts`.

4. **The `onSnapshot` query has no `orderBy`** for reason #1. Documents arrive in
   Firestore's internal order; `selectors.ts` sorts them.

## Status values — four, in lockstep

`StatusType = 'backlog' | 'in_progress' | 'finished' | 'dropped'`

Defined in `src/types.ts` with `STATUS_VALUES` and `STATUS_LABELS`. If you add or
remove a value, update **all** of these in lockstep:

- `STATUS_VALUES` / `STATUS_LABELS` in `src/types.ts`
- The status `<select>` in `src/components/MediaModal.tsx`
- The status `<select>` in `src/routes/_layout/bulk-upload.lazy.tsx`
- `STATUS_OPTIONS` in `src/components/FilterBar.tsx` (derived from `STATUS_VALUES`)
- `coerceStatus` in `src/data/normalize.ts`

They previously drifted: the modal offered `backlog`/`in_progress` while the type
and filter bar knew only `finished`/`dropped`, making those items unreachable in
the UI.

`normalizeMediaDoc` in `src/data/normalize.ts` coerces any unknown/missing status
to `'finished'`, so old documents with invalid values don't crash the app.

## Firebase config is not a secret

The values in `src/lib/firebase.ts` (apiKey, projectId, etc.) are shipped in the
client bundle by design — they identify the project, not grant access. Access
control is in `firestore.rules` / `storage.rules` (owner email check). Don't
treat them as secrets or move them to server-only env vars.

## Security rules

`firestore.rules` and `storage.rules` restrict all access to
`sunnyliu010@gmail.com`. The `isOwner()` function does **not** require
`email_verified` — Firebase console-created accounts are unverified by default,
and requiring it would lock the owner out.

Deploy: `firebase deploy --only firestore:rules,storage`

## Bundle structure

- `vendor-firebase` — Firebase SDK (812 KB, 203 KB gzip). Changes rarely.
- `vendor-react` — React + ReactDOM + TanStack Router (225 KB, 72 KB gzip).
- `index` — app code (185 KB, 59 KB gzip).
- `MediaModal` — lazy-loaded (16 KB). Fetched on idle via `requestIdleCallback`.
- `bulk-upload.lazy` — lazy route (15 KB). Fetched on navigation.
- `ConfirmDialog` — lazy-loaded by MediaModal.

Inter is self-hosted (`@fontsource-variable/inter`), not via Google Fonts. The
theme is set before first paint by an inline script in `index.html`.

## What was removed and why

- **`framer-motion`** — every card had `layout` + `layoutId`, forcing layout
  measurement across all cards on every render. Replaced with CSS transitions.
- **`@tanstack/react-query`** — replaced by the `onSnapshot` listener + persistent
  cache. No query invalidation needed.
- **`zod`** — only used by a deleted placeholder route (`/$category`).
- **`tailwind-merge`** — zero imports.
- **`searchMedia()`** (iTunes/OpenLibrary lookup) — dead code, never called.
- **`src/routes/_layout/$category.tsx`** — placeholder that matched unknown paths
  and rendered nothing. Replaced by the root `notFoundComponent`.
- **`src/hooks/useImagePreloader.ts`** — caused massive performance issues on
  initial load; removed.
- **Pagination** (`src/services/api.ts`, `useMediaItems.tsx`, `useSmartPreloader.ts`)
  — replaced by the in-memory library.

## Conventions

- **No `alert()` or `window.confirm()`** — use `useToast()` and `<ConfirmDialog>`.
- **`focus-ring` class** for keyboard focus styling (defined in `src/styles.css`).
- **`clsx`** for conditional class composition.
- **`lucide-react`** for icons.
- **Headless UI** for the modal (`Dialog`), comboboxes, and listboxes.
- **`prefers-reduced-motion`** is respected globally (see `src/styles.css`).
- Files in `src/lib/` are framework-agnostic utilities; `src/services/` wraps
  Firebase; `src/data/` is the data layer; `src/components/` is React UI.
