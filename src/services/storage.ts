import { supabase } from '../utils/supabase'

export const uploadCoverImage = async (file: File, userId: string): Promise<string | null> => {
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

    const { data } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath)

    return data.publicUrl
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
