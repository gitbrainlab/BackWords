import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import NavBar from '@/components/NavBar'
import { get } from '@/lib/api'
import type { KnowledgePageData } from '@/types'
import styles from './KnowledgePage.module.css'

export default function KnowledgePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState<KnowledgePageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    get<KnowledgePageData>(`/pages?slug=${encodeURIComponent(slug)}`)
      .then(data => setPage(data))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load page'))
      .finally(() => setLoading(false))
  }, [slug])

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
        {page && <h1 className={styles.title}>{page.title}</h1>}
      </header>

      <main id="main" className={styles.main}>
        {loading && (
          <div className={styles.loading} aria-live="polite">
            <span aria-hidden="true">⋯</span>
            <span className="visually-hidden">Loading…</span>
          </div>
        )}

        {error && (
          <div role="alert" className={styles.error}>
            <p>{error}</p>
            <button type="button" onClick={() => navigate(-1)}>Go back</button>
          </div>
        )}

        {page && !loading && (
          <article className={styles.article} data-testid="knowledge-page-content">
            {page.summary && (
              <p className={`${styles.summary} card`}>{page.summary}</p>
            )}

            {page.tags && page.tags.length > 0 && (
              <div className={styles.tags} aria-label="Tags">
                {page.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}

            <div className={styles.content}>
              <ReactMarkdown>{page.content}</ReactMarkdown>
            </div>
          </article>
        )}
      </main>

      <NavBar />
    </div>
  )
}
