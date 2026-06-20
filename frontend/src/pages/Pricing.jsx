import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Pricing.module.css'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Everything you need for everyday PDF tasks.',
    features: [
      'All core tools (merge, split, compress…)',
      'No watermarks',
      'Rename files on download',
      'Files auto-deleted after processing',
    ],
    cta: 'Start using',
    to: '/',
    featured: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$6',
    period: 'per month',
    desc: 'For power users who process files all day.',
    features: [
      'Everything in Free',
      'Batch processing',
      'Higher file-size limits',
      'Priority processing',
    ],
    cta: 'Coming soon',
    to: '#',
    featured: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact sales',
    desc: 'For teams and businesses that need more.',
    features: [
      'Everything in Pro',
      'Self-hosted / on-premise option',
      'Custom integrations',
      'Dedicated support',
    ],
    cta: 'Contact us',
    to: '/contact',
    featured: false,
  },
]

export default function Pricing() {
  const { isAuthenticated, user, selectPlan } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Logged in but hasn't chosen a plan yet -> this page acts as "choose a plan".
  const choosing = isAuthenticated && !user?.plan

  const onChooseFree = async () => {
    setError('')
    setBusy(true)
    try {
      await selectPlan('free')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{choosing ? 'Choose your plan' : 'Pricing'}</h1>
        <p className={styles.subtitle}>
          {choosing
            ? 'Pick a plan to get started. You can change it later.'
            : 'Start free. Upgrade only when you need more power.'}
        </p>
      </header>

      {error && (
        <p style={{ textAlign: 'center', color: 'var(--danger)' }}>{error}</p>
      )}

      <div className={styles.grid}>
        {PLANS.map((p) => {
          const isCurrent = isAuthenticated && user?.plan === p.key
          return (
            <div
              key={p.key}
              className={`${styles.card} ${p.featured ? styles.featured : ''}`}
            >
              {isCurrent ? (
                <span className={styles.badge}>Current plan</span>
              ) : (
                p.featured && <span className={styles.badge}>Most popular</span>
              )}
              <h3 className={styles.planName}>{p.name}</h3>
              <div className={styles.priceRow}>
                <span className={styles.price}>{p.price}</span>
                <span className={styles.period}>/ {p.period}</span>
              </div>
              <p className={styles.planDesc}>{p.desc}</p>
              <ul className={styles.featureList}>
                {p.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              {renderCta(p, { isAuthenticated, isCurrent, busy, onChooseFree })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function renderCta(p, { isAuthenticated, isCurrent, busy, onChooseFree }) {
  const cls = `btn ${p.featured ? '' : 'btn-ghost'} ${styles.cta}`

  // The user's active plan.
  if (isCurrent) {
    return (
      <button type="button" className={cls} disabled>
        ✓ Your plan
      </button>
    )
  }

  // Free plan: a logged-in user selects it; anonymous users just start using.
  if (p.key === 'free') {
    if (isAuthenticated) {
      return (
        <button type="button" className={cls} disabled={busy} onClick={onChooseFree}>
          {busy ? 'Selecting…' : 'Choose Free'}
        </button>
      )
    }
    return (
      <Link to="/" className={cls}>
        {p.cta}
      </Link>
    )
  }

  // Pro: not purchasable yet.
  if (p.key === 'pro') {
    return (
      <button type="button" className={cls} disabled>
        {p.cta}
      </button>
    )
  }

  // Enterprise: contact link.
  return (
    <Link to="/contact" className={cls}>
      {p.cta}
    </Link>
  )
}
