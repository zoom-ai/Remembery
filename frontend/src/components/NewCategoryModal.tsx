/**
 * NewCategoryModal — 카테고리 생성 모달
 */
import { useState } from 'react'
import { X, Loader2, FolderPlus } from 'lucide-react'
import { categoryAPI, type Category } from '../services/api'

const COLOR_SWATCHES = [
  '#6b5b4e','#0ea5e9','#f59e0b','#ef4444',
  '#10b981','#8b5cf6','#f97316','#ec4899',
]

interface Props {
  userId: number
  onCreated: (cat: Category) => void
  onClose: () => void
}

export default function NewCategoryModal({ userId, onCreated, onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6b5b4e')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsLoading(true)
    setError('')
    try {
      const res = await categoryAPI.create({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        user_id: userId,
      })
      onCreated(res.data)
      onClose()
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setError(detail === 'Category \'' + name.trim() + '\' already exists for this user.'
        ? `'${name.trim()}' 카테고리가 이미 존재합니다.`
        : '카테고리 생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(44,44,44,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--ivory)] border border-[var(--linen)] shadow-2xl animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--linen)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--museum)] flex items-center justify-center">
              <FolderPlus className="w-4 h-4 text-[var(--ivory)]" />
            </div>
            <h2 className="font-display text-xl font-semibold text-[var(--charcoal)]">
              새 카테고리 추가
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--taupe)] hover:bg-[var(--linen)] hover:text-[var(--charcoal)] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--taupe)] mb-1.5">
              카테고리 이름 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 연구 논문, 가족 편지, 골프 스코어카드"
              required
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl museum-input text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--taupe)] mb-1.5">
              설명 (선택)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="이 카테고리에 어떤 자료를 보관할 건지 설명해 주세요"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl museum-input text-sm resize-none"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--taupe)] mb-1.5">
              색상 태그
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_SWATCHES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-[var(--charcoal)] scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              
              {/* Custom Color Picker Swatch */}
              <div
                className={`relative w-7 h-7 rounded-full border border-[var(--linen)] hover:scale-105 transition-all flex items-center justify-center cursor-pointer overflow-hidden
                  ${!COLOR_SWATCHES.includes(color) ? 'ring-2 ring-offset-2 ring-[var(--charcoal)] scale-110' : ''}`}
                style={{
                  background: !COLOR_SWATCHES.includes(color)
                    ? color
                    : 'linear-gradient(135deg, #ff0055 0%, #00ffcc 50%, #9900ff 100%)'
                }}
                title="커스텀 색상 선택"
              >
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {COLOR_SWATCHES.includes(color) && (
                  <span className="text-[10px] font-bold text-white drop-shadow-sm pointer-events-none">+</span>
                )}
              </div>
            </div>
          </div>

          {/* Preview badge */}
          <div className="flex items-center gap-2 text-xs text-[var(--taupe)]">
            <span>미리보기:</span>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-white text-[11px] font-medium"
              style={{ backgroundColor: color }}
            >
              {name || '카테고리 이름'}
            </span>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--linen)] text-[var(--graphite)] text-sm font-medium hover:bg-[var(--linen)] transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[var(--museum)] text-[var(--ivory)] text-sm font-medium hover:bg-[var(--umber)] disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
              생성하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
