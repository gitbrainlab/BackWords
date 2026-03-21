// Auto-mirrored from packages/shared-schema/AppSettings.schema.json
export type ColorScheme = 'system' | 'light' | 'dark'
export type PaletteChoice = 'scholarly' | 'modernPremium' | 'consumerFriendly'
export type CachePolicy = 'always' | 'networkFirst' | 'never'
export type ModelChoice = 'grok-4-1-fast-non-reasoning' | 'grok-4-1-fast-reasoning' | 'grok-4.20-0309-non-reasoning'

export interface AppSettings {
  apiBaseURL: string
  colorScheme: ColorScheme
  palette: PaletteChoice
  maxSources: number
  mockMode: boolean
  preferredModel: ModelChoice
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseURL: (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'https://backwords-api.netlify.app/.netlify/functions',
  colorScheme: 'system',
  palette: 'modernPremium',
  maxSources: 4,
  mockMode: false,
  preferredModel: 'grok-4-1-fast-non-reasoning',
}
