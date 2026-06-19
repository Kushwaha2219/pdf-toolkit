import { Link } from 'react-router-dom'
import styles from './Pricing.module.css'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Everything you need for everyday PDF tasks.',
    features: [
      'All core tools (merge, split, compress…)',
      'No sign-up required',
      'No watermarks',
      'Files auto-deleted after processing',
    ],
    cta: 'Start using',
    to: '/',
    featured: false,
  },
  {
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
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pricing</h1>
        <p className={styles.subtitle}>
          Start free. Upgrade only when you need more power.
        </p>
      </header>

      <div className={styles.grid}>
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`${styles.card} ${p.featured ? styles.featured : ''}`}
          >
            {p.featured && <span className={styles.badge}>Most popular</span>}
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
            {p.to.startsWith('/') ? (
              <Link
                to={p.to}
                className={`btn ${p.featured ? '' : 'btn-ghost'} ${styles.cta}`}
              >
                {p.cta}
              </Link>
            ) : (
              <button type="button" className={`btn btn-ghost ${styles.cta}`} disabled>
                {p.cta}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
