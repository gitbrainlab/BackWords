import SwiftUI

/// Typography helpers for the BackWords design system.
/// All sizes defer to Dynamic Type — never use hardcoded font sizes.
enum Typography {
    /// Serif large title for the queried term display.
    static func queriedTerm() -> Font {
        Font.largeTitle.weight(.bold)
    }

    /// Serif title for era labels and epoch headings.
    static func eraLabel() -> Font {
        Font.title2.weight(.semibold)
    }

    /// Sans headline for section headers.
    static func sectionHeader() -> Font {
        Font.headline
    }

    /// Sans body for definitions and notes.
    static func definition() -> Font {
        Font.body
    }

    /// Callout italic for usage notes.
    static func usageNote() -> Font {
        Font.callout
    }

    /// Footnote for source metadata.
    static func sourceMeta() -> Font {
        Font.footnote
    }

    /// Caption for confidence badges and compact labels.
    static func badge() -> Font {
        Font.caption
    }
}

// MARK: - Serif modifier

extension View {
    /// Apply New York serif design to a text view.
    func serifStyle() -> some View {
        self.fontDesign(.serif)
    }

    /// Standard sans-serif (SF Pro) — the default; explicit for documentation.
    func sansStyle() -> some View {
        self.fontDesign(.default)
    }
}

// MARK: - Convenience Text modifiers

extension Text {
    func queriedTermStyle() -> some View {
        self
            .font(Typography.queriedTerm())
            .fontDesign(.serif)
    }

    func eraLabelStyle() -> some View {
        self
            .font(Typography.eraLabel())
            .fontDesign(.serif)
    }

    func sectionHeaderStyle() -> some View {
        self.font(Typography.sectionHeader())
    }

    func definitionStyle() -> some View {
        self.font(Typography.definition())
    }

    func usageNoteStyle() -> some View {
        self
            .font(Typography.usageNote())
            .italic()
    }

    func sourceMetaStyle() -> some View {
        self.font(Typography.sourceMeta())
    }

    func badgeStyle() -> some View {
        self.font(Typography.badge())
    }
}
