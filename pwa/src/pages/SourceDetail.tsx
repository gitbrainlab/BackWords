import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import NavBar from '@/components/NavBar'
import { useResult } from '@/context/ResultContext'
import { explainSource } from '@/lib/api'
import { useTheme } from '@/design/theme'
import type { SourceCitation } from '@/types'
import styles from './SourceDetail.module.css'

const SOURCE_TYPE_LABELS: Record<string, string> = {
  literary: 'Literary Work',
  academic: 'Academic',
  journalistic: 'Journalism',
  legal: 'Legal Document',
  speech: 'Speech / Oral',
  digital: 'Digital Source',
}

export default function SourceDetail() {
  const { sourceId } = useParams<{ sourceId: string }>()
  const navigate = useNavigate()
  const { result } = useResult()
  const { settings } = useTheme()

  const [explanation, setExplanation] = useState<string | null>(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [explainError, setExplainError] = useState<string | null>(null)

  const source: SourceCitation | undefined = result?.sources?.find(s => s.sourceId === sourceId)

  useEffect(() => {
    if (!result) navigate('/', { replace: true })
  }, [result, navigate])

  const handleExplain = useCallback(async () => {
    if (!source || !result) return
    setLoadingExplanation(true)
    setExplainError(null)
    try {
      const resp = await explainSource({
        sourceId: source.sourceId,
        sourceTitle: source.title,
        sourceDate: source.publishedDate ?? undefined,
        quote: source.excerpt,
        word: result.query,
        useMock: settings.mockMode,
        model: settings.mockMode ? undefined : settings.preferredModel,
      })
      setExplanation(resp.explanation)
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'Failed to get explanation')
    } finally {
      setLoadingExplanation(false)
    }
  }, [source, result, settings.mockMode, settings.preferredModel])

  if (!result) return null
  if (!source) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        </header>
        <div className={styles.notFound}>Source not found: {sourceId}</div>
        <NavBar />
      </div>
    )
  }

  const sourceTypeLabel = SOURCE_TYPE_LABELS[source.sourceType] ?? source.sourceType
  const confidencePct = source.confidence !== undefined ? Math.round(source.confidence * 100) : null

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          ← Back
        </button>
        <h1 className={styles.pageTitle}>Source Detail</h1>
      </header>

      <main id="main" className={styles.main}>
        {/* Citation card */}
        <article className={`${styles.citationCard} card`} data-testid="source-citation">
          <header className={styles.citationHeader}>
            <div>
              <span className={styles.sourceType}>{sourceTypeLabel}</span>
              {source.publishedDate && (
                <time className={styles.sourceDate} dateTime={source.publishedDate}>
                  {source.publishedDate.slice(0, 4)}
                </time>
              )}
            </div>
            {confidencePct !== null && (
              <div className={styles.confidenceBadge} aria-label={`Confidence: ${confidencePct}%`}>
                <div
                  className={styles.confidenceArc}
                  style={{ '--pct': `${confidencePct}` } as React.CSSProperties}
                  aria-hidden="true"
                />
                <span className={styles.confidenceNum}>{confidencePct}%</span>
              </div>
            )}
          </header>

          <h2 className={`${styles.sourceTitle} serif`}>{source.title}</h2>
          {source.author && <p className={styles.author}>{source.author}</p>}
          {source.publisher && <p className={styles.publisher}>{source.publisher}</p>}

          {source.excerpt && (
            <blockquote className={styles.quote}>
              <p>"{source.excerpt}"</p>
            </blockquote>
          )}

          {source.relevanceNote && (
            <a
              href={`#source-${source.sourceId}`}
              className={styles.externalLink}
            >
              {source.relevanceNote}
            </a>
          )}
        </article>

        {/* AI explanation */}
        <section aria-label="Why this source matters" className={styles.explanationSection}>
          <h2 className={styles.sectionTitle}>Why This Source?</h2>

          {explanation ? (
            <div className={`${styles.explanation} card`} data-testid="source-explanation">
              <p>{explanation}</p>
            </div>
          ) : (
            <button
              type="button"
              className={styles.explainBtn}
              onClick={handleExplain}
              disabled={loadingExplanation}
              data-testid="explain-btn"
            >
              {loadingExplanation ? 'Analysing…' : 'Ask BackWords to explain this source'}
            </button>
          )}

          {explainError && (
            <div role="alert" className={styles.error}>{explainError}</div>
          )}
        </section>

        {/* Related research */}
        {result.relatedWorks && result.relatedWorks.length > 0 && (
          <section aria-label="Related research" className={styles.relatedSection}>
            <h2 className={styles.sectionTitle}>Related Research</h2>
            <ul className={styles.relatedList}>
              {result.relatedWorks.slice(0, 3).map(w => (
                <li key={w.workId} className={styles.relatedItem}>
                  <h3 className={styles.relatedTitle}>{w.title}</h3>
                  {w.creator && <p className={styles.relatedMeta}>{w.creator}</p>}
                  {w.links[0] && (
                    <a href={w.links[0].url} target="_blank" rel="noopener noreferrer" className={styles.relatedLink}>
                      View ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <NavBar />
    </div>
  )
}
