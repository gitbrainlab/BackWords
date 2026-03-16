import Foundation

/// Static mock data for SwiftUI previews, matching the silly.json seed.
enum PreviewData {
    static let interpretationResult = InterpretationResult(
        lexemeId: "silly",
        query: "silly",
        normalizedQuery: "silly",
        requestedDate: nil,
        resolvedEraLabel: nil,
        currentSnapshot: currentSnapshot,
        selectedSnapshot: nil,
        historicalSnapshots: [oldEnglishSnapshot, middleEnglishSnapshot],
        summaryOfChange: summaryOfChange,
        keyDates: keyDates,
        sources: [source1, source2],
        relatedWorks: [relatedWork1],
        relatedPages: [relatedPage1],
        relatedConcepts: [relatedConcept1],
        ambiguityNotes: ["In cricket, 'silly mid-on' uses 'silly' to mean 'dangerously close'."],
        passage: nil,
        timelineEvents: timelineEvents,
        generatedAt: "2024-01-01T00:00:00Z",
        modelVersion: "mock-seed-v1"
    )

    static let currentSnapshot = SnapshotInterpretation(
        snapshotId: "silly_current",
        date: "2024-01-01",
        eraLabel: "Contemporary",
        definition: "Showing a lack of common sense or judgement; absurd and foolish.",
        usageNote: "Applied affectionately or dismissively depending on context.",
        exampleUsage: "Don't be silly — you can't carry all those bags at once.",
        register: "informal",
        sentiment: "negative",
        confidence: 0.97,
        sourceIds: ["oed_silly_modern"]
    )

    static let oldEnglishSnapshot = SnapshotInterpretation(
        snapshotId: "silly_old_english",
        date: "0900-01-01",
        eraLabel: "Old English",
        definition: "Blessed; happy; fortunate; spiritually worthy.",
        usageNote: "From Old English 'sælig', meaning 'blessed by God'. Carrying the highest positive valence.",
        exampleUsage: "Sælig mann — blessed man.",
        register: "formal",
        sentiment: "positive",
        confidence: 0.92,
        sourceIds: ["bosworth_toller_silly"]
    )

    static let middleEnglishSnapshot = SnapshotInterpretation(
        snapshotId: "silly_middle_english",
        date: "1300-01-01",
        eraLabel: "Middle English",
        definition: "Innocent; harmless; pitiable; simple (without negative connotation).",
        usageNote: "'A silly child' meant a pitiable or defenceless child, not a foolish one.",
        exampleUsage: "The silly sheep wandered from the flock.",
        register: "neutral",
        sentiment: "neutral",
        confidence: 0.87,
        sourceIds: ["middle_english_dict_silly"]
    )

    static let summaryOfChange = SummaryOfChange(
        shortSummary: "From 'blessed by God' to 'foolishly trivial' — one of the most dramatic reversals in English.",
        longSummary: "In Old English 'sælig' was a term of the highest spiritual praise. Through Middle English the sense widened to 'innocent and helpless', then darkened into 'simple-minded'. By Early Modern English the word had fully pejorated into 'foolish'.",
        sentimentShift: "positive-to-negative",
        driftType: "pejoration",
        driftMagnitude: 0.95
    )

    static let keyDates = [
        KeyDate(date: "0900-01-01", label: "Old English sælig (blessed)", significance: "The root 'sælig' meant divinely blessed — cognate with German 'selig'."),
        KeyDate(date: "1300-01-01", label: "Shift to 'innocent/pitiable'", significance: "Middle English broadened the sense from 'blessed' to 'innocent and helpless'."),
        KeyDate(date: "1570-01-01", label: "Shakespeare's usage", significance: "By Shakespeare's era 'silly' could mean 'simple-minded' or 'easily deceived'."),
        KeyDate(date: "1750-01-01", label: "Pejoration complete", significance: "By the mid-18th century dictionaries recorded 'silly' exclusively as 'foolish'.")
    ]

    static let source1 = SourceCitation(
        sourceId: "oed_silly_1",
        title: "Oxford English Dictionary — silly, adj.",
        author: nil,
        publisher: "Oxford University Press",
        publishedDate: "2023-09-01",
        sourceType: "dictionary",
        attribution: "Paraphrase and excerpt. OED content © Oxford University Press. Used for educational commentary.",
        excerpt: "Originally: blessed, happy, fortunate. Later: innocent, harmless; simple, unsophisticated. Now chiefly: foolish, showing a lack of sense or judgement.",
        relevanceNote: "The OED traces the full arc from 'blessed' to 'foolish' across twelve centuries.",
        confidence: 0.98
    )

    static let source2 = SourceCitation(
        sourceId: "bosworth_toller_silly",
        title: "An Anglo-Saxon Dictionary",
        author: "Joseph Bosworth, T. Northcote Toller",
        publisher: "Oxford University Press",
        publishedDate: "1898-01-01",
        sourceType: "dictionary",
        attribution: "Public domain.",
        excerpt: "sælig: happy, fortunate, blessed; spiritually prosperous.",
        relevanceNote: "Documents the original Old English 'blessed' meaning, cognate with German 'selig'.",
        confidence: 0.93
    )

    static let relatedWork1 = RelatedWork(
        workId: "rw_shakespeare_midsummer",
        title: "A Midsummer Night's Dream",
        creator: "William Shakespeare",
        year: 1600,
        workType: "play",
        whyRelevant: "Contains uses of 'silly' in its transitional phase — illustrating the word mid-drift.",
        publicDomainHint: true,
        links: []
    )

    static let relatedPage1 = RelatedPage(
        pageId: "pg_pejoration",
        title: "Pejoration",
        slug: "pejoration",
        summary: "How and why word meanings become more negative over time.",
        route: "/pages/pejoration",
        tags: ["linguistics", "semantics"]
    )

    static let relatedConcept1 = RelatedConcept(
        conceptId: "saelig",
        label: "sælig (Old English)",
        relationship: "etymology",
        note: "The Old English root, still preserved in German 'selig' (blessed)."
    )

    static let timelineEvents = [
        TimelineEvent(
            eventId: "te_silly_oe",
            date: "0900-01-01",
            eraLabel: "Old English",
            title: "Sælig: blessed by God",
            summary: "Old English 'sælig' meant divinely blessed and fortunate — one of the highest compliments in the language.",
            relatedSnapshotId: "silly_old_english",
            sourceIds: ["bosworth_toller_silly"]
        ),
        TimelineEvent(
            eventId: "te_silly_me",
            date: "1300-01-01",
            eraLabel: "Middle English",
            title: "Innocent and pitiable",
            summary: "The sense of 'blessed' drifted toward 'innocent and helpless' — 'silly sheep' meant vulnerable, not foolish.",
            relatedSnapshotId: "silly_middle_english",
            sourceIds: ["middle_english_dict_silly"]
        ),
        TimelineEvent(
            eventId: "te_silly_shakespeare",
            date: "1600-01-01",
            eraLabel: "Elizabethan",
            title: "Shakespeare bridges the gap",
            summary: "In Shakespeare's plays, 'silly' wavers between 'simple/harmless' and 'foolish' — a word caught mid-drift.",
            relatedSnapshotId: "silly_old_english",
            sourceIds: ["oed_silly_1"]
        ),
        TimelineEvent(
            eventId: "te_silly_18c",
            date: "1750-01-01",
            eraLabel: "18th Century",
            title: "Pejoration complete",
            summary: "By the mid-18th century, 'silly' had stabilised as a mild term of intellectual dismissal. The blessed origin was forgotten.",
            relatedSnapshotId: "silly_current",
            sourceIds: ["oed_silly_modern"]
        )
    ]

    static let searchHistoryItem = SearchHistoryItem(
        id: UUID(),
        text: "silly",
        normalizedQuery: "silly",
        mode: .word,
        timestamp: Date(),
        selectedDate: nil,
        selectedEraLabel: nil,
        pinned: false,
        lastResultId: "silly"
    )
}
