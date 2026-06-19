import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Auth.module.css'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      await resetPassword(token, form.password)
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Set a new password</h1>

        {!token && (
          <div className={styles.error}>
            This link is missing its reset token. Please request a new one.
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}
        {done && (
          <div className={styles.success}>
            Your password has been reset. Redirecting to log in…
          </div>
        )}

        {token && !done && (
          <form onSubmit={onSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>New password</span>
              <input
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Confirm password</span>
              <input
                type="password"
                value={form.confirm}
                onChange={update('confirm')}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />
            </label>

            <button
              type="submit"
              className="btn"
              disabled={busy}
              style={{ width: '100%' }}
            >
              {busy ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        )}

        <p className={styles.switch}>
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  )
}
