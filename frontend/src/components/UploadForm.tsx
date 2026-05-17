/**
 * UploadForm — 자료 업로드 폼 (카테고리 드롭다운 포함)
 */
import { useState } from 'react'
import { Upload, X, Loader2, ChevronDown, Tag, Calendar } from 'lucide-react'
import { archiveAPI, type Category } from '../services/api'

interface Props {
  categories: Category[]
  onUploaded: () => void
  onClose: () => void
}

export default function UploadForm({ categories, onUploaded, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [tags, setTags] = useState('')
  const [source, setSource] = useState('')
  const [originalDate, setOriginalDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [catOpen, setCatOpen] = useState(false)

  const selectedCat = categories.find(c => c.id === categoryId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsLoading(true)
    setError('')
    try {
      await archiveAPI.upload({
        owner_id: 1,
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: categoryId || undefined,
        tags: tags.trim() || undefined,
        source: source.trim() || undefined,
        auto_index: true,
      })
      onUploaded()
      onClose()
    } catch {
      setError('업로드에 실패했습니다. 서버 연결을 확인해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const fieldClass = "w-full px-4 py-2.5 rounded-xl museum-input text-sm"
  const labelClass = "block text-[11px] font-semibold uppercase tracking-wider text-[var(--taupe)] mb-1.5"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(44,44,44,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--ivory)] border border-[var(--linen)] shadow-2xl animate-fade-up max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--linen)] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--museum)] flex items-center justify-center">
              <Upload className="w-4 h-4 text-[var(--ivory)]" />
            </div>
            <h2 className="font-display text-xl font-semibold text-[var(--charcoal)]">자료 업로드</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--taupe)] hover:bg-[var(--linen)] hover:text-[var(--charcoal)] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

          {/* Title */}
          <div>
            <label className={labelClass}>제목 <span className="text-rose-400">*</span></label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="자료의 제목을 입력하세요" required className={fieldClass} />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className={labelClass}>카테고리</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCatOpen(!catOpen)}
                className="w-full px-4 py-2.5 rounded-xl museum-input text-sm text-left flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {selectedCat ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedCat.color || '#6b5b4e' }} />
                      <span className="text-[var(--charcoal)]">{selectedCat.name}</span>
                      {selectedCat.is_default && (
                        <span className="text-[9px] text-[var(--taupe)] bg-[var(--linen)] px-1.5 py-0.5 rounded">기본</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[var(--taupe)]">카테고리를 선택하세요</span>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--taupe)] transition-transform ${catOpen ? 'rotate-180' : ''}`} />
              </button>

              {catOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[var(--ivory)] border border-[var(--linen)] shadow-lg z-20 overflow-hidden">
                  {/* Unset option */}
                  <button
                    type="button"
                    onClick={() => { setCategoryId(''); setCatOpen(false) }}
                    className="w-full px-4 py-2.5 text-left text-sm text-[var(--taupe)] hover:bg-[var(--linen)] transition"
                  >
                    — 선택 안 함
                  </button>
                  <div className="h-px bg-[var(--linen)]" />

                  {/* Default categories */}
                  {categories.filter(c => c.is_default).length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--taupe)]">기본</div>
                      {categories.filter(c => c.is_default).map(cat => (
                        <button key={cat.id} type="button"
                          onClick={() => { setCategoryId(cat.id); setCatOpen(false) }}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition ${categoryId === cat.id ? 'bg-[var(--linen)]' : 'hover:bg-[var(--linen)]'}`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#8c8278' }} />
                          <span className="text-[var(--charcoal)]">{cat.name}</span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Custom categories */}
                  {categories.filter(c => !c.is_default).length > 0 && (
                    <>
                      <div className="h-px bg-[var(--linen)]" />
                      <div className="px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--taupe)]">내 카테고리</div>
                      {categories.filter(c => !c.is_default).map(cat => (
                        <button key={cat.id} type="button"
                          onClick={() => { setCategoryId(cat.id); setCatOpen(false) }}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition ${categoryId === cat.id ? 'bg-[var(--linen)]' : 'hover:bg-[var(--linen)]'}`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#8c8278' }} />
                          <span className="text-[var(--charcoal)]">{cat.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>설명</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="자료에 대한 설명을 입력하세요" rows={2} className={`${fieldClass} resize-none`} />
          </div>

          {/* Tags + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}><Tag className="inline w-3 h-3 mr-1" />태그</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                placeholder="가족, 1990년대, 편지" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}><Calendar className="inline w-3 h-3 mr-1" />원본 날짜</label>
              <input type="date" value={originalDate} onChange={e => setOriginalDate(e.target.value)} className={fieldClass} />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className={labelClass}>출처 / 원본 위치</label>
            <input type="text" value={source} onChange={e => setSource(e.target.value)}
              placeholder="예: 가족 기록 보관함, 개인 서재" className={fieldClass} />
          </div>

          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--linen)] text-[var(--graphite)] text-sm font-medium hover:bg-[var(--linen)] transition">
              취소
            </button>
            <button type="submit" disabled={isLoading || !title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[var(--museum)] text-[var(--ivory)] text-sm font-medium hover:bg-[var(--umber)] disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              업로드
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
