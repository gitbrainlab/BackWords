/**
 * Live Smoke Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-world tests against the deployed site and API — NO mocked responses.
 * These catch normalizer bugs, blank sections, timeline crashes, and API shape
 * mismatches that the journey.spec.ts mock tests can never catch.
 *
 * Usage:
 *   npm run test:live                                   # headless, against backwords.art
 *   npm run test:live:headed                            # watch it run
 *   LIVE_URL=http://localhost:5173 npm run test:live    # against local dev
 *
 * Outputs:
 *   test-results/screenshots/live-*.png    — full-page screenshots per step
 *   test-results/api-responses/*.json      — raw API payloads for debugging
 *
 * Structure:
 *   Block A (A01–A09): Direct API endpoint tests via fetch() — no browser needed.
 *                      Runs first to fail fast if the backend is down.
 *   Block B (L01–L10): Full browser user journey tests.
 */

import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// ─── Configuration ────────────────────────────────────────────────────────────

// The PWA is hosted on GitHub Pages with the custom domain backwords.art.
// The custom domain serves the app at the SITE root /; the vite base path
// /BackWords/ is only used for asset URLs and the GitHub Pages fallback URL.
// Override with LIVE_URL=http://localhost:5173 for local dev.
const SITE    = process.env.LIVE_URL ?? 'https://backwords.art'
const API_URL = process.env.API_URL  ?? 'https://backwords-api.netlify.app/.netlify/functions'

// How long to wait for the AI API to respond and /result to appear
const RESULT_WAIT_MS = 120_000  // 2 min (grok-4.20 worst-case)

// Words with well-known drift histories — rotate randomly per run for variety
const TEST_WORDS = ['gone', 'nice', 'awful'] as const
type TestWord = typeof TEST_WORDS[number]
const TEST_WORD: TestWord =
  (process.env.TEST_WORD as TestWord) ??
  TEST_WORDS[Math.floor(Math.random() * TEST_WORDS.length)]

// Valid enum sets (mirrors server-side schema)
const VALID_DRIFT_TYPES = new Set([
  'pejoration', 'amelioration', 'narrowing', 'broadening',
  'semantic-shift', 'stable', 'reclamation',
])
const VALID_REGISTERS  = new Set(['formal', 'informal', 'neutral', 'technical', 'vulgar', 'archaic'])
const VALID_SENTIMENTS = new Set(['positive', 'negative', 'neutral'])

// ─── Output helpers ───────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

async function shot(page: Page, name: string) {
  const dir = 'test-results/screenshots'
  ensureDir(dir)
  await page.screenshot({ path: path.join(dir, `live-${name}.png`), fullPage: true })
}

function saveApiResponse(label: string, data: unknown) {
  const dir = 'test-results/api-responses'
  ensureDir(dir)
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  fs.writeFileSync(path.join(dir, `${label}-${ts}.json`), JSON.stringify(data, null, 2))
}

// ─── API fetch helper ─────────────────────────────────────────────────────────

async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ status: number; body: unknown; headers: Record<string, string> }> {
  const url = `${API_URL}/${endpoint}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  let body: unknown = null
  try { body = await res.json() } catch { /* not JSON */ }
  const headers: Record<string, string> = {}
  res.headers.forEach((v, k) => { headers[k] = v })
  return { status: res.status, body, headers }
}

// ─── Browser search helper ────────────────────────────────────────────────────

/**
 * Full search flow: go to home → fill searchbox → click Search → wait for /result.
 * Captures the raw /interpret response on the way through and saves it to disk.
 */
async function searchWord(page: Page, word: string): Promise<Record<string, unknown> | null> {
  let captured: Record<string, unknown> | null = null

  // Set up response listener BEFORE navigation so we never miss it
  page.on('response', async resp => {
    if (resp.url().includes('/interpret') && resp.status() === 200) {
      try {
        const json = await resp.json() as Record<string, unknown>
        captured = json
        saveApiResponse(word, json)
      } catch { /* ignore parse errors */ }
    }
  })

  await page.goto(`${SITE}/`)
  await page.getByRole('searchbox').fill(word)
  await expect(page.getByRole('searchbox')).toHaveValue(word)
  await page.getByRole('button', { name: 'Search' }).click()
  await page.waitForURL('**/result', { timeout: RESULT_WAIT_MS })

  return captured
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK A — Direct API Endpoint Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Block A — API endpoint checks', () => {
  test.setTimeout(30_000)

  test('A01 — GET /health returns ok with seed count', async () => {
    const { status, body } = await apiFetch('health')
    const b = body as Record<string, unknown>

    expect(status).toBe(200)
    expect(b.status).toBe('ok')
    expect(typeof b.seedCount).toBe('number')
    expect(b.seedCount as number).toBeGreaterThanOrEqual(6)
    expect(typeof b.mode).toBe('string')
    expect(typeof b.timestamp).toBe('string')

    test.info().annotations.push({ type: 'response', description: JSON.stringify(body) })
  })

  test('A02 — POST /interpret with seed word (useMock) returns valid shape', async () => {
    const { status, body } = await apiFetch('interpret', {
      method: 'POST',
      body: JSON.stringify({ query: 'awful', useMock: true }),
    })
    const b = body as Record<string, unknown>

    expect(status).toBe(200)
    expect(b.query).toBe('awful')

    // currentSnapshot
    const cs = b.currentSnapshot as Record<string, unknown>
    expect(typeof cs?.definition).toBe('string')
    expect((cs.definition as string).length).toBeGreaterThan(0)
    expect(VALID_REGISTERS.has(cs.register as string),
      `unexpected register "${cs.register}"`).toBe(true)
    expect(VALID_SENTIMENTS.has(cs.sentiment as string),
      `unexpected sentiment "${cs.sentiment}"`).toBe(true)

    // historicalSnapshots
    expect(Array.isArray(b.historicalSnapshots)).toBe(true)

    // summaryOfChange
    const soc = b.summaryOfChange as Record<string, unknown>
    expect(VALID_DRIFT_TYPES.has(soc?.driftType as string),
      `unexpected driftType "${soc?.driftType}"`).toBe(true)
    expect(typeof soc?.driftMagnitude).toBe('number')
    expect(soc.driftMagnitude as number).toBeGreaterThanOrEqual(0)
    expect(soc.driftMagnitude as number).toBeLessThanOrEqual(1)

    saveApiResponse('A02-awful-mock', body)
  })

  test('A03 — POST /interpret live word passes normalizer checks', async () => {
    test.setTimeout(RESULT_WAIT_MS + 10_000)

    const word = 'pile'  // deterministic word for API tests (not random)
    const { status, body } = await apiFetch('interpret', {
      method: 'POST',
      body: JSON.stringify({ query: word }),
    })
    const b = body as Record<string, unknown>

    expect(status).toBe(200)
    saveApiResponse(`A03-${word}-live`, body)

    const isoDateRe = /^\d{4}-\d{2}-\d{2}/

    // currentSnapshot
    const cs = b.currentSnapshot as Record<string, unknown>
    expect(isoDateRe.test(cs.date as string),
      `currentSnapshot.date "${cs.date}" is not ISO8601`).toBe(true)
    expect((cs.definition as string).length,
      'currentSnapshot.definition is empty').toBeGreaterThan(0)

    // historicalSnapshots
    const historical = b.historicalSnapshots as Record<string, unknown>[]
    expect(Array.isArray(historical)).toBe(true)
    expect(historical.length,
      'historicalSnapshots is empty').toBeGreaterThanOrEqual(1)
    for (const snap of historical) {
      expect(isoDateRe.test(snap.date as string),
        `historicalSnapshot date "${snap.date}" is not ISO8601`).toBe(true)
      expect((snap.definition as string).length,
        'historicalSnapshot definition is empty').toBeGreaterThan(0)
    }

    // keyDates
    const keyDates = b.keyDates as Record<string, unknown>[]
    if (Array.isArray(keyDates) && keyDates.length > 0) {
      for (const kd of keyDates) {
        expect((kd.label as string).length,
          'keyDate label is empty').toBeGreaterThan(0)
        expect(isoDateRe.test(kd.date as string),
          `keyDate date "${kd.date}" is not ISO8601`).toBe(true)
      }
    }

    // sources
    const sources = b.sources as Record<string, unknown>[]
    if (Array.isArray(sources) && sources.length > 0) {
      for (const src of sources) {
        expect((src.title as string).length,
          'source title is empty').toBeGreaterThan(0)
        expect(src.title as string,
          'source title is placeholder "Unnamed Source"').not.toBe('Unnamed Source')
      }
    }

    // relatedConcepts
    const concepts = b.relatedConcepts as Record<string, unknown>[]
    if (Array.isArray(concepts) && concepts.length > 0) {
      for (const c of concepts) {
        expect((c.label as string).length,
          'relatedConcept label is empty').toBeGreaterThan(0)
      }
    }

    test.info().annotations.push({
      type: 'field-counts',
      description: [
        `keyDates:${Array.isArray(b.keyDates) ? (b.keyDates as unknown[]).length : 'missing'}`,
        `sources:${Array.isArray(b.sources) ? (b.sources as unknown[]).length : 'missing'}`,
        `relatedConcepts:${Array.isArray(b.relatedConcepts) ? (b.relatedConcepts as unknown[]).length : 'missing'}`,
      ].join(' '),
    })
  })

  test('A04 — POST /interpret rejects empty query with 400', async () => {
    const { status, body } = await apiFetch('interpret', {
      method: 'POST',
      body: JSON.stringify({ query: '' }),
    })
    expect(status).toBe(400)
    expect((body as Record<string, unknown>).error).toBeTruthy()
  })

  test('A05 — POST /interpret rejects oversized query with 400', async () => {
    const { status, body } = await apiFetch('interpret', {
      method: 'POST',
      body: JSON.stringify({ query: 'a'.repeat(2001) }),
    })
    expect(status).toBe(400)
    expect((body as Record<string, unknown>).error).toBeTruthy()
  })

  test('A06 — POST /explain-source (mock) returns explanation', async () => {
    const { status, body } = await apiFetch('explain-source', {
      method: 'POST',
      body: JSON.stringify({
        sourceId:    'test-src-01',
        sourceTitle: 'Oxford English Dictionary',
        word:        'awful',
        useMock:     true,
      }),
    })
    const b = body as Record<string, unknown>

    expect(status).toBe(200)
    expect(b.sourceId).toBe('test-src-01')
    expect(typeof b.explanation).toBe('string')
    expect((b.explanation as string).length,
      'explanation is too short').toBeGreaterThan(10)
  })

  test('A07 — GET /pages returns at least 5 pages', async () => {
    const { status, body } = await apiFetch('pages')
    const b = body as Record<string, unknown>

    expect(status).toBe(200)
    expect(Array.isArray(b.pages)).toBe(true)
    const pages = b.pages as Record<string, unknown>[]
    expect(pages.length,
      `expected ≥5 pages, got ${pages.length}`).toBeGreaterThanOrEqual(5)
    for (const p of pages) {
      expect(typeof p.slug).toBe('string')
      expect((p.slug as string).length).toBeGreaterThan(0)
      expect(typeof p.title).toBe('string')
      expect((p.title as string).length).toBeGreaterThan(0)
    }
  })

  test('A08 — GET /pages?slug=pejoration returns single page', async () => {
    const { status, body } = await apiFetch('pages?slug=pejoration')
    const b = body as Record<string, unknown>

    expect(status).toBe(200)
    expect(b.slug).toBe('pejoration')
    expect(typeof b.title).toBe('string')
    expect((b.title as string).length).toBeGreaterThan(0)
  })

  test('A09 — OPTIONS /interpret returns CORS headers', async () => {
    const { status, headers } = await apiFetch('interpret', { method: 'OPTIONS' })

    expect(status).toBe(204)
    expect(headers['access-control-allow-origin'],
      'CORS access-control-allow-origin header missing').toBeTruthy()
    expect(headers['access-control-allow-methods'],
      'CORS access-control-allow-methods missing POST').toContain('POST')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK B — Browser User Journey Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Block B — UI journeys', () => {
  test.setTimeout(RESULT_WAIT_MS + 30_000)

  test('L01 — Home page loads with heading and searchbox', async ({ page }) => {
    await page.goto(`${SITE}/`)
    await expect(page.getByRole('heading', { name: 'BackWords' })).toBeVisible()
    await expect(page.getByRole('searchbox')).toBeVisible()
    await shot(page, '01-home')
  })

  test('L02 — Loading screen shows the searched word and a progress bar', async ({ page }) => {
    await page.goto(`${SITE}/`)
    await page.getByRole('searchbox').fill(TEST_WORD)
    await page.getByRole('button', { name: 'Search' }).click()

    // Should immediately navigate to /searching
    await page.waitForURL('**/searching', { timeout: 8_000 })
    await shot(page, '02-searching')

    // Word must be visible — not blank (was a real production bug)
    const container = page.locator('[aria-label="Searching…"]')
    await expect(container).toBeVisible()
    await expect(container).toContainText(TEST_WORD)

    // Progress bar must exist
    await expect(page.getByRole('progressbar', { name: 'Search progress' })).toBeVisible()

    // Wait for API to complete
    await page.waitForURL('**/result', { timeout: RESULT_WAIT_MS })
    await shot(page, '02-result-loaded')
  })

  test('L03 — Result page: all sections populated (no blank / placeholder content)', async ({ page }) => {
    const payload = await searchWord(page, TEST_WORD)
    await shot(page, '03-result-full')

    // Word heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText(TEST_WORD)

    // Summary banner — must have substantive text
    const banner = page.getByTestId('summary-banner')
    await expect(banner).toBeVisible()
    const bannerText = await banner.innerText()
    expect(bannerText.trim().length,
      'Summary banner is blank').toBeGreaterThan(10)

    // Drift meter
    await expect(page.getByRole('meter', { name: /drift magnitude/i })).toBeVisible()

    // "Then" snapshot — definition must not be blank
    const thenCard = page.getByTestId('snapshot-then')
    await expect(thenCard).toBeVisible()
    const thenDef = await thenCard.locator('p').first().textContent()
    expect(
      thenDef?.replace('Definition not recorded', '').trim().length ?? 0,
      '"Then" definition is blank',
    ).toBeGreaterThan(2)

    // "Now" snapshot — definition must not be blank
    const nowCard = page.getByTestId('snapshot-now')
    await expect(nowCard).toBeVisible()
    const nowDef = await nowCard.locator('p').first().textContent()
    expect(
      nowDef?.replace('Definition not recorded', '').trim().length ?? 0,
      '"Now" definition is blank',
    ).toBeGreaterThan(2)

    await shot(page, '03-snapshots')

    // Key Moments — non-empty labels
    const keySection = page.getByLabel('Key dates')
    if (await keySection.isVisible()) {
      const items = keySection.locator('li')
      const count = await items.count()
      expect(count, 'Key Moments section is empty').toBeGreaterThan(0)
      for (let i = 0; i < Math.min(count, 4); i++) {
        const label = await items.nth(i).locator('strong').textContent()
        expect(
          label?.trim().replace(/\?/g, '').length ?? 0,
          `Key Moment ${i} label is blank or "?"`,
        ).toBeGreaterThan(0)
      }
      await shot(page, '03-key-moments')
    }

    // Sources — titles must not be blank or "Unnamed Source"
    const sourcesSection = page.getByLabel('Historical sources')
    if (await sourcesSection.isVisible()) {
      const cards = sourcesSection.getByTestId('source-card')
      const cardCount = await cards.count()
      expect(cardCount, 'Sources section is empty').toBeGreaterThan(0)
      for (let i = 0; i < Math.min(cardCount, 4); i++) {
        const title = await cards.nth(i).locator('h3').textContent()
        expect(title?.trim().length ?? 0, `Source ${i} title is empty`).toBeGreaterThan(0)
        expect(title?.trim(), `Source ${i} has placeholder "Unnamed Source"`).not.toBe('Unnamed Source')
      }
      await shot(page, '03-sources')
    }

    // Related Concepts — chip text must not be blank
    const conceptsSection = page.getByLabel('Related concepts')
    if (await conceptsSection.isVisible()) {
      const chips = conceptsSection.locator('[class*="chip"]')
      const chipCount = await chips.count()
      for (let i = 0; i < Math.min(chipCount, 4); i++) {
        const text = await chips.nth(i).textContent()
        expect(text?.trim().length ?? 0, `Concept chip ${i} is blank`).toBeGreaterThan(0)
      }
      await shot(page, '03-concepts')
    }

    if (payload) {
      test.info().annotations.push({
        type: 'api-field-counts',
        description: [
          `keyDates:${Array.isArray(payload.keyDates) ? (payload.keyDates as unknown[]).length : '?'}`,
          `sources:${Array.isArray(payload.sources) ? (payload.sources as unknown[]).length : '?'}`,
          `relatedConcepts:${Array.isArray(payload.relatedConcepts) ? (payload.relatedConcepts as unknown[]).length : '?'}`,
        ].join(' '),
      })
    }
  })

  test('L04 — Timeline renders without crashing', async ({ page }) => {
    await searchWord(page, TEST_WORD)
    await page.getByTestId('view-timeline-btn').click()
    await page.waitForURL('**/timeline', { timeout: 10_000 })
    await shot(page, '04-timeline')

    // Error boundary must NOT be triggered
    await expect(
      page.getByText('Could not build the timeline'),
      'Timeline error boundary was triggered',
    ).not.toBeVisible()

    // Scrubber must have at least one era button
    const scrubber = page.getByTestId('timeline-scrubber')
    await expect(scrubber).toBeVisible()
    const btnCount = await scrubber.getByRole('button').count()
    expect(btnCount, 'Timeline scrubber has no era buttons').toBeGreaterThan(0)

    // Event list must be non-empty with real content
    const events = page.getByLabel('Timeline events').locator('li')
    const evCount = await events.count()
    expect(evCount, 'Timeline event list is empty').toBeGreaterThan(0)
    for (let i = 0; i < Math.min(evCount, 3); i++) {
      const text = await events.nth(i).textContent()
      expect(text?.trim().length ?? 0, `Timeline event ${i} is blank`).toBeGreaterThan(5)
    }
    await shot(page, '04-timeline-events')
  })

  test('L05 — Source detail page loads from result', async ({ page }) => {
    await searchWord(page, TEST_WORD)

    const cards = page.getByTestId('source-card')
    const count = await cards.count()

    if (count === 0) {
      test.info().annotations.push({
        type: 'skipped-reason',
        description: 'No source cards rendered — normalizer may have produced 0 sources for this word',
      })
      test.skip(true, 'No source cards present')
      return
    }

    await cards.first().getByText('Details →').click()
    await page.waitForURL('**/source/**', { timeout: 10_000 })
    await shot(page, '05-source-detail')
    await expect(page.getByTestId('source-citation')).toBeVisible()
  })

  test('L06 — Settings: three model cards each show ⏱ and 💰 chips', async ({ page }) => {
    await page.goto(`${SITE}/settings`)
    await shot(page, '06-settings')

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    const modelSection = page.getByLabel('AI Model')
    await expect(modelSection, 'AI Model fieldset not visible').toBeVisible()

    const cards = modelSection.getByRole('radio')
    const count = await cards.count()
    expect(count, `Expected 3 model radio cards, got ${count}`).toBe(3)

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      await expect(card, `Model card ${i} missing ⏱ chip`).toContainText('⏱')
      await expect(card, `Model card ${i} missing 💰 chip`).toContainText('💰')
    }

    await shot(page, '06-settings-models')
  })

  test('L07 — /timeline route guard redirects to home (no result in memory)', async ({ page }) => {
    // GitHub Pages serves a 404 for SPA sub-routes on direct navigation.
    // Intercept and serve the root index.html so React Router handles the URL,
    // then verify the Route guard fires: useEffect → navigate('/', replace).
    await page.route(`${SITE}/timeline`, async route => {
      const res = await route.fetch({ url: `${SITE}/` })
      await route.fulfill({ response: res })
    })
    await page.goto(`${SITE}/timeline`)
    await page.waitForURL(`${SITE}/`, { timeout: 8_000 })
    await expect(page.getByRole('searchbox')).toBeVisible()
    await shot(page, '07-timeline-redirect')
  })

  test('L08 — /result route guard redirects to home (no result in memory)', async ({ page }) => {
    await page.route(`${SITE}/result`, async route => {
      const res = await route.fetch({ url: `${SITE}/` })
      await route.fulfill({ response: res })
    })
    await page.goto(`${SITE}/result`)
    await page.waitForURL(`${SITE}/`, { timeout: 8_000 })
    await expect(page.getByRole('searchbox')).toBeVisible()
    await shot(page, '08-result-redirect')
  })

  test('L09 — Nonsense word: result or error UI shown, not a crash', async ({ page }) => {
    const nonsense = 'xyzzyplugh42'
    await page.goto(`${SITE}/`)
    await page.getByRole('searchbox').fill(nonsense)
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL('**/searching', { timeout: 8_000 })
    await shot(page, '09-nonsense-searching')

    try {
      // If the AI invents a plausible result, /result should load normally
      await page.waitForURL('**/result', { timeout: RESULT_WAIT_MS })
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await shot(page, '09-nonsense-result')
    } catch {
      // If it stays on /searching, an error / retry message must be shown
      const errVisible = await page
        .getByText(/error|failed|try again|something went wrong/i)
        .isVisible()
      expect(errVisible,
        'No error message shown after nonsense search — possible silent crash').toBe(true)
      await shot(page, '09-nonsense-error')
    }
  })

  test('L10 — Full roundtrip: home → result → timeline → back → home with timing', async ({ page }) => {
    const t0 = Date.now()
    await page.goto(`${SITE}/`)
    await shot(page, '10-start')

    // Trigger a search
    await page.getByRole('searchbox').fill('pile')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL('**/result', { timeout: RESULT_WAIT_MS })
    const tResult = Date.now()
    await shot(page, '10-result')

    // Navigate to timeline
    await page.getByTestId('view-timeline-btn').click()
    await page.waitForURL('**/timeline', { timeout: 10_000 })
    await shot(page, '10-timeline')

    // Back to results
    await page.getByRole('button', { name: 'Back to results' }).click()
    await page.waitForURL('**/result', { timeout: 8_000 })

    // Back to home
    await page.getByRole('button', { name: 'Back to search' }).click()
    await page.waitForURL(`${SITE}/`, { timeout: 8_000 })
    await shot(page, '10-home-end')

    const tTotal = Date.now()
    test.info().annotations.push(
      { type: 'timing-api-ms',   description: String(tResult - t0) },
      { type: 'timing-total-ms', description: String(tTotal - t0) },
    )
  })
})
