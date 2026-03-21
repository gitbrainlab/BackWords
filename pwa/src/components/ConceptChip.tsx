import styles from './ConceptChip.module.css'

interface Props {
  label: string
  onClick?: () => void
  muted?: boolean
}

export default function ConceptChip({ label, onClick, muted }: Props) {
  if (onClick) {
    return (
      <button
        type="button"
        className={`${styles.chip} ${muted ? styles.muted : ''}`}
        onClick={onClick}
      >
        {label}
      </button>
    )
  }
  return (
    <span className={`${styles.chip} ${styles.static} ${muted ? styles.muted : ''}`}>
      {label}
    </span>
  )
}
