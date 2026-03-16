import Foundation
import Combine

@MainActor
final class ResultViewModel: ObservableObject {
    // MARK: - Published state

    @Published var result: InterpretationResult?
    @Published var selectedTimelineEvent: TimelineEvent?
    @Published var sourceExplanation: ExplainSourceResponse?
    @Published var isLoading: Bool = false
    @Published var isLoadingExplanation: Bool = false
    @Published var error: String? = nil

    // MARK: - Dependencies

    private let apiClient: any APIClient

    init(apiClient: any APIClient) {
        self.apiClient = apiClient
    }

    // MARK: - Actions

    func loadResult(query: String, mode: SearchMode, date: String? = nil) {
        Task { await fetchResult(query: query, mode: mode, date: date) }
    }

    func setResult(_ result: InterpretationResult) {
        self.result = result
        self.selectedTimelineEvent = result.timelineEvents.first
        self.error = nil
    }

    func selectTimelineEvent(_ event: TimelineEvent) {
        selectedTimelineEvent = event
        guard let result else { return }
        Task { await fetchResult(query: result.query, mode: .word, date: event.date) }
    }

    func loadSourceExplanation(source: SourceCitation, snapshotId: String) {
        guard let result else { return }
        Task { await fetchExplanation(source: source, query: result.query, snapshotId: snapshotId) }
    }

    // MARK: - Private

    private func fetchResult(query: String, mode: SearchMode, date: String?) async {
        isLoading = true
        error = nil
        let req = InterpretRequest(query: query, mode: mode.rawValue, selectedDate: date)
        do {
            let fetched = try await apiClient.interpret(request: req)
            result = fetched
            if selectedTimelineEvent == nil {
                selectedTimelineEvent = fetched.timelineEvents.first
            }
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    private func fetchExplanation(source: SourceCitation, query: String, snapshotId: String) async {
        isLoadingExplanation = true
        let req = ExplainSourceRequest(
            sourceId: source.sourceId,
            query: query,
            snapshotId: snapshotId
        )
        do {
            sourceExplanation = try await apiClient.explainSource(request: req)
        } catch {
            self.error = error.localizedDescription
        }
        isLoadingExplanation = false
    }
}
