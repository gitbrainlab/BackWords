# BackWords Data Model

## Seed File Format

Each seed file lives in `data/seed/<word>.json` and represents a single lexeme entry.

### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `lexemeId` | string | Stable slug, e.g. `silly`. Can be multi-part for disambiguation: `villain_serf`. |
| `query` | string | Canonical display form of the word/phrase. |
| `normalizedQuery` | string | Lowercase, stripped for matching. |
| `supportedModes` | string[] | Which modes apply: `["word","phrase","paragraph"]` |
| `currentSnapshot` | SnapshotInterpretation | The contemporary meaning. |
| `historicalSnapshots` | SnapshotInterpretation[] | Ordered oldest→newest. |
| `keyDates` | KeyDate[] | Key publication/event dates that influenced meaning. |
| `sources` | SourceCitation[] | All supporting citations. |
| `summaryOfChange` | SummaryOfChange | Machine/human summary of the semantic shift. |
| `relatedWorks` | RelatedWork[] | Books, poems, plays that illuminate usage. |
| `relatedPages` | RelatedPage[] | In-app knowledge pages to cross-link. |
| `relatedConcepts` | RelatedConcept[] | Other words/concepts to explore. |
| `ambiguityNotes` | string[] | Notes about contested or multiple meanings. |
| `timelineEvents` | TimelineEvent[] | Historical events in timeline order. |

### SnapshotInterpretation

| Field | Type | Description |
|-------|------|-------------|
| `snapshotId` | string | Unique per seed, e.g. `silly_current` |
| `date` | string (ISO8601) | Representative date for this snapshot, e.g. `2024-01-01` |
| `eraLabel` | string | Human-readable period: "Contemporary", "Victorian Era" |
| `definition` | string | Primary definition in this era. |
| `usageNote` | string | How writers/speakers typically used it. |
| `exampleUsage` | string | Representative quotation or constructed example. |
| `register` | string | formal / informal / neutral / technical / vulgar |
| `sentiment` | string | positive / negative / neutral |
| `confidence` | number (0–1) | Editorial confidence in this snapshot. |
| `sourceIds` | string[] | References to SourceCitation.sourceId |

### How Timeline Selection Works

When a user scrubs to or taps a date (e.g. "1850"), the app calls `/interpret` with `selectedDate: "1850-01-01"`. The proxy's `DataLoader.get_closest_snapshot()` scans `historicalSnapshots` and returns the one whose `date` field is **closest** to `selectedDate` (absolute day distance). If `selectedDate` is after all historical snapshots, the `currentSnapshot` is returned.

**Algorithm:**
```python
def get_closest_snapshot(seed, selected_date_str):
    target = parse_date(selected_date_str)
    candidates = seed["historicalSnapshots"] + [seed["currentSnapshot"]]
    return min(candidates, key=lambda s: abs((parse_date(s["date"]) - target).days))
```

### Passage Highlights

Passage highlights represent character-offset spans within an `originalText` string where a historically interesting word or phrase appears.

| Field | Type | Description |
|-------|------|-------------|
| `highlightId` | string | Unique within the passage |
| `start` | integer | 0-based inclusive character offset |
| `end` | integer | 0-based exclusive character offset |
| `text` | string | The substring `originalText[start:end]` (for verification) |
| `conceptId` | string | Links to a lexeme or concept (can be used to trigger search) |
| `label` | string | Brief annotation shown in the UI tooltip |
| `confidence` | number (0–1) | How confident the annotation is |

**Validation:** `originalText[highlight.start:highlight.end] == highlight.text` must always be true.

### LexemeId Structure

`lexemeId` uses the format: `<surface_form>[_<sense_discriminator>]`

Examples:
- `silly` — unambiguous
- `nice_foolish` — disambiguates the "foolish" historical sense
- `nice_pleasant` — disambiguates the modern "pleasant" sense
- `pretty_cunning` — early 'clever' sense
- `villain_serf` — medieval farm-worker sense

The proxy matches queries case-insensitively against `normalizedQuery`. If multiple seeds match (homonyms), all are returned in `ambiguityNotes` and the best match is selected by confidence.

### SourceCitation

| Field | Type | Description |
|-------|------|-------------|
| `sourceId` | string | Unique, e.g. `oed_silly_1` |
| `title` | string | Document/work title |
| `author` | string? | Author name(s) |
| `publisher` | string? | Publisher name |
| `publishedDate` | string? | ISO8601 date or year string |
| `sourceType` | enum | `dictionary` \| `literary` \| `academic` \| `historical` \| `newspaper` \| `other` |
| `attribution` | string | Usage rights / public domain note |
| `excerpt` | string | The specific text being cited |
| `relevanceNote` | string | Why this source supports the interpretation |
| `confidence` | number (0–1) | Confidence this source is correctly applied |

### KeyDate

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | ISO8601 |
| `label` | string | Human-readable event name |
| `significance` | string | Why this date matters for the word's history |

---

## File Naming Conventions

- Seeds: `data/seed/<normalizedQuery>.json`
- Pages: `data/pages/<slug>.json`
- Passages: `data/passages/<name>.json`

---

## Adding New Seeds

1. Create `data/seed/<word>.json` following the schema in `packages/shared-schema/InterpretationResult.schema.json`
2. Validate with: `python -c "import json, jsonschema; ..."` (see proxy README)
3. Restart the proxy — DataLoader re-scans on startup
4. Test: `curl -X POST http://localhost:8000/interpret -H "Content-Type: application/json" -d '{"query":"<word>","mode":"word"}'`
