# Media Tracker

A personal PWA for tracking the movies, TV shows, and books you've finished.
Single-user, not for public use.

Built with **React**, **TanStack Router**, **Firebase** (Firestore + Storage +
Auth), and **Tailwind CSS**.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173. You'll be redirected to the login screen; sign in
with the project's Firebase account.

- Node 18+ (developed on 24)
- No `.env` is required for local development — the Firebase web config is
  committed as defaults in `src/lib/firebase.ts`. Override via `VITE_FIREBASE_*`
  env vars only if pointing at a different project.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc --noEmit` then `vite build` (typechecks first) |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Typecheck only |
| `npm run generate-icons` | Regenerate PWA icons from `public/icon.svg` (requires `sharp`) |
| `npm run backup` | Export the library to `backup.json` + mirror covers to `backup_images/` |
| `npm run optimize-covers` | One-time cover compression (see [Cover migration](#cover-migration)) |

---

## Architecture

```
src/
├── main.tsx                  App entry; providers (Theme, Toast, Auth, MediaLibrary)
├── router.tsx                TanStack Router instance
├── routes/
│   ├── __root.tsx            Root + error/not-found boundaries
│   ├── login.tsx             Login screen
│   └── _layout/
│       ├── _layout.tsx       Auth guard (redirects to /login when signed out)
│       ├── index.tsx         Dashboard — the media wall
│       └── bulk-upload.lazy.tsx   Lazy-loaded bulk import screen
├── data/
│   ├── MediaLibraryProvider.tsx   Single onSnapshot subscription over the library
│   ├── mutations.ts               createItem / updateItem / deleteItem / bulkCreateItems
│   ├── selectors.ts               In-memory filter/sort/search + useFilteredMedia hook
│   └── normalize.ts               Coerces raw Firestore docs into MediaItem
├── lib/
│   ├── firebase.ts          Firebase init (persistent Firestore cache)
│   └── image.ts             Client-side cover compression (canvas → WebP)
├── services/
│   └── storage.ts           Cover upload + legacy URL resolution
├── components/               MediaCard, MediaModal, FilterBar, Toast, ConfirmDialog, …
├── contexts/                 AuthContext, ThemeContext
├── hooks/                    useInView (IntersectionObserver)
└── types.ts                  MediaItem, StatusType, Rating, constants
```

### Data flow

```
Firebase Auth ──► AuthContext ──► MediaLibraryProvider
                                      │  onSnapshot(collection('media_items'))
                                      ▼
                                   items: MediaItem[]
                                      │
                          useFilteredMedia(items, filter)
                                      │  pure in-memory filter/sort/search
                                      ▼
                              Dashboard / components
```

The entire library is held in memory. This is deliberate and documented in
`CLAUDE.md` — see the "load-everything-once invariant" before changing it.

### Mutations are fire-and-forget

`createItem`, `updateItem`, `deleteItem`, and `bulkCreateItems` write straight to
Firestore. The persistent local cache applies each write locally first and fires
the `onSnapshot` listener immediately, before the server responds — that latency
compensation *is* the optimistic update. No manual cache reconciliation, no
React Query, no invalidation calls.

---

## Cover images

Every cover is normalized to **2:3, max 600×900, WebP q82** (~40–60 KB each).
This happens:

- **On upload** — `src/lib/image.ts` compresses in the browser via canvas before
  uploading. Any aspect ratio is accepted; non-2:3 images are centre-cropped.
- **For existing covers** — `scripts/optimize-covers.mjs` does the same server-side
  via `sharp` and rewrites each document's `cover_url` to the result.

The document stores a **full Storage download URL** in `cover_url`. This is what
makes the grid fast: covers render with a single `<img src>` and no per-image
`getDownloadURL()` round trip. The service worker caches them indefinitely
(`CacheFirst`, 90 days) so a repeat visit paints the whole grid with zero image
requests.

### Cover migration

The library's originals averaged 552 KB (p90 = 2 MB, max = 10.7 MB). The
migration re-encodes them to ~40–60 KB each — roughly a 90% reduction.

```bash
# 1. Review what would change (no writes):
npm run optimize-covers -- --dry-run

# 2. Inspect migration-report.json, then run for real:
npm run optimize-covers

# Optional: process only the first 50 to be cautious
npm run optimize-covers -- --limit 50
```

Uses the Firebase Admin SDK with a service account key. Generate one in
[Firebase Console](https://console.firebase.google.com/project/media-tracker-94a70/settings/serviceaccounts/adminsdk)
> Generate new private key, and save it as `service-account.json` in the project
root (gitignored). No gcloud or email/password needed.

**Nothing is destroyed**: compressed images are uploaded as new `.webp` objects;
originals stay in Storage; `backup_images/` (from `npm run backup`) holds a local
copy and is the rollback source. The report contains each document's previous
`cover_url` for rollback.

---

## Security

`firestore.rules` and `storage.rules` restrict all access to the owner's Firebase
account (`sunnyliu010@gmail.com`). Deploy with:

```bash
firebase deploy --only firestore:rules,storage
```

The Firebase web config in `src/lib/firebase.ts` is **not a secret** — those
values identify the project and are shipped in every Firebase web app's bundle by
design. Access control is enforced entirely by the rules.

---

## Backups

A GitHub Action (`.github/workflows/backup.yml`) runs on the 1st and 15th of each
month, exporting the library to `backup.json` and uploading it to Firebase
Storage + a GitHub artifact (90-day retention). It uses `--skip-images` in CI
since the runner is ephemeral; run `npm run backup` locally to mirror covers into
`backup_images/`.

CI authenticates via a service account key — generate one in Firebase Console >
Project Settings > Service Accounts > Generate new private key, base64-encode it,
and add it as the `BASE64_FIREBASE_SERVICE_ACCOUNT` repository secret.

---

## Deployment (Vercel)

1. Push to GitHub.
2. Import in Vercel — framework auto-detected as Vite.
3. No environment variables required (defaults are committed).
4. Deploy. `vercel.json` rewrites all routes to `index.html` for client-side
   routing.

The PWA manifest and service worker are generated by `vite-plugin-pwa`.

---

## PWA

Installable on mobile/desktop. Icons are generated from `public/icon.svg`:

```bash
npm run generate-icons
```

The theme is set before first paint by an inline script in `index.html` to avoid
a flash of the wrong theme. Inter is self-hosted via `@fontsource-variable/inter`.
