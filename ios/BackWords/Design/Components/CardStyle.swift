import SwiftUI

// MARK: - CardStyle ViewModifier

struct CardStyle: ViewModifier {
    @Environment(\.palette) private var palette

    func body(content: Content) -> some View {
        content
            .padding(Spacing.lg)
            .background(palette.card)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(palette.border, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}

// MARK: - CardView

/// A general-purpose card container.
struct CardView<Content: View>: View {
    let content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    var body: some View {
        content()
            .cardStyle()
    }
}

// MARK: - ConfidenceIndicator

/// Displays a confidence score (0–1) as 1–3 filled dots.
struct ConfidenceIndicator: View {
    let confidence: Double
    @Environment(\.palette) private var palette

    private var filledDots: Int {
        switch confidence {
        case 0.66...: return 3
        case 0.33...: return 2
        default: return 1
        }
    }

    var body: some View {
        HStack(spacing: Spacing.xs) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(i < filledDots ? palette.accent : palette.muted.opacity(0.4))
                    .frame(width: 8, height: 8)
            }
        }
        .accessibilityLabel("Confidence: \(Int(confidence * 100))%")
    }
}

#Preview("CardStyle") {
    VStack(spacing: Spacing.xl) {
        CardView {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                Text("Example Card").font(.headline)
                Text("Card content goes here.").font(.body)
            }
        }

        HStack(spacing: Spacing.xl) {
            ConfidenceIndicator(confidence: 0.98)
            ConfidenceIndicator(confidence: 0.65)
            ConfidenceIndicator(confidence: 0.25)
        }
    }
    .padding()
    .palette(.scholarly)
}
