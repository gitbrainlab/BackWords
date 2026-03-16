import Foundation
import Combine

@MainActor
final class SettingsViewModel: ObservableObject {
    // MARK: - Published state

    @Published var proxyBaseURL: String
    @Published var appearance: AppearanceMode
    @Published var defaultPerspective: String
    @Published var maxSources: Int
    @Published var cachePolicy: CachePolicy
    @Published var telemetryEnabled: Bool
    @Published var mockMode: Bool
    @Published var isSaved: Bool = false

    // MARK: - Dependencies

    private let container: AppContainer

    init(container: AppContainer) {
        self.container = container
        let s = container.settings
        self.proxyBaseURL = s.proxyBaseURL
        self.appearance = s.appearance
        self.defaultPerspective = s.defaultPerspective
        self.maxSources = s.maxSources
        self.cachePolicy = s.cachePolicy
        self.telemetryEnabled = s.telemetryEnabled
        self.mockMode = s.mockMode
    }

    // MARK: - Actions

    func save() {
        var updated = AppSettingsModel()
        updated.proxyBaseURL = proxyBaseURL
        updated.appearance = appearance
        updated.defaultPerspective = defaultPerspective
        updated.maxSources = maxSources
        updated.cachePolicy = cachePolicy
        updated.telemetryEnabled = telemetryEnabled
        updated.mockMode = mockMode
        container.updateSettings(updated)
        isSaved = true
        Task {
            try? await Task.sleep(for: .seconds(2))
            isSaved = false
        }
    }

    func clearHistory() {
        container.localStore.deleteAllHistory()
    }

    func clearCache() {
        // In-memory cache invalidation.
        // TODO: If a URLCache is configured on LiveAPIClient, flush it here.
        URLCache.shared.removeAllCachedResponses()
    }
}
