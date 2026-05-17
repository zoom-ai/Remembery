import { useState, useEffect } from 'react'
import {
  Sparkles,
  Plus,
  Trash2,
  Tag,
  Calendar,
  Folder,
  Search,
  Loader2,
  AlertCircle,
  Database,
  Heart,
  X
} from 'lucide-react'

// Define interfaces
interface Memory {
  id: number
  title: string
  content: string
  tags: string
  category: string
  date: string
  created_at: string
}

interface NewMemory {
  title: string
  content: string
  tags: string
  category: string
  date: string
}

const CATEGORIES = ['All', 'Personal', 'Work', 'Idea', 'Travel', 'General']
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Personal: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  Work: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Idea: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Travel: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  General: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
}

function App() {
  // State variables
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  
  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMemory, setNewMemory] = useState<NewMemory>({
    title: '',
    content: '',
    tags: '',
    category: 'General',
    date: new Date().toISOString().split('T')[0], // Default to today
  })

  const BACKEND_URL = 'http://localhost:8000/api'

  // Fetch all memories from the backend
  const fetchMemories = async () => {
    setIsLoading(true)
    setApiError(null)
    try {
      const response = await fetch(`${BACKEND_URL}/memories/`)
      if (!response.ok) {
        throw new Error('Failed to load memories from backend.')
      }
      const data = await response.json()
      setMemories(data)
    } catch (err: any) {
      console.error(err)
      setApiError('Could not connect to the backend server. Please verify FastAPI is running at http://localhost:8000')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [])

  // Create a new memory
  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemory.title.trim() || !newMemory.content.trim()) return

    setIsSubmitting(true)
    setApiError(null)
    try {
      // Ensure correct ISO timestamp format if date provided
      const dateToSend = newMemory.date ? new Date(newMemory.date).toISOString() : new Date().toISOString()
      
      const response = await fetch(`${BACKEND_URL}/memories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMemory.title.trim(),
          content: newMemory.content.trim(),
          tags: newMemory.tags.trim(),
          category: newMemory.category,
          date: dateToSend
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save memory.')
      }

      const created = await response.json()
      setMemories([created, ...memories])
      
      // Reset form
      setNewMemory({
        title: '',
        content: '',
        tags: '',
        category: 'General',
        date: new Date().toISOString().split('T')[0],
      })
      setShowAddForm(false)
    } catch (err: any) {
      setApiError('Failed to create memory. Please check if backend is online.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete a memory
  const handleDeleteMemory = async (id: number) => {
    setApiError(null)
    try {
      const response = await fetch(`${BACKEND_URL}/memories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete memory.')
      }

      setMemories(memories.filter((m) => m.id !== id))
    } catch (err: any) {
      setApiError('Failed to delete memory. Please check if backend is online.')
    }
  }

  // Client side search and category filter
  const filteredMemories = memories.filter((memory) => {
    const matchesCategory = selectedCategory === 'All' || memory.category === selectedCategory
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      memory.title.toLowerCase().includes(searchLower) ||
      memory.content.toLowerCase().includes(searchLower) ||
      memory.tags.toLowerCase().includes(searchLower) ||
      memory.category.toLowerCase().includes(searchLower)
    return matchesCategory && matchesSearch
  })

  // Format Date utility
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (e) {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col antialiased">
      {/* Dynamic Ambient Background Blur */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                Remembery
              </span>
              <span className="block text-xs text-slate-400 font-medium">Digital Memory Box</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/30 text-xs font-semibold text-indigo-400">
              <Database className="w-3.5 h-3.5 mr-1.5" />
              {memories.length} Memories
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-sm font-medium rounded-xl text-white shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Memory</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Space */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* API Error Warning */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 shadow-lg">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Backend Connection Issue</p>
              <p className="mt-1 opacity-90">{apiError}</p>
              <button 
                onClick={fetchMemories} 
                className="mt-2.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-semibold transition"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Create Memory Form (Slide Down Card) */}
        {showAddForm && (
          <div className="mb-8 p-6 rounded-2xl glass-panel border border-indigo-500/20 shadow-2xl relative overflow-hidden transition-all duration-300 animate-fadeIn">
            {/* Ambient indicator */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Plus className="w-5 h-5 mr-2 text-indigo-400" />
                Capture a New Memory
              </h2>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Memory Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Finished the FastAPI boilerplate!"
                    value={newMemory.title}
                    onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition text-sm text-slate-100 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
                  <select
                    value={newMemory.category}
                    onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition text-sm text-slate-100"
                  >
                    <option value="General">General</option>
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                    <option value="Idea">Idea</option>
                    <option value="Travel">Travel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Memory Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell the details of this wonderful memory..."
                  value={newMemory.content}
                  onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition text-sm text-slate-100 placeholder-slate-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tags (Comma-separated)</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="E.g., fastpi, backend, boilerplate"
                      value={newMemory.tags}
                      onChange={(e) => setNewMemory({ ...newMemory, tags: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition text-sm text-slate-100 placeholder-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Date Associated</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="date"
                      value={newMemory.date}
                      onChange={(e) => setNewMemory({ ...newMemory, date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition text-sm text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50 transition text-sm font-semibold rounded-xl text-white shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save Memory</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Category Filter Panel */}
        <div className="mb-8 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-950/20 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition text-sm text-slate-200 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Loading and empty states */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-sm font-medium">Fetching memories from DB...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/10">
            <Folder className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-300">No Memories Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {memories.length === 0
                ? 'Your digital memory box is currently empty. Start capturing moments of your life!'
                : 'No memories match your search filter criteria. Try expanding your search terms.'}
            </p>
            {memories.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-5 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-xl transition"
              >
                Capture First Memory
              </button>
            )}
          </div>
        ) : (
          /* Grid list of memories */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemories.map((memory) => {
              const colors = CATEGORY_COLORS[memory.category] || CATEGORY_COLORS['General']
              return (
                <article
                  key={memory.id}
                  className="rounded-2xl glass-panel glass-panel-hover overflow-hidden flex flex-col h-full shadow-lg relative group"
                >
                  {/* Category Border Glow */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Header: Category Badge and Date */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {memory.category}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(memory.date)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-2.5">
                      {memory.title}
                    </h3>

                    {/* Content Snippet */}
                    <p className="text-xs text-slate-400 leading-relaxed flex-1 whitespace-pre-line mb-4">
                      {memory.content}
                    </p>

                    {/* Tags List */}
                    {memory.tags && (
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-slate-800/40">
                        {memory.tags.split(',').map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center text-[10px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions overlay / bottom bar */}
                  <div className="px-5 py-2.5 bg-slate-950/30 border-t border-slate-900 flex justify-end">
                    <button
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 py-8 bg-[#04060b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 flex items-center justify-center">
            Built with React, FastAPI, Tailwind CSS, & SQLAlchemy
          </p>
          <p className="text-xs text-slate-500 mt-2 sm:mt-0 flex items-center justify-center">
            Remembery Memory Box <Heart className="w-3.5 h-3.5 mx-1 text-rose-500 fill-rose-500 animate-pulse" /> © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
