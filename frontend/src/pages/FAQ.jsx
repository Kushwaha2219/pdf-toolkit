import { useState } from 'react'
import styles from './FAQ.module.css'

// Reworded for PDFVish — a free online PDF service. Files are uploaded over
// HTTPS, processed on our servers, and automatically deleted shortly after.
const FAQS = [
  {
    q: 'Do you keep a copy of my processed files?',
    a: 'Absolutely not. Your files are yours alone. We keep them only long enough for you to download your result — a maximum of 2 hours — after which they are permanently deleted from our servers. You can also delete a document yourself as soon as your task finishes. We never check, copy, share or analyze your files in any way.',
  },
  {
    q: 'Are my company files safe with PDFVish?',
    a: 'Yes. Every upload is protected with HTTPS/SSL encryption, and your files are automatically deleted from our servers shortly after processing. We never sell or share your data, which helps satisfy most corporate data-privacy policies and aligns with strict standards such as the EU GDPR.',
  },
  {
    q: 'What are the system requirements?',
    a: 'The requirements are very basic. For the smoothest experience we recommend a recent version of Chrome, Firefox, Edge or Safari. If you ever run into an issue on the download screen, try opening the site in a private/incognito window.',
  },
  {
    q: 'How can I upload my files?',
    a: 'The easiest way is to drag and drop your files straight onto the drop zone. You can also click the “Select files” button to browse and choose files from your device.',
  },
  {
    q: 'Can I convert my scanned PDFs to an editable document?',
    a: 'Converting a scanned PDF into an editable format requires OCR (Optical Character Recognition), which turns non-selectable, scanned text into editable office documents. Scanned-PDF-to-Office conversions are supported where OCR is enabled.',
  },
  {
    q: 'Why does my conversion take so long?',
    a: 'Processing speed depends on a few factors: your internet connection, the size and complexity of the files, and how busy our servers are at the time. Larger or image-heavy PDFs naturally take longer to process.',
  },
  {
    q: 'Is there a file size or usage limit?',
    a: 'Our core tools are free to use with generous limits and no account required. Very large files may take a little longer to process. If you need higher limits or batch processing, take a look at our Pro plan.',
  },
]

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
      <button
        type="button"
        className={styles.question}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{q}</span>
        <span className={styles.chevron}>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <p className={styles.answer}>{a}</p>}
    </div>
  )
}

export default function FAQ() {
  // Start with all questions collapsed; -1 means none is open.
  const [openIndex, setOpenIndex] = useState(-1)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Frequently Asked Questions</h1>
        <p className={styles.subtitle}>
          Our support team answers these questions nearly every day — we thought
          they could be useful for you too.
        </p>
      </header>

      <div className={styles.list}>
        {FAQS.map((f, i) => (
          <FaqItem
            key={f.q}
            q={f.q}
            a={f.a}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </div>
  )
}
