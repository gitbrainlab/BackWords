import SwiftUI

/// All semantic color tokens for a single palette variant + light/dark mode.
struct Palette {
    let background: Color
    let card: Color
    let cardSecondary: Color
    let border: Color
    let textPrimary: Color
    let textSecondary: Color
    let muted: Color
    let accent: Color
    let accent2: Color
    let destructive: Color
}

// MARK: - Hex initializer

private extension Color {
    init(hex: UInt32) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - Scholarly (light)

extension Palette {
    static let scholarly = Palette(
        background:    Color(hex: 0xF5F0E8),
        card:          Color(hex: 0xFFFDF7),
        cardSecondary: Color(hex: 0xEDE8DC),
        border:        Color(hex: 0xC8B89A),
        textPrimary:   Color(hex: 0x1A1208),
        textSecondary: Color(hex: 0x4A3F2F),
        muted:         Color(hex: 0x7A6F5E),
        accent:        Color(hex: 0x8B3A12),
        accent2:       Color(hex: 0x2B5C3A),
        destructive:   Color(hex: 0xB03030)
    )

    static let scholarlyDark = Palette(
        background:    Color(hex: 0x1C170F),
        card:          Color(hex: 0x26200F),
        cardSecondary: Color(hex: 0x2E2718),
        border:        Color(hex: 0x4A3F2A),
        textPrimary:   Color(hex: 0xF0E8D0),
        textSecondary: Color(hex: 0xC8B88A),
        muted:         Color(hex: 0x7A6F50),
        accent:        Color(hex: 0xD4763A),
        accent2:       Color(hex: 0x6AAF80),
        destructive:   Color(hex: 0xE05050)
    )
}

// MARK: - Modern Premium

extension Palette {
    static let modernPremium = Palette(
        background:    Color(hex: 0xFFFFFF),
        card:          Color(hex: 0xF8F8F8),
        cardSecondary: Color(hex: 0xF0F0F0),
        border:        Color(hex: 0xE0E0E0),
        textPrimary:   Color(hex: 0x0A0A0A),
        textSecondary: Color(hex: 0x3A3A3A),
        muted:         Color(hex: 0x888888),
        accent:        Color(hex: 0x1A1AFF),
        accent2:       Color(hex: 0xFF5500),
        destructive:   Color(hex: 0xCC0000)
    )

    static let modernPremiumDark = Palette(
        background:    Color(hex: 0x0A0A0A),
        card:          Color(hex: 0x161616),
        cardSecondary: Color(hex: 0x202020),
        border:        Color(hex: 0x2A2A2A),
        textPrimary:   Color(hex: 0xF5F5F5),
        textSecondary: Color(hex: 0xBBBBBB),
        muted:         Color(hex: 0x666666),
        accent:        Color(hex: 0x4D7AFF),
        accent2:       Color(hex: 0xFF7A40),
        destructive:   Color(hex: 0xFF4444)
    )
}

// MARK: - Consumer Friendly

extension Palette {
    static let consumerFriendly = Palette(
        background:    Color(hex: 0xF7F3FF),
        card:          Color(hex: 0xFFFFFF),
        cardSecondary: Color(hex: 0xEEE8FF),
        border:        Color(hex: 0xD4C8F0),
        textPrimary:   Color(hex: 0x1A1030),
        textSecondary: Color(hex: 0x3D3060),
        muted:         Color(hex: 0x7868A0),
        accent:        Color(hex: 0x6B3FE0),
        accent2:       Color(hex: 0xE0803F),
        destructive:   Color(hex: 0xC03050)
    )

    static let consumerFriendlyDark = Palette(
        background:    Color(hex: 0x12101A),
        card:          Color(hex: 0x1C1828),
        cardSecondary: Color(hex: 0x242038),
        border:        Color(hex: 0x342E50),
        textPrimary:   Color(hex: 0xEDE8FF),
        textSecondary: Color(hex: 0xC0B8E0),
        muted:         Color(hex: 0x7868A0),
        accent:        Color(hex: 0xA882FF),
        accent2:       Color(hex: 0xFFA060),
        destructive:   Color(hex: 0xFF6080)
    )
}
