// Auto-mirrored from packages/shared-schema/AppSettings.schema.json
export type ColorScheme = 'system' | 'light' | 'dark'
export type PaletteChoice = 'scholarly' | 'modernPremium' | 'consumerFriendly'
export type CachePolicy = 'always' | 'networkFirst' | 'never'

export interface AppSettings {
  apiBaseURL: string
  colorScheme: ColorScheme
  palette: PaletteChoice
  maxSources: number
  mockMode: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8888/.netlify/functions',
  colorScheme: 'system',
  palette: 'scholarly',
  maxSources: 4,
  mockMode: false,
}
