/**
 * NewCategoryModal — 카테고리 생성 모달
 */
import { useState } from 'react'
import { X, Loader2, FolderPlus, Sparkles, Check } from 'lucide-react'
import { categoryAPI, type Category, type CustomFieldSuggestion } from '../services/api'

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

  // AI Field Suggestion States
  const [suggestions, setSuggestions] = useState<CustomFieldSuggestion[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')

  const handleSuggestFields = async () => {
    if (!name.trim()) return
    setIsSuggesting(true)
    setSuggestionError('')
    try {
      const res = await categoryAPI.suggestFields(name.trim())
      setSuggestions(res.data)
      setSelectedKeys(res.data.map(f => f.key))
    } catch (err: any) {
      setSuggestionError('AI 추천 필드를 가져오는 데 실패했습니다.')
    } finally {
      setIsSuggesting(false)
    }
  }

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
      
      // Save approved custom fields to localStorage
      const approvedFields = suggestions.filter(f => selectedKeys.includes(f.key))
      if (approvedFields.length > 0) {
        localStorage.setItem(`category_custom_fields_${res.data.id}`, JSON.stringify(approvedFields))
      }

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
              onChange={e => {
                setName(e.target.value)
                // Clear previous suggestions if name changes significantly
                if (suggestions.length > 0) {
                  setSuggestions([])
                  setSelectedKeys([])
                }
              }}
              placeholder="예: 연구 논문, 가족 편지, 골프 스코어카드"
              required
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl museum-input text-sm"
            />
            
            {name.trim().length >= 2 && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSuggestFields}
                  disabled={isSuggesting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--linen)] text-[var(--umber)] text-[11px] font-semibold hover:bg-[var(--linen)]/80 hover:text-[var(--museum)] active:scale-95 disabled:opacity-50 transition-all shadow-sm border border-[var(--linen)] animate-fade-in"
                >
                  {isSuggesting ? (
                    <Loader2 className="w-3 h-3 animate-spin text-[var(--umber)]" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-[var(--umber)] animate-pulse" />
                  )}
                  AI 추천 필드 받기
                </button>
              </div>
            )}
          </div>

          {/* AI Suggestions Checklist */}
          {suggestions.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--linen)]/30 to-[var(--linen)]/10 border border-[var(--linen)]/60 space-y-2.5 animate-fade-in shadow-inner">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-[var(--umber)] uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <Sparkles className="w-3 h-3 text-[var(--umber)]" />
                  Gemini 추천 맞춤형 메타데이터
                </h4>
                <span className="text-[9px] text-[var(--taupe)] bg-[var(--ivory)] px-1.5 py-0.5 rounded border border-[var(--linen)]">AI 제안</span>
              </div>
              <p className="text-[10px] text-[var(--taupe)] leading-relaxed">
                자료 보관 시 함께 기록할 항목을 선택해 주세요. 승인하시면 기본 커스텀 필드로 등록됩니다.
              </p>
              
              <div className="grid grid-cols-1 gap-2 mt-2">
                {suggestions.map(field => {
                  const isChecked = selectedKeys.includes(field.key)
                  return (
                    <label
                      key={field.key}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 active:scale-98 ${
                        isChecked
                          ? 'border-[var(--umber)]/50 bg-[var(--ivory)] shadow-sm'
                          : 'border-[var(--linen)] bg-[var(--ivory)]/35 hover:bg-[var(--linen)]/10'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedKeys(prev => prev.filter(k => k !== field.key))
                            } else {
                              setSelectedKeys(prev => [...prev, field.key])
                            }
                          }}
                          className="mt-1 rounded border-[var(--linen)] text-[var(--umber)] focus:ring-[var(--umber)] cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-semibold text-[var(--charcoal)] flex items-center gap-1.5">
                            {field.label}
                            <span className="text-[8px] font-mono uppercase px-1 rounded bg-[var(--linen)] text-[var(--taupe)]">
                              {field.type}
                            </span>
                          </div>
                          <div className="text-[9px] text-[var(--taupe)] font-mono mt-0.5">
                            Key: {field.key}
                          </div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                        isChecked ? 'bg-[var(--umber)] text-white scale-100' : 'bg-transparent text-transparent border border-[var(--linen)] scale-90'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {suggestionError && (
            <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">
              {suggestionError}
            </p>
          )}

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
