import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import styles from './Auth.module.css'

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setBusy(true)
    try {
      const res = await signup(form.name, form.email, form.password)
      // Account created but not yet usable — go enter the emailed code.
      navigate('/verify-email', {
        state: { email: form.email, devCode: res?.dev_code },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const onGoogle = async (credential) => {
    setError('')
    try {
      await loginWithGoogle(credential)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>It’s free — no credit card required.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={onSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              type="text"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <button type="submit" className="btn" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <div className={styles.orDivider}>
          <span>or</span>
        </div>
        <GoogleButton onCredential={onGoogle} onError={setError} />

        <p className={styles.switch}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
