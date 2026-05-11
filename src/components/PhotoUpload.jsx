import { useState, useRef } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

const MAX_PHOTOS = 5
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function PhotoUpload({ attendanceId, photos = [], onPhotosChange }) {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const remaining = MAX_PHOTOS - photos.length

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (files.length > remaining) {
      setError(`최대 ${remaining}장까지 추가할 수 있어요`)
      return
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('JPG, PNG, WebP 파일만 업로드할 수 있어요')
        return
      }
      if (file.size > MAX_SIZE) {
        setError('파일 크기는 5MB 이하만 가능해요')
        return
      }
    }

    setError('')
    setUploading(true)

    try {
      const newPhotos = []

      for (const file of files) {
        const ext = file.name.split('.').pop()
        const storagePath = `${user.id}/${attendanceId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('attendance-photos')
          .upload(storagePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('attendance-photos')
          .getPublicUrl(storagePath)

        const { data: photoRecord, error: insertError } = await supabase
          .from('attendance_photos')
          .insert({
            attendance_id: attendanceId,
            photo_url: publicUrl,
            storage_path: storagePath,
          })
          .select()
          .single()

        if (insertError) throw insertError
        newPhotos.push(photoRecord)
      }

      onPhotosChange([...photos, ...newPhotos])
    } catch (err) {
      setError('업로드 실패: ' + (err.message || '다시 시도해주세요'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (photo) => {
    try {
      await supabase.storage
        .from('attendance-photos')
        .remove([photo.storage_path])

      await supabase
        .from('attendance_photos')
        .delete()
        .eq('id', photo.id)

      onPhotosChange(photos.filter((p) => p.id !== photo.id))
    } catch (err) {
      setError('삭제 실패: ' + (err.message || '다시 시도해주세요'))
    }
  }

  return (
    <div>
      {/* 사진 썸네일 */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative shrink-0">
              <img
                src={photo.photo_url}
                alt="직관 사진"
                className="w-20 h-20 object-cover rounded-lg"
              />
              <button
                onClick={() => handleDelete(photo)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 버튼 */}
      {remaining > 0 && (
        <label className="inline-flex items-center gap-1 text-xs text-subtext hover:text-dark cursor-pointer transition-colors">
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Camera size={14} />
          )}
          {uploading ? '업로드 중...' : `사진 추가 (${photos.length}/${MAX_PHOTOS})`}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}

      {error && (
        <p className="text-xs text-accent mt-1">{error}</p>
      )}
    </div>
  )
}
