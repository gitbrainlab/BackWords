import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '@/components/NavBar'
import SourceCard from '@/components/SourceCard'
import ConceptChip from '@/components/ConceptChip'
import { useResult } from '@/context/ResultContext'
import type { SnapshotInterpretation } from '@/types'
import styles from './Result.module.css'

function SnapshotCard({ snapshot, label }: { snapshot: SnapshotInterpretation; label: 'now' | 'then' }) {
  const sentimentClass = {
    positive: styles.sentimentPositive,
    negative: styles.sentimentNegative,
    neutral: styles.sentimentNeutral,
  }[snapshot.sentiment] ?? ''

  return (
    <article className={`${styles.snapshotCard} card`} data-testid={`snapshot-${label}`}>
      <header className={styles.snapshotHeader}>
        <span className={`${styles.snapshotLabel} ${label === 'now' ? styles.labelNow : styles.labelThen}`}>
          {label === 'now' ? 'Today' : snapshot.eraLabel}
        </span>
        <time className={styles.snapshotDate} dateTime={snapshot.date}>
          {(snapshot.date ?? '').slice(0, 4) === '0000' ? 'Ancient' : ((snapshot.date ?? '').slice(0, 4) || '?')}
        </time>
      </header>

      <p className={styles.definition}>{snapshot.definition}</p>

      {snapshot.exampleUsage && (
        <blockquote className={styles.example}>
          <p>"{snapshot.exampleUsage}"</p>
        </blockquote>
      )}

      <footer className={styles.snapshotFooter}>
        <span className={`${styles.register}`}>{snapshot.register}</span>
        <span className={`${styles.sentiment} ${sentimentClass}`}>{snapshot.sentiment}</span>
        {snapshot.confidence !== undefined && (
          <span className={styles.confidence}>
            {Math.round(snapshot.confidence * 100)}% confidence
          </span>
        )}
      </footer>
    </article>
  )
}

const DRIFT_LABELS: Record<string, string> = {
  pejoration: '↘ Pejoration',
  amelioration: '↗ Amelioration',
  narrowing: '→ Narrowing',
  broadening: '↔ Broadening',
  'metaphorical-extension': '⤳ Metaphorical',
  'register-shift': '⇅ Register shift',
  tabooisation: '⚠ Tabooisation',
}

export default function Result() {
  const navigate = useNavigate()
  const { result, mode } = useResult()

  // Redirect if no result (e.g. direct navigation)
  useEffect(() => {
    if (!result) navigate('/', { replace: true })
  }, [result, navigate])

  if (!result) return null

  const oldestSnapshot = result.historicalSnapshots[0]
  const driftLabel = result.summaryOfChange?.driftType
    ? DRIFT_LABELS[result.summaryOfChange.driftType] ?? result.summaryOfChange.driftType
    : null

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/')}
          aria-label="Back to search"
        >
          ← Back
        </button>
        <div className={styles.titleGroup}>
          <h1 className={`${styles.wordTitle} serif`}>{result.query}</h1>
          <span className={styles.modeBadge}>{mode}</span>
        </div>
      </header>

      <main id="main" className={styles.main}>
        {/* Summary banner */}
        {result.summaryOfChange && (
          <section aria-label="Summary of change" className={`${styles.summaryBanner} card`} data-testid="summary-banner">
            {driftLabel && <span className={styles.driftBadge}>{driftLabel}</span>}
            <p className={styles.shortSummary}>{result.summaryOfChange.shortSummary}</p>
            {result.summaryOfChange.driftMagnitude !== undefined && (
              <div
                className={styles.driftMeter}
                role="meter"
                aria-valuenow={Math.round(result.summaryOfChange.driftMagnitude * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Drift magnitude: ${Math.round(result.summaryOfChange.driftMagnitude * 100)}%`}
              >
                <div
                  className={styles.driftFill}
                  style={{ width: `${result.summaryOfChange.driftMagnitude * 100}%` }}
                />
              </div>
            )}
          </section>
        )}

        {/* Now / Then comparison */}
        <section aria-label="Meaning comparison" className={styles.compareSection}>
          <h2 className={styles.sectionTitle}>Then vs. Now</h2>
          <div className={styles.compareGrid}>
            {oldestSnapshot && <SnapshotCard snapshot={oldestSnapshot} label="then" />}
            <SnapshotCard snapshot={result.currentSnapshot} label="now" />
          </div>
        </section>

        {/* Long summary */}
        {result.summaryOfChange?.longSummary && (
          <section aria-label="Detailed summary" className={styles.longSummarySection}>
            <h2 className={styles.sectionTitle}>The Full Story</h2>
            <p className={`${styles.longSummary} card`}>{result.summaryOfChange.longSummary}</p>
          </section>
        )}

        {/* Key dates */}
        {result.keyDates && result.keyDates.length > 0 && (
          <section aria-label="Key dates" className={styles.keyDatesSection}>
            <h2 className={styles.sectionTitle}>Key Moments</h2>
            <ol className={styles.keyDatesList}>
              {result.keyDates.map(kd => (
                <li key={kd.date} className={styles.keyDateItem}>
                  <time className={styles.keyDateYear} dateTime={kd.date}>
                    {(kd.date ?? '').slice(0, 4) || '?'}
                  </time>
                  <div>
                    <strong>{kd.label}</strong>
                    <p>{kd.significance}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Sources */}
        {result.sources && result.sources.length > 0 && (
          <section aria-label="Historical sources" className={styles.sourcesSection}>
            <h2 className={styles.sectionTitle}>Sources</h2>
            <div className={styles.sourcesList}>
              {result.sources.slice(0, 4).map(source => (
                <SourceCard
                  key={source.sourceId}
                  source={source}
                  compact
                  onNavigate={id => navigate(`/source/${id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Related concepts */}
        {result.relatedConcepts && result.relatedConcepts.length > 0 && (
          <section aria-label="Related concepts" className={styles.conceptsSection}>
            <h2 className={styles.sectionTitle}>Related Concepts</h2>
            <div className={styles.conceptChips}>
              {result.relatedConcepts.map(c => (
                <ConceptChip
                  key={c.conceptId}
                  label={c.label}
                />
              ))}
            </div>
          </section>
        )}

        {/* Timeline CTA */}
        <div className={styles.timelineCta}>
          <button
            type="button"
            className={styles.timelineBtn}
            onClick={() => navigate('/timeline')}
            data-testid="view-timeline-btn"
          >
            View Full Timeline →
          </button>
        </div>
      </main>

      <NavBar />
    </div>
  )
}
