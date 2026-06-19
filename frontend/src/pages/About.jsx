import styles from './About.module.css'

export default function About() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>About PDFVish</h1>
        <p className={styles.subtitle}>
          Free, easy-to-use online PDF tools that put your privacy first.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.heading}>Our mission</h2>
        <p>
          PDFVish was built on a simple idea: working with PDFs should be free,
          fast and respectful of your privacy. Our tools are available to
          everyone, right from the browser — no downloads, no accounts and no
          hidden catch.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>What we offer</h2>
        <p>
          From merging and splitting to compressing, converting, protecting and
          signing, PDFVish brings every common PDF task into one fast, clean
          interface. There are no watermarks, no forced sign-ups and no
          artificial limits — just the tools you need, when you need them.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Built for privacy</h2>
        <p>
          When you upload a file, it is sent securely over HTTPS, processed on
          our servers, and automatically deleted shortly after — usually within
          a couple of hours. We never sell, share or analyze your documents,
          which helps us align with strict data-privacy standards such as the
          EU GDPR.
        </p>
      </section>
    </div>
  )
}
