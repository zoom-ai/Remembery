/**
 * Remembery — App Shell
 * Tab-based navigation between Dashboard, Archive, and Exhibition.
 */
import { useState, useEffect } from 'react'
import { Home, Archive, Landmark, Heart, Loader2 } from 'lucide-react'
import { userAPI, type User } from './services/api'

import MainDashboard from './components/MainDashboard'
import ArchiveGrid from './components/ArchiveGrid'
import ExhibitionHall from './components/ExhibitionHall'
import Onboarding from './components/Onboarding'

type Tab = 'dashboard' | 'archive' | 'exhibition'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard',  label: '대시보드',   icon: Home },
  { key: 'archive',    label: '보관함',     icon: Archive },
  { key: 'exhibition', label: '전시관',     icon: Landmark },
]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [owner, setOwner] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const fetchOwner = async () => {
    try {
      const data = await userAPI.getOwner()
      setOwner(data)
    } catch {
      setOwner(null)
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    fetchOwner()
  }, [])

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--parchment)]">
        <Loader2 className="w-8 h-8 text-[var(--museum)] animate-spin" />
      </div>
    )
  }

  if (!owner) {
    return <Onboarding onComplete={fetchOwner} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--parchment)]">

      {/* ═══════ Header ═══════ */}
      <header className="sticky top-0 z-50 bg-[var(--ivory)]/80 backdrop-blur-lg border-b border-[var(--linen)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
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

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95
                    ${isActive
                      ? 'bg-[var(--museum)] text-[var(--ivory)] shadow-sm'
                      : 'text-[var(--graphite)] hover:bg-[var(--linen)] hover:text-[var(--charcoal)]'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* ═══════ Main Content ═══════ */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {activeTab === 'dashboard' && <MainDashboard owner={owner} />}
        {activeTab === 'archive' && <ArchiveGrid />}
        {activeTab === 'exhibition' && <ExhibitionHall />}
      </main>

      {/* ═══════ Footer ═══════ */}
      <footer className="border-t border-[var(--linen)] py-8 bg-[var(--ivory)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--taupe)]">
          <p>Built with React · FastAPI · Tailwind CSS · SQLAlchemy</p>
          <p className="flex items-center gap-1">
            Remembery
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
