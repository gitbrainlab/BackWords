// XAI API client — reads XAI_API_KEY from environment (server-side only, never exposed to browser)
const XAI_BASE_URL = 'https://api.x.ai/v1'

export const INTERPRET_MODEL = process.env.XAI_MODEL_INTERPRET ?? 'grok-3-mini-fast'
export const EXPLAIN_MODEL = process.env.XAI_MODEL_EXPLAIN ?? 'grok-3-mini-fast'

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

export async function chatComplete(
  messages: ChatMessage[],
  model: string,
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('XAI_API_KEY not set')

  const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
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
