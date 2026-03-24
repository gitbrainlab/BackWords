import type { Config } from '@netlify/functions'
import { chatCompleteWithTelemetry, INTERPRET_MODEL } from './_shared/xai-client.js'
import { errorResponse, jsonResponse, optionsResponse } from './_shared/response.js'

type BenchmarkScenario = 'interpret-lite' | 'explain-lite' | 'chat-lite'

interface BenchmarkRequest {
  scenario?: BenchmarkScenario
  model?: string
  iterations?: number
  warmup?: number
  concurrency?: number
  timeoutMs?: number
  jsonMode?: boolean
  maxTokens?: number
  includeRunDetails?: boolean
}

interface RunResult {
  run: number
  ok: boolean
  durationMs: number
  startedAt: string
  completedAt: string
  xaiStatus?: number
  xaiHeaders?: Record<string, string>
  retryWithoutReasoningEffort?: boolean
  error?: string
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0
  if (sortedValues.length === 1) return sortedValues[0]
  const rank = (p / 100) * (sortedValues.length - 1)
  const lo = Math.floor(rank)
  const hi = Math.ceil(rank)
  if (lo === hi) return sortedValues[lo]
  const t = rank - lo
  return sortedValues[lo] * (1 - t) + sortedValues[hi] * t
}

function summarize(results: RunResult[]): Record<string, unknown> {
  const durations = results
    .filter((r) => r.ok)
    .map((r) => r.durationMs)
    .sort((a, b) => a - b)

  const failures = results.filter((r) => !r.ok)
  const failureMap = new Map<string, number>()
  for (const failure of failures) {
    const key = failure.error ?? 'unknown'
    failureMap.set(key, (failureMap.get(key) ?? 0) + 1)
  }

  const failureBreakdown = Array.from(failureMap.entries()).map(([error, count]) => ({ error, count }))

  if (durations.length === 0) {
    return {
      runs: {
        total: results.length,
        success: 0,
        failed: failures.length,
      },
      latencyMs: {
        min: null,
        mean: null,
        p50: null,
        p90: null,
        p95: null,
        p99: null,
        max: null,
      },
      failureBreakdown,
    }
  }

  const total = durations.reduce((sum, value) => sum + value, 0)

  return {
    runs: {
      total: results.length,
      success: durations.length,
      failed: failures.length,
    },
    latencyMs: {
      min: Math.round(durations[0]),
      mean: Math.round(total / durations.length),
      p50: Math.round(percentile(durations, 50)),
      p90: Math.round(percentile(durations, 90)),
      p95: Math.round(percentile(durations, 95)),
      p99: Math.round(percentile(durations, 99)),
      max: Math.round(durations[durations.length - 1]),
    },
    failureBreakdown,
  }
}

function buildMessages(scenario: BenchmarkScenario): Array<{ role: 'system' | 'user'; content: string }> {
  if (scenario === 'interpret-lite') {
    return [
      {
        role: 'system',
        content: 'You are a semantic historian. Return concise JSON only.',
      },
      {
        role: 'user',
        content: 'Return JSON with keys shortSummary and driftType for the word "awful" in modern English.',
      },
    ]
  }

  if (scenario === 'explain-lite') {
    return [
      {
        role: 'system',
        content: 'You explain lexical evidence in one paragraph.',
      },
      {
        role: 'user',
        content: 'In 2-3 sentences, explain why an OED entry can support semantic drift claims for the word "awful".',
      },
    ]
  }

  return [
    {
      role: 'system',
      content: 'You are concise and direct.',
    },
    {
      role: 'user',
      content: 'Respond with one sentence: what is semantic drift?',
    },
  ]
}

async function runSingle(
  runNumber: number,
  scenario: BenchmarkScenario,
  model: string,
  timeoutMs: number,
  jsonMode: boolean,
  maxTokens: number,
): Promise<RunResult> {
  const startedAt = new Date().toISOString()
  const started = performance.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const result = await chatCompleteWithTelemetry(buildMessages(scenario), model, controller.signal, { jsonMode, maxTokens })
    return {
      run: runNumber,
      ok: true,
      durationMs: performance.now() - started,
      startedAt,
      completedAt: new Date().toISOString(),
      xaiStatus: result.telemetry.status,
      xaiHeaders: result.telemetry.headers,
      retryWithoutReasoningEffort: result.telemetry.retryWithoutReasoningEffort,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      run: runNumber,
      ok: false,
      durationMs: performance.now() - started,
      startedAt,
      completedAt: new Date().toISOString(),
      error: msg,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  if (process.env.BENCHMARK_ENABLED !== 'true') {
    return errorResponse('Benchmark endpoint disabled', 404)
  }

  const configuredKey = process.env.BENCHMARK_API_KEY
  if (configuredKey) {
    const supplied = req.headers.get('x-benchmark-key') ?? ''
    if (!supplied || supplied !== configuredKey) {
      return errorResponse('Forbidden', 403)
    }
  }

  let body: BenchmarkRequest
  try {
    body = (await req.json()) as BenchmarkRequest
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }

  const scenario: BenchmarkScenario = body.scenario ?? 'interpret-lite'
  if (!['interpret-lite', 'explain-lite', 'chat-lite'].includes(scenario)) {
    return errorResponse('Invalid scenario', 400)
  }

  const model = (body.model ?? INTERPRET_MODEL).trim()
  if (!model) return errorResponse('model is required', 400)

  const iterations = Math.min(Math.max(Math.floor(body.iterations ?? 8), 1), 50)
  const warmup = Math.min(Math.max(Math.floor(body.warmup ?? 1), 0), 10)
  const concurrency = Math.min(Math.max(Math.floor(body.concurrency ?? 1), 1), 8)
  const timeoutMs = Math.min(Math.max(Math.floor(body.timeoutMs ?? 45000), 1000), 120000)
  const maxTokens = Math.min(Math.max(Math.floor(body.maxTokens ?? 256), 16), 4096)
  const jsonMode = body.jsonMode ?? scenario === 'interpret-lite'
  const includeRunDetails = body.includeRunDetails ?? true

  // Warmup requests are excluded from stats to reduce first-call noise.
  for (let i = 0; i < warmup; i += 1) {
    await runSingle(-1, scenario, model, timeoutMs, jsonMode, maxTokens)
  }

  const startedAt = new Date().toISOString()
  const runStart = performance.now()
  const results: RunResult[] = []
  let nextIndex = 0

  const workers = Array.from({ length: concurrency }, async () => {
    while (nextIndex < iterations) {
      nextIndex += 1
      const runNumber = nextIndex
      const result = await runSingle(runNumber, scenario, model, timeoutMs, jsonMode, maxTokens)
      results.push(result)
    }
  })

  await Promise.all(workers)
  const elapsedMs = performance.now() - runStart
  const stats = summarize(results)

  return jsonResponse({
    endpoint: 'benchmark',
    startedAt,
    completedAt: new Date().toISOString(),
    scenario,
    model,
    config: {
      iterations,
      warmup,
      concurrency,
      timeoutMs,
      jsonMode,
      maxTokens,
      includeRunDetails,
    },
    elapsedMs: Math.round(elapsedMs),
    throughputRps: Number((iterations / Math.max(elapsedMs / 1000, 0.001)).toFixed(2)),
    ...stats,
    ...(includeRunDetails && {
      runDetails: results
        .slice()
        .sort((a, b) => a.run - b.run)
        .map((r) => ({
          run: r.run,
          ok: r.ok,
          durationMs: Math.round(r.durationMs),
          startedAt: r.startedAt,
          completedAt: r.completedAt,
          xaiStatus: r.xaiStatus,
          retryWithoutReasoningEffort: r.retryWithoutReasoningEffort ?? false,
          xaiHeaders: r.xaiHeaders ?? {},
          error: r.error,
        })),
    }),
  })
}

export const config: Config = {
  path: '/.netlify/functions/benchmark',
}