/**
 * ExhibitionHall — AI 큐레이션 전시관
 *
 * 사용자가 테마를 입력하면 AI가 아카이브 자료를 분석하여
 * 가상 갤러리 형태의 큐레이션된 전시 시나리오를 생성합니다.
 */
import { useState } from 'react'
import {
  Loader2, Sparkles, Palette, Star,
  FileText, BookOpen, Image, Video, Music, PenLine, Archive,
  Quote, Landmark,
} from 'lucide-react'
import { exhibitionAPI, type CurationResponse, type CuratedItemSummary } from '../services/api'

const TYPE_ICONS: Record<string, React.ElementType> = {
  document: FileText, book: BookOpen, photo: Image,
  video: Video, audio: Music, journal: PenLine, other: Archive,
}

const THEME_SUGGESTIONS = [
  '1990년대 가족의 기록',
  '교육과 학문의 여정',
  '가장 행복했던 여행',
  '편지와 손글씨의 온기',
  '시와 문학 세계',
]

export default function ExhibitionHall() {
  const [theme, setTheme] = useState('')
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
        max_items: 10,
        language: 'ko',
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

      {/* ═══════ 전시 테마 입력 ═══════ */}
      <section className="rounded-2xl overflow-hidden">
        <div
          className="p-8 sm:p-12 text-center relative"
          style={{ background: 'linear-gradient(135deg, var(--museum) 0%, var(--umber) 60%, #7d6b5e 100%)' }}
        >
          {/* Decorative frame corners */}
          <div className="absolute top-5 left-5 w-10 h-10 border-t border-l border-white/20 rounded-tl" />
          <div className="absolute top-5 right-5 w-10 h-10 border-t border-r border-white/20 rounded-tr" />
          <div className="absolute bottom-5 left-5 w-10 h-10 border-b border-l border-white/20 rounded-bl" />
          <div className="absolute bottom-5 right-5 w-10 h-10 border-b border-r border-white/20 rounded-br" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[11px] tracking-widest uppercase text-white/80 mb-5">
            <Landmark className="w-3.5 h-3.5" />
            AI Curated Exhibition
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-light text-white italic tracking-tight">
            온라인 전시회를 열어보세요
          </h2>
          <p className="mt-3 text-sm text-white/50 max-w-lg mx-auto">
            테마를 입력하면 AI 큐레이터가 아카이브를 분석하여<br />
            전시 시나리오를 자동으로 설계합니다
          </p>

          <div className="max-w-xl mx-auto mt-8 flex gap-3">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCurate()}
              placeholder="전시 테마를 입력하세요..."
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/35 text-sm focus:outline-none focus:border-white/40 transition"
            />
            <button
              onClick={() => handleCurate()}
              disabled={isGenerating || !theme.trim()}
              className="px-6 py-3.5 rounded-xl bg-white text-[var(--museum)] text-sm font-semibold hover:bg-white/90 disabled:opacity-40 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              전시 생성
            </button>
          </div>

          {/* 추천 테마 칩 */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {THEME_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setTheme(s); handleCurate(s) }}
                className="px-3 py-1 rounded-full text-[11px] text-white/60 border border-white/15 hover:border-white/40 hover:text-white/90 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 에러 메시지 ═══════ */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ═══════ 전시 로딩 ═══════ */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--taupe)] animate-fade-up">
          <div className="relative w-16 h-16 mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--linen)]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[var(--umber)] animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[var(--umber)] animate-soft-pulse" />
          </div>
          <p className="font-display text-lg italic text-[var(--charcoal)]">AI 큐레이터가 전시를 설계하고 있습니다...</p>
          <p className="text-xs text-[var(--taupe)] mt-1">아카이브를 검색하고 최적의 동선을 구성하는 중</p>
        </div>
      )}

      {/* ═══════ 전시 시나리오 결과 ═══════ */}
      {exhibition && !isGenerating && (
        <div className="space-y-8 animate-fade-up">

          {/* 전시 헤더 */}
          <div className="rounded-2xl museum-card p-8 text-center relative overflow-hidden">
            {/* Color accent from AI */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ background: `linear-gradient(90deg, transparent, ${exhibition.theme_color}, transparent)` }}
            />

            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--taupe)] mb-3">특별 전시</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--charcoal)] tracking-tight">
              {exhibition.exhibition_title}
            </h2>
            <p className="font-display text-lg italic text-[var(--umber)] mt-2">
              {exhibition.exhibition_subtitle}
            </p>

            <div className="divider-warm my-6" />

            <p className="text-sm text-[var(--graphite)] max-w-2xl mx-auto leading-relaxed">
              {exhibition.exhibition_description}
            </p>

            <div className="flex items-center justify-center gap-6 mt-6 text-[var(--taupe)] text-xs">
              <span>전시 작품 <strong className="text-[var(--charcoal)]">{exhibition.curated_items.length}점</strong></span>
              <span>·</span>
              <span>검토 자료 <strong className="text-[var(--charcoal)]">{exhibition.total_items_reviewed}건</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Palette className="w-3 h-3" />
                <span className="font-mono" style={{ color: exhibition.theme_color }}>{exhibition.theme_color}</span>
              </span>
            </div>
          </div>

          {/* 전시 동선 — 갤러리 워크스루 */}
          <div className="space-y-0">
            {exhibition.curated_items.map((item, idx) => (
              <ExhibitionCard
                key={item.archive_item_id}
                item={item}
                index={idx}
                total={exhibition.curated_items.length}
                themeColor={exhibition.theme_color}
              />
            ))}
          </div>

          {/* 전시 푸터 */}
          <div className="text-center py-8">
            <p className="font-display text-xl italic text-[var(--taupe)]">
              "기억은 사라지지 않습니다. 단지 새로운 형태로 이어질 뿐입니다."
            </p>
            <p className="text-[10px] text-[var(--taupe)] mt-3 uppercase tracking-widest">
              Exhibition curated by {exhibition.model}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Individual Exhibition Item Card ─── */
function ExhibitionCard({
  item, index, total, themeColor,
}: {
  item: CuratedItemSummary
  index: number
  total: number
  themeColor: string
}) {
  const TypeIcon = TYPE_ICONS[item.item_type] || Archive
  const isLeft = index % 2 === 0

  return (
    <div className="relative flex items-stretch">
      {/* Center vertical line */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px flex-col">
        <div className="flex-1 bg-gradient-to-b from-[var(--linen)] to-[var(--taupe)]/30" />
      </div>

      {/* Sequence number dot */}
      <div
        className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-8 w-8 h-8 rounded-full items-center justify-center text-white text-xs font-semibold z-10 shadow-md"
        style={{ backgroundColor: themeColor }}
      >
        {item.display_order}
      </div>

      {/* Card — alternating left/right */}
      <div className={`w-full md:w-[calc(50%-2rem)] py-4 ${isLeft ? 'md:pr-8' : 'md:ml-auto md:pl-8'}`}>
        <div className="museum-card rounded-2xl p-6 group relative overflow-hidden">
          {/* Side accent */}
          <div
            className={`absolute top-0 ${isLeft ? 'right-0' : 'left-0'} w-1 h-full opacity-40`}
            style={{ backgroundColor: themeColor }}
          />

          {/* Mobile order badge */}
          <div className="md:hidden flex items-center gap-2 mb-3">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: themeColor }}
            >
              {item.display_order}
            </span>
            <span className="text-[10px] text-[var(--taupe)] uppercase tracking-wider">
              {item.display_order} / {total}
            </span>
          </div>

          {/* Type & Score */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--umber)]">
              <TypeIcon className="w-3.5 h-3.5" />
              {item.item_type}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[var(--taupe)]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {Math.round(item.relevance_score * 100)}%
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display text-xl font-semibold text-[var(--charcoal)] group-hover:text-[var(--umber)] transition-colors leading-snug mb-3">
            {item.title}
          </h3>

          {/* AI Curator Note */}
          <div className="bg-[var(--linen)]/70 rounded-xl p-4 border border-[var(--linen)]">
            <div className="flex items-start gap-2">
              <Quote className="w-4 h-4 text-[var(--umber)] mt-0.5 flex-shrink-0 opacity-60" />
              <p className="text-xs text-[var(--graphite)] leading-relaxed italic">
                {item.ai_curator_note}
              </p>
            </div>
            <p className="text-[9px] text-[var(--taupe)] mt-2 text-right uppercase tracking-wider">
              — AI Docent
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
