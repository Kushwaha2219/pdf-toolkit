import { useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useToolSubmit } from '../hooks/useToolSubmit.js'
import styles from './Page.module.css'

export default function Merge() {
  const [files, setFiles] = useState([])
  const { submit, download, status, error, filename, isWorking } =
    useToolSubmit('/merge')

  const canSubmit = files.length >= 2 && !isWorking

  const onSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData()
    files.forEach((f) => fd.append('files', f))
    submit(fd, 'merged.pdf')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>🔗</div>
        <h1 className={styles.title}>Merge PDFs</h1>
        <p className={styles.subtitle}>
          Combine two or more PDFs into one. Files are merged top-to-bottom.
        </p>
      </header>

      <form className={styles.card} onSubmit={onSubmit}>
        <DropZone
          files={files}
          onChange={setFiles}
          multiple
          accept="application/pdf"
          hint="Select at least 2 PDF files"
        />

        <div className={styles.actions}>
          <button type="submit" className="btn" disabled={!canSubmit}>
            {isWorking ? 'Merging…' : 'Merge PDFs'}
          </button>
          {files.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setFiles([])}
              disabled={isWorking}
            >
              Clear
            </button>
          )}
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
