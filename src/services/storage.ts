import { supabase } from '../utils/supabase'

export const uploadCoverImage = async (file: File, userId: string): Promise<{ path: string; signedUrl: string } | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file)

    if (uploadError) {
        console.error('Error uploading image:', uploadError)
        throw uploadError
    }

    // For private buckets, we can't just get the public URL.
    // We need to sign a URL.
    const { data: signedData, error: signError } = await supabase.storage
        .from('covers')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year expiry for immediate display

    if (signError) {
        console.error('Error signing URL:', signError)
        throw signError
    }

    return {
        path: filePath,
        signedUrl: signedData.signedUrl
    }
}

export const getSignedUrl = async (path: string): Promise<string | null> => {
    // If it's already an HTTP URL (external), return it
    if (path.startsWith('http')) return path

    const { data, error } = await supabase.storage
        .from('covers')
        .createSignedUrl(path, 60 * 60) // 1 hour

    if (error) {
        console.error('Error creating signed URL:', error)
        return null
    }

    return data.signedUrl
}

export const getSignedUrls = async (paths: string[]): Promise<Record<string, string>> => {
    const { data, error } = await supabase.storage
        .from('covers')
        .createSignedUrls(paths, 60 * 60) // 1 hour

    if (error || !data) {
        console.error('Error creating signed URLs:', error)
        return {}
    }

    const result: Record<string, string> = {}
    data.forEach(item => {
        if (item.signedUrl) {
            result[item.path] = item.signedUrl
        }
    })
    return result
}

export const validateImageResponse = (file: File): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
        const img = new Image()
        img.src = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(img.src)
            const { width, height } = img

            if (file.size > 5 * 1024 * 1024) {
                 resolve({ valid: false, error: 'Image must be less than 5MB' })
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
