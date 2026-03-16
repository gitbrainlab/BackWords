import Foundation

/// Static mock data for SwiftUI previews, matching the awful.json seed.
enum PreviewData {
    static let interpretationResult = InterpretationResult(
        lexemeId: "awful",
        query: "awful",
        normalizedQuery: "awful",
        requestedDate: nil,
        resolvedEraLabel: nil,
        currentSnapshot: currentSnapshot,
        selectedSnapshot: nil,
        historicalSnapshots: [oldEnglishSnapshot, victorianSnapshot],
        summaryOfChange: summaryOfChange,
        keyDates: keyDates,
        sources: [source1, source2],
        relatedWorks: [relatedWork1],
        relatedPages: [relatedPage1],
        relatedConcepts: [relatedConcept1],
        ambiguityNotes: [],
        passage: nil,
        timelineEvents: timelineEvents,
        generatedAt: "2024-01-01T00:00:00Z",
        modelVersion: "mock-seed-v1"
    )

    static let currentSnapshot = SnapshotInterpretation(
        snapshotId: "awful_current",
        date: "2024-01-01",
        eraLabel: "Contemporary",
        definition: "Very bad or unpleasant; used informally as an intensifier.",
        usageNote: "Used casually to express strong disapproval or as an amplifier: 'awfully kind', 'an awful lot'.",
        exampleUsage: "The weather was awful yesterday, but the cake was awfully good.",
        register: "informal",
        sentiment: "negative",
        confidence: 0.98,
        sourceIds: ["oed_awful_modern"]
    )

    static let oldEnglishSnapshot = SnapshotInterpretation(
        snapshotId: "awful_old_english",
        date: "0900-01-01",
        eraLabel: "Old English",
        definition: "Inspiring profound fear or dread; terror-inducing, especially of divine power.",
        usageNote: "Used in religious contexts to describe the wrath of God.",
        exampleUsage: "The awful judgment of God descended upon the sinful.",
        register: "formal",
        sentiment: "negative",
        confidence: 0.87,
        sourceIds: ["bosworth_toller"]
    )

    static let victorianSnapshot = SnapshotInterpretation(
        snapshotId: "awful_victorian",
        date: "1850-01-01",
        eraLabel: "Victorian Era",
        definition: "Inspiring awe; impressively large, notable, or solemn.",
        usageNote: "Still used seriously in literature but colloquial speech began using it as an intensifier.",
        exampleUsage: "The awful splendour of the Alps.",
        register: "neutral",
        sentiment: "neutral",
        confidence: 0.93,
        sourceIds: ["oed_awful_1"]
    )

    static let summaryOfChange = SummaryOfChange(
        shortSummary: "From awe-inspiring reverence to casual intensifier for 'very bad'.",
        longSummary: "Awful began as a deeply reverential adjective meaning 'worthy of awe'. Through Middle and Early Modern English it softened into a term for the sublime. By the Victorian era colloquial usage weakened it into a mere intensifier. By the 20th century pejoration was complete.",
        sentimentShift: "positive-to-negative",
        driftType: "pejoration",
        driftMagnitude: 0.9
    )

    static let keyDates = [
        KeyDate(date: "1755-01-01", label: "Johnson's Dictionary", significance: "Defined 'awful' as 'that which strikes with awe'."),
        KeyDate(date: "1884-01-01", label: "OED First Edition", significance: "Documented the colloquial weakening.")
    ]

    static let source1 = SourceCitation(
        sourceId: "oed_awful_1",
        title: "Oxford English Dictionary – awful, adj.",
        author: nil,
        publisher: "Oxford University Press",
        publishedDate: "2023-09-01",
        sourceType: "dictionary",
        attribution: "Paraphrase. © Oxford University Press.",
        excerpt: "Originally: inspiring reverential wonder or fear. Later weakened to: very great, notable, or unpleasant.",
        relevanceNote: "Primary authority on historical English usage.",
        confidence: 0.98
    )

    static let source2 = SourceCitation(
        sourceId: "johnson_dict",
        title: "A Dictionary of the English Language",
        author: "Samuel Johnson",
        publisher: "W. Strahan",
        publishedDate: "1755-01-01",
        sourceType: "dictionary",
        attribution: "Public domain.",
        excerpt: "AWFUL. adj. That which strikes with awe, or fills with reverence.",
        relevanceNote: "Johnson's definition exemplifies the reverential meaning before Victorian weakening.",
        confidence: 0.97
    )

    static let relatedWork1 = RelatedWork(
        workId: "rw_wordsworth_prelude",
        title: "The Prelude",
        creator: "William Wordsworth",
        year: 1850,
        workType: "poetry",
        whyRelevant: "Contains canonical uses of 'awful' in the sublime/reverential sense.",
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
        conceptId: "terrible",
        label: "terrible",
        relationship: "parallel-pejoration",
        note: "Underwent similar pejoration from 'terror-inspiring' to 'very bad'."
    )

    static let timelineEvents = [
        TimelineEvent(
            eventId: "te_awful_oe",
            date: "0900-01-01",
            eraLabel: "Old English",
            title: "Divine Dread: the original awful",
            summary: "In Old English, 'awful' described the terror of God's wrath.",
            relatedSnapshotId: "awful_old_english",
            sourceIds: ["bosworth_toller"]
        ),
        TimelineEvent(
            eventId: "te_awful_johnson",
            date: "1755-01-01",
            eraLabel: "18th Century",
            title: "Johnson's Dictionary codifies the reverential peak",
            summary: "Samuel Johnson defined 'awful' as 'that which strikes with awe'.",
            relatedSnapshotId: "awful_early_modern",
            sourceIds: ["johnson_dict"]
        ),
        TimelineEvent(
            eventId: "te_awful_modern",
            date: "1950-01-01",
            eraLabel: "Mid-20th Century",
            title: "Pejoration complete",
            summary: "By mid-20th century the reverential sense had been demoted to 'archaic'.",
            relatedSnapshotId: "awful_early_20c",
            sourceIds: ["oed_awful_modern"]
        )
    ]

    static let searchHistoryItem = SearchHistoryItem(
        id: UUID(),
        text: "awful",
        normalizedQuery: "awful",
        mode: .word,
        timestamp: Date(),
        selectedDate: nil,
        selectedEraLabel: nil,
        pinned: false,
        lastResultId: "awful"
    )
}
