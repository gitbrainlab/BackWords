import Foundation
import SwiftData

/// Manages the SwiftData ModelContainer and provides convenience CRUD for history entries.
@MainActor
final class LocalStore {
    let container: ModelContainer

    init() {
        let schema = Schema([HistoryEntry.self])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            self.container = try ModelContainer(for: schema, configurations: [config])
        } catch {
            // Fallback to in-memory store if on-disk creation fails (e.g., in previews).
            let fallback = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
            self.container = try! ModelContainer(for: schema, configurations: [fallback])
        }
    }

    // MARK: - History CRUD

    func insertHistory(_ item: SearchHistoryItem) {
        let entry = HistoryEntry(
            id: item.id,
            text: item.text,
            normalizedQuery: item.normalizedQuery,
            modeRaw: item.mode.rawValue,
            timestamp: item.timestamp,
            selectedDate: item.selectedDate,
            selectedEraLabel: item.selectedEraLabel,
            pinned: item.pinned,
            lastResultId: item.lastResultId
        )
        container.mainContext.insert(entry)
        try? container.mainContext.save()
    }

    func fetchRecentHistory(limit: Int = 20) -> [SearchHistoryItem] {
        let descriptor = FetchDescriptor<HistoryEntry>(
            sortBy: [SortDescriptor(\.timestamp, order: .reverse)]
        )
        let entries = (try? container.mainContext.fetch(descriptor)) ?? []
        return Array(entries.prefix(limit)).map { $0.toSearchHistoryItem() }
    }

    func deleteAllHistory() {
        try? container.mainContext.delete(model: HistoryEntry.self)
        try? container.mainContext.save()
    }

    func togglePin(id: UUID) {
        let descriptor = FetchDescriptor<HistoryEntry>(
            predicate: #Predicate { $0.id == id }
        )
        if let entry = try? container.mainContext.fetch(descriptor).first {
            entry.pinned.toggle()
            try? container.mainContext.save()
        }
    }
}
