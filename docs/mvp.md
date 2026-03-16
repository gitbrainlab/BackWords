# BackWords MVP Scope

## Release Target
MVP: Internal TestFlight build, single device family (iPhone), no user accounts.

---

## What's In MVP

### Screens

| Screen | Description |
|--------|-------------|
| **Home / Search** | Text field, mode picker (Word / Phrase / Paragraph), optional date picker, recent searches, curated examples |
| **Result Compare** | Now vs Then cards, summary of change, key dates, source list, ambiguity notes, related concepts |
| **Timeline** | Vertical event list + horizontal scrubber; tap event to reload Result Compare for that era |
| **Source Detail** | Full citation card, excerpt, attribution, confidence bar, "Why this source?" explanation via /explain-source |
| **Settings** | Proxy base URL, mock mode toggle, appearance picker, max sources stepper, cache controls |

### Modes

| Mode | Description |
|------|-------------|
| **Word** | Single lexeme lookup. Primary mode. |
| **Phrase** | Short phrase (2–5 words) interpretation. |
| **Paragraph** | Paste passage → highlight historically significant spans. |

### Data
- 6 seed words bundled in app (silly, villain, pretty, companion, disaster, salary)
- 5 knowledge pages (semantic-drift, pejoration, amelioration, register-and-slang, dictionaries-vs-usage)
- 1 sample passage with highlights

### Proxy
- FastAPI proxy running locally (localhost:8000)
- Seeded mock responses (no real AI provider calls)
- /interpret and /explain-source endpoints
- /health endpoint

---

## Non-Goals for MVP

- User accounts or cloud sync
- Real AI provider integration (OpenAI, Anthropic, etc.)
- Push notifications
- iPad or macOS support
- Localization / internationalization
- Offline passage analysis (requires on-device model)
- Social features (sharing, bookmarking to cloud)
- Monetization / IAP
- Admin CMS for seed data
- Search suggestions / autocomplete from network

---

## Acceptance Criteria

### Home / Search
- [ ] Search field accepts text input and submits on Return
- [ ] Mode picker switches between Word, Phrase, Paragraph
- [ ] Date picker appears when user taps "Pick an era" and allows year selection 1400–present
- [ ] Recent searches appear below field, tap to re-run
- [ ] Curated examples (min 6) are displayed in a grid; tap runs search
- [ ] Loading state shown while awaiting proxy response
- [ ] Error state shown with retry if proxy unreachable

### Result Compare
- [ ] Current snapshot card visible with definition, usage note, era label
- [ ] Historical snapshot card visible with definition, usage note, era label
- [ ] Summary of change section with sentiment shift indicator
- [ ] At least one key date shown; tapping key date navigates to Timeline anchored to that event
- [ ] Source list shows min 1 source card; tapping navigates to Source Detail
- [ ] Related concepts chips displayed; tapping chips re-runs search
- [ ] Ambiguity notes shown when present
- [ ] Related works shown when present
- [ ] Related pages shown when present; tapping shows inline knowledge page

### Timeline
- [ ] All timeline events from result displayed as vertical list
- [ ] Horizontal scrubber shows relative position of events in time
- [ ] Tapping event reloads result for that era (calls /interpret with selectedDate)
- [ ] Selected event highlighted

### Source Detail
- [ ] Source title, author, publisher, date shown
- [ ] Excerpt displayed in styled quote block
- [ ] Confidence score shown as visual indicator (bar or dots)
- [ ] Attribution / usage rights shown
- [ ] "Why this source?" button calls /explain-source and shows response inline
- [ ] Loading state for explain-source call

### Settings
- [ ] Proxy base URL field editable; default is http://localhost:8000
- [ ] Mock mode toggle bypasses network and uses bundled PreviewData
- [ ] Appearance picker (System / Light / Dark)
- [ ] Max sources stepper (1–10, default 3)
- [ ] Clear History button deletes all SwiftData history entries
- [ ] Clear Cache button evicts in-memory cache
- [ ] Privacy note displayed

### Passage Mode
- [ ] User can paste text into large text field
- [ ] Submission returns passage with highlight spans
- [ ] Highlighted spans visually distinct in rendered text
- [ ] Tapping a highlight chip or span navigates to Result Compare for that concept
- [ ] Confidence shown per highlight

---

## Definition of Done
- All acceptance criteria above passing on device or simulator
- No crashes on the verify flow: search "silly" → Result Compare → Timeline → Source Detail → Settings
- Proxy starts with `uvicorn app.main:app --reload --port 8000` and returns valid JSON for silly seed
- Code review passed
- No secrets committed
