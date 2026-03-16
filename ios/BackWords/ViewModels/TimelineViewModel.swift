import Foundation
import Combine

@MainActor
final class TimelineViewModel: ObservableObject {
    // MARK: - Published state

    @Published var events: [TimelineEvent] = []
    @Published var selectedEventId: String? = nil

    // MARK: - Computed

    var selectedEvent: TimelineEvent? {
        events.first { $0.eventId == selectedEventId }
    }

    // MARK: - Actions

    func setEvents(_ newEvents: [TimelineEvent], selectedId: String? = nil) {
        self.events = newEvents
        self.selectedEventId = selectedId ?? newEvents.first?.eventId
    }

    func selectEvent(_ event: TimelineEvent) {
        selectedEventId = event.eventId
    }

    func selectEventById(_ id: String) {
        if events.contains(where: { $0.eventId == id }) {
            selectedEventId = id
        }
    }

    /// Returns a 0–1 normalised position for each event based on its date (for scrubber).
    func normalisedPosition(for event: TimelineEvent) -> Double {
        guard events.count > 1 else { return 0.5 }
        guard let index = events.firstIndex(where: { $0.eventId == event.eventId }) else { return 0 }
        return Double(index) / Double(events.count - 1)
    }
}
