import { Component, Suspense, lazy } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ResultProvider } from './context/ResultContext'
import InstallPrompt from './components/InstallPrompt'
import OfflineBanner from './components/OfflineBanner'

// Route-level code splitting for performance
const Home        = lazy(() => import('./pages/Home'))
const Searching   = lazy(() => import('./pages/Searching'))
const Result      = lazy(() => import('./pages/Result'))
const Timeline    = lazy(() => import('./pages/Timeline'))
const SourceDetail = lazy(() => import('./pages/SourceDetail'))
const Settings    = lazy(() => import('./pages/Settings'))
const BenchmarkLab = lazy(() => import('./pages/BenchmarkLab'))
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'))
const PassageView = lazy(() => import('./pages/PassageView'))

function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        fontSize: '1.5rem',
        color: 'var(--color-muted)',
        fontFamily: 'var(--font-serif)',
      }}
    >
      <span aria-hidden="true">⧗</span>
      <span className="visually-hidden">Loading…</span>
    </div>
  )
}

interface ErrorBoundaryState { hasError: boolean; message: string }

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(err: unknown): ErrorBoundaryState {
    const message = err instanceof Error ? err.message : String(err)
    return { hasError: true, message }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', err, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100dvh',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <p style={{ fontSize: '1.1rem' }}>Something went wrong loading this page.</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Custom domain (backwords.art) serves at root /; GitHub Pages fallback uses /BackWords
const BASENAME = import.meta.env.VITE_BASE_PATH ?? '/'

export default function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <OfflineBanner />
      <InstallPrompt />
      <BrowserRouter basename={BASENAME}>
        <ResultProvider>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/"                  element={<Home />} />
                <Route path="/searching"         element={<Searching />} />
                <Route path="/result"            element={<Result />} />
                <Route path="/timeline"          element={<Timeline />} />
                <Route path="/passages"          element={<PassageView />} />
                <Route path="/source/:sourceId"  element={<SourceDetail />} />
                <Route path="/settings"          element={<Settings />} />
                <Route path="/benchmark"         element={<BenchmarkLab />} />
                <Route path="/pages/:slug"       element={<KnowledgePage />} />
                {/* Fallback */}
                <Route path="*"                  element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </ResultProvider>
      </BrowserRouter>
    </>
  )
}
