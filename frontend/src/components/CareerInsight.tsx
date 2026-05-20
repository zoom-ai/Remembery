/**
 * CareerInsight — AI 역량 레이더 차트 + 도슨트 코멘트 리포트
 *
 * 사용자가 이력서 텍스트를 입력하면 Gemini AI가 5축 역량을 수치화하고,
 * Chart.js Radar 차트로 시각화한 뒤 도슨트 코멘트를 하단에 배치합니다.
 */
import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import {
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
  TrendingUp,
  MessageCircle,
  ClipboardPaste,
} from 'lucide-react'
import { resumeAPI, aiAPI, type ResumeCompetency } from '../services/api'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface Props {
  owner: { id: number; display_name: string }
}

/* ── 역량 축 한글 매핑 ────────────────────────── */
const DIMENSION_LABELS: Record<string, string> = {
  technical_skill: '기술력',
  leadership: '리더십',
  creativity: '창의성',
  communication: '소통 능력',
  execution: '실행력',
}

/* ── 역량 아이콘 이모지 ─────────────────────────── */
const DIMENSION_EMOJI: Record<string, string> = {
  technical_skill: '⚙️',
  leadership: '🏅',
  creativity: '💡',
  communication: '🗣️',
  execution: '🚀',
}

export default function CareerInsight({ owner }: Props) {
  const [resumeText, setResumeText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [competency, setCompetency] = useState<ResumeCompetency[] | null>(null)
  const [docentComment, setDocentComment] = useState('')
  const [isDocentLoading, setIsDocentLoading] = useState(false)
  const [error, setError] = useState('')

  /* ── AI 분석 요청 ──────────────────────────────── */
  const handleAnalyze = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 10) return
    setError('')
    setIsAnalyzing(true)
    setCompetency(null)
    setDocentComment('')

    try {
      // 1. 역량 분석
      const res = await resumeAPI.parse({
        resume_text: resumeText,
        include_competency: true,
      })

      if (res.data.competency && res.data.competency.length > 0) {
        setCompetency(res.data.competency)

        // 2. AI 도슨트 코멘트 비동기 요청
        fetchDocentComment(res.data.competency)
      } else {
        setError('역량 분석 결과가 없습니다. 좀 더 구체적인 이력서 내용을 입력해 주세요.')
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || '역량 분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  /* ── AI 도슨트 코멘트 요청 ─────────────────────── */
  const fetchDocentComment = async (comp: ResumeCompetency[]) => {
    setIsDocentLoading(true)
    try {
      const summary = comp
        .map(c => `${c.label}: ${c.score}점 (${c.reason})`)
        .join(', ')

      const res = await aiAPI.query({
        question: `이 사용자의 역량 분석 결과는 다음과 같습니다: ${summary}. 이 결과를 바탕으로 사용자의 커리어 강점과 성장 가능성을 따뜻하고 격려하는 톤으로 3-4문장으로 코멘트해 주세요. 마치 인생의 선배가 조언하듯이요.`,
        owner_id: owner.id,
        top_k: 1,
        language: 'ko',
      })
      setDocentComment(res.data.answer)
    } catch {
      setDocentComment(
        `${owner.display_name}님의 이력은 다양한 영역에서 고루 발전한 모습을 보여줍니다. 특히 가장 높은 점수를 받은 영역에서의 전문성은 앞으로의 커리어에서 큰 자산이 될 것입니다. 꾸준히 성장해 나가시길 응원합니다.`
      )
    } finally {
      setIsDocentLoading(false)
    }
  }

  /* ── Chart.js 데이터 ───────────────────────────── */
  const chartData = useMemo(() => {
    if (!competency) return null

    const labels = competency.map(c => DIMENSION_LABELS[c.key] || c.label)
    const scores = competency.map(c => c.score)

    return {
      labels,
      datasets: [
        {
          label: '역량 지표',
          data: scores,
          backgroundColor: 'rgba(61, 51, 41, 0.15)',
          borderColor: 'rgba(107, 91, 78, 0.8)',
          borderWidth: 2,
          pointBackgroundColor: '#3D3329',
          pointBorderColor: '#FAF8F4',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    }
  }, [competency])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          min: 0,
          ticks: {
            stepSize: 20,
            font: { size: 11, family: 'Inter' },
            color: '#8C8278',
            backdropColor: 'transparent',
          },
          pointLabels: {
            font: { size: 13, family: 'Inter', weight: 600 as const },
            color: '#2C2C2C',
          },
          grid: {
            color: 'rgba(139, 130, 120, 0.15)',
          },
          angleLines: {
            color: 'rgba(139, 130, 120, 0.15)',
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#3D3329',
          titleFont: { size: 13, family: 'Inter' },
          bodyFont: { size: 12, family: 'Inter' },
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: (ctx: any) => `${ctx.label}: ${ctx.raw}점`,
          },
        },
      },
    }),
    []
  )

  /* ── 평균 점수 & 최고 역량 계산 ─────────────────── */
  const avgScore = competency
    ? Math.round(competency.reduce((sum, c) => sum + c.score, 0) / competency.length)
    : 0
  const topDimension = competency
    ? competency.reduce((max, c) => (c.score > max.score ? c : max), competency[0])
    : null

  /* ── 초기화 ─────────────────────────────────────── */
  const resetAll = () => {
    setCompetency(null)
    setDocentComment('')
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
          당신의 역량을 분석하고 있습니다…
        </p>
        <p className="text-sm text-[var(--taupe)]">
          Gemini AI가 이력서를 기반으로 커리어 인사이트를 생성합니다
        </p>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     RENDER: Result State (Radar Chart + Report)
     ═══════════════════════════════════════════════ */
  if (competency && chartData) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 transition-all duration-500">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl font-semibold text-[var(--charcoal)]">
            커리어 인사이트 리포트
          </h1>
          <p className="text-sm text-[var(--taupe)]">
            {owner.display_name}님의 이력서를 기반으로 AI가 분석한 역량 레이더입니다
          </p>
        </div>

        {/* ── Stats Row ──────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="museum-card rounded-2xl p-5 text-center">
            <p className="text-xs text-[var(--taupe)] uppercase tracking-wider mb-1">종합 점수</p>
            <p className="font-display text-3xl font-bold text-[var(--museum)]">{avgScore}</p>
            <p className="text-xs text-[var(--taupe)]">/ 100</p>
          </div>
          {topDimension && (
            <div className="museum-card rounded-2xl p-5 text-center">
              <p className="text-xs text-[var(--taupe)] uppercase tracking-wider mb-1">최고 역량</p>
              <p className="text-lg font-semibold text-[var(--charcoal)]">
                {DIMENSION_EMOJI[topDimension.key] || '🏆'} {DIMENSION_LABELS[topDimension.key] || topDimension.label}
              </p>
              <p className="text-xs text-[var(--umber)] font-medium">{topDimension.score}점</p>
            </div>
          )}
          <div className="museum-card rounded-2xl p-5 text-center col-span-2 sm:col-span-1">
            <p className="text-xs text-[var(--taupe)] uppercase tracking-wider mb-1">분석 항목</p>
            <p className="font-display text-3xl font-bold text-[var(--museum)]">{competency.length}</p>
            <p className="text-xs text-[var(--taupe)]">개 역량 축</p>
          </div>
        </div>

        {/* ── Radar Chart ────────────────────────── */}
        <div className="museum-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-[var(--umber)]" />
            <h2 className="font-display text-xl font-semibold text-[var(--charcoal)]">
              역량 레이더 차트
            </h2>
          </div>
          <div className="max-w-md mx-auto">
            <Radar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* ── Score Breakdown ─────────────────────── */}
        <div className="museum-card rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-semibold text-[var(--charcoal)]">역량 상세 분석</h3>
          {competency.map((c) => (
            <div key={c.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--charcoal)]">
                  {DIMENSION_EMOJI[c.key] || '📊'} {DIMENSION_LABELS[c.key] || c.label}
                </span>
                <span className="font-semibold text-[var(--museum)]">{c.score}점</span>
              </div>
              <div className="w-full h-2.5 bg-[var(--linen)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
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

        {/* ── AI Docent Comment ───────────────────── */}
        <div className="museum-card rounded-2xl p-6 relative overflow-hidden">
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--museum)]/5 rounded-bl-full" />

          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-[var(--umber)]" />
            <h3 className="font-display text-lg font-semibold text-[var(--charcoal)]">
              AI 도슨트의 커리어 코멘트
            </h3>
          </div>

          {isDocentLoading ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="w-5 h-5 text-[var(--taupe)] animate-spin" />
              <span className="text-sm text-[var(--taupe)] animate-pulse">
                도슨트가 당신의 커리어를 돌아보며 코멘트를 작성하고 있습니다…
              </span>
            </div>
          ) : (
            <blockquote className="relative pl-4 border-l-3 border-[var(--umber)]/30">
              <p className="text-sm text-[var(--graphite)] leading-relaxed italic">
                "{docentComment}"
              </p>
              <footer className="mt-3 text-xs text-[var(--taupe)]">
                — Remembery AI 도슨트 · {owner.display_name}님을 위한 분석
              </footer>
            </blockquote>
          )}
        </div>

        {/* ── Action Bar ──────────────────────────── */}
        <div className="flex justify-center pt-2">
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[var(--taupe)]
                       text-sm font-medium text-[var(--graphite)] hover:bg-[var(--linen)] transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            새로운 이력서로 다시 분석
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
          <TrendingUp className="w-8 h-8 text-[var(--umber)]" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-[var(--charcoal)]">
          커리어 인사이트
        </h1>
        <p className="text-[var(--graphite)] text-sm max-w-lg mx-auto leading-relaxed">
          이력서를 붙여넣으면 AI가 당신의 역량을 5가지 축으로 수치화하여 레이더 차트로 시각화하고,
          AI 도슨트가 커리어에 대한 따뜻한 코멘트를 남겨 드립니다.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Textarea Card */}
      <div className="museum-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardPaste className="w-4 h-4 text-[var(--taupe)]" />
          <span className="text-sm font-medium text-[var(--graphite)]">이력서 텍스트 입력</span>
        </div>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 rounded-xl bg-[var(--parchment)] border border-[var(--linen)]
                     text-sm text-[var(--charcoal)] font-mono leading-relaxed resize-none
                     placeholder:text-[var(--taupe)] focus:outline-none focus:ring-2
                     focus:ring-[var(--umber)]/30 transition-all"
          placeholder={`이력서 전문 또는 주요 경력 사항을 붙여넣으세요...\n\n예시:\n2015  서울대학교 컴퓨터공학과 졸업\n2016-2020  삼성전자 소프트웨어 엔지니어, 팀 리딩\n2020  사내 혁신상 수상\n2021-현재  Google DeepMind 시니어 연구원`}
        />

        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--taupe)]">
            {resumeText.length.toLocaleString()} / 30,000자
          </span>

          <button
            onClick={handleAnalyze}
            disabled={!resumeText.trim() || resumeText.trim().length < 10}
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl
                       bg-[var(--museum)] text-[var(--ivory)] text-sm font-medium
                       hover:bg-[var(--charcoal)] transition-all active:scale-[0.98]
                       disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            역량 분석 시작
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="museum-card rounded-2xl p-5">
        <h3 className="font-display text-base font-semibold text-[var(--charcoal)] mb-3">
          분석되는 5가지 역량 축
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
            <div
              key={key}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--parchment)]"
            >
              <span className="text-base">{DIMENSION_EMOJI[key]}</span>
              <span className="text-xs font-medium text-[var(--graphite)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
