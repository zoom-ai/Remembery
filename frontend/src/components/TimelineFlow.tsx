import { useState, useEffect, useRef } from 'react'
import {
  FileText, BookOpen, Image as ImageIcon, Video, Music, PenLine,
  Archive, Loader2, Sparkles, AlertCircle, Tag
} from 'lucide-react'
import { archiveAPI, categoryAPI, type ArchiveItem, type Category, type User } from '../services/api'

/* ─── Helpers ─────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  Image: ImageIcon, FileText, Video, BookOpen, Music, PenLine, Archive,
  Camera: ImageIcon, Trophy: Archive,
}

function getCategoryIcon(iconName: string | null): React.ElementType {
  return iconName ? (ICON_MAP[iconName] || Archive) : Archive
}

function formatDate(d: string | null) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return d
  }
}

/* ─── ScrollReveal Component ───────────────────────────── */
function ScrollReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.97]'
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* ─── Main TimelineFlow Component ─────────────────────── */
interface TimelineFlowProps {
  owner: User
}

export default function TimelineFlow({ owner }: TimelineFlowProps) {
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTimelineData = async () => {
      try {
        setIsLoading(true)
        const [itemsRes, catsRes] = await Promise.all([
          archiveAPI.list({ limit: 100 }),
          categoryAPI.list(),
        ])
        
        // Sort items chronologically by original_date. 
        // If original_date is missing, fall back to created_at.
        const sortedItems = [...itemsRes.data.items].sort((a, b) => {
          const dateA = a.original_date || a.created_at
          const dateB = b.original_date || b.created_at
          return new Date(dateA).getTime() - new Date(dateB).getTime()
        })

        setItems(sortedItems)
        setCategories(catsRes.data)
      } catch (err) {
        console.error('Failed to load timeline data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadTimelineData()
  }, [])

  // Calculate age based on year and owner's birth_date
  const getAgeForYear = (dateStr: string | null) => {
    if (!dateStr || !owner.birth_date) return null
    try {
      const itemYear = new Date(dateStr).getFullYear()
      const birthYear = new Date(owner.birth_date).getFullYear()
      const age = itemYear - birthYear
      return age >= 0 ? age : null
    } catch {
      return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-[var(--umber)] animate-spin" />
        <span className="text-xs text-[var(--taupe)] font-medium">인생 타임라인 기록들을 정렬하고 있습니다...</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-[var(--ivory)] border border-[var(--linen)] rounded-2xl shadow-sm space-y-4">
        <div className="w-12 h-12 bg-[var(--linen)] text-[var(--umber)] rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-base font-semibold text-[var(--charcoal)]">
            기록된 연대기가 없습니다
          </h3>
          <p className="text-xs text-[var(--taupe)] leading-relaxed">
            아직 보관함에 등록된 유산 기록이 없습니다.<br />
            소중한 삶의 사진, 편지, 문서를 업로드하여 연도별 인생 타임라인을 완성해보세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Introduction Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--umber)] tracking-widest uppercase bg-[var(--linen)] px-3 py-1 rounded-full">
          <Sparkles className="w-3 h-3" /> Life Legacy Chronicle
        </div>
        <h2 className="font-display text-2xl font-bold text-[var(--charcoal)]">
          {owner.display_name} 님의 인생 연대기
        </h2>
        <p className="text-xs text-[var(--taupe)] leading-relaxed italic">
          {owner.motto ? `"${owner.motto}"` : '평생에 걸친 삶의 궤적을 연도별로 회상하는 디지털 타임라인입니다.'}
        </p>
        {owner.birth_date && (
          <div className="text-[10px] text-[var(--taupe)] font-semibold border-t border-[var(--linen)] pt-3 mt-1 inline-block px-6">
            여정의 시작: {new Date(owner.birth_date).getFullYear()}년 
            {owner.death_date ? ` ~ 영원한 기억: ${new Date(owner.death_date).getFullYear()}년` : ' ~ 현재'}
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="relative max-w-4xl mx-auto pb-16">
        
        {/* Central Vertical Timeline Line */}
        <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-[var(--umber)]/40 via-[var(--umber)]/20 to-transparent" />

        {/* Timeline Items */}
        <div className="space-y-6">
          {items.map((item, index) => {
            const isLeft = index % 2 === 0
            const cat = categories.find(c => c.id === item.category_id)
            const catColor = cat?.color || '#8c8278'
            const CatIcon = getCategoryIcon(cat?.icon || null)
            const age = getAgeForYear(item.original_date || item.created_at)
            
            const isImage = item.file_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(item.file_url)
            const imageUrl = isImage ? `http://localhost:8000${item.file_url}` : null

            return (
              <ScrollReveal key={item.id}>
                <div className={`flex flex-col md:flex-row ${isLeft ? 'md:flex-row-reverse' : ''} w-full relative`}>
                  
                  {/* Card Container */}
                  <div className={`w-full md:w-1/2 pl-12 pr-4 ${isLeft ? 'md:pl-4 md:pr-10' : 'md:pl-10 md:pr-4'}`}>
                    <div className="museum-card rounded-2xl overflow-hidden border border-[var(--linen)] bg-[var(--museum-bg)] hover:scale-[1.01] hover:shadow-xl hover:shadow-[var(--umber)]/5 transition-all duration-500 p-5 space-y-4">
                      
                      {/* Badge and Date */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                          style={{
                            backgroundColor: catColor + '12',
                            borderColor: catColor + '20',
                            color: catColor
                          }}
                        >
                          <CatIcon className="w-2.5 h-2.5" />
                          {item.category_name || cat?.name || item.item_type || '기록'}
                        </span>
                        
                        <span className="text-[10px] text-[var(--taupe)] font-medium">
                          {formatDate(item.original_date || item.created_at)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-display text-sm font-semibold text-[var(--charcoal)] leading-snug">
                        {item.title}
                      </h3>

                      {/* Image Thumbnail */}
                      {imageUrl && (
                        <div className="w-full h-44 rounded-xl overflow-hidden relative group">
                          <img
                            src={imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                        </div>
                      )}

                      {/* Content Description */}
                      <p className="text-xs text-[var(--graphite)] leading-relaxed line-clamp-4">
                        {item.ai_summary || item.description || '이 연도에 작성된 소중한 삶의 유산 조각입니다.'}
                      </p>

                      {/* AI Quote Citation */}
                      {item.highlight_quote && (
                        <div className="relative mt-2.5 p-3.5 bg-white/40 border border-[var(--linen)] rounded-xl italic text-xs font-serif text-[var(--charcoal)] leading-relaxed text-center">
                          <span className="absolute -top-1.5 left-2 text-lg text-[var(--umber)] font-serif leading-none">“</span>
                          <p className="px-3 py-1 font-display text-[var(--charcoal)]/90 leading-normal">
                            {item.highlight_quote}
                          </p>
                          <span className="absolute -bottom-3 right-2 text-lg text-[var(--umber)] font-serif leading-none">”</span>
                        </div>
                      )}

                      {/* Tags */}
                      {item.tags && (
                        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[var(--linen)]">
                          {item.tags.split(',').slice(0, 3).map((t, i) => (
                            <span key={i} className="inline-flex items-center text-[9px] text-[var(--taupe)] bg-[var(--linen)] px-2 py-0.5 rounded-md">
                              <Tag className="w-2 h-2 mr-1" />{t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Central Node Circle */}
                  <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 top-6 z-10 flex items-center justify-center">
                    <div
                      className="w-4 h-4 rounded-full bg-[var(--ivory)] border-2 flex items-center justify-center shadow-md transition-transform duration-500 hover:scale-125"
                      style={{ borderColor: catColor }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                    </div>
                    
                    {/* Centered Floating Year & Age Node for desktop */}
                    <div className={`absolute hidden md:block whitespace-nowrap text-[10px] font-bold ${isLeft ? 'right-6' : 'left-6'} bg-[var(--ivory)]/90 backdrop-blur-md border border-[var(--linen)] px-2.5 py-0.5 rounded-md shadow-sm`}>
                      <span className="text-[var(--charcoal)] mr-1">
                        {item.original_date ? new Date(item.original_date).getFullYear() : new Date(item.created_at).getFullYear()}년
                      </span>
                      {age !== null && (
                        <span className="text-[var(--umber)] font-extrabold">({age}세)</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Empty Slot for alternating grid spacing on desktop */}
                  <div className="hidden md:block w-1/2" />
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </div>
  )
}
