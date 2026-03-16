import Foundation

// MARK: - SourceCitation

struct SourceCitation: Codable, Identifiable, Hashable {
    var id: String { sourceId }

    let sourceId: String
    let title: String
    let author: String?
    let publisher: String?
    let publishedDate: String?
    let sourceType: String
    let attribution: String
    let excerpt: String
    let relevanceNote: String
    let confidence: Double

    /// Convenience: formatted author / date display string.
    var bylineText: String {
        var parts: [String] = []
        if let author { parts.append(author) }
        if let publishedDate, let year = publishedDate.prefix(4).isEmpty ? nil : String(publishedDate.prefix(4)) {
            parts.append(year)
        }
        return parts.joined(separator: " · ")
    }
}
