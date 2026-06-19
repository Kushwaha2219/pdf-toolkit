import { useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useToolSubmit } from '../hooks/useToolSubmit.js'
import styles from './Page.module.css'

export default function Sign() {
  const [pdf, setPdf] = useState([])
  const [cert, setCert] = useState([])
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState('')
  const { submit, download, status, error, filename, isWorking } =
    useToolSubmit('/sign')

  const canSubmit = pdf.length === 1 && cert.length === 1 && !isWorking

  const onSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('files', pdf[0])
    fd.append('certificate', cert[0])
    fd.append('password', password)
    fd.append('reason', reason)
    submit(fd, 'signed.pdf')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>🖊️</div>
        <h1 className={styles.title}>Sign PDF</h1>
        <p className={styles.subtitle}>
          Apply a cryptographic digital signature using your certificate.
        </p>
      </header>

      <form className={styles.card} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>PDF to sign</label>
          <DropZone files={pdf} onChange={setPdf} accept="application/pdf" hint="Select one PDF" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Certificate (.pfx / .p12)</label>
          <DropZone
            files={cert}
            onChange={setCert}
            accept=".pfx,.p12"
            hint="Your PKCS#12 signing certificate"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="cpw">
            Certificate password
          </label>
          <input
            id="cpw"
            type="password"
            placeholder="Password protecting the certificate"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="reason">
            Reason <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
          </label>
          <input
            id="reason"
            type="text"
            placeholder="e.g. I approve this document"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button type="submit" className="btn" disabled={!canSubmit}>
            {isWorking ? 'Signing…' : 'Sign PDF'}
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
