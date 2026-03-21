/**
 * Live Matrix Tests — expanded quality coverage
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers unfeatured words, phrase mode, paragraph mode, all three AI models,
 * and deep UI drill-downs not covered by live-smoke.spec.ts.
 *
 * Run deliberately (this suite is intentionally slow and calls the AI API):
 *   npm run test:matrix                # headless
 *   npm run test:matrix:headed         # watch it run
 *   npm run test:matrix:debug          # step-through debugging
 *
 * Per-run artifact outputs:
 *   test-results/screenshots/matrix-*.png    — full-page screenshots
 *   test-results/api-responses/matrix-*.json — raw API payloads per input/model
 *
 * Block filter (skip expensive blocks during development):
 *   MATRIX_BLOCKS=C,E npm run test:matrix   # unfeatured words + UI journeys only
 *   MATRIX_BLOCKS=D   npm run test:matrix   # model matrix only
 *
 * Structure:
 *   Block C (C01–C05): API richness checks for unfeatured words & phrase mode
 *   Block D (D01–D03): Model quality matrix — same word × all three models
 *   Block E (E01–E06): Deep browser UI journeys not covered by live-smoke
 */

import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// ─── Configuration ────────────────────────────────────────────────────────────

const SITE    = process.env.LIVE_URL ?? 'https://backwords.art'
const API_URL = process.env.API_URL  ?? 'https://backwords-api.netlify.app/.netlify/functions'

// Allow full grok-3 response time (up to 90 s) plus network and test overhead
const RESULT_WAIT_MS  = 120_000
const EXPLAIN_WAIT_MS = 45_000

// Block filter: set MATRIX_BLOCKS=C,D to run only those blocks (all enabled by default)
const ENABLED_BLOCKS = process.env.MATRIX_BLOCKS
  ? new Set(process.env.MATRIX_BLOCKS.toUpperCase().split(',').map(s => s.trim()))
  : new Set(['C', 'D', 'E'])

function blockEnabled(block: string) { return ENABLED_BLOCKS.has(block) }

// ─── Output helpers ───────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

async function shot(page: Page, name: string) {
  const dir = 'test-results/screenshots'
  ensureDir(dir)
  await page.screenshot({ path: path.join(dir, `matrix-${name}.png`), fullPage: true })
}

function saveApiResponse(label: string, data: unknown) {
  const dir = 'test-results/api-responses'
  ensureDir(dir)
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  fs.writeFileSync(
    path.join(dir, `matrix-${label}-${ts}.json`),
    JSON.stringify(data, null, 2),
  )
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
  try { body = await res.json() } catch { /* non-JSON response */ }
  const headers: Record<string, string> = {}
  res.headers.forEach((v, k) => { headers[k] = v })
  return { status: res.status, body, headers }
}

// ─── Richness assertion helper ────────────────────────────────────────────────

/**
 * Assert minimum richness for a live AI response body.
 * All assertions carry a label so failures immediately identify which test input failed.
 */
function assertRichness(b: Record<string, unknown>, label: string) {
  const isoDateRe = /^\d{4}-\d{2}-\d{2}/

  // currentSnapshot — definition must be a substantive string
  const cs = b.currentSnapshot as Record<string, unknown>
  expect(typeof cs?.definition, `[${label}] currentSnapshot.definition missing`).toBe('string')
  expect(
    (cs.definition as string).length,
    `[${label}] currentSnapshot.definition is empty`,
  ).toBeGreaterThan(10)

  // historicalSnapshots — at least one entry with real content
  const historical = b.historicalSnapshots as Record<string, unknown>[]
  expect(Array.isArray(historical), `[${label}] historicalSnapshots not an array`).toBe(true)
  expect(
    historical.length,
    `[${label}] historicalSnapshots is empty`,
  ).toBeGreaterThanOrEqual(1)
  for (const snap of historical) {
    expect(
      (snap.definition as string).length,
      `[${label}] historicalSnapshot.definition is empty`,
    ).toBeGreaterThan(0)
    expect(
      isoDateRe.test(snap.date as string),
      `[${label}] historicalSnapshot date "${snap.date}" is not ISO8601`,
    ).toBe(true)
  }

  // summaryOfChange — shortSummary must be non-trivial
  const soc = b.summaryOfChange as Record<string, unknown>
  expect(typeof soc?.shortSummary, `[${label}] summaryOfChange.shortSummary missing`).toBe('string')
  expect(
    (soc.shortSummary as string).length,
    `[${label}] summaryOfChange.shortSummary is empty`,
  ).toBeGreaterThan(5)

  // keyDates — at least one entry; no "?" placeholder labels
  const keyDates = b.keyDates as Record<string, unknown>[]
  expect(
    Array.isArray(keyDates) && keyDates.length >= 1,
    `[${label}] keyDates is empty or missing`,
  ).toBe(true)
  for (const kd of keyDates) {
    expect(
      (kd.label as string).length,
      `[${label}] keyDate label is empty`,
    ).toBeGreaterThan(0)
    expect(
      (kd.label as string).replace(/\?/g, '').trim().length,
      `[${label}] keyDate label is a "?" placeholder`,
    ).toBeGreaterThan(0)
    expect(
      isoDateRe.test(kd.date as string),
      `[${label}] keyDate date "${kd.date}" is not ISO8601`,
    ).toBe(true)
  }

  // sources — at least one; no "Unnamed Source" titles
  const sources = b.sources as Record<string, unknown>[]
  expect(
    Array.isArray(sources) && sources.length >= 1,
    `[${label}] sources is empty or missing`,
  ).toBe(true)
  for (const src of sources) {
    expect(
      (src.title as string).length,
      `[${label}] source title is empty`,
    ).toBeGreaterThan(0)
    expect(
      src.title as string,
      `[${label}] source has placeholder title "Unnamed Source"`,
    ).not.toBe('Unnamed Source')
  }

  // relatedConcepts — if present, every label must be non-empty
  const concepts = b.relatedConcepts
  if (Array.isArray(concepts) && concepts.length > 0) {
    for (const c of concepts as Record<string, unknown>[]) {
      expect(
        (c.label as string).length,
        `[${label}] relatedConcept label is empty`,
      ).toBeGreaterThan(0)
    }
  }
}

// ─── Field density helper ─────────────────────────────────────────────────────

/** Capture counts for every array field so the HTML report shows richness per run. */
function countFields(b: Record<string, unknown>): Record<string, number | string> {
  const soc = (b.summaryOfChange as Record<string, unknown> | null) ?? {}
  return {
    historicalSnapshots: Array.isArray(b.historicalSnapshots)
      ? (b.historicalSnapshots as unknown[]).length : 0,
    keyDates:       Array.isArray(b.keyDates)       ? (b.keyDates as unknown[]).length       : 0,
    sources:        Array.isArray(b.sources)        ? (b.sources as unknown[]).length        : 0,
    timelineEvents: Array.isArray(b.timelineEvents) ? (b.timelineEvents as unknown[]).length : 0,
    relatedWorks:   Array.isArray(b.relatedWorks)   ? (b.relatedWorks as unknown[]).length   : 0,
    relatedConcepts:Array.isArray(b.relatedConcepts)? (b.relatedConcepts as unknown[]).length: 0,
    summaryLen: typeof soc.longSummary === 'string' ? soc.longSummary.length : 0,
    passagePresent: b.passage != null ? 'yes' : 'no',
  }
}

// ─── Browser search helpers ───────────────────────────────────────────────────

async function searchWord(page: Page, word: string): Promise<Record<string, unknown> | null> {
  let captured: Record<string, unknown> | null = null
  page.on('response', async resp => {
    if (resp.url().includes('/interpret') && resp.status() === 200) {
      try {
        const json = await resp.json() as Record<string, unknown>
        captured = json
        saveApiResponse(word.replace(/\s+/g, '-'), json)
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

async function searchPhrase(page: Page, phrase: string): Promise<Record<string, unknown> | null> {
  let captured: Record<string, unknown> | null = null
  page.on('response', async resp => {
    if (resp.url().includes('/interpret') && resp.status() === 200) {
      try {
        const json = await resp.json() as Record<string, unknown>
        captured = json
        saveApiResponse(`phrase-${phrase.replace(/\s+/g, '-')}`, json)
      } catch { /* ignore parse errors */ }
    }
  })
  await page.goto(`${SITE}/`)
  // Switch to Phrase mode via the mode picker radio group
  await page.getByRole('radio', { name: 'Phrase' }).click()
  await expect(page.getByRole('radio', { name: 'Phrase' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('searchbox').fill(phrase)
  await page.getByRole('button', { name: 'Search' }).click()
  await page.waitForURL('**/result', { timeout: RESULT_WAIT_MS })
  return captured
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK C — API Richness for Unfeatured Words & Phrase Mode
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Block C — API richness: unfeatured words & phrases', () => {
  // Allow 2.5 min for slow grok responses plus network overhead
  test.setTimeout(RESULT_WAIT_MS + 30_000)

  test.beforeEach(() => {
    test.skip(!blockEnabled('C'), 'Block C disabled via MATRIX_BLOCKS env')
  })

  test('C01 — doggone (unfeatured slang word) returns rich response', async () => {
    const word = 'doggone'
    const { status, body } = await apiFetch('interpret', {
      method: 'POST',
      body: JSON.stringify({ query: word }),
    })
    const b = body as Record<string, unknown>
    expect(status).toBe(200)
    saveApiResponse(`C01-${word}`, body)

    assertRichness(b, `C01:${word}`)

    // Slang/informal words should still provide ≥2 sources and ≥2 key dates
    expect(
      (b.keyDates as unknown[]).length,
      'C01 keyDates should have ≥2 entries',
    ).toBeGreaterThanOrEqual(2)
    expect(
      (b.sources as unknown[]).length,
      'C01 sources should have ≥2 entries',
    ).toBeGreaterThanOrEqual(2)
    expect(
      Array.isArray(b.relatedConcepts) && (b.relatedConcepts as unknown[]).length >= 1,
      'C01 relatedConcepts should have ≥1 entry',
    ).toBe(true)

    test.info().annotations.push({
      type: 'field-counts',
      description: JSON.stringify(countFields(b)),
    })
  })

  test('C02 — dagnabbit (unfeatured slang word) returns rich response with no placeholders', async () => {
    const word = 'dagnabbit'
    const { status, body } = await apiFetch('interpret', {
      method: 'POST',
      body: JSON.stringify({ query: word }),
    })
    const b = body as Record<string, unknown>
    expect(status).toBe(200)
    saveApiResponse(`C02-${word}`, body)

    // This is the word observed showing "?" placeholders and blank sections in production.
    // All standard richness rules must pass.
    assertRichness(b, `C02:${word}`)

    // currentSnapshot.definition must be substantive (describe modern usage, not just "current usage")
    const cs = b.currentSnapshot as Record<string, unknown>
    expect(
      (cs.definition as string).length,
      'C02 currentSnapshot.definition too short — should describe modern colloquial usage',
    ).toBeGreaterThan(50)

    // Sources ≥2 (must use newspapers, word-study archives, or etymology sources for slang)
    expect(
      (b.sources as unknown[]).length,
      'C02 sources should have ≥2 entries',
    ).toBeGreaterThanOrEqual(2)

    test.info().annotations.push({
      type: 'field-counts',
      description: JSON.stringify(countFields(b)),
    })
  })

  test('C03 — phrase "bread and butter" (well-documented) returns rich phrase response', async () => {
    const phrase = 'bread and butter'
    const { status, body } = await apiFetch('interpret', {
      method: 'POST',
      body: JSON.stringify({ query: phrase, mode: 'phrase' }),
    })
    const b = body as Record<string, unknown>
    expect(status).toBe(200)
    expect(b.mode, 'mode should be "phrase"').toBe('phrase')
    saveApiResponse(`C03-${phrase.replace(/\s+/g, '-')}`, body)

    assertRichness(b, `C03:${phrase}`)

    // Phrase shortSummary should describe the phrase's semantic journey, not just a stub
    const soc = b.summaryOfChange as Record<string, unknown>
    expect(
      (soc.shortSummary as string).length,
      'C03 shortSummary too short for a well-documented phrase',
    ).toBeGreaterThan(20)

    test.info().annotations.push({
      type: 'field-counts',
      description: JSON.stringify(countFields(b)),
    })
  })

  test('C04 — phrase "who you gonna call" (pop-culture phrase) meets minimum richness', async () => {
    const phrase = 'who you gonna call'
    const { status, body } = await apiFetch('interpret', {
      method: 'POST',
      body: JSON.stringify({ query: phrase, mode: 'phrase' }),
    })
    const b = body as Record<string, unknown>
    expect(status).toBe(200)
    expect(b.mode, 'mode should be "phrase"').toBe('phrase')
    saveApiResponse(`C04-${phrase.replace(/\s+/g, '-')}`, body)

    // This phrase has thin academic sources; we apply a lighter threshold.
    // currentSnapshot must still describe modern usage meaningfully.
    const cs = b.currentSnapshot as Record<string, unknown>
    expect(
      (cs.definition as string).length,
      'C04 currentSnapshot.definition is empty',
    ).toBeGreaterThan(10)

    // At least 1 source and 1 key date must be present for any interpretable phrase
    expect(
      Array.isArray(b.sources) && (b.sources as unknown[]).length >= 1,
      'C04 sources must have ≥1 entry',
    ).toBe(true)
    expect(
      Array.isArray(b.keyDates) && (b.keyDates as unknown[]).length >= 1,
      'C04 keyDates must have ≥1 entry',
    ).toBe(true)

    // summaryOfChange must be non-empty
    const soc = b.summaryOfChange as Record<string, unknown>
    expect(
      ((soc.shortSummary as string) ?? '').length,
      'C04 shortSummary is empty',
    ).toBeGreaterThan(5)

    test.info().annotations.push({
      type: 'field-counts',
      description: JSON.stringify(countFields(b)),
    })
  })

  test('C05 — live explain-source for doggone source returns substantive explanation', async () => {
    // Step 1: get a real sourceId from an interpret call
    const interpretRes = await apiFetch('interpret', {
      method: 'POST',
      body: JSON.stringify({ query: 'doggone' }),
    })
    const interpretBody = interpretRes.body as Record<string, unknown>
    expect(interpretRes.status).toBe(200)

    const sources = interpretBody.sources as Record<string, unknown>[] | undefined
    if (!Array.isArray(sources) || sources.length === 0) {
      test.info().annotations.push({
        type: 'skipped-reason',
        description: 'No sources returned for "doggone" — interpret quality issue caught by C01',
      })
      test.skip(true, 'No sources returned by interpret — skipping explain-source')
      return
    }

    // Step 2: call explain-source with a real source
    const firstSource = sources[0]
    const { status, body } = await apiFetch('explain-source', {
      method: 'POST',
      body: JSON.stringify({
        sourceId:    String(firstSource.sourceId ?? 'doggone-src-1'),
        sourceTitle: String(firstSource.title ?? 'Unknown'),
        word:        'doggone',
      }),
    })
    const b = body as Record<string, unknown>

    expect(status).toBe(200)
    expect(typeof b.explanation, 'C05 explanation field missing').toBe('string')
    expect(
      (b.explanation as string).length,
      'C05 explanation is too short to be meaningful',
    ).toBeGreaterThan(50)

    saveApiResponse('C05-doggone-explain', body)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK D — Model Quality Matrix
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Block D — Model quality matrix: grok-4-1-fast-non-reasoning | grok-4-1-fast-reasoning | grok-4.20-0309-non-reasoning', () => {
  // Add 60 s to handle grok-4.20 responses
  test.setTimeout(RESULT_WAIT_MS + 60_000)

  test.beforeEach(() => {
    test.skip(!blockEnabled('D'), 'Block D disabled via MATRIX_BLOCKS env')
  })

  // Representative word chosen for this matrix: it's unfeatured (not in seed data),
  // informal, has well-documented American English etymology, and is the same word
  // showing the real production quality gap observed in testing.
  const MATRIX_WORD = 'doggone'

  const MODELS = [
    { id: 'grok-4-1-fast-non-reasoning', label: 'D01' },
    { id: 'grok-4-1-fast-reasoning',     label: 'D02' },
    { id: 'grok-4.20-0309-non-reasoning',label: 'D03' },
  ] as const

  for (const { id: modelId, label } of MODELS) {
    test(
      `${label} — model:${modelId} interprets "${MATRIX_WORD}" and clears minimum richness bar`,
      async () => {
        const t0 = performance.now()
        const { status, body } = await apiFetch('interpret', {
          method: 'POST',
          body: JSON.stringify({ query: MATRIX_WORD, model: modelId }),
        })
        const latencyMs = Math.round(performance.now() - t0)
        const b = body as Record<string, unknown>

        expect(status, `${label} HTTP status`).toBe(200)
        saveApiResponse(`${label}-${modelId}-${MATRIX_WORD}`, body)

        // Every model must clear the same baseline richness bar
        assertRichness(b, `${label}:${modelId}`)

        const counts = countFields(b)
        test.info().annotations.push(
          { type: 'model',        description: modelId },
          { type: 'latency-ms',   description: String(latencyMs) },
          { type: 'field-counts', description: JSON.stringify(counts) },
        )

        // Print a single comparable summary line visible in the console output
        const summary = [
          `model=${modelId}`,
          `latency=${latencyMs}ms`,
          ...Object.entries(counts).map(([k, v]) => `${k}=${v}`),
        ].join(' | ')
        console.log(`[matrix] ${summary}`)
      },
    )
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK E — Deep Browser UI Journeys
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Block E — Deep UI journeys', () => {
  test.setTimeout(RESULT_WAIT_MS + 60_000)

  test.beforeEach(() => {
    test.skip(!blockEnabled('E'), 'Block E disabled via MATRIX_BLOCKS env')
  })

  test('E01 — Phrase mode: home → result → all sections populated → back navigation', async ({ page }) => {
    const payload = await searchPhrase(page, 'bread and butter')
    await shot(page, 'E01-phrase-result')

    // Heading should reflect the phrase
    await expect(page.getByRole('heading', { level: 1 })).toContainText('bread')

    // Summary banner must be non-empty
    const banner = page.getByTestId('summary-banner')
    await expect(banner).toBeVisible()
    expect((await banner.innerText()).trim().length, 'E01 summary banner is blank').toBeGreaterThan(10)

    // Then card — definition must be non-empty
    const thenCard = page.getByTestId('snapshot-then')
    await expect(thenCard).toBeVisible()
    const thenDef = await thenCard.locator('p').first().textContent()
    expect(
      thenDef?.replace('Definition not recorded', '').trim().length ?? 0,
      'E01 Then definition is blank',
    ).toBeGreaterThan(2)

    // Now card — definition must be non-empty
    const nowCard = page.getByTestId('snapshot-now')
    await expect(nowCard).toBeVisible()
    const nowDef = await nowCard.locator('p').first().textContent()
    expect(
      nowDef?.replace('Definition not recorded', '').trim().length ?? 0,
      'E01 Now definition is blank',
    ).toBeGreaterThan(2)

    await shot(page, 'E01-phrase-snapshots')

    // At least 1 source card must be visible
    const sourcesSection = page.getByLabel('Historical sources')
    if (await sourcesSection.isVisible()) {
      const cards = sourcesSection.getByTestId('source-card')
      expect(await cards.count(), 'E01 no source cards visible').toBeGreaterThan(0)
      await shot(page, 'E01-phrase-sources')
    }

    // Back to home
    await page.getByRole('button', { name: 'Back to search' }).click()
    await page.waitForURL(`${SITE}/`, { timeout: 8_000 })
    await expect(page.getByRole('searchbox')).toBeVisible()
    await shot(page, 'E01-phrase-back-home')

    if (payload) {
      test.info().annotations.push({
        type: 'api-field-counts',
        description: JSON.stringify(countFields(payload)),
      })
    }
  })

  test('E02 — Timeline: scrubber era click + event list + back to result', async ({ page }) => {
    await searchWord(page, 'gone')

    await page.getByTestId('view-timeline-btn').click()
    await page.waitForURL('**/timeline', { timeout: 10_000 })
    await shot(page, 'E02-timeline-initial')

    // Error boundary must NOT fire
    await expect(
      page.getByText('Could not build the timeline'),
      'E02 timeline error boundary triggered',
    ).not.toBeVisible()

    // Scrubber must have at least one era button
    const scrubber = page.getByTestId('timeline-scrubber')
    await expect(scrubber).toBeVisible()
    const eraBtns = scrubber.getByRole('button')
    const eraCount = await eraBtns.count()
    expect(eraCount, 'E02 scrubber has no era buttons').toBeGreaterThan(0)

    // Click the last era button to jump forward in the timeline
    if (eraCount > 1) {
      await eraBtns.last().click()
      await shot(page, 'E02-scrubber-last-era')
    }

    // The event list must have at least one visible, non-empty item
    const events = page.getByLabel('Timeline events').locator('li')
    const evCount = await events.count()
    expect(evCount, 'E02 timeline event list is empty').toBeGreaterThan(0)
    const firstEventText = await events.first().textContent()
    expect(firstEventText?.trim().length ?? 0, 'E02 first event is blank').toBeGreaterThan(5)
    await shot(page, 'E02-timeline-events')

    // Back to results
    await page.getByRole('button', { name: 'Back to results' }).click()
    await page.waitForURL('**/result', { timeout: 8_000 })
    await shot(page, 'E02-back-to-result')
  })

  test('E03 — Source detail: citation visible → explain-source click → explanation appears', async ({ page }) => {
    await searchWord(page, 'gone')

    // Navigate to the first source card
    const cards = page.getByTestId('source-card')
    const count = await cards.count()
    if (count === 0) {
      test.info().annotations.push({
        type: 'skipped-reason',
        description: 'No source cards — AI returned 0 sources for "gone"',
      })
      test.skip(true, 'No source cards present')
      return
    }

    await cards.first().getByText('Details →').click()
    await page.waitForURL('**/source/**', { timeout: 10_000 })
    await shot(page, 'E03-source-detail')

    // Citation must be present
    await expect(page.getByTestId('source-citation')).toBeVisible()

    // Click the explain-source button and wait for the AI explanation
    const explainBtn = page.getByTestId('explain-btn')
    await expect(explainBtn, 'E03 explain-btn not found on SourceDetail page').toBeVisible()
    await explainBtn.click()
    await shot(page, 'E03-explain-clicked')

    // Explanation response can take up to EXPLAIN_WAIT_MS
    await expect(page.getByTestId('source-explanation'), 'E03 source-explanation never appeared')
      .toBeVisible({ timeout: EXPLAIN_WAIT_MS })
    const explanationText = await page.getByTestId('source-explanation').textContent()
    expect(
      explanationText?.trim().length ?? 0,
      'E03 explanation text is blank or too short',
    ).toBeGreaterThan(20)
    await shot(page, 'E03-explanation-visible')

    // Navigate back to result
    await page.getByRole('button', { name: /Back to result/i }).click()
    await page.waitForURL('**/result', { timeout: 8_000 })
    await shot(page, 'E03-back-to-result')
  })

  test('E04 — Model selector: change to Balanced in settings → search → result loads', async ({ page }) => {
    // Navigate to settings and select the "Balanced" (grok-4-1-fast-reasoning) model card
    await page.goto(`${SITE}/settings`)
    await shot(page, 'E04-settings')

    const modelSection = page.getByLabel('AI Model')
    await expect(modelSection, 'E04 AI Model section not visible').toBeVisible()

    const balancedCard = page.getByRole('radio').filter({ hasText: 'Balanced' })
    await balancedCard.click()
    await expect(balancedCard, 'E04 Balanced model card not checked after click')
      .toHaveAttribute('aria-checked', 'true')
    await shot(page, 'E04-model-selected')

    // Run a search — the stored preferredModel setting will be used
    await page.goto(`${SITE}/`)
    await page.getByRole('searchbox').fill('gone')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL('**/result', { timeout: RESULT_WAIT_MS })
    await shot(page, 'E04-result-balanced-model')

    // Basic result quality check
    await expect(page.getByRole('heading', { level: 1 })).toContainText('gone')
    const banner = page.getByTestId('summary-banner')
    await expect(banner).toBeVisible()
    expect(
      (await banner.innerText()).trim().length,
      'E04 summary banner blank with Balanced model selected',
    ).toBeGreaterThan(10)
  })

  test('E05 — Paragraph mode: search + result loads + passage view graceful fallback', async ({ page }) => {
    // A passage with historically rich vocabulary to give the AI good material
    const passage =
      'The natural philosophy of our ancestors was wonderfully impeded by their fondness ' +
      'for artificial distinctions and their superficial regard for evidence.'

    let resultLoaded = false
    page.on('response', resp => {
      if (resp.url().includes('/interpret') && resp.status() === 200) {
        resultLoaded = true
      }
    })

    await page.goto(`${SITE}/`)
    await page.getByRole('radio', { name: 'Paragraph' }).click()
    await page.getByLabel('Paste passage text').fill(passage)
    await shot(page, 'E05-paragraph-filled')

    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL('**/result', { timeout: RESULT_WAIT_MS })
    await shot(page, 'E05-paragraph-result')

    // Confirm /interpret was actually called
    expect(resultLoaded, 'E05 /interpret was never called in paragraph mode').toBe(true)

    // Result heading must be present (the AI selected a word from the passage as query)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Navigate to passage view if the CTA is present
    const passageCta = page.getByRole('button', { name: /passage|passages/i })
    const ctaVisible = await passageCta.isVisible({ timeout: 2_000 }).catch(() => false)

    if (ctaVisible) {
      await passageCta.click()
      await page.waitForURL('**/passages', { timeout: 8_000 })
      await shot(page, 'E05-passage-view')

      // Must show either real passage content OR the graceful empty state — never a crash
      const hasPassage = await page.getByTestId('passage-0').isVisible({ timeout: 3_000 }).catch(() => false)
      const hasEmpty   = await page.getByText('No indexed passages for this word.').isVisible({ timeout: 3_000 }).catch(() => false)
      expect(
        hasPassage || hasEmpty,
        'E05 passage view shows neither content nor graceful empty state',
      ).toBe(true)
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'E05: No passage CTA found on result page — passage view not navigated',
      })
    }
  })

  test('E06 — Date picker: constrained search → result loads coherently', async ({ page }) => {
    await page.goto(`${SITE}/`)

    // Open the era date picker
    await page.getByRole('button', { name: /Pick an era|Era:/i }).click()
    await expect(page.locator('#date-picker-panel')).toBeVisible()
    await shot(page, 'E06-date-picker-open')

    // Set range slider to around 1800 using fill() on the range input
    const rangeInput = page.locator('#era-year')
    await rangeInput.fill('1800')

    // Picker button should update to show the selected year
    await expect(page.getByRole('button', { name: /Era:\s*1800/i })).toBeVisible()

    // Search "nice" — a word with rich 1800-era usage
    await page.getByRole('searchbox').fill('nice')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL('**/result', { timeout: RESULT_WAIT_MS })
    await shot(page, 'E06-dated-result')

    // Result must load and heading must be visible
    await expect(page.getByRole('heading', { level: 1 })).toContainText('nice')

    // Summary banner must be substantive
    const banner = page.getByTestId('summary-banner')
    await expect(banner).toBeVisible()
    expect(
      (await banner.innerText()).trim().length,
      'E06 summary banner blank after date-constrained search',
    ).toBeGreaterThan(5)
  })
})
