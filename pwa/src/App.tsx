import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ResultProvider } from './context/ResultContext'
import InstallPrompt from './components/InstallPrompt'
import OfflineBanner from './components/OfflineBanner'

// Route-level code splitting for performance
const Home        = lazy(() => import('./pages/Home'))
const Result      = lazy(() => import('./pages/Result'))
const Timeline    = lazy(() => import('./pages/Timeline'))
const SourceDetail = lazy(() => import('./pages/SourceDetail'))
const Settings    = lazy(() => import('./pages/Settings'))
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

// GitHub Pages deploys under /BackWords/
const BASENAME = import.meta.env.VITE_BASE_PATH ?? '/BackWords'

export default function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <OfflineBanner />
      <InstallPrompt />
      <BrowserRouter basename={BASENAME}>
        <ResultProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/"                  element={<Home />} />
              <Route path="/result"            element={<Result />} />
              <Route path="/timeline"          element={<Timeline />} />
              <Route path="/passages"          element={<PassageView />} />
              <Route path="/source/:sourceId"  element={<SourceDetail />} />
              <Route path="/settings"          element={<Settings />} />
              <Route path="/pages/:slug"       element={<KnowledgePage />} />
              {/* Fallback */}
              <Route path="*"                  element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ResultProvider>
      </BrowserRouter>
    </>
  )
}
