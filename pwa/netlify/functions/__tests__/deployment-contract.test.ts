import { afterEach, describe, expect, it, vi } from 'vitest'

describe('deployment metadata', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  it('uses explicit deployment env vars when present', async () => {
    process.env.BUILD_ID = 'build-123'
    process.env.COMMIT_SHA = 'abc123'
    process.env.DEPLOYED_AT = '2026-03-22T00:00:00.000Z'
    process.env.NETLIFY_DEPLOY_ID = 'deploy-456'
    process.env.CACHE_SCHEMA_VERSION = 'v99'

    const { DEPLOYMENT_METADATA } = await import('../_shared/deployment')

    expect(DEPLOYMENT_METADATA).toEqual({
      buildId: 'build-123',
      commitSha: 'abc123',
      deployedAt: '2026-03-22T00:00:00.000Z',
      netlifyDeployId: 'deploy-456',
      cacheSchemaVersion: 'v99',
    })
  })

  it('falls back to unknown or default cache version when env vars are missing', async () => {
    delete process.env.BUILD_ID
    delete process.env.DEPLOY_ID
    delete process.env.COMMIT_SHA
    delete process.env.COMMIT_REF
    delete process.env.DEPLOYED_AT
    delete process.env.NETLIFY_DEPLOY_ID
    delete process.env.CACHE_SCHEMA_VERSION

    const { DEPLOYMENT_METADATA } = await import('../_shared/deployment')

    expect(DEPLOYMENT_METADATA.buildId).toBe('unknown')
    expect(DEPLOYMENT_METADATA.commitSha).toBe('unknown')
    expect(DEPLOYMENT_METADATA.deployedAt).toBe('unknown')
    expect(DEPLOYMENT_METADATA.netlifyDeployId).toBe('unknown')
    expect(DEPLOYMENT_METADATA.cacheSchemaVersion).toBe('v5')
  })
})

describe('shared response headers', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  it('adds deployment headers and no-store cache control to json responses', async () => {
    process.env.BUILD_ID = 'build-123'
    process.env.COMMIT_SHA = 'abc123'
    process.env.DEPLOYED_AT = '2026-03-22T00:00:00.000Z'
    process.env.NETLIFY_DEPLOY_ID = 'deploy-456'
    process.env.CACHE_SCHEMA_VERSION = 'v99'

    const { jsonResponse } = await import('../_shared/response')
    const response = jsonResponse({ ok: true })

    expect(response.headers.get('Content-Type')).toContain('application/json')
    expect(response.headers.get('Cache-Control')).toContain('no-store')
    expect(response.headers.get('X-Build-Id')).toBe('build-123')
    expect(response.headers.get('X-Commit-Sha')).toBe('abc123')
    expect(response.headers.get('X-Deployed-At')).toBe('2026-03-22T00:00:00.000Z')
    expect(response.headers.get('X-Netlify-Deploy-Id')).toBe('deploy-456')
    expect(response.headers.get('X-Cache-Schema')).toBe('v99')
  })
})

describe('health endpoint contract', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  it('returns deployment metadata alongside health information', async () => {
    process.env.BUILD_ID = 'build-123'
    process.env.COMMIT_SHA = 'abc123'
    process.env.DEPLOYED_AT = '2026-03-22T00:00:00.000Z'
    process.env.NETLIFY_DEPLOY_ID = 'deploy-456'
    process.env.CACHE_SCHEMA_VERSION = 'v99'

    const { default: handler } = await import('../health')
    const response = await handler(new Request('http://localhost/.netlify/functions/health'))
    const body = await response.json() as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.mode).toBeDefined()
    expect(body.timestamp).toBeDefined()
    expect(body.models).toBeDefined()
    expect(body.deployment).toEqual({
      buildId: 'build-123',
      commitSha: 'abc123',
      deployedAt: '2026-03-22T00:00:00.000Z',
      netlifyDeployId: 'deploy-456',
      cacheSchemaVersion: 'v99',
    })
  })
})

describe('explain-source contract', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('includes generatedAt and effectiveModel in mock responses', async () => {
    process.env.MOCK_MODE = 'true'

    const { default: handler } = await import('../explain-source')
    const response = await handler(new Request('http://localhost/.netlify/functions/explain-source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: 'src-1',
        sourceTitle: 'Test Source',
        word: 'awful',
      }),
    }))

    const body = await response.json() as Record<string, unknown>
    expect(response.status).toBe(200)
    expect(body.sourceId).toBe('src-1')
    expect(body.explanation).toBeTypeOf('string')
    expect(body.effectiveModel).toBeDefined()
    expect(body.generatedAt).toBeTypeOf('string')
  })
})