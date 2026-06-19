import { Link } from 'react-router-dom'
import styles from './ToolCard.module.css'

export default function ToolCard({ to, icon, title, description }) {
  return (
    <Link to={to} className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      <span className={styles.cta}>Open tool →</span>
    </Link>
  )
}
