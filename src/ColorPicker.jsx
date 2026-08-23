import { useEffect, useRef, useState } from 'react'
import { hexToHsv, hsvToHex } from './colorUtils.js'

export default function ColorPicker({ color, onChange }) {
  const [hsv, setHsv] = useState(() => hexToHsv(color))
  const [hexText, setHexText] = useState(color)
  const svRef = useRef(null)
  const dragging = useRef(false)

  useEffect(() => {
    setHsv((cur) => {
      const next = hexToHsv(color)
      if (
        Math.round(cur.h) === Math.round(next.h) &&
        Math.abs(cur.s - next.s) < 0.002 &&
        Math.abs(cur.v - next.v) < 0.002
      ) {
        return cur
      }
      return next
    })
    setHexText(color)
  }, [color])

  const apply = (next) => {
    setHsv(next)
    onChange(hsvToHex(next.h, next.s, next.v))
  }

  const applyFromEvent = (e) => {
    const el = svRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const s = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const v = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height))
    apply({ ...hsv, s, v })
  }

  return (
    <div className="color-picker">
      <div
        ref={svRef}
        className="sv-area"
        style={{
          background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)), hsl(${Math.round(
            hsv.h,
          )}, 100%, 50%)`,
        }}
        onPointerDown={(e) => {
          e.preventDefault()
          dragging.current = true
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            // pointer capture unsupported
          }
          applyFromEvent(e)
        }}
        onPointerMove={(e) => {
          if (dragging.current) applyFromEvent(e)
        }}
        onPointerUp={() => {
          dragging.current = false
        }}
        onPointerCancel={() => {
          dragging.current = false
        }}
        role="slider"
        aria-label="Saturation and brightness"
      >
        <div
          className="sv-cursor"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            background: color,
          }}
        />
      </div>

      <input
        type="range"
        className="hue-slider"
        min="0"
        max="360"
        value={Math.round(hsv.h)}
        onChange={(e) => apply({ ...hsv, h: Number(e.target.value) })}
        aria-label="Hue"
      />

      <div className="picker-row">
        <span className="current-swatch" style={{ background: color }} />
        <input
          type="text"
          className="hex-input"
          value={hexText}
          onChange={(e) => {
            const t = e.target.value
            setHexText(t)
            if (/^#[0-9a-fA-F]{6}$/.test(t)) onChange(t.toLowerCase())
          }}
          onBlur={() => setHexText(color)}
          maxLength="7"
          spellCheck="false"
          autoComplete="off"
          aria-label="Hex color"
        />
      </div>
    </div>
  )
}
