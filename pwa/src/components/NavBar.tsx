import { NavLink } from 'react-router-dom'
import styles from './NavBar.module.css'

const LINKS = [
  { to: '/', label: 'Search', icon: '🔍', end: true },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
]

export default function NavBar() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <ul className={styles.list} role="list">
        {LINKS.map(link => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.linkActive : ''}`
              }
            >
              <span className={styles.icon} aria-hidden="true">{link.icon}</span>
              <span className={styles.label}>{link.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
