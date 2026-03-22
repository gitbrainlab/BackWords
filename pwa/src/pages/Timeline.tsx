import { Component, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '@/components/NavBar'
import { useResult } from '@/context/ResultContext'
import type { TimelineEvent, SnapshotInterpretation, KeyDate } from '@/types'
import styles from './Timeline.module.css'

class TimelineErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p>Could not build the timeline for this result.</p>
          <button type="button" onClick={() => history.back()} style={{ marginTop: '1rem', cursor: 'pointer' }}>← Back</button>
        </div>
      )
    }
    return this.props.children
  }
}

function buildEvents(
  historicalSnapshots: SnapshotInterpretation[],
  currentSnapshot: SnapshotInterpretation,
  timelineEvents?: TimelineEvent[],
  keyDates?: KeyDate[],
): Array<TimelineEvent & { definition?: string }> {
  const meaningfulKeyDates = (keyDates ?? []).filter((kd, index) => {
    const label = kd.label?.replace(/\?/g, '').trim() ?? ''
    const significance = kd.significance?.replace(/\?/g, '').trim() ?? ''
    const isGeneratedLabel = new RegExp(`^Key Moment ${index + 1}$`).test(kd.label?.trim() ?? '')
    return label.length > 0 && (!isGeneratedLabel || significance.length > 0 || kd.date !== '2024-01-01')
  })

  // 1. Try timelineEvents — but only if they carry meaningful content (non-empty title).
  //    Events produced by the model with only snapshotIndex+description have empty titles
  //    and a fallback "2024-01-01" date; discard them so richer sources can take over.
  if (timelineEvents && timelineEvents.length > 0) {
    const usable = timelineEvents.filter(ev => ev.title?.trim().length > 0)
    if (usable.length > 0) {
      return usable.map(ev => ({ ...ev, sourceIds: Array.isArray(ev.sourceIds) ? ev.sourceIds : [] }))
    }
  }

  // 2. Synthesize from keyDates (Result page already shows these; reuse them for Timeline).
  if (meaningfulKeyDates.length > 0) {
    return meaningfulKeyDates.map((kd, i) => ({
      eventId: `kd-${i}`,
      date: kd.date || '2024-01-01',
      eraLabel: eraLabelFromDate(kd.date || '2024-01-01'),
      title: kd.label || `Key Moment ${i + 1}`,
      summary: kd.significance || '',
      relatedSnapshotId: null,
      sourceIds: [],
    }))
  }

  // 3. Synthesize from snapshots as last resort.
  const allSnaps = Array.isArray(historicalSnapshots) ? historicalSnapshots : []
  const snaps = [...allSnaps, currentSnapshot].filter((s): s is SnapshotInterpretation => s != null)
  if (snaps.length === 0) return []
  return snaps.map((s, i) => ({
    eventId: s.snapshotId,
    date: s.date,
    eraLabel: s.eraLabel,
    title: s.eraLabel,
    summary: s.definition,
    sourceIds: s.sourceIds ?? [],
    definition: s.definition,
    relatedSnapshotId: i < snaps.length - 1 ? s.snapshotId : null,
  }))
}

function TimelineInner() {
  const navigate = useNavigate()
  const { result } = useResult()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  useEffect(() => {
    if (!result) navigate('/', { replace: true })
  }, [result, navigate])

  if (!result) return <div aria-hidden="true" />

  // Guard: backend may have returned currentSnapshot as a plain string before normalization
  // landed on the deployed function. Coerce to a minimal SnapshotInterpretation so the
  // snapshot fallback in buildEvents() never crashes.
  const currentSnap: SnapshotInterpretation =
    typeof result.currentSnapshot === 'object' && result.currentSnapshot !== null
      ? result.currentSnapshot
      : {
          snapshotId: 'fallback-current',
          date: '2024-01-01',
          eraLabel: 'Contemporary',
          definition: typeof result.currentSnapshot === 'string' ? result.currentSnapshot : '',
          register: 'neutral',
          sentiment: 'neutral',
          confidence: 0.8,
          sourceIds: [],
        }

  const events = buildEvents(
    result.historicalSnapshots,
    currentSnap,
    result.timelineEvents,
    result.keyDates,
  )

  if (events.length === 0) {
    return (
      <div className={styles.page}>
        <a href="#main" className="skip-link">Skip to main content</a>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/result')}
            aria-label="Back to results"
          >
            ← Results
          </button>
          <h1 className={`${styles.title} serif`}>
            Timeline: <em>{result.query}</em>
          </h1>
        </header>
        <main id="main" className={styles.main}>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
            Timeline events are not yet available for this word. Try the <strong>Deep Dive</strong> model for richer historical data.
          </p>
        </main>
        <NavBar />
      </div>
    )
  }

  const selectedEvent = events.find(e => e.eventId === selectedEventId) ?? events[0]

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/result')}
          aria-label="Back to results"
        >
          ← Results
        </button>
        <h1 className={`${styles.title} serif`}>
          Timeline: <em>{result.query}</em>
        </h1>
      </header>

      <main id="main" className={styles.main}>
        {/* Horizontal scrubber */}
        <nav aria-label="Timeline scrubber" className={styles.scrubber} data-testid="timeline-scrubber">
          <ol className={styles.scrubberList} role="list">
            {events.map(event => (
              <li key={event.eventId}>
                <button
                  type="button"
                  className={`${styles.scrubberBtn} ${selectedEvent?.eventId === event.eventId ? styles.scrubberBtnActive : ''}`}
                  onClick={() => setSelectedEventId(event.eventId)}
                  aria-pressed={selectedEvent?.eventId === event.eventId}
                  aria-label={`${event.eraLabel}: ${event.title}`}
                >
                  <span className={styles.scrubberYear}>
                    {formatYear(event.date)}
                  </span>
                  <span className={styles.scrubberEra}>{event.eraLabel}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* Vertical event list */}
        <ol className={styles.eventList} aria-label="Timeline events">
          {events.map((event, index) => (
            <li
              key={event.eventId}
              className={`${styles.eventItem} ${selectedEvent?.eventId === event.eventId ? styles.eventItemActive : ''}`}
              data-testid={`timeline-event-${event.eventId}`}
            >
              {/* Connector line */}
              <div className={styles.connector} aria-hidden="true">
                <div className={styles.dot} />
                {index < events.length - 1 && <div className={styles.line} />}
              </div>

              <div className={styles.eventContent}>
                <button
                  type="button"
                  className={styles.eventTrigger}
                  onClick={() => setSelectedEventId(event.eventId === selectedEventId ? null : event.eventId)}
                  aria-expanded={selectedEvent?.eventId === event.eventId}
                >
                  <time className={styles.eventYear} dateTime={event.date}>
                    {formatYear(event.date)}
                  </time>
                  <span className={styles.eventEra}>{event.eraLabel}</span>
                  <h2 className={styles.eventTitle}>{event.title}</h2>
                </button>

                <div className={`${styles.eventBody} ${selectedEvent?.eventId === event.eventId ? styles.eventBodyOpen : ''}`}>
                  <p className={styles.eventSummary}>{event.summary}</p>
                  {(event.sourceIds?.length ?? 0) > 0 && (
                    <div className={styles.sourceBtns}>
                      {event.sourceIds.map(sid => (
                        <button
                          key={sid}
                          type="button"
                          className={styles.sourceBtn}
                          onClick={() => navigate(`/source/${sid}`)}
                        >
                          {sid}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </main>

      <NavBar />
    </div>
  )
}

export default function Timeline() {
  return (
    <TimelineErrorBoundary>
      <TimelineInner />
    </TimelineErrorBoundary>
  )
}

function formatYear(isoDate: string | null | undefined): string {
  if (!isoDate) return '?'
  const year = parseInt(isoDate.slice(0, 4))
  if (isNaN(year)) return isoDate
  if (year < 1000) return `${year} CE`
  return String(year)
}

function eraLabelFromDate(isoDate: string): string {
  const year = parseInt(isoDate.slice(0, 4), 10)
  if (isNaN(year)) return 'Unknown'
  if (year <= 500) return 'Ancient'
  if (year <= 1100) return 'Old English'
  if (year <= 1500) return 'Middle English'
  if (year <= 1700) return 'Early Modern English'
  if (year <= 1900) return 'Modern English'
  if (year <= 1999) return '20th Century'
  return 'Contemporary'
}
