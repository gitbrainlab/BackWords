import Foundation

// MARK: - InterpretationResult

struct InterpretationResult: Codable, Identifiable {
    var id: String { lexemeId }

    let lexemeId: String
    let query: String
    let normalizedQuery: String
    let requestedDate: String?
    let resolvedEraLabel: String?
    let currentSnapshot: SnapshotInterpretation
    let selectedSnapshot: SnapshotInterpretation?
    let historicalSnapshots: [SnapshotInterpretation]
    let summaryOfChange: SummaryOfChange
    let keyDates: [KeyDate]
    let sources: [SourceCitation]
    let relatedWorks: [RelatedWork]
    let relatedPages: [RelatedPage]
    let relatedConcepts: [RelatedConcept]
    let ambiguityNotes: [String]
    let passage: Passage?
    let timelineEvents: [TimelineEvent]
    let generatedAt: String
    let modelVersion: String
}

// MARK: - SnapshotInterpretation

struct SnapshotInterpretation: Codable, Identifiable, Hashable {
    var id: String { snapshotId }

    let snapshotId: String
    let date: String
    let eraLabel: String
    let definition: String
    let usageNote: String
    let exampleUsage: String
    let register: String
    let sentiment: String
    let confidence: Double
    let sourceIds: [String]
}

// MARK: - SummaryOfChange

struct SummaryOfChange: Codable {
    let shortSummary: String
    let longSummary: String
    let sentimentShift: String
    let driftType: String
    let driftMagnitude: Double
}

// MARK: - KeyDate

struct KeyDate: Codable, Identifiable {
    var id: String { date + label }

    let date: String
    let label: String
    let significance: String
}

// MARK: - RelatedConcept

struct RelatedConcept: Codable, Identifiable {
    var id: String { conceptId }

    let conceptId: String
    let label: String
    let relationship: String
    let note: String?
}

// MARK: - Passage

struct Passage: Codable {
    let originalText: String
    let modernParaphrase: String?
    let highlights: [PassageHighlight]
}

// MARK: - PassageHighlight

struct PassageHighlight: Codable, Identifiable {
    var id: String { highlightId }

    let highlightId: String
    let start: Int
    let end: Int
    let text: String
    let conceptId: String
    let label: String
    let confidence: Double
}

// MARK: - TimelineEvent

struct TimelineEvent: Codable, Identifiable {
    var id: String { eventId }

    let eventId: String
    let date: String
    let eraLabel: String
    let title: String
    let summary: String
    let relatedSnapshotId: String?
    let sourceIds: [String]
}
