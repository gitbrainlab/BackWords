import { test, expect, type Page } from '@playwright/test'

const BASE = '/BackWords'

async function shot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  })
}

test.describe('BackWords PWA — full user journey', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls to use mock data in E2E tests
    await page.route(`**/health`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', version: 'pwa-v0.1.0', seedCount: 6, mode: 'mock' }),
      })
    })
  })

  test('01 – Home screen loads', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.getByRole('heading', { name: 'BackWords' })).toBeVisible()
    await shot(page, '01-home-initial')
  })

  test('02 – Curated seed grid is visible', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.getByTestId('curated-grid')).toBeVisible()
    await expect(page.getByTestId('seed-awful')).toBeVisible()
    await shot(page, '02-home-curated-grid')
  })

  test('03 – Search bar is accessible', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.getByRole('form', { name: 'Word search' })).toBeVisible()
    await shot(page, '03-home-search-bar')
  })

  test('04 – Mode picker switches modes', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('radio', { name: 'Phrase' }).click()
    await expect(page.getByRole('radio', { name: 'Phrase' })).toHaveAttribute('aria-checked', 'true')
    await shot(page, '04-mode-picker-phrase')
  })

  test('05 – Type in search box', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('searchbox').fill('awful')
    await expect(page.getByRole('searchbox')).toHaveValue('awful')
    await shot(page, '05-search-typed-awful')
  })
})

test.describe('BackWords PWA — search flow with mock API', () => {
  const MOCK_RESULT = {
    lexemeId: 'awful',
    query: 'awful',
    normalizedQuery: 'awful',
    mode: 'word',
    currentSnapshot: {
      snapshotId: 'awful_current',
      date: '2024-01-01',
      eraLabel: 'Contemporary',
      definition: 'Very bad or unpleasant.',
      register: 'informal',
      sentiment: 'negative',
      confidence: 0.98,
      sourceIds: ['oed_awful_modern'],
    },
    historicalSnapshots: [
      {
        snapshotId: 'awful_old_english',
        date: '0900-01-01',
        eraLabel: 'Old English',
        definition: 'Inspiring profound fear or dread.',
        register: 'formal',
        sentiment: 'negative',
        confidence: 0.87,
        sourceIds: ['bosworth_toller'],
      },
    ],
    summaryOfChange: {
      shortSummary: 'From divine terror to "very bad".',
      longSummary: 'Awful began in Old English meaning divine terror, then softened through the centuries.',
      sentimentShift: 'positive-to-negative',
      driftType: 'pejoration',
      driftMagnitude: 0.9,
    },
    keyDates: [{ date: '1755-01-01', label: "Johnson's Dictionary", significance: "Defined 'awful' as awe-inspiring." }],
    sources: [
      {
        sourceId: 'oed_awful_modern',
        title: 'Oxford English Dictionary',
        date: '2024-01-01',
        sourceType: 'academic',
        confidence: 0.98,
        quote: 'Extremely bad or unpleasant.',
      },
    ],
    relatedConcepts: [{ conceptId: 'awesome', label: 'awesome', relationship: 'parallel-amelioration' }],
    timelineEvents: [
      {
        eventId: 'te_awful_oe',
        date: '0900-01-01',
        eraLabel: 'Old English',
        title: 'Divine Dread',
        summary: 'Original meaning: terror of God.',
        sourceIds: ['bosworth_toller'],
      },
    ],
    ambiguityNotes: [],
  }

  test.beforeEach(async ({ page }) => {
    await page.route('**/interpret', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RESULT),
      })
    })
  })

  test('06 – Search "awful" navigates to result page', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('searchbox').fill('awful')
    await expect(page.getByRole('searchbox')).toHaveValue('awful')
    await shot(page, '06-before-search-submit')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await shot(page, '07-result-page-loaded')
  })

  test('07 – Result page shows word title', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('searchbox').fill('awful')
    await expect(page.getByRole('searchbox')).toHaveValue('awful')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await expect(page.getByRole('heading', { name: 'awful' })).toBeVisible()
    await shot(page, '08-result-word-title')
  })

  test('08 – Result page shows summary banner', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('searchbox').fill('awful')
    await expect(page.getByRole('searchbox')).toHaveValue('awful')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await expect(page.getByTestId('summary-banner')).toBeVisible()
    await shot(page, '09-result-summary-banner')
  })

  test('09 – Result page shows Then/Now snapshots', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('searchbox').fill('awful')
    await expect(page.getByRole('searchbox')).toHaveValue('awful')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await expect(page.getByTestId('snapshot-now')).toBeVisible()
    await expect(page.getByTestId('snapshot-then')).toBeVisible()
    await shot(page, '10-result-snapshots-comparison')
  })

  test('10 – Navigate to Timeline from Result', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('searchbox').fill('awful')
    await expect(page.getByRole('searchbox')).toHaveValue('awful')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await page.getByTestId('view-timeline-btn').click()
    await page.waitForURL(`**${BASE}/timeline`, { waitUntil: 'commit' })
    await expect(page.getByTestId('timeline-scrubber')).toBeVisible()
    await shot(page, '11-timeline-page')
  })

  test('11 – Timeline scrubber shows eras', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('searchbox').fill('awful')
    await expect(page.getByRole('searchbox')).toHaveValue('awful')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await page.getByTestId('view-timeline-btn').click()
    await page.waitForURL(`**${BASE}/timeline`, { waitUntil: 'commit' })
    await expect(page.getByLabel('Timeline scrubber')).toBeVisible()
    await shot(page, '12-timeline-scrubber')
  })

  test('12 – Navigate to Source Detail from Result', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('searchbox').fill('awful')
    await expect(page.getByRole('searchbox')).toHaveValue('awful')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await page.getByTestId('source-card').first().getByText('Details →').click()
    await page.waitForURL(`**${BASE}/source/oed_awful_modern`, { waitUntil: 'commit' })
    await expect(page.getByTestId('source-citation')).toBeVisible()
    await shot(page, '13-source-detail-page')
  })

  test('13 – "Ask BackWords" explain button appears', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('searchbox').fill('awful')
    await expect(page.getByRole('searchbox')).toHaveValue('awful')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await page.getByTestId('source-card').first().getByText('Details →').click()
    await page.waitForURL(`**${BASE}/source/oed_awful_modern`, { waitUntil: 'commit' })
    await expect(page.getByTestId('explain-btn')).toBeVisible()
    await shot(page, '14-explain-btn-visible')
  })

  test('14 – Back navigation returns to result', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('searchbox').fill('awful')
    await expect(page.getByRole('searchbox')).toHaveValue('awful')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await page.getByRole('button', { name: 'Back to search' }).click()
    await expect(page.getByRole('searchbox')).toBeVisible()
    await shot(page, '15-back-to-home')
  })
})

test.describe('BackWords PWA — Settings', () => {
  test('15 – Settings page loads via nav', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByRole('link', { name: /settings/i }).click()
    await page.waitForURL(`**${BASE}/settings`, { waitUntil: 'commit' })
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await shot(page, '16-settings-page')
  })

  test('16 – Mock mode toggle works', async ({ page }) => {
    await page.goto(`${BASE}/settings`)
    const toggle = page.getByTestId('mock-mode-toggle')
    await expect(toggle).toBeVisible()
    await toggle.click()
    await shot(page, '17-mock-mode-toggled')
  })

  test('17 – Palette selection works', async ({ page }) => {
    await page.goto(`${BASE}/settings`)
    await page.getByTestId('palette-modernPremium').click()
    await expect(page.getByTestId('palette-modernPremium')).toHaveAttribute('aria-checked', 'true')
    await shot(page, '18-palette-modern-premium')
  })

  test('18 – Clear history button is visible', async ({ page }) => {
    await page.goto(`${BASE}/settings`)
    await expect(page.getByTestId('clear-history-btn')).toBeVisible()
    await shot(page, '19-clear-history-btn')
  })
})

test.describe('BackWords PWA — Curated seed cards', () => {
  const MOCK_RESULT_NICE = {
    lexemeId: 'nice',
    query: 'nice',
    normalizedQuery: 'nice',
    mode: 'word',
    currentSnapshot: {
      snapshotId: 'nice_current',
      date: '2024-01-01',
      eraLabel: 'Contemporary',
      definition: 'Pleasant; agreeable.',
      register: 'informal',
      sentiment: 'positive',
      confidence: 0.97,
      sourceIds: [],
    },
    historicalSnapshots: [],
    summaryOfChange: {
      shortSummary: 'From foolish to pleasant.',
      longSummary: 'Nice evolved from Latin nescius (ignorant) to its current pleasant meaning.',
      sentimentShift: 'negative-to-positive',
      driftType: 'amelioration',
      driftMagnitude: 0.85,
    },
    keyDates: [],
    sources: [],
    relatedConcepts: [],
    timelineEvents: [],
    ambiguityNotes: [],
  }

  test.beforeEach(async ({ page }) => {
    await page.route('**/interpret', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RESULT_NICE),
      })
    })
  })

  test('19 – Click "nice" seed card navigates to result', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await shot(page, '20-home-before-curated-click')
    await page.getByTestId('seed-nice').click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await shot(page, '21-result-nice')
  })

  test('20 – Result for "nice" shows amelioration badge', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByTestId('seed-nice').click()
    await page.waitForURL(`**${BASE}/result`, { waitUntil: 'commit' })
    await expect(page.getByTestId('summary-banner')).toContainText('amelioration', { ignoreCase: true })
    await shot(page, '22-nice-amelioration-badge')
  })
})

test.describe('BackWords PWA — Accessibility', () => {
  test('21 – Skip link is present on Home', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const skipLink = page.locator('.skip-link').first()
    await expect(skipLink).toBeAttached()
    await shot(page, '23-skip-link-present')
  })

  test('22 – Navigation has accessible name', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await shot(page, '24-nav-accessible')
  })
})
