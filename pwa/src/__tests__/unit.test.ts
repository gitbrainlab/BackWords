import { describe, it, expect, beforeEach } from 'vitest'
import { normaliseQuery } from '../../netlify/functions/_shared/seed-loader'
import { addHistoryItem, loadHistory, clearHistory } from '../lib/history'

// Unit tests for the seed-loader normalisation function
describe('normaliseQuery', () => {
  it('lowercases input', () => {
    expect(normaliseQuery('AWFUL')).toBe('awful')
  })

  it('trims whitespace', () => {
    expect(normaliseQuery('  awful  ')).toBe('awful')
  })

  it('collapses internal whitespace', () => {
    expect(normaliseQuery('a   b   c')).toBe('a b c')
  })

  it('handles empty string', () => {
    expect(normaliseQuery('')).toBe('')
  })
})

// Unit tests for history utils
describe('history', () => {
  beforeEach(() => {
    clearHistory()
  })

  it('roundtrips an item', () => {
    addHistoryItem({ query: 'awful', normalizedQuery: 'awful', mode: 'word', timestamp: 1234 })
    const items = loadHistory()
    expect(items).toHaveLength(1)
    expect(items[0].query).toBe('awful')
  })

  it('deduplicates by normalizedQuery+mode', () => {
    addHistoryItem({ query: 'awful', normalizedQuery: 'awful', mode: 'word', timestamp: 1 })
    addHistoryItem({ query: 'awful', normalizedQuery: 'awful', mode: 'word', timestamp: 2 })
    expect(loadHistory()).toHaveLength(1)
  })

  it('keeps newer entry on deduplicate', () => {
    addHistoryItem({ query: 'awful', normalizedQuery: 'awful', mode: 'word', timestamp: 1 })
    addHistoryItem({ query: 'awful', normalizedQuery: 'awful', mode: 'word', timestamp: 99 })
    expect(loadHistory()[0].timestamp).toBe(99)
  })
})
