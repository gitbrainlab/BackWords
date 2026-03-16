# BackWords API Contract

Base URL: configurable in Settings (default `http://localhost:8000`)

All requests and responses use `Content-Type: application/json`.

---

## POST /interpret

Interpret a word, phrase, or passage in historical context.

### Request

```json
{
  "query": "silly",
  "mode": "word",
  "selectedDate": "1850-01-01",
  "clientContext": {
    "appVersion": "1.0.0",
    "locale": "en-US",
    "deviceId": "optional-anonymous-id"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | ✅ | Word, phrase, or passage text |
| `mode` | `"word"` \| `"phrase"` \| `"paragraph"` | ✅ | Analysis mode |
| `selectedDate` | string (ISO8601) | ❌ | Anchor the response to this date. If omitted, returns current snapshot as primary plus all historical. |
| `clientContext` | object | ❌ | Optional telemetry / personalisation context |

### Response

```json
{
  "lexemeId": "silly",
  "query": "silly",
  "normalizedQuery": "silly",
  "requestedDate": "1850-01-01",
  "resolvedEraLabel": "Victorian Era",
  "currentSnapshot": {
    "snapshotId": "silly_current",
    "date": "2024-01-01",
    "eraLabel": "Contemporary",
    "definition": "Showing a lack of common sense or judgement; absurd and foolish.",
    "usageNote": "Applied affectionately or dismissively depending on context.",
    "exampleUsage": "Don't be silly — you can't carry all those bags at once.",
    "register": "informal",
    "sentiment": "negative",
    "confidence": 0.97,
    "sourceIds": ["oed_silly_modern"]
  },
  "selectedSnapshot": {
    "snapshotId": "silly_elizabethan",
    "date": "1600-01-01",
    "eraLabel": "Elizabethan",
    "definition": "Feeble of mind; lacking good judgement; simple to the point of being easily deceived.",
    "usageNote": "Shakespeare uses it in this transitional register — between 'harmless' and 'foolish'.",
    "exampleUsage": "A silly fellow, easily gulled.",
    "register": "informal",
    "sentiment": "negative",
    "confidence": 0.89,
    "sourceIds": ["oed_silly_1", "bosworth_toller_silly"]
  },
  "historicalSnapshots": [
    {
      "snapshotId": "silly_old_english",
      "date": "0900-01-01",
      "eraLabel": "Old English",
      "definition": "Blessed; happy; fortunate; spiritually worthy.",
      "usageNote": "From Old English 'sælig' — to be silly was to be in God's favour.",
      "exampleUsage": "Sælig mann — blessed man.",
      "register": "formal",
      "sentiment": "positive",
      "confidence": 0.92,
      "sourceIds": ["bosworth_toller_silly"]
    }
  ],
  "summaryOfChange": {
    "shortSummary": "From 'blessed by God' to 'foolishly trivial' — one of English's most dramatic reversals.",
    "longSummary": "In Old English 'sælig' was a term of the highest spiritual praise: to be silly was to be blessed by God. Through Middle English the sense widened to 'innocent and helpless', then darkened — the innocent became the simple-minded, the simple-minded became the easily-gulled, and by Early Modern English the word had fully pejorated into 'foolish'. Today it sits at the mild end of a spectrum of intellectual dismissal, all memory of its blessed origins lost to most speakers.",
    "sentimentShift": "positive-to-negative",
    "driftType": "pejoration",
    "driftMagnitude": 0.95
  },
  "keyDates": [
    {
      "date": "0900-01-01",
      "label": "Old English sælig",
      "significance": "The root 'sælig' meant divinely blessed — cognate with German 'selig', which still retains this meaning today."
    },
    {
      "date": "1750-01-01",
      "label": "Pejoration complete",
      "significance": "By the mid-18th century dictionaries recorded 'silly' exclusively as 'foolish' or 'trivial'."
    }
  ],
  "sources": [
    {
      "sourceId": "oed_silly_1",
      "title": "Oxford English Dictionary — silly, adj.",
      "author": null,
      "publisher": "Oxford University Press",
      "publishedDate": "2023-09-01",
      "sourceType": "dictionary",
      "attribution": "Paraphrase. OED content © Oxford University Press.",
      "excerpt": "Originally: blessed, happy, fortunate. Later: innocent, harmless. Now chiefly: foolish, showing a lack of sense.",
      "relevanceNote": "Primary authority tracing the full arc from 'blessed' to 'foolish'.",
      "confidence": 0.98
    }
  ],
  "relatedWorks": [
    {
      "workId": "rw_shakespeare_midsummer",
      "title": "A Midsummer Night's Dream",
      "creator": "William Shakespeare",
      "year": 1600,
      "workType": "play",
      "whyRelevant": "Contains uses of 'silly' in its transitional phase — illustrating the word mid-drift between 'harmless' and 'foolish'.",
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
  "passage": null,
  "generatedAt": "2024-01-01T00:00:00Z",
  "modelVersion": "mock-seed-v1"
}
```

### Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Missing or invalid `query` or `mode` |
| 404 | No seed or interpretation found for query |
| 500 | Internal server error |

```json
{ "detail": "No interpretation found for query: 'xyz'" }
```

---

## POST /explain-source

Ask the engine to explain *why* a specific source supports a specific interpretation.

### Request

```json
{
  "sourceId": "oed_silly_1",
  "query": "silly",
  "snapshotId": "silly_elizabethan",
  "clientContext": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceId` | string | ✅ | Source to explain |
| `query` | string | ✅ | Word/phrase being interpreted |
| `snapshotId` | string | ✅ | Which snapshot this source supports |
| `clientContext` | object | ❌ | Optional context |

### Response

```json
{
  "sourceId": "oed_silly_1",
  "explanation": "The OED entry for 'silly' traces the word's etymology from Old English 'sælig' (blessed/happy) through its Middle English sense of 'innocent/pitiable' to the fully pejorated modern 'foolish'. It provides dated quotations spanning over a thousand years of written English, making it the primary authority on this dramatic reversal.",
  "supportingQuotes": [
    "c900 — sælig: blessed, happy, favoured by God.",
    "c1300 — 'a silly child': innocent, defenceless.",
    "1570 — 'a silly fellow, easily gulled': simple-minded."
  ],
  "confidenceNarrative": "High confidence (0.98) — the OED is the primary authority on historical English semantics and provides direct documentary evidence.",
  "generatedAt": "2024-01-01T00:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sourceId` | string | Echoes request |
| `explanation` | string | Prose explanation of source relevance |
| `supportingQuotes` | string[] | Additional quotations (may be empty) |
| `confidenceNarrative` | string | Human-readable gloss on the confidence score |
| `generatedAt` | string (ISO8601) | Timestamp |

---

## GET /health

Health check. No auth required.

### Response

```json
{ "status": "ok", "version": "mock-seed-v1", "seedCount": 6 }
```

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
