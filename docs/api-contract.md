# BackWords API Contract

Base URL: configurable in Settings.

Production default: `https://backwords-api.netlify.app/.netlify/functions`

Local development default: `http://localhost:8888/.netlify/functions`

All requests and responses use `Content-Type: application/json`.

---

## POST /interpret

Interpret a word, phrase, or passage in historical context.

### Request

```json
{
  "query": "awful",
  "mode": "word",
  "requestedDate": "1850-01-01"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | ✅ | Word, phrase, or passage text |
| `mode` | `"word"` \| `"phrase"` \| `"paragraph"` | ✅ | Analysis mode |
| `requestedDate` | string (ISO8601) | ❌ | Preferred historical anchor date when supported by the response source. |
| `useMock` | boolean | ❌ | Internal/testing switch; not intended for normal production callers. |
| `model` | string | ❌ | Optional server model override for testing or deep-dive workflows. |

### Response

```json
{
  "lexemeId": "awful",
  "query": "awful",
  "normalizedQuery": "awful",
  "mode": "word",
  "requestedDate": "1850-01-01",
  "currentSnapshot": {
    "snapshotId": "awful_current",
    "date": "2024-01-01",
    "eraLabel": "Contemporary",
    "definition": "Very bad or unpleasant; used as an intensifier.",
    "usageNote": "Used casually to express strong disapproval or emphasis.",
    "exampleUsage": "The weather was awful yesterday.",
    "register": "informal",
    "sentiment": "negative",
    "confidence": 0.98,
    "sourceIds": ["oed_awful_modern"]
  },
  "historicalSnapshots": [
    {
      "snapshotId": "awful_old_english",
      "date": "0900-01-01",
      "eraLabel": "Old English",
      "definition": "Inspiring fear or dread; terror-inducing.",
      "usageNote": "Primarily religious and supernatural contexts.",
      "exampleUsage": "The awful wrath of God.",
      "register": "formal",
      "sentiment": "negative",
      "confidence": 0.87,
      "sourceIds": ["bosworth_toller"]
    }
  ],
  "summaryOfChange": {
    "shortSummary": "From awe-inspiring reverence to casual intensifier for 'bad'.",
    "longSummary": "Awful began as a deeply reverent adjective meaning 'worthy of awe'—used for divine power, natural sublimity, and solemn occasions. By the 19th century it had weakened to 'impressively large or notable'. In the 20th century, pejoration accelerated, and 'awful' came to mean simply 'very bad', with the intensifier use ('awfully kind') preserving a ghost of its original amplifying force.",
    "sentimentShift": "positive-to-negative",
    "driftType": "pejoration",
    "driftMagnitude": 0.9
  },
  "keyDates": [
    {
      "date": "1755-01-01",
      "label": "Johnson's Dictionary",
      "significance": "Defined 'awful' as 'that which strikes with awe; that which fills with reverence'."
    },
    {
      "date": "1884-01-01",
      "label": "OED First Edition",
      "significance": "First systematic record of the weakening colloquial sense."
    }
  ],
  "sources": [
    {
      "sourceId": "oed_awful_1",
      "title": "Oxford English Dictionary – awful, adj.",
      "author": "Oxford University Press",
      "publisher": "Oxford University Press",
      "publishedDate": "2023-09-01",
      "sourceType": "dictionary",
      "attribution": "Paraphrase. OED content © Oxford University Press.",
      "excerpt": "Originally: inspiring reverential wonder or fear. Later weakened to: very great, notable, or unpleasant.",
      "relevanceNote": "Primary authority on historical English usage.",
      "confidence": 0.98
    }
  ],
  "relatedWorks": [
    {
      "workId": "rw_wordsworth_prelude",
      "title": "The Prelude",
      "creator": "William Wordsworth",
      "year": 1850,
      "workType": "poetry",
      "whyRelevant": "Contains canonical uses of 'awful' in the sublime/reverential sense.",
      "publicDomainHint": true,
      "links": []
    }
  ],
  "relatedPages": [
    {
      "pageId": "pg_semantic_drift",
      "title": "Semantic Drift",
      "slug": "semantic-drift",
      "summary": "How and why word meanings change over time.",
      "route": "/pages/semantic-drift",
      "tags": ["linguistics","history"]
    }
  ],
  "relatedConcepts": [
    {
      "conceptId": "terrible",
      "label": "terrible",
      "relationship": "parallel-pejoration",
      "note": "Underwent similar pejoration from 'terror-inspiring' to 'very bad'."
    }
  ],
  "ambiguityNotes": [],
  "generatedAt": "2024-01-01T00:00:00Z",
  "modelVersion": "mock-seed-v1",
  "cacheHit": true
}
```

Notes:
- `selectedSnapshot`, `resolvedEraLabel`, and `passage` are not currently guaranteed by the live Netlify API and should be treated as optional/unsupported until explicitly implemented.
- `cacheHit` is optional and only present when a cached interpretation is returned.

### Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Missing or invalid `query` or `mode` |
| 404 | No seed or interpretation found for query |
| 500 | Internal server error |

```json
{ "error": "No interpretation found for query: 'xyz'" }
```

---

## POST /explain-source

Ask the engine to explain *why* a specific source supports a specific interpretation.

### Request

```json
{
  "sourceId": "oed_awful_1",
  "sourceTitle": "Oxford English Dictionary - awful, adj.",
  "word": "awful",
  "sourceDate": "2023-09-01",
  "quote": "Originally: inspiring reverential wonder or fear."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceId` | string | ✅ | Source to explain |
| `sourceTitle` | string | ✅ | Human-readable source title used to frame the explanation prompt |
| `word` | string | ✅ | Word/phrase being interpreted |
| `sourceDate` | string | ❌ | Optional publication date or best-known source date |
| `quote` | string | ❌ | Optional excerpt shown to the model for context |
| `context` | string | ❌ | Optional caller-supplied context string |
| `useMock` | boolean | ❌ | Internal/testing switch; not intended for normal production callers |
| `model` | string | ❌ | Optional server model override |

### Response

```json
{
  "sourceId": "oed_awful_1",
  "explanation": "The OED entry for 'awful' traces the word's etymology from Old English 'egeful' (fear-inducing) through its 18th-century meaning of reverential awe to the colloquial weakening in the 19th century. This dictionary entry is the gold standard reference for this transition because it provides dated quotations spanning over a thousand years of written English.",
  "effectiveModel": "grok-4-1-fast-non-reasoning",
  "generatedAt": "2024-01-01T00:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sourceId` | string | Echoes request |
| `explanation` | string | Prose explanation of source relevance |
| `effectiveModel` | string | Actual model used by the server |
| `generatedAt` | string (ISO8601) | Response timestamp |

---

## GET /health

Health check. No auth required.

### Response

```json
{
  "status": "ok",
  "version": "pwa-v0.1.0",
  "mode": "live",
  "seedCount": 6,
  "timestamp": "2026-03-23T03:21:02.940Z",
  "models": {
    "interpret": "grok-4-1-fast-non-reasoning",
    "explain": "grok-4-1-fast-non-reasoning",
    "deepDive": "grok-4.20-0309-non-reasoning"
  },
  "deployment": {
    "buildId": "unknown",
    "commitSha": "unknown",
    "deployedAt": "unknown",
    "netlifyDeployId": "unknown",
    "cacheSchemaVersion": "v5"
  }
}
```

---

## POST /benchmark

Run isolated synthetic benchmark calls against xAI without exercising normal app UI flows.

Safety controls:
- Enabled by default so the benchmark endpoint works from repo configuration alone.
- You can disable it in any environment with `BENCHMARK_ENABLED=false`.
- Optional shared-secret auth via `BENCHMARK_API_KEY` and request header `X-Benchmark-Key`.
- Hard limits are enforced server-side for iterations, concurrency, timeout, and token budget.

### Request

```json
{
  "scenario": "interpret-lite",
  "model": "grok-4-1-fast-reasoning",
  "iterations": 12,
  "warmup": 2,
  "concurrency": 2,
  "timeoutMs": 45000,
  "jsonMode": true,
  "maxTokens": 256
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scenario` | `"interpret-lite"` \| `"explain-lite"` \| `"chat-lite"` | ❌ | Synthetic prompt profile used for measurement. Defaults to `interpret-lite`. |
| `model` | string | ❌ | xAI model override. Defaults to server interpret model. |
| `iterations` | number | ❌ | Measured requests (clamped to 1–50). |
| `warmup` | number | ❌ | Warmup requests excluded from stats (clamped to 0–10). |
| `concurrency` | number | ❌ | Parallel workers (clamped to 1–8). |
| `timeoutMs` | number | ❌ | Per-request timeout in ms (clamped to 1000–120000). |
| `jsonMode` | boolean | ❌ | Forces JSON response-format request hint. |
| `maxTokens` | number | ❌ | Max token limit (clamped to 16–4096). |
| `includeRunDetails` | boolean | ❌ | Include per-run telemetry records in the response. Defaults to `true`. |

### Response

```json
{
  "endpoint": "benchmark",
  "startedAt": "2026-03-23T12:00:00.000Z",
  "completedAt": "2026-03-23T12:00:09.500Z",
  "scenario": "interpret-lite",
  "model": "grok-4-1-fast-reasoning",
  "config": {
    "iterations": 12,
    "warmup": 2,
    "concurrency": 2,
    "timeoutMs": 45000,
    "jsonMode": true,
    "maxTokens": 256
  },
  "elapsedMs": 9500,
  "throughputRps": 1.26,
  "runs": {
    "total": 12,
    "success": 12,
    "failed": 0
  },
  "latencyMs": {
    "min": 620,
    "mean": 781,
    "p50": 760,
    "p90": 910,
    "p95": 940,
    "p99": 980,
    "max": 990
  },
  "failureBreakdown": []
}
```

When `includeRunDetails` is `true` (default), the response also includes `runDetails[]` with per-run telemetry:
- run number
- ok/fail flag
- per-run latency
- start/end timestamps
- xAI HTTP status
- xAI headers returned by the upstream endpoint
- reasoning-effort fallback indicator
- error text for failed runs

### Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Invalid JSON body or invalid field values |
| 403 | Missing/invalid `X-Benchmark-Key` when key auth is configured |
| 404 | Benchmark endpoint disabled |
| 405 | Method not allowed |

Example invocation:

```bash
curl -sS -X POST "https://backwords-api.netlify.app/.netlify/functions/benchmark" \
  -H "Content-Type: application/json" \
  -H "X-Benchmark-Key: $BENCHMARK_API_KEY" \
  -d '{"scenario":"interpret-lite","model":"grok-4-1-fast-reasoning","iterations":10,"warmup":2,"concurrency":2}'
```

---

## Benchmark Web UI

The PWA includes a dedicated Benchmark Lab page at:

- `/benchmark`

This page lets you:
- Configure model, scenario, run count, concurrency, warmup, timeout, token budget, and JSON mode
- Execute benchmark runs with live progress updates
- View all endpoint response headers and upstream xAI headers from the latest run
- Inspect per-run history and live p95-like latency trends while tests are running

---

## CORS

The proxy accepts requests from any origin during development (`allow_origins=["*"]`). In production, restrict to the app's bundle ID / known origins.

---

## ATS Notes (iOS)

For local development (HTTP to localhost), add to `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsLocalNetworking</key>
  <true/>
</dict>
```

This is sufficient for `localhost` and `.local` domains without disabling ATS globally.
