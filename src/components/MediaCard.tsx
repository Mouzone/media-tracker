import React, { useState } from 'react'
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import clsx from 'clsx'
import { Marquee } from './Marquee'
import { COVER_HEIGHT, COVER_WIDTH } from '../lib/image'
import type { MediaItem } from '../types'

interface MediaCardProps {
  item: MediaItem
  onClick: (item: MediaItem) => void
  index: number
}

/** Covers above this index are lazy-loaded; the rest are fetched eagerly. */
const EAGER_COUNT = 12

const RATING_ICON = {
  like: { Icon: ThumbsUp, className: 'text-emerald-400', label: 'Liked' },
  ok: { Icon: Minus, className: 'text-gray-300', label: 'Mixed' },
  dislike: { Icon: ThumbsDown, className: 'text-red-400', label: 'Disliked' },
} as const

/**
 * Deliberately not a Framer Motion component.
 *
 * Every card used to carry `layout` + `layoutId`, which forces Motion to measure
 * every card's box on every render — expensive with hundreds on screen — and the
 * `layoutId` wasn't paired with anything, so it bought nothing. Hover and entrance
 * effects are plain CSS now, which the compositor handles off the main thread.
 */
export const MediaCard = React.memo(function MediaCard({ item, onClick, index }: MediaCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const isAboveFold = index < EAGER_COUNT
  const showImage = Boolean(item.cover_url) && !hasFailed
  const rating = item.rating ? RATING_ICON[item.rating] : null

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      aria-label={`${item.title} — open details`}
      className="focus-ring group relative m-0 aspect-[2/3] cursor-pointer overflow-hidden rounded-2xl bg-gray-100 p-0 text-left shadow-md transition duration-300 ease-emphasis will-change-transform hover:-translate-y-1 hover:shadow-xl motion-safe:animate-card-in dark:bg-gray-800"
      style={{
        // Skips layout and paint for off-screen cards; the intrinsic size keeps
        // the scrollbar honest so scrolling doesn't jump.
        contentVisibility: 'auto',
        containIntrinsicSize: '200px 300px',
        // Stagger the entrance across the first row or two only — beyond that the
        // delay would be perceived as the grid loading slowly.
        animationDelay: index < 24 ? `${Math.min(index, 24) * 20}ms` : '0ms',
      }}
    >
      {showImage ? (
        <div className="relative h-full w-full bg-gray-200 dark:bg-gray-800">
          {!isLoaded && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent motion-safe:animate-shimmer dark:via-white/10" />
            </div>
          )}
          <img
            src={item.cover_url!}
            alt=""
            width={COVER_WIDTH}
            height={COVER_HEIGHT}
            loading={isAboveFold ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={isAboveFold ? 'high' : 'auto'}
            className={clsx(
              'h-full w-full rounded-2xl object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
            )}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasFailed(true)}
          />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center bg-gray-200 p-3 text-center dark:bg-gray-800">
          <span className="line-clamp-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
            {item.title}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[40%] flex items-end bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        <div className="w-full text-white drop-shadow-md">
          <Marquee text={item.title} className="mb-1 text-lg font-extrabold tracking-tight" />
          <p className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
            {item.type === 'tv' && item.seasons
              ? `TV · ${item.seasons} season${item.seasons === 1 ? '' : 's'}`
              : item.type === 'tv'
                ? 'TV'
                : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            <span className="text-gray-500" aria-hidden="true">
              •
            </span>
            {rating ? (
              <rating.Icon className={clsx('inline h-4 w-4', rating.className)} aria-label={rating.label} />
            ) : (
              'Unrated'
            )}
          </p>
        </div>
      </div>
    </button>
  )
})
