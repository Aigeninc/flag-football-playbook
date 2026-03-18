// views/juke-tutorial.js — Juke Move Tutorial overlay
// Rendered inside practice view as an overlay panel

import { el, clear, showToast } from '../utils/dom.js'
import { JUKE_MOVES, getAllSteps } from '../juke-data.js'
import { JukeMoveAnimator } from '../canvas/juke-animator.js'

/**
 * Render juke tutorial overlay.
 * @param {HTMLElement} outlet
 * @param {Object} options
 * @param {string} [options.initialMoveId='cut-juke']
 * @param {Function} options.onClose
 * @returns {Function} cleanup
 */
export function renderJukeTutorial(outlet, options = {}) {
  const { initialMoveId = 'cut-juke', onClose } = options

  let animator = null
  let selectedMoveId = initialMoveId
  let showCoachingPanel = false
  let showMistakes = false
  let lastRenderedStep = 0

  function render() {
    clear(outlet)
    const container = el('div', { className: 'jk-overlay' })

    // Header
    container.appendChild(el('div', { className: 'jk-header' }, [
      el('button', {
        className: 'btn btn-sm btn-ghost',
        textContent: '← Back',
        onClick: () => { cleanup(); onClose() },
      }),
      el('span', { className: 'jk-title', textContent: '🏃 Juke Move Tutorial' }),
    ]))

    // Move selector
    container.appendChild(el('div', { className: 'jk-move-selector' },
      JUKE_MOVES.map(move =>
        el('button', {
          className: `jk-move-btn${move.id === selectedMoveId ? ' active' : ''}`,
          textContent: move.name,
          onClick: () => {
            selectedMoveId = move.id
            if (animator) animator.setMove(move.id)
            lastRenderedStep = 0
            render()
          },
        })
      )
    ))

    // Canvas
    const canvasWrap = el('div', { className: 'jk-canvas-wrap' })
    const canvas = el('canvas', { className: 'jk-canvas' })
    canvasWrap.appendChild(canvas)
    container.appendChild(canvasWrap)

    // Step indicator
    container.appendChild(renderStepIndicator())

    // Controls
    container.appendChild(renderControls())

    // Coaching
    container.appendChild(renderCoachingPanel())

    outlet.appendChild(container)

    requestAnimationFrame(() => initAnimator(canvas, canvasWrap))
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

    return el('div', { className: 'jk-step-area' }, [
      el('div', { className: 'jk-phase-label', textContent: (state?.phase || '').toUpperCase() }),
      el('div', { className: 'jk-phase-desc', textContent: state?.phaseDescription || '' }),
      dots,
    ])
  }

  function renderControls() {
    const state = animator?.getState()
    const isPlaying = state?.isPlaying || false
    const speedMode = state?.speedMode || 'teach'

    return el('div', { className: 'jk-controls' }, [
      el('button', {
        className: 'btn btn-sm jk-ctrl-btn',
        textContent: '⏮',
        onClick: () => animator?.stepBackward(),
      }),
      el('button', {
        className: 'btn btn-primary jk-ctrl-btn jk-play-btn',
        textContent: isPlaying ? '⏸ Pause' : '▶ Play',
        onClick: () => {
          if (isPlaying) animator?.pause()
          else animator?.play()
        },
      }),
      el('button', {
        className: 'btn btn-sm jk-ctrl-btn',
        textContent: '⏭',
        onClick: () => animator?.stepForward(),
      }),
      el('button', {
        className: 'btn btn-sm btn-ghost jk-ctrl-btn',
        textContent: '↺',
        onClick: () => animator?.reset(),
      }),
      el('button', {
        className: `btn btn-sm jk-speed-btn ${speedMode === 'teach' ? 'teach' : 'game'}`,
        textContent: speedMode === 'teach' ? '🐢 Teach' : '🏃 Game',
        onClick: () => {
          animator?.setSpeedMode(speedMode === 'teach' ? 'game' : 'teach')
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

    // Per-step cues
    if (step) {
      const items = []
      if (step.armPosition) items.push(`💪 Arms: ${step.armPosition}`)
      if (step.headDirection) items.push(`👀 Head: ${step.headDirection}`)
      if (step.shoulderFake) items.push(`🏈 Shoulder: ${step.shoulderFake}`)
      if (step.action) items.push(`🦶 Action: ${step.action}`)
      if (step.weight > 0.7) items.push(`⚡ Weight: ${Math.round(step.weight * 100)}% — HEAVY`)

      if (items.length > 0) {
        panel.appendChild(el('div', { className: 'jk-step-cues' },
          items.map(item => el('div', { className: 'jk-cue', textContent: item }))
        ))
      }
    }

    // Coaching cues
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

    // Common mistakes
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

  // ── Animator ────────────────────────────────────────────────────────────

  function initAnimator(canvas, canvasWrap) {
    const dpr = window.devicePixelRatio || 1
    const cssW = canvasWrap.offsetWidth || 360
    const cssH = Math.round(cssW * 1.5)

    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    canvas.style.width = cssW + 'px'
    canvas.style.height = cssH + 'px'

    if (animator) animator.destroy()
    animator = new JukeMoveAnimator(canvas, selectedMoveId, {
      speedMode: 'teach',
    })

    animator.onStateChange(state => {
      if (state.currentStep !== lastRenderedStep) {
        lastRenderedStep = state.currentStep
        updateStepIndicatorDOM(state)
        updateCoachingStepDOM(state)
      }
      updateControlsDOM(state)
    })
  }

  // ── Targeted DOM updates ────────────────────────────────────────────────

  function updateStepIndicatorDOM(state) {
    const dots = outlet.querySelectorAll('.jk-dot')
    dots.forEach((dot, i) => {
      const n = i + 1
      dot.className = `jk-dot${n < state.currentStep ? ' done' : n === state.currentStep ? ' current' : ''}`
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
    const cuesEl = outlet.querySelector('.jk-step-cues')
    if (!cuesEl) return
    const move = JUKE_MOVES.find(m => m.id === state.moveId)
    const step = getAllSteps(move).find(s => s.stepNumber === state.currentStep)
    if (!step) { cuesEl.innerHTML = ''; return }

    const items = []
    if (step.armPosition) items.push(`💪 Arms: ${step.armPosition}`)
    if (step.headDirection) items.push(`👀 Head: ${step.headDirection}`)
    if (step.shoulderFake) items.push(`🏈 Shoulder: ${step.shoulderFake}`)
    if (step.action) items.push(`🦶 Action: ${step.action}`)
    if (step.weight > 0.7) items.push(`⚡ Weight: ${Math.round(step.weight * 100)}% — HEAVY`)

    cuesEl.innerHTML = ''
    items.forEach(item => {
      cuesEl.appendChild(el('div', { className: 'jk-cue', textContent: item }))
    })
  }

  // ── Resize ──────────────────────────────────────────────────────────────

  function onResize() {
    const canvas = outlet.querySelector('.jk-canvas')
    const canvasWrap = outlet.querySelector('.jk-canvas-wrap')
    if (canvas && canvasWrap) initAnimator(canvas, canvasWrap)
  }

  window.addEventListener('resize', onResize)

  // ── Cleanup ─────────────────────────────────────────────────────────────

  function cleanup() {
    if (animator) animator.destroy()
    window.removeEventListener('resize', onResize)
  }

  render()
  return cleanup
}
