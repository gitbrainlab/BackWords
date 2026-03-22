// XAI API client — reads XAI_API_KEY from environment (server-side only, never exposed to browser)
const XAI_BASE_URL = 'https://api.x.ai/v1'

export const INTERPRET_MODEL = process.env.XAI_MODEL_INTERPRET ?? 'grok-4-1-fast-non-reasoning'
export const EXPLAIN_MODEL = process.env.XAI_MODEL_EXPLAIN ?? 'grok-4-1-fast-non-reasoning'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  choices: Array<{
    message: { content: string }
    finish_reason: string
  }>
}

export interface ChatOptions {
  /** Force the model to respond with a valid JSON object (no markdown fences). */
  jsonMode?: boolean
  /** Hard token ceiling. Defaults to 4096. */
  maxTokens?: number
}

export async function chatComplete(
  messages: ChatMessage[],
  model: string,
  signal?: AbortSignal,
  options?: ChatOptions,
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('XAI_API_KEY not set')

  // Reasoning-tier models support a reasoning_effort hint — default to medium
  // to balance quality vs latency without over-spending on budget.
  // Match models that end with "-reasoning" but not "-non-reasoning".
  const isReasoningModel = /(?<!non-)reasoning$/.test(model)

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: options?.maxTokens ?? 4096,
    ...(options?.jsonMode && { response_format: { type: 'json_object' } }),
    ...(isReasoningModel && { reasoning_effort: 'medium' }),
  }

  const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`XAI API error ${response.status}: ${text}`)
  }

  const data = (await response.json()) as ChatResponse
  const content = data.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from XAI API')
  return content
}

/** Extract JSON from model output — handles markdown code fences */
export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\n?([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  // Try to find first { ... } block
  const startIdx = raw.indexOf('{')
  const endIdx = raw.lastIndexOf('}')
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return raw.slice(startIdx, endIdx + 1)
  }
  return raw.trim()
}
