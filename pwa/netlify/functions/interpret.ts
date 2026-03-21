import type { Config } from '@netlify/functions'
import {
  getSeedByQuery,
  normaliseQuery,
} from './_shared/seed-loader.js'
import { chatComplete, extractJson, INTERPRET_MODEL } from './_shared/xai-client.js'
import { jsonResponse, errorResponse, optionsResponse } from './_shared/response.js'

interface InterpretRequest {
  query: string
  mode?: string
  requestedDate?: string
  useMock?: boolean
  model?: string
}

const DRIFT_TYPE_MAP: Record<string, string> = {
  pejoration: 'pejoration',
  amelioration: 'amelioration',
  narrowing: 'narrowing',
  broadening: 'broadening',
  'semantic-shift': 'semantic-shift',
  'semantic shift': 'semantic-shift',
  'semantic_shift': 'semantic-shift',
  stable: 'stable',
  reclamation: 'reclamation',
}

const DRIFT_MAGNITUDE_MAP: Record<string, number> = {
  minimal: 0.1,
  slight: 0.2,
  low: 0.25,
  minor: 0.3,
  moderate: 0.5,
  significant: 0.65,
  substantial: 0.7,
  high: 0.75,
  major: 0.8,
  extreme: 0.9,
  complete: 0.95,
}

const VALID_REGISTERS = new Set(['formal', 'informal', 'neutral', 'technical', 'vulgar', 'archaic'])
const VALID_SENTIMENTS = new Set(['positive', 'negative', 'neutral'])
const VALID_SENTIMENT_SHIFTS = new Set([
  'positive-to-negative', 'negative-to-positive', 'neutral-to-negative',
  'neutral-to-positive', 'positive-to-neutral', 'negative-to-neutral', 'stable', 'complex',
])
const VALID_SOURCE_TYPES = new Set(['dictionary', 'literary', 'academic', 'historical', 'newspaper', 'other'])

function normalizeDriftMagnitude(raw: unknown): number {
  if (typeof raw === 'number' && raw >= 0 && raw <= 1) return raw
  if (typeof raw === 'number') return Math.min(Math.max(raw / 10, 0), 1)
  if (typeof raw === 'string') {
    const asFloat = parseFloat(raw)
    if (!isNaN(asFloat)) return asFloat >= 0 && asFloat <= 1 ? asFloat : Math.min(Math.max(asFloat / 10, 0), 1)
    const key = raw.toLowerCase().trim()
    return DRIFT_MAGNITUDE_MAP[key] ?? 0.5
  }
  return 0.5
}

function normalizeDriftType(raw: unknown): string {
  if (typeof raw !== 'string') return 'semantic-shift'
  const lower = raw.toLowerCase().trim()
  if (DRIFT_TYPE_MAP[lower]) return DRIFT_TYPE_MAP[lower]
  for (const [key, val] of Object.entries(DRIFT_TYPE_MAP)) {
    if (lower.includes(key)) return val
  }
  return 'semantic-shift'
}

function yearToDate(year: unknown): string {
  if (typeof year === 'number') return `${String(Math.abs(year)).padStart(4, '0')}-01-01`
  if (typeof year === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(year)) return year
    const n = parseInt(year, 10)
    if (!isNaN(n)) return `${String(Math.abs(n)).padStart(4, '0')}-01-01`
  }
  return '2024-01-01'
}

function eraLabelFromDate(date: string): string {
  const year = parseInt(date.slice(0, 4), 10)
  if (year <= 500) return 'Ancient'
  if (year <= 1100) return 'Old English'
  if (year <= 1500) return 'Middle English'
  if (year <= 1700) return 'Early Modern English'
  if (year <= 1900) return 'Modern English'
  if (year <= 1999) return '20th Century'
  return 'Contemporary'
}

let _snapshotCounter = 0
function normalizeSnapshot(raw: Record<string, unknown>, prefix: string): Record<string, unknown> {
  _snapshotCounter++
  const year = raw.year ?? raw.date ?? raw.period
  const date = raw.date && typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw.date)
    ? raw.date
    : yearToDate(year)

  return {
    snapshotId: raw.snapshotId ?? raw.id ?? `${prefix}-snap-${_snapshotCounter}`,
    date,
    eraLabel: raw.eraLabel ?? raw.era ?? raw.period_label ?? eraLabelFromDate(date),
    definition: raw.definition ?? raw.description ?? raw.meaning ?? raw.sense ?? '',
    usageNote: raw.usageNote ?? raw.usage_note ?? raw.note ?? undefined,
    exampleUsage: raw.exampleUsage ?? raw.example ?? raw.example_usage ?? undefined,
    register: VALID_REGISTERS.has(String(raw.register)) ? raw.register : 'neutral',
    sentiment: VALID_SENTIMENTS.has(String(raw.sentiment)) ? raw.sentiment : 'neutral',
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.8,
    sourceIds: Array.isArray(raw.sourceIds) ? raw.sourceIds : [],
  }
}

let _keyDateCounter = 0
function normalizeKeyDate(raw: Record<string, unknown>): Record<string, unknown> {
  _keyDateCounter++
  const rawYear = raw.year ?? raw.date ?? raw.period
  const date = raw.date && typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw.date)
    ? raw.date
    : yearToDate(rawYear)
  return {
    date,
    label: String(raw.label ?? raw.title ?? raw.event ?? raw.name ?? raw.heading ?? `Key Moment ${_keyDateCounter}`),
    significance: String(raw.significance ?? raw.description ?? raw.importance ?? raw.note ?? raw.detail ?? ''),
  }
}

let _sourceCounter = 0
function normalizeSource(raw: Record<string, unknown>, prefix: string): Record<string, unknown> {
  _sourceCounter++
  const title = String(raw.title ?? raw.name ?? raw.work ?? raw.source ?? raw.reference ?? 'Unnamed Source')
  const rawType = String(raw.sourceType ?? raw.source_type ?? raw.type ?? '').toLowerCase()
  let sourceType = 'other'
  if (VALID_SOURCE_TYPES.has(rawType)) sourceType = rawType
  else if (rawType.includes('dict')) sourceType = 'dictionary'
  else if (rawType.includes('book') || rawType.includes('novel') || rawType.includes('lit')) sourceType = 'literary'
  else if (rawType.includes('acad') || rawType.includes('journal') || rawType.includes('study')) sourceType = 'academic'
  else if (rawType.includes('hist')) sourceType = 'historical'
  else if (rawType.includes('news') || rawType.includes('paper')) sourceType = 'newspaper'
  const author = raw.author ?? raw.by ?? raw.creator ?? null
  const publisher = raw.publisher ?? raw.publication ?? null
  const rawPubDate = raw.publishedDate ?? raw.published_date ?? raw.date ?? raw.year
  const publishedDate = rawPubDate != null ? yearToDate(rawPubDate) : null
  const excerpt = String(raw.excerpt ?? raw.quote ?? raw.text ?? raw.passage ?? raw.citation ?? '')
  const attribution = String(raw.attribution ?? (title + (author ? `, ${String(author)}` : '')))
  const relevanceNote = String(raw.relevanceNote ?? raw.relevance_note ?? raw.relevance ?? raw.note ?? '')
  return {
    sourceId: String(raw.sourceId ?? raw.id ?? raw.source_id ?? `${prefix}-src-${_sourceCounter}`),
    title,
    author: author !== null ? String(author) : null,
    publisher: publisher !== null ? String(publisher) : null,
    publishedDate,
    sourceType,
    attribution,
    excerpt,
    relevanceNote,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.8,
  }
}

function normalizeXaiResponse(parsed: unknown, query: string, normalizedQuery: string, mode: string): unknown {
  if (typeof parsed !== 'object' || parsed === null) return parsed
  _snapshotCounter = 0

  const obj = parsed as Record<string, unknown>
  const prefix = normalizedQuery.replace(/\s+/g, '-')

  // Normalize currentSnapshot
  if (obj.currentSnapshot && typeof obj.currentSnapshot === 'object') {
    obj.currentSnapshot = normalizeSnapshot(obj.currentSnapshot as Record<string, unknown>, `${prefix}-current`)
  }

  // Normalize historicalSnapshots
  if (Array.isArray(obj.historicalSnapshots)) {
    obj.historicalSnapshots = obj.historicalSnapshots.map((s: unknown) =>
      typeof s === 'object' && s !== null
        ? normalizeSnapshot(s as Record<string, unknown>, prefix)
        : s,
    )
  }

  // Normalize summaryOfChange — the AI sometimes places fields at root level
  const rootDriftType = obj.driftType
  const rootDriftMagnitude = obj.driftMagnitude

  if (obj.summaryOfChange && typeof obj.summaryOfChange === 'object') {
    const soc = obj.summaryOfChange as Record<string, unknown>
    soc.driftMagnitude = normalizeDriftMagnitude(soc.driftMagnitude ?? rootDriftMagnitude)
    soc.driftType = normalizeDriftType(soc.driftType ?? rootDriftType)
    if (!VALID_SENTIMENT_SHIFTS.has(String(soc.sentimentShift))) {
      soc.sentimentShift = 'stable'
    }
  } else if (rootDriftType || rootDriftMagnitude) {
    // AI put summaryOfChange fields at root level — rescue them
    obj.summaryOfChange = {
      shortSummary: String(obj.shortSummary ?? obj.summary ?? ''),
      longSummary: String(obj.longSummary ?? obj.detailedSummary ?? obj.summary ?? ''),
      sentimentShift: VALID_SENTIMENT_SHIFTS.has(String(obj.sentimentShift)) ? obj.sentimentShift : 'stable',
      driftType: normalizeDriftType(rootDriftType),
      driftMagnitude: normalizeDriftMagnitude(rootDriftMagnitude),
    }
  }

  // Normalize keyDates
  if (Array.isArray(obj.keyDates)) {
    _keyDateCounter = 0
    obj.keyDates = obj.keyDates.map((kd: unknown) =>
      typeof kd === 'object' && kd !== null
        ? normalizeKeyDate(kd as Record<string, unknown>)
        : kd,
    )
  }

  // Normalize sources
  if (Array.isArray(obj.sources)) {
    _sourceCounter = 0
    obj.sources = obj.sources.map((s: unknown) =>
      typeof s === 'object' && s !== null
        ? normalizeSource(s as Record<string, unknown>, prefix)
        : s,
    )
  }

  // Ensure required top-level fields
  obj.query = obj.query ?? query
  obj.normalizedQuery = obj.normalizedQuery ?? normalizedQuery
  obj.mode = mode

  return obj
}

const INTERPRET_SYSTEM_PROMPT = `You are BackWords, a scholarly assistant specialising in the historical evolution of language.
You produce detailed, academically rigorous JSON objects describing how a word or phrase has changed in meaning over time.

You MUST respond with a single valid JSON object with NO markdown fences and NO extra text.
The object MUST match this exact structure:

{
  "lexemeId": "word-en-00",
  "query": "word",
  "normalizedQuery": "word",
  "currentSnapshot": {
    "snapshotId": "word-current",
    "date": "2024-01-01",
    "eraLabel": "Contemporary",
    "definition": "...",
    "register": "neutral",
    "sentiment": "neutral",
    "confidence": 0.9,
    "sourceIds": []
  },
  "historicalSnapshots": [
    {
      "snapshotId": "word-snap-1",
      "date": "1400-01-01",
      "eraLabel": "Middle English",
      "definition": "...",
      "register": "formal",
      "sentiment": "neutral",
      "confidence": 0.85,
      "sourceIds": []
    }
  ],
  "summaryOfChange": {
    "shortSummary": "...",
    "longSummary": "...",
    "sentimentShift": "stable",
    "driftType": "broadening",
    "driftMagnitude": 0.6
  },
  "keyDates": [],
  "sources": [],
  "relatedConcepts": [],
  "timelineEvents": []
}

CRITICAL RULES:
- date fields MUST be ISO8601 strings like "1400-01-01", NEVER bare year numbers
- driftMagnitude MUST be a decimal number 0–1 (e.g. 0.5), NEVER a string like "Moderate"
- driftType MUST be exactly one of: pejoration | amelioration | narrowing | broadening | semantic-shift | stable | reclamation
- register MUST be exactly one of: formal | informal | neutral | technical | vulgar | archaic
- sentiment MUST be exactly one of: positive | negative | neutral
- sentimentShift MUST be exactly one of: positive-to-negative | negative-to-positive | neutral-to-negative | neutral-to-positive | positive-to-neutral | negative-to-neutral | stable | complex
- Include 2–5 historicalSnapshots
- currentSnapshot.definition and each historicalSnapshot.definition must be non-empty strings`

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let body: InterpretRequest
  try {
    body = (await req.json()) as InterpretRequest
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }

  const { query, mode = 'word', requestedDate, useMock, model } = body
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return errorResponse('query is required', 400)
  }
  if (query.length > 2000) {
    return errorResponse('query too long (max 2000 chars)', 400)
  }

  const normalized = normaliseQuery(query)
  const isMock = useMock === true || process.env.MOCK_MODE === 'true'

  // Always try cache/seed first
  const seed = getSeedByQuery(normalized)
  if (isMock || seed) {
    if (seed) return jsonResponse({ ...seed, mode })
    return errorResponse(`No seed data for "${normalized}". Use live mode.`, 404)
  }

  // LIVE mode — call xAI
  try {
    const userPrompt = `Analyse the semantic drift of the ${mode === 'word' ? 'word' : mode} "${query}"${requestedDate ? ` at the period around ${requestedDate}` : ''}.
Return a complete InterpretationResult JSON object.`

    const raw = await chatComplete(
      [
        { role: 'system', content: INTERPRET_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      model ?? INTERPRET_MODEL,
    )

    const extracted = extractJson(raw)
    const parsed: unknown = JSON.parse(extracted)
    const normResult = normalizeXaiResponse(parsed, query, normalized, mode)
    return jsonResponse(normResult)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[interpret] xAI error:', msg)
    // Fallback to seed if available, otherwise 502
    if (seed) return jsonResponse({ ...seed, mode })
    return errorResponse(`AI service error: ${msg}`, 502)
  }
}

export const config: Config = {
  path: '/.netlify/functions/interpret',
}
