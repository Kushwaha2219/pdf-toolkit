import { useRef, useState, useCallback } from 'react'
import styles from './DropZone.module.css'

/**
 * File picker with drag-and-drop. Controlled component: parent owns the `files`
 * array and gets updates via onChange.
 *
 * @param {File[]} files
 * @param {(files: File[]) => void} onChange
 * @param {boolean} [multiple]
 * @param {string} [accept]  e.g. "application/pdf" or "image/*"
 * @param {string} [hint]    helper text under the prompt
 */
export default function DropZone({
  files = [],
  onChange,
  multiple = false,
  accept = 'application/pdf',
  hint,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const addFiles = useCallback(
    (incoming) => {
      const list = Array.from(incoming)
      if (!list.length) return
      onChange(multiple ? [...files, ...list] : [list[0]])
    },
    [files, multiple, onChange]
  )

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  const removeAt = (idx) => onChange(files.filter((_, i) => i !== idx))

  return (
    <div>
      <div
        className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className={styles.input}
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className={styles.icon}>⬆️</div>
        <p className={styles.prompt}>
          <strong>Click to choose</strong> or drag files here
        </p>
        {hint && <p className={styles.hint}>{hint}</p>}
      </div>

      {files.length > 0 && (
        <ul className={styles.fileList}>
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className={styles.fileItem}>
              <span className={styles.fileName}>📎 {f.name}</span>
              <span className={styles.fileSize}>{formatSize(f.size)}</span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeAt(i)}
                aria-label={`Remove ${f.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
