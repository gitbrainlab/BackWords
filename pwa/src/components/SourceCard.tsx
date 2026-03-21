import type { SourceCitation } from '@/types'
import styles from './SourceCard.module.css'

interface Props {
  source: SourceCitation
  onExplain?: (sourceId: string) => void
  onNavigate?: (sourceId: string) => void
  compact?: boolean
}

const SOURCE_ICONS: Record<string, string> = {
  literary: '📖',
  academic: '🎓',
  journalistic: '📰',
  legal: '⚖️',
  speech: '🎙️',
  digital: '💻',
}

function ConfidenceDots({ score }: { score: number }) {
  const filled = Math.round(score * 5)
  return (
    <span className={styles.dots} aria-label={`Confidence: ${Math.round(score * 100)}%`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`${styles.dot} ${i < filled ? styles.dotFilled : ''}`} aria-hidden="true" />
      ))}
    </span>
  )
}

export default function SourceCard({ source, onExplain, onNavigate, compact = false }: Props) {
  const icon = SOURCE_ICONS[source.sourceType] ?? '📄'

  return (
    <article
      className={`${styles.card} ${compact ? styles.compact : ''}`}
      data-testid="source-card"
      data-source-id={source.sourceId}
    >
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">{icon}</span>
        <div className={styles.meta}>
          <span className={styles.date}>{source.publishedDate ?? ''}</span>
          {source.confidence !== undefined && <ConfidenceDots score={source.confidence} />}
        </div>
      </header>

      <h3 className={styles.title}>{source.title}</h3>
      {source.author && <p className={styles.author}>{source.author}</p>}

      {!compact && source.excerpt && (
        <blockquote className={styles.quote}>
          <p>"{source.excerpt}"</p>
        </blockquote>
      )}

      <footer className={styles.footer}>

        {onExplain && (
          <button
            type="button"
            className={styles.explainBtn}
            onClick={() => onExplain(source.sourceId)}
          >
            Why this?
          </button>
        )}
        {onNavigate && (
          <button
            type="button"
            className={styles.detailBtn}
            onClick={() => onNavigate(source.sourceId)}
          >
            Details →
          </button>
        )}
      </footer>
    </article>
  )
}
