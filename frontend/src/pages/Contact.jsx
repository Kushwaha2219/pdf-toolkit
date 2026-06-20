import { useState } from 'react'
import { postJson } from '../utils/api.js'
import styles from './Contact.module.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await postJson('/contact', form)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send your message. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>
          Questions, feedback or a bug to report? We’d love to hear from you.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>support@pdfvish.com</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Support hours</span>
            <span className={styles.infoValue}>Mon–Fri, 9am–6pm</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Response time</span>
            <span className={styles.infoValue}>Usually within 24 hours</span>
          </div>
        </div>

        <form className={styles.card} onSubmit={onSubmit}>
          {sent ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>✓</div>
              <h3>Thanks, {form.name || 'there'}!</h3>
              <p>Your message has been received. We’ll get back to you soon.</p>
            </div>
          ) : (
            <>
              {error && (
                <p style={{ color: 'var(--danger)', margin: '0 0 1rem', fontSize: '0.9rem' }}>
                  {error}
                </p>
              )}
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Your name"
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
                  required
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Message</span>
                <textarea
                  value={form.message}
                  onChange={update('message')}
                  placeholder="How can we help?"
                  rows={5}
                  required
                />
              </label>

              <button type="submit" className="btn" disabled={busy}>
                {busy ? 'Sending…' : 'Send message'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
