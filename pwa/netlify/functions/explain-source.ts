import type { Config } from '@netlify/functions'
import { chatComplete, EXPLAIN_MODEL } from './_shared/xai-client.js'
import { jsonResponse, errorResponse, optionsResponse } from './_shared/response.js'

interface ExplainSourceRequest {
  sourceId: string
  sourceTitle: string
  sourceDate?: string
  quote?: string
  word: string
  context?: string
  useMock?: boolean
  model?: string
}

const EXPLAIN_SYSTEM_PROMPT = `You are BackWords, a scholarly language assistant. Your task is to explain, in 2-4 sentences,
why a particular historical source is significant as evidence for the semantic evolution of a word.
Focus on what the source reveals about meaning, usage, or register at that time. Be precise and academic but accessible.
Return plain text — no JSON, no markdown.`

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let body: ExplainSourceRequest
  try {
    body = (await req.json()) as ExplainSourceRequest
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }

  const { sourceId, sourceTitle, sourceDate, quote, word, context, useMock, model } = body
  if (!sourceId || !word) return errorResponse('sourceId and word are required', 400)

  const isMock = useMock === true || process.env.MOCK_MODE === 'true'

  if (isMock) {
    return jsonResponse({
      sourceId,
      explanation: `"${sourceTitle}" (${sourceDate ?? 'date unknown'}) is significant because it documents the usage of "${word}" in its historical context, providing lexicographic evidence of meaning at that time.`,
    })
  }

  try {
    const userPrompt = `Explain why the source "${sourceTitle}" (${sourceDate ?? 'date unknown'}) is significant evidence for the semantic history of the word "${word}".${quote ? `\n\nRelevant quote: "${quote}"` : ''}${context ? `\n\nContext: ${context}` : ''}`

    const effectiveModel = model ?? EXPLAIN_MODEL

    const explanation = await chatComplete(
      [
        { role: 'system', content: EXPLAIN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      effectiveModel,
    )

    return jsonResponse({ sourceId, explanation: explanation.trim(), effectiveModel })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[explain-source] xAI error:', msg)
    // Fallback mock explanation
    return jsonResponse({
      sourceId,
      explanation: `${sourceTitle} provides historical evidence for the meaning of "${word}" during this period.`,
    })
  }
}

export const config: Config = {
  path: '/.netlify/functions/explain-source',
}
