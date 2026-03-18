// canvas/juke-animator.js — JukeMoveAnimator class
// Canvas-based animation of juke move footprint sequences
// API shape mirrors PlayAnimator: play/pause/reset/destroy/seekTo/getState/onStateChange

import { JUKE_MOVES, getAllSteps } from '../juke-data.js'

export class JukeMoveAnimator {
  constructor(canvas, moveId, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.move = JUKE_MOVES.find(m => m.id === moveId)
    this.steps = getAllSteps(this.move)
    this.options = {
      speedMode: 'teach',
      ...options,
    }

    this._currentTime = 0
    this._isPlaying = false
    this._rafId = null
    this._lastTimestamp = null
    this._listeners = new Set()
    this._dpr = window.devicePixelRatio || 1

    this._computeTiming()
    this._computeScale()
    this._render()
  }

  // ── Timing ──────────────────────────────────────────────────────────────

  _computeTiming() {
    const isTeach = this.options.speedMode === 'teach'
    this._stepTimings = []
    let time = 0.3

    for (const phase of this.move.phases) {
      for (const step of phase.steps) {
        const dur = isTeach ? step.teachDuration : step.duration
        this._stepTimings.push({
          stepNumber: step.stepNumber,
          startTime: time,
          endTime: time + dur,
          step,
          phase: phase.phase,
          phaseDescription: phase.description,
        })
        time += dur
      }
      time += isTeach ? 0.4 : 0.2
    }

    this._totalDuration = time + 0.5
  }

  _computeScale() {
    const xs = this.steps.map(s => s.position.x)
    const ys = this.steps.map(s => s.position.y)
    this._scale = {
      xMin: Math.min(...xs) - 8,
      xMax: Math.max(...xs) + 8,
      yMin: Math.min(...ys) - 8,
      yMax: Math.max(...ys) + 8,
    }
    this._scale.xRange = Math.max(this._scale.xMax - this._scale.xMin, 30)
    this._scale.yRange = Math.max(this._scale.yMax - this._scale.yMin, 50)
  }

  // ── Public API ──────────────────────────────────────────────────────────

  play() {
    if (this._currentTime >= this._totalDuration) this._currentTime = 0
    this._isPlaying = true
    this._lastTimestamp = null
    this._rafId = requestAnimationFrame(this._tick.bind(this))
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
    this._render()
    this._notify()
  }

  destroy() {
    this.pause()
    this._listeners.clear()
  }

  seekTo(time) {
    this._currentTime = Math.max(0, Math.min(time, this._totalDuration))
    this._render()
    this._notify()
  }

  seekToStep(stepNumber) {
    const timing = this._stepTimings.find(t => t.stepNumber === stepNumber)
    if (timing) this.seekTo(timing.startTime)
  }

  stepForward() {
    const cur = this._getCurrentStepNumber()
    const next = this._stepTimings.find(t => t.stepNumber > cur)
    if (next) this.seekTo(next.startTime)
    else this.seekTo(this._totalDuration)
  }

  stepBackward() {
    const cur = this._getCurrentStepNumber()
    const prev = [...this._stepTimings].reverse().find(t => t.stepNumber < cur)
    if (prev) this.seekTo(prev.startTime)
    else this.seekTo(0)
  }

  setSpeedMode(mode) {
    const wasPlaying = this._isPlaying
    const curStep = this._getCurrentStepNumber()
    this.pause()
    this.options.speedMode = mode
    this._computeTiming()
    this.seekToStep(curStep || 1)
    if (wasPlaying) this.play()
  }

  setMove(moveId) {
    this.pause()
    this.move = JUKE_MOVES.find(m => m.id === moveId)
    this.steps = getAllSteps(this.move)
    this._currentTime = 0
    this._computeTiming()
    this._computeScale()
    this._render()
    this._notify()
  }

  getState() {
    const ct = this._getCurrentTiming()
    return {
      moveId: this.move.id,
      moveName: this.move.name,
      phase: ct?.phase || 'ready',
      phaseDescription: ct?.phaseDescription || '',
      currentStep: this._getCurrentStepNumber(),
      totalSteps: this.move.totalSteps,
      currentTime: this._currentTime,
      totalDuration: this._totalDuration,
      isPlaying: this._isPlaying,
      speedMode: this.options.speedMode,
    }
  }

  onStateChange(callback) {
    this._listeners.add(callback)
    return () => this._listeners.delete(callback)
  }

  // ── Internal ────────────────────────────────────────────────────────────

  _getCurrentTiming() {
    let last = null
    for (const t of this._stepTimings) {
      if (this._currentTime >= t.startTime) last = t
    }
    return last
  }

  _getCurrentStepNumber() {
    const t = this._getCurrentTiming()
    return t ? t.stepNumber : 0
  }

  _tick(timestamp) {
    if (!this._isPlaying) return

    if (this._lastTimestamp !== null) {
      const dt = (timestamp - this._lastTimestamp) / 1000
      this._currentTime += dt

      if (this._currentTime >= this._totalDuration) {
        this._currentTime = this._totalDuration
        this._isPlaying = false
        this._rafId = null
        this._render()
        this._notify()
        return
      }
    }
    this._lastTimestamp = timestamp

    this._render()
    this._notify()
    this._rafId = requestAnimationFrame(this._tick.bind(this))
  }

  _notify() {
    const state = this.getState()
    for (const fn of this._listeners) {
      try { fn(state) } catch (e) { console.error('Juke listener error:', e) }
    }
  }

  // ── Rendering ───────────────────────────────────────────────────────────

  _render() {
    const ctx = this.ctx
    const dpr = this._dpr
    const w = Math.round(this.canvas.width / dpr)
    const h = Math.round(this.canvas.height / dpr)
    const t = this._currentTime

    if (!w || !h) return

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Background
    this._drawBackground(ctx, w, h)

    // Phase label
    const currentTiming = this._getCurrentTiming()
    if (currentTiming) {
      this._drawPhaseLabel(ctx, w, currentTiming.phase)
    }

    // Footprints
    const currentStepNum = this._getCurrentStepNumber()

    for (const timing of this._stepTimings) {
      const step = timing.step
      if (timing.stepNumber > currentStepNum) continue

      const pos = this._jukeToCanvas(step.position, w, h)
      const isActive = timing.stepNumber === currentStepNum
      const state = isActive ? 'active' : 'placed'

      // Emphasis pulse (behind footprint)
      if (isActive && step.emphasis) {
        this._drawEmphasisPulse(ctx, pos.x, pos.y, step.foot, t * 1000)
      }

      // Footprint
      this._drawFootprint(ctx, pos.x, pos.y, step.angle, step.foot, state, step.weight, step.action)

      // Force vector (active only)
      if (isActive && step.forceVector) {
        this._drawForceVector(ctx, pos.x, pos.y, step.forceVector.angle, step.forceVector.magnitude)
      }

      // Step number
      ctx.save()
      ctx.fillStyle = isActive ? '#fff' : 'rgba(255,255,255,0.4)'
      ctx.font = `bold ${isActive ? '12' : '10'}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(step.stepNumber), pos.x, pos.y)
      ctx.restore()
    }

    ctx.restore()
  }

  _jukeToCanvas(pos, w, h) {
    const padding = 50
    const usableW = w - padding * 2
    const usableH = h - padding * 2
    const xCenter = (this._scale.xMin + this._scale.xMax) / 2
    const sx = usableW / this._scale.xRange
    const sy = usableH / this._scale.yRange
    const s = Math.min(sx, sy)

    return {
      x: w / 2 + (pos.x - xCenter) * s,
      y: h - padding - (pos.y - this._scale.yMin) * s,
    }
  }

  _drawBackground(ctx, w, h) {
    ctx.fillStyle = '#1a2332'
    ctx.fillRect(0, 0, w, h)

    // Center dashed line
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(w / 2, 0)
    ctx.lineTo(w / 2, h)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    // Forward arrow
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('↑ FORWARD', w / 2, 16)
    ctx.restore()
  }

  _drawPhaseLabel(ctx, w, phaseName) {
    const label = phaseName.toUpperCase()
    ctx.save()
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
    const metrics = ctx.measureText(label)
    const pw = metrics.width + 24
    const ph = 28
    const px = (w - pw) / 2
    const py = 30

    // Rounded rect
    ctx.fillStyle = 'rgba(233, 69, 96, 0.8)'
    ctx.beginPath()
    if (ctx.roundRect) {
      ctx.roundRect(px, py, pw, ph, 6)
    } else {
      // Fallback for older browsers
      const r = 6
      ctx.moveTo(px + r, py)
      ctx.lineTo(px + pw - r, py)
      ctx.arcTo(px + pw, py, px + pw, py + r, r)
      ctx.lineTo(px + pw, py + ph - r)
      ctx.arcTo(px + pw, py + ph, px + pw - r, py + ph, r)
      ctx.lineTo(px + r, py + ph)
      ctx.arcTo(px, py + ph, px, py + ph - r, r)
      ctx.lineTo(px, py + r)
      ctx.arcTo(px, py, px + r, py, r)
      ctx.closePath()
    }
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, w / 2, py + ph / 2)
    ctx.restore()
  }

  _drawFootprint(ctx, x, y, angle, foot, state, weight, action) {
    const len = 28
    let wid = 14

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((-angle * Math.PI) / 180)

    if (foot === 'left') ctx.scale(-1, 1)

    const baseColor = foot === 'left' ? '#3B82F6' : '#EF4444'
    const alpha = state === 'active' ? 1.0 : 0.45

    ctx.globalAlpha = alpha

    // Action-specific modifications
    let borderWidth = 1.5
    let dashPattern = null
    let scaleX = 1
    let scaleY = 1

    switch (action) {
      case 'plant':
        borderWidth = 3
        break
      case 'drag':
        dashPattern = [3, 3]
        break
      case 'shuffle':
        scaleX = 0.75
        scaleY = 0.75
        break
      case 'slide':
        scaleY = 1.3
        break
    }

    ctx.scale(scaleX, scaleY)

    // Sole shape
    ctx.beginPath()
    ctx.moveTo(-wid / 2, len * 0.4)
    ctx.quadraticCurveTo(-wid / 2, len / 2, -wid / 3, len / 2)
    ctx.lineTo(wid / 3, len / 2)
    ctx.quadraticCurveTo(wid / 2, len / 2, wid / 2, len * 0.4)
    ctx.lineTo(wid / 2, -len * 0.2)
    ctx.quadraticCurveTo(wid * 0.6, -len / 2, wid / 4, -len / 2)
    ctx.lineTo(-wid / 4, -len / 2)
    ctx.quadraticCurveTo(-wid * 0.6, -len / 2, -wid / 2, -len * 0.2)
    ctx.closePath()

    ctx.fillStyle = baseColor
    ctx.fill()

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = borderWidth
    if (dashPattern) ctx.setLineDash(dashPattern)
    ctx.stroke()
    if (dashPattern) ctx.setLineDash([])

    // Plant shadow
    if (action === 'plant' && state === 'active') {
      ctx.shadowColor = baseColor
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Weight indicator
    if (weight > 0.7) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fill()
    }

    // Pivot indicator
    if (action === 'pivot') {
      ctx.beginPath()
      ctx.arc(0, 0, 8, -Math.PI * 0.3, Math.PI * 1.3)
      ctx.strokeStyle = '#FBBF24'
      ctx.lineWidth = 2
      ctx.stroke()
      // Arrowhead
      const endAngle = Math.PI * 1.3
      const ax = 8 * Math.cos(endAngle)
      const ay = 8 * Math.sin(endAngle)
      ctx.fillStyle = '#FBBF24'
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(ax - 5, ay - 3)
      ctx.lineTo(ax - 2, ay + 4)
      ctx.closePath()
      ctx.fill()
    }

    // Push-off motion lines
    if (action === 'push-off' && state === 'active') {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 1.5
      for (let i = 0; i < 2; i++) {
        const offset = len * 0.3 + i * 6
        ctx.beginPath()
        ctx.moveTo(-wid / 2 - 3, offset)
        ctx.lineTo(-wid / 2 - 10, offset + 4)
        ctx.stroke()
      }
    }

    ctx.restore()
  }

  _drawEmphasisPulse(ctx, x, y, foot, timeMs) {
    const color = foot === 'left' ? '#3B82F6' : '#EF4444'
    const cycle = 800
    const t = (timeMs % cycle) / cycle
    const scale = 1 + 0.5 * Math.sin(t * Math.PI * 2)
    const a = 0.4 * (1 - Math.abs(Math.sin(t * Math.PI * 2)) * 0.6)

    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, 22 * scale, 0, Math.PI * 2)
    ctx.strokeStyle = color
    ctx.globalAlpha = a
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()
  }

  _drawForceVector(ctx, x, y, forceAngle, magnitude) {
    if (magnitude < 0.1) return

    const arrowLen = magnitude * 45
    const canvasAngle = ((forceAngle - 90) * Math.PI) / 180
    const endX = x + Math.cos(canvasAngle) * arrowLen
    const endY = y + Math.sin(canvasAngle) * arrowLen

    ctx.save()
    // Shaft
    ctx.strokeStyle = '#FBBF24'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    // Head
    const headAngle = Math.atan2(endY - y, endX - x)
    ctx.fillStyle = '#FBBF24'
    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(endX - 10 * Math.cos(headAngle - Math.PI / 6), endY - 10 * Math.sin(headAngle - Math.PI / 6))
    ctx.lineTo(endX - 10 * Math.cos(headAngle + Math.PI / 6), endY - 10 * Math.sin(headAngle + Math.PI / 6))
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}
