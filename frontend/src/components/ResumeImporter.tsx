/**
 * ResumeImporter — AI 이력서 분석 및 타임라인 자동 생성 컴포넌트
 * 
 * 3-state flow: Input → Loading → Preview/Edit
 */
import { useState } from 'react'
import { FileText, Sparkles, Loader2, Trash2, Save, RotateCcw, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react'
import { resumeAPI, archiveAPI } from '../services/api'

interface ResumeEvent {
  year: string
  title: string
  description: string
  category: string
}

interface Competency {
  key: string
  label: string
  score: number
  reason: string
}

interface Props {
  onImported: () => void
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  career:  { bg: 'bg-blue-50',   text: 'text-blue-700',   label: '경력' },
  study:   { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '학력' },
  project: { bg: 'bg-amber-50',  text: 'text-amber-700',  label: '프로젝트' },
  award:   { bg: 'bg-rose-50',   text: 'text-rose-700',   label: '수상' },
}

export default function ResumeImporter({ onImported }: Props) {
  const [resumeText, setResumeText] = useState('')
  const [includeCompetency, setIncludeCompetency] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [events, setEvents] = useState<ResumeEvent[]>([])
  const [competency, setCompetency] = useState<Competency[] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState('')

  /* ── AI 분석 요청 ────────────────────────────── */
  const handleAnalyze = async () => {
    if (!resumeText.trim()) return
    setError('')
    setIsAnalyzing(true)
    setSaveSuccess(false)

    try {
      const res = await resumeAPI.parse({
        resume_text: resumeText,
        include_competency: includeCompetency,
      })
      setEvents(res.data.timeline_events)
      setCompetency(res.data.competency)
      setShowResult(true)
    } catch (err: any) {
      setError(err?.response?.data?.detail || '이력서 분석 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  /* ── 일괄 저장 ──────────────────────────────── */
  const handleSave = async () => {
    if (events.length === 0) return
    setIsSaving(true)
    setError('')

    try {
      await archiveAPI.batch({
        owner_id: 1,
        items: events.map(ev => ({
          title: ev.title,
          description: ev.description || undefined,
          original_date: ev.year,
          source: 'resume_import',
          tags: ev.category,
          custom_attributes: { category: ev.category },
        })),
      })
      setSaveSuccess(true)
      setTimeout(() => onImported(), 1800)
    } catch (err: any) {
      setError(err?.response?.data?.detail || '저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  /* ── 개별 이벤트 수정 헬퍼 ──────────────────── */
  const updateEvent = (idx: number, field: keyof ResumeEvent, value: string) => {
    setEvents(prev => prev.map((ev, i) => i === idx ? { ...ev, [field]: value } : ev))
  }
  const deleteEvent = (idx: number) => {
    setEvents(prev => prev.filter((_, i) => i !== idx))
  }

  /* ── 초기화 ─────────────────────────────────── */
  const resetAll = () => {
    setShowResult(false)
    setEvents([])
    setCompetency(null)
    setSaveSuccess(false)
    setError('')
  }

  /* ═══════════════════════════════════════════════
     RENDER: Loading State
     ═══════════════════════════════════════════════ */
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[var(--umber)]/10 animate-ping" />
          <Loader2 className="w-12 h-12 text-[var(--umber)] animate-spin relative" />
        </div>
        <p className="font-display text-2xl text-[var(--umber)] animate-pulse tracking-wide">
          당신의 역사를 정리 중입니다…
        </p>
        <p className="text-sm text-[var(--taupe)]">
          Gemini AI가 이력서를 분석하여 타임라인 항목을 추출하고 있습니다
        </p>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     RENDER: Success Banner
     ═══════════════════════════════════════════════ */
  if (saveSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 transition-all duration-700">
        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
        <p className="font-display text-2xl text-[var(--charcoal)]">
          {events.length}개의 기록물이 라이브러리에 저장되었습니다
        </p>
        <p className="text-sm text-[var(--taupe)]">잠시 후 보관함으로 이동합니다…</p>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     RENDER: Preview & Edit State
     ═══════════════════════════════════════════════ */
  if (showResult) {
    return (
      <div className="space-y-8 transition-all duration-500">
        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-[var(--umber)]" />
            <h2 className="font-display text-2xl font-semibold text-[var(--charcoal)]">
              AI가 분석한 당신의 발자취
            </h2>
            <span className="px-3 py-1 rounded-full bg-[var(--museum)] text-[var(--ivory)] text-xs font-medium">
              {events.length}개 항목
            </span>
          </div>
        </div>

        {/* ── Competency Bars ────────────────────── */}
        {competency && competency.length > 0 && (
          <div className="museum-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-[var(--umber)]" />
              <h3 className="font-display text-lg font-semibold text-[var(--charcoal)]">역량 분석 결과</h3>
            </div>
            {competency.map((c) => (
              <div key={c.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--charcoal)]">{c.label}</span>
                  <span className="font-semibold text-[var(--museum)]">{c.score}점</span>
                </div>
                <div className="w-full h-3 bg-[var(--linen)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${c.score}%`,
                      background: `linear-gradient(90deg, var(--taupe), var(--museum))`,
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--taupe)] pl-1">{c.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Event Cards ────────────────────────── */}
        <div className="space-y-4">
          {events.map((ev, idx) => {
            const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.career
            return (
              <div
                key={idx}
                className="museum-card rounded-2xl p-5 space-y-3 transition-all duration-300"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Top row: badge + delete */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <button
                    onClick={() => deleteEvent(idx)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Year + Title row */}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={ev.year}
                    onChange={(e) => updateEvent(idx, 'year', e.target.value)}
                    className="w-28 px-3 py-2 text-center rounded-lg bg-[var(--parchment)] border border-[var(--linen)]
                               text-sm font-semibold text-[var(--charcoal)] focus:outline-none focus:ring-2
                               focus:ring-[var(--umber)]/30 transition-all"
                    placeholder="연도"
                  />
                  <input
                    type="text"
                    value={ev.title}
                    onChange={(e) => updateEvent(idx, 'title', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--parchment)] border border-[var(--linen)]
                               text-sm font-semibold text-[var(--charcoal)] focus:outline-none focus:ring-2
                               focus:ring-[var(--umber)]/30 transition-all"
                    placeholder="활동 명칭"
                  />
                </div>

                {/* Description */}
                <textarea
                  value={ev.description}
                  onChange={(e) => updateEvent(idx, 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--parchment)] border border-[var(--linen)]
                             text-sm text-[var(--graphite)] resize-none focus:outline-none focus:ring-2
                             focus:ring-[var(--umber)]/30 transition-all"
                  placeholder="상세 설명을 입력하거나 수정하세요..."
                />

                {/* Category selector */}
                <div className="flex gap-2">
                  {Object.entries(CATEGORY_STYLES).map(([key, s]) => (
                    <button
                      key={key}
                      onClick={() => updateEvent(idx, 'category', key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                        ${ev.category === key
                          ? `${s.bg} ${s.text} ring-2 ring-offset-1 ring-current`
                          : 'bg-[var(--linen)] text-[var(--taupe)] hover:bg-[var(--parchment)]'
                        }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Action Bar ─────────────────────────── */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--linen)]">
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--taupe)]
                       text-sm font-medium text-[var(--graphite)] hover:bg-[var(--linen)] transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            다시 분석하기
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || events.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--museum)] text-[var(--ivory)]
                       text-sm font-medium hover:bg-[var(--charcoal)] transition-all active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            이대로 내 라이브러리에 저장
          </button>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     RENDER: Input State (Default)
     ═══════════════════════════════════════════════ */
  return (
    <div className="max-w-3xl mx-auto space-y-8 transition-all duration-500">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--museum)]/10 mb-2">
          <FileText className="w-8 h-8 text-[var(--umber)]" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-[var(--charcoal)]">
          이력서로 타임라인 만들기
        </h1>
        <p className="text-[var(--graphite)] text-sm max-w-lg mx-auto leading-relaxed">
          이력서 텍스트를 붙여넣으면, AI가 학력·경력·프로젝트·수상 항목을 자동으로 추출하여
          당신의 인생 타임라인으로 변환해 드립니다.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Textarea */}
      <div className="museum-card rounded-2xl p-6 space-y-5">
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 rounded-xl bg-[var(--parchment)] border border-[var(--linen)]
                     text-sm text-[var(--charcoal)] font-mono leading-relaxed resize-none
                     placeholder:text-[var(--taupe)] focus:outline-none focus:ring-2
                     focus:ring-[var(--umber)]/30 transition-all"
          placeholder={`이력서 텍스트를 여기에 붙여넣으세요...\n\n예시:\n2015  서울대학교 컴퓨터공학과 졸업\n2016-2020  삼성전자 소프트웨어 엔지니어\n2020  우수 사원상 수상\n2021-현재  Google DeepMind 연구원`}
        />

        {/* Options Row */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={includeCompetency}
              onChange={(e) => setIncludeCompetency(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--taupe)] text-[var(--museum)]
                         focus:ring-[var(--umber)]/30 transition-all"
            />
            <span className="flex items-center gap-1.5 text-sm text-[var(--graphite)] group-hover:text-[var(--charcoal)] transition-colors">
              <BarChart3 className="w-4 h-4" />
              역량 분석 포함
            </span>
          </label>

          <span className="text-xs text-[var(--taupe)]">
            {resumeText.length.toLocaleString()} / 30,000자
          </span>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleAnalyze}
          disabled={!resumeText.trim() || resumeText.trim().length < 10}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl
                     bg-[var(--museum)] text-[var(--ivory)] text-sm font-medium
                     hover:bg-[var(--charcoal)] transition-all active:scale-[0.98]
                     disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          AI로 분석하기
        </button>
      </div>
    </div>
  )
}
