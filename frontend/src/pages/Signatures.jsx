import { Link } from 'react-router-dom'
import styles from './Page.module.css'

export default function Signatures() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>🖊️</div>
        <h1 className={styles.title}>Signatures</h1>
        <p className={styles.subtitle}>Saved signatures for signing your PDFs.</p>
      </header>

      <div className={styles.card}>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Saved signatures are coming soon. For now, you can sign a document with
          a certificate using the <Link to="/sign">Sign PDF</Link> tool.
        </p>
      </div>
    </div>
  )
}
