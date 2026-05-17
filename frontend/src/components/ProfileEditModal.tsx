import { useState, useRef } from 'react'
import { X, Loader2, Camera } from 'lucide-react'
import { userAPI, type User, type UserProfileUpdate } from '../services/api'

interface Props {
  owner: User
  onClose: () => void
  onSuccess: () => void
}

export default function ProfileEditModal({ owner, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<UserProfileUpdate>({
    display_name: owner.display_name,
    title: owner.title || '',
    bio: owner.bio || '',
    birth_date: owner.birth_date || '',
    death_date: owner.death_date || '',
    birth_place: owner.birth_place || '',
    resting_place: owner.resting_place || '',
    motto: owner.motto || ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    owner.avatar_url ? `http://localhost:8000${owner.avatar_url}` : null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      // 1. Update text metadata
      await userAPI.updateOwner(formData)
      
      // 2. Upload avatar if selected
      if (selectedImage) {
        const avatarData = new FormData()
        avatarData.append('file', selectedImage)
        await userAPI.uploadAvatar(avatarData)
      }
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || '프로필 수정에 실패했습니다.')
      setIsLoading(false)
    }
  }

  const fieldClass = "w-full px-3 py-2 rounded-lg bg-white/50 border border-[var(--linen)] text-[var(--charcoal)] placeholder-[var(--taupe)] focus:outline-none focus:border-[var(--umber)] focus:ring-1 focus:ring-[var(--umber)] transition-all text-sm"
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[var(--taupe)] mb-1.5 mt-4"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[var(--ivory)] rounded-2xl w-full max-w-lg shadow-2xl border border-[var(--linen)] relative my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--linen)] flex items-center justify-between bg-white/50 sticky top-0 z-10 rounded-t-2xl">
          <h3 className="font-display text-lg font-semibold text-[var(--charcoal)]">프로필 수정</h3>
          <button onClick={onClose} className="text-[var(--taupe)] hover:text-[var(--charcoal)] transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-2xl bg-[var(--linen)] border-2 border-dashed border-[var(--taupe)] flex items-center justify-center overflow-hidden transition-all group-hover:border-[var(--umber)] shadow-sm">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-3xl font-semibold text-[var(--taupe)]">
                    {owner.display_name.slice(-2)}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-xs text-[var(--taupe)] mt-2">클릭하여 사진 변경</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>이름</label>
              <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} required className={fieldClass} />
            </div>

            <div>
              <label className={labelClass}>출생일</label>
              <input type="text" name="birth_date" value={formData.birth_date} onChange={handleChange} placeholder="예: 1942.04.15" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>사망일 (선택)</label>
              <input type="text" name="death_date" value={formData.death_date} onChange={handleChange} placeholder="예: 2024.11.20" className={fieldClass} />
            </div>

            <div>
              <label className={labelClass}>출생지 (고향)</label>
              <input type="text" name="birth_place" value={formData.birth_place} onChange={handleChange} placeholder="예: 경북 안동" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>장지 (영면한 곳)</label>
              <input type="text" name="resting_place" value={formData.resting_place} onChange={handleChange} placeholder="예: 용인 평온의 숲" className={fieldClass} />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>호칭 (타이틀)</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="예: 교육자, 시인, 그리고 아버지" className={fieldClass} />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>좌우명 (Motto)</label>
              <input type="text" name="motto" value={formData.motto} onChange={handleChange} placeholder="예: 매 순간을 사랑하며 살자" className={fieldClass} />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>짧은 소개 (Bio)</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className={`${fieldClass} resize-none`} />
            </div>
          </div>

          {error && (
            <p className="mt-4 text-xs text-rose-500 bg-rose-50 p-2.5 rounded-lg border border-rose-100">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-6 mt-2 border-t border-[var(--linen)]">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[var(--graphite)] text-sm font-medium hover:bg-[var(--linen)] transition">
              취소
            </button>
            <button type="submit" disabled={isLoading} className="px-5 py-2 rounded-lg bg-[var(--museum)] text-[var(--ivory)] text-sm font-medium hover:bg-[var(--umber)] disabled:opacity-40 transition-all flex items-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              저장하기
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
