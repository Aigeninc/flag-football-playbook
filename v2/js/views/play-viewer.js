import { el, clear } from '../utils/dom.js'
import { getPlay } from '../play-library.js'
import { PlayAnimator, SPEEDS } from '../canvas/animator.js'

export function playViewerView(params, outlet) {
  clear(outlet)
  const playId = params.id || 'unknown'
  const play = getPlay(playId)

  if (!play) {
    outlet.appendChild(el('div', { className: 'card' }, [
      el('h1', { textContent: `❌ Play not found: ${playId}`, style: { marginBottom: '8px' } }),
      el('a', { href: '#/library', textContent: '← Back to Library', style: { color: '#e94560' } }),
    ]))
    return
  }

  const store = window.__store
  const rosterMap = store ? store.getRosterMap() : {}
  const prefs = store ? store.get().preferences : {}

  let animator = null

  // ── Header ──────────────────────────────────────────────────────────────
  const header = el('div', { style: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' } }, [
    el('a', { href: '#/library', textContent: '← Back', style: { color: '#e94560', textDecoration: 'none' } }),
    el('h1', { textContent: `${play.isRunPlay ? '🏃' : '🎯'} ${play.name}`, style: { margin: '0', fontSize: '20px' } }),
    el('span', { className: 'position-badge pos-qb', textContent: play.formation }),
  ])

  const tags = el('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' } },
    play.tags.map(t => el('span', { className: 'tag-badge', textContent: t }))
  )

  // ── Canvas ──────────────────────────────────────────────────────────────
  const canvasWrap = el('div', {
    style: { width: '100%', maxWidth: '720px', aspectRatio: '5 / 6', position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#2d5a27' },
  })
  const canvas = el('canvas', {
    width: 720, height: 480,
    style: { width: '100%', height: '100%', display: 'block', cursor: 'pointer' },
  })
  canvasWrap.appendChild(canvas)

  // Tap canvas to toggle play/pause
  canvas.addEventListener('click', () => {
    if (!animator) return
    animator.getState().isPlaying ? animator.pause() : animator.play()
  })

  // ── Controls ────────────────────────────────────────────────────────────
  const playBtn = el('button', {
    className: 'anim-btn anim-btn-play',
    textContent: '▶ Play',
  })
  // Wire click DIRECTLY on the raw DOM element
  playBtn.onclick = function() {
    if (!animator) return
    const s = animator.getState()
    if (s.isPlaying) animator.pause()
    else animator.play()
  }
  const resetBtn = el('button', { className: 'anim-btn', textContent: '⏮',
    onClick: () => animator && animator.reset(),
  })
  const stepBtn = el('button', { className: 'anim-btn', textContent: '⏭',
    onClick: () => animator && animator.stepForward(),
  })
  const timeLabel = el('span', { className: 'anim-time', textContent: '0.0s / 0.0s' })

  const progressFill = el('div', { className: 'progress-bar-fill' })
  const progressBar = el('div', { className: 'progress-bar' }, [progressFill])

  // Progress bar seeking
  function seekFromEvent(e) {
    if (!animator) return
    const rect = progressBar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    animator.seekTo(pct * animator.getState().totalDuration)
  }
  let dragging = false
  progressBar.addEventListener('mousedown', e => { dragging = true; seekFromEvent(e) })
  document.addEventListener('mousemove', e => { if (dragging) seekFromEvent(e) })
  document.addEventListener('mouseup', () => { dragging = false })
  progressBar.addEventListener('touchstart', e => { seekFromEvent(e.touches[0]) }, { passive: true })
  progressBar.addEventListener('touchmove', e => { seekFromEvent(e.touches[0]) }, { passive: true })

  const controlsRow = el('div', { className: 'anim-controls-row' }, [
    resetBtn, playBtn, stepBtn, progressBar, timeLabel,
  ])

  // Speed buttons
  const speedNames = { teaching: '🐢 Teaching', walkthrough: '🚶 Walk', full: '🏃 Full', fast: '⚡ Fast' }
  const speedBtns = {}
  const activeSpeed = prefs.speed || 'full'

  const speedRow = el('div', { className: 'speed-selector' },
    Object.entries(speedNames).map(([key, label]) => {
      const btn = el('button', {
        className: `speed-btn ${key === activeSpeed ? 'active' : ''}`,
        textContent: label,
        onClick: () => {
          if (!animator) return
          animator.setSpeed(key)
          Object.values(speedBtns).forEach(b => b.classList.remove('active'))
          btn.classList.add('active')
          if (store) store.set({ preferences: { speed: key } })
        },
      })
      speedBtns[key] = btn
      return btn
    })
  )

  // Toggle controls
  function makeToggle(label, key, initial) {
    const cb = el('input', { type: 'checkbox' })
    cb.checked = initial
    cb.addEventListener('change', () => {
      if (!animator) return
      animator.updateOptions({ [key]: cb.checked })
      if (store) store.set({ preferences: { [key]: cb.checked } })
    })
    return el('label', { className: 'toggle-item' }, [cb, ` ${label}`])
  }

  const toggleDefense = makeToggle('Defense', 'showDefense', prefs.showDefense !== false)
  const toggleBall = makeToggle('Ball', 'showBall', prefs.showBall !== false)
  const toggleReads = makeToggle('Read #s', 'showReadNumbers', prefs.showReadNumbers !== false)
  const toggleRoutes = makeToggle('Routes', 'showAllRoutes', prefs.showAllRoutes !== false)

  // Highlight dropdown
  const highlightSelect = el('select', { className: 'input', style: { width: 'auto', minWidth: '120px', padding: '6px 28px 6px 8px', fontSize: '13px' } })
  highlightSelect.appendChild(el('option', { value: '', textContent: 'Highlight: None' }))
  for (const pos of Object.keys(play.positions)) {
    highlightSelect.appendChild(el('option', { value: pos, textContent: pos }))
  }
  highlightSelect.value = prefs.highlightPosition || ''
  highlightSelect.addEventListener('change', () => {
    const val = highlightSelect.value || null
    if (animator) animator.updateOptions({ highlightPosition: val })
    if (store) store.set({ preferences: { highlightPosition: val } })
  })

  const toggleRow = el('div', { className: 'toggle-group' }, [
    toggleDefense, toggleBall, toggleReads, toggleRoutes, highlightSelect,
  ])

  // QB tip
  const qbTip = el('div', { className: 'qb-tip hidden' })
  if (!play.isRunPlay && play.qbLook) {
    qbTip.textContent = `💡 "${play.qbLook.tip}"`
    qbTip.classList.remove('hidden')
  }

  // ── Description & QB Read Cards ─────────────────────────────────────────
  const descCard = el('div', { className: 'card' }, [
    el('h3', { textContent: 'Description', style: { marginBottom: '8px', color: '#e94560' } }),
    play.description ? el('div', {}, [
      el('p', { style: { marginBottom: '8px' }, textContent: '🎭 ' + play.description.fake }),
      el('p', { textContent: '→ ' + play.description.target }),
    ]) : el('p', { textContent: 'No description available', style: { color: '#888' } }),
  ])

  let qbLookCard = null
  if (!play.isRunPlay && play.qbLook) {
    qbLookCard = el('div', { className: 'card' }, [
      el('h3', { textContent: '📋 QB Read', style: { marginBottom: '8px', color: '#e94560' } }),
      el('p', { textContent: `👀 Eyes: ${play.qbLook.eyes}  🎯 Throw: ${play.qbLook.throw}`, style: { marginBottom: '4px' } }),
      el('p', { textContent: `💡 ${play.qbLook.tip}`, style: { color: '#888', fontStyle: 'italic' } }),
    ])
  }

  // ── Assemble ────────────────────────────────────────────────────────────
  const animContainer = el('div', { className: 'anim-container' }, [
    canvasWrap, controlsRow, speedRow, toggleRow, qbTip,
  ])

  outlet.appendChild(header)
  outlet.appendChild(tags)
  outlet.appendChild(animContainer)
  outlet.appendChild(descCard)
  if (qbLookCard) outlet.appendChild(qbLookCard)

  // Button handlers now inline via el() onClick above

  // ── Initialize Animator ─────────────────────────────────────────────────
  let initRetries = 0
  function initAnimator() {
    const dpr = window.devicePixelRatio || 1
    const cssW = canvasWrap.offsetWidth || canvas.offsetWidth
    const cssH = canvasWrap.offsetHeight || Math.round(cssW * 1.2)


    // If container hasn't laid out yet, retry
    if (cssW < 50 && initRetries < 5) {
      initRetries++
      requestAnimationFrame(initAnimator)
      return
    }

    // Set canvas buffer size (high-DPI)
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)

    // Scale context for high-DPI
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (animator) animator.destroy()
    animator = new PlayAnimator(canvas, play, {
      rosterMap,
      showDefense: prefs.showDefense !== false,
      showBall: prefs.showBall !== false,
      showReadNumbers: prefs.showReadNumbers !== false,
      showAllRoutes: prefs.showAllRoutes !== false,
      highlightPosition: prefs.highlightPosition || null,
      speed: prefs.speed || 'full',
    })

    animator.onStateChange(state => {
      playBtn.textContent = state.isPlaying ? '⏸ Pause' : '▶ Play'
      timeLabel.textContent = `${state.currentTime.toFixed(1)}s / ${state.totalDuration.toFixed(1)}s`
      const pct = state.totalDuration > 0 ? (state.currentTime / state.totalDuration) * 100 : 0
      progressFill.style.width = pct + '%'
    })

    // Set initial time display
    const st = animator.getState()
    timeLabel.textContent = `0.0s / ${st.totalDuration.toFixed(1)}s`
  }

  requestAnimationFrame(initAnimator)

  // ── Resize ──────────────────────────────────────────────────────────────
  function onResize() {
    requestAnimationFrame(initAnimator)
  }
  window.addEventListener('resize', onResize)

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────
  function onKeydown(e) {
    if (!animator) return
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return

    switch (e.code) {
      case 'Space':
        e.preventDefault()
        animator.getState().isPlaying ? animator.pause() : animator.play()
        break
      case 'KeyR':
        animator.reset()
        break
      case 'ArrowLeft':
        e.preventDefault()
        animator.seekTo(animator.getState().currentTime - 0.5)
        break
      case 'ArrowRight':
        e.preventDefault()
        animator.seekTo(animator.getState().currentTime + 0.5)
        break
      case 'Digit1': animator.setSpeed('teaching'); setActiveSpeed('teaching'); break
      case 'Digit2': animator.setSpeed('walkthrough'); setActiveSpeed('walkthrough'); break
      case 'Digit3': animator.setSpeed('full'); setActiveSpeed('full'); break
      case 'Digit4': animator.setSpeed('fast'); setActiveSpeed('fast'); break
    }
  }

  function setActiveSpeed(key) {
    Object.values(speedBtns).forEach(b => b.classList.remove('active'))
    if (speedBtns[key]) speedBtns[key].classList.add('active')
    if (store) store.set({ preferences: { speed: key } })
  }

  document.addEventListener('keydown', onKeydown)

  // ── Cleanup ─────────────────────────────────────────────────────────────
  return () => {
    window.removeEventListener('resize', onResize)
    document.removeEventListener('keydown', onKeydown)
    if (animator) animator.destroy()
  }
}
