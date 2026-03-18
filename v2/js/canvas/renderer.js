/**
 * Static Canvas Renderer — Phase 3
 *
 * Coordinate system:
 *   X: 0–35 (left sideline to right sideline), center = 17.5
 *   Y: negative = behind LOS, positive = downfield
 *   LOS at Y=0, rendered at 40% from top of canvas
 */

// ── Position Colors ───────────────────────────────────────────────────────────
const POSITION_COLORS = {
  QB:  '#3B82F6',
  C:   '#8B5CF6',
  WR1: '#F77F00',
  WR2: '#FCBF49',
  RB:  '#10B981',
}

// ── Coordinate Conversion ─────────────────────────────────────────────────────

/**
 * Convert field coordinates to canvas pixel coordinates.
 * @param {number} fieldX - 0–35
 * @param {number} fieldY - negative = behind LOS, positive = downfield
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {{ x: number, y: number }}
 */
// FIELD_TOTAL_YARDS controls zoom level. Lower = more zoomed in.
// 26 ≈ 17 yards downfield + 9 yards backfield at LOS=65% (Keith: cap plays at 15 yards)
const FIELD_TOTAL_YARDS = 26

export function fieldToCanvas(fieldX, fieldY, canvasWidth, canvasHeight) {
  const padding = 20
  const usableWidth = canvasWidth - padding * 2
  const usableHeight = canvasHeight - padding * 2
  const x = padding + (fieldX / 35) * usableWidth
  const losY = padding + usableHeight * 0.65  // downfield goes UP, so LOS must be LOW on canvas
  const scale = usableHeight / FIELD_TOTAL_YARDS
  const y = losY - fieldY * scale
  return { x, y }
}

// ── Individual Draw Functions ─────────────────────────────────────────────────

/**
 * Draw the football field background: green, yard lines, LOS.
 */
export function drawField(ctx, w, h) {
  // Background
  ctx.fillStyle = '#2d5a27'
  ctx.fillRect(0, 0, w, h)

  const padding = 20
  const usableWidth = w - padding * 2
  const usableHeight = h - padding * 2
  const losY = padding + usableHeight * 0.65  // matches fieldToCanvas
  const scale = usableHeight / FIELD_TOTAL_YARDS  // matches fieldToCanvas

  // Yard lines every 5 yards (Y = 5, 10, 15 downfield; -5 behind)
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  for (let yd = -10; yd <= 15; yd += 5) {
    if (yd === 0) continue
    const lineY = losY - yd * scale
    if (lineY < padding - 10 || lineY > h - padding + 10) continue
    ctx.beginPath()
    ctx.moveTo(padding, lineY)
    ctx.lineTo(w - padding, lineY)
    ctx.stroke()
  }
  ctx.restore()

  // Line of Scrimmage — white dashed
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(padding, losY)
  ctx.lineTo(w - padding, losY)
  ctx.stroke()
  ctx.restore()
}

/**
 * Draw a player dot with optional label.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - canvas x
 * @param {number} y - canvas y
 * @param {string} label - text shown below dot
 * @param {string} color - hex color
 * @param {{ mini?: boolean, radius?: number }} options
 */
export function drawPlayer(ctx, x, y, label, color, options = {}) {
  const { mini = false } = options
  const radius = mini ? 7 : 13

  ctx.save()

  // Fill
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // White stroke
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = mini ? 1.5 : 2
  ctx.stroke()

  // Label (skip in mini mode)
  if (!mini && label) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(label, x, y + radius + 3)
  }

  ctx.restore()
}

/**
 * Draw a route line through an array of canvas-coordinate points.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number }[]} points - start point + waypoints
 * @param {string} color - hex color
 * @param {{ dashed?: boolean, mini?: boolean, label?: string }} options
 */
export function drawRoute(ctx, points, color, options = {}) {
  if (!points || points.length < 2) return
  const { dashed = false, mini = false, label = '' } = options

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = mini ? 1.5 : 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (dashed) {
    ctx.setLineDash([5, 4])
  } else {
    ctx.setLineDash([])
  }

  // Draw line
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  // Arrow at final point
  if (points.length >= 2) {
    const last = points[points.length - 1]
    const prev = points[points.length - 2]
    _drawArrow(ctx, prev.x, prev.y, last.x, last.y, color, mini ? 5 : 8)
  }

  // Route label near endpoint (skip in mini mode)
  if (!mini && label) {
    const end = points[points.length - 1]
    ctx.fillStyle = color
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(label, end.x, end.y - 4)
  }

  ctx.restore()
}

/**
 * Draw defense markers (X shapes) at field coordinate positions.
 */
export function drawDefense(ctx, positions, w, h) {
  if (!positions || !positions.length) return
  ctx.save()
  ctx.strokeStyle = '#888888'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  for (const [fx, fy] of positions) {
    const { x, y } = fieldToCanvas(fx, fy, w, h)
    const s = 6
    ctx.beginPath()
    ctx.moveTo(x - s, y - s)
    ctx.lineTo(x + s, y + s)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + s, y - s)
    ctx.lineTo(x - s, y + s)
    ctx.stroke()
  }

  ctx.restore()
}

/**
 * Draw a read-order badge (yellow circle with number).
 */
export function drawReadBadge(ctx, x, y, num) {
  if (!num || num <= 0) return
  const r = 8

  ctx.save()

  // Badge background (yellow)
  const bx = x + 10
  const by = y - 10
  ctx.beginPath()
  ctx.arc(bx, by, r, 0, Math.PI * 2)
  ctx.fillStyle = '#FFD700'
  ctx.fill()
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1
  ctx.stroke()

  // Number
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(num), bx, by)

  ctx.restore()
}

/**
 * Draw a pre-snap motion path (dotted gray line).
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number }} from - canvas coords
 * @param {{ x: number, y: number }} to   - canvas coords
 */
export function drawMotionPath(ctx, from, to, _w, _h) {
  ctx.save()
  ctx.strokeStyle = 'rgba(200,200,200,0.7)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([3, 4])

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  // Small arrow at destination
  ctx.setLineDash([])
  _drawArrow(ctx, from.x, from.y, to.x, to.y, 'rgba(200,200,200,0.7)', 5)

  ctx.restore()
}

// ── Main Render Function ──────────────────────────────────────────────────────

/**
 * Render a complete play onto a canvas element.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} play - play object from PLAY_LIBRARY
 * @param {Object} options
 * @param {Object}  [options.rosterMap]         - { QB: 'Braelyn', ... }
 * @param {boolean} [options.showDefense=true]
 * @param {boolean} [options.showReadNumbers=true]
 * @param {boolean} [options.showAllRoutes=true]
 * @param {string|null} [options.highlightPosition=null]
 * @param {boolean} [options.mini=false]
 */
export function renderPlay(canvas, play, options = {}) {
  const {
    rosterMap = {},
    showDefense = true,
    showReadNumbers = true,
    highlightPosition = null,
    mini = false,
  } = options

  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  if (!w || !h) return

  // Clear
  ctx.clearRect(0, 0, w, h)

  // Field
  drawField(ctx, w, h)

  // Helper: opacity based on highlight mode
  const opacityFor = (pos) => {
    if (!highlightPosition) return 1
    return pos === highlightPosition ? 1 : 0.2
  }

  // Defense
  if (showDefense && play.defense) {
    drawDefense(ctx, play.defense, w, h)
  }

  // Motion paths (drawn behind routes)
  for (const [pos, data] of Object.entries(play.positions || {})) {
    if (!data.motion) continue
    const opacity = opacityFor(pos)
    const from = fieldToCanvas(data.motion.from[0], data.motion.from[1], w, h)
    const to   = fieldToCanvas(data.motion.to[0],   data.motion.to[1],   w, h)
    ctx.globalAlpha = opacity
    drawMotionPath(ctx, from, to, w, h)
    ctx.globalAlpha = 1
  }

  // Routes
  for (const [pos, data] of Object.entries(play.positions || {})) {
    if (!data.route || data.route.length === 0) continue
    const color = POSITION_COLORS[pos] || '#ffffff'
    const opacity = opacityFor(pos)

    // Build canvas point array: start pos + route waypoints
    const startPt = fieldToCanvas(data.pos[0], data.pos[1], w, h)
    const routePts = data.route.map(pt => fieldToCanvas(pt[0], pt[1], w, h))
    const points = [startPt, ...routePts]

    ctx.globalAlpha = opacity * 0.85
    drawRoute(ctx, points, color, {
      dashed: data.dashed || false,
      mini,
      label: data.label || '',
    })
    ctx.globalAlpha = 1
  }

  // Player dots
  for (const [pos, data] of Object.entries(play.positions || {})) {
    const color = POSITION_COLORS[pos] || '#ffffff'
    const opacity = opacityFor(pos)
    const { x, y } = fieldToCanvas(data.pos[0], data.pos[1], w, h)
    const label = rosterMap[pos] || pos

    ctx.globalAlpha = opacity
    drawPlayer(ctx, x, y, label, color, { mini })
    ctx.globalAlpha = 1

    // Read badge (only non-mini, only if read > 0)
    if (!mini && showReadNumbers && data.read > 0) {
      ctx.globalAlpha = opacity
      drawReadBadge(ctx, x, y, data.read)
      ctx.globalAlpha = 1
    }
  }
}

// ── Private Helpers ───────────────────────────────────────────────────────────

function _drawArrow(ctx, fromX, fromY, toX, toY, color, size = 8) {
  const angle = Math.atan2(toY - fromY, toX - fromX)
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(
    toX - size * Math.cos(angle - Math.PI / 6),
    toY - size * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    toX - size * Math.cos(angle + Math.PI / 6),
    toY - size * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
