# BackWords

> *Words don't just change meaning — they carry the footprints of every era they've passed through.*

BackWords is an iPhone-first app that lets you look up a word, phrase, or short passage and see how its meaning has shifted across time. Every result surfaces a **Then vs Now** comparison, a navigable timeline of key moments, source citations, and links to related linguistic concepts.

---

## App Flow — Screen Previews

The following wireframe-style previews illustrate the core user journey. These are rendered representations of the SwiftUI scaffold; real screenshots will be available once the app is built in Xcode.

---

### Screen 1 · Home / Search

```
╔══════════════════════════════════════╗
║  BackWords                    ⚙️     ║
╠══════════════════════════════════════╣
║                                      ║
║   ┌────────────────────────────────┐ ║
║   │  🔍  Search a word or phrase   │ ║
║   └────────────────────────────────┘ ║
║                                      ║
║   Mode:  [Word]  [Phrase]  [Passage] ║
║                                      ║
║   Time lens:  ┌──────────────────┐   ║
║               │ Mid-19th century ▾│  ║
║               └──────────────────┘   ║
║                                      ║
║   ── Curated examples ─────────────  ║
║                                      ║
║   ┌──────────┐  ┌──────────┐        ║
║   │  silly   │  │ villain  │        ║
║   │ blessed→ │  │ serf →   │        ║
║   │ foolish  │  │ evil     │        ║
║   └──────────┘  └──────────┘        ║
║   ┌──────────┐  ┌──────────┐        ║
║   │  pretty  │  │companion │        ║
║   │cunning→  │  │bread →   │        ║
║   │attractive│  │friend    │        ║
║   └──────────┘  └──────────┘        ║
║   ┌──────────┐  ┌──────────┐        ║
║   │ disaster │  │ salary   │        ║
║   │bad star→ │  │ salt →   │        ║
║   │catastroph│  │ pay      │        ║
║   └──────────┘  └──────────┘        ║
║                                      ║
║   ── Recent searches ──────────────  ║
║   ↩ silly          Mid-18th c.      ║
║   ↩ companion      Medieval          ║
╚══════════════════════════════════════╝
```

**Key interactions:**
- Tap a curated example card to immediately load a result
- Mode picker switches between word, phrase, and passage analysis
- Time lens lets you pick a preset era or enter a specific year
- Recent searches persist across sessions via SwiftData

---

### Screen 2 · Result Compare — Then vs Now

```
╔══════════════════════════════════════╗
║  ← Back   silly         Share  ···  ║
╠══════════════════════════════════════╣
║                                      ║
║  ╔════════════════════════════════╗  ║
║  ║  THEN · Old English (c. 900)  ║  ║
║  ╠════════════════════════════════╣  ║
║  ║  Blessed; happy; fortunate;   ║  ║
║  ║  spiritually worthy.          ║  ║
║  ║                               ║  ║
║  ║  Register: formal             ║  ║
║  ║  Tone: reverential/positive   ║  ║
║  ║                               ║  ║
║  ║  "Sælig mann — blessed man."  ║  ║
║  ╚════════════════════════════════╝  ║
║                                      ║
║  ╔════════════════════════════════╗  ║
║  ║  NOW · Contemporary           ║  ║
║  ╠════════════════════════════════╣  ║
║  ║  Lacking sense or judgement;  ║  ║
║  ║  absurd; trivially foolish.   ║  ║
║  ║                               ║  ║
║  ║  Register: informal           ║  ║
║  ║  Tone: dismissive             ║  ║
║  ║                               ║  ║
║  ║  "Don't be silly."            ║  ║
║  ╚════════════════════════════════╝  ║
║                                      ║
║  ── Context shift ─────────────────  ║
║  From 'blessed by God' to 'foolishly ║
║  trivial' — one of English's most    ║
║  dramatic reversals. German 'selig'  ║
║  still means 'blessed' today.        ║
║                                      ║
║  Drift type: Pejoration ●●●●●◌       ║
║                                      ║
║  ── Key dates ─────────────────────  ║
║  900   Old English sælig (blessed)  ║
║  1300  Middle English: innocent →   ║
║  1570  Shakespeare: simple-minded   ║
║  1750  Pejoration complete          ║
║                                      ║
║  ── Sources ───────────────────────  ║
║  📖 OED — silly, adj.     ▶          ║
║  📖 Anglo-Saxon Dict.     ▶          ║
║  📖 Middle English Dict.  ▶          ║
║                                      ║
║  ── Related concepts ──────────────  ║
║  [Pejoration] [Semantic drift]       ║
║  [pejoration] [semantic-drift]       ║
╚══════════════════════════════════════╝
```

**Key interactions:**
- Tap any key date to jump to that point on the Timeline
- Tap a source card to open Source Detail
- Tap a concept chip to navigate to its Result Compare
- Share button copies the interpretation card as an image

---

### Screen 3 · Timeline

```
╔══════════════════════════════════════╗
║  ← Back   silly — Timeline           ║
╠══════════════════════════════════════╣
║                                      ║
║  Scrub:  900──1300──1570──1750──Now  ║
║           ●────────────────────○     ║
║                                      ║
║  ─────────────────────────────────── ║
║                                      ║
║  ● Old English  ·  c. 900            ║
║  │  Sælig: blessed by God            ║
║  │  "The highest spiritual praise    ║
║  │   in the language."               ║
║  │  📖 Bosworth-Toller               ║
║  │                                   ║
║  ● Middle English  ·  c. 1300        ║
║  │  Innocent and pitiable            ║
║  │  "Silly sheep" meant vulnerable,  ║
║  │   not foolish.                    ║
║  │  📖 Middle English Dictionary     ║
║  │                                   ║
║  ● Elizabethan  ·  c. 1600           ║
║  │  Shakespeare bridges the gap      ║
║  │  "Caught mid-drift: 'simple'      ║
║  │   shifting toward 'foolish'."     ║
║  │  📖 OED — silly, adj.             ║
║  │                                   ║
║  ● 18th Century  ·  c. 1750          ║
║     Pejoration complete              ║
║     "The blessed origin entirely     ║
║      forgotten in common use."       ║
║     📖 OED — silly, adj.             ║
╚══════════════════════════════════════╝
```

**Key interactions:**
- Drag the scrubber to jump between eras
- Tapping an event snaps the scrubber and updates the Result Compare "Then" pane
- Source pill opens Source Detail inline

---

### Screen 4 · Source Detail

```
╔══════════════════════════════════════╗
║  ← Sources                           ║
╠══════════════════════════════════════╣
║                                      ║
║  📖 Oxford English Dictionary        ║
║     silly, adj.                      ║
║                                      ║
║  Oxford University Press             ║
║  Updated 2023                        ║
║  Type: Dictionary                    ║
║                                      ║
║  ── Excerpt ───────────────────────  ║
║  "Originally: blessed, happy,        ║
║  fortunate. Later: innocent,         ║
║  harmless; simple, unsophisticated.  ║
║  Now chiefly: foolish, showing a     ║
║  lack of sense or judgement."        ║
║                                      ║
║  Attribution:                        ║
║  Paraphrase and excerpt.             ║
║  OED content © Oxford University    ║
║  Press. Used for educational         ║
║  commentary.                         ║
║                                      ║
║  ── Why this supports the reading ── ║
║  ┌────────────────────────────────┐  ║
║  │ The OED's historical quotations│  ║
║  │ trace the full arc from        │  ║
║  │ 'blessed' to 'foolish' across  │  ║
║  │ twelve centuries of English,  │  ║
║  │ making it the primary authority│  ║
║  │ on this transition.            │  ║
║  └────────────────────────────────┘  ║
║                                      ║
║  Confidence: ████████░░  0.98        ║
╚══════════════════════════════════════╝
```

---

### Screen 5 · Passage Mode

```
╔══════════════════════════════════════╗
║  ← Back   Passage analysis           ║
╠══════════════════════════════════════╣
║                                      ║
║  Concepts detected:                  ║
║  [companion] [salary] [disaster]     ║
║                                      ║
║  ── Original passage ──────────────  ║
║  "The king rewarded his most         ║
║   trusted ░companion░ with a         ║
║   handsome ░salary░, for in times    ║
║   of ░disaster░ it is the bread-     ║
║   sharers who hold the realm         ║
║   together."                         ║
║                                      ║
║  (highlighted spans are tappable)   ║
║                                      ║
║  ── Modern paraphrase ─────────────  ║
║  "The leader rewarded their most     ║
║   trusted associate with generous    ║
║   pay, because in times of crisis    ║
║   it is loyal allies who keep        ║
║   things from falling apart."        ║
║                                      ║
║  Tap a highlight to explore          ║
║  its full Then/Now history →         ║
╚══════════════════════════════════════╝
```

---

### Screen 6 · Settings

```
╔══════════════════════════════════════╗
║  Settings                            ║
╠══════════════════════════════════════╣
║                                      ║
║  ── Provider ──────────────────────  ║
║  Proxy URL                           ║
║  http://127.0.0.1:8000               ║
║                                      ║
║  Mock mode             ● ON          ║
║  (reads seed data; no network calls) ║
║                                      ║
║  ── Appearance ────────────────────  ║
║  Theme     ◉ System  ○ Light  ○ Dark ║
║                                      ║
║  Palette                             ║
║  [Scholarly]  [Modern]  [Navy]       ║
║                                      ║
║  ── Content ───────────────────────  ║
║  Max sources   ────────●──  4        ║
║                                      ║
║  ── Cache ─────────────────────────  ║
║  [Clear search history]              ║
║  [Clear cached results]              ║
║                                      ║
║  ── Privacy ───────────────────────  ║
║  No account required.                ║
║  Search history stays on device.     ║
║  No analytics or tracking.           ║
╚══════════════════════════════════════╝
```

---

## Repository Structure

```
BackWords/
├── README.md
├── ios/
│   └── BackWords/
│       ├── App/            # @main entry, AppContainer, PreviewData
│       ├── Design/         # Palette, Typography, Spacing, Theme, Components
│       ├── Models/         # Codable structs matching JSON schemas
│       ├── Networking/     # APIClient (Live + Mock), Endpoints
│       ├── Storage/        # SwiftData models, LocalStore
│       ├── ViewModels/     # MVVM: Home, Result, Timeline, Settings
│       └── Views/          # 6 SwiftUI screens + #Preview macros
├── proxy/
│   ├── app/
│   │   ├── main.py         # FastAPI app, CORS, lifespan
│   │   ├── models.py       # Pydantic request/response models
│   │   ├── data_loader.py  # Seed/page loader with date-based snapshot selection
│   │   ├── mock_engine.py  # Builds InterpretationResult from seed data
│   │   └── settings.py     # Pydantic settings (DATA_DIR, PORT, …)
│   ├── pyproject.toml
│   └── README.md
├── data/
│   ├── seed/               # 6 word histories (silly, villain, pretty, …)
│   ├── pages/              # 5 knowledge pages (pejoration, semantic-drift, …)
│   └── passages/           # Sample passage for paragraph-mode demo
├── packages/
│   └── shared-schema/      # 7 JSON Schema Draft 2020-12 files
└── docs/
    ├── mvp.md
    ├── app-concept.md
    ├── data-model.md
    ├── api-contract.md
    ├── design-system.md
    └── icon-notes.md
```

---

## Local Development

### 1 — Run the proxy

```bash
cd proxy

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Start the server
uvicorn app.main:app --reload --port 8000
```

The proxy will log: `Startup complete: 6 seeds loaded`.

**Verify with curl:**

```bash
# Interpret a word
curl -s -X POST http://127.0.0.1:8000/interpret \
  -H "Content-Type: application/json" \
  -d '{"query":"silly","mode":"word","selectedDate":"0900-01-01"}' | python3 -m json.tool

# Explain a source
curl -s -X POST http://127.0.0.1:8000/explain-source \
  -H "Content-Type: application/json" \
  -d '{"sourceId":"oed_silly_1","query":"silly","snapshotId":"silly_old_english"}' | python3 -m json.tool

# Health check
curl http://127.0.0.1:8000/health
```

---

### 2 — Build the iOS app in Xcode

> **Note:** The repository contains Swift source files only — no `.xcodeproj` is generated. Create the Xcode project manually and drop in the sources.

**Step-by-step:**

1. Open Xcode → **File → New → Project → iOS → App**
2. Product Name: `BackWords`
3. Interface: **SwiftUI**, Language: **Swift**, Storage: **SwiftData**
4. Uncheck "Include Tests" for the initial scaffold run
5. Save the project **next to** the `ios/` folder (or inside it)
6. In the Xcode project navigator, right-click the `BackWords` group → **Add Files to "BackWords"…**
7. Navigate to `ios/BackWords/` and select all subdirectories (**App, Design, Models, Networking, Storage, ViewModels, Views**)
8. Ensure **"Copy items if needed"** is unchecked if sources are already in the project folder; check it if you need to copy them in
9. Delete the auto-generated `ContentView.swift` — `BackWordsApp.swift` is the entry point

**Set the proxy base URL:**

In `AppContainer.swift`, set `baseURL` to `http://127.0.0.1:8000` for local development.

**Allow local HTTP (development only):**

To allow HTTP (not HTTPS) connections to your local proxy during development, add a temporary ATS exception to the Xcode project's `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>127.0.0.1</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSIncludesSubdomains</key>
            <false/>
        </dict>
    </dict>
</dict>
```

> ⚠️ **Do not ship this ATS exception.** Remove it before building for TestFlight or App Store. Your production proxy must use HTTPS.

**Verify the flow:**

1. Run the proxy (`uvicorn app.main:app --reload --port 8000`)
2. Build and run the iOS app in the simulator (iPhone 15 Pro recommended)
3. Tap **"silly"** on the Home screen
4. Confirm the Result Compare screen shows Old English "blessed" vs contemporary "foolish"
5. Tap a key date → Timeline screen
6. Tap a source → Source Detail screen
7. Tap the gear icon → Settings screen

---

## Data Seeds

Six words have been seeded with rich historical profiles. Each demonstrates a distinct type of semantic change:

| Word | Then | Now | Change type |
|------|------|-----|-------------|
| **silly** | Blessed by God (OE *sælig*) | Foolishly trivial | Pejoration |
| **villain** | Feudal serf / farm worker | Epitome of moral evil | Pejoration |
| **pretty** | Cunning; cleverly crafted | Delicately attractive | Semantic shift |
| **companion** | Bread-sharer at table | Friend / associate | Broadening |
| **disaster** | Malign star alignment | Catastrophe | Semantic shift |
| **salary** | Salt allowance (Roman) | Regular professional pay | Semantic shift |

Knowledge pages: `semantic-drift`, `pejoration`, `amelioration`, `register-and-slang`, `dictionaries-vs-usage`.

---

## Design System

Three dark-mode-friendly palettes are defined in `ios/BackWords/Design/Palette.swift`:

- **Scholarly** — ink + parchment (warm brass accent `#C8A96A`)
- **Modern Premium** — graphite + electric (violet accent `#7C5CFF`)
- **Consumer-Friendly** — navy + teal (teal accent `#2FD3C6`)

Typography uses iOS Dynamic Type with `.design(.serif)` for headings. Full details in `docs/design-system.md`.

---

## App Store Deployment

See [App Store Deployment Guide](#-app-store-deployment-guide) below for the full checklist.

---

---

# 📦 App Store Deployment Guide

This section describes the complete process for submitting BackWords to the Apple App Store, from first-time setup through post-launch monitoring. It assumes the Swift sources in `/ios/BackWords` have been integrated into an Xcode project.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Apple Developer Program membership | USD 99/year at [developer.apple.com](https://developer.apple.com/programs/) |
| Xcode 15+ | Available free on the Mac App Store |
| macOS Ventura 13.5+ | Required for Xcode 15 |
| App Store Connect access | Granted through the developer account |
| Production proxy | Must be HTTPS; no local loopback URLs |

---

## Phase 1 — Certificates and Identifiers

### 1.1 Register an App ID

1. Log in to [developer.apple.com → Certificates, IDs & Profiles](https://developer.apple.com/account/resources/identifiers/list)
2. Click **+** → **App IDs** → **App**
3. Set a descriptive name: `BackWords`
4. Bundle ID: use **Explicit** format, e.g. `com.yourteam.backwords`
5. Enable capabilities you need: none required for MVP (no push notifications, no iCloud sync)
6. Click **Register**

### 1.2 Create a Distribution Certificate

1. In Certificates → click **+** → **Apple Distribution**
2. Follow the Certificate Signing Request (CSR) instructions (Keychain Access → Certificate Assistant on Mac)
3. Download and double-click the `.cer` to install in Keychain
4. Xcode can manage this automatically: **Xcode → Settings → Accounts → Manage Certificates → + → Apple Distribution**

### 1.3 Create a Provisioning Profile

1. In Profiles → click **+** → **App Store Connect**
2. Select the App ID created above
3. Select the Distribution Certificate
4. Name it `BackWords App Store` and download
5. Double-click to install, or let Xcode manage it automatically

---

## Phase 2 — App Store Connect Setup

### 2.1 Create the App Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. My Apps → **+** → **New App**
3. Platform: **iOS**
4. Name: `BackWords`
5. Primary Language: `English (U.S.)`
6. Bundle ID: select the one registered above
7. SKU: any internal identifier, e.g. `backwords-001`
8. User Access: **Full Access** for the initial submission

### 2.2 App Information

Fill in under **App Information:**

- **Category:** Education (primary); Reference (secondary)
- **Age Rating:** complete the questionnaire (BackWords has no mature content — expect 4+)
- **Privacy Policy URL:** required for App Store submission. Host a simple policy page explaining no data is collected. See Privacy section below.

### 2.3 Pricing and Availability

- Set price tier (Free for MVP is recommended)
- Select availability territories

---

## Phase 3 — App Metadata

### 3.1 App Store Listing Copy

**App Name** (30 chars max):
```
BackWords
```

**Subtitle** (30 chars max):
```
Words across time
```

**Description** (4,000 chars max — example):
```
BackWords shows you how the meaning of words has changed over centuries.

Type a word like "silly" — once it meant "blessed by God" in Old English.
Or "villain" — once it meant a humble farm worker, not a murderer.

BackWords gives you:
• A Then vs Now comparison for any word or phrase
• A timeline of key moments in the word's history
• Source citations from dictionaries, literary works, and historical records
• Related concepts, related works, and adjacent topics to explore

No account required. History stays on your device.
```

**Keywords** (100 chars max, comma-separated):
```
etymology,word history,linguistics,dictionary,language,semantic change,vocabulary
```

**Promotional Text** (170 chars max — can be updated without a new build):
```
Discover the hidden histories of everyday words. "Disaster" once meant a bad star alignment. "Salary" started as a salt ration.
```

**Support URL:** Link to your GitHub repository or a support page.

**Marketing URL:** Optional landing page.

### 3.2 Screenshots

Screenshots are required for:

| Device | Dimensions |
|--------|------------|
| iPhone 6.9" (iPhone 16 Plus / Pro Max) | 1320 × 2868 px |
| iPhone 6.7" (iPhone 14 Plus / 15 Plus) | 1290 × 2796 px |
| iPad Pro 13" (if supporting iPad) | 2048 × 2732 px |

**How to capture:**

1. Run the app in the iPhone 16 Pro Max simulator (or 15 Plus)
2. Navigate to each key screen
3. Use **Product → Screenshot** (⌘S) in Xcode, or press the side button + volume up in the simulator
4. Export from `~/Desktop` or the simulator's photo album
5. Upload in App Store Connect under **App Screenshots**

**Recommended screenshot sequence (6 images):**
1. Home / Search — showing curated word examples
2. Result Compare — "silly": Then (blessed) vs Now (foolish)
3. Timeline — vertical list with scrubber
4. Source Detail — OED citation with explanation
5. Passage Mode — highlighted text with concept chips
6. Dark mode Result Compare — showing design quality

### 3.3 App Preview Video (optional but recommended)

A 15–30 second screen recording demonstrating the core search → compare → timeline flow significantly improves conversion. Record with QuickTime Player connected to an iPhone or using the simulator.

---

## Phase 4 — Xcode Build Configuration

### 4.1 Version and Build Number

In Xcode, select the `BackWords` target → **General:**

- **Version:** `1.0.0` (user-visible, follows semantic versioning)
- **Build:** `1` (auto-incremented for each submission to App Store Connect)

For CI/CD, increment the build number automatically:

```bash
xcrun agvtool new-version -all 1.0.0
xcrun agvtool new-marketing-version 1.0.0
```

### 4.2 Signing

1. Select target → **Signing & Capabilities**
2. Team: select your developer team
3. Check **Automatically manage signing**
4. Provisioning Profile: Xcode should select `BackWords App Store` automatically

### 4.3 Remove Development ATS Exception

Before building for submission, ensure `Info.plist` does **not** contain `NSAllowsArbitraryLoads` or local HTTP exceptions. The production proxy must use HTTPS with a valid TLS certificate.

### 4.4 Production Proxy URL

Update `AppContainer.swift` to use the production HTTPS base URL:

```swift
// Production
let baseURL = URL(string: "https://api.yourbackwords.app")!

// Development (remove before submission)
// let baseURL = URL(string: "http://127.0.0.1:8000")!
```

Use an environment flag or a build configuration to avoid shipping the wrong URL.

---

## Phase 5 — Archive and Upload

### 5.1 Archive

1. In Xcode, set the scheme destination to **Any iOS Device (arm64)** (not a simulator)
2. **Product → Archive**
3. Wait for the archive to complete — Xcode Organizer opens automatically

### 5.2 Upload to App Store Connect

1. In Xcode Organizer, select the archive → **Distribute App**
2. Choose **App Store Connect**
3. Choose **Upload** (not Export)
4. Ensure **Strip Swift symbols** and **Upload symbols** are checked
5. Click **Upload**

The build will appear in App Store Connect under **TestFlight** within a few minutes (processing may take up to 30 minutes).

### 5.3 Alternative: `xcodebuild` + `altool` (CI/CD)

```bash
# Archive
xcodebuild -scheme BackWords \
  -configuration Release \
  -archivePath ./build/BackWords.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath ./build/BackWords.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath ./build/ipa

# Upload (requires API key or app-specific password)
xcrun altool --upload-app \
  -f ./build/ipa/BackWords.ipa \
  -t ios \
  --apiKey YOUR_API_KEY \
  --apiIssuer YOUR_ISSUER_ID
```

---

## Phase 6 — TestFlight

### 6.1 Internal Testing

1. In App Store Connect → TestFlight → select the uploaded build
2. Add internal testers (up to 100; must be members of your team in App Store Connect)
3. Submit for internal review — typically approved within minutes
4. Testers install via the TestFlight app

### 6.2 External Testing

1. Create an external testing group
2. Add up to 10,000 external testers by email or a public link
3. Submit for Beta App Review — typically 1–3 business days
4. Beta review checks for crashes, metadata accuracy, and policy violations

---

## Phase 7 — App Review Submission

### 7.1 Review Information

In App Store Connect → App Review Information:

- **Demo account:** BackWords requires no account — note this in the review notes: *"No login required. The app is fully functional without credentials."*
- **Contact information:** your name, email, phone
- **Notes for reviewer:** explain the mock mode and how to verify the core flow

### 7.2 Export Compliance

- BackWords uses standard HTTPS (TLS) — answer **Yes** to the encryption question
- Select **Uses encryption: Exempt** if using only standard HTTPS APIs (no custom crypto)
- If unsure, consult [Apple's encryption export guidance](https://developer.apple.com/documentation/security/complying_with_encryption_export_regulations)

### 7.3 Submit for Review

1. Select the build in the App Store Connect version record
2. Confirm screenshots, metadata, pricing are complete
3. Click **Submit for Review**
4. Review typically takes **24–48 hours** for a new app

### 7.4 Common Rejection Reasons (and how to avoid them)

| Reason | Prevention |
|--------|------------|
| Guideline 2.1 — App Completeness | Ensure all placeholder text is removed; all screens are functional |
| Guideline 4.0 — Design (crashes) | Test on a physical device before submission; run with thread sanitiser |
| Guideline 5.1.1 — Privacy policy | Host and link a valid privacy policy URL |
| ATS violations | Ensure HTTPS for all network requests in production |
| Metadata mismatch | Screenshots must reflect actual app functionality |

---

## Phase 8 — Post-Launch

### 8.1 Monitoring

- **Xcode Organizer → Crashes:** view symbolicated crash reports
- **App Store Connect → Analytics:** downloads, sessions, retention
- **App Store Connect → Ratings & Reviews:** respond to user reviews

### 8.2 Updates

For every update:
1. Increment the **Build number** (required for every submission)
2. Increment the **Version number** for user-visible changes
3. Update **What's New in This Version** in App Store Connect
4. Archive, upload, and submit as above

### 8.3 Privacy

BackWords MVP collects no user data:
- Search history is stored **on device only** (SwiftData, no sync)
- No analytics SDK
- No user accounts
- Telemetry is disabled by default (`telemetryEnabled: false` in AppSettings)

Privacy policy minimum content:
- What data is collected: none
- What data is stored: search history, locally on device only
- Contact email for privacy requests

---

## Design Tokens Quick Reference

| Token | Scholarly (dark) | Modern (dark) | Navy (dark) |
|-------|-----------------|---------------|-------------|
| Background | `#0B0F14` | `#0A0A0B` | `#07121E` |
| Card | `#111823` | `#141416` | `#0D1C2F` |
| Accent | `#C8A96A` | `#7C5CFF` | `#2FD3C6` |
| Text Primary | `#E9EEF5` | `#F5F5F7` | `#EAF2FF` |

Full token list and light-mode variants: `docs/design-system.md`

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the existing MVVM structure in `ios/BackWords/`
4. Keep the proxy dependency-free: no auth, no real provider calls
5. Open a pull request with a description of the change

---

## License

See [LICENSE](LICENSE).
