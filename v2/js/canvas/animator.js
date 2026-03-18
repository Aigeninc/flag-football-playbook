/**
 * Play Animation Engine — Phase 4
 * 
 * Drives smooth, phase-based animation of any play from the library.
 * Uses requestAnimationFrame with delta time for 60fps rendering.
 */

import { fieldToCanvas, drawField, drawDefense, drawReadBadge, drawMotionPath } from './renderer.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const POSITION_COLORS = {
  QB: '#3B82F6', C: '#8B5CF6', WR1: '#F77F00', WR2: '#FCBF49', RB: '#10B981',
}

const PHASES = {
  PRE_SNAP: 'PRE_SNAP',
  SNAP: 'SNAP',
  ROUTES: 'ROUTES',
  DELIVERY: 'DELIVERY',
  AFTER_CATCH: 'AFTER_CATCH',
  DONE: 'DONE',
}

const PRE_SNAP_WITH_MOTION = 1.0
const PRE_SNAP_NO_MOTION = 0.15
const SNAP_DURATION = 0.3
const AFTER_CATCH_HOLD = 1.5

const SPEEDS = {
  teaching: 0.15,
  walkthrough: 0.35,
  full: 0.7,
  fast: 1.5,
}

// ── Math Helpers ──────────────────────────────────────────────────────────────

function dist(a, b) {
  return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

/** Catmull-Rom spline interpolation between 4 points at parameter t */
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t
  return [
    0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ]
}

/**
 * Interpolate along a path of field-coordinate waypoints using Catmull-Rom splines.
 * @param {number[][]} path - Array of [x, y] field coords
 * @param {number} progress - 0..1
 * @returns {number[]} [x, y] field coords
 */
function interpolateRoute(path, progress) {
  if (!path || path.length === 0) return null
  if (path.length === 1) return path[0]
  if (progress <= 0) return path[0]
  if (progress >= 1) return path[path.length - 1]

  // Compute cumulative distances
  const dists = [0]
  for (let i = 1; i < path.length; i++) {
    dists.push(dists[i - 1] + dist(path[i - 1], path[i]))
  }
  const totalLen = dists[dists.length - 1]
  if (totalLen === 0) return path[0]

  const targetDist = progress * totalLen

  // Find which segment we're on
  let seg = 0
  for (let i = 1; i < dists.length; i++) {
    if (dists[i] >= targetDist) { seg = i - 1; break }
  }

  const segLen = dists[seg + 1] - dists[seg]
  const localT = segLen > 0 ? (targetDist - dists[seg]) / segLen : 0

  // For Catmull-Rom, we need points before and after the segment
  const p0 = path[Math.max(0, seg - 1)]
  const p1 = path[seg]
  const p2 = path[seg + 1]
  const p3 = path[Math.min(path.length - 1, seg + 2)]

  return catmullRom(p0, p1, p2, p3, localT)
}

/**
 * Get the partial path up to a given progress for trail drawing.
 * Returns array of field coords from start to current interpolated position.
 */
function getPartialPath(path, progress) {
  if (!path || path.length < 2 || progress <= 0) return []
  if (progress >= 1) return [...path]

  const dists = [0]
  for (let i = 1; i < path.length; i++) {
    dists.push(dists[i - 1] + dist(path[i - 1], path[i]))
  }
  const totalLen = dists[dists.length - 1]
  if (totalLen === 0) return [path[0]]

  const targetDist = progress * totalLen
  const result = [path[0]]

  for (let i = 1; i < path.length; i++) {
    if (dists[i] <= targetDist) {
      result.push(path[i])
    } else {
      // Partial segment
      const segLen = dists[i] - dists[i - 1]
      const localT = segLen > 0 ? (targetDist - dists[i - 1]) / segLen : 0
      result.push([
        lerp(path[i - 1][0], path[i][0], localT),
        lerp(path[i - 1][1], path[i][1], localT),
      ])
      break
    }
  }
  return result
}

// ── Drawing Helpers (animation-specific) ──────────────────────────────────────

function drawAnimPlayer(ctx, x, y, label, color, opts = {}) {
  const { scale = 1, alpha = 1 } = opts
  const radius = 13 * scale
  ctx.save()
  ctx.globalAlpha = alpha

  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()

  if (label) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(label, x, y + radius + 3)
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawTrail(ctx, points, color, w, h, opts = {}) {
  if (!points || points.length < 2) return
  const { dashed = false, alpha = 0.7 } = opts
  const canvasPts = points.map(p => fieldToCanvas(p[0], p[1], w, h))

  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash(dashed ? [5, 4] : [])

  ctx.beginPath()
  ctx.moveTo(canvasPts[0].x, canvasPts[0].y)
  for (let i = 1; i < canvasPts.length; i++) {
    ctx.lineTo(canvasPts[i].x, canvasPts[i].y)
  }
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawBall(ctx, x, y, arcHeight, angle) {
  // Shadow
  const shadowScale = 0.5 + arcHeight * 3
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(x, y + 12 + arcHeight * 30, 5 * shadowScale, 2.5 * shadowScale, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fill()
  ctx.restore()

  // Ball (raised by arc)
  const ballY = y - arcHeight * 30
  ctx.save()
  ctx.translate(x, ballY)
  ctx.rotate(angle)

  // Football body
  ctx.beginPath()
  ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#8B4513'
  ctx.fill()
  ctx.strokeStyle = '#6B3410'
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Laces
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-2, -1); ctx.lineTo(-2, 1)
  ctx.moveTo(0, -1.5); ctx.lineTo(0, 1.5)
  ctx.moveTo(2, -1); ctx.lineTo(2, 1)
  ctx.stroke()

  ctx.restore()
}

function drawEyeLine(ctx, fromX, fromY, toX, toY, alpha) {
  ctx.save()
  ctx.strokeStyle = `rgba(255,255,100,${0.8 * alpha})`
  ctx.lineWidth = 2.5
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

// ── PlayAnimator Class ────────────────────────────────────────────────────────

export class PlayAnimator {
  constructor(canvas, play, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.playData = play
    this.options = {
      showDefense: true,
      showBall: true,
      showReadNumbers: true,
      showAllRoutes: true,
      highlightPosition: null,
      rosterMap: {},
      ...options,
    }

    this._speed = SPEEDS[options.speed] || SPEEDS.full
    this._currentTime = 0
    this._isPlaying = false
    this._rafId = null
    this._lastTimestamp = null
    this._listeners = new Set()
    this._catchPulse = {} // { position: { startTime, active } }

    // Compute timing
    this._computeTiming()

    // Initial render
    this._render()
  }

  _computeTiming() {
    const play = this.playData
    // Find the main delivery event (non-snap)
    const deliveryEvents = (play.ballPath || []).filter(e => e.type !== 'snap')
    const maxDeliveryTime = deliveryEvents.length > 0
      ? Math.max(...deliveryEvents.map(e => e.time))
      : 2.0

    // Estimate post-route time
    const deliveryDuration = 0.5 // ball flight time

    // Dynamic pre-snap: only hold if there's motion to show
    const hasMotion = Object.values(play.positions).some(p => p.motion)
    this._preSnapDuration = hasMotion ? PRE_SNAP_WITH_MOTION : PRE_SNAP_NO_MOTION

    // Route duration = max of delivery time, any per-player timing, or minimum 2s
    const maxPlayerTiming = Math.max(...Object.values(play.timing || {}).map(Number), 0)
    this._routeDuration = Math.max(maxDeliveryTime, maxPlayerTiming, 2.0)
    this._snapStart = this._preSnapDuration
    this._snapEnd = this._preSnapDuration + SNAP_DURATION
    this._routeEnd = this._snapEnd + this._routeDuration
    this._deliveryEnd = this._routeEnd + deliveryDuration
    this._totalDuration = this._deliveryEnd + AFTER_CATCH_HOLD
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  play() {
    this._isPlaying = true
    this._lastTimestamp = null
    this._boundTick = this._boundTick || this._tick.bind(this)
    this._rafId = requestAnimationFrame(this._boundTick)
    this._notify()
  }

  pause() {
    this._isPlaying = false
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null }
    this._notify()
  }

  reset() {
    this.pause()
    this._currentTime = 0
    this._catchPulse = {}
    this._render()
    this._notify()
  }

  destroy() {
    this.pause()
    this._listeners.clear()
  }

  // ── Seeking ─────────────────────────────────────────────────────────────

  seekTo(time) {
    this._currentTime = Math.max(0, Math.min(time, this._totalDuration))
    this._catchPulse = {}
    this._render()
    this._notify()
  }

  setSpeed(multiplier) {
    if (typeof multiplier === 'string') multiplier = SPEEDS[multiplier] || 1
    this._speed = multiplier
    this._notify()
  }

  stepForward() {
    const t = this._currentTime
    // Jump to next phase boundary
    const boundaries = [this._snapStart, this._snapEnd, this._routeEnd, this._deliveryEnd, this._totalDuration]
    for (const b of boundaries) {
      if (b > t + 0.01) { this.seekTo(b); return }
    }
    this.seekTo(this._totalDuration)
  }

  // ── State ───────────────────────────────────────────────────────────────

  getState() {
    return {
      phase: this._getPhase(),
      currentTime: this._currentTime,
      totalDuration: this._totalDuration,
      isPlaying: this._isPlaying,
      speed: this._speed,
    }
  }

  onStateChange(callback) {
    this._listeners.add(callback)
    return () => this._listeners.delete(callback)
  }

  _notify() {
    const state = this.getState()
    for (const fn of this._listeners) {
      try { fn(state) } catch (e) { console.error('Animator listener error:', e) }
    }
  }

  _getPhase() {
    const t = this._currentTime
    if (t < this._snapStart) return PHASES.PRE_SNAP
    if (t < this._snapEnd) return PHASES.SNAP
    if (t < this._routeEnd) return PHASES.ROUTES
    if (t < this._deliveryEnd) return PHASES.DELIVERY
    if (t < this._totalDuration) return PHASES.AFTER_CATCH
    return PHASES.DONE
  }

  // ── Animation Loop ──────────────────────────────────────────────────────

  _tick(timestamp) {
    if (!this._isPlaying) {
      return
    }

    if (this._lastTimestamp !== null) {
      const dtMs = timestamp - this._lastTimestamp
      const dt = (dtMs / 1000) * this._speed
      this._currentTime += dt

      if (this._currentTime >= this._totalDuration) {
        this._currentTime = this._totalDuration
        this._isPlaying = false
        this._rafId = null
        this._render()
        this._notify()
        return
      }
    } else { /* first tick — skip dt */ }
    this._lastTimestamp = timestamp

    try {
      this._render()
    } catch (e) {
      this._isPlaying = false
      return
    }
    this._notify()
    this._rafId = requestAnimationFrame(this._boundTick || this._tick.bind(this))
  }

  // ── Rendering ───────────────────────────────────────────────────────────

  _render() {
    const ctx = this.ctx
    // Use CSS dimensions (context is already scaled by DPR in play-viewer)
    const dpr = window.devicePixelRatio || 1
    const w = Math.round(this.canvas.width / dpr)
    const h = Math.round(this.canvas.height / dpr)
    const t = this._currentTime
    const phase = this._getPhase()
    const play = this.playData
    const opts = this.options

    if (!w || !h) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.restore()

    // Field background
    drawField(ctx, w, h)

    // Defense
    if (opts.showDefense && play.defense) {
      drawDefense(ctx, play.defense, w, h)
    }

    const opacityFor = (pos) => {
      if (!opts.highlightPosition) return 1
      return pos === opts.highlightPosition ? 1 : 0.2
    }

    // Calculate player positions for this frame
    const playerPositions = {} // { pos: [fieldX, fieldY] }
    const playerProgress = {} // { pos: 0..1 }

    for (const [pos, data] of Object.entries(play.positions)) {
      const alpha = opacityFor(pos)

      if (phase === PHASES.PRE_SNAP) {
        // Handle pre-snap motion
        if (data.motion) {
          const motionProgress = Math.min(1, t / this._preSnapDuration)
          const eased = motionProgress < 0.5
            ? 2 * motionProgress * motionProgress
            : 1 - (-2 * motionProgress + 2) ** 2 / 2

          // Draw motion path
          const from = fieldToCanvas(data.motion.from[0], data.motion.from[1], w, h)
          const to = fieldToCanvas(data.motion.to[0], data.motion.to[1], w, h)
          ctx.globalAlpha = alpha
          drawMotionPath(ctx, from, to, w, h)
          ctx.globalAlpha = 1

          playerPositions[pos] = [
            lerp(data.motion.from[0], data.motion.to[0], eased),
            lerp(data.motion.from[1], data.motion.to[1], eased),
          ]
        } else {
          playerPositions[pos] = data.pos
        }
        playerProgress[pos] = 0
      } else {
        // Post-snap: players are at their pos (motion complete) and running routes
        const routeStartTime = this._snapEnd
        const routeElapsed = Math.max(0, t - routeStartTime)

        // Route duration for this player: use their specific timing entry, or fall back to global/minimum
        const timing = play.timing || {}
        const playerTimingEntry = data.read > 0 && timing[data.read] != null ? Number(timing[data.read]) : null
        const playerRouteDuration = playerTimingEntry != null ? playerTimingEntry : Math.max(this._routeDuration, 2.0)
        const progress = Math.min(1, routeElapsed / playerRouteDuration)
        playerProgress[pos] = progress

        if (data.route && data.route.length > 0) {
          const path = [data.pos, ...data.route]
          const pos2d = interpolateRoute(path, progress)
          playerPositions[pos] = pos2d || data.pos
        } else {
          playerPositions[pos] = data.pos
        }

        // Draw motion path for players with motion (static, shown complete)
        if (data.motion) {
          const from = fieldToCanvas(data.motion.from[0], data.motion.from[1], w, h)
          const to = fieldToCanvas(data.motion.to[0], data.motion.to[1], w, h)
          ctx.globalAlpha = alpha * 0.4
          drawMotionPath(ctx, from, to, w, h)
          ctx.globalAlpha = 1
        }
      }
    }

    // Draw route trails
    if (opts.showAllRoutes && phase !== PHASES.PRE_SNAP) {
      for (const [pos, data] of Object.entries(play.positions)) {
        if (!data.route || data.route.length === 0) continue
        const color = POSITION_COLORS[pos] || '#ffffff'
        const alpha = opacityFor(pos)
        const progress = playerProgress[pos] || 0
        const path = [data.pos, ...data.route]
        const partial = getPartialPath(path, progress)

        if (partial.length >= 2) {
          drawTrail(ctx, partial, color, w, h, { dashed: data.dashed || false, alpha: alpha * 0.7 })

          // Arrow at the end of completed trails
          if (progress >= 1 && partial.length >= 2) {
            const last = fieldToCanvas(partial[partial.length - 1][0], partial[partial.length - 1][1], w, h)
            const prev = fieldToCanvas(partial[partial.length - 2][0], partial[partial.length - 2][1], w, h)
            const angle = Math.atan2(last.y - prev.y, last.x - prev.x)
            ctx.save()
            ctx.fillStyle = color
            ctx.globalAlpha = alpha * 0.7
            ctx.beginPath()
            ctx.moveTo(last.x, last.y)
            ctx.lineTo(last.x - 8 * Math.cos(angle - Math.PI / 6), last.y - 8 * Math.sin(angle - Math.PI / 6))
            ctx.lineTo(last.x - 8 * Math.cos(angle + Math.PI / 6), last.y - 8 * Math.sin(angle + Math.PI / 6))
            ctx.closePath()
            ctx.fill()
            ctx.restore()
          }

          // Route label at end
          if (progress >= 0.9 && data.label) {
            const end = fieldToCanvas(partial[partial.length - 1][0], partial[partial.length - 1][1], w, h)
            ctx.save()
            ctx.fillStyle = color
            ctx.globalAlpha = alpha * 0.7
            ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillText(data.label, end.x, end.y - 4)
            ctx.restore()
          }
        }
      }
    }

    // QB Eyes visualization
    if (play.qbLook && !play.isRunPlay && phase !== PHASES.PRE_SNAP && phase !== PHASES.DONE) {
      const qbPos = playerPositions.QB
      if (qbPos) {
        const qbCanvas = fieldToCanvas(qbPos[0], qbPos[1], w, h)

        // Determine the absolute time when the QB/passer releases the ball
        // (find the last non-snap event — throw, handoff, or lateral)
        const ballEvents = (play.ballPath || []).filter(e => e.type !== 'snap')
        const releaseEvent = ballEvents.length > 0 ? ballEvents[ballEvents.length - 1] : null
        const releaseAbsTime = releaseEvent ? this._snapEnd + releaseEvent.time : this._deliveryEnd

        const hasThrown = t >= releaseAbsTime
        const isPostSnap = phase !== PHASES.PRE_SNAP && phase !== PHASES.DONE

        if (isPostSnap && !hasThrown) {
          // Before release: yellow dashed eye line to look-off target
          const eyesTarget = playerPositions[play.qbLook.eyes]
          // Don't draw eye line to targets behind the QB (backward eye line fix)
          if (eyesTarget && eyesTarget[1] >= qbPos[1]) {
            const eyesCanvas = fieldToCanvas(eyesTarget[0], eyesTarget[1], w, h)
            drawEyeLine(ctx, qbCanvas.x, qbCanvas.y, eyesCanvas.x, eyesCanvas.y, 1)
            // Eye emoji near QB
            ctx.save()
            ctx.font = '12px serif'
            ctx.textAlign = 'center'
            ctx.fillText('👀', qbCanvas.x + 18, qbCanvas.y - 12)
            ctx.restore()
          }
        }

        if (isPostSnap && hasThrown) {
          // After release: red dashed line to throw target
          const throwTarget = playerPositions[play.qbLook.throw]
          if (throwTarget) {
            const throwCanvas = fieldToCanvas(throwTarget[0], throwTarget[1], w, h)
            ctx.save()
            ctx.strokeStyle = 'rgba(233,69,96,0.6)'
            ctx.lineWidth = 2
            ctx.setLineDash([4, 3])
            ctx.beginPath()
            ctx.moveTo(qbCanvas.x, qbCanvas.y)
            ctx.lineTo(throwCanvas.x, throwCanvas.y)
            ctx.stroke()
            ctx.setLineDash([])
            ctx.restore()
          }
        }
      }
    }

    // Draw player dots
    for (const [pos, data] of Object.entries(play.positions)) {
      const color = POSITION_COLORS[pos] || '#ffffff'
      const alpha = opacityFor(pos)
      const fieldPos = playerPositions[pos] || data.pos
      const { x, y } = fieldToCanvas(fieldPos[0], fieldPos[1], w, h)
      const label = this.options.rosterMap[pos] || pos

      // Catch pulse effect
      let scale = 1
      const pulse = this._catchPulse[pos]
      if (pulse && pulse.active) {
        const elapsed = this._currentTime - pulse.startTime
        if (elapsed < 0.3) {
          const p = elapsed / 0.3
          scale = 1 + 0.3 * Math.sin(p * Math.PI)
        } else {
          pulse.active = false
        }
      }

      // Glow ring for highlighted position
      if (opts.highlightPosition && pos === opts.highlightPosition) {
        ctx.save()
        const glowRadius = 22 * scale
        const gradient = ctx.createRadialGradient(x, y, 10 * scale, x, y, glowRadius)
        gradient.addColorStop(0, color + '50')
        gradient.addColorStop(1, color + '00')
        ctx.beginPath()
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.globalAlpha = alpha * 0.9
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, 17 * scale, 0, Math.PI * 2)
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.globalAlpha = alpha * 0.65
        ctx.stroke()
        ctx.restore()
      }

      drawAnimPlayer(ctx, x, y, label, color, { scale, alpha })

      // Read badges
      if (opts.showReadNumbers && data.read > 0 && phase !== PHASES.PRE_SNAP) {
        const progress = playerProgress[pos] || 0
        if (progress > 0.3) {
          ctx.globalAlpha = alpha
          drawReadBadge(ctx, x, y, data.read)
          ctx.globalAlpha = 1
        }
      }
    }

    // Ball animation
    if (opts.showBall) {
      this._renderBall(ctx, w, h, t, phase, playerPositions)
    }

    // Phase announcement overlay
    this._drawPhaseAnnouncement(ctx, w, h, t, phase)
  }

  _drawPhaseAnnouncement(ctx, w, h, t, phase) {
    const hasMotion = Object.values(this.playData.positions).some(p => p.motion)

    // Determine what to show and for how long
    let text = null
    let fadeProgress = 1 // 1 = full, 0 = gone

    if (phase === PHASES.PRE_SNAP && hasMotion) {
      // "Motion!" during pre-snap with motion
      text = '🏃 Motion!'
      // Fade in quickly, hold
      const p = t / this._preSnapDuration
      fadeProgress = Math.min(1, p * 3) // fade in over first third
    } else if (phase === PHASES.SNAP) {
      // "Hike!" at snap
      const snapElapsed = t - this._snapStart
      text = '🏈 Hike!'
      fadeProgress = Math.max(0, 1 - (snapElapsed / SNAP_DURATION))
    } else if (phase === PHASES.ROUTES) {
      // Brief "Routes" flash at start of routes phase
      const routeElapsed = t - this._snapEnd
      if (routeElapsed < 0.6) {
        text = this.playData.isRunPlay ? '🏃 Run!' : '📡 Routes'
        fadeProgress = Math.max(0, 1 - (routeElapsed / 0.6))
      }
    } else if (phase === PHASES.DELIVERY) {
      const deliveryElapsed = t - this._routeEnd
      if (deliveryElapsed < 0.5) {
        const lastEvt = (this.playData.ballPath || []).filter(e => e.type !== 'snap').pop()
        const typeLabel = lastEvt?.type === 'handoff' ? '🤝 Handoff!'
          : lastEvt?.type === 'lateral' ? '↗️ Lateral!'
          : '🎯 Throw!'
        text = typeLabel
        fadeProgress = Math.max(0, 1 - (deliveryElapsed / 0.5))
      }
    } else if (phase === PHASES.PRE_SNAP && !hasMotion) {
      // Quick "Set!" for plays without motion
      text = '🏈 Set...'
      fadeProgress = 1
    }

    if (!text || fadeProgress <= 0) return

    ctx.save()
    ctx.globalAlpha = fadeProgress * 0.9

    // Background pill
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif'
    const metrics = ctx.measureText(text)
    const tw = metrics.width + 32
    const th = 36
    const tx = (w - tw) / 2
    const ty = 12

    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.beginPath()
    ctx.roundRect(tx, ty, tw, th, 8)
    ctx.fill()

    // Text
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, ty + th / 2)

    ctx.restore()
  }

  _renderBall(ctx, w, h, t, phase, playerPositions) {
    const play = this.playData
    if (!play.ballPath || play.ballPath.length === 0) return

    // Build timeline of ball events with absolute times and flight durations
    const events = play.ballPath.map(evt => {
      const absStart = this._snapEnd + evt.time
      const flight = evt.type === 'snap' ? SNAP_DURATION
        : evt.type === 'handoff' ? 0.2
        : 0.5
      return { ...evt, absStart, flight, absEnd: absStart + flight }
    })

    // Check if ball is currently in flight
    for (const evt of events) {
      if (t >= evt.absStart && t <= evt.absEnd) {
        const progress = (t - evt.absStart) / evt.flight

        const fromPos = playerPositions[evt.from] || play.positions[evt.from]?.pos
        const toPos = playerPositions[evt.to] || play.positions[evt.to]?.pos
        if (!fromPos || !toPos) continue

        const fromCanvas = fieldToCanvas(fromPos[0], fromPos[1], w, h)
        const toCanvas = fieldToCanvas(toPos[0], toPos[1], w, h)

        const bx = lerp(fromCanvas.x, toCanvas.x, progress)
        const by = lerp(fromCanvas.y, toCanvas.y, progress)

        // Arc height based on throw distance
        let arcHeight = 0
        if (evt.type === 'throw') {
          const d = dist([fromCanvas.x, fromCanvas.y], [toCanvas.x, toCanvas.y])
          arcHeight = (d * 0.002) * Math.sin(progress * Math.PI)
        } else if (evt.type === 'lateral') {
          arcHeight = 0.02 * Math.sin(progress * Math.PI)
        } else if (evt.type === 'snap') {
          arcHeight = 0.015 * Math.sin(progress * Math.PI)
        }

        const flightAngle = Math.atan2(toCanvas.y - fromCanvas.y, toCanvas.x - fromCanvas.x)
        const wobble = evt.type === 'throw' ? Math.sin(progress * 20) * 0.1 : 0

        drawBall(ctx, bx, by, arcHeight, flightAngle + wobble)

        // Trigger catch pulse at end
        if (progress >= 0.95 && !this._catchPulse[evt.to]?.active) {
          this._catchPulse[evt.to] = { startTime: this._currentTime, active: true }
        }
        return
      }
    }

    // Ball is NOT in flight — find who's carrying it
    // Walk through events in order: after each event completes, the ball is with evt.to
    let carrier = null
    if (phase === PHASES.PRE_SNAP) {
      // Ball at center before snap
      carrier = 'C'
    } else {
      // Find the last completed event
      for (const evt of events) {
        if (t >= evt.absEnd) {
          carrier = evt.to
        }
      }
      // If before first event completes but after snap, ball is with center
      if (!carrier && phase === PHASES.SNAP) {
        carrier = 'C'
      }
    }

    if (carrier) {
      const carrierPos = playerPositions[carrier]
      if (carrierPos) {
        const c = fieldToCanvas(carrierPos[0], carrierPos[1], w, h)
        // Offset ball slightly above and to the right of carrier
        drawBall(ctx, c.x + 8, c.y - 10, 0, 0)
      }
    }
  }

  // ── Options Update ──────────────────────────────────────────────────────

  updateOptions(newOpts) {
    Object.assign(this.options, newOpts)
    if (!this._isPlaying) this._render()
  }
}

export { SPEEDS, PHASES }
