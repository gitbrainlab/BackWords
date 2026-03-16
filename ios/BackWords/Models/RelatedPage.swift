import Foundation

struct RelatedPage: Codable, Identifiable, Hashable {
    var id: String { pageId }

    let pageId: String
    let title: String
    let slug: String
    let summary: String
    let route: String
    let tags: [String]
}
