/**
 * Remembery — API Service Layer
 * Centralised Axios instance and typed API calls for all backend endpoints.
 */
import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

/* ────────────── Types ────────────── */

export interface User {
  id: number
  email: string
  display_name: string
  role: string
  subtitle: string | null
  title: string | null
  bio: string | null
  birth_date: string | null
  death_date: string | null
  birth_place: string | null
  resting_place: string | null
  motto: string | null
  timeline_json: any[] | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface OnboardingRequest {
  display_name: string
  title?: string
  bio?: string
  birth_date?: string
  death_date?: string
  birth_place?: string
  resting_place?: string
  motto?: string
  timeline_json?: any[]
}

export interface UserProfileUpdate {
  display_name?: string
  title?: string
  bio?: string
  birth_date?: string
  death_date?: string
  birth_place?: string
  resting_place?: string
  motto?: string
}

export interface TimelineEvent {
  year: string
  event: string
  icon?: string
}

export interface Category {
  id: number
  user_id: number | null
  name: string
  description: string | null
  icon: string | null
  color: string | null
  is_default: boolean
  created_at: string
}

export interface ArchiveItem {
  id: number
  owner_id: number
  category_id: number | null
  category_name: string | null
  title: string
  description: string | null
  item_type: string | null
  file_url: string | null
  thumbnail_url: string | null
  tags: string
  metadata_json: string | null
  original_date: string | null
  source: string | null
  is_public: boolean
  ai_summary: string | null
  highlight_quote: string | null
  preview_url: string | null
  created_at: string
  updated_at: string
}

export interface ArchiveListResponse {
  items: ArchiveItem[]
  total: number
  skip: number
  limit: number
  filters_applied: Record<string, unknown>
}

export interface RAGContextChunk {
  archive_item_id: number
  title: string
  snippet: string
  relevance_score: number
}

export interface RAGQueryResponse {
  answer: string
  context_used: RAGContextChunk[]
  model: string
  confidence: number
  disclaimer: string
}

export interface CuratedItemSummary {
  archive_item_id: number
  title: string
  item_type: string
  ai_curator_note: string
  display_order: number
  relevance_score: number
}

export interface CurationResponse {
  exhibition_title: string
  exhibition_subtitle: string
  exhibition_description: string
  theme_color: string
  layout_style: string
  curated_items: CuratedItemSummary[]
  total_items_reviewed: number
  model: string
  message: string
}

/* ────────────── Category API ────────────── */

export const categoryAPI = {
  list: (user_id?: number) =>
    API.get<Category[]>('/categories/', { params: user_id ? { user_id } : {} }),

  create: (data: {
    name: string
    description?: string
    icon?: string
    color?: string
    user_id?: number
  }) => API.post<Category>('/categories/', data),

  update: (id: number, data: {
    name?: string
    description?: string
    icon?: string
    color?: string
  }) => API.patch<Category>(`/categories/${id}`, data),

  delete: (id: number) => API.delete(`/categories/${id}`),

  seed: () => API.post<Category[]>('/categories/seed'),
}

/* ────────────── Archive API ────────────── */

export const archiveAPI = {
  list: (params?: {
    q?: string
    item_type?: string
    category_id?: number
    owner_id?: number
    skip?: number
    limit?: number
  }) => API.get<ArchiveListResponse>('/archive/list', { params }),

  upload: (data: {
    owner_id: number
    title: string
    description?: string
    category_id?: number
    item_type?: string
    tags?: string
    source?: string
    auto_index?: boolean
    file?: File
  }) => {
    const formData = new FormData()
    formData.append('owner_id', String(data.owner_id))
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.category_id) formData.append('category_id', String(data.category_id))
    if (data.item_type) formData.append('item_type', data.item_type)
    if (data.tags) formData.append('tags', data.tags)
    if (data.source) formData.append('source', data.source)
    if (data.auto_index) formData.append('auto_index', String(data.auto_index))
    if (data.file) formData.append('file', data.file)

    return API.post('/archive/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  getOne: (id: number) => API.get<ArchiveItem>(`/archive/${id}`),
}

export const userAPI = {
  getOwner: async () => {
    const res = await API.get<User>('/users/owner')
    return res.data
  },
  onboard: async (data: OnboardingRequest) => {
    const res = await API.post<User>('/users/onboard', data)
    return res.data
  },
  addTimelineEvent: async (data: TimelineEvent) => {
    const res = await API.post<User>('/users/timeline', data)
    return res.data
  },
  updateOwner: async (data: UserProfileUpdate) => {
    const res = await API.patch<User>('/users/owner', data)
    return res.data
  },
  uploadAvatar: async (formData: FormData) => {
    const res = await API.post<User>('/users/owner/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }
}

/* ────────────── AI RAG API ────────────── */

export const aiAPI = {
  query: (data: {
    question: string
    owner_id?: number
    top_k?: number
    language?: string
  }) => API.post<RAGQueryResponse>('/ai/query', data),
}

/* ────────────── Exhibition API ────────────── */

export const exhibitionAPI = {
  curate: (data: {
    curator_id: number
    theme: string
    description?: string
    max_items?: number
    language?: string
    theme_color?: string
    layout_style?: string
  }) => API.post<CurationResponse>('/exhibition/curate', data),
}

export default API
