// Static JSON imports — esbuild will bundle these into the function
// Each file is imported directly to avoid file-system resolution issues in Lambda
import awfulRaw from '../../../../data/seed/awful.json'
import artificialRaw from '../../../../data/seed/artificial.json'
import charityRaw from '../../../../data/seed/charity.json'
import niceRaw from '../../../../data/seed/nice.json'
import gayRaw from '../../../../data/seed/gay.json'
import wokeRaw from '../../../../data/seed/woke.json'

import ameliorationPage from '../../../../data/pages/amelioration.json'
import pejoration from '../../../../data/pages/pejoration.json'
import registerAndSlang from '../../../../data/pages/register-and-slang.json'
import semanticDrift from '../../../../data/pages/semantic-drift.json'
import dictionariesVsUsage from '../../../../data/pages/dictionaries-vs-usage.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SEEDS: Record<string, any> = {
  [awfulRaw.normalizedQuery]: awfulRaw,
  [artificialRaw.normalizedQuery]: artificialRaw,
  [charityRaw.normalizedQuery]: charityRaw,
  [niceRaw.normalizedQuery]: niceRaw,
  [gayRaw.normalizedQuery]: gayRaw,
  [wokeRaw.normalizedQuery]: wokeRaw,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PAGES: Record<string, any> = {
  [ameliorationPage.slug]: ameliorationPage,
  [pejoration.slug]: pejoration,
  ['register-and-slang']: registerAndSlang,
  ['semantic-drift']: semanticDrift,
  ['dictionaries-vs-usage']: dictionariesVsUsage,
}

export function getAllSeeds() {
  return Object.values(SEEDS)
}

export function getSeedByQuery(normalizedQuery: string) {
  return SEEDS[normalizedQuery] ?? null
}

export function getSeedCount(): number {
  return Object.keys(SEEDS).length
}

export function getPageBySlug(slug: string) {
  return PAGES[slug] ?? null
}

export function getAllPages() {
  return Object.values(PAGES)
}

/** Normalise query input the same way the seed files do */
export function normaliseQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}
