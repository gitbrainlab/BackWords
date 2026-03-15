# BackWords API Contract

Base URL: configurable in Settings (default `http://localhost:8000`)

All requests and responses use `Content-Type: application/json`.

---

## POST /interpret

Interpret a word, phrase, or passage in historical context.

### Request

```json
{
  "query": "awful",
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
  "lexemeId": "awful",
  "query": "awful",
  "normalizedQuery": "awful",
  "requestedDate": "1850-01-01",
  "resolvedEraLabel": "Victorian Era",
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
  "selectedSnapshot": {
    "snapshotId": "awful_1850",
    "date": "1850-01-01",
    "eraLabel": "Victorian Era",
    "definition": "Inspiring awe; solemnly impressive.",
    "usageNote": "Used reverently to describe the sublime—storms, cathedrals, divine power.",
    "exampleUsage": "The awful silence of the mountains.",
    "register": "formal",
    "sentiment": "neutral",
    "confidence": 0.95,
    "sourceIds": ["oed_awful_1", "johnson_dict"]
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
  "sourceId": "oed_awful_1",
  "query": "awful",
  "snapshotId": "awful_1850",
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
  "sourceId": "oed_awful_1",
  "explanation": "The OED entry for 'awful' traces the word's etymology from Old English 'egeful' (fear-inducing) through its 18th-century meaning of reverential awe to the colloquial weakening in the 19th century. This dictionary entry is the gold standard reference for this transition because it provides dated quotations spanning over a thousand years of written English.",
  "supportingQuotes": [
    "1697 DRYDEN: 'The awful father sits in regal state.'",
    "1830 TENNYSON: 'The awful shadow of some unseen Power.'"
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
