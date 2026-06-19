import { useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useToolSubmit } from '../hooks/useToolSubmit.js'
import styles from './Page.module.css'

export default function Split() {
  const [files, setFiles] = useState([])
  const [ranges, setRanges] = useState('')
  const { submit, download, status, error, filename, isWorking } =
    useToolSubmit('/split')

  const canSubmit = files.length === 1 && !isWorking

  const onSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('files', files[0])
    fd.append('ranges', ranges)
    submit(fd, 'split.zip')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>✂️</div>
        <h1 className={styles.title}>Split PDF</h1>
        <p className={styles.subtitle}>
          Extract page ranges into separate PDFs, delivered as a ZIP.
        </p>
      </header>

      <form className={styles.card} onSubmit={onSubmit}>
        <DropZone
          files={files}
          onChange={setFiles}
          accept="application/pdf"
          hint="Select one PDF"
        />

        <div className={styles.field}>
          <label className={styles.label} htmlFor="ranges">
            Page ranges
          </label>
          <input
            id="ranges"
            type="text"
            placeholder="e.g. 1-3, 5, 8-10"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
          />
          <p className={styles.help}>
            Leave blank to split every page into its own PDF. Pages are 1-based.
          </p>
        </div>

        <div className={styles.actions}>
          <button type="submit" className="btn" disabled={!canSubmit}>
            {isWorking ? 'Splitting…' : 'Split PDF'}
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
