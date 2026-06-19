import styles from './ProgressBar.module.css'

/**
 * Progress / result indicator for an in-flight tool request.
 * When `status === 'ready'`, shows a manual Download button that calls
 * `onDownload`; the file is not downloaded until the user clicks it.
 *
 * @param {'idle'|'working'|'ready'|'error'} status
 * @param {string} [error]
 * @param {string} [filename]      name of the ready-to-download file
 * @param {() => void} [onDownload]
 */
export default function ProgressBar({ status, error, filename, onDownload }) {
  if (status === 'idle') return null

  return (
    <div className={styles.wrap}>
      {status === 'working' && (
        <>
          <div className={styles.track}>
            <div className={styles.bar} />
          </div>
          <p className={styles.label}>Processing…</p>
        </>
      )}

      {status === 'ready' && (
        <div className={styles.ready}>
          <p className={`${styles.label} ${styles.done}`}>
            ✅ Your file is ready{filename ? `: ${filename}` : ''}
          </p>
          <button type="button" className="btn" onClick={onDownload}>
            ⬇️ Download
          </button>
        </div>
      )}

      {status === 'error' && (
        <p className={`${styles.label} ${styles.error}`}>⚠️ {error}</p>
      )}
    </div>
  )
}
