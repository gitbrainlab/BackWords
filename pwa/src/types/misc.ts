// Auto-mirrored from packages/shared-schema/SearchHistoryItem.schema.json
import type { SearchMode } from './interpretation'

export interface SearchHistoryItem {
  query: string           // Original query as typed
  normalizedQuery: string
  mode: SearchMode
  timestamp: number       // Date.now() ms
  pinned?: boolean
}

// Knowledge page data shape (data/pages/*.json)
export interface KnowledgePageData {
  pageId: string
  title: string
  slug: string
  summary: string
  route: string
  tags: string[]
  content: string    // Markdown
}

// Passage file shape (data/passages/*.json)
export interface PassageFile {
  passageId: string
  title: string
  sourceNote: string
  originalText: string
  modernParaphrase?: string
  highlights: Array<{
    highlightId: string
    start: number
    end: number
    text: string
    conceptId: string
    label: string
    confidence: number
  }>
}

// API error shape
export interface ApiError {
  detail: string
}

// POST /interpret request
export interface InterpretRequest {
  query: string
  mode?: string
  requestedDate?: string
  useMock?: boolean
}

// POST /explain-source request
export interface ExplainSourceRequest {
  sourceId: string
  sourceTitle: string
  sourceDate?: string
  quote?: string
  word: string
  context?: string
  useMock?: boolean
}

// POST /explain-source response
export interface ExplainSourceResponse {
  sourceId: string
  explanation: string
}
