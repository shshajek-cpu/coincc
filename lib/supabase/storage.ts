'use client'

import { createClient, isSupabaseConfigured } from './client'

const BUCKET_NAME = 'screenshots'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface UploadResult {
  url: string | null
  error: string | null
}

/**
 * Upload a screenshot to Supabase Storage
 */
export async function uploadScreenshot(
  file: File,
  userId: string
): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    return { url: null, error: '스토리지가 설정되지 않았습니다.' }
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 가능)' }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { url: null, error: '파일 크기는 5MB 이하여야 합니다.' }
  }

  try {
    const supabase = createClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { url: null, error: '파일 업로드에 실패했습니다.' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Upload error:', error)
    return { url: null, error: '파일 업로드 중 오류가 발생했습니다.' }
  }
}

/**
 * Delete a screenshot from Supabase Storage
 */
export async function deleteScreenshot(url: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null } // Silently succeed in demo mode
  }

  try {
    const supabase = createClient()

    // Extract file path from URL
    const urlParts = url.split(`${BUCKET_NAME}/`)
    if (urlParts.length < 2) {
      return { error: '잘못된 파일 URL입니다.' }
    }

    const filePath = urlParts[1]

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return { error: '파일 삭제에 실패했습니다.' }
    }

    return { error: null }
  } catch (error) {
    console.error('Delete error:', error)
    return { error: '파일 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * Validate file before upload (client-side)
 */
export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 가능)'
  }

  if (file.size > MAX_FILE_SIZE) {
    return '파일 크기는 5MB 이하여야 합니다.'
  }

  return null
}
