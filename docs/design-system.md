# BackWords Design System

---

## Typography

BackWords uses iOS Dynamic Type exclusively—no hardcoded font sizes.

### Scale

| Role | Text Style | Font | Notes |
|------|-----------|------|-------|
| Queried term | `.largeTitle` | Serif (New York) | The word being looked up |
| Era label / epoch heading | `.title` | Serif (New York) | "Victorian Era", "Old English" |
| Section header | `.headline` | Sans (SF Pro) | "Definition", "Sources" |
| Definition / body | `.body` | Sans (SF Pro) | Main definition text |
| Usage note | `.callout` | Sans (SF Pro, italic) | Contextual usage note |
| Example usage | `.callout` | Serif (New York, italic) | Quoted example text |
| Source metadata | `.footnote` | Sans (SF Pro) | Author, date, publisher |
| Confidence / badge | `.caption` | Sans (SF Pro) | Compact labels |

### Serif Modifier

Use `.fontDesign(.serif)` on `.largeTitle` and `.title` text styles to activate the system serif (New York) without hardcoding a font name:

```swift
Text(result.query)
    .font(.largeTitle)
    .fontDesign(.serif)
    .fontWeight(.bold)
```

### Dynamic Type

All type must scale from **xSmall** through **AX5** (200%+). Never use `lineLimit(1)` on content text. Prefer `.minimumScaleFactor` only on decorative single-line labels with a floor of `0.7`.

---

## Color Palettes

Three named palettes selectable in Settings. Each palette defines both light and dark variants.

---

### Palette 1: Scholarly

*Inspired by aged parchment, library stacks, and illuminated manuscripts. Warm neutrals, deep ink.*

#### Light

| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#F5F0E8` | Main background |
| `card` | `#FFFDF7` | Card surface |
| `cardSecondary` | `#EDE8DC` | Alternate card, timeline row |
| `border` | `#C8B89A` | Card borders, dividers |
| `textPrimary` | `#1A1208` | Headings, primary text |
| `textSecondary` | `#4A3F2F` | Body text, labels |
| `muted` | `#7A6F5E` | Placeholder, captions |
| `accent` | `#8B3A12` | Deep terracotta — links, highlights |
| `accent2` | `#2B5C3A` | Forest green — secondary actions |
| `destructive` | `#B03030` | Delete, error states |

#### Dark

| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#1C170F` | Main background |
| `card` | `#26200F` | Card surface |
| `cardSecondary` | `#2E2718` | Alternate card |
| `border` | `#4A3F2A` | Borders |
| `textPrimary` | `#F0E8D0` | Primary text |
| `textSecondary` | `#C8B88A` | Secondary text |
| `muted` | `#7A6F50` | Captions |
| `accent` | `#D4763A` | Warm amber-orange links |
| `accent2` | `#6AAF80` | Soft sage green |
| `destructive` | `#E05050` | Error |

---

### Palette 2: Modern Premium

*Clean, high-contrast, editorial. Inspired by literary magazines and premium reading apps.*

#### Light

| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#FFFFFF` | Main background |
| `card` | `#F8F8F8` | Card surface |
| `cardSecondary` | `#F0F0F0` | Alternate card |
| `border` | `#E0E0E0` | Borders |
| `textPrimary` | `#0A0A0A` | Headings |
| `textSecondary` | `#3A3A3A` | Body |
| `muted` | `#888888` | Captions |
| `accent` | `#1A1AFF` | Electric blue — links, highlights |
| `accent2` | `#FF5500` | Vermillion — secondary actions |
| `destructive` | `#CC0000` | Error |

#### Dark

| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#0A0A0A` | Main background |
| `card` | `#161616` | Card surface |
| `cardSecondary` | `#202020` | Alternate card |
| `border` | `#2A2A2A` | Borders |
| `textPrimary` | `#F5F5F5` | Primary text |
| `textSecondary` | `#BBBBBB` | Secondary text |
| `muted` | `#666666` | Captions |
| `accent` | `#4D7AFF` | Soft blue |
| `accent2` | `#FF7A40` | Warm orange |
| `destructive` | `#FF4444` | Error |

---

### Palette 3: Consumer Friendly

*Approachable, warm, accessible. Inspired by modern edtech and reading apps.*

#### Light

| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#F7F3FF` | Lavender tint background |
| `card` | `#FFFFFF` | Card surface |
| `cardSecondary` | `#EEE8FF` | Alternate card |
| `border` | `#D4C8F0` | Borders |
| `textPrimary` | `#1A1030` | Deep purple-black headings |
| `textSecondary` | `#3D3060` | Body text |
| `muted` | `#7868A0` | Captions |
| `accent` | `#6B3FE0` | Purple — links, highlights |
| `accent2` | `#E0803F` | Amber — secondary actions |
| `destructive` | `#C03050` | Error |

#### Dark

| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#12101A` | Deep purple-black |
| `card` | `#1C1828` | Card surface |
| `cardSecondary` | `#242038` | Alternate card |
| `border` | `#342E50` | Borders |
| `textPrimary` | `#EDE8FF` | Primary text |
| `textSecondary` | `#C0B8E0` | Secondary text |
| `muted` | `#7868A0` | Captions |
| `accent` | `#A882FF` | Bright purple |
| `accent2` | `#FFA060` | Amber |
| `destructive` | `#FF6080` | Error |

---

## Spacing Scale

All layout uses this 8-point-derived scale:

| Token | Value | Use |
|-------|-------|-----|
| `xs` | 4 pt | Icon padding, tight gaps |
| `sm` | 8 pt | Inline spacing, tag gaps |
| `md` | 12 pt | Text-to-icon, compact cells |
| `lg` | 16 pt | Standard padding, card insets |
| `xl` | 24 pt | Section separation |
| `xxl` | 32 pt | Major section breaks |
| `xxxl` | 48 pt | Screen-level top/bottom padding |

---

## Component Rules

### Cards

- Corner radius: **14 pt**
- Border: 1 pt, `palette.border`
- Background: `palette.card`
- Shadow: `0 2 8` opacity 0.06 (light) / `0 2 12` opacity 0.25 (dark)
- Padding: **16 pt** all sides

### Timeline Scrubber

- Horizontal scrolling bar at bottom of timeline
- Each era dot: 10 pt circle, `palette.accent` when selected, `palette.muted` otherwise
- Era label: `.caption` below each dot
- Selected era: dot scales to 14 pt with spring animation

### Source Card

- Compact variant: title + author + confidence dots (3 dots = 0.66+, 2 = 0.33–0.66, 1 = <0.33)
- Expanded variant (in SourceDetailView): full excerpt in styled quote block
- Quote block: left border 3 pt `palette.accent`, background `palette.cardSecondary`, padding 12 pt

### Passage Highlights

- Highlighted spans: background `palette.accent` at 20% opacity, corner radius 4 pt
- Tapped state: background `palette.accent` at 40% opacity
- Multiple concepts use `palette.accent` and `palette.accent2` alternating

---

## Accessibility

- **Text contrast**: All body/heading text must meet WCAG AA (4.5:1 against background)
- **UI element contrast**: Interactive controls must meet 3:1 (WCAG AA Large)
- **Dynamic Type**: Full support from xSmall through AX5
- **Reduce Motion**: Respect `@Environment(\.accessibilityReduceMotion)` — replace spring animations with instant transitions
- **VoiceOver**: All custom controls must have `.accessibilityLabel` and `.accessibilityHint`
- **Minimum tap target**: 44×44 pt minimum for all interactive elements
