import styles from './BgShapes.module.css'

// Decorative, non-interactive geometric patches scattered behind the app.
// Each shape gets a position (via inline style) + a type/color class.
const SHAPES = [
  { type: 'circle', color: 'coral', size: 120, top: '6%', left: '4%' },
  { type: 'square', color: 'blue', size: 80, top: '14%', left: '88%', rot: 18 },
  { type: 'diamond', color: 'green', size: 90, top: '70%', left: '8%' },
  { type: 'ring', color: 'amber', size: 140, top: '78%', left: '82%' },
  { type: 'circle', color: 'violet', size: 70, top: '40%', left: '94%' },
  { type: 'square', color: 'coral', size: 56, top: '52%', left: '3%', rot: 12 },
  { type: 'ring', color: 'blue', size: 100, top: '4%', left: '60%' },
  { type: 'diamond', color: 'amber', size: 60, top: '30%', left: '46%' },
  { type: 'circle', color: 'green', size: 50, top: '90%', left: '40%' },
  { type: 'square', color: 'violet', size: 72, top: '64%', left: '60%', rot: -14 },
  { type: 'ring', color: 'coral', size: 64, top: '24%', left: '20%' },
  { type: 'diamond', color: 'blue', size: 80, top: '88%', left: '92%' },
]

export default function BgShapes() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {SHAPES.map((s, i) => (
        <span
          key={i}
          className={`${styles.shape} ${styles[s.type]} ${styles[s.color]}`}
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            '--rot': `${s.rot || 0}deg`,
          }}
        />
      ))}
    </div>
  )
}
