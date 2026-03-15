# BackWords – App Concept

## What Is BackWords?

BackWords is a linguistic time machine. You enter a word, phrase, or passage and the app shows you how its meaning has shifted across centuries—comparing how an author writing in 1850 would have understood "awful" versus how a reader encounters it today.

The app is designed for readers, writers, students, historians, and anyone who has ever paused while reading an old text and wondered: "Did this word mean something different then?"

---

## Core Terminology

| Term | Definition |
|------|-----------|
| **Snapshot** | A frozen record of a word's meaning, usage, and cultural weight at a particular point in time. Every word can have multiple snapshots (historical and current). |
| **Era Label** | A human-readable period name attached to a snapshot: "Early Modern English", "Victorian Era", "Mid-20th Century", etc. |
| **Source** | A citation that supports a particular meaning at a particular time—a dictionary entry, literary passage, historical document, or scholarly article. |
| **Interpretation** | The full response returned by the engine for a given query, including snapshots, sources, timeline events, related works, and ambiguity notes. |
| **Passage Highlight** | A span of text within an original passage where a word or phrase carries a historically significant meaning. Defined by character offsets (start, end). |
| **LexemeId** | A stable slug-like identifier for a word/concept pairing, e.g. `awful_awe-inspiring` or `nice_foolish`. Allows the same surface form to have multiple disambiguated entries. |
| **Timeline Event** | A historical event that influenced a word's meaning, e.g. a publication, a war, a social movement. |
| **Confidence** | A 0.0–1.0 score expressing how well-attested a particular interpretation is. Not a statistical model output—seeded manually by editors, with room for AI augmentation. |

---

## Product Philosophy

### 1. Meaning is not fixed.
Words are living things. BackWords treats every definition as a timestamped claim, not an eternal truth.

### 2. Show your work.
Every interpretation is backed by sources. The user can tap through to see exactly what text is being cited and why.

### 3. Historical empathy, not pedantry.
The goal is not to "correct" users or gatekeep language. It's to illuminate why a Victorian novelist would have chosen a word that reads oddly today—and vice versa.

### 4. Layered depth.
Casual users get a clean "Then vs Now" card. Researchers get access to sources, confidence scores, timeline events, and passage highlights.

### 5. Offline-first where possible.
The seed data is bundled. The proxy is optional. The app is useful without an internet connection for pre-seeded words.

---

## User Journeys

### The Reader
Reading *Sense and Sensibility* on their phone. Pauses on the word "nice". Switches to BackWords, types "nice", taps the 1811 snapshot, sees it meant "foolish/precise", returns to Jane Austen with a smile.

### The Writer
Writing historical fiction set in 1890s London. Wants to know if "artificial" would have sounded pejorative. Uses Passage mode to paste in a paragraph and see which words carry anachronistic connotations.

### The Linguist
Studying semantic drift. Uses Timeline view to trace how "charity" moved from *caritas* through Reformation-era almsgiving to modern nonprofit culture. Exports sources for bibliography.

### The Curious Mind
Just heard that "woke" used to be an African-American vernacular term for racial awareness. Opens BackWords to explore the full arc.

---

## What BackWords Is Not

- A spell checker
- A thesaurus
- An etymology dictionary (though it overlaps)
- A real-time translation service
- A political arbiter of contested usage

BackWords presents historical evidence and lets users draw their own conclusions.
