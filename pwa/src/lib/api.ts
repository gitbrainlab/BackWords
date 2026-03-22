// API client — all fetch calls to Netlify Functions
// Uses VITE_API_BASE_URL env var; falls back to local Netlify CLI dev port.
import type {
  InterpretationResult,
  InterpretRequest,
  ExplainSourceRequest,
  ExplainSourceResponse,
} from '@/types'

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8888/.netlify/functions'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 0,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
    throw new ApiError((err as { detail?: string }).detail ?? `HTTP ${res.status}`, res.status)
  }
  return res.json() as Promise<T>
}

export async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE_URL}/${path}`, { signal })
  if (!res.ok) {
    throw new ApiError(`HTTP ${res.status}`, res.status)
  }
  return res.json() as Promise<T>
}

// POST /interpret
export type InterpretResponse = InterpretationResult & { cacheHit?: boolean }
export function interpret(req: InterpretRequest, signal?: AbortSignal) {
  return post<InterpretResponse>('interpret', req, signal)
}

// POST /explain-source
export function explainSource(req: ExplainSourceRequest, signal?: AbortSignal) {
  return post<ExplainSourceResponse>('explain-source', req, signal)
}

// GET /health
export interface HealthResponse {
  status: string
  version: string
  seedCount: number
  mode: string
  models?: {
    interpret: string
    explain: string
    deepDive: string
  }
}

export function healthCheck(signal?: AbortSignal) {
  return get<HealthResponse>('health', signal)
}

