import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResult } from '@/context/ResultContext'
import styles from './Searching.module.css'
interface Phase {
  message: (q: string) => string
  progress: number
  delay: number
}

const PHASES: Phase[] = [
  { message: q => `Tracing the roots of "${q}"…`,       progress:  8, delay:     0 },
  { message: () => 'Consulting historical records…',     progress: 26, delay:  2800 },
  { message: () => 'Analysing semantic shifts…',         progress: 44, delay:  5500 },
  { message: () => 'Cross-referencing etymologies…',     progress: 60, delay:  8500 },
  { message: () => 'Mapping meaning across centuries…',  progress: 75, delay: 12500 },
  { message: () => 'Almost there…',                      progress: 88, delay: 17000 },
]

export default function Searching() {
  const navigate = useNavigate()
  const { searchStatus, searchError, query } = useResult()
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [progress, setProgress] = useState(PHASES[0].progress)
  const [elapsed, setElapsed] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Guard: if navigated here with no search in flight, go home
  useEffect(() => {
    if (searchStatus === 'idle') navigate('/', { replace: true })
  }, [searchStatus, navigate])

  // Kick off phase timers once on mount
  useEffect(() => {
    PHASES.forEach((phase, i) => {
      if (i === 0) return
      const t = setTimeout(() => {
        setPhaseIndex(i)
        setProgress(phase.progress)
      }, phase.delay)
      timersRef.current.push(t)
    })
    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }
  }, [])

  // Live elapsed timer
  useEffect(() => {
    if (searchStatus !== 'loading') return
    const start = Date.now()
    const id = setInterval(() => setElapsed(Date.now() - start), 250)
    return () => clearInterval(id)
  }, [searchStatus])

  // React to API resolution
  useEffect(() => {
    if (searchStatus === 'done') {
      setProgress(100)
      const t = setTimeout(() => navigate('/result', { replace: true }), 350)
      return () => clearTimeout(t)
    }
  }, [searchStatus, navigate])

  if (searchStatus === 'idle') return null

  if (searchStatus === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <p className={styles.errorTitle}>Something went wrong</p>
          <p className={styles.errorMsg}>{searchError ?? 'The search could not complete.'}</p>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => navigate('/', { replace: true })}
          >
            ← Try again
          </button>
        </div>
      </div>
    )
  }

  const phase = PHASES[Math.min(phaseIndex, PHASES.length - 1)]

  return (
    <div className={styles.page} role="status" aria-live="polite" aria-label="Searching…">
      <div className={styles.content}>
        <div className={styles.wordDisplay} aria-hidden="true">
          <span className={`${styles.word} serif`}>{query}</span>
          <span className={styles.cursor} />
        </div>

        <p className={styles.phaseMessage} key={phaseIndex}>
          {phase.message(query)}
        </p>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Search progress"
        >
          <div
            className={`${styles.progressFill} ${searchStatus === 'done' ? styles.progressComplete : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className={styles.hint}>
          {searchStatus === 'loading'
            ? <><span className={styles.timer}>{(elapsed / 1000).toFixed(1)}s</span> · This may take 15–30 seconds</>
            : 'Complete'
          }
        </p>
      </div>
    </div>
  )
}
