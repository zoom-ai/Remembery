/**
 * ArchiveGrid — 디지털 보관함
 * Dynamic category sidebar + keyword search + card grid.
 * Category creation modal and upload form are lazy-mounted sub-components.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Search, Loader2, Archive, Tag, Calendar,
  FileText, BookOpen, Image, Video, Music, PenLine,
  Plus, Upload, Eye, FolderPlus, Trash2,
} from 'lucide-react'
import { archiveAPI, categoryAPI, type ArchiveItem, type Category } from '../services/api'
import NewCategoryModal from './NewCategoryModal'
import UploadForm from './UploadForm'

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
        <UploadForm
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

  return (
    <article
      onClick={onToggle}
      className="museum-card rounded-2xl overflow-hidden cursor-pointer flex flex-col group"
    >
      {/* Top color accent */}
      <div className="h-1 flex-shrink-0" style={{ backgroundColor: catColor, opacity: 0.6 }} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Category badge + date */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: catColor + '18', color: catColor }}
          >
            <CatIcon className="w-3 h-3" />
            {item.category_name || cat?.name || item.item_type || '기타'}
          </span>
          {item.original_date && (
            <span className="text-[11px] text-[var(--taupe)] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(item.original_date)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-[var(--charcoal)] group-hover:text-[var(--umber)] transition-colors leading-snug mb-2">
          {item.title}
        </h3>

        {/* Description */}
        <p className={`text-xs text-[var(--graphite)] leading-relaxed flex-1 ${isExpanded ? '' : 'line-clamp-3'}`}>
          {item.description || '설명 없음'}
        </p>

        {/* Tags */}
        {item.tags && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[var(--linen)]">
            {item.tags.split(',').slice(0, 3).map((t, i) => (
              <span key={i} className="inline-flex items-center text-[10px] text-[var(--taupe)] bg-[var(--linen)] px-2 py-0.5 rounded-md">
                <Tag className="w-2.5 h-2.5 mr-1" />{t.trim()}
              </span>
            ))}
            {item.tags.split(',').length > 3 && (
              <span className="text-[10px] text-[var(--taupe)]">+{item.tags.split(',').length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-[var(--linen)]/50 border-t border-[var(--linen)] flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] text-[var(--taupe)]">{formatDate(item.created_at)}</span>
        <div className="flex items-center gap-1 text-[var(--taupe)]">
          <Eye className="w-3 h-3" />
          <span className="text-[10px]">{isExpanded ? '접기' : '상세 보기'}</span>
        </div>
      </div>
    </article>
  )
}
