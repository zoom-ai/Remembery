/**
 * ExhibitionHall — AI 큐레이션 전시관
 * 
 * 사용자가 전시 주제, 색상 테마, 레이아웃을 지정하면
 * AI가 아카이브 자료를 수집하고 큐레이션하여 테마 맞춤형 온라인 전시관을 설계합니다.
 */
import { useState } from 'react'
import {
  Loader2, Sparkles, Star,
  FileText, BookOpen, Image as ImageIcon, Video, Music, PenLine, Archive,
  Quote, Landmark, Grid, Film, Layers, ChevronLeft, ChevronRight, Award
} from 'lucide-react'
import { exhibitionAPI, type CurationResponse, type CuratedItemSummary } from '../services/api'

/* ─── Helpers & Icons ─────────────────────────────────── */
const TYPE_ICONS: Record<string, React.ElementType> = {
  document: FileText, book: BookOpen, photo: ImageIcon,
  video: Video, audio: Music, journal: PenLine, other: Archive,
}

const COLOR_THEMES = [
  { name: 'Museum Taupe', hex: '#8c8278', label: '뮤지엄 토프', desc: '고전 박물관의 차분하고 아늑한 미색' },
  { name: 'Burgundy Classic', hex: '#800020', label: '버건디 클래식', desc: '역사와 전통이 깃든 품격 있는 딥 레드' },
  { name: 'Forest Heritage', hex: '#2e5a27', label: '포레스트 헤리티지', desc: '평화롭고 자연스러운 수목원 초록' },
  { name: 'Ocean Deep', hex: '#1e3a8a', label: '오션 딥 블루', desc: '지적이고 차분한 바다빛 청색' },
  { name: 'Charcoal Midnight', hex: '#1c1c1e', label: '차콜 미드나잇', desc: '자료의 디테일이 극대화되는 고대비 다크 갤러리' },
]

const LAYOUTS = [
  { key: 'timeline', label: '세로형 도슨트', icon: Landmark, desc: '역사적 흐름에 맞춰 좌우로 배치되는 고전적 복도' },
  { key: 'grid', label: '대칭형 액자관', icon: Grid, desc: '황금빛 액자 프레임에 담겨 넓게 정렬된 순수 미술관' },
  { key: 'slideshow', label: '시네마틱 스포트라이트', icon: Film, desc: '한 번에 한 작품씩 영화처럼 몰입하는 스크린' },
  { key: 'bento', label: '비대칭 벤토 박스', icon: Layers, desc: '다채로운 카드 비율로 만나는 현대적 콜라주' },
]

const THEME_SUGGESTIONS = [
  '1990년대 가족의 기록',
  '교육과 학문의 여정',
  '가장 행복했던 여행',
  '편지와 손글씨의 온기',
  '시와 문학 세계',
]

export default function ExhibitionHall() {
  const [theme, setTheme] = useState('')
  const [selectedColor, setSelectedColor] = useState('#8c8278')
  const [selectedLayout, setSelectedLayout] = useState('timeline')
  const [isGenerating, setIsGenerating] = useState(false)
  const [exhibition, setExhibition] = useState<CurationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCurate = async (customTheme?: string) => {
    const targetTheme = customTheme || theme
    if (!targetTheme.trim()) return

    setIsGenerating(true)
    setExhibition(null)
    setError(null)
    try {
      const res = await exhibitionAPI.curate({
        curator_id: 1,
        theme: targetTheme.trim(),
        max_items: 9,
        language: 'ko',
        theme_color: selectedColor,
        layout_style: selectedLayout,
      })
      setExhibition(res.data)
    } catch {
      setError('전시 시나리오를 생성할 수 없습니다. 백엔드 서버 연결을 확인해 주세요.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-10">

      {/* ═══════ 전시 테마 및 스타일 설정 ═══════ */}
      <section className="rounded-2xl overflow-hidden shadow-md">
        <div
          className="p-8 sm:p-10 text-center relative"
          style={{ background: 'linear-gradient(135deg, var(--museum) 0%, var(--umber) 60%, #7d6b5e 100%)' }}
        >
          {/* Decorative frame corners */}
          <div className="absolute top-5 left-5 w-8 h-8 border-t border-l border-white/20 rounded-tl" />
          <div className="absolute top-5 right-5 w-8 h-8 border-t border-r border-white/20 rounded-tr" />
          <div className="absolute bottom-5 left-5 w-8 h-8 border-b border-l border-white/20 rounded-bl" />
          <div className="absolute bottom-5 right-5 w-8 h-8 border-b border-r border-white/20 rounded-br" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[10px] tracking-widest uppercase text-white/80 mb-4">
            <Landmark className="w-3.5 h-3.5" />
            AI Curated Exhibition Room
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-light text-white italic tracking-tight">
            맞춤형 테마 전시회를 개최해 보세요
          </h2>
          <p className="mt-2 text-xs text-white/60 max-w-md mx-auto leading-relaxed">
            키워드와 색상, 공간 테마를 지정하면 AI 큐레이터가<br />
            유산 보관함을 분석하여 최상의 맞춤 전시관을 시뮬레이션합니다.
          </p>

          {/* Theme Keyword Input */}
          <div className="max-w-xl mx-auto mt-6 flex gap-2">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCurate()}
              placeholder="전시회의 주제를 입력하세요 (예: 청춘 시절, 학창 시절...)"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/35 text-xs focus:outline-none focus:border-white/40 transition"
            />
            <button
              onClick={() => handleCurate()}
              disabled={isGenerating || !theme.trim()}
              className="px-5 py-3 rounded-xl bg-white text-[var(--museum)] text-xs font-bold hover:bg-white/95 disabled:opacity-40 transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              {isGenerating ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Sparkles className="w-4.5 h-4.5" />}
              전시 기획
            </button>
          </div>

          {/* 추천 키워드 */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-4 max-w-xl mx-auto">
            {THEME_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setTheme(s); handleCurate(s) }}
                className="px-2.5 py-0.5 rounded-full text-[10px] text-white/70 border border-white/15 hover:border-white/40 hover:text-white/90 transition bg-white/5"
              >
                {s}
              </button>
            ))}
          </div>

          {/* ─── 디자인 테마 옵션 선택 판넬 ─── */}
          <div className="mt-6 pt-5 border-t border-white/10 max-w-xl mx-auto text-left space-y-4">
            
            {/* 1. 색상 테마 선택 */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                🎨 공간 색상 테마 (Theme Colors)
              </span>
              <div className="flex flex-wrap gap-2">
                {COLOR_THEMES.map((themeOption) => {
                  const isActive = selectedColor === themeOption.hex
                  return (
                    <button
                      key={themeOption.hex}
                      onClick={() => setSelectedColor(themeOption.hex)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                        isActive
                          ? 'bg-white text-[var(--charcoal)] border-white shadow-sm scale-95'
                          : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                      title={themeOption.desc}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: themeOption.hex }} />
                      {themeOption.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. 레이아웃 선택 */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                🏛️ 가상 전시관 레이아웃 (Gallery Layout)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LAYOUTS.map((layoutOption) => {
                  const LayoutIcon = layoutOption.icon
                  const isActive = selectedLayout === layoutOption.key
                  return (
                    <button
                      key={layoutOption.key}
                      onClick={() => setSelectedLayout(layoutOption.key)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                        isActive
                          ? 'bg-white text-[var(--charcoal)] border-white shadow-sm scale-[0.98]'
                          : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                      title={layoutOption.desc}
                    >
                      <LayoutIcon className="w-4 h-4" />
                      <span className="text-[10px] font-bold">{layoutOption.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════ 에러 메시지 ═══════ */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* ═══════ 전시관 로딩 애니메이션 ═══════ */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--taupe)] animate-fade-up">
          <div className="relative w-16 h-16 mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--linen)]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[var(--umber)] animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[var(--umber)] animate-soft-pulse" />
          </div>
          <p className="font-display text-base italic text-[var(--charcoal)]">AI 도슨트가 가상 전시관을 설계하고 있습니다...</p>
          <p className="text-[10px] text-[var(--taupe)] mt-1">자료 큐레이션 및 맞춤형 색상 공간 모델링 중</p>
        </div>
      )}

      {/* ═══════ 전시 결과 시뮬레이션 ═══════ */}
      {exhibition && !isGenerating && (
        <div className="space-y-8 animate-fade-in">

          {/* 전시관 정보 패널 */}
          <div className="rounded-2xl museum-card p-8 text-center relative overflow-hidden">
            {/* Color Accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ background: `linear-gradient(90deg, transparent, ${exhibition.theme_color}, transparent)` }}
            />

            <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.25em] text-[var(--taupe)] mb-3 bg-[var(--linen)]/45 px-3 py-1 rounded-full border border-[var(--linen)]">
              <Award className="w-3 h-3 text-[var(--umber)]" /> Special Theme Exhibition
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--charcoal)] tracking-tight">
              {exhibition.exhibition_title}
            </h2>
            <p className="font-display text-base italic text-[var(--umber)] mt-2">
              {exhibition.exhibition_subtitle}
            </p>

            <div className="divider-warm my-5" />

            <p className="text-xs text-[var(--graphite)] max-w-2xl mx-auto leading-relaxed italic">
              {exhibition.exhibition_description}
            </p>

            <div className="flex items-center justify-center gap-4 mt-6 text-[var(--taupe)] text-[10px] font-semibold uppercase tracking-wider">
              <span>작품수: <strong className="text-[var(--charcoal)]">{exhibition.curated_items.length}점</strong></span>
              <span>·</span>
              <span>스토리 공간 테마: <strong className="text-[var(--charcoal)]" style={{ color: exhibition.theme_color }}>
                {COLOR_THEMES.find(t => t.hex === exhibition.theme_color)?.label || '커스텀 테마'}
              </strong></span>
              <span>·</span>
              <span>레이아웃 기법: <strong className="text-[var(--charcoal)]">
                {LAYOUTS.find(l => l.key === exhibition.layout_style)?.label || '세로형'}
              </strong></span>
            </div>
          </div>

          {/* ─── 레이아웃별 전시장 렌더링 ─── */}
          <div className="space-y-4">
            {exhibition.layout_style === 'grid' && (
              <GridGallery items={exhibition.curated_items} themeColor={exhibition.theme_color} />
            )}
            {exhibition.layout_style === 'slideshow' && (
              <SlideshowGallery items={exhibition.curated_items} themeColor={exhibition.theme_color} />
            )}
            {exhibition.layout_style === 'bento' && (
              <BentoGallery items={exhibition.curated_items} themeColor={exhibition.theme_color} />
            )}
            {(exhibition.layout_style === 'timeline' || !['grid', 'slideshow', 'bento'].includes(exhibition.layout_style)) && (
              <TimelineGallery items={exhibition.curated_items} themeColor={exhibition.theme_color} />
            )}
          </div>

          {/* 전시 푸터 방명록 유도 */}
          <div className="text-center py-10 bg-[var(--ivory)] border border-[var(--linen)] rounded-2xl p-6 shadow-sm max-w-md mx-auto space-y-3">
            <p className="font-display text-lg italic text-[var(--charcoal)]">
              "기억은 시간 속에 사라지지 않습니다. 단지 사랑하는 이들의 마음에 새로운 예술로 피어날 뿐입니다."
            </p>
            <div className="divider-warm w-16 mx-auto" />
            <p className="text-[9px] text-[var(--taupe)] uppercase tracking-widest font-semibold">
              Curated by {exhibition.model} · Remembery Museum
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
 * 1. Timeline Gallery Layout (세로형 도슨트)
 * ───────────────────────────────────────────────────────── */
function TimelineGallery({ items, themeColor }: { items: CuratedItemSummary[]; themeColor: string }) {
  return (
    <div className="relative space-y-0 pb-10">
      {/* Center line */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px flex-col z-0">
        <div className="flex-1 bg-gradient-to-b from-[var(--linen)] to-[var(--taupe)]/30" />
      </div>

      {items.map((item, idx) => {
        const TypeIcon = TYPE_ICONS[item.item_type] || Archive
        const isLeft = idx % 2 === 0
        return (
          <div key={item.archive_item_id} className="relative flex items-stretch z-10">
            {/* Circle order tag in center */}
            <div
              className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-8 w-8 h-8 rounded-full items-center justify-center text-white text-xs font-bold shadow-md select-none"
              style={{ backgroundColor: themeColor }}
            >
              {item.display_order}
            </div>

            {/* Alternating slot */}
            <div className={`w-full md:w-[calc(50%-2.5rem)] py-4 ${isLeft ? 'md:pr-8' : 'md:ml-auto md:pl-8'}`}>
              <div className="museum-card rounded-2xl p-6 group relative overflow-hidden transition-all duration-500 hover:shadow-lg">
                {/* Border Accent */}
                <div
                  className={`absolute top-0 ${isLeft ? 'right-0' : 'left-0'} w-1 h-full opacity-60`}
                  style={{ backgroundColor: themeColor }}
                />

                {/* Mobile top indicators */}
                <div className="md:hidden flex items-center gap-2 mb-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: themeColor }}
                  >
                    {item.display_order}
                  </span>
                  <span className="text-[9px] text-[var(--taupe)] font-semibold uppercase tracking-wider">
                    Exhibit {item.display_order}
                  </span>
                </div>

                {/* Header info */}
                <div className="flex items-center justify-between mb-3 text-[10px]">
                  <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[var(--umber)]">
                    <TypeIcon className="w-3.5 h-3.5" />
                    {item.item_type}
                  </span>
                  <span className="flex items-center gap-0.5 text-[var(--taupe)] font-semibold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {Math.round(item.relevance_score * 100)}%
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display text-base font-bold text-[var(--charcoal)] group-hover:text-[var(--umber)] transition-colors leading-snug mb-3">
                  {item.title}
                </h3>

                {/* AI Note Box */}
                <div className="bg-[var(--linen)]/50 rounded-xl p-4 border border-[var(--linen)] space-y-2">
                  <div className="flex items-start gap-1.5">
                    <Quote className="w-4 h-4 text-[var(--umber)] mt-0.5 flex-shrink-0 opacity-55" />
                    <p className="text-xs text-[var(--graphite)] leading-relaxed italic">
                      {item.ai_curator_note}
                    </p>
                  </div>
                  <p className="text-[9px] text-[var(--taupe)] font-bold text-right uppercase tracking-wider">
                    — AI Curator
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
 * 2. Grid Gallery Layout (대칭형 액자관)
 * ───────────────────────────────────────────────────────── */
function GridGallery({ items, themeColor }: { items: CuratedItemSummary[]; themeColor: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
      {items.map((item) => {
        const TypeIcon = TYPE_ICONS[item.item_type] || Archive
        return (
          <div
            key={item.archive_item_id}
            className="relative p-1 bg-gradient-to-br from-[#d4af37] via-[#aa7c11] to-[#d4af37] rounded-2xl shadow-xl hover:scale-[1.01] hover:shadow-2xl transition-all duration-500"
          >
            {/* Matte cardboard canvas layout */}
            <div className="bg-[var(--museum-bg)] rounded-xl p-6 border-8 border-[var(--linen)] space-y-4 min-h-[220px] flex flex-col justify-between">
              
              <div className="space-y-3">
                {/* Header order */}
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="inline-flex items-center gap-1 uppercase tracking-wider" style={{ color: themeColor }}>
                    <TypeIcon className="w-3.5 h-3.5" />
                    {item.item_type}
                  </span>
                  <span className="text-[var(--taupe)]">Ex. No. {item.display_order}</span>
                </div>

                {/* Painting Title */}
                <h3 className="font-display text-base font-bold text-[var(--charcoal)] leading-snug">
                  {item.title}
                </h3>
                
                <div className="divider-warm" style={{ backgroundColor: themeColor + '25' }} />

                {/* Curator commentary */}
                <div className="relative p-4 bg-white/50 border border-[var(--linen)] rounded-xl italic text-xs font-serif text-[var(--graphite)] leading-relaxed">
                  <span className="absolute -top-1.5 left-2 text-lg font-serif leading-none" style={{ color: themeColor }}>“</span>
                  <p className="px-3 py-1 font-display">{item.ai_curator_note}</p>
                  <span className="absolute -bottom-3 right-2 text-lg font-serif leading-none" style={{ color: themeColor }}>”</span>
                </div>
              </div>

              {/* Relevance Score Tag */}
              <div className="flex justify-between items-center text-[9px] text-[var(--taupe)] font-bold uppercase tracking-wider pt-2">
                <span>AI 도슨트 선정작</span>
                <span className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  {Math.round(item.relevance_score * 100)}%
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
 * 3. Slideshow Gallery Layout (시네마틱 스포트라이트)
 * ───────────────────────────────────────────────────────── */
function SlideshowGallery({ items, themeColor }: { items: CuratedItemSummary[]; themeColor: string }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const activeItem = items[currentIdx]
  const TypeIcon = TYPE_ICONS[activeItem.item_type] || Archive

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 animate-fade-in">
      
      {/* Active Screen Frame */}
      <div
        className="relative overflow-hidden rounded-3xl shadow-2xl p-8 bg-[var(--museum-bg)] border border-[var(--linen)] transition-all duration-700 min-h-[340px] flex flex-col justify-between"
        style={{ borderLeft: `8px solid ${themeColor}` }}
      >
        <div className="space-y-4">
          
          {/* Header indicator */}
          <div className="flex items-center justify-between text-[10px]">
            <span
              className="inline-flex items-center gap-1 font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: themeColor + '18', color: themeColor }}
            >
              <TypeIcon className="w-3.5 h-3.5" />
              {activeItem.item_type}
            </span>
            <span className="text-[var(--taupe)] font-bold uppercase tracking-widest">
              Exhibiting {currentIdx + 1} of {items.length}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display text-xl font-bold text-[var(--charcoal)] tracking-tight leading-snug">
            {activeItem.title}
          </h3>

          <div className="divider-warm" />

          {/* Large curator note */}
          <div className="relative p-6 bg-white/45 border border-[var(--linen)] rounded-2xl italic text-xs font-serif text-[var(--charcoal)] leading-relaxed shadow-inner">
            <span className="absolute -top-1.5 left-2 text-2xl font-serif leading-none" style={{ color: themeColor }}>“</span>
            <p className="px-3 py-1 font-display leading-relaxed text-[var(--graphite)] text-center">
              {activeItem.ai_curator_note}
            </p>
            <span className="absolute -bottom-3 right-2 text-2xl font-serif leading-none" style={{ color: themeColor }}>”</span>
          </div>

        </div>

        {/* Carousel actions */}
        <div className="flex items-center justify-between mt-8 border-t border-[var(--linen)] pt-4 select-none">
          <button
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="px-4 py-2 text-[10px] font-bold rounded-xl border border-[var(--linen)] hover:bg-[var(--linen)]/50 disabled:opacity-30 transition-all flex items-center gap-1"
          >
            <ChevronLeft className="w-3 h-3" /> 이전 작품
          </button>
          
          <span className="text-[10px] font-bold text-[var(--umber)] uppercase tracking-wider bg-[var(--linen)]/50 px-3 py-1 rounded-md">
            No. {activeItem.display_order} / 매칭 {Math.round(activeItem.relevance_score * 100)}%
          </span>

          <button
            onClick={() => setCurrentIdx(prev => Math.min(items.length - 1, prev + 1))}
            disabled={currentIdx === items.length - 1}
            className="px-4 py-2 text-[10px] font-bold rounded-xl text-white hover:opacity-90 disabled:opacity-30 transition-all flex items-center gap-1"
            style={{ backgroundColor: themeColor }}
          >
            다음 작품 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Slide indicator dots */}
      <div className="flex justify-center gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-6' : 'bg-[var(--linen)]'}`}
            style={{ backgroundColor: i === currentIdx ? themeColor : undefined }}
          />
        ))}
      </div>

    </div>
  )
}

/* ─────────────────────────────────────────────────────────
 * 4. Bento Gallery Layout (비대칭 벤토 박스)
 * ───────────────────────────────────────────────────────── */
function BentoGallery({ items, themeColor }: { items: CuratedItemSummary[]; themeColor: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 auto-rows-fr">
      {items.map((item, idx) => {
        const TypeIcon = TYPE_ICONS[item.item_type] || Archive
        // 0, 4, 7번째 카드는 가로 2칸 병합 (Featured)
        const isFeatured = idx === 0 || idx === 4 || idx === 7
        const colSpan = isFeatured ? 'md:col-span-2' : 'md:col-span-1'

        return (
          <div
            key={item.archive_item_id}
            className={`${colSpan} museum-card rounded-2xl p-6 border border-[var(--linen)] bg-[var(--museum-bg)] hover:scale-[1.01] hover:shadow-lg transition-all duration-500 flex flex-col justify-between space-y-4`}
            style={{ borderTop: `4px solid ${themeColor}` }}
          >
            <div className="space-y-3">
              {/* Top metadata */}
              <div className="flex items-center justify-between text-[10px] font-semibold">
                <span className="inline-flex items-center gap-1 uppercase tracking-wider" style={{ color: themeColor }}>
                  <TypeIcon className="w-3.5 h-3.5" />
                  {item.item_type}
                </span>
                <span className="text-[var(--taupe)] font-mono">No. {item.display_order}</span>
              </div>

              {/* Title */}
              <h3 className={`font-display font-bold text-[var(--charcoal)] leading-snug tracking-tight ${isFeatured ? 'text-lg' : 'text-sm'}`}>
                {item.title}
              </h3>

              {/* AI note */}
              <p className="text-xs text-[var(--graphite)] leading-relaxed italic">
                "{item.ai_curator_note}"
              </p>
            </div>

            {/* Bottom rating */}
            <div className="flex items-center justify-between text-[9px] text-[var(--taupe)] font-bold uppercase tracking-wider pt-2 border-t border-[var(--linen)]/40">
              <span>AI Curation Note</span>
              <span className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {Math.round(item.relevance_score * 100)}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
