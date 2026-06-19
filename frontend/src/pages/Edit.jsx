import { useState } from 'react'
import DropZone from '../components/DropZone.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useToolSubmit } from '../hooks/useToolSubmit.js'
import styles from './Page.module.css'

// Page-level operations. "watermark" hits a different endpoint than the others.
const OPS = [
  { key: 'rotate', label: 'Rotate', needsPages: true, needsAngle: true },
  { key: 'delete', label: 'Delete', needsPages: true },
  { key: 'extract', label: 'Extract', needsPages: true },
  { key: 'reorder', label: 'Reorder', needsOrder: true },
  { key: 'watermark', label: 'Watermark', needsText: true },
]

export default function Edit() {
  const [files, setFiles] = useState([])
  const [op, setOp] = useState('rotate')
  const [pages, setPages] = useState('')
  const [angle, setAngle] = useState('90')
  const [order, setOrder] = useState('')
  const [text, setText] = useState('')

  const pagesSubmit = useToolSubmit('/edit/pages')
  const wmSubmit = useToolSubmit('/edit/watermark')
  const active = op === 'watermark' ? wmSubmit : pagesSubmit

  const cfg = OPS.find((o) => o.key === op)
  const canSubmit =
    files.length === 1 &&
    !active.isWorking &&
    (!cfg.needsPages || pages.trim()) &&
    (!cfg.needsOrder || order.trim()) &&
    (!cfg.needsText || text.trim())

  const onSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('files', files[0])
    if (op === 'watermark') {
      fd.append('text', text)
      wmSubmit.submit(fd, 'watermarked.pdf')
    } else {
      fd.append('operation', op)
      fd.append('pages', pages)
      fd.append('angle', angle)
      fd.append('order', order)
      pagesSubmit.submit(fd, 'edited.pdf')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>🧩</div>
        <h1 className={styles.title}>Edit PDF</h1>
        <p className={styles.subtitle}>
          Rotate, delete, reorder or extract pages — or stamp a watermark.
        </p>
      </header>

      <form className={styles.card} onSubmit={onSubmit}>
        <DropZone files={files} onChange={setFiles} accept="application/pdf" hint="Select one PDF" />

        <div className={styles.field}>
          <label className={styles.label}>Operation</label>
          <div className={styles.radioRow}>
            {OPS.map((o) => (
              <label
                key={o.key}
                className={`${styles.radio} ${op === o.key ? styles.radioActive : ''}`}
              >
                <input
                  type="radio"
                  name="op"
                  checked={op === o.key}
                  onChange={() => setOp(o.key)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        {cfg.needsPages && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="pages">
              Pages
            </label>
            <input
              id="pages"
              type="text"
              placeholder="e.g. 1, 3, 5-8"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
            />
            <p className={styles.help}>Comma-separated pages and ranges (1-based).</p>
          </div>
        )}

        {cfg.needsAngle && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="angle">
              Rotation
            </label>
            <div className={styles.radioRow}>
              {['90', '180', '270'].map((a) => (
                <label
                  key={a}
                  className={`${styles.radio} ${angle === a ? styles.radioActive : ''}`}
                >
                  <input
                    type="radio"
                    name="angle"
                    checked={angle === a}
                    onChange={() => setAngle(a)}
                  />
                  {a}° clockwise
                </label>
              ))}
            </div>
          </div>
        )}

        {cfg.needsOrder && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="order">
              New order
            </label>
            <input
              id="order"
              type="text"
              placeholder="e.g. 3, 1, 2"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
            <p className={styles.help}>List every page number exactly once.</p>
          </div>
        )}

        {cfg.needsText && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="wm">
              Watermark text
            </label>
            <input
              id="wm"
              type="text"
              placeholder="e.g. CONFIDENTIAL"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        )}

        <div className={styles.actions}>
          <button type="submit" className="btn" disabled={!canSubmit}>
            {active.isWorking ? 'Working…' : 'Apply'}
          </button>
        </div>

        <ProgressBar
          status={active.status}
          error={active.error}
          filename={active.filename}
          onDownload={active.download}
        />
      </form>
    </div>
  )
}
