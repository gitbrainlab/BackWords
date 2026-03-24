import { DEPLOYMENT_METADATA } from './deployment.js'

// CORS headers for all API responses
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Benchmark-Key, Authorization',
  'X-Build-Id': DEPLOYMENT_METADATA.buildId,
  'X-Commit-Sha': DEPLOYMENT_METADATA.commitSha,
  'X-Cache-Schema': DEPLOYMENT_METADATA.cacheSchemaVersion,
  'X-Netlify-Deploy-Id': DEPLOYMENT_METADATA.netlifyDeployId,
  'X-Deployed-At': DEPLOYMENT_METADATA.deployedAt,
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      ...CORS_HEADERS,
    },
  })
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status)
}

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
