import { useState } from 'react'
import NavBar from '@/components/NavBar'
import { useTheme } from '@/design/theme'
import { clearHistory } from '@/lib/history'
import type { AppSettings } from '@/types'
import styles from './Settings.module.css'

const PALETTE_OPTIONS: Array<{ value: AppSettings['palette']; label: string; desc: string }> = [
  { value: 'scholarly', label: 'Scholarly', desc: 'Terracotta & cream' },
  { value: 'modernPremium', label: 'Modern Premium', desc: 'Slate & gold' },
  { value: 'consumerFriendly', label: 'Consumer Friendly', desc: 'Electric blue & white' },
]

const SCHEME_OPTIONS: Array<{ value: AppSettings['colorScheme']; label: string }> = [
  { value: 'system', label: 'System default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export default function Settings() {
  const { settings, updateSettings } = useTheme()
  const [historyCleared, setHistoryCleared] = useState(false)

  function handleClearHistory() {
    clearHistory()
    setHistoryCleared(true)
    setTimeout(() => setHistoryCleared(false), 2000)
  }

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </header>

      <main id="main" className={styles.main}>
        {/* Appearance */}
        <section aria-labelledby="appearance-heading" className={styles.section}>
          <h2 id="appearance-heading" className={styles.sectionTitle}>Appearance</h2>

          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Colour scheme</span>
            <div className={styles.toggleGroup} role="group" aria-label="Colour scheme">
              {SCHEME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={settings.colorScheme === opt.value}
                  className={`${styles.toggleBtn} ${settings.colorScheme === opt.value ? styles.toggleBtnActive : ''}`}
                  onClick={() => updateSettings({ colorScheme: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Palette</span>
            <div className={styles.paletteGrid}>
              {PALETTE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={settings.palette === opt.value}
                  className={`${styles.paletteBtn} ${settings.palette === opt.value ? styles.paletteBtnActive : ''}`}
                  onClick={() => updateSettings({ palette: opt.value })}
                  data-testid={`palette-${opt.value}`}
                >
                  <strong>{opt.label}</strong>
                  <span>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* API & Mode */}
        <section aria-labelledby="api-heading" className={styles.section}>
          <h2 id="api-heading" className={styles.sectionTitle}>API & Mode</h2>

          <div className={styles.settingRowInline}>
            <div>
              <span className={styles.settingLabel}>Mock mode</span>
              <p className={styles.settingDesc}>Use built-in seed data instead of the AI API</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.mockMode}
              className={`${styles.toggle} ${settings.mockMode ? styles.toggleOn : ''}`}
              onClick={() => updateSettings({ mockMode: !settings.mockMode })}
              data-testid="mock-mode-toggle"
            >
              <span className={styles.toggleThumb} />
              <span className="visually-hidden">{settings.mockMode ? 'Mock mode on' : 'Mock mode off'}</span>
            </button>
          </div>

          <div className={styles.settingRowInline}>
            <div>
              <span className={styles.settingLabel}>Max sources per result</span>
              <p className={styles.settingDesc}>Controls how many sources appear in results</p>
            </div>
            <select
              className={styles.select}
              value={settings.maxSources}
              onChange={e => updateSettings({ maxSources: parseInt(e.target.value) })}
              aria-label="Max sources per result"
            >
              {[2, 4, 6, 8].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </section>

        {/* History */}
        <section aria-labelledby="history-heading" className={styles.section}>
          <h2 id="history-heading" className={styles.sectionTitle}>Search History</h2>
          <div className={styles.settingRowInline}>
            <p className={styles.settingDesc}>Clear all saved searches from this device</p>
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={handleClearHistory}
              data-testid="clear-history-btn"
            >
              {historyCleared ? '✓ Cleared' : 'Clear history'}
            </button>
          </div>
        </section>

        {/* About */}
        <section aria-labelledby="about-heading" className={styles.section}>
          <h2 id="about-heading" className={styles.sectionTitle}>About</h2>
          <p className={styles.aboutText}>
            BackWords traces the historical drift of words through time, drawing on scholarly sources
            from Old English to the present day.
          </p>
          <p className={`${styles.version} ${styles.settingDesc}`}>
            Version pwa-v0.1.0 · MIT licence
          </p>
        </section>
      </main>

      <NavBar />
    </div>
  )
}
