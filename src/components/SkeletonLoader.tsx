import { ImageIcon } from 'lucide-react'

export function SkeletonCard() {
  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-gray-200/50 bg-gray-100 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent motion-safe:animate-shimmer dark:via-white/10" />
      <div className="absolute inset-0 flex items-center justify-center opacity-20 dark:opacity-10">
        <ImageIcon className="h-8 w-8 text-gray-500" aria-hidden="true" />
      </div>
    </div>
  )
}

/** Mirrors the dashboard grid exactly so nothing shifts when real cards arrive. */
export function SkeletonGrid({ count = 24 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5 xl:grid-cols-6 2xl:grid-cols-8"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
