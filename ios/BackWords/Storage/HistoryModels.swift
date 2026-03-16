import Foundation
import SwiftData

/// SwiftData model for a persisted search history entry.
@Model
final class HistoryEntry {
    @Attribute(.unique) var id: UUID
    var text: String
    var normalizedQuery: String
    var modeRaw: String
    var timestamp: Date
    var selectedDate: Date?
    var selectedEraLabel: String?
    var pinned: Bool
    var lastResultId: String?

    init(
        id: UUID = UUID(),
        text: String,
        normalizedQuery: String,
        modeRaw: String,
        timestamp: Date = Date(),
        selectedDate: Date? = nil,
        selectedEraLabel: String? = nil,
        pinned: Bool = false,
        lastResultId: String? = nil
    ) {
        self.id = id
        self.text = text
        self.normalizedQuery = normalizedQuery
        self.modeRaw = modeRaw
        self.timestamp = timestamp
        self.selectedDate = selectedDate
        self.selectedEraLabel = selectedEraLabel
        self.pinned = pinned
        self.lastResultId = lastResultId
    }

    /// Convert to the lightweight SearchHistoryItem value type.
    func toSearchHistoryItem() -> SearchHistoryItem {
        SearchHistoryItem(
            id: id,
            text: text,
            normalizedQuery: normalizedQuery,
            mode: SearchMode(rawValue: modeRaw) ?? .word,
            timestamp: timestamp,
            selectedDate: selectedDate,
            selectedEraLabel: selectedEraLabel,
            pinned: pinned,
            lastResultId: lastResultId
        )
    }
}
