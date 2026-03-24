import { useMemo, useRef, useState } from 'react'
import NavBar from '@/components/NavBar'
import { useTheme } from '@/design/theme'
import styles from './BenchmarkLab.module.css'

type Scenario = 'interpret-lite' | 'explain-lite' | 'chat-lite'

interface BenchmarkApiRunDetail {
  run: number
  ok: boolean
  durationMs: number
  startedAt: string
  completedAt: string
  xaiStatus?: number
  retryWithoutReasoningEffort?: boolean
  xaiHeaders?: Record<string, string>
  error?: string
}

interface BenchmarkApiResponse {
  endpoint: string
  scenario: Scenario
  model: string
  elapsedMs: number
  throughputRps: number
  runs: {
    total: number
    success: number
    failed: number
  }
  latencyMs: {
    min: number | null
    mean: number | null
    p50: number | null
    p90: number | null
    p95: number | null
    p99: number | null
    max: number | null
  }
  failureBreakdown: Array<{ error: string; count: number }>
  runDetails?: BenchmarkApiRunDetail[]
  error?: string
}

interface RunRow {
  index: number
  clientStartedAt: string
  clientDurationMs: number
  responseStatus: number
  ok: boolean
  serverDurationMs: number | null
  xaiStatus?: number
  retryWithoutReasoningEffort?: boolean
  responseHeaders: Record<string, string>
  xaiHeaders: Record<string, string>
  error?: string
}

const MODELS = [
  'grok-4-1-fast-non-reasoning',
  'grok-4-1-fast-reasoning',
  'grok-4.20-0309-non-reasoning',
]

export default function BenchmarkLab() {
  const { settings } = useTheme()
  const [scenario, setScenario] = useState<Scenario>('interpret-lite')
  const [model, setModel] = useState<string>(settings.preferredModel)
  const [totalRuns, setTotalRuns] = useState(20)
  const [concurrency, setConcurrency] = useState(2)
  const [warmup, setWarmup] = useState(2)
  const [timeoutMs, setTimeoutMs] = useState(45000)
  const [maxTokens, setMaxTokens] = useState(256)
  const [jsonMode, setJsonMode] = useState(true)
  const [benchmarkKey, setBenchmarkKey] = useState('')
  const [running, setRunning] = useState(false)
  const [statusText, setStatusText] = useState('Idle')
  const [rows, setRows] = useState<RunRow[]>([])
  const [latestBody, setLatestBody] = useState<BenchmarkApiResponse | null>(null)

  const cancelRef = useRef(false)

  const completionPct = totalRuns > 0 ? Math.round((rows.length / totalRuns) * 100) : 0
  const successes = rows.filter((r) => r.ok).length
  const failures = rows.length - successes
  const clientDurations = rows.filter((r) => r.ok).map((r) => r.clientDurationMs).sort((a, b) => a - b)
  const serverDurations = rows.filter((r) => r.ok && r.serverDurationMs !== null).map((r) => r.serverDurationMs as number).sort((a, b) => a - b)

  const latestRow = rows.length > 0 ? rows[rows.length - 1] : null

  const liveStats = useMemo(() => {
    const percentile = (values: number[], p: number): number | null => {
      if (values.length === 0) return null
      const rank = (p / 100) * (values.length - 1)
      const lo = Math.floor(rank)
      const hi = Math.ceil(rank)
      if (lo === hi) return Math.round(values[lo])
      const t = rank - lo
      return Math.round(values[lo] * (1 - t) + values[hi] * t)
    }

    const mean = (values: number[]): number | null => {
      if (values.length === 0) return null
      return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    }

    return {
      client: {
        mean: mean(clientDurations),
        p50: percentile(clientDurations, 50),
        p95: percentile(clientDurations, 95),
      },
      server: {
        mean: mean(serverDurations),
        p50: percentile(serverDurations, 50),
        p95: percentile(serverDurations, 95),
      },
    }
  }, [clientDurations, serverDurations])

  async function doWarmup(baseUrl: string, headers: HeadersInit) {
    if (warmup <= 0) return
    for (let i = 0; i < warmup; i += 1) {
      if (cancelRef.current) return
      setStatusText(`Warmup ${i + 1}/${warmup}`)
      await fetch(`${baseUrl}/benchmark`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scenario,
          model,
          iterations: 1,
          warmup: 0,
          concurrency: 1,
          timeoutMs,
          maxTokens,
          jsonMode,
          includeRunDetails: false,
        }),
      })
    }
  }

  async function executeSingleRun(baseUrl: string, headers: HeadersInit, index: number): Promise<void> {
    const startedMs = performance.now()
    const clientStartedAt = new Date().toISOString()

    let responseStatus = 0
    let responseHeaders: Record<string, string> = {}
    let row: RunRow

    try {
      const response = await fetch(`${baseUrl}/benchmark`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scenario,
          model,
          iterations: 1,
          warmup: 0,
          concurrency: 1,
          timeoutMs,
          maxTokens,
          jsonMode,
          includeRunDetails: true,
        }),
      })

      responseStatus = response.status
      responseHeaders = Object.fromEntries(response.headers.entries())
      const body = (await response.json()) as BenchmarkApiResponse
      const detail = body.runDetails?.[0]
      setLatestBody(body)

      row = {
        index,
        clientStartedAt,
        clientDurationMs: Math.round(performance.now() - startedMs),
        responseStatus,
        ok: response.ok && Boolean(detail?.ok),
        serverDurationMs: detail?.durationMs ?? null,
        xaiStatus: detail?.xaiStatus,
        retryWithoutReasoningEffort: detail?.retryWithoutReasoningEffort,
        responseHeaders,
        xaiHeaders: detail?.xaiHeaders ?? {},
        error: detail?.error ?? body.error,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      row = {
        index,
        clientStartedAt,
        clientDurationMs: Math.round(performance.now() - startedMs),
        responseStatus,
        ok: false,
        serverDurationMs: null,
        responseHeaders,
        xaiHeaders: {},
        error: msg,
      }
    }

    setRows((prev) => {
      const next = [...prev, row].sort((a, b) => a.index - b.index)
      return next
    })
  }

  async function runBenchmarks() {
    if (running) return

    cancelRef.current = false
    setRunning(true)
    setRows([])
    setLatestBody(null)

    const baseUrl = settings.apiBaseURL.replace(/\/+$/, '')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (benchmarkKey.trim()) headers['X-Benchmark-Key'] = benchmarkKey.trim()

    try {
      await doWarmup(baseUrl, headers)
      if (cancelRef.current) {
        setStatusText('Cancelled during warmup')
        setRunning(false)
        return
      }

      let nextRun = 1
      const workerCount = Math.max(1, Math.min(concurrency, 8))

      setStatusText('Running benchmark')

      const workers = Array.from({ length: workerCount }, async () => {
        while (!cancelRef.current) {
          const index = nextRun
          if (index > totalRuns) return
          nextRun += 1
          await executeSingleRun(baseUrl, headers, index)
          setStatusText(`Running benchmark (${Math.min(index, totalRuns)}/${totalRuns})`)
        }
      })

      await Promise.all(workers)

      if (cancelRef.current) {
        setStatusText('Cancelled')
      } else {
        setStatusText('Completed')
      }
    } finally {
      setRunning(false)
    }
  }

  function stopBenchmarks() {
    cancelRef.current = true
  }

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className={styles.header}>
        <h1 className={styles.title}>Benchmark Lab</h1>
        <p className={styles.subtitle}>Speed-test the API in isolation with live telemetry, inspired by network benchmark dashboards.</p>
      </header>

      <main id="main" className={styles.main}>
        <section className={styles.panel} aria-label="Benchmark configuration">
          <h2 className={styles.panelTitle}>Test Configuration</h2>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Scenario</span>
              <select value={scenario} onChange={(e) => setScenario(e.target.value as Scenario)}>
                <option value="interpret-lite">Interpret Lite</option>
                <option value="explain-lite">Explain Lite</option>
                <option value="chat-lite">Chat Lite</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Model</span>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                {MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Total Runs</span>
              <input type="number" min={1} max={200} value={totalRuns} onChange={(e) => setTotalRuns(Math.max(1, Number(e.target.value) || 1))} />
            </label>

            <label className={styles.field}>
              <span>Concurrency</span>
              <input type="number" min={1} max={8} value={concurrency} onChange={(e) => setConcurrency(Math.max(1, Math.min(8, Number(e.target.value) || 1)))} />
            </label>

            <label className={styles.field}>
              <span>Warmup Calls</span>
              <input type="number" min={0} max={10} value={warmup} onChange={(e) => setWarmup(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} />
            </label>

            <label className={styles.field}>
              <span>Timeout (ms)</span>
              <input type="number" min={1000} max={120000} step={500} value={timeoutMs} onChange={(e) => setTimeoutMs(Math.max(1000, Number(e.target.value) || 1000))} />
            </label>

            <label className={styles.field}>
              <span>Max Tokens</span>
              <input type="number" min={16} max={4096} value={maxTokens} onChange={(e) => setMaxTokens(Math.max(16, Number(e.target.value) || 16))} />
            </label>

            <label className={styles.field}>
              <span>JSON Mode</span>
              <select value={jsonMode ? 'true' : 'false'} onChange={(e) => setJsonMode(e.target.value === 'true')}>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
          </div>

          <label className={styles.fieldFull}>
            <span>Benchmark API Key (optional)</span>
            <input
              type="password"
              placeholder="Only required if BENCHMARK_API_KEY is set on the server"
              value={benchmarkKey}
              onChange={(e) => setBenchmarkKey(e.target.value)}
            />
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.runBtn} onClick={runBenchmarks} disabled={running}>Run Benchmark</button>
            <button type="button" className={styles.stopBtn} onClick={stopBenchmarks} disabled={!running}>Stop</button>
            <span className={styles.status}>{statusText}</span>
          </div>

          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${completionPct}%` }} />
            </div>
            <span className={styles.progressLabel}>{rows.length}/{totalRuns} ({completionPct}%)</span>
          </div>
        </section>

        <section className={styles.panel} aria-label="Live summary">
          <h2 className={styles.panelTitle}>Live Summary</h2>
          <div className={styles.kpiGrid}>
            <article className={styles.kpi}><h3>Success</h3><p>{successes}</p></article>
            <article className={styles.kpi}><h3>Failed</h3><p>{failures}</p></article>
            <article className={styles.kpi}><h3>Client p95</h3><p>{liveStats.client.p95 ?? '—'} ms</p></article>
            <article className={styles.kpi}><h3>Server p95</h3><p>{liveStats.server.p95 ?? '—'} ms</p></article>
          </div>

          <div className={styles.sparkline} aria-label="Latency bars">
            {rows.slice(-50).map((row) => (
              <span
                key={row.index}
                className={`${styles.bar} ${row.ok ? styles.barOk : styles.barFail}`}
                style={{ height: `${Math.max(8, Math.min(100, Math.round(row.clientDurationMs / 20)))}%` }}
                title={`Run ${row.index}: ${row.clientDurationMs}ms`}
              />
            ))}
          </div>
        </section>

        <section className={styles.panel} aria-label="Live telemetry">
          <h2 className={styles.panelTitle}>Live Telemetry</h2>
          {latestRow ? (
            <div className={styles.telemetryGrid}>
              <article className={styles.telemetryCard}>
                <h3>Latest Request</h3>
                <p>Run {latestRow.index} · HTTP {latestRow.responseStatus} · Client {latestRow.clientDurationMs} ms</p>
                <p>Server {latestRow.serverDurationMs ?? '—'} ms · xAI status {latestRow.xaiStatus ?? '—'}</p>
                <p>Retry without reasoning effort: {latestRow.retryWithoutReasoningEffort ? 'yes' : 'no'}</p>
                {latestRow.error && <p className={styles.errorText}>Error: {latestRow.error}</p>}
              </article>

              <article className={styles.telemetryCard}>
                <h3>Endpoint Response Headers</h3>
                <pre>{JSON.stringify(latestRow.responseHeaders, null, 2)}</pre>
              </article>

              <article className={styles.telemetryCard}>
                <h3>xAI Response Headers</h3>
                <pre>{JSON.stringify(latestRow.xaiHeaders, null, 2)}</pre>
              </article>

              <article className={styles.telemetryCard}>
                <h3>Latest Benchmark Payload</h3>
                <pre>{JSON.stringify(latestBody, null, 2)}</pre>
              </article>
            </div>
          ) : (
            <p className={styles.empty}>Run a benchmark to stream telemetry here.</p>
          )}
        </section>

        <section className={styles.panel} aria-label="Run history">
          <h2 className={styles.panelTitle}>Run History</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Started</th>
                  <th>HTTP</th>
                  <th>xAI</th>
                  <th>Client ms</th>
                  <th>Server ms</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.index}>
                    <td>{row.index}</td>
                    <td>{row.clientStartedAt.split('T')[1]?.replace('Z', '') ?? row.clientStartedAt}</td>
                    <td>{row.responseStatus || '—'}</td>
                    <td>{row.xaiStatus ?? '—'}</td>
                    <td>{row.clientDurationMs}</td>
                    <td>{row.serverDurationMs ?? '—'}</td>
                    <td className={row.ok ? styles.ok : styles.fail}>{row.ok ? 'ok' : 'fail'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <NavBar />
    </div>
  )
}