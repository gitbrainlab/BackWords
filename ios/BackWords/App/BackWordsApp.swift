import SwiftUI

@main
struct BackWordsApp: App {
    @StateObject private var container = AppContainer()

    var body: some Scene {
        WindowGroup {
            ContentRootView()
                .environmentObject(container)
                .preferredColorScheme(container.settings.appearance.colorScheme)
        }
    }
}

/// Top-level navigation shell.
struct ContentRootView: View {
    @EnvironmentObject private var container: AppContainer

    var body: some View {
        TabView {
            NavigationStack {
                HomeSearchView()
            }
            .tabItem {
                Label("Search", systemImage: "magnifyingglass")
            }

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
        .modelContainer(container.modelContainer)
    }
}
