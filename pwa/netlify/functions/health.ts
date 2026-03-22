import type { Config } from '@netlify/functions'
import { getSeedCount } from './_shared/seed-loader.js'
import { INTERPRET_MODEL, EXPLAIN_MODEL } from './_shared/xai-client.js'
import { jsonResponse, optionsResponse } from './_shared/response.js'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse()

  return jsonResponse({
    status: 'ok',
    version: 'pwa-v0.1.0',
    mode: process.env.MOCK_MODE === 'true' ? 'mock' : 'live',
    seedCount: getSeedCount(),
    timestamp: new Date().toISOString(),
    models: {
      interpret: INTERPRET_MODEL,
      explain: EXPLAIN_MODEL,
    },
  })
}

export const config: Config = {
  path: '/.netlify/functions/health',
}
