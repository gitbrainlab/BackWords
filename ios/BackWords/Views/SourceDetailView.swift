import SwiftUI

struct SourceDetailView: View {
    let source: SourceCitation
    let query: String
    let snapshotId: String
    @StateObject private var vm: ResultViewModel
    @EnvironmentObject private var container: AppContainer
    @Environment(\.dismiss) private var dismiss

    init(source: SourceCitation, query: String, snapshotId: String) {
        self.source = source; self.query = query; self.snapshotId = snapshotId
        _vm = StateObject(wrappedValue: ResultViewModel(apiClient: MockAPIClient()))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                // Header
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text(source.title).font(.title3).fontWeight(.bold)
                    if !source.bylineText.isEmpty {
                        Text(source.bylineText).font(.subheadline).foregroundStyle(.secondary)
                    }
                    if let pub = source.publisher {
                        Label(pub, systemImage: "building.columns").font(.footnote).foregroundStyle(.secondary)
                    }
                }

                // Confidence
                HStack(spacing: Spacing.sm) {
                    Text("Confidence").font(.subheadline).fontWeight(.semibold)
                    ConfidenceIndicator(confidence: source.confidence)
                    Text("\(Int(source.confidence * 100))%").font(.footnote).foregroundStyle(.secondary)
                }

                // Excerpt
                VStack(alignment: .leading, spacing: 0) {
                    Rectangle().fill(Color.accentColor).frame(width: 3)
                    Text(source.excerpt)
                        .font(.body).italic()
                        .padding(.leading, Spacing.md)
                }
                .padding(Spacing.md)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 8))

                // Attribution
                Text(source.attribution).font(.caption).foregroundStyle(.secondary)

                // Relevance note
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text("Why This Source?").font(.headline)
                    Text(source.relevanceNote).font(.body)
                }

                // Explain source
                if let explanation = vm.sourceExplanation {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Label("Analysis", systemImage: "sparkles").font(.headline)
                        Text(explanation.explanation).font(.body)
                        Text(explanation.confidenceNarrative).font(.footnote).foregroundStyle(.secondary)
                    }
                    .padding(Spacing.lg)
                    .background(Color.accentColor.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    Button {
                        vm.loadSourceExplanation(source: source, snapshotId: snapshotId)
                    } label: {
                        Group {
                            if vm.isLoadingExplanation {
                                ProgressView()
                            } else {
                                Label("Why does this support the interpretation?", systemImage: "questionmark.bubble")
                            }
                        }
                    }
                    .buttonStyle(.bordered)
                    .disabled(vm.isLoadingExplanation)
                }
            }
            .padding(Spacing.lg)
        }
        .navigationTitle("Source")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
        .onAppear {
            // Pre-set the result so loadSourceExplanation can use the query.
            vm.setResult(PreviewData.interpretationResult)
        }
    }
}

#Preview {
    NavigationStack {
        SourceDetailView(source: PreviewData.source1, query: "awful", snapshotId: "awful_current")
    }
    .environmentObject(AppContainer())
}
