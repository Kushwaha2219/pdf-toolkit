import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    // Brand gradient (purple → pink → orange) applied via a per-icon <defs>.
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <defs>
          <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#feda75" />
            <stop offset="35%" stopColor="#fa7e1e" />
            <stop offset="65%" stopColor="#d62976" />
            <stop offset="100%" stopColor="#962fbf" />
          </linearGradient>
        </defs>
        <g
          stroke="url(#ig-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" />
          <circle cx="12" cy="12" r="4.2" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </g>
      </svg>
    ),
  },
  {
    name: 'X',
    href: 'https://x.com',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#1877F2">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <path
          fill="#FF0000"
          d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
        />
        <polygon fill="#fff" points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      </svg>
    ),
  },
]

const LINK_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Features', to: '/features' },
      { label: 'Tools', to: '/' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    title: 'Contact Us',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
]

function FooterLink({ to, label }) {
  // Internal routes use react-router; placeholders fall back to a plain anchor.
  if (to.startsWith('/')) {
    return (
      <Link to={to} className={styles.navLink}>
        {label}
      </Link>
    )
  }
  return (
    <a href={to} className={styles.navLink}>
      {label}
    </a>
  )
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <span className={styles.brand}>
            <span className={styles.logoMark}>PV</span>
            PDF<span className={styles.accent}>Vish</span>
          </span>
          <p className={styles.tagline}>
            Free online PDF tools · Files encrypted and auto-deleted after
            processing
          </p>

          <div className={styles.socials}>
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                title={s.name}
                className={styles.socialLink}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <nav className={styles.columns}>
          {LINK_COLUMNS.map((col) => (
            <div key={col.title} className={styles.column}>
              <h4 className={styles.columnTitle}>{col.title}</h4>
              <ul className={styles.columnList}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterLink to={l.to} label={l.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <p className={styles.copy}>© {2026} PDFVish. All rights reserved.</p>
    </footer>
  )
}
