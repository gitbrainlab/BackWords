import { afterEach, describe, expect, it, vi } from 'vitest'

describe('benchmark endpoint', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
    vi.resetModules()
    vi.doUnmock('../_shared/xai-client')
  })

  it('returns 404 when benchmark endpoint is disabled', async () => {
    delete process.env.BENCHMARK_ENABLED
    process.env.CONTEXT = 'deploy-preview'

    const { default: handler } = await import('../benchmark')
    const response = await handler(new Request('http://localhost/.netlify/functions/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }))
    const body = await response.json() as { error?: string }

    expect(response.status).toBe(404)
    expect(body.error).toBe('Benchmark endpoint disabled')
  })

  it('defaults to enabled in production context when BENCHMARK_ENABLED is unset', async () => {
    delete process.env.BENCHMARK_ENABLED
    process.env.CONTEXT = 'production'

    vi.doMock('../_shared/xai-client', () => ({
      INTERPRET_MODEL: 'grok-4-1-fast-non-reasoning',
      chatCompleteWithTelemetry: vi.fn(async () => ({
        content: 'ok',
        telemetry: {
          status: 200,
          headers: { 'x-request-id': 'test-prod-default' },
          retryWithoutReasoningEffort: false,
        },
      })),
    }))

    const { default: handler } = await import('../benchmark')
    const response = await handler(new Request('http://localhost/.netlify/functions/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iterations: 1, warmup: 0 }),
    }))

    expect(response.status).toBe(200)
  })

  it('returns 403 when API key is configured and missing or invalid', async () => {
    process.env.BENCHMARK_ENABLED = 'true'
    process.env.BENCHMARK_API_KEY = 'secret-key'

    const { default: handler } = await import('../benchmark')

    const missingHeader = await handler(new Request('http://localhost/.netlify/functions/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }))
    expect(missingHeader.status).toBe(403)

    const wrongHeader = await handler(new Request('http://localhost/.netlify/functions/benchmark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Benchmark-Key': 'wrong',
      },
      body: JSON.stringify({}),
    }))
    expect(wrongHeader.status).toBe(403)
  })

  it('returns stats for successful benchmark runs', async () => {
    process.env.BENCHMARK_ENABLED = 'true'
    process.env.BENCHMARK_API_KEY = 'secret-key'

    vi.doMock('../_shared/xai-client', () => ({
      INTERPRET_MODEL: 'grok-4-1-fast-non-reasoning',
      chatCompleteWithTelemetry: vi.fn(async () => ({
        content: 'ok',
        telemetry: {
          status: 200,
          headers: { 'x-request-id': 'test-req' },
          retryWithoutReasoningEffort: false,
        },
      })),
    }))

    const { default: handler } = await import('../benchmark')
    const response = await handler(new Request('http://localhost/.netlify/functions/benchmark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Benchmark-Key': 'secret-key',
      },
      body: JSON.stringify({
        scenario: 'chat-lite',
        iterations: 3,
        warmup: 1,
        concurrency: 1,
        timeoutMs: 3000,
        maxTokens: 64,
      }),
    }))

    const body = await response.json() as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(body.endpoint).toBe('benchmark')
    expect(body.scenario).toBe('chat-lite')
    expect(body.model).toBe('grok-4-1-fast-non-reasoning')
    expect((body.runs as { total: number }).total).toBe(3)
    expect((body.runs as { success: number }).success).toBe(3)
    expect((body.runs as { failed: number }).failed).toBe(0)
    expect(body.latencyMs).toBeDefined()
  })
})