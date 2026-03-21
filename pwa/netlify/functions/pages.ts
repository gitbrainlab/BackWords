import type { Config } from '@netlify/functions'
import { getPageBySlug, getAllPages } from './_shared/seed-loader.js'
import { jsonResponse, errorResponse, optionsResponse } from './_shared/response.js'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')

  if (!slug) {
    // Return all pages (summary only — no full content)
    const pages = getAllPages().map(
      (p: { pageId: string; title: string; slug: string; summary: string; tags?: string[] }) => ({
        pageId: p.pageId,
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        tags: p.tags ?? [],
      }),
    )
    return jsonResponse({ pages })
  }

  const page = getPageBySlug(slug)
  if (!page) return errorResponse(`No page found for slug "${slug}"`, 404)
  return jsonResponse(page)
}

export const config: Config = {
  path: '/.netlify/functions/pages',
}
