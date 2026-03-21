// Auto-mirrored from packages/shared-schema/InterpretationResult.schema.json
// This is the single source of truth for request/response shapes throughout the PWA.
import type { TimelineEvent } from './timeline'

export type Register = 'formal' | 'informal' | 'neutral' | 'technical' | 'vulgar' | 'archaic'
export type Sentiment = 'positive' | 'negative' | 'neutral'
export type SentimentShift =
  | 'positive-to-negative'
  | 'negative-to-positive'
  | 'neutral-to-negative'
  | 'neutral-to-positive'
  | 'positive-to-neutral'
  | 'negative-to-neutral'
  | 'stable'
  | 'complex'
export type DriftType =
  | 'pejoration'
  | 'amelioration'
  | 'narrowing'
  | 'broadening'
  | 'semantic-shift'
  | 'stable'
  | 'reclamation'
export type SourceType = 'dictionary' | 'literary' | 'academic' | 'historical' | 'newspaper' | 'other'
export type WorkType = 'novel' | 'poetry' | 'play' | 'essay' | 'dictionary' | 'journal' | 'film' | 'song' | 'other'
export type SearchMode = 'word' | 'phrase' | 'paragraph'

export interface SnapshotInterpretation {
  snapshotId: string
  date: string        // ISO8601 date
  eraLabel: string
  definition: string
  usageNote?: string
  exampleUsage?: string
  register: Register
  sentiment: Sentiment
  confidence: number  // 0–1
  sourceIds: string[]
}

export interface SummaryOfChange {
  shortSummary: string
  longSummary: string
  sentimentShift: SentimentShift
  driftType: DriftType
  driftMagnitude: number  // 0–1
}

export interface KeyDate {
  date: string       // ISO8601
  label: string
  significance: string
}

export interface SourceCitation {
  sourceId: string
  title: string
  author: string | null
  publisher: string | null
  publishedDate: string | null
  sourceType: SourceType
  attribution: string
  excerpt: string
  relevanceNote: string
  confidence: number  // 0–1
}

export interface RelatedWork {
  workId: string
  title: string
  creator: string | null
  year: number | null
  workType: WorkType
  whyRelevant: string
  publicDomainHint: boolean
  links: Array<{ label: string; url: string }>
}

export interface RelatedPage {
  pageId: string
  title: string
  slug: string
  summary: string
  route: string
  tags: string[]
}

export interface RelatedConcept {
  conceptId: string
  label: string
  relationship: string
  note: string | null
}

export interface PassageHighlight {
  highlightId: string
  start: number     // 0-based inclusive char offset
  end: number       // 0-based exclusive char offset
  text: string      // originalText[start:end]
  conceptId: string
  label: string
  confidence: number  // 0–1
}

export interface Passage {
  originalText: string
  modernParaphrase: string | null
  highlights: PassageHighlight[]
}

export interface InterpretationResult {
  lexemeId: string
  query: string
  normalizedQuery: string
  mode?: SearchMode
  requestedDate?: string | null
  resolvedEraLabel?: string | null
  currentSnapshot: SnapshotInterpretation
  selectedSnapshot?: SnapshotInterpretation | null
  historicalSnapshots: SnapshotInterpretation[]
  summaryOfChange?: SummaryOfChange
  keyDates?: KeyDate[]
  sources?: SourceCitation[]
  relatedWorks?: RelatedWork[]
  relatedPages?: RelatedPage[]
  relatedConcepts?: RelatedConcept[]
  ambiguityNotes?: string[]
  passage?: Passage | null
  generatedAt?: string    // ISO8601 datetime
  modelVersion?: string
  timelineEvents?: TimelineEvent[]
}

// Seed file extends InterpretationResult with extra fields used only by the backend
export interface SeedEntry extends InterpretationResult {
  supportedModes: SearchMode[]
}
