import { useState, useEffect } from 'react'
import styles from './InstallPrompt.module.css'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('backwords:install-dismissed') === '1',
  )

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setDeferredPrompt(null)
    }
  }

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem('backwords:install-dismissed', '1')
  }

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-label="Install BackWords app"
      data-testid="install-prompt"
    >
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">📖</span>
        <div>
          <strong className={styles.title}>Install BackWords</strong>
          <p className={styles.desc}>Add to your home screen for offline access</p>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.installBtn} onClick={handleInstall}>
          Install
        </button>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
