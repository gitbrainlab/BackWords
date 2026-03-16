import Foundation

/// URL building helpers for all BackWords proxy endpoints.
enum Endpoints {
    static let interpret = "/interpret"
    static let explainSource = "/explain-source"
    static let health = "/health"

    static func url(base: String, path: String) -> URL? {
        let trimmed = base.trimmingCharacters(in: .init(charactersIn: "/"))
        return URL(string: trimmed + path)
    }

    static func interpretURL(base: String) -> URL? {
        url(base: base, path: interpret)
    }

    static func explainSourceURL(base: String) -> URL? {
        url(base: base, path: explainSource)
    }

    static func healthURL(base: String) -> URL? {
        url(base: base, path: health)
    }
}
