import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Auth.module.css'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [devLink, setDevLink] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setDevLink('')
    setBusy(true)
    try {
      const res = await forgotPassword(email)
      setMessage(res.message)
      // Dev mode only: backend returns the reset link directly.
      if (res.dev_reset_link) setDevLink(res.dev_reset_link)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.subtitle}>
          Enter your account email and we’ll send you a reset link.
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}

        {devLink && (
          <div className={styles.devNote}>
            <strong>Dev mode:</strong> email isn’t configured yet, so use this
            link to reset your password:
            <br />
            <Link to={devLink}>Reset password →</Link>
          </div>
        )}

        {!message && (
          <form onSubmit={onSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <button
              type="submit"
              className="btn"
              disabled={busy}
              style={{ width: '100%' }}
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className={styles.switch}>
          Remembered it? <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  )
}
