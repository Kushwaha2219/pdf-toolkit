import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Auth.module.css'

export default function VerifyEmail() {
  const { verifyEmail, resendCode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  // Shown only in dev mode (no email provider configured) so the flow is testable.
  const [devCode, setDevCode] = useState(location.state?.devCode || '')

  // No email in route state means they landed here directly — start at signup.
  if (!email) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>Verify your email</h1>
          <p className={styles.subtitle}>
            Start by creating an account so we can send your code.
          </p>
          <p className={styles.switch}>
            <Link to="/signup">Go to sign up</Link>
          </p>
        </div>
      </div>
    )
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const u = await verifyEmail(email, code.trim())
      // New account -> go choose a plan before landing on the app.
      navigate(u?.plan ? '/' : '/pricing', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const onResend = async () => {
    setError('')
    setInfo('')
    try {
      const res = await resendCode(email)
      setInfo('A new code has been sent to your email.')
      if (res?.dev_code) setDevCode(res.dev_code)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Verify your email</h1>
        <p className={styles.subtitle}>
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
          activate your account.
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {info && (
          <div className={styles.error} style={{ background: '#ecfdf5', color: '#065f46' }}>
            {info}
          </div>
        )}
        {devCode && (
          <div className={styles.error} style={{ background: '#fffbeb', color: '#92400e' }}>
            Dev mode (no email provider set): your code is <strong>{devCode}</strong>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Verification code</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              autoComplete="one-time-code"
              required
              style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.25rem' }}
            />
          </label>

          <button
            type="submit"
            className="btn"
            disabled={busy || code.length !== 6}
            style={{ width: '100%' }}
          >
            {busy ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>

        <p className={styles.switch}>
          Didn’t get it?{' '}
          <button
            type="button"
            onClick={onResend}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              padding: 0,
              font: 'inherit',
            }}
          >
            Resend code
          </button>
        </p>
      </div>
    </div>
  )
}
