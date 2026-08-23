import { useCallback, useEffect, useRef, useState } from 'react'
import useModeFilters from './useModeFilters.js'
import FilterPanel from './FilterPanel.jsx'
import ColorPicker from './ColorPicker.jsx'
import { hexToRgb, rgbToHex } from './colorUtils.js'

const CANVAS_W = 640
const CANVAS_H = 360
const MAX_S = 3600
const HISTORY_LIMIT = 25

const SHAPE_TOOLS = ['line', 'rect', 'circle', 'triangle']

const TOOLS = [
  { id: 'pencil', label: 'Pencil' },
  { id: 'brush', label: 'Brush' },
  { id: 'spray', label: 'Spray' },
  { id: 'eraser', label: 'Eraser' },
  { id: 'fill', label: 'Fill' },
  { id: 'eyedropper', label: 'Pick color' },
  { id: 'line', label: 'Line' },
  { id: 'rect', label: 'Rect' },
  { id: 'circle', label: 'Circle' },
  { id: 'triangle', label: 'Triangle' },
]

const PALETTE = [
  '#000000', '#7f7f7f', '#ffffff', '#c0392b',
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#2c3e91', '#8e44ad',
  '#e91e8c', '#8b4513',
]

function ToolIcon({ id }) {
  const p = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (id) {
    case 'pencil':
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M4 20l1.5-5L16 4.5a2.1 2.1 0 013 3L8.5 18.5L4 20z" />
          <path d="M14 6.5l3 3" />
        </svg>
      )
    case 'brush':
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M12 3v6" />
          <rect x="9.5" y="9" width="5" height="3" rx="0.5" />
          <path d="M8.5 12h7v3a3.5 3.5 0 01-7 0v-3z" />
        </svg>
      )
    case 'spray':
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <rect x="8" y="9" width="8" height="12" rx="1" />
          <path d="M10.5 9V6h3v3" />
          <path d="M17 4h.01M19.5 6h.01M19 2.5h.01" />
        </svg>
      )
    case 'eraser':
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M5 15l8-8 5 5-6 6H8l-3-3z" />
          <path d="M9 21h11" />
        </svg>
      )
    case 'fill':
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M11 3l7 7-7.5 7.5a1.8 1.8 0 01-2.6 0L4 13.6a1.8 1.8 0 010-2.6L11 3z" />
          <path d="M9 1.5L11 3" />
          <path d="M20 14s1.8 2.3 1.8 3.7a1.8 1.8 0 11-3.6 0C18.2 16.3 20 14 20 14z" />
        </svg>
      )
    case 'eyedropper':
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M13 7l4 4L8.5 19.5H4.5v-4L13 7z" />
          <path d="M12 6l1.8-1.8a2.55 2.55 0 013.6 3.6L15.5 9.5" />
        </svg>
      )
    case 'line':
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M5 19L19 5" />
          <circle cx="5" cy="19" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="19" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'rect':
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <rect x="4" y="6" width="16" height="12" rx="1" />
        </svg>
      )
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
    case 'triangle':
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M12 4.5l8.5 15h-17l8.5-15z" />
        </svg>
      )
    default:
      return null
  }
}

const thumbUrl = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`

function fmtTime(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function floodFill(ctx, startX, startY, hex, tolerance = 48) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  const sx = Math.floor(startX)
  const sy = Math.floor(startY)
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return
  const image = ctx.getImageData(0, 0, w, h)
  const data = image.data
  const startIdx = (sy * w + sx) * 4
  const tr = data[startIdx]
  const tg = data[startIdx + 1]
  const tb = data[startIdx + 2]
  const [fr, fg, fb] = hexToRgb(hex)
  if (tr === fr && tg === fg && tb === fb) return
  const visited = new Uint8Array(w * h)
  const stack = [sy * w + sx]
  while (stack.length > 0) {
    const idx = stack.pop()
    if (visited[idx]) continue
    const d = idx * 4
    if (
      Math.abs(data[d] - tr) > tolerance ||
      Math.abs(data[d + 1] - tg) > tolerance ||
      Math.abs(data[d + 2] - tb) > tolerance
    ) {
      continue
    }
    visited[idx] = 1
    data[d] = fr
    data[d + 1] = fg
    data[d + 2] = fb
    data[d + 3] = 255
    const x = idx % w
    if (x > 0) stack.push(idx - 1)
    if (x < w - 1) stack.push(idx + 1)
    if (idx >= w) stack.push(idx - w)
    if (idx < w * (h - 1)) stack.push(idx + w)
  }
  ctx.putImageData(image, 0, 0)
}

export default function DrawGame({ entries }) {
  const [phase, setPhase] = useState('setup')
  const [viewInput, setViewInput] = useState('60')
  const [drawInput, setDrawInput] = useState('300')
  const [target, setTarget] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [drawingUrl, setDrawingUrl] = useState(null)

  const [tool, setTool] = useState('pencil')
  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(4)
  const [opacity, setOpacity] = useState(100)
  const [shapeFill, setShapeFill] = useState(false)
  const [recent, setRecent] = useState([])
  const [histLen, setHistLen] = useState(0)
  const [redoLen, setRedoLen] = useState(0)

  const filters = useModeFilters(entries)
  const { pool } = filters

  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const startPoint = useRef(null)
  const lastPoint = useRef(null)
  const snapshot = useRef(null)
  const historyRef = useRef([])
  const redoRef = useRef([])
  const prevToolRef = useRef('pencil')

  const viewSeconds = Math.max(
    1,
    Math.min(MAX_S, parseInt(viewInput, 10) || 60),
  )
  const drawSeconds = Math.max(
    1,
    Math.min(MAX_S, parseInt(drawInput, 10) || 300),
  )

  const startRound = useCallback(() => {
    const source = pool.length > 0 ? pool : entries
    if (source.length === 0) return
    const entry = source[Math.floor(Math.random() * source.length)]
    setTarget(entry)
    setDrawingUrl(null)
    setTimeLeft(Math.max(1, viewSeconds))
    setPhase('viewing')
  }, [pool, entries, viewSeconds])

  useEffect(() => {
    if (phase !== 'viewing' && phase !== 'drawing') return undefined
    if (timeLeft <= 0) return undefined
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

  const finishDrawing = useCallback(() => {
    const canvas = canvasRef.current
    setDrawingUrl(canvas ? canvas.toDataURL('image/png') : null)
    setPhase('result')
  }, [])

  useEffect(() => {
    if (phase === 'viewing' && timeLeft === 0) {
      setTimeLeft(Math.max(1, drawSeconds))
      setPhase('drawing')
    } else if (phase === 'drawing' && timeLeft === 0) {
      finishDrawing()
    }
  }, [phase, timeLeft, drawSeconds, finishDrawing])

  const pushRecent = useCallback((c) => {
    setRecent((rs) => [c, ...rs.filter((x) => x !== c)].slice(0, 7))
  }, [])

  const undo = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || historyRef.current.length === 0) return
    const ctx = canvas.getContext('2d')
    redoRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    )
    ctx.putImageData(historyRef.current.pop(), 0, 0)
    setHistLen(historyRef.current.length)
    setRedoLen(redoRef.current.length)
  }, [])

  const redo = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || redoRef.current.length === 0) return
    const ctx = canvas.getContext('2d')
    historyRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    )
    ctx.putImageData(redoRef.current.pop(), 0, 0)
    setHistLen(historyRef.current.length)
    setRedoLen(redoRef.current.length)
  }, [])

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const snap = canvas
      .getContext('2d')
      .getImageData(0, 0, canvas.width, canvas.height)
    historyRef.current.push(snap)
    if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift()
    redoRef.current = []
    setHistLen(historyRef.current.length)
    setRedoLen(0)
  }, [])

  useEffect(() => {
    if (phase !== 'drawing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.globalAlpha = 1
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    historyRef.current = []
    redoRef.current = []
    setHistLen(0)
    setRedoLen(0)
  }, [phase])

  useEffect(() => {
    if (phase !== 'drawing') return undefined
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (k === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, undo, redo])

  const selectTool = (id) => {
    if (tool !== 'eyedropper') prevToolRef.current = tool
    setTool(id)
  }

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    }
  }

  const lineWidthFor = () =>
    tool === 'pencil'
      ? Math.max(1, size)
      : tool === 'eraser'
        ? size * 3
        : size * 2

  const strokeSegment = (from, to) => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.globalAlpha = tool === 'eraser' ? 1 : opacity / 100
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.lineWidth = lineWidthFor()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  const sprayAt = (pos) => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.globalAlpha = (opacity / 100) * 0.55
    ctx.fillStyle = color
    const r = size * 2
    for (let i = 0; i < 22; i += 1) {
      const a = Math.random() * Math.PI * 2
      const rad = Math.random() * r
      ctx.fillRect(pos.x + Math.cos(a) * rad, pos.y + Math.sin(a) * rad, 1.2, 1.2)
    }
  }

  const traceShape = (ctx, from, to) => {
    ctx.beginPath()
    if (tool === 'line') {
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
    } else if (tool === 'rect') {
      ctx.rect(from.x, from.y, to.x - from.x, to.y - from.y)
    } else if (tool === 'circle') {
      ctx.ellipse(
        (from.x + to.x) / 2,
        (from.y + to.y) / 2,
        Math.abs(to.x - from.x) / 2,
        Math.abs(to.y - from.y) / 2,
        0,
        0,
        Math.PI * 2,
      )
    } else if (tool === 'triangle') {
      ctx.moveTo((from.x + to.x) / 2, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.lineTo(from.x, to.y)
      ctx.closePath()
    }
  }

  const drawShapePreview = (from, to) => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.putImageData(snapshot.current, 0, 0)
    ctx.globalAlpha = opacity / 100
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = Math.max(1, size)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    traceShape(ctx, from, to)
    if (shapeFill && tool !== 'line') ctx.fill()
    else ctx.stroke()
  }

  const pickColorAt = (pos) => {
    const canvas = canvasRef.current
    const x = Math.max(0, Math.min(canvas.width - 1, Math.round(pos.x)))
    const y = Math.max(0, Math.min(canvas.height - 1, Math.round(pos.y)))
    const d = canvas.getContext('2d').getImageData(x, y, 1, 1).data
    const hex = rgbToHex(d[0], d[1], d[2])
    setColor(hex)
    pushRecent(hex)
  }

  const onPointerDown = (e) => {
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // pointer capture unsupported
    }
    const pos = getPos(e)
    const ctx = canvasRef.current.getContext('2d')

    if (tool === 'eyedropper') {
      pickColorAt(pos)
      setTool(prevToolRef.current || 'pencil')
      return
    }

    pushHistory()

    if (tool === 'fill') {
      floodFill(ctx, pos.x, pos.y, color)
      pushRecent(color)
      return
    }

    drawingRef.current = true
    startPoint.current = pos
    lastPoint.current = pos

    if (SHAPE_TOOLS.includes(tool)) {
      snapshot.current = ctx.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      )
    } else if (tool === 'spray') {
      sprayAt(pos)
    } else {
      strokeSegment(pos, pos)
    }
  }

  const onPointerMove = (e) => {
    if (!drawingRef.current) return
    e.preventDefault()
    const pos = getPos(e)
    if (SHAPE_TOOLS.includes(tool)) {
      drawShapePreview(startPoint.current, pos)
    } else if (tool === 'spray') {
      sprayAt(pos)
    } else {
      strokeSegment(lastPoint.current, pos)
      lastPoint.current = pos
    }
  }

  const endStroke = (e) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (SHAPE_TOOLS.includes(tool)) {
      drawShapePreview(startPoint.current, getPos(e))
    }
    if (tool !== 'eraser') pushRecent(color)
  }

  const clearCanvas = () => {
    pushHistory()
    const ctx = canvasRef.current.getContext('2d')
    ctx.globalAlpha = 1
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }

  const beginDrawingPhase = () => {
    setTimeLeft(Math.max(1, drawSeconds))
    setPhase('drawing')
  }

  return (
    <div className="draw-game">
      <button className="back-btn" onClick={() => (window.location.hash = '#/')}>
        ← Back to list
      </button>

      {phase === 'setup' && (
        <div className="draw-setup">
          <h1 className="game-title">Draw a Maxmode!</h1>
          <p className="draw-subtitle">
            Study the original thumbnail before the viewing time runs out, then
            recreate it from memory.
          </p>

          <div className="draw-settings">
            <label className="draw-field">
              <span>Viewing time</span>
              <div className="draw-time-input">
                <input
                  type="number"
                  min="1"
                  max={MAX_S}
                  value={viewInput}
                  onChange={(e) => setViewInput(e.target.value)}
                />
                <span>sec</span>
              </div>
            </label>
            <label className="draw-field">
              <span>Drawing time</span>
              <div className="draw-time-input">
                <input
                  type="number"
                  min="1"
                  max={MAX_S}
                  value={drawInput}
                  onChange={(e) => setDrawInput(e.target.value)}
                />
                <span>sec</span>
              </div>
            </label>
          </div>
          <div className="draw-presets">
            <button
              className="settings-clear"
              onClick={() => {
                setViewInput('120')
                setDrawInput('300')
              }}
            >
              Chill · 120s / 5min
            </button>
            <button
              className="settings-clear"
              onClick={() => {
                setViewInput('60')
                setDrawInput('300')
              }}
            >
              Normal · 60s / 5min
            </button>
            <button
              className="settings-clear"
              onClick={() => {
                setViewInput('10')
                setDrawInput('120')
              }}
            >
              Hardcore · 10s / 2min
            </button>
          </div>

          <FilterPanel filters={filters} />

          <button className="load-btn" onClick={startRound}>
            Start round
          </button>
        </div>
      )}

      {phase === 'viewing' && target && (
        <div className="draw-viewing">
          <p className="draw-phase-label">Memorize it!</p>
          <p className={`draw-timer${timeLeft <= 10 ? ' low' : ''}`}>
            {fmtTime(timeLeft)}
          </p>
          <img
            className="draw-original"
            src={thumbUrl(target.videoID)}
            alt={`Original thumbnail for ${target.name}`}
            draggable="false"
          />
          <p className="card-sub draw-caption">
            {target.name} · {target.game}
          </p>
          <button className="load-btn" onClick={beginDrawingPhase}>
            I'm ready — start drawing
          </button>
        </div>
      )}

      {phase === 'drawing' && target && (
        <div className="draw-workspace">
          <div className="draw-statusbar">
            <p className={`draw-timer${timeLeft <= 30 ? ' low' : ''}`}>
              {fmtTime(timeLeft)} left
            </p>
            <button className="load-btn" onClick={finishDrawing}>
              Finish
            </button>
          </div>

          <div className="draw-layout">
            <aside className="draw-sidebar">
              <section className="tool-section">
                <h3>Tools</h3>
                <div className="tool-grid">
                  {TOOLS.map((t) => (
                    <button
                      key={t.id}
                      title={t.label}
                      className={`tool-tile${tool === t.id ? ' active' : ''}`}
                      onClick={() => selectTool(t.id)}
                    >
                      <ToolIcon id={t.id} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="tool-section">
                <h3>Stroke</h3>
                <label className="slider-row">
                  <span>Size</span>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                  />
                  <em>{size}px</em>
                </label>
                <label className="slider-row">
                  <span>Fade</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                  />
                  <em>{opacity}%</em>
                </label>
                {SHAPE_TOOLS.includes(tool) && (
                  <button
                    className={`toggle-chip${shapeFill ? ' on' : ''}`}
                    onClick={() => setShapeFill((f) => !f)}
                  >
                    Filled shape: {shapeFill ? 'On' : 'Off'}
                  </button>
                )}
              </section>

              <section className="tool-section">
                <h3>Color</h3>
                <ColorPicker color={color} onChange={setColor} />
                <div className="swatch-grid">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      className={`swatch${color === c ? ' active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setColor(c)}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
                {recent.length > 0 && (
                  <>
                    <p className="mini-label">Recent</p>
                    <div className="swatch-grid">
                      {recent.map((c) => (
                        <button
                          key={c}
                          className={`swatch${color === c ? ' active' : ''}`}
                          style={{ background: c }}
                          onClick={() => setColor(c)}
                          aria-label={`Color ${c}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>

              <section className="tool-section actions-row">
                <button
                  className="tool-action"
                  onClick={undo}
                  disabled={histLen === 0}
                >
                  Undo
                </button>
                <button
                  className="tool-action"
                  onClick={redo}
                  disabled={redoLen === 0}
                >
                  Redo
                </button>
                <button className="tool-action danger" onClick={clearCanvas}>
                  Clear
                </button>
              </section>
            </aside>

            <div className="draw-canvas-col">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="draw-canvas"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endStroke}
                onPointerLeave={endStroke}
                onPointerCancel={endStroke}
              />
              <p className="card-sub draw-hint">
                Recreate "{target.name}" from memory · Ctrl+Z undo · Ctrl+Y redo
              </p>
            </div>
          </div>
        </div>
      )}

      {phase === 'result' && target && (
        <div className="draw-result">
          <h1 className="game-title">Time's up!</h1>
          <div className="draw-compare">
            <figure className="compare-item">
              <img
                src={thumbUrl(target.videoID)}
                alt="Original thumbnail"
                draggable="false"
              />
              <figcaption>The original</figcaption>
            </figure>
            <figure className="compare-item">
              <img src={drawingUrl ?? ''} alt="Your drawing" />
              <figcaption>Your drawing</figcaption>
            </figure>
          </div>
          <p className="card-sub draw-caption">
            {target.name} · {target.game}
          </p>
          <div className="draw-result-actions">
            <button className="load-btn" onClick={startRound}>
              Play again
            </button>
            <button className="settings-clear" onClick={() => setPhase('setup')}>
              Change settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
