import React, { useState, useRef } from 'react'
import type { SearchMode } from '@/types'
import styles from './SearchBar.module.css'

interface Props {
  onSearch: (query: string, mode: SearchMode, selectedDate?: string) => void
  loading?: boolean
  initialQuery?: string
  initialMode?: SearchMode
}

const MODES: Array<{ value: SearchMode; label: string }> = [
  { value: 'word', label: 'Word' },
  { value: 'phrase', label: 'Phrase' },
  { value: 'paragraph', label: 'Paragraph' },
]

export default function SearchBar({ onSearch, loading, initialQuery = '', initialMode = 'word' }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [mode, setMode] = useState<SearchMode>(initialMode)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    onSearch(q, mode, selectedDate || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} aria-label="Word search">
      {/* Mode picker */}
      <div role="group" aria-label="Search mode" className={styles.modePicker}>
        {MODES.map(m => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={mode === m.value}
            className={`${styles.modeBtn} ${mode === m.value ? styles.modeBtnActive : ''}`}
            onClick={() => setMode(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      {mode === 'paragraph' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          className={styles.textarea}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Paste a passage to analyse historically significant words…"
          rows={5}
          aria-label="Paste passage text"
          disabled={loading}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="search"
          className={styles.input}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={mode === 'word' ? 'Enter a word…' : 'Enter a phrase…'}
          aria-label={mode === 'word' ? 'Enter a word to look up' : 'Enter a phrase to look up'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={loading}
        />
      )}

      {/* Optional date picker */}
      <button
        type="button"
        className={`${styles.dateToggle} ${showDatePicker ? styles.dateToggleActive : ''}`}
        onClick={() => setShowDatePicker(v => !v)}
        aria-expanded={showDatePicker}
        aria-controls="date-picker-panel"
      >
        {selectedDate ? `Era: ${selectedDate.slice(0, 4)}` : 'Pick an era'}
      </button>

      {showDatePicker && (
        <div id="date-picker-panel" className={styles.datePicker}>
          <label htmlFor="era-year" className={styles.dateLabel}>Select year (1400 – present)</label>
          <input
            id="era-year"
            type="range"
            min="1400"
            max={new Date().getFullYear()}
            step="10"
            value={selectedDate ? parseInt(selectedDate.slice(0, 4)) : new Date().getFullYear()}
            onChange={e => setSelectedDate(`${e.target.value}-01-01`)}
            className={styles.rangeInput}
          />
          <span className={styles.dateValue}>
            {selectedDate ? selectedDate.slice(0, 4) : 'Present'}
          </span>
          {selectedDate && (
            <button type="button" className={styles.clearDate} onClick={() => setSelectedDate('')}>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className={styles.submitBtn}
        disabled={loading || !query.trim()}
        aria-label={loading ? 'Searching…' : 'Search'}
      >
        {loading ? <span aria-hidden="true">⧗</span> : 'Search'}
        {loading && <span className="visually-hidden">Searching…</span>}
      </button>
    </form>
  )
}
