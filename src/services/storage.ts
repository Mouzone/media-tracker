import { storage } from '../utils/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export const uploadCoverImage = async (file: File): Promise<{ path: string; signedUrl: string } | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const storageRef = ref(storage, `covers/${fileName}`)

    try {
        await uploadBytes(storageRef, file)
        const downloadUrl = await getDownloadURL(storageRef)
        return {
            path: fileName,
            signedUrl: downloadUrl
        }
    } catch (uploadError) {
        console.error('Error uploading image:', uploadError)
        throw uploadError
    }
}

export const getSignedUrl = async (path: string): Promise<string | null> => {
    if (path.startsWith('http')) return path
    
    try {
        const storageRef = ref(storage, `covers/${path}`)
        const url = await getDownloadURL(storageRef)
        return url
    } catch (error) {
        console.error('Error getting download URL:', error)
        return null
    }
}

export const getSignedUrls = async (paths: string[]): Promise<Record<string, string>> => {
    const result: Record<string, string> = {}
    
    await Promise.all(paths.map(async (path) => {
        try {
            const storageRef = ref(storage, `covers/${path}`)
            const url = await getDownloadURL(storageRef)
            result[path] = url
        } catch (error) {
            console.error(`Error getting download URL for ${path}:`, error)
        }
    }))
    
    return result
}

export const validateImageResponse = (file: File): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
        const img = new Image()
        img.src = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(img.src)
            const { width, height } = img

            if (file.size > 20 * 1024 * 1024) {
                 resolve({ valid: false, error: 'Image must be less than 20MB' })
                 return
            }

            if (width > 4096 || height > 4096) {
                resolve({ valid: false, error: 'Image resolution too high (max 4096px)' })
                return
            }

            if (width < 300 || height < 450) {
                 resolve({ valid: false, error: 'Image resolution too low (min 300x450px)' })
                 return
            }

            const aspectRatio = width / height
            const targetRatio = 2 / 3
            const tolerance = 0.05 // Allow small deviation

            if (Math.abs(aspectRatio - targetRatio) > tolerance) {
                resolve({ valid: false, error: 'Image must have a 2:3 aspect ratio (e.g., 600x900)' })
                return
            }

            resolve({ valid: true })
        }
        img.onerror = () => {
            resolve({ valid: false, error: 'Invalid image file' })
        }
    })
}
