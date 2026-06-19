import { useState } from 'react'
import DropZone from './DropZone.jsx'
import ProgressBar from './ProgressBar.jsx'
import { useToolSubmit } from '../hooks/useToolSubmit.js'
import styles from '../pages/Page.module.css'

/**
 * Generic single-input conversion tool. Most tools are just "upload file(s) →
 * POST → download result", so they share this component via a config object:
 *
 *   { endpoint, icon, title, description, accept, multiple, outName, cta }
 */
export default function ConversionTool({ config }) {
  const {
    endpoint,
    icon,
    title,
    description,
    accept = 'application/pdf',
    multiple = false,
    outName = 'result',
    cta,
    hint,
    options = [],
  } = config

  const [files, setFiles] = useState([])
  // Extra option fields (e.g. image quality). Seed from each option's default.
  const [optionValues, setOptionValues] = useState(() =>
    Object.fromEntries(options.map((o) => [o.name, o.default]))
  )
  const { submit, download, status, error, filename, isWorking } =
    useToolSubmit(endpoint)

  const canSubmit = files.length >= 1 && !isWorking

  const onSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData()
    files.forEach((f) => fd.append('files', f))
    options.forEach((o) => fd.append(o.name, optionValues[o.name]))
    submit(fd, outName)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>{icon}</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{description}</p>
      </header>

      <form className={styles.card} onSubmit={onSubmit}>
        <DropZone
          files={files}
          onChange={setFiles}
          multiple={multiple}
          accept={accept}
          hint={hint || (multiple ? 'Select one or more files' : 'Select a file')}
        />

        {options.map((o) => (
          <div key={o.name} className={styles.field}>
            <label className={styles.label} htmlFor={`opt-${o.name}`}>
              {o.label}
            </label>
            <select
              id={`opt-${o.name}`}
              className={styles.select}
              value={optionValues[o.name]}
              disabled={isWorking}
              onChange={(e) =>
                setOptionValues((v) => ({ ...v, [o.name]: e.target.value }))
              }
            >
              {o.choices.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className={styles.actions}>
          <button type="submit" className="btn" disabled={!canSubmit}>
            {isWorking ? 'Working…' : cta || title}
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
