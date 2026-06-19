import { useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useToolSubmit } from '../hooks/useToolSubmit.js'
import styles from './Page.module.css'

export default function Protect() {
  const [mode, setMode] = useState('protect') // 'protect' | 'unlock'
  const [files, setFiles] = useState([])
  const [password, setPassword] = useState('')
  const { submit, download, status, error, filename, isWorking, reset } =
    useToolSubmit('/protect')

  const canSubmit = files.length === 1 && password.length > 0 && !isWorking

  const switchMode = (m) => {
    setMode(m)
    reset()
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('files', files[0])
    fd.append('mode', mode)
    fd.append('password', password)
    submit(fd, mode === 'unlock' ? 'unlocked.pdf' : 'protected.pdf')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>🔒</div>
        <h1 className={styles.title}>Protect / Unlock PDF</h1>
        <p className={styles.subtitle}>
          Add AES-256 password encryption, or remove it from a locked PDF.
        </p>
      </header>

      <form className={styles.card} onSubmit={onSubmit}>
        <div className={styles.radioRow}>
          <label
            className={`${styles.radio} ${
              mode === 'protect' ? styles.radioActive : ''
            }`}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === 'protect'}
              onChange={() => switchMode('protect')}
            />
            🔒 Protect
          </label>
          <label
            className={`${styles.radio} ${
              mode === 'unlock' ? styles.radioActive : ''
            }`}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === 'unlock'}
              onChange={() => switchMode('unlock')}
            />
            🔓 Unlock
          </label>
        </div>

        <div className={styles.field}>
          <DropZone
            files={files}
            onChange={setFiles}
            accept="application/pdf"
            hint="Select one PDF"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            {mode === 'protect' ? 'New password' : 'Current password'}
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className={styles.actions}>
          <button type="submit" className="btn" disabled={!canSubmit}>
            {isWorking
              ? 'Working…'
              : mode === 'protect'
              ? 'Protect PDF'
              : 'Unlock PDF'}
          </button>
        </div>

        <ProgressBar
          status={status}
          error={error}
          filename={filename}
          onDownload={download}
        />
      </form>
    </div>
  )
}
