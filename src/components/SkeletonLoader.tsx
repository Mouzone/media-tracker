

export const SkeletonCard = () => {
    return (
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-150%] animate-shimmer" />
        </div>
    )
}

interface SkeletonGridProps {
    count?: number
}

export const SkeletonGrid = ({ count = 20 }: SkeletonGridProps) => {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-0">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}
