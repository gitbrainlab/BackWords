// Search history CRUD — persisted in localStorage using SearchHistoryItem schema
import type { SearchHistoryItem } from '@/types'

const KEY = 'backwords:history'
const MAX_ITEMS = 50

export function loadHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SearchHistoryItem[]) : []
  } catch {
    return []
  }
}

function saveHistory(items: SearchHistoryItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function addHistoryItem(item: Omit<SearchHistoryItem, 'pinned'> & { pinned?: boolean }): SearchHistoryItem {
  const items = loadHistory()

  // Deduplicate: remove existing entry for same normalized query + mode, keep newest
  const filtered = items.filter(
    i => !(i.normalizedQuery === item.normalizedQuery && i.mode === item.mode),
  )

  const newItem: SearchHistoryItem = {
    query: item.query,
    normalizedQuery: item.normalizedQuery,
    mode: item.mode,
    timestamp: item.timestamp,
    pinned: item.pinned ?? false,
  }

  const next = [newItem, ...filtered].slice(0, MAX_ITEMS)
  saveHistory(next)
  return newItem
}

export function togglePin(query: string, mode: SearchHistoryItem['mode']): void {
  const items = loadHistory()
  saveHistory(
    items.map(i =>
      i.normalizedQuery === query && i.mode === mode ? { ...i, pinned: !i.pinned } : i,
    ),
  )
}

export function deleteHistoryItem(query: string, mode: SearchHistoryItem['mode']): void {
  saveHistory(loadHistory().filter(i => !(i.normalizedQuery === query && i.mode === mode)))
}

export function clearHistory(): void {
  localStorage.removeItem(KEY)
}
