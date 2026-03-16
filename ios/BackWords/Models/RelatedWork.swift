import Foundation

// MARK: - RelatedWork

struct RelatedWork: Codable, Identifiable, Hashable {
    var id: String { workId }

    let workId: String
    let title: String
    let creator: String?
    let year: Int?
    let workType: String
    let whyRelevant: String
    let publicDomainHint: Bool
    let links: [WorkLink]
}

// MARK: - WorkLink

struct WorkLink: Codable, Hashable {
    let label: String
    let url: String
}
