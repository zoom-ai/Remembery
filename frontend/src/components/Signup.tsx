import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

const Signup: React.FC = () => {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Clientside password verification
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsSubmitting(true)

    try {
      await signup(email, password, name)
      navigate('/') // Redirect to main dashboard
    } catch (err: any) {
      console.error(err)
      const status = err.response?.status
      if (status === 409) {
        setError('이미 등록된 이메일 주소입니다.')
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('회원가입 처리 중 오류가 발생했습니다. 다시 시도해 주세요.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--parchment)] p-4">
      {/* Background elegant accents */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-[var(--linen)] rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[var(--taupe)]/10 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Header/Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-[var(--museum)] items-center justify-center mb-4 shadow-md">
            <span className="font-display text-xl font-semibold text-[var(--ivory)]">R</span>
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-[var(--museum)] italic mb-1">
            Remembery
          </h1>
          <p className="text-xs text-[var(--taupe)] tracking-widest uppercase font-medium">
            The Eternal Digital Library
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-[var(--ivory)] border border-[var(--linen)] rounded-3xl p-8 sm:p-10 shadow-xl transition-all duration-300">
          <h2 className="font-display text-2xl font-semibold text-[var(--charcoal)] mb-6 text-center">
            새로운 박물관 개관하기
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-[var(--graphite)] uppercase tracking-wider mb-2">
                이름 / 호칭
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--taupe)]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="museum-input w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all focus:border-[var(--umber)] focus:ring-1 focus:ring-[var(--umber)]"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[var(--graphite)] uppercase tracking-wider mb-2">
                이메일 주소
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--taupe)]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@remembery.com"
                  className="museum-input w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all focus:border-[var(--umber)] focus:ring-1 focus:ring-[var(--umber)]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[var(--graphite)] uppercase tracking-wider mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--taupe)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상 입력"
                  className="museum-input w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all focus:border-[var(--umber)] focus:ring-1 focus:ring-[var(--umber)]"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[var(--graphite)] uppercase tracking-wider mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--taupe)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="museum-input w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all focus:border-[var(--umber)] focus:ring-1 focus:ring-[var(--umber)]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[var(--museum)] hover:bg-[var(--umber)] text-[var(--ivory)] font-medium rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-75 disabled:pointer-events-none cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>개관 준비 중...</span>
                </>
              ) : (
                <>
                  <span>가입 및 개관하기</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Warm Divider */}
          <div className="my-8 flex items-center justify-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--linen)] to-transparent" />
          </div>

          {/* Link to Login */}
          <p className="text-center text-xs text-[var(--graphite)]">
            이미 박물관의 회원이신가요?{' '}
            <Link
              to="/login"
              className="text-[var(--umber)] hover:text-[var(--museum)] font-semibold transition-colors underline decoration-dotted"
            >
              기존 박물관으로 입장하기
            </Link>
          </p>
        </div>

        {/* Footer text */}
        <p className="text-center text-[10px] text-[var(--taupe)] tracking-widest uppercase mt-8 pointer-events-none">
          Preserving Legacy, One Piece at a Time.
        </p>

      </div>
    </div>
  )
}

export default Signup
