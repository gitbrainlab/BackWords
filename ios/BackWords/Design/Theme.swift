import SwiftUI

/// The three selectable design palettes.
enum PaletteVariant: String, CaseIterable, Identifiable, Codable {
    case scholarly = "scholarly"
    case modernPremium = "modernPremium"
    case consumerFriendly = "consumerFriendly"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .scholarly: return "Scholarly"
        case .modernPremium: return "Modern Premium"
        case .consumerFriendly: return "Consumer Friendly"
        }
    }
}

/// Access the active palette from anywhere via @Environment.
struct ThemeKey: EnvironmentKey {
    static let defaultValue: Palette = Palette.scholarly
}

extension EnvironmentValues {
    var palette: Palette {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}

/// Resolves a PaletteVariant + ColorScheme to a concrete Palette.
enum Theme {
    static func palette(for variant: PaletteVariant, scheme: ColorScheme) -> Palette {
        let isDark = scheme == .dark
        switch variant {
        case .scholarly:
            return isDark ? Palette.scholarlyDark : Palette.scholarly
        case .modernPremium:
            return isDark ? Palette.modernPremiumDark : Palette.modernPremium
        case .consumerFriendly:
            return isDark ? Palette.consumerFriendlyDark : Palette.consumerFriendly
        }
    }
}

/// Convenience modifier to inject a resolved palette into the environment.
struct PaletteEnvironmentModifier: ViewModifier {
    let variant: PaletteVariant
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content.environment(\.palette, Theme.palette(for: variant, scheme: colorScheme))
    }
}

extension View {
    func palette(_ variant: PaletteVariant) -> some View {
        modifier(PaletteEnvironmentModifier(variant: variant))
    }
}
