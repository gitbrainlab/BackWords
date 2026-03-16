import Foundation
import SwiftUI

// MARK: - AppearanceMode

enum AppearanceMode: String, CaseIterable, Codable, Identifiable {
    case system = "system"
    case light = "light"
    case dark = "dark"

    var id: String { rawValue }
    var displayName: String {
        switch self {
        case .system: return "System"
        case .light: return "Light"
        case .dark: return "Dark"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

// MARK: - CachePolicy

enum CachePolicy: String, CaseIterable, Codable, Identifiable {
    case always = "always"
    case networkFirst = "networkFirst"
    case never = "never"

    var id: String { rawValue }
    var displayName: String {
        switch self {
        case .always: return "Always Cache"
        case .networkFirst: return "Network First"
        case .never: return "Never Cache"
        }
    }
}

// MARK: - AppSettingsModel

struct AppSettingsModel: Codable {
    var proxyBaseURL: String = "http://localhost:8000"
    var appearance: AppearanceMode = .system
    var defaultPerspective: String = "scholarly"
    var maxSources: Int = 3
    var cachePolicy: CachePolicy = .networkFirst
    var telemetryEnabled: Bool = false
    var mockMode: Bool = false
    var lastUpdated: Date? = nil

    // MARK: Persistence

    private static let userDefaultsKey = "backwords.appSettings"

    static func load() -> AppSettingsModel {
        guard
            let data = UserDefaults.standard.data(forKey: userDefaultsKey),
            let decoded = try? JSONDecoder().decode(AppSettingsModel.self, from: data)
        else {
            return AppSettingsModel()
        }
        return decoded
    }

    func save() {
        var mutable = self
        mutable.lastUpdated = Date()
        if let data = try? JSONEncoder().encode(mutable) {
            UserDefaults.standard.set(data, forKey: AppSettingsModel.userDefaultsKey)
        }
    }
}
