/**
 * DynamicUploadForm — 카테고리별 동적 입력 필드를 지원하는 프리미엄 업로드 폼
 */
import { useState } from 'react'
import { Upload, X, Loader2, ChevronDown, Tag, Calendar, MapPin, Feather, FileText, CloudSun } from 'lucide-react'
import { archiveAPI, type Category } from '../services/api'

interface Props {
  categories: Category[]
  onUploaded: () => void
  onClose: () => void
}

export default function DynamicUploadForm({ categories, onUploaded, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [tags, setTags] = useState('')
  const [source, setSource] = useState('')
  const [originalDate, setOriginalDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [catOpen, setCatOpen] = useState(false)

  // 동적 필드 저장을 위한 State (custom_attributes)
  const [customAttrs, setCustomAttrs] = useState<Record<string, string>>({})

  const selectedCat = categories.find(c => c.id === categoryId)

  // 카테고리 이름 분석을 통한 동적 필드 사양 정의
  const getDynamicFields = (catName: string) => {
    const name = catName.toLowerCase()
    if (name.includes('논문') || name.includes('paper') || name.includes('research') || name.includes('academic')) {
      return [
        { key: 'authors', label: '저자', placeholder: '예: 홍길동, 김철수', icon: Feather },
        { key: 'journal', label: '저널명 / 학술지', placeholder: '예: Nature, IEEE Transactions', icon: FileText },
      ]
    }
    if (name.includes('일기') || name.includes('diary') || name.includes('journal') || name.includes('기록')) {
      return [
        { key: 'weather', label: '날씨', placeholder: '예: 맑음, 흐리고 가끔 비', icon: CloudSun },
        { key: 'emotion', label: '오늘 느낀 감정', placeholder: '예: 평온함, 보람찬 하루, 사색적인', icon: Feather },
      ]
    }
    if (name.includes('사진') || name.includes('이미지') || name.includes('photo') || name.includes('image')) {
      return [
        { key: 'location', label: '촬영 장소', placeholder: '예: 서울시립미술관, 파리 에펠탑', icon: MapPin },
      ]
    }
    return []
  }

  // 카테고리 변경 시 동적 필드 초기화
  const handleSelectCategory = (catId: number | '') => {
    setCategoryId(catId)
    setCustomAttrs({}) // 기존 입력값 청소
    setCatOpen(false)
  }

  // 자료 업로드 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    setError('')

    try {
      // 빈 문자열 속성은 제외하고 전송
      const cleanCustomAttrs: Record<string, any> = {}
      Object.entries(customAttrs).forEach(([key, val]) => {
        if (val.trim()) {
          cleanCustomAttrs[key] = val.trim()
        }
      })

      await archiveAPI.upload({
        owner_id: 1,
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: categoryId || undefined,
        tags: tags.trim() || undefined,
        source: source.trim() || undefined,
        auto_index: true,
        file: file || undefined,
        custom_attributes: Object.keys(cleanCustomAttrs).length > 0 ? cleanCustomAttrs : undefined,
      })
      onUploaded()
      onClose()
    } catch (err) {
      setError('업로드에 실패했습니다. 입력값을 확인하거나 네트워크 연결을 확인해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const fieldClass = "w-full px-4 py-2.5 rounded-xl museum-input text-sm transition-all focus:border-[var(--umber)] focus:ring-1 focus:ring-[var(--umber)]/20"
  const labelClass = "block text-[11px] font-semibold uppercase tracking-wider text-[var(--taupe)] mb-1.5 flex items-center gap-1.5"

  const dynamicFields = selectedCat ? getDynamicFields(selectedCat.name) : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--ivory)] border border-[var(--linen)] shadow-2xl animate-fade-up max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--linen)] flex-shrink-0 bg-[var(--ivory)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--museum)] flex items-center justify-center shadow-md shadow-[var(--umber)]/10">
              <Upload className="w-4 h-4 text-[var(--ivory)]" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--charcoal)]">기록물 보관소 업로드</h2>
              <p className="text-[10px] text-[var(--taupe)] mt-0.5">인생의 소중한 유산을 품격 있게 보관합니다.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-[var(--taupe)] hover:bg-[var(--linen)] hover:text-[var(--charcoal)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-100px)]">
          
          {/* 1. 공통 필드: 제목 (항상 상단 표시) */}
          <div>
            <label className={labelClass}>
              제목 <span className="text-rose-400 font-bold">*</span>
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="보관할 기록의 제목을 입력하세요" 
              required 
              className={fieldClass} 
            />
          </div>

          {/* 1. 공통 필드: 파일 첨부 (항상 상단 표시) */}
          <div>
            <label className={labelClass}>파일 첨부</label>
            <div className="relative group border border-dashed border-[var(--linen)] rounded-xl p-4 hover:bg-[var(--linen)]/20 transition-colors duration-300">
              <input 
                type="file" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="flex flex-col items-center justify-center text-center space-y-1">
                <Upload className="w-6 h-6 text-[var(--taupe)] group-hover:text-[var(--umber)] transition-colors duration-300" />
                <span className="text-xs text-[var(--charcoal)] font-semibold">
                  {file ? file.name : '마우스로 파일을 끌어오거나 클릭해 주세요'}
                </span>
                <span className="text-[10px] text-[var(--taupe)]">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF, TXT, PNG, JPG, MP4 지원'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. 카테고리 선택 드롭다운 */}
          <div>
            <label className={labelClass}>기록 분류 (카테고리)</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCatOpen(!catOpen)}
                className="w-full px-4 py-2.5 rounded-xl museum-input text-sm text-left flex items-center justify-between transition-colors focus:border-[var(--umber)]"
              >
                <span className="flex items-center gap-2">
                  {selectedCat ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedCat.color || '#6b5b4e' }} />
                      <span className="text-[var(--charcoal)] font-medium">{selectedCat.name}</span>
                      {selectedCat.is_default && (
                        <span className="text-[9px] text-[var(--taupe)] bg-[var(--linen)] px-1.5 py-0.5 rounded font-bold">기본</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[var(--taupe)]">기록의 종류를 지정하세요</span>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--taupe)] transition-transform duration-300 ${catOpen ? 'rotate-180' : ''}`} />
              </button>

              {catOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl bg-[var(--ivory)] border border-[var(--linen)] shadow-xl z-20 overflow-hidden animate-fade-in">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('')}
                    className="w-full px-4 py-2.5 text-left text-sm text-[var(--taupe)] hover:bg-[var(--linen)] transition-colors"
                  >
                    — 분류 지정 없음
                  </button>
                  <div className="h-px bg-[var(--linen)]" />

                  {/* 기본 제공 카테고리 */}
                  {categories.filter(c => c.is_default).length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--taupe)] bg-[var(--linen)]/30">기본</div>
                      {categories.filter(c => c.is_default).map(cat => (
                        <button key={cat.id} type="button"
                          onClick={() => handleSelectCategory(cat.id)}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors ${categoryId === cat.id ? 'bg-[var(--linen)] font-bold text-[var(--umber)]' : 'hover:bg-[var(--linen)] text-[var(--charcoal)]'}`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#8c8278' }} />
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* 유저 정의 카테고리 */}
                  {categories.filter(c => !c.is_default).length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--taupe)] bg-[var(--linen)]/30 border-t border-[var(--linen)]">내 카테고리</div>
                      {categories.filter(c => !c.is_default).map(cat => (
                        <button key={cat.id} type="button"
                          onClick={() => handleSelectCategory(cat.id)}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors ${categoryId === cat.id ? 'bg-[var(--linen)] font-bold text-[var(--umber)]' : 'hover:bg-[var(--linen)] text-[var(--charcoal)]'}`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#8c8278' }} />
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. 동적 필드 렌더링 (선택된 카테고리에 반응) */}
          {dynamicFields.length > 0 && (
            <div className="p-4 rounded-2xl bg-[var(--linen)]/45 border border-[var(--linen)]/80 space-y-3.5 animate-fade-in shadow-inner">
              <h4 className="text-[10px] font-bold text-[var(--umber)] uppercase tracking-wider flex items-center gap-1.5 font-display">
                ✦ {selectedCat?.name} 전용 추가 정보 입력
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {dynamicFields.map(field => {
                  const FieldIcon = field.icon
                  return (
                    <div 
                      key={field.key} 
                      className={field.key === 'location' || field.key === 'authors' ? 'sm:col-span-2' : ''}
                    >
                      <label className={labelClass}>
                        <FieldIcon className="w-3.5 h-3.5 text-[var(--umber)]/70" />
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={customAttrs[field.key] || ''}
                        onChange={e => setCustomAttrs(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className={fieldClass}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 1. 공통 필드: 설명 (항상 표시) */}
          <div>
            <label className={labelClass}>설명 및 비하인드 스토리</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="이 기록물에 얽힌 소중한 사연이나 감상을 묘사해 주세요." 
              rows={3} 
              className={`${fieldClass} resize-none`} 
            />
          </div>

          {/* 메타데이터 행 (태그 + 원본 날짜) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                <Tag className="w-3 h-3 text-[var(--taupe)]" /> 태그
              </label>
              <input 
                type="text" 
                value={tags} 
                onChange={e => setTags(e.target.value)}
                placeholder="가족, 편지, 1990년대" 
                className={fieldClass} 
              />
            </div>
            <div>
              <label className={labelClass}>
                <Calendar className="w-3 h-3 text-[var(--taupe)]" /> 기록 당시 날짜
              </label>
              <input 
                type="date" 
                value={originalDate} 
                onChange={e => setOriginalDate(e.target.value)} 
                className={fieldClass} 
              />
            </div>
          </div>

          {/* 출처 / 원본 위치 */}
          <div>
            <label className={labelClass}>출처 / 보관 장소</label>
            <input 
              type="text" 
              value={source} 
              onChange={e => setSource(e.target.value)}
              placeholder="예: 안방 금고, 셋째 서랍 옛 앨범" 
              className={fieldClass} 
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 animate-fade-in font-medium">
              {error}
            </p>
          )}

          {/* Actions Footer */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--linen)] text-[var(--graphite)] text-sm font-semibold hover:bg-[var(--linen)] hover:text-[var(--charcoal)] transition-colors active:scale-98"
            >
              취소
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[var(--museum)] text-[var(--ivory)] text-sm font-semibold hover:bg-[var(--umber)] disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-[var(--umber)]/15"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  분석 및 업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  보관소 저장
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
