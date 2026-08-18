/**
 * Standardises tags across the library.
 *
 * Two passes:
 *
 *   1. An explicit rename/removal table (below) for the semantic overlaps that
 *      no algorithm can settle — "Historical Fiction" vs "Historical" is a
 *      judgement call about your taxonomy, not a spelling mistake.
 *
 *   2. A mechanical audit that clusters tags differing only by case, whitespace,
 *      separator style, punctuation, or a trailing plural "s". This catches
 *      future drift ("Sci-Fi" / "sci fi") and reports it rather than guessing.
 *      As of the 2026-08 cleanup this pass finds nothing — tags are uniformly
 *      Title Case.
 *
 * Dry run by default — prints the plan and writes nothing:
 *   npm run normalize-tags
 *
 * Apply it, after reading the plan:
 *   npm run normalize-tags -- --apply
 */
import { connect, MEDIA_COLLECTION } from './firebase-node.mjs'

const apply = process.argv.includes('--apply')

/**
 * Deliberate merges. Left side disappears; right side absorbs its items.
 *
 * Note what is *not* here: "Football" and "Soccer" look like duplicates but are
 * not — Football is American football (The Replacements, Any Given Sunday, Home
 * Team, Eyeshield 21) and Soccer is association football (Soccernomics,
 * Inverting the Pyramid, the All or Nothing docs). Likewise "Music" (subject,
 * Shiori Experience) is distinct from "Musical" (genre, Hamilton), and "Food"
 * from "Cooking".
 */
const RENAMES = new Map([
  // Same concept, one spelled as the adjective.
  ['Christian', 'Christianity'],

  // "Historical" already carries fiction (Steel Ball Run, Hellsing, Sidooh), so
  // the separate fiction/non-fiction tags weren't earning their keep.
  ['Historical Fiction', 'Historical'],
  ['History', 'Historical'],

  // One item (Psych) against 19 already tagged Mystery.
  ['Detective', 'Mystery'],

  // Every other multi-word tag is spaced and Title Case.
  ['Talkshow', 'Talk Show'],
  ['Gameshow', 'Game Show'],
  ['One-shot', 'One Shot'],
])

/**
 * Tags dropped outright. "Fiction" sat on a single book while nearly the whole
 * library is fiction, so it filtered nothing.
 */
const REMOVE = new Set(['Fiction'])

/**
 * Collapses a tag to a comparison key for the drift audit. Everything mapping to
 * the same key is the same tag: case, whitespace, separator style, punctuation,
 * and a trailing plural "s".
 */
function driftKey(tag) {
  const base = tag
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

  // "movies" folds onto "movie"; "ss" endings (e.g. "class") are left alone.
  return base.endsWith('s') && !base.endsWith('ss') && base.length > 3 ? base.slice(0, -1) : base
}

/** Applies the rename table and removals, trimming and deduping the result. */
function rewriteTags(tags) {
  const next = []
  for (const tag of tags) {
    if (typeof tag !== 'string') continue
    const trimmed = tag.trim()
    if (!trimmed || REMOVE.has(trimmed)) continue
    const replaced = (RENAMES.get(trimmed) ?? trimmed).trim()
    if (replaced && !next.includes(replaced)) next.push(replaced)
  }
  return next
}

function reportDrift(items) {
  const clusters = new Map()
  for (const item of items) {
    for (const tag of rewriteTags(item.tags ?? [])) {
      const key = driftKey(tag)
      if (!key) continue
      const variants = clusters.get(key) ?? new Map()
      variants.set(tag, (variants.get(tag) ?? 0) + 1)
      clusters.set(key, variants)
    }
  }

  const messy = [...clusters.values()].filter((variants) => variants.size > 1)
  if (messy.length === 0) {
    console.log('Drift audit: no case/spacing/plural duplicates.\n')
    return
  }

  console.log(`Drift audit: ${messy.length} concept(s) spelled more than one way —`)
  for (const variants of messy) {
    const spellings = [...variants.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${JSON.stringify(tag)} (${n})`)
      .join('  vs  ')
    console.log(`  ${spellings}`)
  }
  console.log('  Not auto-merged — add them to RENAMES if they should collapse.\n')
}

async function main() {
  const { db } = await connect()
  const snapshot = await db.collection(MEDIA_COLLECTION).get()
  const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

  if (items.length === 0) {
    throw new Error('Read 0 documents — refusing to run against an empty collection.')
  }

  const edits = []
  for (const item of items) {
    const original = Array.isArray(item.tags) ? item.tags : []
    const next = rewriteTags(original)
    const changed = next.length !== original.length || next.some((tag, i) => tag !== original[i])
    if (changed) edits.push({ id: item.id, title: item.title, from: original, to: next })
  }

  console.log(`${items.length} items scanned.\n`)
  reportDrift(items)

  if (edits.length === 0) {
    console.log('Nothing to change — tags already match the rename table.')
    return
  }

  console.log(`${edits.length} document(s) to update:\n`)
  for (const edit of edits) {
    console.log(`  ${edit.title}`)
    console.log(`    [${edit.from.join(', ')}]  ->  [${edit.to.join(', ')}]`)
  }

  if (!apply) {
    console.log('\nDry run — nothing written. Re-run with --apply to commit.')
    return
  }

  // Firestore caps a batch at 500 writes.
  for (let i = 0; i < edits.length; i += 400) {
    const batch = db.batch()
    for (const edit of edits.slice(i, i + 400)) {
      batch.update(db.collection(MEDIA_COLLECTION).doc(edit.id), { tags: edit.to })
    }
    await batch.commit()
    console.log(`\n  committed ${Math.min(i + 400, edits.length)}/${edits.length}`)
  }

  console.log(`\nUpdated ${edits.length} document(s).`)
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error('Tag normalisation failed:', error)
    process.exit(1)
  },
)
