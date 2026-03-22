import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Allowed model patterns ──────────────────────────────────────────────────
// The xAI models this project is designed to use.  If you see grok-3-mini or
// another legacy model here, the env-var overrides on Netlify are stale.

const EXPECTED_MODEL_PATTERN = /^grok-4/   // must start with "grok-4"
const LEGACY_MODELS = [
  'grok-3-mini',
  'grok-3-mini-fast',
  'grok-2',
  'grok-1',
]

// ─── xai-client model defaults ───────────────────────────────────────────────

describe('xai-client model defaults', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  it('INTERPRET_MODEL defaults to a grok-4 model (no env override)', async () => {
    delete process.env.XAI_MODEL_INTERPRET
    const { INTERPRET_MODEL } = await import('../_shared/xai-client')
    expect(INTERPRET_MODEL).toMatch(EXPECTED_MODEL_PATTERN)
    expect(INTERPRET_MODEL).toBe('grok-4-1-fast-non-reasoning')
  })

  it('EXPLAIN_MODEL defaults to a grok-4 model (no env override)', async () => {
    delete process.env.XAI_MODEL_EXPLAIN
    const { EXPLAIN_MODEL } = await import('../_shared/xai-client')
    expect(EXPLAIN_MODEL).toMatch(EXPECTED_MODEL_PATTERN)
    expect(EXPLAIN_MODEL).toBe('grok-4-1-fast-non-reasoning')
  })

  it('INTERPRET_MODEL is not any known legacy model', async () => {
    delete process.env.XAI_MODEL_INTERPRET
    const { INTERPRET_MODEL } = await import('../_shared/xai-client')
    for (const legacy of LEGACY_MODELS) {
      expect(INTERPRET_MODEL, `INTERPRET_MODEL should not be ${legacy}`).not.toBe(legacy)
    }
  })

  it('EXPLAIN_MODEL is not any known legacy model', async () => {
    delete process.env.XAI_MODEL_EXPLAIN
    const { EXPLAIN_MODEL } = await import('../_shared/xai-client')
    for (const legacy of LEGACY_MODELS) {
      expect(EXPLAIN_MODEL, `EXPLAIN_MODEL should not be ${legacy}`).not.toBe(legacy)
    }
  })

  it('env override is respected for INTERPRET_MODEL', async () => {
    process.env.XAI_MODEL_INTERPRET = 'grok-4-custom-test'
    const { INTERPRET_MODEL } = await import('../_shared/xai-client')
    expect(INTERPRET_MODEL).toBe('grok-4-custom-test')
  })

  it('env override is respected for EXPLAIN_MODEL', async () => {
    process.env.XAI_MODEL_EXPLAIN = 'grok-4-custom-test'
    const { EXPLAIN_MODEL } = await import('../_shared/xai-client')
    expect(EXPLAIN_MODEL).toBe('grok-4-custom-test')
  })
})

// ─── DEEP_DIVE_MODEL ─────────────────────────────────────────────────────────

describe('DEEP_DIVE_MODEL', () => {
  it('DEEP_DIVE_MODEL is a grok-4 model', async () => {
    const { DEEP_DIVE_MODEL } = await import('../_shared/xai-client')
    expect(DEEP_DIVE_MODEL).toMatch(EXPECTED_MODEL_PATTERN)
    for (const legacy of LEGACY_MODELS) {
      expect(DEEP_DIVE_MODEL, `DEEP_DIVE_MODEL should not be ${legacy}`).not.toBe(legacy)
    }
  })
})

// ─── chatComplete sends the correct model to xAI ────────────────────────────

describe('chatComplete sends the correct model in request body', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.XAI_API_KEY = 'test-key-for-unit-tests'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('passes the exact model string to the xAI API', async () => {
    const targetModel = 'grok-4-1-fast-non-reasoning'
    let capturedBody: Record<string, unknown> | null = null

    // Mock global fetch to capture the request body
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string)
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'test response' }, finish_reason: 'stop' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const { chatComplete } = await import('../_shared/xai-client')
    await chatComplete(
      [{ role: 'user', content: 'test' }],
      targetModel,
    )

    expect(capturedBody).not.toBeNull()
    expect(capturedBody!.model).toBe(targetModel)
  })

  it('does not silently change the model to a legacy version', async () => {
    const targetModel = 'grok-4-1-fast-reasoning'
    let capturedBody: Record<string, unknown> | null = null

    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string)
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'test response' }, finish_reason: 'stop' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const { chatComplete } = await import('../_shared/xai-client')
    await chatComplete(
      [{ role: 'user', content: 'test' }],
      targetModel,
    )

    expect(capturedBody).not.toBeNull()
    expect(capturedBody!.model).toBe(targetModel)
    for (const legacy of LEGACY_MODELS) {
      expect(capturedBody!.model, `model in request body should not be ${legacy}`).not.toBe(legacy)
    }
  })

  it('includes reasoning_effort for reasoning models', async () => {
    const reasoningModel = 'grok-4-1-fast-reasoning'
    let capturedBody: Record<string, unknown> | null = null

    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string)
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'test response' }, finish_reason: 'stop' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const { chatComplete } = await import('../_shared/xai-client')
    await chatComplete(
      [{ role: 'user', content: 'test' }],
      reasoningModel,
    )

    expect(capturedBody).not.toBeNull()
    expect(capturedBody!.model).toBe(reasoningModel)
    expect(capturedBody!.reasoning_effort).toBe('medium')
  })

  it('does NOT include reasoning_effort for non-reasoning models', async () => {
    const nonReasoningModel = 'grok-4-1-fast-non-reasoning'
    let capturedBody: Record<string, unknown> | null = null

    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string)
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'test response' }, finish_reason: 'stop' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const { chatComplete } = await import('../_shared/xai-client')
    await chatComplete(
      [{ role: 'user', content: 'test' }],
      nonReasoningModel,
    )

    expect(capturedBody).not.toBeNull()
    expect(capturedBody!.model).toBe(nonReasoningModel)
    expect(capturedBody!.reasoning_effort).toBeUndefined()
  })

  it('sends requests to the correct xAI API base URL', async () => {
    let capturedUrl: string | null = null

    vi.stubGlobal('fetch', async (url: string, _init: RequestInit) => {
      capturedUrl = url
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'test response' }, finish_reason: 'stop' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const { chatComplete } = await import('../_shared/xai-client')
    await chatComplete(
      [{ role: 'user', content: 'test' }],
      'grok-4-1-fast-non-reasoning',
    )

    expect(capturedUrl).toBe('https://api.x.ai/v1/chat/completions')
  })
})

// ─── Settings model options match backend constants ──────────────────────────

describe('frontend model options consistency', () => {
  it('all three expected models are defined as valid ModelChoice types', async () => {
    // ModelChoice is a TypeScript type (erased at runtime), so we parse the source.
    // This catches accidental addition of legacy models to the allowed set.
    const fs = await import('fs')
    const path = await import('path')
    const settingsTypeSrc = fs.readFileSync(
      path.resolve(__dirname, '..', '..', '..', 'src', 'types', 'settings.ts'),
      'utf-8',
    )

    // ModelChoice must include all three grok-4 models
    const expectedModels = [
      'grok-4-1-fast-non-reasoning',
      'grok-4-1-fast-reasoning',
      'grok-4.20-0309-non-reasoning',
    ]
    for (const model of expectedModels) {
      expect(
        settingsTypeSrc,
        `ModelChoice type should include '${model}'`,
      ).toContain(model)
    }

    // Must NOT contain legacy models
    for (const legacy of LEGACY_MODELS) {
      expect(
        settingsTypeSrc,
        `ModelChoice type should NOT include legacy model '${legacy}'`,
      ).not.toContain(legacy)
    }
  })
})
