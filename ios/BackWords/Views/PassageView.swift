import SwiftUI

struct PassageView: View {
    let passage: Passage
    let query: String
    @State private var selectedHighlight: PassageHighlight? = nil
    @State private var navigateToConcept: String? = nil

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                // Concept chips
                if !passage.highlights.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(passage.highlights) { h in
                                Button { selectedHighlight = h } label: {
                                    HStack(spacing: Spacing.xs) {
                                        Image(systemName: "tag").font(.caption2)
                                        Text(h.label).font(.caption)
                                    }
                                    .padding(.horizontal, Spacing.md)
                                    .padding(.vertical, Spacing.xs)
                                    .background(selectedHighlight?.id == h.id
                                        ? Color.accentColor.opacity(0.3)
                                        : Color.accentColor.opacity(0.12))
                                    .clipShape(Capsule())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, Spacing.lg)
                    }
                }

                // Highlighted passage text
                HighlightedTextView(
                    text: passage.originalText,
                    highlights: passage.highlights,
                    selectedHighlight: $selectedHighlight
                )
                .padding(Spacing.lg)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .padding(.horizontal, Spacing.lg)

                // Modern paraphrase
                if let paraphrase = passage.modernParaphrase {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text("Modern Paraphrase").font(.headline)
                        Text(paraphrase).font(.body).foregroundStyle(.secondary)
                    }
                    .padding(.horizontal, Spacing.lg)
                }

                // Selected highlight detail
                if let h = selectedHighlight {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text(h.label).font(.headline)
                        Text("\"\(h.text)\"").font(.callout).italic()
                        HStack {
                            ConfidenceIndicator(confidence: h.confidence)
                            Text("\(Int(h.confidence * 100))% confidence").font(.caption).foregroundStyle(.secondary)
                        }
                        NavigationLink {
                            // Navigate to result compare for this concept.
                            Text("Result for: \(h.conceptId)")
                        } label: {
                            Label("Explore '\(h.conceptId)'", systemImage: "arrow.up.right.square")
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding(Spacing.lg)
                    .background(Color.accentColor.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
        .navigationTitle("Passage")
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Renders passage text with highlight spans using AttributedString.
struct HighlightedTextView: View {
    let text: String
    let highlights: [PassageHighlight]
    @Binding var selectedHighlight: PassageHighlight?

    var attributedText: AttributedString {
        var attributed = AttributedString(text)
        for h in highlights {
            guard h.start < h.end, h.end <= text.count else { continue }
            let startIdx = text.index(text.startIndex, offsetBy: h.start)
            let endIdx = text.index(text.startIndex, offsetBy: h.end)
            if let range = AttributedString.Index(startIdx, within: attributed).map({ start in
                AttributedString.Index(endIdx, within: attributed).map { end in start..<end }
            }) ?? nil {
                attributed[range].backgroundColor = .init(uiColor: .systemOrange.withAlphaComponent(
                    selectedHighlight?.highlightId == h.highlightId ? 0.4 : 0.2))
            }
        }
        return attributed
    }

    var body: some View {
        Text(attributedText)
            .font(.body)
            .onTapGesture { location in
                // Simple fallback: cycle through highlights on tap.
                if let current = selectedHighlight,
                   let idx = highlights.firstIndex(where: { $0.id == current.id }) {
                    selectedHighlight = highlights[(idx + 1) % highlights.count]
                } else {
                    selectedHighlight = highlights.first
                }
            }
    }
}

#Preview {
    NavigationStack {
        PassageView(
            passage: Passage(
                originalText: "The awful silence of the mountains filled every soul with reverence and vulgar cares were forgotten.",
                modernParaphrase: "The awe-inspiring silence of the mountains filled everyone with reverence, and ordinary worries were forgotten.",
                highlights: [
                    PassageHighlight(highlightId: "h1", start: 4, end: 9, text: "awful",
                                     conceptId: "awful", label: "Sublime reverence", confidence: 0.95),
                    PassageHighlight(highlightId: "h2", start: 70, end: 76, text: "vulgar",
                                     conceptId: "vulgar", label: "Common/ordinary (not obscene)", confidence: 0.88)
                ]
            ),
            query: "awful"
        )
    }
}
