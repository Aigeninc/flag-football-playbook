# Juke Move Animation Feature — Implementation Plan

> **Status:** PLAN — Ready for builder agent  
> **Author:** Architecture planning agent  
> **Date:** 2026-03-17  
> **Target:** Flag Football Playbook v2 (vanilla JS, zero dependencies)

---

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [File Inventory](#2-file-inventory)
3. [Data Layer](#3-data-layer)
4. [Canvas Rendering Plan](#4-canvas-rendering-plan)
5. [Animation System](#5-animation-system)
6. [UI Component Breakdown](#6-ui-component-breakdown)
7. [Integration with Practice Drills](#7-integration-with-practice-drills)
8. [Store Additions](#8-store-additions)
9. [CSS Plan](#9-css-plan)
10. [Implementation Order](#10-implementation-order)
11. [Risk Areas](#11-risk-areas)

---

## 1. Architecture Decisions

### Overlay Sub-View of Practice (not a new route)

The juke tutorial is **NOT** a new top-level route. It's an overlay panel triggered from the practice view. Rationale:

- Juke tutorials are contextual to practice — coaches access them while building/running drills
- Adding a route would require a nav link, which clutters the nav bar for a secondary feature
- The practice view already uses the overlay pattern (`pp-overlay` class) for drill picker, play selector, and custom drill form — this follows the same pattern exactly
- No router changes needed in `app.js`

**Access points:**
1. From practice builder — when an evasion drill is expanded, a "🏃 View Juke Moves" button opens the overlay
2. From practice run mode — same button in the coaching points area for evasion drills
3. Direct entry — a "Juke Tutorials" card at the bottom of the practice builder view (always visible, not dependent on a drill)

### Architecture Pattern

```
practiceView (existing)
  └── renderJukeTutorial()          ← new overlay panel
        ├── JukeMoveAnimator        ← new canvas animation class
        ├── move selector UI
        ├── playback controls
        ├── coaching panel
        └── step scrubber
```

The `JukeMoveAnimator` is a **new class** in `js/canvas/juke-animator.js`, separate from `PlayAnimator`. The existing `PlayAnimator` is designed around football plays (phases: pre-snap → snap → routes → delivery). The juke animator has completely different phases (approach → fake → plant → cut → acceleration) and operates on footprint data, not player routes. Reuse would require so many conditionals it'd be worse than a clean class.

However, the juke animator **follows the same API shape** as `PlayAnimator` for consistency:
- `.play()`, `.pause()`, `.reset()`, `.destroy()`
- `.seekTo(time)`, `.setSpeed(key)`
- `.getState()` → `{ phase, currentStep, totalSteps, currentTime, totalDuration, isPlaying, speed }`
- `.onStateChange(callback)` → returns unsubscribe function

---

## 2. File Inventory

### New Files

| File | Purpose | Est. Lines |
|------|---------|-----------|
| `js/canvas/juke-animator.js` | `JukeMoveAnimator` class — rAF loop, footprint rendering, force vectors, step interpolation | ~450 |
| `js/juke-data.js` | Juke move data (converted from JSON to ES module export) | ~420 |
| `js/views/juke-tutorial.js` | UI overlay: move selector, controls, coaching panel, step indicator — rendered inside practice view | ~350 |

### Modified Files

| File | Changes | Est. Added Lines |
|------|---------|-----------------|
| `js/views/practice.js` | Import juke tutorial, add trigger buttons in evasion drill cards + standalone entry card | ~40 |
| `js/drill-library.js` | Add `jukeRelated` field to evasion drills that map to juke move IDs | ~15 |
| `css/app.css` | New `jk-*` section for juke tutorial styles | ~200 |

### Unchanged Files

- `js/app.js` — no new route
- `js/router.js` — no changes
- `js/store.js` — no schema changes (preferences use existing `Object.assign` merge)
- `js/canvas/renderer.js` — not touched (juke uses its own renderer)
- `js/canvas/animator.js` — not touched
- `js/utils/dom.js` — used as-is

---

## 3. Data Layer

### Convert JSON to ES Module

The juke data JSON becomes `js/juke-data.js` — a direct ES module export. No fetch/async needed.

```js
// js/juke-data.js
export const JUKE_METADATA = {
  coordinateSystem: {
    yAxis: 'forward',
    xAxis: 'lateral',
    units: 'inches',
    strideRange: '18-24 inches for youth players',
  },
  angleConventions: { /* ... */ },
}

export const JUKE_MOVES = [
  {
    id: 'cut-juke',
    name: 'Cut / Juke',
    description: 'Head and shoulder fake one direction, plant outside foot hard...',
    totalSteps: 6,
    approachDirection: 'forward',
    exitDirection: '45-degrees-right',
    phases: [ /* ... full phase/step data ... */ ],
    coachingCues: [ /* ... */ ],
    commonMistakes: [ /* ... */ ],
  },
  // ... all 6 moves
]

export function getJukeMove(id) {
  return JUKE_MOVES.find(m => m.id === id)
}

export function getAllSteps(move) {
  return move.phases.flatMap(p => p.steps)
}

export function getPhaseForStep(move, stepNumber) {
  for (const phase of move.phases) {
    if (phase.steps.some(s => s.stepNumber === stepNumber)) {
      return phase
    }
  }
  return null
}
```

### Why not dynamic import?

The data is 33KB — trivial for a PWA that already bundles everything. Static import means:
- Zero async complexity
- Available immediately on module load
- Service worker caches it with everything else
- No error handling for fetch failures

---

## 4. Canvas Rendering Plan

### Canvas Orientation

**Portrait orientation** — the juke data flows forward (Y-axis up), so the canvas is taller than wide. On mobile this is natural; on desktop we constrain width.

```
Canvas aspect ratio: 2:3 (width:height)
CSS: width = min(100%, 400px), height = auto (aspect-ratio: 2/3)
Buffer: cssW * dpr × cssH * dpr
```

### Coordinate Mapping

The data uses inches. We need a `jukeToCanvas()` function:

```js
function computeScale(move) {
  const steps = getAllSteps(move)
  const xs = steps.map(s => s.position.x)
  const ys = steps.map(s => s.position.y)
  const xMin = Math.min(...xs), xMax = Math.max(...xs)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)
  const xRange = Math.max(xMax - xMin, 20) // minimum range
  const yRange = Math.max(yMax - yMin, 40)
  return { xMin, xMax, yMin, yMax, xRange, yRange }
}

function jukeToCanvas(pos, scale, canvasW, canvasH) {
  const padding = 50
  const usableW = canvasW - padding * 2
  const usableH = canvasH - padding * 2

  // Center horizontally, Y starts from bottom
  const xCenter = (scale.xMin + scale.xMax) / 2
  const sx = usableW / scale.xRange
  const sy = usableH / scale.yRange
  const s = Math.min(sx, sy) // uniform scale

  return {
    x: canvasW / 2 + (pos.x - xCenter) * s,
    y: canvasH - padding - (pos.y - scale.yMin) * s,
  }
}
```

### Footprint Rendering

Each footprint is a simplified shoe-sole shape drawn with canvas paths:

```js
function drawFootprint(ctx, x, y, angle, foot, state, weight) {
  const len = 28  // px length
  const wid = 14  // px width

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((-angle * Math.PI) / 180) // negative because canvas Y is inverted

  // Mirror for left foot
  if (foot === 'left') ctx.scale(-1, 1)

  // Colors
  const baseColor = foot === 'left' ? '#3B82F6' : '#EF4444'

  // Opacity by state
  const alpha = state === 'active' ? 1.0
    : state === 'placed' ? 0.45
    : 0 // not-yet

  ctx.globalAlpha = alpha

  // Sole shape: rounded rectangle with toe bump
  ctx.beginPath()
  // Heel (bottom, rounded)
  ctx.moveTo(-wid / 2, len * 0.4)
  ctx.quadraticCurveTo(-wid / 2, len / 2, -wid / 3, len / 2)
  ctx.lineTo(wid / 3, len / 2)
  ctx.quadraticCurveTo(wid / 2, len / 2, wid / 2, len * 0.4)
  // Right side
  ctx.lineTo(wid / 2, -len * 0.2)
  // Toe (top, wider and rounded)
  ctx.quadraticCurveTo(wid * 0.6, -len / 2, wid / 4, -len / 2)
  ctx.lineTo(-wid / 4, -len / 2)
  ctx.quadraticCurveTo(-wid * 0.6, -len / 2, -wid / 2, -len * 0.2)
  ctx.closePath()

  ctx.fillStyle = baseColor
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Weight indicator: inner opacity gradient
  if (weight > 0.7) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fill()
  }

  ctx.restore()
  ctx.globalAlpha = 1
}
```

### Emphasis Pulse Effect

For steps with `emphasis: true`, a pulsing glow ring:

```js
function drawEmphasisPulse(ctx, x, y, foot, time) {
  const color = foot === 'left' ? '#3B82F6' : '#EF4444'
  const cycle = 800 // ms
  const t = (time % cycle) / cycle
  const scale = 1 + 0.5 * Math.sin(t * Math.PI * 2)
  const alpha = 0.4 * (1 - Math.abs(Math.sin(t * Math.PI * 2)) * 0.6)

  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, 22 * scale, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()
}
```

### Force Vector Arrows

Drawn only on the active step:

```js
function drawForceVector(ctx, x, y, forceAngle, magnitude) {
  if (magnitude < 0.1) return

  const arrowLen = magnitude * 45 // base length scaled by magnitude
  // forceAngle: 0=up, 90=right, 180=down, 270=left
  // Canvas: need to convert to canvas angle (0=right, PI/2=down)
  const canvasAngle = ((forceAngle - 90) * Math.PI) / 180

  const endX = x + Math.cos(canvasAngle) * arrowLen
  const endY = y + Math.sin(canvasAngle) * arrowLen

  ctx.save()
  // Arrow shaft
  ctx.strokeStyle = '#FBBF24'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  // Arrowhead
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
```

### Canvas Background

Dark field-like background matching app theme:

```js
function drawJukeBackground(ctx, w, h) {
  // Dark background
  ctx.fillStyle = '#1a2332'
  ctx.fillRect(0, 0, w, h)

  // Subtle center line (approach line)
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

  // Forward arrow at top
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('↑ FORWARD', w / 2, 16)
  ctx.restore()
}
```

### Action Type Visual Differentiation

Different `action` values get subtle visual cues on the footprint:

| Action | Visual |
|--------|--------|
| `stride` | Normal footprint |
| `plant` | Thicker border (3px), slight drop shadow |
| `push-off` | 2 small motion lines trailing behind the foot |
| `drag` | Dashed outline instead of solid |
| `shuffle` | Footprint rendered at 75% size |
| `pivot` | Small circular arrow drawn at foot center |
| `slide` | Footprint stretched 1.3x in movement direction |

---

## 5. Animation System

### JukeMoveAnimator Class

```js
// js/canvas/juke-animator.js

import { JUKE_MOVES, getAllSteps, getPhaseForStep } from '../juke-data.js'

const JUKE_SPEEDS = {
  game: 1.0,
  teach: 1.0, // uses teachDuration instead of duration
}

export class JukeMoveAnimator {
  constructor(canvas, moveId, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.move = JUKE_MOVES.find(m => m.id === moveId)
    this.steps = getAllSteps(this.move)
    this.options = {
      speedMode: 'teach', // 'game' | 'teach'
      ...options,
    }

    this._currentTime = 0
    this._isPlaying = false
    this._rafId = null
    this._lastTimestamp = null
    this._listeners = new Set()

    // Pre-compute timing
    this._computeTiming()
    this._computeScale()

    // Initial render
    this._render()
  }

  // ── Timing computation ──────────────────────────────────────────────

  _computeTiming() {
    const isTeach = this.options.speedMode === 'teach'
    this._stepTimings = [] // { stepNumber, startTime, endTime, step, phase }

    let time = 0.3 // initial pause before first step

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
      // Inter-phase pause
      time += isTeach ? 0.4 : 0.2
    }

    this._totalDuration = time + 0.5 // hold at end
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

  // ── Public API (mirrors PlayAnimator shape) ─────────────────────────

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
    const currentStep = this._getCurrentStepNumber()
    const next = this._stepTimings.find(t => t.stepNumber > currentStep)
    if (next) this.seekTo(next.startTime)
    else this.seekTo(this._totalDuration)
  }

  stepBackward() {
    const currentStep = this._getCurrentStepNumber()
    const prev = [...this._stepTimings].reverse().find(t => t.stepNumber < currentStep)
    if (prev) this.seekTo(prev.startTime)
    else this.seekTo(0)
  }

  setSpeedMode(mode) {
    const wasPlaying = this._isPlaying
    const currentStep = this._getCurrentStepNumber()
    this.pause()
    this.options.speedMode = mode
    this._computeTiming()
    // Seek to same step in new timing
    this.seekToStep(currentStep || 1)
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
    const currentTiming = this._getCurrentTiming()
    return {
      moveId: this.move.id,
      moveName: this.move.name,
      phase: currentTiming?.phase || 'ready',
      phaseDescription: currentTiming?.phaseDescription || '',
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

  // ── Internal: current step resolution ───────────────────────────────

  _getCurrentTiming() {
    // Find the step timing that contains current time, or the last one passed
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

  // ── Animation loop ─────────────────────────────────────────────────

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
      try { fn(state) } catch (e) { console.error('Juke animator listener error:', e) }
    }
  }

  // ── Rendering (called every frame) ─────────────────────────────────

  _render() {
    const ctx = this.ctx
    const dpr = window.devicePixelRatio || 1
    const w = Math.round(this.canvas.width / dpr)
    const h = Math.round(this.canvas.height / dpr)
    const t = this._currentTime

    if (!w || !h) return

    // Clear
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.restore()

    // Background
    drawJukeBackground(ctx, w, h)

    // Phase label at top
    const currentTiming = this._getCurrentTiming()
    if (currentTiming) {
      this._drawPhaseLabel(ctx, w, currentTiming.phase)
    }

    // Draw all footprints based on current time
    const currentStepNum = this._getCurrentStepNumber()

    for (const timing of this._stepTimings) {
      const step = timing.step
      const canvasPos = this._jukeToCanvas(step.position, w, h)

      if (timing.stepNumber > currentStepNum) {
        // Not yet placed — skip (invisible)
        continue
      }

      const isActive = timing.stepNumber === currentStepNum
      const state = isActive ? 'active' : 'placed'

      // Draw footprint
      drawFootprint(ctx, canvasPos.x, canvasPos.y, step.angle, step.foot, state, step.weight)

      // Emphasis pulse on active emphasized steps
      if (isActive && step.emphasis) {
        drawEmphasisPulse(ctx, canvasPos.x, canvasPos.y, step.foot, t * 1000)
      }

      // Force vector on active step only
      if (isActive && step.forceVector) {
        drawForceVector(ctx, canvasPos.x, canvasPos.y, step.forceVector.angle, step.forceVector.magnitude)
      }

      // Step number label
      ctx.save()
      ctx.fillStyle = isActive ? '#fff' : 'rgba(255,255,255,0.4)'
      ctx.font = `bold ${isActive ? '12' : '10'}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(step.stepNumber), canvasPos.x, canvasPos.y)
      ctx.restore()
    }
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

  _drawPhaseLabel(ctx, w, phaseName) {
    const label = phaseName.toUpperCase()
    ctx.save()
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
    const metrics = ctx.measureText(label)
    const pw = metrics.width + 24
    const ph = 28
    const px = (w - pw) / 2
    const py = 30

    ctx.fillStyle = 'rgba(233, 69, 96, 0.8)' // accent red
    ctx.beginPath()
    ctx.roundRect(px, py, pw, ph, 6)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, w / 2, py + ph / 2)
    ctx.restore()
  }
}
```

### Speed Modes

| Mode | Behavior |
|------|----------|
| **Game Speed** | Uses `step.duration` values (0.1-0.25s per step). Real-time feel. |
| **Teach Speed** | Uses `step.teachDuration` values (0.5-1.2s per step). Slow with inter-phase pauses (0.4s). Default mode. |

Speed mode doesn't multiply a base speed — it switches which duration field to read from the data. This is architecturally simpler and gives per-step control that the data already provides.

### Step Scrubber

Manual stepping via `seekToStep(n)`. The scrubber UI calls this. The animator doesn't auto-advance during scrubbing — user taps play or steps manually.

---

## 6. UI Component Breakdown

### Overall Layout (`juke-tutorial.js`)

```js
// js/views/juke-tutorial.js

import { el, clear, showToast } from '../utils/dom.js'
import { JUKE_MOVES, getPhaseForStep, getAllSteps } from '../juke-data.js'
import { JukeMoveAnimator } from '../canvas/juke-animator.js'

/**
 * Render juke tutorial overlay into the practice view outlet.
 * @param {HTMLElement} outlet - the #app-root element
 * @param {Object} options
 * @param {string} [options.initialMoveId] - pre-selected move
 * @param {Function} options.onClose - callback to close overlay
 * @returns {Function} cleanup function
 */
export function renderJukeTutorial(outlet, options = {}) {
  const { initialMoveId = 'cut-juke', onClose } = options

  let animator = null
  let selectedMoveId = initialMoveId
  let showCoachingPanel = false
  let showMistakes = false

  function render() {
    clear(outlet)
    const container = el('div', { className: 'jk-overlay' })

    // Header
    container.appendChild(renderHeader())

    // Move selector
    container.appendChild(renderMoveSelector())

    // Canvas
    const canvasWrap = el('div', { className: 'jk-canvas-wrap' })
    const canvas = el('canvas', { className: 'jk-canvas' })
    canvasWrap.appendChild(canvas)
    container.appendChild(canvasWrap)

    // Phase + step indicator
    container.appendChild(renderStepIndicator())

    // Playback controls
    container.appendChild(renderControls())

    // Coaching panel (collapsible)
    container.appendChild(renderCoachingPanel())

    outlet.appendChild(container)

    // Init animator after DOM layout
    requestAnimationFrame(() => initAnimator(canvas, canvasWrap))
  }

  function renderHeader() {
    return el('div', { className: 'jk-header' }, [
      el('button', {
        className: 'btn btn-sm btn-ghost',
        textContent: '← Back',
        onClick: () => {
          cleanup()
          onClose()
        },
      }),
      el('span', { className: 'jk-title', textContent: '🏃 Juke Move Tutorial' }),
    ])
  }

  function renderMoveSelector() {
    return el('div', { className: 'jk-move-selector' },
      JUKE_MOVES.map(move =>
        el('button', {
          className: `jk-move-btn${move.id === selectedMoveId ? ' active' : ''}`,
          textContent: move.name,
          onClick: () => {
            selectedMoveId = move.id
            if (animator) animator.setMove(move.id)
            render()
          },
        })
      )
    )
  }

  function renderStepIndicator() {
    const move = JUKE_MOVES.find(m => m.id === selectedMoveId)
    const state = animator?.getState()
    const currentStep = state?.currentStep || 0

    const dots = el('div', { className: 'jk-step-dots' })
    for (let i = 1; i <= move.totalSteps; i++) {
      dots.appendChild(el('button', {
        className: `jk-dot${i < currentStep ? ' done' : i === currentStep ? ' current' : ''}`,
        textContent: String(i),
        onClick: () => animator?.seekToStep(i),
      }))
    }

    const phase = state?.phase || ''
    const phaseDesc = state?.phaseDescription || ''

    return el('div', { className: 'jk-step-area' }, [
      el('div', { className: 'jk-phase-label', textContent: phase.toUpperCase() }),
      el('div', { className: 'jk-phase-desc', textContent: phaseDesc }),
      dots,
    ])
  }

  function renderControls() {
    const state = animator?.getState()
    const isPlaying = state?.isPlaying || false
    const speedMode = state?.speedMode || 'teach'

    return el('div', { className: 'jk-controls' }, [
      // Step back
      el('button', {
        className: 'btn btn-sm jk-ctrl-btn',
        textContent: '⏮',
        onClick: () => animator?.stepBackward(),
      }),
      // Play/Pause
      el('button', {
        className: 'btn btn-primary jk-ctrl-btn jk-play-btn',
        textContent: isPlaying ? '⏸ Pause' : '▶ Play',
        onClick: () => {
          if (isPlaying) animator?.pause()
          else animator?.play()
        },
      }),
      // Step forward
      el('button', {
        className: 'btn btn-sm jk-ctrl-btn',
        textContent: '⏭',
        onClick: () => animator?.stepForward(),
      }),
      // Reset
      el('button', {
        className: 'btn btn-sm btn-ghost jk-ctrl-btn',
        textContent: '↺',
        onClick: () => animator?.reset(),
      }),
      // Speed toggle
      el('button', {
        className: `btn btn-sm jk-speed-btn ${speedMode === 'teach' ? 'teach' : 'game'}`,
        textContent: speedMode === 'teach' ? '🐢 Teach' : '🏃 Game',
        onClick: () => {
          const newMode = speedMode === 'teach' ? 'game' : 'teach'
          animator?.setSpeedMode(newMode)
        },
      }),
    ])
  }

  function renderCoachingPanel() {
    const move = JUKE_MOVES.find(m => m.id === selectedMoveId)
    const state = animator?.getState()
    const currentStep = state?.currentStep || 0
    const step = getAllSteps(move).find(s => s.stepNumber === currentStep)

    const panel = el('div', { className: 'jk-coaching' })

    // Per-step coaching info
    if (step) {
      const items = []
      if (step.armPosition) items.push(`💪 Arms: ${step.armPosition}`)
      if (step.headDirection) items.push(`👀 Head: ${step.headDirection}`)
      if (step.shoulderFake) items.push(`🏈 Shoulder fake: ${step.shoulderFake}`)
      if (step.action) items.push(`🦶 Action: ${step.action}`)
      if (step.weight > 0.7) items.push(`⚡ Weight: ${Math.round(step.weight * 100)}% — HEAVY`)

      if (items.length > 0) {
        panel.appendChild(el('div', { className: 'jk-step-cues' },
          items.map(item => el('div', { className: 'jk-cue', textContent: item }))
        ))
      }
    }

    // Coaching cues (collapsible)
    panel.appendChild(el('div', {
      className: 'jk-section-header',
      onClick: () => { showCoachingPanel = !showCoachingPanel; render() },
    }, [
      el('span', { textContent: '🎯 Coaching Cues' }),
      el('span', { textContent: showCoachingPanel ? '▾' : '▸' }),
    ]))

    if (showCoachingPanel) {
      panel.appendChild(el('ul', { className: 'jk-cue-list' },
        move.coachingCues.map(cue => el('li', { textContent: cue }))
      ))
    }

    // Common mistakes (collapsible)
    panel.appendChild(el('div', {
      className: 'jk-section-header',
      onClick: () => { showMistakes = !showMistakes; render() },
    }, [
      el('span', { textContent: '⚠️ Common Mistakes' }),
      el('span', { textContent: showMistakes ? '▾' : '▸' }),
    ]))

    if (showMistakes) {
      panel.appendChild(el('ul', { className: 'jk-mistake-list' },
        move.commonMistakes.map(m => el('li', { textContent: m }))
      ))
    }

    return panel
  }

  // ── Animator init ───────────────────────────────────────────────────

  function initAnimator(canvas, canvasWrap) {
    const dpr = window.devicePixelRatio || 1
    const cssW = canvasWrap.offsetWidth || 360
    const cssH = Math.round(cssW * 1.5) // 2:3 aspect ratio

    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    canvas.style.width = cssW + 'px'
    canvas.style.height = cssH + 'px'

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (animator) animator.destroy()
    animator = new JukeMoveAnimator(canvas, selectedMoveId, {
      speedMode: 'teach',
    })

    // Light re-render of UI on state change (update controls/step indicator)
    // Use targeted DOM updates instead of full render to avoid canvas flicker
    animator.onStateChange(state => {
      updateStepIndicatorDOM(state)
      updateControlsDOM(state)
      updateCoachingStepDOM(state)
    })
  }

  // ── Targeted DOM updates (no full re-render) ───────────────────────

  function updateStepIndicatorDOM(state) {
    const dots = outlet.querySelectorAll('.jk-dot')
    dots.forEach((dot, i) => {
      const stepNum = i + 1
      dot.className = `jk-dot${stepNum < state.currentStep ? ' done' : stepNum === state.currentStep ? ' current' : ''}`
    })
    const phaseLabel = outlet.querySelector('.jk-phase-label')
    const phaseDesc = outlet.querySelector('.jk-phase-desc')
    if (phaseLabel) phaseLabel.textContent = (state.phase || '').toUpperCase()
    if (phaseDesc) phaseDesc.textContent = state.phaseDescription || ''
  }

  function updateControlsDOM(state) {
    const playBtn = outlet.querySelector('.jk-play-btn')
    if (playBtn) playBtn.textContent = state.isPlaying ? '⏸ Pause' : '▶ Play'
  }

  function updateCoachingStepDOM(state) {
    // Update the per-step coaching cues without full re-render
    const cuesEl = outlet.querySelector('.jk-step-cues')
    if (!cuesEl) return
    const move = JUKE_MOVES.find(m => m.id === state.moveId)
    const step = getAllSteps(move).find(s => s.stepNumber === state.currentStep)
    if (!step) { cuesEl.innerHTML = ''; return }

    const items = []
    if (step.armPosition) items.push(`💪 Arms: ${step.armPosition}`)
    if (step.headDirection) items.push(`👀 Head: ${step.headDirection}`)
    if (step.shoulderFake) items.push(`🏈 Shoulder fake: ${step.shoulderFake}`)
    if (step.action) items.push(`🦶 Action: ${step.action}`)
    if (step.weight > 0.7) items.push(`⚡ Weight: ${Math.round(step.weight * 100)}% — HEAVY`)

    cuesEl.innerHTML = ''
    items.forEach(item => {
      cuesEl.appendChild(el('div', { className: 'jk-cue', textContent: item }))
    })
  }

  // ── Resize handling ─────────────────────────────────────────────────

  function onResize() {
    const canvas = outlet.querySelector('.jk-canvas')
    const canvasWrap = outlet.querySelector('.jk-canvas-wrap')
    if (canvas && canvasWrap) initAnimator(canvas, canvasWrap)
  }

  window.addEventListener('resize', onResize)

  // ── Cleanup ─────────────────────────────────────────────────────────

  function cleanup() {
    if (animator) animator.destroy()
    window.removeEventListener('resize', onResize)
  }

  render()

  return cleanup
}
```

### Key UI Decisions

1. **Full re-render only on move change / panel toggle.** During playback, use targeted DOM updates for step indicator, controls, and coaching cues. This avoids recreating the canvas (which would kill the animation).

2. **Coaching cues update per-step.** As the animation plays, the coaching panel shows contextual info for the current step (arm position, head direction, etc). Coaching cues and common mistakes lists are static per-move and collapsible.

3. **Step dots are clickable.** Tapping a step dot seeks the animator to that step — acts as a manual scrubber.

---

## 7. Integration with Practice Drills

### Drill Library Changes

Add `jukeRelated` array to evasion drills that have relevant juke moves:

```js
// In drill-library.js, modify existing evasion drills:

{
  id: 'mirror-dodge',
  // ... existing fields ...
  jukeRelated: ['cut-juke', 'drop', 'shimmy'],  // ← NEW
},
{
  id: 'gauntlet-run',
  jukeRelated: ['cut-juke', 'drop', 'get-skinny', 'speed-change', 'shimmy', 'spin'],
},
{
  id: '1v1-open-field',
  jukeRelated: ['cut-juke', 'drop', 'shimmy', 'spin'],
},
{
  id: 'cone-weave-relay',
  jukeRelated: ['cut-juke', 'get-skinny'],
},
{
  id: 'juke-relay',
  jukeRelated: ['cut-juke', 'drop', 'shimmy', 'spin'],
},
{
  id: 'follow-the-leader',
  jukeRelated: ['cut-juke', 'drop', 'speed-change'],
},
{
  id: 'sharks-and-minnows',
  jukeRelated: ['cut-juke', 'drop', 'shimmy', 'spin'],
},
```

### Practice View Integration

In `practice.js`, two touch points:

#### 1. Evasion drill expanded detail — "View Juke Moves" button

In `renderBlockDetail()`, after coaching points, if the drill has `jukeRelated`:

```js
// In renderBlockDetail(), after coaching points section:
if (drill && drill.jukeRelated && drill.jukeRelated.length > 0) {
  detail.appendChild(el('button', {
    className: 'btn btn-sm jk-trigger-btn',
    textContent: '🏃 View Juke Techniques',
    onClick: () => {
      showJukeOverlay = true
      jukeInitialMoveId = drill.jukeRelated[0]
      render()
    },
  }))
}
```

#### 2. Standalone entry card at bottom of builder

```js
// In renderBuilderView(), after saved plans section:
container.appendChild(el('div', {
  className: 'card jk-entry-card',
  onClick: () => {
    showJukeOverlay = true
    jukeInitialMoveId = 'cut-juke'
    render()
  },
}, [
  el('div', { className: 'jk-entry-icon', textContent: '🏃' }),
  el('div', {}, [
    el('div', { className: 'jk-entry-title', textContent: 'Juke Move Tutorials' }),
    el('div', { className: 'jk-entry-desc', textContent: '6 animated evasion techniques' }),
  ]),
]))
```

#### 3. Practice view overlay dispatch

Add to the `render()` function in practice.js:

```js
function render() {
  clear(outlet)

  // Juke overlay takes priority
  if (showJukeOverlay) {
    jukeCleanup = renderJukeTutorial(outlet, {
      initialMoveId: jukeInitialMoveId,
      onClose: () => {
        showJukeOverlay = false
        jukeCleanup = null
        render()
      },
    })
    return
  }

  // ... existing builder/run dispatch ...
}
```

And in the cleanup function:

```js
return () => {
  stopTimer()
  unsubscribe()
  if (jukeCleanup) jukeCleanup()
}
```

---

## 8. Store Additions

### Minimal — preferences only

The juke feature doesn't need persistent state beyond a speed mode preference. Using the existing `preferences` object with `Object.assign` merge:

```js
// No new store fields needed — use local closure state in the view

// Optionally persist speed preference:
store.set({ preferences: { jukeSpeedMode: 'teach' } })
// Retrieved as:
const speedMode = store.get().preferences.jukeSpeedMode || 'teach'
```

This is optional. The speed mode could just default to 'teach' every time (which is fine for a teaching tool). If we do persist it, it's one line using the existing store API.

### No localStorage key changes

The existing `pb_preferences` key handles this via the shallow merge behavior. No migration needed.

---

## 9. CSS Plan

### Prefix Convention: `jk-`

All juke tutorial classes use the `jk-` prefix to namespace them.

### Key Classes

```css
/* ═══════════════════════════════════════════════════════════════════════════
   Juke Move Tutorial — Phase 7
   ═══════════════════════════════════════════════════════════════════════════ */

/* Overlay container (same pattern as pp-overlay) */
.jk-overlay {
  padding: 0;
}

/* Header */
.jk-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}
.jk-title {
  font-weight: 600;
  font-size: 16px;
}

/* Move selector — horizontal scroll on mobile */
.jk-move-selector {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 8px 0;
  -webkit-overflow-scrolling: touch;
}
.jk-move-btn {
  background: #0d1b36;
  color: #e0e0e0;
  border: 1px solid #0f3460;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  min-height: 36px;
}
.jk-move-btn.active {
  background: #e94560;
  color: #fff;
  border-color: #e94560;
}

/* Canvas container */
.jk-canvas-wrap {
  width: 100%;
  max-width: 400px;
  margin: 8px auto;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #0f3460;
}
.jk-canvas {
  display: block;
  width: 100%;
}

/* Step indicator area */
.jk-step-area {
  text-align: center;
  padding: 8px 0;
}
.jk-phase-label {
  font-weight: 700;
  font-size: 14px;
  color: #e94560;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.jk-phase-desc {
  font-size: 12px;
  color: #888;
  margin: 2px 0 8px;
}

/* Step dots (clickable) */
.jk-step-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.jk-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #0f3460;
  background: #0d1b36;
  color: #666;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.jk-dot.done {
  background: #0f3460;
  color: #e0e0e0;
  border-color: #3B82F6;
}
.jk-dot.current {
  background: #e94560;
  color: #fff;
  border-color: #e94560;
  transform: scale(1.15);
}

/* Playback controls */
.jk-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
}
.jk-ctrl-btn {
  min-width: 44px;
  min-height: 44px;
}
.jk-play-btn {
  min-width: 100px;
}
.jk-speed-btn {
  font-size: 12px;
  min-width: 80px;
}
.jk-speed-btn.teach {
  background: #0f3460;
}
.jk-speed-btn.game {
  background: #f59e0b;
  color: #000;
}

/* Coaching panel */
.jk-coaching {
  padding: 8px 0;
}
.jk-step-cues {
  background: #0d1b36;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.jk-cue {
  font-size: 13px;
  color: #e0e0e0;
  padding: 2px 0;
}
.jk-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #aaa;
  border-top: 1px solid #0f346033;
}
.jk-cue-list, .jk-mistake-list {
  padding-left: 20px;
  margin: 0 0 8px;
}
.jk-cue-list li, .jk-mistake-list li {
  font-size: 13px;
  color: #ccc;
  margin-bottom: 4px;
  line-height: 1.4;
}
.jk-mistake-list li {
  color: #f59e0b;
}

/* Entry card in practice builder */
.jk-entry-card {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-top: 12px;
}
.jk-entry-card:hover {
  border-color: #e94560;
}
.jk-entry-icon {
  font-size: 32px;
}
.jk-entry-title {
  font-weight: 600;
  font-size: 15px;
}
.jk-entry-desc {
  font-size: 12px;
  color: #888;
}

/* Trigger button in drill detail */
.jk-trigger-btn {
  margin-top: 8px;
  background: #f59e0b22;
  color: #f59e0b;
  border: 1px solid #f59e0b44;
}

/* ── Mobile ── */
@media (max-width: 480px) {
  .jk-move-selector {
    gap: 4px;
  }
  .jk-move-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
  .jk-canvas-wrap {
    max-width: 100%;
  }
  .jk-dot {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }
}
```

### Responsive Considerations

- **Move selector** uses `overflow-x: auto` for horizontal scrolling — 6 buttons fit on most screens but scroll on narrow ones
- **Canvas** uses `max-width: 400px` centered on desktop, 100% on mobile
- **Controls** use 44px minimum touch targets per v2 guidelines
- **Step dots** shrink slightly on mobile (24px vs 28px)

---

## 10. Implementation Order

### Phase 1: Data + Canvas Core (build first, test in isolation)

1. **`js/juke-data.js`** — Convert JSON to ES module. Add helper functions. (~30 min)
2. **`js/canvas/juke-animator.js`** — Core class: timing computation, footprint rendering, background, rAF loop. Start with just `drawFootprint` (rectangles are fine initially) and step-through logic. (~2 hours)
3. **Test in browser console** — Temporarily mount a canvas and create an animator to verify rendering works.

### Phase 2: UI Shell

4. **`js/views/juke-tutorial.js`** — Overlay layout, move selector, basic controls, step dots. Wire up animator. (~1.5 hours)
5. **`css/app.css`** — Add all `jk-*` styles. (~30 min)

### Phase 3: Integration

6. **`js/views/practice.js`** — Add overlay dispatch, trigger buttons, standalone entry card. (~30 min)
7. **`js/drill-library.js`** — Add `jukeRelated` arrays to evasion drills. (~10 min)

### Phase 4: Polish

8. **Force vectors** — Add arrow rendering to juke-animator
9. **Emphasis pulses** — Add pulsing glow effect for emphasis steps
10. **Action type visuals** — Differentiated footprint shapes per action type
11. **Per-step coaching cues** — Dynamic coaching panel updates
12. **Speed mode toggle** — Ensure teach ↔ game switching works cleanly

### Phase 5: Edge Cases

13. **Resize handling** — Reinitialize canvas on window resize
14. **Cleanup** — Verify animator.destroy() is called on navigation away
15. **Service worker** — Add new files to sw.js cache list

### Dependencies

```
juke-data.js (no deps)
    ↓
juke-animator.js (depends on juke-data.js)
    ↓
juke-tutorial.js (depends on juke-animator.js, juke-data.js, dom.js)
    ↓
practice.js modifications (depends on juke-tutorial.js, drill-library.js changes)
```

---

## 11. Risk Areas

### 1. Canvas Performance During Coaching Panel Updates (Medium Risk)

The `onStateChange` callback fires ~60 times per second during playback. The targeted DOM update functions (`updateStepIndicatorDOM`, `updateControlsDOM`, `updateCoachingStepDOM`) must be lightweight. They query specific elements and update text content — this should be fine, but watch for layout thrashing if the coaching panel content changes size mid-animation.

**Mitigation:** Only update coaching step cues when `currentStep` actually changes (compare to last value). Don't update on every frame.

```js
let lastRenderedStep = 0
animator.onStateChange(state => {
  if (state.currentStep !== lastRenderedStep) {
    lastRenderedStep = state.currentStep
    updateStepIndicatorDOM(state)
    updateCoachingStepDOM(state)
  }
  updateControlsDOM(state) // play/pause only — always cheap
})
```

### 2. Footprint Shape Quality (Low-Medium Risk)

The bezier-curve footprint shape may look weird at certain angles/scales. The foot shape code needs visual iteration.

**Mitigation:** Start with simple ovals (easy to get right), iterate to shoe-sole shapes after core logic works. Fallback is ovals that still look good.

### 3. Canvas Sizing on Portrait vs Landscape (Low Risk)

The 2:3 portrait canvas works great on mobile but may look tall on desktop/landscape. Max-width 400px constrains it.

**Mitigation:** Already handled by `max-width: 400px; margin: auto`. On landscape tablets, the canvas will be a centered column with coaching content below — acceptable.

### 4. Coordinate System Y-Flip (Medium Risk)

The juke data has Y-axis going up (forward = positive Y), but canvas Y goes down. The `_jukeToCanvas` function handles this with `y = h - padding - (pos.y - yMin) * scale`. This inversion must be applied consistently to foot angles too — a clockwise rotation in data space becomes counter-clockwise on canvas.

**Mitigation:** The `drawFootprint` function already handles this with `ctx.rotate((-angle * Math.PI) / 180)` (note the negative sign). Test with the spin move (360° rotation) to validate.

### 5. Speed Mode Switching Mid-Animation (Low Risk)

Switching from teach to game speed recalculates all timings. The current implementation seeks to the same step number in the new timing, which should feel natural.

**Mitigation:** The `setSpeedMode` method pauses, recomputes, seeks to current step, then optionally resumes. This is atomic and avoids timing glitches.

### 6. Service Worker Cache (Low Risk)

New JS files won't be cached until `sw.js` is updated with new file list.

**Mitigation:** Add all 3 new files to the SW cache array and bump the cache version string.

---

## Appendix: Move Quick Reference

| ID | Name | Steps | Phases | Key Visual |
|----|------|-------|--------|-----------|
| `cut-juke` | Cut / Juke | 6 | approach → fake → plant → cut → acceleration | Sharp direction change, shoulder fake |
| `drop` | Drop | 5 | approach → drop → redirect → acceleration | Dead leg drag, shoulder dip |
| `get-skinny` | Get Skinny | 5 | approach → rotate → slip-through → acceleration | Body rotation, narrow profile |
| `speed-change` | Speed Change | 6 | approach → deceleration → explosion | Shuffle to sprint, dramatic speed contrast |
| `shimmy` | Shimmy | 7 | approach → shimmy → burst | Rapid side-to-side shuffles, most steps |
| `spin` | Spin | 5 | approach → plant → spin → acceleration | 360° pivot, stationary foot |

---

*End of plan. Ready for builder agent.*
