import SwiftUI
import SwiftData

/// Central dependency container. Injected into the environment at app root.
@MainActor
final class AppContainer: ObservableObject {
    @Published private(set) var settings: AppSettingsModel
    @Published private(set) var apiClient: any APIClient
    let localStore: LocalStore
    let modelContainer: ModelContainer

    init() {
        let savedSettings = AppSettingsModel.load()
        self.settings = savedSettings

        let store = LocalStore()
        self.localStore = store
        self.modelContainer = store.container

        if savedSettings.mockMode {
            self.apiClient = MockAPIClient()
        } else {
            self.apiClient = LiveAPIClient(baseURL: savedSettings.proxyBaseURL)
        }
    }

    func updateSettings(_ newSettings: AppSettingsModel) {
        self.settings = newSettings
        newSettings.save()

        if newSettings.mockMode {
            self.apiClient = MockAPIClient()
        } else {
            self.apiClient = LiveAPIClient(baseURL: newSettings.proxyBaseURL)
        }
    }

    func refreshClient() {
        if settings.mockMode {
            self.apiClient = MockAPIClient()
        } else {
            self.apiClient = LiveAPIClient(baseURL: settings.proxyBaseURL)
        }
    }
}
