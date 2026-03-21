import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '@/components/SearchBar'
import ConceptChip from '@/components/ConceptChip'
import NavBar from '@/components/NavBar'
import { useResult } from '@/context/ResultContext'
import { useTheme } from '@/design/theme'
import { interpret } from '@/lib/api'
import { addHistoryItem, loadHistory } from '@/lib/history'
import type { SearchMode } from '@/types'
import styles from './Home.module.css'

const CURATED_SEEDS = [
  { word: 'awful', hint: 'From divine terror to "very bad"' },
  { word: 'artificial', hint: 'Once "full of artistry"' },
  { word: 'charity', hint: 'Love → almsgiving' },
  { word: 'nice', hint: 'Foolish → pleasant' },
  { word: 'gay', hint: 'Joyful to contentious' },
  { word: 'woke', hint: 'Alert to politically charged' },
]

export default function Home() {
  const navigate = useNavigate()
  const { setResult } = useResult()
  const { settings } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const history = loadHistory().slice(0, 5)

  const runSearch = useCallback(
    async (query: string, mode: SearchMode, selectedDate?: string) => {
      setLoading(true)
      setError(null)
      try {
        const result = await interpret({ query, mode, requestedDate: selectedDate, useMock: settings.mockMode })
        setResult(result, query, mode)
        addHistoryItem({ query, normalizedQuery: query.trim().toLowerCase(), mode, timestamp: Date.now() })
        navigate('/result')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    },
    [navigate, setResult, settings.mockMode],
  )

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className={styles.header}>
        <h1 className={`${styles.logo} serif`}>BackWords</h1>
        <p className={styles.tagline}>Trace the drift of meaning through time</p>
      </header>

      <main id="main" className={styles.main}>
        <section aria-label="Search" className={styles.searchSection}>
          <SearchBar onSearch={runSearch} loading={loading} />
          {error && (
            <div role="alert" className={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        {/* Curated seed words */}
        <section aria-label="Explore featured words" className={styles.curatedSection}>
          <h2 className={styles.sectionTitle}>Featured Words</h2>
          <div className={styles.grid} data-testid="curated-grid">
            {CURATED_SEEDS.map(({ word, hint }) => (
              <button
                key={word}
                type="button"
                className={styles.seedCard}
                onClick={() => runSearch(word, 'word')}
                disabled={loading}
                data-testid={`seed-${word}`}
              >
                <span className={`${styles.seedWord} serif`}>{word}</span>
                <span className={styles.seedHint}>{hint}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent history */}
        {history.length > 0 && (
          <section aria-label="Recent searches" className={styles.historySection}>
            <h2 className={styles.sectionTitle}>Recent</h2>
            <div className={styles.historyList} role="list">
              {history.map(item => (
                <div
                  key={`${item.normalizedQuery}-${item.mode}-${item.timestamp}`}
                  className={styles.historyItem}
                  role="listitem"
                >
                  <ConceptChip
                    label={item.query}
                    onClick={() => runSearch(item.query, item.mode)}
                  />
                  <span className={styles.historyMode}>{item.mode}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <NavBar />
    </div>
  )
}
