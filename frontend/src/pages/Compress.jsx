import { useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useToolSubmit } from '../hooks/useToolSubmit.js'
import styles from './Page.module.css'

export default function Compress() {
  const [files, setFiles] = useState([])
  const { submit, download, status, error, filename, isWorking } =
    useToolSubmit('/compress')

  const canSubmit = files.length === 1 && !isWorking

  const onSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('files', files[0])
    submit(fd, 'compressed.pdf')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>🗜️</div>
        <h1 className={styles.title}>Compress PDF</h1>
        <p className={styles.subtitle}>
          Reduce file size by cleaning up and recompressing the document.
        </p>
      </header>

      <form className={styles.card} onSubmit={onSubmit}>
        <DropZone
          files={files}
          onChange={setFiles}
          accept="application/pdf"
          hint="Select one PDF"
        />

        <div className={styles.actions}>
          <button type="submit" className="btn" disabled={!canSubmit}>
            {isWorking ? 'Compressing…' : 'Compress PDF'}
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
