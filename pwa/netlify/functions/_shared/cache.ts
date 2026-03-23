/**
 * Netlify Blobs cache wrapper for interpret results.
 *
 * Cache key format: `interpret:<normalizedQuery>:<mode>`
 * Errors are swallowed — a cache failure must never break a live request.
 *
 * The SITE_ID / token are wired automatically by the Netlify runtime.
 * Locally the store is a no-op (getStore throws MissingBlobsEnvironmentError,
 * which we catch and treat as a miss).
 */
import { getStore } from '@netlify/blobs'

const STORE_NAME = 'interpret-cache'
const CACHE_SCHEMA_VERSION = 'v5'

function cacheKey(normalizedQuery: string, mode: string, requestedModel: string): string {
  return `${CACHE_SCHEMA_VERSION}:${normalizedQuery}:${mode}:${requestedModel}`
}

/** Returns the cached result or null on miss / any error. */
export async function getCached(normalizedQuery: string, mode: string, requestedModel: string): Promise<unknown | null> {
  try {
    const store = getStore(STORE_NAME)
    const result = await store.get(cacheKey(normalizedQuery, mode, requestedModel), { type: 'json' })
    return result ?? null
  } catch {
    return null
  }
}

/** Stores the result. Failures are silently ignored. */
export async function setCached(normalizedQuery: string, mode: string, requestedModel: string, value: unknown): Promise<void> {
  try {
    const store = getStore(STORE_NAME)
    await store.setJSON(cacheKey(normalizedQuery, mode, requestedModel), value, {
      metadata: { cachedAt: new Date().toISOString() },
    })
  } catch {
    // Non-fatal — proceed without caching
  }
}
