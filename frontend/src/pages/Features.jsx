import styles from './Features.module.css'

// High-level selling points of the service. Easy to extend — just add an entry.
const FEATURES = [
  {
    icon: '🔒',
    title: 'Private & secure',
    desc: 'Files are encrypted in transit and automatically deleted from our servers shortly after processing. We never sell, share or analyze them.',
  },
  {
    icon: '🧰',
    title: 'All-in-one toolkit',
    desc: 'Merge, split, compress, convert, protect, edit, annotate and sign — every common PDF task in one place.',
  },
  {
    icon: '⚡',
    title: 'Fast & free',
    desc: 'A snappy interface with instant feedback — and our core tools are completely free to use.',
  },
  {
    icon: '🔄',
    title: 'Convert any direction',
    desc: 'PDF to Word, PowerPoint, Excel and JPG — and back again from Office files and images to PDF.',
  },
  {
    icon: '🙌',
    title: 'No sign-up, no limits',
    desc: 'No accounts, usage caps or watermarks for everyday tasks. Just open a tool and get started.',
  },
  {
    icon: '🌐',
    title: 'Works everywhere',
    desc: 'Runs in any modern browser on desktop, tablet or phone — nothing to download or install.',
  },
]

export default function Features() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Features</h1>
        <p className={styles.subtitle}>
          Everything you need to work with PDFs — free, fast and secure, right
          in your browser.
        </p>
      </header>

      <div className={styles.grid}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.card}>
            <div className={styles.icon}>{f.icon}</div>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
