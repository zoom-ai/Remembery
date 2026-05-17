/**
 * MainDashboard — Remembery 메인 대시보드
 *
 * 고인의 프로필 영역, 연혁 타임라인,
 * 상단 "AI 도슨트에게 질문하기" 검색 바를 포함합니다.
 */
import { useState } from 'react'
import {
  Search, Loader2, Quote, Calendar,
  Sparkles, ChevronRight, MessageCircle, X,
} from 'lucide-react'
import { aiAPI, type RAGQueryResponse } from '../services/api'

/* ─── Mock Profile & Timeline (데모용) ─── */
const PROFILE = {
  name: '김영호',
  subtitle: '1942 – 2024',
  title: '교육자, 시인, 그리고 사랑하는 아버지',
  bio: '평생을 교단에서 학생들과 함께한 교육자. 틈틈이 시를 쓰고, 자연을 사랑하며 가족에게 따뜻한 편지를 남기셨습니다.',
  avatarInitials: '영호',
  archiveCount: 128,
  exhibitionCount: 3,
}

const TIMELINE = [
  { year: '1942', event: '경상북도 안동에서 출생', icon: '🌱' },
  { year: '1964', event: '서울대학교 국문학과 졸업', icon: '🎓' },
  { year: '1965', event: '첫 시집 『봄을 기다리며』 출간', icon: '📖' },
  { year: '1970', event: '경북 고등학교 국어 교사 부임', icon: '🏫' },
  { year: '1985', event: '교육자 표창 수상', icon: '🏆' },
  { year: '1995', event: '제주도 가족 여행 — 가장 행복했던 여름', icon: '✈️' },
  { year: '2010', event: '은퇴 후 회고록 집필 시작', icon: '✍️' },
  { year: '2024', event: '가족의 품에서 영면', icon: '🕊️' },
]

export default function MainDashboard() {
  const [question, setQuestion] = useState('')
  const [isQuerying, setIsQuerying] = useState(false)
  const [ragResult, setRagResult] = useState<RAGQueryResponse | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  const handleAskDocent = async () => {
    if (!question.trim()) return
    setIsQuerying(true)
    setRagResult(null)
    setShowAnswer(true)
    try {
      const res = await aiAPI.query({
        question: question.trim(),
        owner_id: 1,
        top_k: 3,
        language: 'ko',
      })
      setRagResult(res.data)
    } catch {
      setRagResult({
        answer: '현재 백엔드 서버에 연결할 수 없습니다. FastAPI 서버가 실행 중인지 확인해 주세요.',
        context_used: [],
        model: 'error',
        confidence: 0,
        disclaimer: '',
      })
    } finally {
      setIsQuerying(false)
    }
  }

  return (
    <div className="space-y-10">

      {/* ═══════ AI 도슨트 검색 바 ═══════ */}
      <section className="relative">
        <div className="rounded-2xl bg-[var(--museum)] p-8 sm:p-10 text-[var(--ivory)]">
          {/* Decorative corner marks */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[var(--taupe)] opacity-30 rounded-tl-sm" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[var(--taupe)] opacity-30 rounded-tr-sm" />

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs tracking-widest uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI Docent
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light italic tracking-tight">
              "기억 속의 분에게 질문해 보세요"
            </h2>
            <p className="mt-2 text-sm opacity-60 max-w-lg mx-auto">
              아카이브에 보관된 실제 기록을 기반으로 AI 도슨트가 답변을 드립니다
            </p>
          </div>

          <div className="max-w-2xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskDocent()}
                placeholder="예: 할머니가 가장 좋아하셨던 시는 무엇인가요?"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15 transition"
              />
            </div>
            <button
              onClick={handleAskDocent}
              disabled={isQuerying || !question.trim()}
              className="px-6 py-3.5 rounded-xl bg-[var(--umber)] hover:bg-[#7d6b5e] disabled:opacity-40 text-white text-sm font-medium transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              질문하기
            </button>
          </div>
        </div>

        {/* ═══════ RAG 답변 패널 ═══════ */}
        {showAnswer && (
          <div className="mt-4 rounded-2xl museum-card p-6 animate-fade-up relative">
            <button
              onClick={() => { setShowAnswer(false); setRagResult(null) }}
              className="absolute top-4 right-4 p-1 rounded-lg text-[var(--taupe)] hover:text-[var(--charcoal)] hover:bg-[var(--linen)] transition"
            >
              <X className="w-4 h-4" />
            </button>

            {isQuerying ? (
              <div className="flex items-center gap-3 text-[var(--taupe)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm italic">아카이브를 검색하고 답변을 생성하고 있습니다...</span>
              </div>
            ) : ragResult ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-8 h-8 rounded-full bg-[var(--museum)] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[var(--ivory)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-[var(--charcoal)] whitespace-pre-line">
                      {ragResult.answer}
                    </p>
                  </div>
                </div>

                {ragResult.context_used.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--linen)]">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--taupe)] mb-2">
                      참조된 아카이브 기록
                    </p>
                    <div className="space-y-2">
                      {ragResult.context_used.map((ctx, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[var(--graphite)] bg-[var(--linen)] rounded-lg p-3">
                          <Quote className="w-3.5 h-3.5 mt-0.5 text-[var(--umber)] flex-shrink-0" />
                          <div>
                            <span className="font-medium text-[var(--charcoal)]">{ctx.title}</span>
                            <span className="mx-1.5 text-[var(--taupe)]">·</span>
                            <span className="text-[var(--taupe)]">관련도 {Math.round(ctx.relevance_score * 100)}%</span>
                            <p className="mt-1 text-[var(--graphite)] leading-relaxed">{ctx.snippet}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ragResult.disclaimer && (
                  <p className="text-[10px] text-[var(--taupe)] italic mt-3">{ragResult.disclaimer}</p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* ═══════ 프로필 카드 ═══════ */}
      <section className="rounded-2xl museum-card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[var(--museum)] via-[var(--umber)] to-[var(--museum)]" />
        <div className="px-8 pb-8 -mt-10 relative">
          <div className="w-20 h-20 rounded-2xl bg-[var(--linen)] border-4 border-[var(--ivory)] flex items-center justify-center shadow-lg">
            <span className="font-display text-2xl font-semibold text-[var(--museum)]">{PROFILE.avatarInitials}</span>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--charcoal)] tracking-tight">
                {PROFILE.name}
              </h1>
              <p className="text-sm text-[var(--taupe)] mt-0.5">{PROFILE.subtitle}</p>
              <p className="font-display text-lg italic text-[var(--umber)] mt-1">{PROFILE.title}</p>
              <p className="text-sm text-[var(--graphite)] mt-3 max-w-xl leading-relaxed">{PROFILE.bio}</p>
            </div>

            <div className="flex gap-4 flex-shrink-0">
              <div className="text-center px-5 py-3 rounded-xl bg-[var(--linen)]">
                <p className="font-display text-2xl font-semibold text-[var(--charcoal)]">{PROFILE.archiveCount}</p>
                <p className="text-[10px] uppercase tracking-widest text-[var(--taupe)] mt-0.5">기록물</p>
              </div>
              <div className="text-center px-5 py-3 rounded-xl bg-[var(--linen)]">
                <p className="font-display text-2xl font-semibold text-[var(--charcoal)]">{PROFILE.exhibitionCount}</p>
                <p className="text-[10px] uppercase tracking-widest text-[var(--taupe)] mt-0.5">전시회</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 연혁 타임라인 ═══════ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-[var(--umber)]" />
          <h2 className="font-display text-2xl font-semibold text-[var(--charcoal)]">연혁 타임라인</h2>
        </div>

        <div className="relative pl-8 stagger-children">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--umber)] via-[var(--taupe)] to-transparent" />

          {TIMELINE.map((item, idx) => (
            <div key={idx} className="relative pb-8 last:pb-0 group">
              {/* Dot */}
              <div className="absolute -left-8 top-1 w-[22px] h-[22px] rounded-full border-2 border-[var(--umber)] bg-[var(--ivory)] flex items-center justify-center group-hover:bg-[var(--umber)] transition-colors duration-300">
                <div className="w-2 h-2 rounded-full bg-[var(--umber)] group-hover:bg-[var(--ivory)] transition-colors duration-300" />
              </div>

              <div className="museum-card rounded-xl px-5 py-4 flex items-center gap-4 group-hover:border-[var(--umber)]/30">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <span className="text-xs font-semibold tracking-wider text-[var(--umber)] uppercase">{item.year}</span>
                  <p className="text-sm text-[var(--charcoal)] mt-0.5 font-medium">{item.event}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--taupe)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
