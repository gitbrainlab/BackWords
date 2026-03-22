import type { Config } from '@netlify/functions'
import {
  getSeedByQuery,
  normaliseQuery,
} from './_shared/seed-loader.js'
import { chatComplete, extractJson, INTERPRET_MODEL } from './_shared/xai-client.js'
import { jsonResponse, errorResponse, optionsResponse } from './_shared/response.js'
import { getCached, setCached } from './_shared/cache.js'

interface InterpretRequest {
  query: string
  mode?: string
  requestedDate?: string
  useMock?: boolean
  model?: string
}

const DEEP_DIVE_MODEL = 'grok-4.20-0309-non-reasoning'

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

function hasMeaningfulText(raw: unknown): boolean {
  return typeof raw === 'string' && raw.replace(/\?/g, '').trim().length > 0
}

function trimToSentence(raw: string, fallback: string): string {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (!text) return fallback
  if (text.length <= 180) return text
  return `${text.slice(0, 177).trimEnd()}...`
}

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
    // Leading digits (e.g. "1300" or "1300s")
    const n = parseInt(year, 10)
    if (!isNaN(n)) return `${String(Math.abs(n)).padStart(4, '0')}-01-01`
    // Embedded digits (e.g. "circa 1300", "c. 1300", "~1300", "late 14th century")
    const m = year.match(/\b(\d{3,4})\b/)
    if (m) return `${m[1].padStart(4, '0')}-01-01`
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
    snapshotId: raw.snapshotId || raw.id || `${prefix}-snap-${_snapshotCounter}`,
    date,
    eraLabel: String(raw.eraLabel || raw.era || raw.period_label || eraLabelFromDate(date)),
    definition: String(raw.definition || raw.description || raw.meaning || raw.sense || ''),
    usageNote: (raw.usageNote || raw.usage_note || raw.note) ?? undefined,
    exampleUsage: (raw.exampleUsage || raw.example || raw.example_usage) ?? undefined,
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
  // Strip '?' placeholder labels — AI sometimes returns '?' when it can't determine the value.
  // A label that is only '?' characters or whitespace is treated as missing.
  const rawLabel = String(raw.label || raw.title || raw.event || raw.name || raw.heading || '')
  const label = rawLabel.trim().replace(/\?/g, '').trim().length > 0
    ? rawLabel.trim()
    : `Key Moment ${_keyDateCounter}`
  return {
    date,
    label,
    significance: String(raw.significance || raw.description || raw.importance || raw.note || raw.detail || ''),
  }
}

let _sourceCounter = 0
function normalizeSource(raw: Record<string, unknown>, prefix: string): Record<string, unknown> {
  _sourceCounter++
  // Trim and reject whitespace-only or '?'-only titles — the AI sometimes returns '   ' or '?'
  const rawTitle = String(raw.title || raw.name || raw.work || raw.source || raw.reference || '')
  const titleCleaned = rawTitle.trim()
  const title = titleCleaned.length > 0 && titleCleaned.replace(/\?/g, '').trim().length > 0
    ? titleCleaned
    : 'Unnamed Source'
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
  const excerpt = String(raw.excerpt || raw.quote || raw.text || raw.passage || raw.citation || '')
  const attribution = String(raw.attribution || (title + (author ? `, ${String(author)}` : '')))
  const relevanceNote = String(raw.relevanceNote || raw.relevance_note || raw.relevance || raw.note || '')
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
  } else if (typeof obj.currentSnapshot === 'string' && obj.currentSnapshot.trim().length > 0) {
    // AI returned the current definition as a plain string — rescue it into a proper object
    obj.currentSnapshot = {
      snapshotId: `${prefix}-current`,
      date: '2024-01-01',
      eraLabel: 'Contemporary',
      definition: obj.currentSnapshot.trim(),
      register: 'neutral',
      sentiment: 'neutral',
      confidence: 0.8,
      sourceIds: [],
    }
  }

  // Normalize historicalSnapshots — filter out non-objects (plain strings crash Timeline's
  // formatYear() because they produce events with date: undefined).
  if (Array.isArray(obj.historicalSnapshots)) {
    obj.historicalSnapshots = obj.historicalSnapshots
      .filter((s: unknown) => typeof s === 'object' && s !== null)
      .map((s: unknown) => normalizeSnapshot(s as Record<string, unknown>, prefix))
  } else {
    obj.historicalSnapshots = []
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

  // Normalize keyDates — filter non-objects just like historicalSnapshots
  if (Array.isArray(obj.keyDates)) {
    _keyDateCounter = 0
    obj.keyDates = obj.keyDates
      .filter((kd: unknown) => typeof kd === 'object' && kd !== null)
      .map((kd: unknown) => normalizeKeyDate(kd as Record<string, unknown>))
  }

  // Normalize timelineEvents — a null/undefined date causes formatYear() in Timeline.tsx to
  // throw, firing the error boundary.  Also rescue events where the AI returned only
  // snapshotIndex+description by cross-referencing normalised historicalSnapshots for real dates.
  let _eventCounter = 0
  if (Array.isArray(obj.timelineEvents)) {
    const normSnaps = Array.isArray(obj.historicalSnapshots)
      ? (obj.historicalSnapshots as Array<Record<string, unknown>>)
      : []
    obj.timelineEvents = obj.timelineEvents
      .filter((e: unknown) => typeof e === 'object' && e !== null)
      .map((e: unknown) => {
        _eventCounter++
        const ev = e as Record<string, unknown>

        // Cross-reference snapshotIndex → pick up real date / era from the already-normalised snapshot
        const snapIdx = typeof ev.snapshotIndex === 'number' ? ev.snapshotIndex : null
        const refSnap = snapIdx != null ? normSnaps[snapIdx - 1] ?? null : null

        const rawDate = ev.date ?? ev.year ?? ev.period ?? refSnap?.date
        const date = ev.date && typeof ev.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(ev.date as string)
          ? ev.date
          : yearToDate(rawDate)

        // Title: prefer explicit field, fall back to referenced snapshot era label
        const title = String(
          ev.title ?? ev.label ?? ev.name ?? ev.heading ??
          (refSnap?.eraLabel ?? refSnap?.eraLabel ?? ''),
        )

        return {
          ...ev,
          eventId: String(ev.eventId ?? ev.id ?? `${prefix}-event-${_eventCounter}`),
          date,
          eraLabel: String(ev.eraLabel ?? ev.era ?? refSnap?.eraLabel ?? eraLabelFromDate(date as string)),
          title,
          summary: String(ev.summary ?? ev.description ?? ev.content ?? ''),
          sourceIds: Array.isArray(ev.sourceIds) ? ev.sourceIds : [],
        }
      })
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

  // Normalize relatedConcepts — AI often omits conceptId or uses alternate label fields
  let _conceptCounter = 0
  if (Array.isArray(obj.relatedConcepts)) {
    obj.relatedConcepts = obj.relatedConcepts
      .filter((c: unknown) => typeof c === 'object' && c !== null)
      .map((c: unknown) => {
        _conceptCounter++
        const rc = c as Record<string, unknown>
        const label = String(rc.label || rc.name || rc.concept || rc.term || rc.word || '')
        return {
          conceptId: String(rc.conceptId || rc.id || `${prefix}-concept-${_conceptCounter}`),
          label,
          relationship: String(rc.relationship || rc.type || rc.relation || 'related'),
          note: (rc.note && typeof rc.note === 'string') ? rc.note : null,
          confidence: typeof rc.confidence === 'number' ? rc.confidence : 0.8,
        }
      })
      .filter((c: { label: string }) => c.label.length > 0)
  }

  // Ensure required top-level fields
  obj.query = obj.query ?? query
  obj.normalizedQuery = obj.normalizedQuery ?? normalizedQuery
  obj.mode = mode

  return obj
}

function synthesizeKeyDatesFromSnapshots(result: Record<string, unknown>): Array<Record<string, unknown>> {
  const snapshots = Array.isArray(result.historicalSnapshots)
    ? result.historicalSnapshots as Array<Record<string, unknown>>
    : []

  return snapshots
    .filter(snapshot => hasMeaningfulText(snapshot.definition))
    .slice(0, 4)
    .map((snapshot, index) => ({
      date: String(snapshot.date ?? '2024-01-01'),
      label: String(snapshot.eraLabel ?? `Historical Phase ${index + 1}`),
      significance: trimToSentence(
        String(snapshot.definition ?? ''),
        `Meaning documented for ${String(snapshot.eraLabel ?? `phase ${index + 1}`)}.`,
      ),
    }))
}

function filterMeaningfulKeyDates(result: Record<string, unknown>): Array<Record<string, unknown>> {
  const keyDates = Array.isArray(result.keyDates)
    ? result.keyDates as Array<Record<string, unknown>>
    : []

  const filtered = keyDates.filter((keyDate, index) => {
    const label = String(keyDate.label ?? '')
    const significance = String(keyDate.significance ?? '')
    const isGeneratedLabel = new RegExp(`^Key Moment ${index + 1}$`).test(label.trim())
    const isFallbackDate = String(keyDate.date ?? '') === '2024-01-01'
    return hasMeaningfulText(label) && (!isGeneratedLabel || hasMeaningfulText(significance) || !isFallbackDate)
  })

  return filtered.length > 0 ? filtered : synthesizeKeyDatesFromSnapshots(result)
}

function filterMeaningfulSources(result: Record<string, unknown>): Array<Record<string, unknown>> {
  const sources = Array.isArray(result.sources)
    ? result.sources as Array<Record<string, unknown>>
    : []

  return sources.filter(source => {
    const title = String(source.title ?? '')
    if (!hasMeaningfulText(title) || title === 'Unnamed Source') return false
    return [source.author, source.publisher, source.publishedDate, source.excerpt, source.relevanceNote]
      .some(value => hasMeaningfulText(value) || value !== null && value !== undefined)
  })
}

function isLowQualityResult(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return true
  const result = raw as Record<string, unknown>
  const currentSnapshot = result.currentSnapshot as Record<string, unknown> | undefined
  const keyDates = filterMeaningfulKeyDates(result)
  const sources = filterMeaningfulSources(result)
  const historicalSnapshots = Array.isArray(result.historicalSnapshots) ? result.historicalSnapshots : []

  return !hasMeaningfulText(currentSnapshot?.definition)
    || historicalSnapshots.length === 0
    || keyDates.length === 0
    || sources.length === 0
}

function withResultMeta(raw: unknown, meta: Record<string, unknown>): unknown {
  if (typeof raw !== 'object' || raw === null) return raw
  return { ...(raw as Record<string, unknown>), ...meta }
}

function finalizeResult(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw
  const result = raw as Record<string, unknown>
  result.keyDates = filterMeaningfulKeyDates(result)
  result.sources = filterMeaningfulSources(result)
  return result
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
  "keyDates": [
    { "date": "1400-01-01", "label": "Earliest attestation", "significance": "First recorded use in Middle English texts." }
  ],
  "sources": [
    {
      "sourceId": "src-1",
      "title": "Oxford English Dictionary",
      "author": null,
      "publisher": "Oxford University Press",
      "publishedDate": "2024-01-01",
      "sourceType": "dictionary",
      "attribution": "OED Online",
      "excerpt": "",
      "relevanceNote": "Primary etymological reference.",
      "confidence": 0.95
    }
  ],
  "relatedConcepts": [
    { "conceptId": "concept-1", "label": "semantic broadening", "relationship": "illustrates", "note": null }
  ],
  "timelineEvents": []
}

CRITICAL RULES:
- date fields MUST be ISO8601 strings like "1400-01-01", NEVER bare year numbers or strings like "circa 1300"
- driftMagnitude MUST be a decimal number 0–1 (e.g. 0.5), NEVER a string like "Moderate"
- driftType MUST be exactly one of: pejoration | amelioration | narrowing | broadening | semantic-shift | stable | reclamation
- register MUST be exactly one of: formal | informal | neutral | technical | vulgar | archaic
- sentiment MUST be exactly one of: positive | negative | neutral
- sentimentShift MUST be exactly one of: positive-to-negative | negative-to-positive | neutral-to-negative | neutral-to-positive | positive-to-neutral | negative-to-neutral | stable | complex
- Include 2–5 historicalSnapshots; every definition field must be a non-empty string
- keyDates MUST include 2–5 entries marking significant moments; every label MUST be a specific non-empty string — NEVER use "?" or leave a label blank
- sources MUST include 2–4 real reference works; every title must be a non-empty string
- For informal, slang, or dialectal words: newspapers, the Online Etymology Dictionary, Merriam-Webster, word-study archives, and regional dialect records are all acceptable sources — do NOT leave sources empty just because the word is non-standard
- currentSnapshot.definition MUST be at least 2 meaningful sentences describing current usage — never a single vague phrase like "current usage" or a one-word gloss
- relatedConcepts MUST include 2–4 entries; every label must be a non-empty string`

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
  const requestedModel = model ?? INTERPRET_MODEL

  // Always try cache/seed first
  const seed = getSeedByQuery(normalized)
  if (isMock || seed) {
    if (seed) return jsonResponse({ ...seed, mode })
    return errorResponse(`No seed data for "${normalized}". Use live mode.`, 404)
  }

  // Check Netlify Blobs cache before calling xAI
  const cached = await getCached(normalized, mode, requestedModel)
  if (cached) {
    return jsonResponse({ ...(cached as Record<string, unknown>), mode, cacheHit: true })
  }

  // LIVE mode — call xAI
  try {
    const eraClause = requestedDate ? ` with particular focus on the period around ${requestedDate}` : ''

    let userPrompt: string
    if (mode === 'phrase') {
      userPrompt = `Analyse the semantic drift of the phrase "${query}"${eraClause}.
Treat the phrase as a unified expression — trace how its meaning as a WHOLE has changed, not the individual words.
Requirements:
- Provide 2–5 historicalSnapshots showing the phrase's evolution across different eras
- Include 2–5 keyDates: earliest documented use, significant usage shifts, and any modern pop-culture or register change
- Identify 2–4 REAL sources (newspapers, dictionaries, corpus studies, literary works) that document this phrase's usage
- currentSnapshot.definition must describe in 2+ sentences HOW this phrase is used today, by whom, and in what register
- summaryOfChange.shortSummary must explain the phrase's semantic journey in plain language (minimum 20 words)
- Include 2–4 relatedConcepts (related idioms, phrases, or linguistic phenomena)
Return a complete InterpretationResult JSON object.`
    } else if (mode === 'paragraph') {
      userPrompt = `Analyse the semantic drift of the most historically significant word or phrase found in this passage: "${query}"${eraClause}.
Select the single word or phrase from the passage that has the richest documented history of meaning change.
Requirements:
- Set query and normalizedQuery to the selected word or phrase
- Provide 2–5 historicalSnapshots contextualised to the passage period
- Include 2–5 keyDates marking important moments in the selected term's semantic history
- Identify 2–4 REAL sources documenting the term's historical usage
- currentSnapshot.definition must describe how the term is understood TODAY (minimum 2 sentences)
- summaryOfChange.longSummary must explain how the term's meaning in the passage differs from its modern meaning
Return a complete InterpretationResult JSON object.`
    } else {
      userPrompt = `Analyse the semantic drift of the word "${query}"${eraClause}.
Even if this word is informal, slang, dialectal, or colloquial, provide thorough scholarly context.
Requirements:
- Earliest documented appearance: when and where the word/spelling first appeared (etymology, dialect origin, first print record)
- 2–5 historicalSnapshots tracing meaning change across clearly labelled eras
- 2–5 keyDates: first attestation, major usage shifts, dictionary inclusion, any reclamation or stigma events — use non-empty specific labels, never a bare "?" placeholder
- 2–4 REAL sources: standard dictionaries (OED, Merriam-Webster), newspapers, corpus studies, or dialect records.
  For informal or slang words acceptable sources include: Merriam-Webster slang section, news archives, Online Etymology Dictionary, or dialect/regional word studies
- currentSnapshot.definition: at least 2 sentences describing HOW the word is used TODAY — tone, register, typical contexts, and who uses it
- 2–4 relatedConcepts (synonyms, related slang, or linguistic phenomena)
Return a complete InterpretationResult JSON object.`
    }

    const messages = [
      { role: 'system' as const, content: INTERPRET_SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ]

    const attemptGeneration = async (attemptModel: string, retry: boolean): Promise<unknown> => {
      const retryMessages = retry
        ? [
            ...messages,
            {
              role: 'user' as const,
              content: 'Regenerate the JSON with stronger evidence density. Do not use blank dates, empty source titles, placeholder labels, or generic fallback entries. If exact day is unknown, use January 1 of the best-supported historical year or century. If a source title is unknown, choose a different real source instead of returning an unnamed source.',
            },
          ]
        : messages

      const raw = await chatComplete(
        retryMessages,
        attemptModel,
        undefined,
        { jsonMode: true, maxTokens: 4096 },
      )

      const extracted = extractJson(raw)
      const parsed: unknown = JSON.parse(extracted)
      return withResultMeta(
        finalizeResult(normalizeXaiResponse(parsed, query, normalized, mode)),
        {
          effectiveModel: attemptModel,
          qualityGuardTriggered: retry || attemptModel !== requestedModel,
        },
      )
    }

    let normResult = await attemptGeneration(requestedModel, false)
    if (isLowQualityResult(normResult)) {
      normResult = await attemptGeneration(requestedModel, true)
    }

    if (isLowQualityResult(normResult) && requestedModel !== DEEP_DIVE_MODEL) {
      normResult = await attemptGeneration(DEEP_DIVE_MODEL, true)
    }

    if (!isLowQualityResult(normResult)) {
      void setCached(normalized, mode, requestedModel, normResult)
      return jsonResponse(normResult)
    }

    return errorResponse(
      'The AI returned too little usable historical evidence for this query. Please try again or switch to Deep Dive.',
      502,
    )
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
