import { useEffect, useState, useCallback } from 'react'

export function useInView(options?: IntersectionObserverInit): [(node: Element | null) => void, boolean] {
  const [inView, setInView] = useState(false)
  const [node, setNode] = useState<Element | null>(null)

  const ref = useCallback((node: Element | null) => {
    setNode(node)
  }, [])

  useEffect(() => {
    if (!node) return

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
    }, options)

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [node, options])

  return [ref, inView]
}
