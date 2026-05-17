/**
 * ArchiveGrid — 디지털 보관함
 *
 * 문서, 책, 사진, 영상 등을 카드 형태로 격자 배치하고
 * 유형별 필터링 및 키워드 검색을 지원합니다.
 */
import { useState, useEffect } from 'react'
import {
  Search, Loader2, FileText, BookOpen, Image, Video,
  Music, PenLine, Archive, Tag, Calendar, Eye,
} from 'lucide-react'
import { archiveAPI, type ArchiveItem } from '../services/api'

const TYPE_FILTERS = [
  { key: 'all',      label: '전체',   icon: Archive },
  { key: 'document', label: '문서',   icon: FileText },
  { key: 'book',     label: '도서',   icon: BookOpen },
  { key: 'photo',    label: '사진',   icon: Image },
  { key: 'video',    label: '영상',   icon: Video },
  { key: 'audio',    label: '음성',   icon: Music },
  { key: 'journal',  label: '일기',   icon: PenLine },
]

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  document: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  book:     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  photo:    { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
  video:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  audio:    { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  journal:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  other:    { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200' },
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  document: FileText, book: BookOpen, photo: Image,
  video: Video, audio: Music, journal: PenLine, other: Archive,
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return dateStr }
}

export default function ArchiveGrid() {
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = { limit: 50 }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      if (activeType !== 'all') params.item_type = activeType
      const res = await archiveAPI.list(params as any)
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch {
      setItems([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [activeType])

  const handleSearch = () => { fetchItems() }

  return (
    <div className="space-y-8">

      {/* ═══════ 헤더 ═══════ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-[var(--charcoal)] tracking-tight">
            디지털 보관함
          </h2>
          <p className="text-sm text-[var(--taupe)] mt-1">
            소중하게 보관된 기록물 <span className="font-semibold text-[var(--umber)]">{total}건</span>
          </p>
        </div>

        {/* 검색 바 */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--taupe)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="제목, 태그, 설명으로 검색..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl museum-input text-sm"
          />
        </div>
      </div>

      {/* ═══════ 유형 필터 탭 ═══════ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TYPE_FILTERS.map((f) => {
          const Icon = f.icon
          const isActive = activeType === f.key
          return (
            <button
              key={f.key}
              onClick={() => setActiveType(f.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all active:scale-95
                ${isActive
                  ? 'bg-[var(--museum)] text-[var(--ivory)] border-[var(--museum)]'
                  : 'bg-[var(--ivory)] text-[var(--graphite)] border-[var(--linen)] hover:border-[var(--taupe)] hover:text-[var(--charcoal)]'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          )
        })}
      </div>

      {/* ═══════ 그리드 카드 ═══════ */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--taupe)]">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">보관함을 불러오는 중...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border-2 border-dashed border-[var(--linen)]">
          <Archive className="w-14 h-14 text-[var(--taupe)] mx-auto mb-4 opacity-40" />
          <h3 className="font-display text-xl text-[var(--charcoal)]">보관된 기록이 없습니다</h3>
          <p className="text-sm text-[var(--taupe)] mt-1 max-w-md mx-auto">
            아직 이 보관함에는 기록물이 업로드되지 않았습니다.<br />
            백엔드 API를 통해 자료를 업로드해 보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {items.map((item) => {
            const colors = TYPE_COLORS[item.item_type] || TYPE_COLORS['other']
            const TypeIcon = TYPE_ICONS[item.item_type] || Archive
            const isExpanded = expandedId === item.id

            return (
              <article
                key={item.id}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="museum-card rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full group"
              >
                {/* Color top accent stripe */}
                <div className={`h-1 ${colors.bg}`} style={{ opacity: 0.8 }} />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
                      <TypeIcon className="w-3 h-3" />
                      {item.item_type}
                    </span>
                    {item.original_date && (
                      <span className="text-[11px] text-[var(--taupe)] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.original_date)}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-[var(--charcoal)] group-hover:text-[var(--umber)] transition-colors leading-snug mb-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-xs text-[var(--graphite)] leading-relaxed flex-1 ${isExpanded ? '' : 'line-clamp-3'}`}>
                    {item.description || '설명 없음'}
                  </p>

                  {/* Tags */}
                  {item.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[var(--linen)]">
                      {item.tags.split(',').slice(0, 4).map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center text-[10px] text-[var(--taupe)] bg-[var(--linen)] px-2 py-0.5 rounded-md"
                        >
                          <Tag className="w-2.5 h-2.5 mr-1" />
                          {tag.trim()}
                        </span>
                      ))}
                      {item.tags.split(',').length > 4 && (
                        <span className="text-[10px] text-[var(--taupe)]">+{item.tags.split(',').length - 4}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-2.5 bg-[var(--linen)]/50 border-t border-[var(--linen)] flex items-center justify-between">
                  <span className="text-[10px] text-[var(--taupe)]">
                    {formatDate(item.created_at)}
                  </span>
                  <div className="flex items-center gap-1 text-[var(--taupe)]">
                    <Eye className="w-3 h-3" />
                    <span className="text-[10px]">상세 보기</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
