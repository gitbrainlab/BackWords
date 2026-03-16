import SwiftUI

struct ResultCompareView: View {
    let result: InterpretationResult
    @StateObject private var vm: ResultViewModel
    @EnvironmentObject private var container: AppContainer
    @State private var selectedSource: SourceCitation? = nil
    @State private var showTimeline = false

    init(result: InterpretationResult) {
        self.result = result
        _vm = StateObject(wrappedValue: ResultViewModel(apiClient: MockAPIClient()))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                // Query term
                Text(result.query)
                    .font(.largeTitle).fontDesign(.serif).fontWeight(.bold)

                // Summary of change
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text(result.summaryOfChange.shortSummary)
                        .font(.headline)
                    Text(result.summaryOfChange.longSummary)
                        .font(.body).foregroundStyle(.secondary)
                }

                // Now vs Then cards
                VStack(spacing: Spacing.md) {
                    SnapshotCard(snapshot: result.currentSnapshot, label: "Now")
                    if let historical = result.historicalSnapshots.first {
                        SnapshotCard(snapshot: historical, label: "Then")
                    }
                }

                // Key dates
                if !result.keyDates.isEmpty {
                    Text("Key Dates").font(.headline)
                    ForEach(result.keyDates) { kd in
                        HStack(alignment: .top, spacing: Spacing.sm) {
                            Image(systemName: "calendar.badge.clock")
                                .foregroundStyle(.accent)
                            VStack(alignment: .leading) {
                                Text(kd.label).font(.subheadline).fontWeight(.semibold)
                                Text(kd.significance).font(.footnote).foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                // Timeline button
                if !result.timelineEvents.isEmpty {
                    Button {
                        showTimeline = true
                    } label: {
                        Label("View Timeline (\(result.timelineEvents.count) events)", systemImage: "timeline.selection")
                    }
                    .buttonStyle(.bordered)
                }

                // Sources
                if !result.sources.isEmpty {
                    Text("Sources").font(.headline)
                    ForEach(result.sources) { source in
                        Button {
                            selectedSource = source
                        } label: {
                            SourceRowView(source: source)
                        }
                        .buttonStyle(.plain)
                    }
                }

                // Related concepts
                if !result.relatedConcepts.isEmpty {
                    Text("Related Concepts").font(.headline)
                    FlowLayout(spacing: Spacing.sm) {
                        ForEach(result.relatedConcepts) { c in
                            Text(c.label)
                                .font(.caption)
                                .padding(.horizontal, Spacing.md)
                                .padding(.vertical, Spacing.xs)
                                .background(Color.accentColor.opacity(0.15))
                                .clipShape(Capsule())
                        }
                    }
                }

                // Ambiguity notes
                if !result.ambiguityNotes.isEmpty {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Label("Ambiguity Notes", systemImage: "exclamationmark.bubble")
                            .font(.headline)
                        ForEach(result.ambiguityNotes, id: \.self) { note in
                            Text("• \(note)").font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                }

                // Related works
                if !result.relatedWorks.isEmpty {
                    Text("Related Works").font(.headline)
                    ForEach(result.relatedWorks) { work in
                        VStack(alignment: .leading, spacing: Spacing.xs) {
                            Text(work.title).font(.subheadline).fontWeight(.semibold)
                            if let creator = work.creator { Text(creator).font(.footnote).foregroundStyle(.secondary) }
                            Text(work.whyRelevant).font(.footnote).foregroundStyle(.secondary)
                        }
                        .padding(Spacing.md)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .padding(Spacing.lg)
        }
        .navigationTitle(result.query)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showTimeline) {
            NavigationStack {
                TimelineView(events: result.timelineEvents, query: result.query)
            }
        }
        .sheet(item: $selectedSource) { source in
            NavigationStack {
                SourceDetailView(source: source, query: result.query, snapshotId: result.currentSnapshot.snapshotId)
            }
        }
        .onAppear { vm.setResult(result) }
    }
}

struct SnapshotCard: View {
    let snapshot: SnapshotInterpretation
    let label: String

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack {
                Text(label).font(.caption).fontWeight(.bold).textCase(.uppercase)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(snapshot.eraLabel).font(.caption).italic()
                    .foregroundStyle(.secondary)
            }
            Text(snapshot.definition).font(.body)
            Text(snapshot.exampleUsage).font(.callout).italic()
                .foregroundStyle(.secondary)
            HStack {
                ConfidenceIndicator(confidence: snapshot.confidence)
                Spacer()
                Text(snapshot.register).font(.caption2).foregroundStyle(.secondary)
            }
        }
        .padding(Spacing.lg)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

struct SourceRowView: View {
    let source: SourceCitation
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(source.title).font(.subheadline).fontWeight(.semibold).lineLimit(2)
                if !source.bylineText.isEmpty {
                    Text(source.bylineText).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            ConfidenceIndicator(confidence: source.confidence)
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(.tertiary)
        }
        .padding(Spacing.md)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

/// Simple wrapping HStack for chips.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var height: CGFloat = 0; var rowWidth: CGFloat = 0; var rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if rowWidth + size.width > width { height += rowHeight + spacing; rowWidth = 0; rowHeight = 0 }
            rowWidth += size.width + spacing; rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: width, height: height + rowHeight)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX; var y = bounds.minY; var rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX { y += rowHeight + spacing; x = bounds.minX; rowHeight = 0 }
            view.place(at: CGPoint(x: x, y: y), proposal: .init(size))
            x += size.width + spacing; rowHeight = max(rowHeight, size.height)
        }
    }
}

#Preview { NavigationStack { ResultCompareView(result: PreviewData.interpretationResult) }.environmentObject(AppContainer()) }
