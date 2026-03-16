import Foundation
import SwiftUI
import Combine

@MainActor
final class HomeViewModel: ObservableObject {
    // MARK: - Published state

    @Published var searchText: String = ""
    @Published var selectedMode: SearchMode = .word
    @Published var selectedDate: Date? = nil
    @Published var isDatePickerVisible: Bool = false
    @Published var recentSearches: [SearchHistoryItem] = []
    @Published var isLoading: Bool = false
    @Published var error: String? = nil

    /// Curated example queries shown on the home screen.
    let examples: [ExampleQuery] = [
        ExampleQuery(text: "silly", mode: .word, eraHint: "Try: Old English"),
        ExampleQuery(text: "villain", mode: .word, eraHint: "Try: Medieval"),
        ExampleQuery(text: "pretty", mode: .word, eraHint: "Try: Elizabethan"),
        ExampleQuery(text: "companion", mode: .word, eraHint: "Try: Medieval"),
        ExampleQuery(text: "disaster", mode: .word, eraHint: "Try: Renaissance"),
        ExampleQuery(text: "salary", mode: .word, eraHint: "Try: Roman"),
    ]

    // MARK: - Dependencies

    private let apiClient: any APIClient
    private let localStore: LocalStore
    var onResultLoaded: ((InterpretationResult) -> Void)?

    // MARK: - Init

    init(apiClient: any APIClient, localStore: LocalStore) {
        self.apiClient = apiClient
        self.localStore = localStore
    }

    // MARK: - Actions

    func search() {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return }
        Task { await performSearch(query: query) }
    }

    func search(query: String, mode: SearchMode) {
        searchText = query
        selectedMode = mode
        Task { await performSearch(query: query) }
    }

    func loadRecentSearches() {
        recentSearches = localStore.fetchRecentHistory(limit: 20)
    }

    func clearHistory() {
        localStore.deleteAllHistory()
        recentSearches = []
    }

    // MARK: - Private

    private func performSearch(query: String) async {
        isLoading = true
        error = nil

        let dateStr: String?
        if let selectedDate {
            dateStr = ISO8601DateFormatter().string(from: selectedDate).prefix(10).description
        } else {
            dateStr = nil
        }

        let req = InterpretRequest(
            query: query,
            mode: selectedMode.rawValue,
            selectedDate: dateStr
        )

        do {
            let result = try await apiClient.interpret(request: req)
            saveToHistory(query: query, result: result)
            onResultLoaded?(result)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    private func saveToHistory(query: String, result: InterpretationResult) {
        let item = SearchHistoryItem(
            id: UUID(),
            text: query,
            normalizedQuery: query.lowercased().trimmingCharacters(in: .whitespaces),
            mode: selectedMode,
            timestamp: Date(),
            selectedDate: selectedDate,
            selectedEraLabel: result.resolvedEraLabel,
            pinned: false,
            lastResultId: result.lexemeId
        )
        localStore.insertHistory(item)
        recentSearches = localStore.fetchRecentHistory(limit: 20)
    }
}

// MARK: - ExampleQuery

struct ExampleQuery: Identifiable {
    let id = UUID()
    let text: String
    let mode: SearchMode
    let eraHint: String
}
