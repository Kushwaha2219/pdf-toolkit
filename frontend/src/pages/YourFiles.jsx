import { Link } from 'react-router-dom'
import styles from './Page.module.css'

export default function YourFiles() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>📁</div>
        <h1 className={styles.title}>Your files</h1>
        <p className={styles.subtitle}>Recently processed files you can re-download.</p>
      </header>

      <div className={styles.card}>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Saved files are coming soon — processed files will appear here for a
          limited time so you can re-download or delete them. For now, files are
          deleted right after processing. Head back to the{' '}
          <Link to="/">tools</Link> to get started.
        </p>
      </div>
    </div>
  )
}
