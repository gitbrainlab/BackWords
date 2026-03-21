// Persist per-model response timing history in localStorage
const KEY = 'backwords:timings'
const MAX_PER_MODEL = 10

// Cache hit/miss counters — stored separately so they survive timing clears
const CACHE_KEY = 'backwords:cache-stats'

type TimingStore = Record<string, number[]>
type CacheStats = { hits: number; misses: number }

function load(): TimingStore {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as TimingStore
  } catch { /* ignore */ }
  return {}
}

function save(store: TimingStore): void {
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function recordTiming(model: string, ms: number): void {
  const store = load()
  if (!store[model]) store[model] = []
  store[model].push(ms)
  if (store[model].length > MAX_PER_MODEL) store[model] = store[model].slice(-MAX_PER_MODEL)
  save(store)
}

export function getTimings(model: string): number[] {
  return load()[model] ?? []
}

export function getAverageMs(model: string): number | null {
  const times = getTimings(model)
  if (times.length === 0) return null
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length)
}

export function clearTimings(): void {
  localStorage.removeItem(KEY)
}

// ---- Cache hit/miss tracking ----

function loadCacheStats(): CacheStats {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) return JSON.parse(raw) as CacheStats
  } catch { /* ignore */ }
  return { hits: 0, misses: 0 }
}

function saveCacheStats(stats: CacheStats): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(stats))
}

export function recordCacheHit(): void {
  const stats = loadCacheStats()
  saveCacheStats({ ...stats, hits: stats.hits + 1 })
}

export function recordCacheMiss(): void {
  const stats = loadCacheStats()
  saveCacheStats({ ...stats, misses: stats.misses + 1 })
}

export function getCacheStats(): CacheStats {
  return loadCacheStats()
}

export function clearCacheStats(): void {
  localStorage.removeItem(CACHE_KEY)
}
