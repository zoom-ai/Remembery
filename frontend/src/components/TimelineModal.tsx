import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { userAPI, type TimelineEvent } from '../services/api'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

const COMMON_ICONS = ['🌱', '🎓', '📖', '🏫', '🏆', '✈️', '✍️', '🕊️', '💍', '👶', '💼', '🏡', '🎉', '🌟']

export default function TimelineModal({ onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<TimelineEvent>({
    year: '',
    event: '',
    icon: '🌱'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleIconSelect = (icon: string) => {
    setFormData(prev => ({ ...prev, icon }))
    setIsEmojiPickerOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.year.trim() || !formData.event.trim()) {
      setError('연도와 사건을 모두 입력해 주세요.')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      await userAPI.addTimelineEvent({
        year: formData.year.trim(),
        event: formData.event.trim(),
        icon: formData.icon
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || '저장에 실패했습니다. 다시 시도해 주세요.')
      setIsLoading(false)
    }
  }

  const fieldClass = "w-full px-3 py-2 rounded-lg bg-white/50 border border-[var(--linen)] text-[var(--charcoal)] placeholder-[var(--taupe)] focus:outline-none focus:border-[var(--umber)] focus:ring-1 focus:ring-[var(--umber)] transition-all text-sm"
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[var(--taupe)] mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--ivory)] rounded-2xl w-full max-w-md shadow-2xl border border-[var(--linen)] overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--linen)] flex items-center justify-between bg-white/50">
          <h3 className="font-display text-lg font-semibold text-[var(--charcoal)]">연혁 추가</h3>
          <button onClick={onClose} className="text-[var(--taupe)] hover:text-[var(--charcoal)] transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex gap-3 items-end">
            <div className="relative">
              <label className={labelClass}>아이콘</label>
              <button 
                type="button" 
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className="w-10 h-10 rounded-lg border border-[var(--linen)] bg-white/50 flex items-center justify-center text-lg hover:bg-[var(--linen)] transition-colors"
              >
                {formData.icon}
              </button>
              
              {/* Emoji Picker Popover */}
              {isEmojiPickerOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[var(--linen)] rounded-xl shadow-xl p-2 z-10 grid grid-cols-5 gap-1 animate-fade-up">
                  {COMMON_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleIconSelect(icon)}
                      className="p-1.5 text-lg rounded-lg hover:bg-[var(--parchment)] transition-colors"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <label className={labelClass}>연도 <span className="text-rose-400">*</span></label>
              <input type="text" name="year" value={formData.year} onChange={handleChange}
                placeholder="예: 2024" className={fieldClass} autoFocus />
            </div>
          </div>

          <div>
            <label className={labelClass}>사건 <span className="text-rose-400">*</span></label>
            <input type="text" name="event" value={formData.event} onChange={handleChange}
              placeholder="예: 첫 시집 출간" className={fieldClass} />
          </div>

          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-lg border border-rose-100">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
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
