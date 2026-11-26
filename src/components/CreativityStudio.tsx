import { useEffect, useRef, useState } from 'react'
import { X, Pencil, Eraser, PaintBucket, Undo2, Redo2, Download, Share2, Sparkles } from 'lucide-react'

const COLOURS = ['#1b1b1f', '#e64e24', '#f5a623', '#2fa84f', '#1c9bd8', '#5b4bdb', '#d6379b', '#ffffff']

type BgTheme = 'fest' | 'sunset' | 'garden' | 'night' | 'cream'
const BG_THEMES: { id: BgTheme; label: string; css: string }[] = [
  { id: 'fest', label: 'Fest Scene', css: '#1e52cf' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(135deg,#f97316,#fbbf24)' },
  { id: 'garden', label: 'Garden', css: 'linear-gradient(180deg,#e6efd7,#cce0b8)' },
  { id: 'night', label: 'Night Stars', css: 'linear-gradient(135deg,#1e1b4b,#4338ca)' },
  { id: 'cream', label: 'Cream Paper', css: 'linear-gradient(135deg,#fdf6e3,#fde68a)' },
]

type PosterStyle = 'cream' | 'navy' | 'sunset' | 'gallery'
const POSTER_STYLES: { id: PosterStyle; label: string; cardBg: string; text: string; accent: string }[] = [
  { id: 'cream', label: 'Classic Cream', cardBg: '#fdf6e3', text: '#1b1b1f', accent: '#e64e24' },
  { id: 'navy', label: 'Royal Blue', cardBg: '#173a8a', text: '#ffffff', accent: '#a3e635' },
  { id: 'sunset', label: 'Sunset Gold', cardBg: '#fff3e0', text: '#7c2d12', accent: '#ea580c' },
  { id: 'gallery', label: 'Minimal White', cardBg: '#ffffff', text: '#0f172a', accent: '#2563eb' },
]

const BADGE_LABELS = [
  'Marked as my own',
  'Official Fest Creator',
  'Made at Creativity Corner',
  'Dream & Create',
]

/** Draw a 4-point diamond sparkle on a Canvas 2D context. */
function drawCanvasSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.quadraticCurveTo(cx + r * 0.14, cy - r * 0.14, cx + r, cy)
  ctx.quadraticCurveTo(cx + r * 0.14, cy + r * 0.14, cx, cy + r)
  ctx.quadraticCurveTo(cx - r * 0.14, cy + r * 0.14, cx - r, cy)
  ctx.quadraticCurveTo(cx - r * 0.14, cy - r * 0.14, cx, cy - r)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** Draw a fluffy cartoon cloud on Canvas 2D. */
function drawCanvasCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string, alpha = 0.92) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  const h = w * 0.36
  ctx.beginPath()
  ctx.arc(x + w * 0.24, y + h * 0.62, h * 0.32, 0, Math.PI * 2)
  ctx.arc(x + w * 0.45, y + h * 0.44, h * 0.42, 0, Math.PI * 2)
  ctx.arc(x + w * 0.68, y + h * 0.5, h * 0.36, 0, Math.PI * 2)
  ctx.arc(x + w * 0.82, y + h * 0.66, h * 0.24, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Render the exact animated Fest Scene (or selected theme) into a 2D canvas for export. */
function renderBackgroundToCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: BgTheme,
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()

  if (theme !== 'fest') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h)
    if (theme === 'sunset') {
      grad.addColorStop(0, '#f97316')
      grad.addColorStop(1, '#fbbf24')
    } else if (theme === 'garden') {
      grad.addColorStop(0, '#e6efd7')
      grad.addColorStop(1, '#cce0b8')
    } else if (theme === 'night') {
      grad.addColorStop(0, '#1e1b4b')
      grad.addColorStop(1, '#4338ca')
    } else {
      grad.addColorStop(0, '#fdf6e3')
      grad.addColorStop(1, '#fde68a')
    }
    ctx.fillStyle = grad
    ctx.fillRect(x, y, w, h)
    if (theme === 'night') {
      drawCanvasSparkle(ctx, x + w * 0.2, y + h * 0.25, w * 0.018, '#fde047')
      drawCanvasSparkle(ctx, x + w * 0.78, y + h * 0.2, w * 0.02, '#ffffff')
      drawCanvasSparkle(ctx, x + w * 0.55, y + h * 0.6, w * 0.014, '#c4b5fd')
    }
    ctx.restore()
    return
  }

  // Fest Scene background (#1e52cf sky)
  ctx.fillStyle = '#1e52cf'
  ctx.fillRect(x, y, w, h)

  // Clouds
  drawCanvasCloud(ctx, x + w * 0.31, y + h * 0.14, w * 0.12, '#d9927a')
  drawCanvasCloud(ctx, x + w * 0.82, y + h * 0.31, w * 0.14, '#d9927a')
  drawCanvasCloud(ctx, x + w * 0.0, y + h * 0.5, w * 0.08, '#707dae', 0.75)

  // Sparkles
  drawCanvasSparkle(ctx, x + w * 0.475, y + h * 0.2, w * 0.012, '#ffffff')
  drawCanvasSparkle(ctx, x + w * 0.07, y + h * 0.58, w * 0.008, '#ffffff')
  drawCanvasSparkle(ctx, x + w * 0.685, y + h * 0.77, w * 0.009, '#fbbf24')

  // Puppet strings
  ctx.strokeStyle = 'rgba(255,255,255,0.78)'
  ctx.lineWidth = Math.max(1, w * 0.0014)
  const strings: [number, number, number, number][] = [
    [0.14, 0.16, 0.45, 0.56],
    [0.15, 0.19, 0.58, 0.63],
    [0.17, 0.15, 0.87, 0.70],
    [0.19, 0.18, 0.84, 0.69],
    [0.12, 0.24, 0.47, 0.72],
  ]
  for (const [x1, y1, x2, y2] of strings) {
    ctx.beginPath()
    ctx.moveTo(x + w * x1, y + h * y1)
    ctx.lineTo(x + w * x2, y + h * y2)
    ctx.stroke()
  }

  // Giant orange puppeteer hand top-left
  ctx.save()
  ctx.translate(x, y)
  const hs = Math.min(w, h) / 420
  ctx.scale(hs, hs)
  const drawHand = (color: string, ox: number, oy: number, alpha = 1) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.translate(ox, oy)
    ctx.beginPath()
    ctx.moveTo(-10, -10)
    ctx.lineTo(100, -10)
    ctx.bezierCurveTo(125, 30, 128, 68, 105, 95)
    ctx.bezierCurveTo(80, 125, 32, 118, 5, 78)
    ctx.closePath()
    ctx.fill()
    const fingers: [number, number, number, number, number][] = [
      [12, 85, 26, 86, 24],
      [48, 98, 26, 102, 6],
      [84, 88, 26, 106, -24],
      [110, 60, 26, 102, -48],
      [118, 32, 24, 86, -68],
    ]
    for (const [fx, fy, fw, fh, rot] of fingers) {
      ctx.save()
      ctx.translate(fx + fw / 2, fy + 10)
      ctx.rotate((rot * Math.PI) / 180)
      ctx.beginPath()
      ctx.roundRect(-fw / 2, -10, fw, fh, fw / 2)
      ctx.fill()
      ctx.restore()
    }
    ctx.restore()
  }
  drawHand('#783556', 8, 10, 0.55)
  drawHand('#e65324', 0, 0, 1)
  ctx.fillStyle = 'rgba(244,132,76,0.65)'
  ctx.beginPath()
  ctx.ellipse(60, 46, 26, 16, 0.45, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Top-right MAKE YOUR MAGIC
  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = `italic bold ${Math.round(h * 0.082)}px "Caveat", cursive`
  ctx.shadowColor = 'rgba(0,0,0,0.22)'
  ctx.shadowBlur = 8
  ctx.fillStyle = '#ffffff'
  ctx.fillText('MAKE', x + w * 0.9, y + h * 0.11)
  ctx.fillStyle = '#a3e635'
  ctx.fillText('YOUR', x + w * 0.91, y + h * 0.19)
  ctx.fillStyle = '#ffffff'
  ctx.fillText('MAGIC', x + w * 0.9, y + h * 0.27)
  ctx.restore()

  // Dark brown hill along bottom
  ctx.fillStyle = '#472c15'
  ctx.beginPath()
  ctx.moveTo(x, y + h * 0.9)
  ctx.bezierCurveTo(x + w * 0.25, y + h * 0.86, x + w * 0.55, y + h * 0.93, x + w * 0.78, y + h * 0.89)
  ctx.bezierCurveTo(x + w * 0.9, y + h * 0.87, x + w * 0.96, y + h * 0.89, x + w, y + h * 0.91)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.closePath()
  ctx.fill()

  // Footballer (bottom center)
  ctx.save()
  ctx.translate(x + w * 0.51, y + h * 0.73)
  const fs = Math.min(w, h) / 480
  ctx.scale(fs, fs)
  // arms
  ctx.strokeStyle = '#966133'
  ctx.lineWidth = 14
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(-12, -25); ctx.lineTo(-56, -72); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(48, -54); ctx.stroke()
  // standing leg
  ctx.beginPath(); ctx.moveTo(-10, 48); ctx.lineTo(-34, 112); ctx.stroke()
  // kicking leg + white sock + boot
  ctx.beginPath(); ctx.moveTo(12, 34); ctx.lineTo(44, -8); ctx.stroke()
  ctx.strokeStyle = '#ffffff'
  ctx.beginPath(); ctx.moveTo(42, -5); ctx.lineTo(78, -52); ctx.stroke()
  ctx.fillStyle = '#1e1b18'
  ctx.beginPath(); ctx.ellipse(84, -56, 13, 7, -0.7, 0, Math.PI * 2); ctx.fill()
  // shorts
  ctx.fillStyle = '#1b3a7a'
  ctx.beginPath(); ctx.moveTo(-24, 22); ctx.lineTo(20, 20); ctx.lineTo(36, 48); ctx.lineTo(4, 62); ctx.lineTo(-28, 54); ctx.closePath(); ctx.fill()
  // yellow jersey
  ctx.fillStyle = '#f7c82b'
  ctx.beginPath(); ctx.roundRect(-20, -32, 40, 56, 10); ctx.fill()
  // head + hair
  ctx.fillStyle = '#966133'
  ctx.beginPath(); ctx.arc(0, -52, 18, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#1e1b18'
  ctx.beginPath(); ctx.arc(0, -55, 18, Math.PI, 0); ctx.fill()
  // ball
  ctx.translate(96, -86)
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#1e293b'
  ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Singer (bottom right)
  ctx.save()
  ctx.translate(x + w * 0.92, y + h * 0.78)
  const ss = Math.min(w, h) / 520
  ctx.scale(ss, ss)
  ctx.strokeStyle = '#7c4a26'
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(-12, -16); ctx.lineTo(-34, -52); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(12, -12); ctx.lineTo(28, -28); ctx.stroke()
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(-16, 28, 32, 42)
  ctx.fillStyle = '#db2777'
  ctx.beginPath(); ctx.roundRect(-16, -24, 32, 56, 8); ctx.fill()
  ctx.fillStyle = '#7c4a26'
  ctx.beginPath(); ctx.arc(0, -44, 16, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#1e1b18'
  ctx.beginPath(); ctx.arc(0, -46, 16, Math.PI, 0); ctx.fill()
  ctx.fillStyle = '#475569'
  ctx.beginPath(); ctx.arc(16, -42, 7, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  ctx.restore()
}

/** Fast scanline flood fill on transparent/drawn canvas pixels. */
function floodFillCanvas(canvas: HTMLCanvasElement, startX: number, startY: number, hexColor: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  if (w <= 0 || h <= 0) return
  const sx = Math.floor(startX)
  const sy = Math.floor(startY)
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return

  const img = ctx.getImageData(0, 0, w, h)
  const data = img.data

  const rNew = parseInt(hexColor.slice(1, 3), 16)
  const gNew = parseInt(hexColor.slice(3, 5), 16)
  const bNew = parseInt(hexColor.slice(5, 7), 16)

  const startIdx = (sy * w + sx) * 4
  const r0 = data[startIdx]
  const g0 = data[startIdx + 1]
  const b0 = data[startIdx + 2]
  const a0 = data[startIdx + 3]

  if (r0 === rNew && g0 === gNew && b0 === bNew && a0 === 255) return

  const matches = (idx: number) =>
    Math.abs(data[idx] - r0) < 28 &&
    Math.abs(data[idx + 1] - g0) < 28 &&
    Math.abs(data[idx + 2] - b0) < 28 &&
    Math.abs(data[idx + 3] - a0) < 28

  const visited = new Uint8Array(w * h)
  const stack: number[] = [sx, sy]

  while (stack.length > 0) {
    const y = stack.pop()!
    let x = stack.pop()!
    while (x >= 0 && !visited[y * w + x] && matches((y * w + x) * 4)) x--
    x++
    let spanAbove = false
    let spanBelow = false
    while (x < w && !visited[y * w + x] && matches((y * w + x) * 4)) {
      const p = y * w + x
      visited[p] = 1
      const idx = p * 4
      data[idx] = rNew
      data[idx + 1] = gNew
      data[idx + 2] = bNew
      data[idx + 3] = 255

      if (y > 0) {
        const up = (y - 1) * w + x
        const upMatch = !visited[up] && matches(up * 4)
        if (!spanAbove && upMatch) {
          stack.push(x, y - 1)
          spanAbove = true
        } else if (spanAbove && !upMatch) {
          spanAbove = false
        }
      }
      if (y < h - 1) {
        const dn = (y + 1) * w + x
        const dnMatch = !visited[dn] && matches(dn * 4)
        if (!spanBelow && dnMatch) {
          stack.push(x, y + 1)
          spanBelow = true
        } else if (spanBelow && !dnMatch) {
          spanBelow = false
        }
      }
      x++
    }
  }
  ctx.putImageData(img, 0, 0)
}

function buildPosterCanvas(
  drawingDataUrl: string,
  name: string,
  caption: string,
  badgeText: string,
  bgTheme: BgTheme,
  posterStyle: PosterStyle,
  format: 'poster' | 'story' | 'square',
): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const dims =
      format === 'story' ? { w: 1080, h: 1920 } : format === 'square' ? { w: 1080, h: 1080 } : { w: 1400, h: 1000 }
    const { w, h } = dims
    const out = document.createElement('canvas')
    out.width = w
    out.height = h
    const ctx = out.getContext('2d')!
    const style = POSTER_STYLES.find((s) => s.id === posterStyle) || POSTER_STYLES[0]

    // Poster card background
    ctx.fillStyle = style.cardBg
    ctx.fillRect(0, 0, w, h)

    // Subtle border frame
    const pad = Math.round(w * 0.05)
    ctx.strokeStyle = style.accent
    ctx.lineWidth = Math.max(4, Math.round(w * 0.005))
    ctx.strokeRect(pad * 0.45, pad * 0.45, w - pad * 0.9, h - pad * 0.9)

    // Artwork area
    const artX = pad
    const artY = pad
    const artW = w - pad * 2
    const artH = format === 'story' ? Math.round(h * 0.56) : format === 'square' ? Math.round(h * 0.58) : Math.round(h * 0.64)

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(artX, artY, artW, artH, 24)
    ctx.clip()
    renderBackgroundToCanvas(ctx, artX, artY, artW, artH, bgTheme)

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, artX, artY, artW, artH)
      ctx.restore()

      // Gold seal top-right of artwork
      ctx.save()
      const sealX = artX + artW - 76
      const sealY = artY + 64
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(sealX, sealY, 44, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      ctx.stroke()
      ctx.fillStyle = '#78350f'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('★ GOLD', sealX, sealY - 2)
      ctx.fillText('SEAL', sealX, sealY + 15)
      ctx.restore()

      // Poster footer text
      const textTop = artY + artH + Math.round(h * 0.075)
      ctx.textAlign = 'center'
      ctx.fillStyle = style.accent
      ctx.font = `italic bold ${Math.round(w * 0.022)}px sans-serif`
      ctx.fillText(badgeText.toUpperCase(), w / 2, textTop)

      ctx.fillStyle = style.text
      ctx.font = `italic bold ${Math.round(w * 0.068)}px "Caveat", cursive`
      ctx.fillText('MAKE YOUR MAGIC', w / 2, textTop + Math.round(h * 0.078))

      if (name.trim()) {
        ctx.fillStyle = style.accent
        ctx.font = `bold ${Math.round(w * 0.044)}px "Caveat", cursive`
        ctx.fillText(`— ${name.trim()} —`, w / 2, textTop + Math.round(h * 0.14))
      }

      if (caption.trim()) {
        ctx.fillStyle = style.text
        ctx.globalAlpha = 0.78
        ctx.font = `${Math.round(w * 0.02)}px sans-serif`
        ctx.fillText(caption.trim().slice(0, 70), w / 2, textTop + Math.round(h * 0.19))
        ctx.globalAlpha = 1
      }

      resolve(out)
    }
    img.onerror = () => {
      ctx.restore()
      resolve(out)
    }
    img.src = drawingDataUrl
  })
}

/** Animated Fest Scene layer rendered behind the transparent drawing canvas. */
function AnimatedStudioScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#1e52cf] select-none" aria-hidden>
      {/* Clouds */}
      <svg viewBox="0 0 180 70" className="anim-cloud absolute left-[31%] top-[14%] w-28 opacity-90 sm:w-36">
        <path d="M28 58 H152 C166 58 175 49 175 38 C175 27 165 19 152 20 C148 9 135 3 120 6 C110 -1 92 -1 81 8 C69 4 54 9 48 20 C34 19 22 27 20 38 C12 40 8 46 10 52 C12 56 19 58 28 58 Z" fill="#d9927a" />
      </svg>
      <svg viewBox="0 0 180 70" className="anim-cloud absolute right-[3%] top-[32%] w-32 opacity-90 sm:w-44" style={{ animationDelay: '1.2s' }}>
        <path d="M28 58 H152 C166 58 175 49 175 38 C175 27 165 19 152 20 C148 9 135 3 120 6 C110 -1 92 -1 81 8 C69 4 54 9 48 20 C34 19 22 27 20 38 C12 40 8 46 10 52 C12 56 19 58 28 58 Z" fill="#d9927a" />
      </svg>
      <svg viewBox="0 0 180 70" className="anim-cloud absolute left-0 top-[51%] w-20 opacity-75 sm:w-24" style={{ animationDelay: '2s' }}>
        <path d="M28 58 H152 C166 58 175 49 175 38 C175 27 165 19 152 20 C148 9 135 3 120 6 C110 -1 92 -1 81 8 C69 4 54 9 48 20 C34 19 22 27 20 38 C12 40 8 46 10 52 C12 56 19 58 28 58 Z" fill="#707dae" />
      </svg>

      {/* Sparkles */}
      <span className="anim-sparkle absolute left-[47%] top-[19%] text-xl text-white">✦</span>
      <span className="anim-sparkle absolute left-[6.5%] top-[57%] text-sm text-white" style={{ animationDelay: '0.7s' }}>✦</span>
      <span className="anim-sparkle absolute left-[68%] top-[76%] text-base text-[#fbbf24]" style={{ animationDelay: '1.2s' }}>✦</span>

      {/* Giant orange puppeteer hand top-left */}
      <div className="anim-hand-in absolute -left-6 -top-5 w-52 sm:w-64 md:w-72">
        <svg viewBox="0 0 320 280" className="w-full overflow-visible">
          <g transform="translate(10, 12)" fill="#783556" opacity="0.55">
            <path d="M -20 -20 L 95 -20 C 125 25 135 65 110 100 C 85 130 35 120 5 80 Z" />
            <rect x="6" y="88" width="28" height="96" rx="14" transform="rotate(24 20 96)" />
            <rect x="46" y="102" width="28" height="114" rx="14" transform="rotate(6 60 110)" />
            <rect x="86" y="92" width="28" height="118" rx="14" transform="rotate(-24 100 100)" />
            <rect x="114" y="64" width="28" height="112" rx="14" transform="rotate(-48 128 74)" />
            <rect x="122" y="34" width="26" height="92" rx="13" transform="rotate(-68 135 44)" />
          </g>
          <g fill="#e65324">
            <path d="M -20 -20 L 95 -20 C 125 25 135 65 110 100 C 85 130 35 120 5 80 Z" />
            <rect x="6" y="88" width="28" height="96" rx="14" transform="rotate(24 20 96)" />
            <rect x="46" y="102" width="28" height="114" rx="14" transform="rotate(6 60 110)" />
            <rect x="86" y="92" width="28" height="118" rx="14" transform="rotate(-24 100 100)" />
            <rect x="114" y="64" width="28" height="112" rx="14" transform="rotate(-48 128 74)" />
            <rect x="122" y="34" width="26" height="92" rx="13" transform="rotate(-68 135 44)" />
          </g>
          <ellipse cx="64" cy="48" rx="28" ry="18" transform="rotate(28 64 48)" fill="#f4844c" opacity="0.65" />
        </svg>
      </div>

      {/* Puppet strings across sky */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="12" y1="24" x2="46" y2="73" stroke="rgba(255,255,255,0.72)" strokeWidth="0.14" className="string-line" pathLength={100} />
        <line x1="14" y1="18" x2="45" y2="56" stroke="rgba(255,255,255,0.72)" strokeWidth="0.14" className="string-line" pathLength={100} />
        <line x1="15" y1="16" x2="59" y2="63" stroke="rgba(255,255,255,0.72)" strokeWidth="0.14" className="string-line" pathLength={100} />
        <line x1="16" y1="15" x2="87" y2="70" stroke="rgba(255,255,255,0.68)" strokeWidth="0.13" className="string-line" pathLength={100} />
        <line x1="18" y1="14" x2="84" y2="69" stroke="rgba(255,255,255,0.68)" strokeWidth="0.13" className="string-line" pathLength={100} />
      </svg>

      {/* Top-right stacked MAKE / YOUR / MAGIC */}
      <div className="absolute right-4 top-3 text-center sm:right-8 sm:top-4">
        <p className="font-hand font-bold italic leading-[0.82] tracking-tight drop-shadow-md">
          <span className="block -rotate-2 text-4xl text-white sm:text-5xl">MAKE</span>
          <span className="block -rotate-1 text-3xl text-[#a3e635] sm:text-4xl">YOUR</span>
          <span className="block -rotate-2 text-4xl text-white sm:text-5xl">MAGIC</span>
        </p>
      </div>

      {/* Animated footballer + kicking soccer ball */}
      <div className="absolute bottom-[5%] left-1/2 w-44 -translate-x-1/2 sm:w-52">
        <svg viewBox="0 0 240 220" className="anim-sway w-full overflow-visible drop-shadow-md">
          <line x1="92" y1="68" x2="48" y2="20" stroke="#966133" strokeWidth="14" strokeLinecap="round" />
          <line x1="115" y1="74" x2="152" y2="38" stroke="#966133" strokeWidth="13" strokeLinecap="round" />
          {/* standing leg with white sock */}
          <line x1="96" y1="152" x2="72" y2="215" stroke="#966133" strokeWidth="15" strokeLinecap="round" />
          <line x1="82" y1="188" x2="72" y2="215" stroke="#ffffff" strokeWidth="15" strokeLinecap="round" />
          {/* kicking leg */}
          <g className="anim-kick-leg" style={{ transformOrigin: '115px 136px' }}>
            <line x1="114" y1="138" x2="146" y2="96" stroke="#966133" strokeWidth="15" strokeLinecap="round" />
            <line x1="142" y1="101" x2="178" y2="54" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
            <path d="M 172 58 L 188 42 C 194 37 199 44 193 52 L 180 65 Z" fill="#1e1b18" />
          </g>
          <path d="M 80 120 L 122 118 L 138 148 L 106 164 L 74 156 Z" fill="#1b3a7a" />
          <path d="M 84 62 C 92 56 114 58 122 68 L 132 82 L 118 92 L 120 122 L 82 122 L 84 90 L 72 80 Z" fill="#f7c82b" />
          <circle cx="102" cy="40" r="19" fill="#966133" />
          <path d="M 83 36 C 85 18 119 18 121 36 C 110 33 94 33 83 36 Z" fill="#1e1b18" />

          {/* Floating pentagonal soccer ball + little speed lines */}
          <g className="anim-ball-hover" transform="translate(206, 12)">
            <line x1="-22" y1="14" x2="-15" y2="22" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-26" y1="20" x2="-20" y2="27" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="0" cy="0" r="17" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
            <polygon points="0,-7 7,-2 4,6 -4,6 -7,-2" fill="#1e293b" />
            <line x1="0" y1="-7" x2="0" y2="-16" stroke="#1e293b" strokeWidth="1.6" />
            <line x1="7" y1="-2" x2="15" y2="-7" stroke="#1e293b" strokeWidth="1.6" />
            <line x1="4" y1="6" x2="11" y2="14" stroke="#1e293b" strokeWidth="1.6" />
            <line x1="-4" y1="6" x2="-11" y2="14" stroke="#1e293b" strokeWidth="1.6" />
            <line x1="-7" y1="-2" x2="-15" y2="-7" stroke="#1e293b" strokeWidth="1.6" />
          </g>
        </svg>
      </div>

      {/* Animated singer (bottom-right) */}
      <div className="absolute bottom-[10%] right-[3%] w-20 sm:right-[5%] sm:w-24">
        <span className="anim-note absolute -left-5 bottom-8 text-lg font-bold text-[#d9f99d]">♪</span>
        <span className="anim-note absolute -right-2 top-6 text-xl font-bold text-[#d9f99d]" style={{ animationDelay: '.8s' }}>♫</span>
        <svg viewBox="0 0 130 175" className="anim-sway w-full overflow-visible drop-shadow-md">
          <line x1="48" y1="68" x2="22" y2="26" stroke="#7c4a26" strokeWidth="10" strokeLinecap="round" />
          <line x1="76" y1="74" x2="96" y2="56" stroke="#7c4a26" strokeWidth="10" strokeLinecap="round" />
          <path d="M 46 124 L 82 124 L 88 168 L 42 168 Z" fill="#1e293b" />
          <path d="M 46 62 L 78 62 L 90 80 L 80 88 L 82 128 L 46 128 L 46 88 L 36 80 Z" fill="#db2777" />
          <circle cx="62" cy="42" r="18" fill="#7c4a26" />
          <path d="M 44 40 C 46 21 78 21 80 40 C 68 37 54 37 44 40 Z" fill="#1e1b18" />
          <line x1="94" y1="54" x2="84" y2="44" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="80" cy="40" r="8" fill="#475569" stroke="#1e293b" strokeWidth="2" />
        </svg>
      </div>

      {/* Dark brown rolling ground hill */}
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0 h-[13%] w-full">
        <path
          d="M0,45 C240,10 520,75 840,42 C1100,15 1280,24 1440,45 L1440,120 L0,120 Z"
          fill="#472c15"
        />
      </svg>
    </div>
  )
}

export default function CreativityStudio({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [colour, setColour] = useState('#e64e24')
  const [size, setSize] = useState(6)
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'fill'>('pencil')
  const [bgTheme, setBgTheme] = useState<BgTheme>('fest')
  const [history, setHistory] = useState<string[]>([])
  const [redo, setRedo] = useState<string[]>([])
  const [showPoster, setShowPoster] = useState(false)
  const [drawingUrl, setDrawingUrl] = useState('')
  const [compositePreviewUrl, setCompositePreviewUrl] = useState('')
  const [name, setName] = useState('')
  const [caption, setCaption] = useState('')
  const [badgeIdx, setBadgeIdx] = useState(0)
  const [posterStyle, setPosterStyle] = useState<PosterStyle>('cream')
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const fit = () => {
      const parent = canvas.parentElement
      if (!parent || parent.clientWidth <= 0 || parent.clientHeight <= 0) return
      const prev = canvas.width > 0 && canvas.height > 0 ? canvas.toDataURL() : ''
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      if (prev) {
        const img = new Image()
        img.onload = () => canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        img.src = prev
      }
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // Build live composite artwork preview whenever poster modal opens or style/name changes
  useEffect(() => {
    if (!showPoster || !drawingUrl) return
    let active = true
    buildPosterCanvas(
      drawingUrl,
      name,
      caption,
      BADGE_LABELS[badgeIdx],
      bgTheme,
      posterStyle,
      'poster',
    ).then((c) => {
      if (active) setCompositePreviewUrl(c.toDataURL('image/png'))
    })
    return () => {
      active = false
    }
  }, [showPoster, drawingUrl, name, caption, badgeIdx, bgTheme, posterStyle])

  const snapshot = () => {
    const c = canvasRef.current
    if (!c || c.width <= 0 || c.height <= 0) return
    setHistory((h) => [...h.slice(-19), c.toDataURL()])
    setRedo([])
  }

  const restore = (url: string) => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = url
  }

  const undo = () => {
    const c = canvasRef.current
    if (!history.length || !c || c.width <= 0 || c.height <= 0) return
    const prev = history[history.length - 1]
    const current = c.toDataURL()
    setHistory((h) => h.slice(0, -1))
    setRedo((r) => [current, ...r])
    restore(prev)
  }

  const redoFn = () => {
    const c = canvasRef.current
    if (!redo.length || !c || c.width <= 0 || c.height <= 0) return
    const next = redo[0]
    const current = c.toDataURL()
    setRedo((r) => r.slice(1))
    setHistory((h) => [...h.slice(-19), current])
    restore(next)
  }

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onDown = (e: React.PointerEvent) => {
    const c = canvasRef.current
    if (!c || c.width <= 0 || c.height <= 0) return
    const p = pos(e)
    if (tool === 'fill') {
      snapshot()
      floodFillCanvas(c, p.x, p.y, colour)
      return
    }
    drawing.current = true
    last.current = p
    snapshot()
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // pointer capture may be unsupported on synthetic pointer events
    }
    // Draw dot on tap
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = colour
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.beginPath()
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  const onMove = (e: React.PointerEvent) => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!drawing.current || !last.current || !ctx) return
    const p = pos(e)
    ctx.strokeStyle = colour
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.lineWidth = size * 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
    last.current = p
  }

  const onUp = () => {
    drawing.current = false
    last.current = null
  }

  const downloadFormat = async (format: 'poster' | 'story' | 'square') => {
    const out = await buildPosterCanvas(
      drawingUrl,
      name,
      caption,
      BADGE_LABELS[badgeIdx],
      bgTheme,
      posterStyle,
      format,
    )
    const a = document.createElement('a')
    a.download = `make-your-magic-${format}.png`
    a.href = out.toDataURL('image/png')
    a.click()
  }

  const share = async () => {
    const out = await buildPosterCanvas(
      drawingUrl,
      name,
      caption,
      BADGE_LABELS[badgeIdx],
      bgTheme,
      posterStyle,
      'poster',
    )
    out.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'make-your-magic-poster.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'MAKE YOUR MAGIC' }).catch(() => undefined)
      } else {
        await downloadFormat('poster')
      }
    })
  }

  const openPoster = () => {
    const c = canvasRef.current
    if (!c || c.width <= 0 || c.height <= 0) return
    setDrawingUrl(c.toDataURL('image/png'))
    setShowPoster(true)
  }

  if (showPoster) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm">
        <div className="anim-pop flex w-full max-w-4xl flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
          {/* Live Poster Preview */}
          <div className="w-full max-w-md rotate-1 rounded-2xl bg-white/10 p-2 shadow-2xl ring-1 ring-white/20">
            {compositePreviewUrl ? (
              <img
                src={compositePreviewUrl}
                alt="Your MAKE YOUR MAGIC poster preview"
                className="w-full rounded-xl shadow-lg"
              />
            ) : (
              <div className="flex h-72 items-center justify-center rounded-xl bg-[#fdf6e3] text-slate-500">
                Rendering poster...
              </div>
            )}
          </div>

          {/* Variety Controls & Export Actions */}
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-serif text-xl font-bold">
                <Sparkles size={18} className="text-[#e64e24]" /> Export Poster
              </h3>
              <button
                onClick={() => setShowPoster(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
                aria-label="Back to canvas"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Add your name"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#e64e24] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Caption (Optional)</label>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a short fest message"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#e64e24] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Poster Frame</label>
                <div className="mt-1 grid grid-cols-2 gap-1.5">
                  {POSTER_STYLES.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setPosterStyle(st.id)}
                      className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                        posterStyle === st.id
                          ? 'border-[#e64e24] bg-orange-50 text-[#e64e24]'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Seal Label</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {BADGE_LABELS.map((b, i) => (
                    <button
                      key={b}
                      onClick={() => setBadgeIdx(i)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        badgeIdx === i ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => downloadFormat('poster')}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-2.5 text-xs font-bold text-white shadow hover:bg-green-700"
              >
                <Download size={14} /> Poster PNG
              </button>
              <button
                onClick={() => downloadFormat('story')}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#e64e24] px-3 py-2.5 text-xs font-bold text-white shadow hover:bg-[#cf4018]"
              >
                <Download size={14} /> Insta Story
              </button>
              <button
                onClick={() => downloadFormat('square')}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700"
              >
                <Download size={14} /> Square Post
              </button>
              <button
                onClick={share}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-600"
              >
                <Share2 size={14} /> Share
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setShowPoster(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Back to drawing
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentBg = BG_THEMES.find((b) => b.id === bgTheme) || BG_THEMES[0]

  return (
    <div className="fixed inset-0 z-[70] flex flex-col border-[6px] border-[#e64e24] bg-[#1e52cf]">
      {/* Close X button top-left */}
      <button
        onClick={onClose}
        className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition-transform hover:scale-105"
        aria-label="Close drawing"
      >
        <X size={20} />
      </button>

      {/* Background Scene Selector (subtle pill top-center) */}
      <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/25 px-2 py-1 backdrop-blur-sm">
        {BG_THEMES.map((b) => (
          <button
            key={b.id}
            onClick={() => setBgTheme(b.id)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
              bgTheme === b.id ? 'bg-white text-slate-900 shadow' : 'text-white/85 hover:bg-white/15'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Canvas & Animated Scene */}
      <div className="relative flex-1 overflow-hidden" style={{ background: currentBg.css }}>
        {bgTheme === 'fest' && <AnimatedStudioScene />}
        <canvas
          ref={canvasRef}
          className="relative z-10 h-full w-full cursor-crosshair touch-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
      </div>

      {/* Compact white toolbar at bottom-center */}
      <div className="absolute bottom-2.5 left-1/2 z-20 flex max-w-[94vw] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-full bg-white px-2.5 py-1.5 shadow-2xl">
        <button
          onClick={() => setTool('pencil')}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
            tool === 'pencil' ? 'bg-[#e64e24] text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Pencil"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
            tool === 'eraser' ? 'bg-[#e64e24] text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Eraser"
        >
          <Eraser size={15} />
        </button>
        <button
          onClick={() => setTool('fill')}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
            tool === 'fill' ? 'bg-[#e64e24] text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Fill"
        >
          <PaintBucket size={15} />
        </button>

        <div className="mx-0.5 h-5 w-px bg-slate-200" />

        {COLOURS.map((c) => (
          <button
            key={c}
            onClick={() => setColour(c)}
            className={`h-5 w-5 rounded-full border border-slate-300 transition ${
              colour === c ? 'scale-110 ring-2 ring-[#e64e24]' : ''
            }`}
            style={{ background: c }}
            aria-label={`Colour ${c}`}
          />
        ))}
        <input
          type="color"
          value={colour}
          onChange={(e) => setColour(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
          aria-label="Pick any colour"
        />

        <div className="mx-0.5 h-5 w-px bg-slate-200" />

        {[3, 6, 11].map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
              size === s ? 'bg-slate-200' : 'hover:bg-slate-100'
            }`}
            aria-label={`Brush size ${s}`}
          >
            <span className="rounded-full bg-slate-900" style={{ width: s + 2, height: s + 2 }} />
          </button>
        ))}

        <button
          onClick={undo}
          disabled={!history.length}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-35"
          aria-label="Undo"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={redoFn}
          disabled={!redo.length}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-35"
          aria-label="Redo"
        >
          <Redo2 size={15} />
        </button>
        <button
          onClick={() => {
            const c = canvasRef.current
            const ctx = c?.getContext('2d')
            if (!c || !ctx || c.width <= 0 || c.height <= 0) return
            snapshot()
            ctx.clearRect(0, 0, c.width, c.height)
          }}
          className="rounded-full bg-[#fef3c7] px-2.5 py-1 text-xs font-bold text-[#92400e] hover:bg-[#fde68a]"
        >
          Clear
        </button>
      </div>

      {/* Green Export pill bottom-left */}
      <button
        onClick={openPoster}
        className="absolute bottom-2.5 left-2.5 z-20 rounded-full bg-gradient-to-b from-[#22c55e] to-[#15803d] px-5 py-1.5 font-hand text-2xl font-bold italic text-white shadow-xl transition-transform hover:scale-105"
      >
        Export
      </button>
    </div>
  )
}
