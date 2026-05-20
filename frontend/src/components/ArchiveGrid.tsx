/**
 * ArchiveGrid — 디지털 보관함
 * Dynamic category sidebar + keyword search + card grid.
 * Category creation modal and upload form are lazy-mounted sub-components.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Search, Loader2, Archive, Tag,
  FileText, BookOpen, Image, Video, Music, PenLine,
  Plus, Upload, FolderPlus, Trash2,
} from 'lucide-react'
import { archiveAPI, categoryAPI, type ArchiveItem, type Category } from '../services/api'
import NewCategoryModal from './NewCategoryModal'
import DynamicUploadForm from './DynamicUploadForm'

/* ─── Helpers ─────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  Image, FileText, Video, BookOpen, Music, PenLine, Archive,
  Camera: Image, Trophy: Archive,
}

function getCategoryIcon(iconName: string | null): React.ElementType {
  return iconName ? (ICON_MAP[iconName] || Archive) : Archive
}

function formatDate(d: string | null) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return d }
}

/* ─── ArchiveGrid ──────────────────────────────────────── */
export default function ArchiveGrid() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [catsLoading, setCatsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCatId, setActiveCatId] = useState<number | 'all'>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showNewCat, setShowNewCat] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  /* ── Load categories (seed on first run) ── */
  const loadCategories = useCallback(async () => {
    setCatsLoading(true)
    try {
      let res = await categoryAPI.list(1)
      if (res.data.length === 0) {
        await categoryAPI.seed()
        res = await categoryAPI.list(1)
      }
      setCategories(res.data)
    } catch { /* ignore */ }
    finally { setCatsLoading(false) }
  }, [])

  /* ── Load archive items ── */
  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = { limit: 50 }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      if (activeCatId !== 'all') params.category_id = activeCatId
      const res = await archiveAPI.list(params as any)
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch { setItems([]); setTotal(0) }
    finally { setIsLoading(false) }
  }, [activeCatId, searchQuery])

  useEffect(() => { loadCategories() }, [loadCategories])
  useEffect(() => { fetchItems() }, [activeCatId])

  /* ── Handlers ── */
  const handleCategoryCreated = (cat: Category) => {
    setCategories(prev => [...prev, cat])
    setActiveCatId(cat.id)
  }

  const handleDeleteCat = async (e: React.MouseEvent, cat: Category) => {
    e.stopPropagation()
    if (cat.is_default) return
    if (!confirm(`'${cat.name}' 카테고리를 삭제할까요?`)) return
    await categoryAPI.delete(cat.id)
    setCategories(prev => prev.filter(c => c.id !== cat.id))
    if (activeCatId === cat.id) setActiveCatId('all')
  }

  /* ── Active category metadata ── */
  const activeCat = activeCatId !== 'all' ? categories.find(c => c.id === activeCatId) : null

  return (
    <div className="flex gap-6 min-h-0">

      {/* ════════════ SIDEBAR — Category list ════════════ */}
      <aside className="w-52 flex-shrink-0 space-y-1">

        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--taupe)]">라이브러리</span>
        </div>

        {/* All */}
        <SidebarItem
          label="전체"
          count={activeCatId === 'all' ? total : undefined}
          icon={Archive}
          isActive={activeCatId === 'all'}
          color="#8c8278"
          onClick={() => setActiveCatId('all')}
        />

        {/* Default categories */}
        {!catsLoading && categories.filter(c => c.is_default).length > 0 && (
          <>
            <div className="pt-2 pb-0.5 px-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--taupe)]/60">기본</span>
            </div>
            {categories.filter(c => c.is_default).map(cat => (
              <SidebarItem
                key={cat.id}
                label={cat.name}
                icon={getCategoryIcon(cat.icon)}
                isActive={activeCatId === cat.id}
                color={cat.color || '#8c8278'}
                onClick={() => setActiveCatId(cat.id)}
              />
            ))}
          </>
        )}

        {/* Custom categories */}
        {!catsLoading && categories.filter(c => !c.is_default).length > 0 && (
          <>
            <div className="pt-2 pb-0.5 px-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--taupe)]/60">내 카테고리</span>
            </div>
            {categories.filter(c => !c.is_default).map(cat => (
              <SidebarItem
                key={cat.id}
                label={cat.name}
                icon={getCategoryIcon(cat.icon)}
                isActive={activeCatId === cat.id}
                color={cat.color || '#8c8278'}
                onClick={() => setActiveCatId(cat.id)}
                onDelete={e => handleDeleteCat(e, cat)}
              />
            ))}
          </>
        )}

        {catsLoading && (
          <div className="flex items-center gap-2 px-3 py-2 text-[var(--taupe)] text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> 불러오는 중...
          </div>
        )}

        {/* + 새 카테고리 */}
        <div className="pt-3 border-t border-[var(--linen)] mt-2">
          <button
            onClick={() => setShowNewCat(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--taupe)] hover:bg-[var(--linen)] hover:text-[var(--charcoal)] transition group"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--umber)] group-hover:scale-110 transition-transform" />
            새 카테고리 추가
          </button>
        </div>
      </aside>

      {/* ════════════ MAIN CONTENT ════════════ */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[var(--charcoal)] tracking-tight flex items-center gap-2.5">
              {activeCat ? (
                <>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeCat.color || '#8c8278' }} />
                  {activeCat.name}
                </>
              ) : '전체 보관함'}
            </h2>
            <p className="text-xs text-[var(--taupe)] mt-0.5">
              {isLoading ? '불러오는 중...' : <><span className="font-semibold text-[var(--umber)]">{total}건</span>의 기록물</>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--taupe)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchItems()}
                placeholder="제목, 태그, 설명..."
                className="pl-9 pr-4 py-2 rounded-xl museum-input text-xs w-44"
              />
            </div>
            {/* Upload button */}
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--museum)] text-[var(--ivory)] text-xs font-medium hover:bg-[var(--umber)] transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              자료 추가
            </button>
          </div>
        </div>

        {/* Active category description */}
        {activeCat?.description && (
          <p className="text-xs text-[var(--taupe)] bg-[var(--linen)] px-4 py-2.5 rounded-xl border-l-2" style={{ borderLeftColor: activeCat.color || '#8c8278' }}>
            {activeCat.description}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--taupe)]">
            <Loader2 className="w-7 h-7 animate-spin mb-3" />
            <p className="text-sm">보관함을 불러오는 중...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border-2 border-dashed border-[var(--linen)]">
            <FolderPlus className="w-12 h-12 text-[var(--taupe)] mx-auto mb-3 opacity-30" />
            <h3 className="font-display text-xl text-[var(--charcoal)]">
              {activeCat ? `'${activeCat.name}' 카테고리가 비어 있습니다` : '보관된 기록이 없습니다'}
            </h3>
            <p className="text-xs text-[var(--taupe)] mt-1">자료 추가 버튼을 눌러 첫 번째 기록을 업로드해 보세요.</p>
            <button onClick={() => setShowUpload(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--museum)] text-[var(--ivory)] text-sm font-medium hover:bg-[var(--umber)] transition active:scale-95">
              <Upload className="w-4 h-4" /> 자료 추가
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {items.map(item => (
              <ArchiveCard
                key={item.id}
                item={item}
                categories={categories}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ════════════ MODALS ════════════ */}
      {showNewCat && (
        <NewCategoryModal
          userId={1}
          onCreated={handleCategoryCreated}
          onClose={() => setShowNewCat(false)}
        />
      )}
      {showUpload && (
        <DynamicUploadForm
          categories={categories}
          onUploaded={fetchItems}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}

/* ─── SidebarItem ──────────────────────────────────────── */
function SidebarItem({ label, icon: Icon, isActive, color, count, onClick, onDelete }: {
  label: string
  icon: React.ElementType
  isActive: boolean
  color: string
  count?: number
  onClick: () => void
  onDelete?: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all group
        ${isActive ? 'bg-[var(--linen)] text-[var(--charcoal)] shadow-sm' : 'text-[var(--graphite)] hover:bg-[var(--linen)]/60 hover:text-[var(--charcoal)]'}`}
    >
      <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '22' }}>
        <Icon className="w-3 h-3" style={{ color }} />
      </span>
      <span className="flex-1 text-left text-xs truncate">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] text-[var(--taupe)] tabular-nums">{count}</span>
      )}
      {onDelete && (
        <span
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-rose-500 transition"
        >
          <Trash2 className="w-3 h-3" />
        </span>
      )}
      {isActive && !onDelete && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      )}
    </button>
  )
}

/* ─── ArchiveCard Helpers ───────────────────────────────── */
function getLocalizedKey(key: string): string {
  const map: Record<string, string> = {
    location: '촬영 장소',
    taken_with: '촬영 기기',
    weather: '날씨',
    emotion: '오늘의 감정',
    authors: '저자',
    journal: '학술지',
    doi: 'DOI',
  }
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/* ─── ArchiveCard ──────────────────────────────────────── */
function ArchiveCard({ item, categories, isExpanded, onToggle }: {
  item: ArchiveItem
  categories: Category[]
  isExpanded: boolean
  onToggle: () => void
}) {
  const cat = categories.find(c => c.id === item.category_id)
  const catColor = cat?.color || '#8c8278'
  const CatIcon = getCategoryIcon(cat?.icon || null)

  const isImage = item.file_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(item.file_url)
  const imageUrl = isImage ? `http://localhost:8000${item.file_url}` : null

  // 1. Normal State (Grid Item, not expanded)
  if (!isExpanded) {
    return (
      <article
        onClick={onToggle}
        className="relative overflow-hidden aspect-[4/3] w-full rounded-2xl border border-[var(--linen)] bg-black/20 group cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-xl hover:shadow-[var(--umber)]/15 flex flex-col"
      >
        {/* Cover image or fallback gradient */}
        {imageUrl ? (
          <div className="absolute inset-0 z-0">
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            {/* Dark premium gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10 transition-all duration-500 group-hover:from-black/90 group-hover:via-black/30" />
          </div>
        ) : (
          <div
            className="absolute inset-0 z-0 bg-gradient-to-br flex items-center justify-center overflow-hidden transition-all duration-500"
            style={{
              backgroundImage: `linear-gradient(135deg, ${catColor}18 0%, #171412 100%)`
            }}
          >
            <CatIcon className="w-20 h-20 opacity-[0.05] text-[var(--ivory)] transform rotate-12 transition-transform duration-700 group-hover:scale-115 group-hover:rotate-6" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
          </div>
        )}

        {/* Floating Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] z-10 transition-transform duration-500 group-hover:scale-x-105" style={{ backgroundColor: catColor }} />

        {/* Front Content (Title & Badge) */}
        <div className="absolute inset-0 p-5 z-10 flex flex-col justify-end pointer-events-none transition-all duration-500 group-hover:opacity-0 group-hover:translate-y-2">
          <div className="flex items-center justify-between mb-2">
            <span
              className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-md border"
              style={{
                backgroundColor: catColor + '18',
                borderColor: catColor + '30',
                color: catColor
              }}
            >
              <CatIcon className="w-2.5 h-2.5" />
              {item.category_name || cat?.name || item.item_type || '기타'}
            </span>
            {item.original_date && (
              <span className="text-[10px] text-white/50 font-medium">
                {formatDate(item.original_date)}
              </span>
            )}
          </div>

          <h3 className="font-display text-sm font-semibold text-white/95 leading-snug group-hover:text-[var(--umber)] transition-colors line-clamp-2">
            {item.title}
          </h3>
        </div>

        {/* 🌟 Elegant Hover Overlay (AI Insights & Quotes) 🌟 */}
        <div className="absolute inset-0 z-20 bg-gradient-to-br from-[#1c1815]/98 to-[#0d0a08]/98 backdrop-blur-md p-5 flex flex-col justify-between opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 ease-out pointer-events-auto border border-white/5 rounded-2xl">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#C5A880] flex items-center gap-1.5 font-display">
                ✦ AI DOCENT INSIGHT
              </span>
              {item.original_date && (
                <span className="text-[9px] text-white/35 font-medium">{formatDate(item.original_date)}</span>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-widest">분석 요약</h4>
              <p className="text-[11px] text-[var(--parchment)]/90 leading-relaxed font-normal line-clamp-3">
                {item.ai_summary || item.description || '저장된 기록물을 분석하고 있습니다.'}
              </p>
            </div>

            {item.highlight_quote && (
              <div className="relative mt-2 p-3 bg-white/[0.02] border-l-2 border-[#C5A880]/60 rounded-r-xl">
                <p className="font-display italic text-[var(--ivory)] text-center text-xs leading-relaxed px-1">
                  “{item.highlight_quote}”
                </p>
              </div>
            )}

            {item.custom_attributes && Object.keys(item.custom_attributes).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(item.custom_attributes).slice(0, 3).map(([key, val]) => (
                  val ? (
                    <span key={key} className="text-[8.5px] bg-white/[0.04] text-[var(--parchment)]/70 px-2 py-0.5 rounded border border-white/5 backdrop-blur-sm">
                      <span className="font-bold text-[#C5A880]/90 mr-1">{getLocalizedKey(key)}:</span>
                      {String(val)}
                    </span>
                  ) : null
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] text-white/30">{formatDate(item.created_at)}</span>
            <span className="text-[9px] font-bold text-[#C5A880] tracking-widest flex items-center gap-1 hover:text-white transition-colors duration-300">
              상세히 보기 <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
          </div>
        </div>
      </article>
    )
  }

  // 2. Expanded Detail Banner state (Clicked/Full view)
  return (
    <article
      className="museum-card rounded-2xl overflow-hidden cursor-default flex flex-col border border-[var(--linen)] transition-all duration-500 shadow-lg col-span-1 sm:col-span-2 lg:col-span-3"
    >
      {/* Accent Header */}
      <div className="h-1 flex-shrink-0" style={{ backgroundColor: catColor, opacity: 0.8 }} />

      <div className="flex flex-col md:flex-row min-h-[300px]">
        {/* Left Panel: Cover & Core Info */}
        <div className="w-full md:w-2/5 relative min-h-[220px] md:min-h-0 bg-black/20">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(135deg, ${catColor}15 0%, #12100e 100%)`
              }}
            >
              <CatIcon className="w-24 h-24 opacity-[0.03] text-[var(--ivory)] transform rotate-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2 z-10">
            <span
              className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-md border w-fit"
              style={{
                backgroundColor: catColor + '20',
                borderColor: catColor + '40',
                color: catColor
              }}
            >
              <CatIcon className="w-3 h-3" />
              {item.category_name || cat?.name || item.item_type || '기타'}
            </span>
            <h3 className="font-display text-lg font-bold text-white leading-snug">
              {item.title}
            </h3>
          </div>
        </div>

        {/* Right Panel: Detailed view */}
        <div className="flex-1 p-6 flex flex-col justify-between bg-[var(--museum-bg)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] text-[var(--taupe)] border-b border-[var(--linen)] pb-2">
              <span>보관일: {formatDate(item.created_at)}</span>
              {item.original_date && <span>생전 시기: {formatDate(item.original_date)}</span>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-[var(--taupe)] uppercase tracking-wider">설명 및 비하인드 스토리</h4>
              <p className="text-xs text-[var(--charcoal)] leading-relaxed whitespace-pre-wrap">
                {item.description || '기록에 대한 별도의 설명이 등록되어 있지 않습니다.'}
              </p>
            </div>

            {/* AI Curated Insights Panel */}
            {(item.ai_summary || item.highlight_quote) && (
              <div className="p-4 rounded-xl bg-[var(--linen)]/50 border border-[var(--linen)] space-y-3">
                <div className="text-[10px] font-bold text-[var(--umber)] tracking-widest uppercase flex items-center gap-1">
                  ✦ AI 도슨트 감상평 (Insight)
                </div>
                
                {item.ai_summary && (
                  <p className="text-xs text-[var(--charcoal)] font-semibold leading-relaxed">
                    {item.ai_summary}
                  </p>
                )}

                {item.highlight_quote && (
                  <div className="relative mt-2.5 p-3.5 bg-white/40 border border-[var(--linen)] rounded-xl italic text-xs font-serif text-[var(--graphite)] leading-relaxed text-center">
                    "{item.highlight_quote}"
                  </div>
                )}
              </div>
            )}

            {/* Custom Attributes Details */}
            {item.custom_attributes && Object.keys(item.custom_attributes).length > 0 && (
              <div className="space-y-2 pt-3 border-t border-[var(--linen)]">
                <h4 className="text-[10px] font-bold text-[var(--taupe)] uppercase tracking-wider">기록 상세 속성</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(item.custom_attributes).map(([key, val]) => (
                    val ? (
                      <div key={key} className="flex flex-col p-2.5 rounded-xl bg-[var(--linen)]/35 border border-[var(--linen)] hover:bg-[var(--linen)]/60 transition-colors duration-300">
                        <span className="text-[9px] text-[var(--taupe)] font-bold">{getLocalizedKey(key)}</span>
                        <span className="text-xs text-[var(--charcoal)] font-semibold mt-0.5">{String(val)}</span>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {item.tags && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--linen)]">
                {item.tags.split(',').map((t, i) => (
                  <span key={i} className="inline-flex items-center text-[10px] text-[var(--taupe)] bg-[var(--linen)] px-2.5 py-1 rounded-md">
                    <Tag className="w-2.5 h-2.5 mr-1" />{t.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-3 border-t border-[var(--linen)] flex items-center justify-between">
            {item.file_url ? (
              <a
                href={`http://localhost:8000${item.file_url}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--umber)] font-semibold hover:underline"
              >
                원본 자료 내려받기 (Download Original) →
              </a>
            ) : (
              <span className="text-xs text-[var(--taupe)]">미디어 파일 없음</span>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
              className="text-xs font-semibold text-[var(--taupe)] hover:text-[var(--charcoal)] transition"
            >
              상세 보기 접기 ▲
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
