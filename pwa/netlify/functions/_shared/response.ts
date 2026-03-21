// CORS headers for all API responses
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
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
