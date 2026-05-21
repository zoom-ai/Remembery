/**
 * Remembery — App Shell
 * Tab-based navigation between Dashboard, Archive, and Exhibition with Authentication.
 */
import { useState } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { Home, Archive, Landmark, Heart, Loader2, History, FileText, TrendingUp, LogOut } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { type User } from './services/api'

import Login from './components/Login'
import Signup from './components/Signup'
import MainDashboard from './components/MainDashboard'
import ArchiveGrid from './components/ArchiveGrid'
import ExhibitionHall from './components/ExhibitionHall'
import Onboarding from './components/Onboarding'
import TimelineFlow from './components/TimelineFlow'
import ResumeImporter from './components/ResumeImporter'
import CareerInsight from './components/CareerInsight'

type Tab = 'dashboard' | 'archive' | 'timeline' | 'resume' | 'insight' | 'exhibition'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard',  label: '대시보드',   icon: Home },
  { key: 'archive',    label: '보관함',     icon: Archive },
  { key: 'timeline',   label: '타임라인',   icon: History },
  { key: 'resume',     label: '이력서',     icon: FileText },
  { key: 'insight',    label: '인사이트',   icon: TrendingUp },
  { key: 'exhibition', label: '전시관',     icon: Landmark },
]

interface ProtectedLayoutProps {
  user: User
  logout: () => void
  refreshUser: () => Promise<void>
}

const ProtectedAppLayout: React.FC<ProtectedLayoutProps> = ({ user, logout, refreshUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  // Check if user is fully onboarded (display_name shouldn't be default/empty)
  // Our backend signup assigns a default role and safe settings, but they can still onboard if they wish.
  // We check if the user has completed at least the name onboarding, otherwise we render onboarding.
  if (!user.display_name) {
    return <Onboarding onComplete={refreshUser} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--parchment)]">

      {/* ═══════ Header ═══════ */}
      <header className="sticky top-0 z-50 bg-[var(--ivory)]/90 backdrop-blur-lg border-b border-[var(--linen)] shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--museum)] flex items-center justify-center">
              <span className="font-display text-base font-semibold text-[var(--ivory)]">R</span>
            </div>
            <div>
              <span className="font-display text-lg font-semibold tracking-tight text-[var(--charcoal)]">
                Remembery
              </span>
              <span className="hidden sm:block text-[10px] text-[var(--taupe)] tracking-wider uppercase -mt-0.5">
                The Eternal Digital Library
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 shrink-0">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer
                      ${isActive
                        ? 'bg-[var(--museum)] text-[var(--ivory)] shadow-sm'
                        : 'text-[var(--graphite)] hover:bg-[var(--linen)] hover:text-[var(--charcoal)]'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Profile Avatar and Logout */}
            <div className="flex items-center gap-3 border-l border-[var(--linen)] pl-4 shrink-0">
              <div className="flex items-center gap-2">
                {user.avatar_url ? (
                  <img
                    src={`http://localhost:8000${user.avatar_url}`}
                    alt={user.display_name}
                    className="w-8 h-8 rounded-lg object-cover border border-[var(--linen)] shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[var(--linen)] flex items-center justify-center font-display text-xs font-semibold text-[var(--taupe)] border border-[var(--linen)]">
                    {user.display_name.slice(-2)}
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-semibold text-[var(--graphite)]">
                  {user.display_name}님
                </span>
              </div>
              <button
                onClick={logout}
                title="로그아웃"
                className="p-2 rounded-xl hover:bg-rose-50 text-[var(--taupe)] hover:text-rose-500 border border-transparent hover:border-rose-100 transition-all active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ═══════ Main Content ═══════ */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {activeTab === 'dashboard' && <MainDashboard owner={user} onTimelineUpdate={refreshUser} />}
        {activeTab === 'archive' && <ArchiveGrid />}
        {activeTab === 'timeline' && <TimelineFlow owner={user} />}
        {activeTab === 'resume' && (
          <ResumeImporter
            onImported={async () => {
              await refreshUser()
              setActiveTab('dashboard')
            }}
          />
        )}
        {activeTab === 'insight' && <CareerInsight owner={user} />}
        {activeTab === 'exhibition' && <ExhibitionHall />}
      </main>

      {/* ═══════ Footer ═══════ */}
      <footer className="border-t border-[var(--linen)] py-8 bg-[var(--ivory)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--taupe)]">
          <p>Built with React · FastAPI · Tailwind CSS · SQLAlchemy</p>
          <p className="flex items-center gap-1 font-medium">
            Remembery
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400 animate-pulse" />
            © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  const { user, loading, logout, refreshUser } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--parchment)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--museum)] animate-spin" />
          <p className="text-xs text-[var(--taupe)] tracking-widest uppercase font-medium">기억 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route
        path="/*"
        element={
          user ? (
            <ProtectedAppLayout user={user} logout={logout} refreshUser={refreshUser} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}

export default App
