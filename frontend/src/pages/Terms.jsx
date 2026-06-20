import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

export default function Terms() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Terms of Service</h1>
      <p className={styles.updated}>Last updated: 20 June 2026</p>

      <div className={styles.prose}>
        <p>
          These Terms govern your use of PDFVish. By using the website or its
          tools, you agree to these Terms. If you do not agree, please don’t use
          the service.
        </p>

        <h2>1. The service</h2>
        <p>
          PDFVish provides free online tools to convert, organize, edit and
          secure PDF files. We may add, change or remove features at any time.
        </p>

        <h2>2. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Upload content you don’t have the right to use, or that is illegal or infringing.</li>
          <li>Upload malware or attempt to disrupt, overload or hack the service.</li>
          <li>Use the service to violate anyone’s rights or any applicable law.</li>
          <li>Abuse the service through automated or excessive requests.</li>
        </ul>

        <h2>3. Your files and content</h2>
        <p>
          You keep all rights to the files you upload. We claim no ownership over
          them. Files are processed to fulfil your request and deleted right
          afterwards — PDFVish is not a file-storage service, so keep your own
          copies.
        </p>

        <h2>4. Accounts</h2>
        <p>
          If you create an account, you’re responsible for keeping your
          credentials safe and for activity under your account. Provide accurate
          information and keep it up to date.
        </p>

        <h2>5. Availability &amp; “as is”</h2>
        <p>
          The service is provided “as is” and “as available”, without warranties
          of any kind. We don’t guarantee uninterrupted or error-free operation,
          or any particular conversion quality.
        </p>

        <h2>6. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, PDFVish is not liable for any
          indirect, incidental or consequential damages, or for any loss of data
          arising from your use of the service. Always keep backups of important
          files.
        </p>

        <h2>7. Termination</h2>
        <p>
          We may suspend or terminate access if these Terms are violated. You may
          stop using the service or delete your account at any time.
        </p>

        <h2>8. Changes to these Terms</h2>
        <p>
          We may update these Terms; the “Last updated” date will reflect any
          changes. Continued use after changes means you accept them.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions about these Terms? See the <Link to="/contact">Contact</Link>{' '}
          page or email{' '}
          <a href="mailto:support@pdfvish.com">support@pdfvish.com</a>. See also
          our <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
