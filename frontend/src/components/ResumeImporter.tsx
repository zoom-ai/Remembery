/**
 * ResumeImporter — AI 이력서 분석 및 타임라인 자동 생성 컴포넌트
 *
 * 듀얼 입력: 텍스트 붙여넣기 OR PDF/DOCX/TXT 파일 업로드
 * 3-state flow: Input → Loading → Preview/Edit
 */
import { useState, useRef, useCallback } from 'react'
import {
  FileText,
  Sparkles,
  Loader2,
  Trash2,
  Save,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileUp,
  X,
  Inbox,
} from 'lucide-react'
import { resumeAPI, archiveAPI } from '../services/api'

/* ── 에러 메시지 유틸 ─────────────────────────────── */
function getErrorMessage(err: any, context: 'extract' | 'parse' | 'save'): string {
  // 1. 서버 응답이 있는 경우 — API에서 보낸 에러 메시지
  if (err?.response?.data?.detail) {
    const detail = err.response.data.detail
    return typeof detail === 'string' ? detail : JSON.stringify(detail)
  }

  // 2. 네트워크 에러 (서버 꺼짐, CORS 차단 등)
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요. (http://localhost:8000)'
  }

  // 3. 타임아웃
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'AI 분석 요청이 시간 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.'
  }

  // 4. HTTP 상태 코드별
  const status = err?.response?.status
  if (status === 422) return '파일 형식을 처리할 수 없습니다. 텍스트가 포함된 PDF/DOCX/TXT 파일인지 확인해 주세요.'
  if (status === 413) return '파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해 주세요.'
  if (status === 500) return '서버 내부 오류가 발생했습니다. Gemini API 키가 올바르게 설정되어 있는지 확인해 주세요.'

  // 5. 기본 메시지
  const messages = {
    extract: '파일에서 텍스트를 추출하지 못했습니다. 다른 파일을 시도해 주세요.',
    parse: '이력서 분석 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.',
    save: '저장 중 오류가 발생했습니다. 다시 시도해 주세요.',
  }
  return messages[context]
}

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

type InputMode = 'text' | 'file'

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  career:  { bg: 'bg-blue-50',    text: 'text-blue-700',    label: '경력' },
  study:   { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '학력' },
  project: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: '프로젝트' },
  award:   { bg: 'bg-rose-50',    text: 'text-rose-700',    label: '수상' },
}

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md', '.rtf']

export default function ResumeImporter({ onImported }: Props) {
  /* ── State ─────────────────────────────────────── */
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [resumeText, setResumeText] = useState('')
  const [includeCompetency, setIncludeCompetency] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [events, setEvents] = useState<ResumeEvent[]>([])
  const [competency, setCompetency] = useState<Competency[] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState('')

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── File validation ───────────────────────────── */
  const validateFile = (file: File): string | null => {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `지원되지 않는 파일 형식입니다. PDF, DOCX, TXT 파일만 업로드할 수 있습니다.`
    }
    if (file.size > 10 * 1024 * 1024) {
      return '파일 크기가 10MB를 초과합니다.'
    }
    if (file.size === 0) {
      return '빈 파일입니다. 내용이 있는 파일을 업로드해 주세요.'
    }
    return null
  }

  /* ── File selection handler ────────────────────── */
  const handleFileSelect = useCallback((file: File) => {
    const err = validateFile(file)
    if (err) {
      setError(err)
      return
    }
    setError('')
    setSelectedFile(file)
  }, [])

  /* ── File upload & text extraction ─────────────── */
  const handleExtractText = async () => {
    if (!selectedFile) return
    setIsExtracting(true)
    setError('')

    try {
      const res = await resumeAPI.extractText(selectedFile)
      const text = res.data.extracted_text
      if (!text || text.trim().length < 10) {
        setError('파일에서 충분한 텍스트를 추출하지 못했습니다. 텍스트가 포함된 파일인지 확인해 주세요.')
        setIsExtracting(false)
        return
      }
      setResumeText(text)
      setInputMode('text')
    } catch (err: any) {
      setError(getErrorMessage(err, 'extract'))
    } finally {
      setIsExtracting(false)
    }
  }

  /* ── File upload & direct analyze ──────────────── */
  const handleFileDirectAnalyze = async () => {
    if (!selectedFile) return
    setIsExtracting(true)
    setError('')

    try {
      // Step 1: Extract text
      const extractRes = await resumeAPI.extractText(selectedFile)
      const text = extractRes.data.extracted_text

      if (!text || text.trim().length < 10) {
        setError('파일에서 충분한 텍스트를 추출하지 못했습니다. 이미지 기반 PDF(스캔)는 지원되지 않습니다. 텍스트가 포함된 파일을 업로드해 주세요.')
        setIsExtracting(false)
        return
      }

      setResumeText(text)
      setIsExtracting(false)

      // Step 2: Analyze with AI
      setIsAnalyzing(true)
      try {
        const parsed = await resumeAPI.parse({
          resume_text: text,
          include_competency: includeCompetency,
        })

        const timelineEvents = parsed.data.timeline_events || []
        setEvents(timelineEvents)
        setCompetency(parsed.data.competency || null)
        setShowResult(true)
      } catch (err: any) {
        setError(getErrorMessage(err, 'parse'))
      } finally {
        setIsAnalyzing(false)
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'extract'))
      setIsExtracting(false)
    }
  }

  /* ── Drag & Drop handlers ──────────────────────── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  /* ── AI 분석 요청 (텍스트 모드) ─────────────────── */
  const handleAnalyze = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 10) return
    setError('')
    setIsAnalyzing(true)
    setSaveSuccess(false)

    try {
      const res = await resumeAPI.parse({
        resume_text: resumeText,
        include_competency: includeCompetency,
      })
      const timelineEvents = res.data.timeline_events || []
      setEvents(timelineEvents)
      setCompetency(res.data.competency || null)
      setShowResult(true)
    } catch (err: any) {
      setError(getErrorMessage(err, 'parse'))
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
      setError(getErrorMessage(err, 'save'))
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
    setSelectedFile(null)
    setError('')
    setIsAnalyzing(false)
    setIsExtracting(false)
  }

  /* ── Format file size ──────────────────────── */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return '📄'
    if (ext === 'docx' || ext === 'doc') return '📝'
    return '📃'
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
            <span className="flex-1">{error}</span>
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

        {/* ── Empty State (no events found) ──────── */}
        {events.length === 0 && (
          <div className="museum-card rounded-2xl p-10 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--linen)] mb-2">
              <Inbox className="w-8 h-8 text-[var(--taupe)]" />
            </div>
            <h3 className="font-display text-xl font-semibold text-[var(--charcoal)]">
              추출된 항목이 없습니다
            </h3>
            <p className="text-sm text-[var(--graphite)] max-w-md mx-auto leading-relaxed">
              AI가 이력서에서 타임라인 항목을 찾지 못했습니다.
              이력서에 연도, 직함/학교명, 활동 내용이 포함되어 있는지 확인해 주세요.
              이미지 기반 PDF(스캔)의 경우 텍스트를 인식하지 못할 수 있습니다.
            </p>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-[var(--museum)] text-[var(--ivory)] text-sm font-medium
                         hover:bg-[var(--charcoal)] transition-all active:scale-95 mt-2"
            >
              <RotateCcw className="w-4 h-4" />
              다시 시도하기
            </button>
          </div>
        )}

        {/* ── Event Cards ────────────────────────── */}
        {events.length > 0 && (
          <div className="space-y-4">
            {events.map((ev, idx) => {
              const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.career
              return (
                <div
                  key={idx}
                  className="museum-card rounded-2xl p-5 space-y-3 transition-all duration-300"
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
                  <div className="flex gap-2 flex-wrap">
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
        )}

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
          {events.length > 0 && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--museum)] text-[var(--ivory)]
                         text-sm font-medium hover:bg-[var(--charcoal)] transition-all active:scale-95
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              이대로 내 라이브러리에 저장
            </button>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     RENDER: Input State (Default) — Dual Mode
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
          이력서를 붙여넣거나 파일로 업로드하면, AI가 학력·경력·프로젝트·수상 항목을 자동으로 추출하여
          당신의 인생 타임라인으로 변환해 드립니다.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Input Mode Toggle ────────────────────── */}
      <div className="flex rounded-xl bg-[var(--linen)] p-1 gap-1">
        <button
          onClick={() => setInputMode('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
            ${inputMode === 'text'
              ? 'bg-[var(--ivory)] text-[var(--charcoal)] shadow-sm'
              : 'text-[var(--taupe)] hover:text-[var(--graphite)]'
            }`}
        >
          <FileText className="w-4 h-4" />
          텍스트 붙여넣기
        </button>
        <button
          onClick={() => setInputMode('file')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
            ${inputMode === 'file'
              ? 'bg-[var(--ivory)] text-[var(--charcoal)] shadow-sm'
              : 'text-[var(--taupe)] hover:text-[var(--graphite)]'
            }`}
        >
          <Upload className="w-4 h-4" />
          파일 업로드
        </button>
      </div>

      {/* ── Input Card ───────────────────────────── */}
      <div className="museum-card rounded-2xl p-6 space-y-5">

        {/* === Text Mode === */}
        {inputMode === 'text' && (
          <>
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
          </>
        )}

        {/* === File Mode === */}
        {inputMode === 'file' && (
          <>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md,.rtf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
                // Reset input so same file can be re-selected
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            />

            {/* Drop Zone */}
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-4 py-16 rounded-xl border-2 border-dashed
                  cursor-pointer transition-all duration-300
                  ${isDragOver
                    ? 'border-[var(--umber)] bg-[var(--umber)]/5 scale-[1.01]'
                    : 'border-[var(--taupe)]/30 bg-[var(--parchment)] hover:border-[var(--taupe)]/50 hover:bg-[var(--linen)]/50'
                  }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                  ${isDragOver ? 'bg-[var(--umber)]/10' : 'bg-[var(--linen)]'}`}
                >
                  <FileUp className={`w-7 h-7 transition-all duration-300
                    ${isDragOver ? 'text-[var(--umber)] scale-110' : 'text-[var(--taupe)]'}`}
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-[var(--charcoal)]">
                    {isDragOver ? '여기에 놓으세요!' : '파일을 드래그하거나 클릭하여 업로드'}
                  </p>
                  <p className="text-xs text-[var(--taupe)]">
                    PDF, DOCX, TXT 지원 · 최대 10MB
                  </p>
                </div>
              </div>
            ) : (
              /* Selected File Preview */
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--parchment)] border border-[var(--linen)]">
                  <div className="w-12 h-12 rounded-xl bg-[var(--linen)] flex items-center justify-center text-2xl shrink-0">
                    {getFileIcon(selectedFile.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--charcoal)] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-[var(--taupe)]">
                      {formatFileSize(selectedFile.size)} · {selectedFile.name.split('.').pop()?.toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setError('')
                    }}
                    className="p-2 rounded-lg text-[var(--taupe)] hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                    title="파일 제거"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Extracting indicator */}
                {isExtracting && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--linen)]">
                    <Loader2 className="w-4 h-4 text-[var(--umber)] animate-spin" />
                    <span className="text-sm text-[var(--graphite)] animate-pulse">
                      파일에서 텍스트를 추출하고 있습니다…
                    </span>
                  </div>
                )}

                {/* Competency checkbox */}
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

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleExtractText}
                    disabled={isExtracting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                               border border-[var(--taupe)] text-sm font-medium text-[var(--graphite)]
                               hover:bg-[var(--linen)] transition-all active:scale-[0.98]
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    텍스트 추출 후 검토
                  </button>
                  <button
                    onClick={handleFileDirectAnalyze}
                    disabled={isExtracting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                               bg-[var(--museum)] text-[var(--ivory)] text-sm font-medium
                               hover:bg-[var(--charcoal)] transition-all active:scale-[0.98]
                               disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    바로 AI 분석하기
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Info about text mode after file extraction ── */}
      {inputMode === 'text' && resumeText && selectedFile && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            <strong>{selectedFile.name}</strong>에서 텍스트가 추출되었습니다. 내용을 확인한 뒤 분석을 시작하세요.
          </span>
        </div>
      )}
    </div>
  )
}
