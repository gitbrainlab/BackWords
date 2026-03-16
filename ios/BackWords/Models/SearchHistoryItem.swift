import Foundation

struct SearchHistoryItem: Codable, Identifiable, Hashable {
    let id: UUID
    let text: String
    let normalizedQuery: String
    let mode: SearchMode
    let timestamp: Date
    let selectedDate: Date?
    let selectedEraLabel: String?
    let pinned: Bool
    let lastResultId: String?
}

// MARK: - SearchMode

enum SearchMode: String, CaseIterable, Codable, Identifiable {
    case word = "word"
    case phrase = "phrase"
    case paragraph = "paragraph"

    var id: String { rawValue }
    var displayName: String {
        switch self {
        case .word: return "Word"
        case .phrase: return "Phrase"
        case .paragraph: return "Paragraph"
        }
    }
    var systemImage: String {
        switch self {
        case .word: return "textformat.abc"
        case .phrase: return "text.quote"
        case .paragraph: return "doc.text"
        }
    }
}
