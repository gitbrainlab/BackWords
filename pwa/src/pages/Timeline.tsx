import { Component, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '@/components/NavBar'
import { useResult } from '@/context/ResultContext'
import type { TimelineEvent, SnapshotInterpretation } from '@/types'
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
): Array<TimelineEvent & { definition?: string }> {
  if (timelineEvents && timelineEvents.length > 0) return timelineEvents

  // Synthesize events from snapshots as fallback
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

  const events = buildEvents(
    result.historicalSnapshots,
    result.currentSnapshot,
    result.timelineEvents,
  )

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
                  {event.sourceIds.length > 0 && (
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

function formatYear(isoDate: string): string {
  const year = parseInt(isoDate.slice(0, 4))
  if (isNaN(year)) return isoDate
  if (year < 1000) return `${year} CE`
  return String(year)
}
