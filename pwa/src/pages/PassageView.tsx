import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '@/components/NavBar'
import { useResult } from '@/context/ResultContext'
import styles from './PassageView.module.css'

export default function PassageView() {
  const navigate = useNavigate()
  const { result } = useResult()

  useEffect(() => {
    if (!result) navigate('/', { replace: true })
  }, [result, navigate])

  if (!result) return null

  const passage = result.passage

  if (!passage) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
          <h1 className={styles.title}>Passages</h1>
        </header>
        <div className={styles.empty}>No indexed passages for this word.</div>
        <NavBar />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ← Back
        </button>
        <h1 className={styles.title}>Passages — <em className="serif">{result.query}</em></h1>
      </header>

      <main id="main" className={styles.main}>
        <article className={`${styles.passageCard} card`} data-testid="passage-0">
          <p className={styles.passageText} aria-label="Historical passage">
            <HighlightedText
              text={passage.originalText}
              highlights={passage.highlights}
            />
          </p>
          {passage.modernParaphrase && (
            <footer className={styles.passageFooter}>
              <p className={styles.paraphrase}><em>Modern paraphrase:</em> {passage.modernParaphrase}</p>
            </footer>
          )}
        </article>
      </main>

      <NavBar />
    </div>
  )
}

interface HighlightedTextProps {
  text: string
  highlights: Array<{ start: number; end: number; label: string }>
}

function HighlightedText({ text, highlights }: HighlightedTextProps) {
  if (!highlights.length) return <>{text}</>

  const sorted = [...highlights].sort((a, b) => a.start - b.start)
  const parts: ReactNode[] = []
  let cursor = 0

  for (const h of sorted) {
    if (h.start > cursor) parts.push(text.slice(cursor, h.start))
    parts.push(
      <mark key={h.start} className={styles.highlight} title={h.label}>
        {text.slice(h.start, h.end)}
      </mark>,
    )
    cursor = h.end
  }
  if (cursor < text.length) parts.push(text.slice(cursor))

  return <>{parts}</>
}
