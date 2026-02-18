
import { useState, useEffect } from 'react'

export const useImagePreloader = (urls: string[]) => {
  const [imagesPreloaded, setImagesPreloaded] = useState(false)
  const [imagesLoadedCount, setImagesLoadedCount] = useState(0)

  useEffect(() => {
    let isMounted = true
    const uniqueUrls = Array.from(new Set(urls.filter(url => !!url)))
    const total = uniqueUrls.length

    if (total === 0) {
      setImagesPreloaded(true)
      return
    }

    setImagesPreloaded(false)
    setImagesLoadedCount(0)

    let loaded = 0
    const promises = uniqueUrls.map(url => {
        return new Promise<void>((resolve) => {
            const img = new Image()
            img.src = url
            img.onload = () => {
                if (isMounted) {
                    loaded++
                    setImagesLoadedCount(loaded)
                    resolve()
                }
            }
            img.onerror = () => {
                // Resolve even on error so we don't get stuck
                if (isMounted) {
                    loaded++
                    setImagesLoadedCount(loaded)
                    resolve()
                }
            }
        })
    })

    Promise.all(promises).then(() => {
        if (isMounted) {
            setImagesPreloaded(true)
        }
    })

    return () => {
        isMounted = false
    }
  }, [urls]) // Re-run when url list changes

  return { imagesPreloaded, imagesLoadedCount }
}
