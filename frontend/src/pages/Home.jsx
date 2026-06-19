import ToolCard from '../components/ToolCard.jsx'
import { tools, CATEGORIES } from '../toolsConfig.js'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Every PDF tool you need — <span>in one place</span>
        </h1>
        <p className={styles.tagline}>
          Convert, organize, edit and secure your PDFs online — completely free.
          Files are encrypted in transit and deleted automatically after
          processing. No account required.
        </p>
      </section>

      {CATEGORIES.map((category) => {
        const items = tools.filter((t) => t.category === category)
        if (!items.length) return null
        return (
          <section key={category} className={styles.group}>
            <h2 className={styles.groupTitle}>{category}</h2>
            <div className={styles.grid}>
              {items.map((t) => (
                <ToolCard
                  key={t.path}
                  to={t.path}
                  icon={t.icon}
                  title={t.title}
                  description={t.description}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
