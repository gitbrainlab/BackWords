import SwiftUI

struct TimelineView: View {
    let events: [TimelineEvent]
    let query: String
    @State private var selectedId: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(events) { event in
                        TimelineRowView(event: event, isSelected: selectedId == event.id) {
                            withAnimation(.spring(duration: 0.3)) { selectedId = event.id }
                        }
                    }
                }
                .padding(Spacing.lg)
            }

            // Horizontal scrubber
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Spacing.xl) {
                    ForEach(events) { event in
                        Button {
                            withAnimation(.spring(duration: 0.3)) { selectedId = event.id }
                        } label: {
                            VStack(spacing: Spacing.xs) {
                                Circle()
                                    .fill(selectedId == event.id ? Color.accentColor : Color.secondary.opacity(0.4))
                                    .frame(width: selectedId == event.id ? 14 : 10,
                                           height: selectedId == event.id ? 14 : 10)
                                Text(String(event.date.prefix(4)))
                                    .font(.caption2)
                                    .foregroundStyle(selectedId == event.id ? .primary : .secondary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.vertical, Spacing.md)
            }
            .background(Color(.secondarySystemBackground))
        }
        .navigationTitle("Timeline: \(query)")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
        .onAppear { selectedId = events.first?.id }
    }
}

struct TimelineRowView: View {
    let event: TimelineEvent
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.lg) {
            // Timeline line + dot
            VStack(spacing: 0) {
                Rectangle().fill(Color.secondary.opacity(0.3)).frame(width: 2)
                Circle()
                    .fill(isSelected ? Color.accentColor : Color.secondary.opacity(0.5))
                    .frame(width: 12, height: 12)
                Rectangle().fill(Color.secondary.opacity(0.3)).frame(width: 2)
            }
            .frame(width: 12)

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(event.eraLabel).font(.caption).fontWeight(.bold).foregroundStyle(.secondary)
                    .textCase(.uppercase)
                Text(event.title).font(.headline)
                Text(event.summary).font(.body).foregroundStyle(.secondary)
            }
            .padding(.bottom, Spacing.xl)
        }
        .contentShape(Rectangle())
        .onTapGesture { onTap() }
        .background(isSelected ? Color.accentColor.opacity(0.05) : .clear)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

#Preview {
    NavigationStack {
        TimelineView(events: PreviewData.timelineEvents, query: "silly")
    }
}
