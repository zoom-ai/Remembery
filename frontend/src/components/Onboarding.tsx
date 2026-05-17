import { useState } from 'react'
import { userAPI, type OnboardingRequest } from '../services/api'
import { Sparkles, Loader2, ArrowRight } from 'lucide-react'

interface Props {
  onComplete: () => void
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    display_name: '',
    subtitle: '',
    title: '',
    bio: '',
    timelineYear: '',
    timelineEvent: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep(prev => prev + 1)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const payload: OnboardingRequest = {
        display_name: formData.display_name.trim(),
        subtitle: formData.subtitle.trim() || undefined,
        title: formData.title.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        timeline_json: formData.timelineYear && formData.timelineEvent 
          ? [{ year: formData.timelineYear.trim(), event: formData.timelineEvent.trim(), icon: '🌱' }]
          : []
      }
      await userAPI.onboard(payload)
      onComplete()
    } catch (err: any) {
      setError(err.response?.data?.detail || '온보딩에 실패했습니다. 다시 시도해 주세요.')
      setIsLoading(false)
    }
  }

  const fieldClass = "w-full px-4 py-3 rounded-xl bg-white/50 border border-[var(--linen)] text-[var(--charcoal)] placeholder-[var(--taupe)] focus:outline-none focus:border-[var(--umber)] focus:ring-1 focus:ring-[var(--umber)] transition-all"
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[var(--taupe)] mb-2"

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--parchment)] p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--linen)] blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--linen)] blur-3xl opacity-50" />

      <div className="w-full max-w-xl animate-fade-up relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--museum)] text-[var(--ivory)] mb-6 shadow-xl">
            <span className="font-display text-2xl font-semibold">R</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--charcoal)] tracking-tight mb-3">
            기억의 도서관에 오신 것을 환영합니다
          </h1>
          <p className="text-[var(--taupe)] text-sm sm:text-base max-w-md mx-auto">
            이곳은 당신의 삶, 혹은 당신이 기억하고 싶은 누군가의 삶을 영원히 보존하는 공간입니다.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="museum-card rounded-3xl p-8 sm:p-10 shadow-2xl bg-[var(--ivory)] border border-[var(--linen)]">
          
          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors duration-500 ${step >= i ? 'bg-[var(--umber)]' : 'bg-[var(--linen)]'}`} />
            ))}
          </div>

          <div className="min-h-[220px]">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-[var(--charcoal)]">주인공의 이름을 알려주세요</h2>
                  <p className="text-sm text-[var(--taupe)] mt-1">이 기록의 중심이 될 분의 성함입니다.</p>
                </div>
                <div>
                  <label className={labelClass}>이름 <span className="text-rose-400">*</span></label>
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleChange}
                    placeholder="예: 김영호" required autoFocus className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>생애 (또는 생년월일)</label>
                  <input type="text" name="subtitle" value={formData.subtitle} onChange={handleChange}
                    placeholder="예: 1942 - 2024" className={fieldClass} />
                </div>
              </div>
            )}

            {/* Step 2: Persona */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-[var(--charcoal)]">어떤 분으로 기억되길 원하시나요?</h2>
                  <p className="text-sm text-[var(--taupe)] mt-1">이 도서관의 메인 타이틀과 소개글로 사용됩니다.</p>
                </div>
                <div>
                  <label className={labelClass}>호칭 (타이틀)</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange}
                    placeholder="예: 교육자, 시인, 그리고 아버지" autoFocus className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>짧은 소개</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange}
                    placeholder="평생을 교단에서 학생들과 함께한 교육자..." rows={3} className={`${fieldClass} resize-none`} />
                </div>
              </div>
            )}

            {/* Step 3: First Event */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-[var(--charcoal)]">첫 번째 기록을 남겨보세요</h2>
                  <p className="text-sm text-[var(--taupe)] mt-1">타임라인의 시작점이 될 중요한 순간을 적어주세요.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className={labelClass}>연도</label>
                    <input type="text" name="timelineYear" value={formData.timelineYear} onChange={handleChange}
                      placeholder="예: 1942" autoFocus className={fieldClass} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>사건</label>
                    <input type="text" name="timelineEvent" value={formData.timelineEvent} onChange={handleChange}
                      placeholder="예: 경상북도 안동에서 출생" className={fieldClass} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 text-xs text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>
          )}

          {/* Navigation Actions */}
          <div className="mt-8 flex gap-3 pt-6 border-t border-[var(--linen)]">
            {step > 1 && (
              <button type="button" onClick={() => setStep(prev => prev - 1)}
                className="px-6 py-3.5 rounded-xl border border-[var(--linen)] text-[var(--graphite)] text-sm font-medium hover:bg-[var(--linen)] transition">
                이전
              </button>
            )}
            <button type="submit" disabled={isLoading || (step === 1 && !formData.display_name.trim())}
              className="flex-1 py-3.5 rounded-xl bg-[var(--museum)] text-[var(--ivory)] text-sm font-medium hover:bg-[var(--umber)] disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2 ml-auto">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step < 3 ? (
                <>다음 <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>시작하기 <Sparkles className="w-4 h-4" /></>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
