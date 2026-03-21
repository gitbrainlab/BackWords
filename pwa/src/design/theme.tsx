import React, { createContext, useContext, useEffect, useState } from 'react'
import { palettes, applyPaletteToRoot } from './tokens'
import type { AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

const SETTINGS_KEY = 'backwords:settings'

const VALID_MODELS = new Set<string>([
  'grok-4-1-fast-non-reasoning',
  'grok-4-1-fast-reasoning',
  'grok-4.20-0309-non-reasoning',
])

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>
      if (parsed.preferredModel && !VALID_MODELS.has(parsed.preferredModel)) {
        parsed.preferredModel = DEFAULT_SETTINGS.preferredModel
      }
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS
}

function saveSettings(s: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

interface ThemeContextValue {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void
  resolvedColorScheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolvedColorScheme: 'light' | 'dark' =
    settings.colorScheme === 'system'
      ? (systemDark ? 'dark' : 'light')
      : settings.colorScheme

  useEffect(() => {
    const palette = palettes[settings.palette] ?? palettes.scholarly
    applyPaletteToRoot(palette[resolvedColorScheme])
    document.documentElement.setAttribute('data-color-scheme', resolvedColorScheme)
    document.documentElement.setAttribute('data-palette', settings.palette)
    document.body.style.backgroundColor = palette[resolvedColorScheme].background
    document.body.style.color = palette[resolvedColorScheme].textPrimary
  }, [settings.palette, resolvedColorScheme])

  useEffect(() => {
    if (settings.colorScheme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const palette = palettes[settings.palette] ?? palettes.scholarly
      const scheme = mq.matches ? 'dark' : 'light'
      applyPaletteToRoot(palette[scheme])
      document.documentElement.setAttribute('data-color-scheme', scheme)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.colorScheme, settings.palette])

  function updateSettings(partial: Partial<AppSettings>) {
    setSettings(prev => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resolvedColorScheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

