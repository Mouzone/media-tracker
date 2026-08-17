import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'

interface MarqueeProps {
  text: string
  className?: string
  /** Seconds for one full pass. Defaults to a length-proportional duration. */
  duration?: number
}

/**
 * Shows `text` truncated, and scrolls it on hover only when it actually overflows.
 *
 * The DOM structure is identical in both states and only classes change. An
 * earlier version swapped between two different trees, which meant the measured
 * element changed the moment overflow was detected — enough for borderline text
 * to oscillate, and enough to leave the ResizeObserver watching a detached node.
 *
 * Overflow is measured with a `ResizeObserver` rather than a window `resize`
 * listener so it stays correct when the grid reflows without the window changing
 * size (opening the filter panel, for instance).
 */
export function Marquee({ text, className, duration }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    const check = () => setIsOverflowing(textEl.scrollWidth > container.clientWidth + 1)
    check()

    const observer = new ResizeObserver(check)
    observer.observe(container)
    return () => observer.disconnect()
  }, [text])

  return (
    <div
      ref={containerRef}
      className={clsx('overflow-hidden', isOverflowing && 'mask-gradient flex', className)}
    >
      <div
        className={clsx(
          isOverflowing
            ? 'flex whitespace-nowrap [animation-play-state:paused] group-hover:[animation-play-state:running] motion-safe:animate-marquee'
            : 'truncate',
        )}
        style={{ '--marquee-duration': `${duration ?? Math.max(text.length * 0.2, 5)}s` } as React.CSSProperties}
      >
        <span ref={textRef} className={clsx(isOverflowing && 'mr-6')}>
          {text}
        </span>
        {/* Second copy makes the -50% translate loop seamlessly. */}
        {isOverflowing && (
          <span aria-hidden="true" className="mr-6">
            {text}
          </span>
        )}
      </div>
    </div>
  )
}
