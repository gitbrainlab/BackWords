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
}

const INTERPRET_SYSTEM_PROMPT = `You are BackWords, a scholarly assistant specialising in the historical evolution of language.
You produce detailed, academically rigorous JSON objects describing how a word or phrase has changed in meaning over time.

You MUST respond with a single valid JSON object matching the InterpretationResult schema, with no markdown fences.
Include at minimum:
- lexemeId, query, normalizedQuery, mode, currentSnapshot, historicalSnapshots (2–5 entries)
- summaryOfChange with shortSummary, longSummary, sentimentShift, driftType, driftMagnitude
- keyDates (2–4 entries), sources (2–4 entries), relatedConcepts (1–3 entries)
- timelineEvents (one per snapshot)`

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let body: InterpretRequest
  try {
    body = (await req.json()) as InterpretRequest
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }

  const { query, mode = 'word', requestedDate, useMock } = body
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
      INTERPRET_MODEL,
    )

    const extracted = extractJson(raw)
    const parsed: unknown = JSON.parse(extracted)
    return jsonResponse(parsed)
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
