import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

export default function Privacy() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.updated}>Last updated: 20 June 2026</p>

      <div className={styles.prose}>
        <p>
          This Privacy Policy explains how PDFVish (“we”, “us”) handles your
          information when you use our website and PDF tools. By using PDFVish you
          agree to this policy.
        </p>

        <h2>1. Information we collect</h2>
        <ul>
          <li>
            <strong>Account details</strong> (only if you create an account):
            your name, email address, an encrypted (hashed) password, and
            optional country and timezone.
          </li>
          <li>
            <strong>Files you upload</strong> for processing (e.g. PDFs and
            images). These are used only to perform the operation you requested.
          </li>
          <li>
            <strong>Sign-in data</strong> from Google, if you choose “Continue
            with Google” (your name and email, provided by Google).
          </li>
        </ul>

        <h2>2. How we use your files</h2>
        <p>
          Files you upload are processed on our server to produce your result and
          are <strong>deleted automatically right after processing</strong>. We
          do not store your files long-term, read their contents for any other
          purpose, or share them with anyone.
        </p>

        <h2>3. How we use your information</h2>
        <ul>
          <li>To create and secure your account.</li>
          <li>
            To send transactional emails — email-verification codes and
            password-reset links.
          </li>
          <li>To provide, maintain and improve the service.</li>
        </ul>
        <p>We do not sell your personal information or use it for advertising.</p>

        <h2>4. Service providers</h2>
        <p>We rely on a few trusted third parties to run PDFVish:</p>
        <ul>
          <li><strong>Brevo</strong> — sends our transactional emails.</li>
          <li><strong>Google</strong> — optional “Sign in with Google”.</li>
          <li><strong>Render</strong> — application hosting.</li>
          <li><strong>Aiven</strong> — managed database for account data.</li>
        </ul>

        <h2>5. Cookies &amp; local storage</h2>
        <p>
          We store a sign-in token in your browser’s local storage to keep you
          logged in. We do not use advertising or tracking cookies.
        </p>

        <h2>6. Data retention</h2>
        <p>
          Uploaded files are deleted immediately after processing. Account data
          is kept until you delete your account or ask us to remove it.
        </p>

        <h2>7. Your rights</h2>
        <p>
          You can view and update your details in{' '}
          <Link to="/account">Account settings</Link>, and you may request
          deletion of your account and associated data by contacting us.
        </p>

        <h2>8. Security</h2>
        <p>
          Passwords are stored only as salted hashes, connections use HTTPS, and
          our database connection is encrypted. No method of transmission is 100%
          secure, but we take reasonable measures to protect your data.
        </p>

        <h2>9. Children</h2>
        <p>PDFVish is not directed to children under 13, and we do not knowingly collect their data.</p>

        <h2>10. Changes</h2>
        <p>
          We may update this policy from time to time. Material changes will be
          reflected by the “Last updated” date above.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions? Reach us via the <Link to="/contact">Contact</Link> page or
          at <a href="mailto:support@pdfvish.com">support@pdfvish.com</a>.
        </p>
      </div>
    </div>
  )
}
