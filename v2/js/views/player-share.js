import { el, clear, showToast } from '../utils/dom.js'
import { getPlay } from '../play-library.js'
import { PlayAnimator } from '../canvas/animator.js'

export function playerShareView(params, outlet) {
  const store = window.__store
  const playbookId = params.query?.playbook || null
  const playerName = params.query?.player || null

  clear(outlet)

  if (playbookId && playerName) {
    return renderPlayerView(playbookId, playerName, outlet, store)
  } else {
    return renderShareGenerator(outlet, store)
  }
}

// ── Mode 1: Share Link Generator (Coach View) ─────────────────────────────────

function renderShareGenerator(outlet, store) {
  const playbooks = store.getPlaybooks()
  const roster = store.get().roster

  let selectedPb = null
  let selectedPlayer = null

  // Playbook select
  const pbSelect = el('select', { className: 'input', id: 'share-playbook-select' }, [
    el('option', { value: '', textContent: '-- Select Playbook --' }),
    ...playbooks.map(pb => el('option', { value: pb.id, textContent: pb.name })),
  ])

  // Player select
  const playerSelect = el('select', { className: 'input', id: 'share-player-select' }, [
    el('option', { value: '', textContent: '-- Select Player --' }),
    ...roster.map(p => el('option', { value: p.name, textContent: `${p.name} (${p.position})` })),
  ])

  // Link output area
  const linkInput = el('input', {
    className: 'input share-link-input',
    type: 'text',
    readonly: 'readonly',
  })

  const copyBtn = el('button', {
    className: 'btn btn-primary',
    textContent: '📋 Copy Link',
    onclick: () => {
      if (!linkInput.value) return
      try {
        navigator.clipboard.writeText(linkInput.value).then(() => showToast('Link copied!'))
      } catch (e) {
        // Fallback for older browsers
        linkInput.select()
        document.execCommand('copy')
        showToast('Link copied!')
      }
    },
  })

  const linkOutput = el('div', { className: 'share-link-output hidden' }, [
    el('label', { textContent: 'Share this link:' }),
    linkInput,
    copyBtn,
  ])

  function updateLink() {
    if (!selectedPb || !selectedPlayer) {
      linkOutput.classList.add('hidden')
      return
    }
    const url = `${window.location.origin}${window.location.pathname}#/share?playbook=${encodeURIComponent(selectedPb)}&player=${encodeURIComponent(selectedPlayer)}`
    linkInput.value = url
    linkOutput.classList.remove('hidden')
  }

  pbSelect.addEventListener('change', () => {
    selectedPb = pbSelect.value || null
    updateLink()
  })

  playerSelect.addEventListener('change', () => {
    selectedPlayer = playerSelect.value || null
    updateLink()
  })

  const form = el('div', { className: 'share-form' }, [
    el('label', { textContent: 'Playbook' }),
    pbSelect,
    el('label', { textContent: 'Player' }),
    playerSelect,
  ])

  const container = el('div', { className: 'share-generator' }, [
    el('h1', { textContent: '🔗 Share Playbook' }),
    el('p', { textContent: 'Generate a link for a player to see their routes.' }),
    form,
    linkOutput,
  ])

  outlet.appendChild(container)

  return () => {}
}

// ── Mode 2: Player View (Read-Only) ───────────────────────────────────────────

function renderPlayerView(playbookId, playerName, outlet, store) {
  // Hide nav bar for clean phone experience
  const nav = document.getElementById('app-nav')
  if (nav) nav.style.display = 'none'

  const playbooks = store.getPlaybooks()
  const pb = playbooks.find(p => p.id === playbookId)

  if (!pb) {
    outlet.appendChild(el('div', { className: 'share-error card' }, [
      el('h2', { textContent: '❌ Playbook not found' }),
      el('p', { textContent: 'This playbook may have been deleted.', style: { color: '#888' } }),
    ]))
    return () => {
      const nav = document.getElementById('app-nav')
      if (nav) nav.style.display = ''
    }
  }

  // Find player on roster
  const roster = store.get().roster
  const rosterPlayer = roster.find(p => p.name.toLowerCase() === playerName.toLowerCase())
  const playerPosition = rosterPlayer ? rosterPlayer.position : null

  if (!playerPosition) {
    outlet.appendChild(el('div', { className: 'share-error card' }, [
      el('h2', { textContent: `❌ Player "${playerName}" not found` }),
      el('p', { textContent: 'Check the roster and try again.', style: { color: '#888' } }),
    ]))
    return () => {
      const nav = document.getElementById('app-nav')
      if (nav) nav.style.display = ''
    }
  }

  // Resolve plays — filter out any with missing play data
  const plays = (pb.plays || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(entry => ({
      ...entry,
      playData: getPlay(entry.playId),
    }))
    .filter(entry => entry.playData != null)

  if (plays.length === 0) {
    outlet.appendChild(el('div', { className: 'share-error card' }, [
      el('h2', { textContent: '📋 No plays in this playbook' }),
    ]))
    return () => {
      const nav = document.getElementById('app-nav')
      if (nav) nav.style.display = ''
    }
  }

  // ── Build DOM ────────────────────────────────────────────────────────────

  const counterEl = el('div', { className: 'player-view-counter', textContent: `1 / ${plays.length}` })

  const canvas = el('canvas', { style: { width: '100%', height: '100%', display: 'block' } })
  const canvasWrap = el('div', { className: 'player-view-canvas-wrap' }, [canvas])

  const codenameEl = el('h2', { className: 'player-view-codename' })
  const realnameEl = el('p', { className: 'player-view-realname hidden' })
  const playInfo = el('div', { className: 'player-view-play-info' }, [codenameEl, realnameEl])

  const prevBtn = el('button', { className: 'btn player-nav-btn', textContent: '◀ Prev' })
  const playBtn = el('button', { className: 'btn btn-primary player-play-btn', textContent: '▶ Play' })
  const nextBtn = el('button', { className: 'btn player-nav-btn', textContent: 'Next ▶' })
  const controls = el('div', { className: 'player-view-controls' }, [prevBtn, playBtn, nextBtn])

  const view = el('div', { className: 'player-view' }, [
    el('div', { className: 'player-view-header' }, [
      el('h1', { textContent: `🏈 ${rosterPlayer.name}'s Playbook` }),
      el('p', { className: 'player-view-subtitle', textContent: `${pb.name} · ${playerPosition}` }),
    ]),
    counterEl,
    canvasWrap,
    playInfo,
    controls,
  ])

  outlet.appendChild(view)

  // ── State ────────────────────────────────────────────────────────────────

  let currentIndex = 0
  let animator = null
  const rosterMap = store.getRosterMap()

  function showPlay(index) {
    if (index < 0 || index >= plays.length) return
    currentIndex = index
    const entry = plays[currentIndex]
    const play = entry.playData

    // Update counter
    counterEl.textContent = `${currentIndex + 1} / ${plays.length}`

    // Update play info
    codenameEl.textContent = entry.codeName || play.name
    if (entry.codeName) {
      realnameEl.textContent = play.name
      realnameEl.classList.remove('hidden')
    } else {
      realnameEl.classList.add('hidden')
    }

    // Destroy previous animator
    if (animator) { animator.destroy(); animator = null }

    // Size canvas
    const dpr = window.devicePixelRatio || 1
    const cssW = canvasWrap.offsetWidth || 360
    const cssH = Math.round(cssW * 1.2)
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Create animator with player's position highlighted
    animator = new PlayAnimator(canvas, play, {
      rosterMap,
      showDefense: false,
      showBall: true,
      showReadNumbers: false,
      showAllRoutes: true,
      highlightPosition: playerPosition,
      speed: 'full',
    })

    animator.onStateChange(state => {
      playBtn.textContent = state.isPlaying ? '⏸ Pause' : '▶ Play'
    })

    // Update prev/next button states
    prevBtn.disabled = currentIndex === 0
    nextBtn.disabled = currentIndex === plays.length - 1
  }

  // ── Button Handlers ──────────────────────────────────────────────────────

  prevBtn.onclick = () => showPlay(currentIndex - 1)
  nextBtn.onclick = () => showPlay(currentIndex + 1)

  playBtn.onclick = () => {
    if (!animator) return
    animator.getState().isPlaying ? animator.pause() : animator.play()
  }

  // Canvas tap to toggle play/pause
  canvas.addEventListener('click', () => {
    if (!animator) return
    animator.getState().isPlaying ? animator.pause() : animator.play()
  })

  // ── Touch Swipe Navigation ───────────────────────────────────────────────

  let touchStartX = 0
  let touchStartY = 0

  canvasWrap.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }, { passive: true })

  canvasWrap.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX
    const dy = e.changedTouches[0].clientY - touchStartY
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) showPlay(currentIndex + 1)  // swipe left = next
      else showPlay(currentIndex - 1)          // swipe right = prev
    }
  }, { passive: true })

  // ── Resize Handler ───────────────────────────────────────────────────────

  function onResize() {
    requestAnimationFrame(() => showPlay(currentIndex))
  }
  window.addEventListener('resize', onResize)

  // ── Initial Render ───────────────────────────────────────────────────────

  requestAnimationFrame(() => showPlay(0))

  // ── Cleanup ──────────────────────────────────────────────────────────────

  return () => {
    window.removeEventListener('resize', onResize)
    if (animator) animator.destroy()
    const nav = document.getElementById('app-nav')
    if (nav) nav.style.display = ''
  }
}
