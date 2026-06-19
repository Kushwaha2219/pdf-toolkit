import { useState, useRef, useEffect, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import ProgressBar from '../components/ProgressBar.jsx'
import { useToolSubmit } from '../hooks/useToolSubmit.js'
import page from './Page.module.css'
import styles from './Annotate.module.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const SCALE = 1.3 // render scale: 1 PDF point = SCALE screen px
const TOOLS = [
  { key: 'text', label: 'Text' },
  { key: 'highlight', label: 'Highlight' },
  { key: 'rect', label: 'Box' },
]

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export default function Annotate() {
  const [file, setFile] = useState(null)
  const [doc, setDoc] = useState(null)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [tool, setTool] = useState('text')
  const [color, setColor] = useState('#ff3b30')
  const [size, setSize] = useState(16)
  const [textValue, setTextValue] = useState('')
  const [annotations, setAnnotations] = useState([]) // PDF-point coords
  const [drag, setDrag] = useState(null) // { x0, y0, x1, y1 } in px

  const canvasRef = useRef(null)
  const { submit, download, status, error, filename, isWorking } =
    useToolSubmit('/edit/annotate')

  // Load the PDF whenever a file is chosen.
  const loadFile = useCallback(async (f) => {
    setFile(f)
    setAnnotations([])
    setPageNum(1)
    const buf = await f.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise
    setDoc(pdf)
    setNumPages(pdf.numPages)
  }, [])

  // Render the current page to the canvas.
  useEffect(() => {
    if (!doc) return
    let cancelled = false
    ;(async () => {
      const pdfPage = await doc.getPage(pageNum)
      const viewport = pdfPage.getViewport({ scale: SCALE })
      const canvas = canvasRef.current
      if (!canvas || cancelled) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      await pdfPage.render({ canvasContext: ctx, viewport }).promise
    })()
    return () => {
      cancelled = true
    }
  }, [doc, pageNum])

  const relPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e) => {
    if (!doc) return
    const { x, y } = relPos(e)
    if (tool === 'text') {
      if (!textValue.trim()) return
      // Click point is top-left of the text; baseline sits ~size below.
      setAnnotations((a) => [
        ...a,
        {
          page: pageNum - 1,
          type: 'text',
          x: x / SCALE,
          y: y / SCALE + Number(size) * 0.8,
          text: textValue,
          size: Number(size),
          color: hexToRgb(color),
          _px: { x, y }, // for on-screen rendering
        },
      ])
    } else {
      setDrag({ x0: x, y0: y, x1: x, y1: y })
    }
  }

  const onPointerMove = (e) => {
    if (!drag) return
    const { x, y } = relPos(e)
    setDrag((d) => ({ ...d, x1: x, y1: y }))
  }

  const onPointerUp = () => {
    if (!drag) return
    const x = Math.min(drag.x0, drag.x1)
    const y = Math.min(drag.y0, drag.y1)
    const w = Math.abs(drag.x1 - drag.x0)
    const h = Math.abs(drag.y1 - drag.y0)
    setDrag(null)
    if (w < 4 || h < 4) return
    setAnnotations((a) => [
      ...a,
      {
        page: pageNum - 1,
        type: tool,
        x: x / SCALE,
        y: y / SCALE,
        w: w / SCALE,
        h: h / SCALE,
        color: hexToRgb(color),
        _px: { x, y, w, h },
      },
    ])
  }

  const undo = () => setAnnotations((a) => a.slice(0, -1))
  const clearPage = () =>
    setAnnotations((a) => a.filter((an) => an.page !== pageNum - 1))

  const onApply = () => {
    if (!file || !annotations.length) return
    const fd = new FormData()
    fd.append('files', file)
    // Strip the screen-only _px field before sending.
    const payload = annotations.map(({ _px, ...rest }) => rest)
    fd.append('annotations', JSON.stringify(payload))
    submit(fd, 'annotated.pdf')
  }

  const pageAnnotations = annotations.filter((a) => a.page === pageNum - 1)

  return (
    <div className={styles.wrap}>
      <header className={page.header}>
        <div className={page.icon}>✍️</div>
        <h1 className={page.title}>Annotate PDF</h1>
        <p className={page.subtitle}>
          Add text, highlights and boxes directly onto the page.
        </p>
      </header>

      {!doc && (
        <div className={styles.picker}>
          <label className="btn">
            Choose a PDF
            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => e.target.files[0] && loadFile(e.target.files[0])}
            />
          </label>
        </div>
      )}

      {doc && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.group}>
              {TOOLS.map((t) => (
                <button
                  key={t.key}
                  className={`${styles.tool} ${tool === t.key ? styles.toolActive : ''}`}
                  onClick={() => setTool(t.key)}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tool === 'text' && (
              <input
                type="text"
                className={styles.textInput}
                placeholder="Type text, then click the page"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
              />
            )}

            <label className={styles.colorLabel}>
              Color
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </label>

            {tool === 'text' && (
              <label className={styles.sizeLabel}>
                Size
                <input
                  type="number"
                  min="8"
                  max="72"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                />
              </label>
            )}

            <div className={styles.group}>
              <button type="button" className="btn btn-ghost" onClick={undo}>
                Undo
              </button>
              <button type="button" className="btn btn-ghost" onClick={clearPage}>
                Clear page
              </button>
            </div>
          </div>

          <div className={styles.pager}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPageNum((n) => Math.max(1, n - 1))}
              disabled={pageNum <= 1}
            >
              ‹ Prev
            </button>
            <span>
              Page {pageNum} / {numPages}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPageNum((n) => Math.min(numPages, n + 1))}
              disabled={pageNum >= numPages}
            >
              Next ›
            </button>
          </div>

          <div className={styles.stage}>
            <div
              className={styles.canvasBox}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{ cursor: tool === 'text' ? 'text' : 'crosshair' }}
            >
              <canvas ref={canvasRef} className={styles.canvas} />

              {/* Existing annotations for this page */}
              {pageAnnotations.map((a, i) =>
                a.type === 'text' ? (
                  <span
                    key={i}
                    className={styles.annText}
                    style={{
                      left: a._px.x,
                      top: a._px.y,
                      fontSize: a.size * SCALE * 0.8,
                      color: `rgb(${a.color.map((c) => Math.round(c * 255)).join(',')})`,
                    }}
                  >
                    {a.text}
                  </span>
                ) : (
                  <div
                    key={i}
                    className={styles.annBox}
                    style={{
                      left: a._px.x,
                      top: a._px.y,
                      width: a._px.w,
                      height: a._px.h,
                      background:
                        a.type === 'highlight'
                          ? `rgba(${a.color.map((c) => Math.round(c * 255)).join(',')},0.35)`
                          : 'transparent',
                      border:
                        a.type === 'rect'
                          ? `2px solid rgb(${a.color.map((c) => Math.round(c * 255)).join(',')})`
                          : 'none',
                    }}
                  />
                )
              )}

              {/* Live drag preview */}
              {drag && (
                <div
                  className={styles.annBox}
                  style={{
                    left: Math.min(drag.x0, drag.x1),
                    top: Math.min(drag.y0, drag.y1),
                    width: Math.abs(drag.x1 - drag.x0),
                    height: Math.abs(drag.y1 - drag.y0),
                    background:
                      tool === 'highlight'
                        ? `rgba(${hexToRgb(color).map((c) => Math.round(c * 255)).join(',')},0.35)`
                        : 'transparent',
                    border:
                      tool === 'rect'
                        ? `2px dashed rgb(${hexToRgb(color).map((c) => Math.round(c * 255)).join(',')})`
                        : 'none',
                  }}
                />
              )}
            </div>
          </div>

          <div className={page.actions}>
            <button
              type="button"
              className="btn"
              onClick={onApply}
              disabled={!annotations.length || isWorking}
            >
              {isWorking ? 'Applying…' : `Apply & download (${annotations.length})`}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setDoc(null)
                setFile(null)
                setAnnotations([])
              }}
            >
              Open another PDF
            </button>
          </div>

          <ProgressBar
            status={status}
            error={error}
            filename={filename}
            onDownload={download}
          />
        </>
      )}
    </div>
  )
}
