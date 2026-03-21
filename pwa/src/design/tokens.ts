// Design tokens — all 3 palettes × light/dark + spacing scale + typography roles
// Mirrors docs/design-system.md exactly.

export interface PaletteTokens {
  background: string
  card: string
  cardSecondary: string
  border: string
  textPrimary: string
  textSecondary: string
  muted: string
  accent: string
  accent2: string
  destructive: string
}

export interface PaletteSet {
  light: PaletteTokens
  dark: PaletteTokens
}

// ---------------------------------------------------------------------------
// Palette 1: Scholarly — aged parchment / library stacks
// ---------------------------------------------------------------------------
export const scholarly: PaletteSet = {
  light: {
    background:    '#F5F0E8',
    card:          '#FFFDF7',
    cardSecondary: '#EDE8DC',
    border:        '#C8B89A',
    textPrimary:   '#1A1208',
    textSecondary: '#4A3F2F',
    muted:         '#7A6F5E',
    accent:        '#8B3A12',
    accent2:       '#2B5C3A',
    destructive:   '#B03030',
  },
  dark: {
    background:    '#1C170F',
    card:          '#26200F',
    cardSecondary: '#2E2718',
    border:        '#4A3F2A',
    textPrimary:   '#F0E8D0',
    textSecondary: '#C8B88A',
    muted:         '#7A6F50',
    accent:        '#D4763A',
    accent2:       '#6AAF80',
    destructive:   '#E05050',
  },
}

// ---------------------------------------------------------------------------
// Palette 2: Modern Premium — editorial / high-contrast
// ---------------------------------------------------------------------------
export const modernPremium: PaletteSet = {
  light: {
    background:    '#FFFFFF',
    card:          '#F8F8F8',
    cardSecondary: '#F0F0F0',
    border:        '#E0E0E0',
    textPrimary:   '#0A0A0A',
    textSecondary: '#3A3A3A',
    muted:         '#888888',
    accent:        '#1A1AFF',
    accent2:       '#FF5500',
    destructive:   '#CC0000',
  },
  dark: {
    background:    '#0A0A0A',
    card:          '#161616',
    cardSecondary: '#202020',
    border:        '#2A2A2A',
    textPrimary:   '#F5F5F5',
    textSecondary: '#BBBBBB',
    muted:         '#666666',
    accent:        '#4D7AFF',
    accent2:       '#FF7A40',
    destructive:   '#FF4444',
  },
}

// ---------------------------------------------------------------------------
// Palette 3: Consumer Friendly — purple-lavender / edtech
// ---------------------------------------------------------------------------
export const consumerFriendly: PaletteSet = {
  light: {
    background:    '#F7F3FF',
    card:          '#FFFFFF',
    cardSecondary: '#EEE8FF',
    border:        '#D4C8F0',
    textPrimary:   '#1A1030',
    textSecondary: '#3D3060',
    muted:         '#7868A0',
    accent:        '#6B3FE0',
    accent2:       '#E0803F',
    destructive:   '#C03050',
  },
  dark: {
    background:    '#12101A',
    card:          '#1C1828',
    cardSecondary: '#242038',
    border:        '#342E50',
    textPrimary:   '#EDE8FF',
    textSecondary: '#C0B8E0',
    muted:         '#7868A0',
    accent:        '#A882FF',
    accent2:       '#FFA060',
    destructive:   '#FF6080',
  },
}

export const palettes = { scholarly, modernPremium, consumerFriendly } as const

// ---------------------------------------------------------------------------
// Spacing scale — 8pt grid (values in px)
// ---------------------------------------------------------------------------
export const spacing = {
  xs:    4,
  sm:    8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,
} as const

// ---------------------------------------------------------------------------
// Typography roles (CSS font stacks — serif mirrors iOS New York intent)
// ---------------------------------------------------------------------------
export const fontFamilies = {
  serif: '"Playfair Display", Georgia, "Times New Roman", Times, serif',
  sans:  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono:  '"SF Mono", "Fira Code", "Fira Mono", monospace',
} as const

// ---------------------------------------------------------------------------
// Helper: write all tokens as CSS custom properties onto :root
// ---------------------------------------------------------------------------
export function applyPaletteToRoot(tokens: PaletteTokens): void {
  const root = document.documentElement
  const entries: Array<[string, string]> = [
    ['--color-background',    tokens.background],
    ['--color-card',          tokens.card],
    ['--color-card-secondary',tokens.cardSecondary],
    ['--color-border',        tokens.border],
    ['--color-text-primary',  tokens.textPrimary],
    ['--color-text-secondary',tokens.textSecondary],
    ['--color-muted',         tokens.muted],
    ['--color-accent',        tokens.accent],
    ['--color-accent2',       tokens.accent2],
    ['--color-destructive',   tokens.destructive],
  ]
  for (const [prop, value] of entries) {
    root.style.setProperty(prop, value)
  }
}
