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

export interface ArchiveItem {
  id: number
  owner_id: number
  title: string
  description: string | null
  item_type: string
  file_url: string | null
  thumbnail_url: string | null
  tags: string
  metadata_json: string | null
  original_date: string | null
  source: string | null
  is_public: boolean
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
  curated_items: CuratedItemSummary[]
  total_items_reviewed: number
  model: string
  message: string
}

/* ────────────── Archive API ────────────── */

export const archiveAPI = {
  list: (params?: {
    q?: string
    item_type?: string
    owner_id?: number
    skip?: number
    limit?: number
  }) => API.get<ArchiveListResponse>('/archive/list', { params }),

  upload: (data: {
    owner_id: number
    title: string
    description?: string
    item_type?: string
    tags?: string
    file_url?: string
    source?: string
    auto_index?: boolean
  }) => API.post('/archive/upload', data),

  getOne: (id: number) => API.get<ArchiveItem>(`/archive/${id}`),
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
  }) => API.post<CurationResponse>('/exhibition/curate', data),
}

export default API
