import { el, clear, showToast } from '../utils/dom.js'
import { getPlay } from '../play-library.js'
import { PlayAnimator, SPEEDS } from '../canvas/animator.js'

const SPEED_LABELS = [
  { key: 'teaching', label: '🐢 Teach' },
  { key: 'walkthrough', label: '🚶 Walk' },
  { key: 'full', label: '🏃 Full' },
]

export function playerShareView(params, outlet) {
  const store = window.__store
  const playbookId = params.query?.playbook || null
  const playerName = params.query?.player || null

  clear(outlet)

  if (playerName) {
    // Check for personal playbook first
    const state = store.get()
    const ppb = (state.playerPlaybooks || {})[playerName]

    if (ppb && ppb.length > 0) {
      return renderPersonalPlaybookView(playerName, ppb, outlet, store)
    } else if (playbookId) {
      // Fall back to existing playbook-based view
      return renderPlayerView(playbookId, playerName, outlet, store)
    } else {
      // No personal playbook, no playbook param — show info
      const nav = document.getElementById('app-nav')
      if (nav) nav.style.display = 'none'
      outlet.appendChild(el('div', { className: 'share-error card' }, [
        el('h2', { textContent: `👤 ${playerName}` }),
        el('p', { textContent: 'No personal playbook set up yet.', style: { color: '#888' } }),
        el('p', { textContent: 'Ask your coach to create your playbook in the Roster view.', style: { color: '#666', fontSize: '14px' } }),
      ]))
      return () => {
        const nav = document.getElementById('app-nav')
        if (nav) nav.style.display = ''
      }
    }
  } else {
    return renderShareGenerator(outlet, store)
  }
}

// ── Mode 1: Share Link Generator (Coach View) ─────────────────────────────────

function renderShareGenerator(outlet, store) {
  const playbooks = store.getPlaybooks()
  const roster = store.get().roster
  const playerPlaybooks = store.get().playerPlaybooks || {}

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
    ...roster.map(p => {
      const hasPpb = !!(playerPlaybooks[p.name]?.length)
      return el('option', { value: p.name, textContent: `${p.name} (${p.position})${hasPpb ? ' 📋' : ''}` })
    }),
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
        linkInput.select()
        document.execCommand('copy')
        showToast('Link copied!')
      }
    },
  })

  const linkTypeNote = el('p', { className: 'share-link-type-note', style: { color: '#888', fontSize: '13px', margin: '4px 0 0' } })

  const linkOutput = el('div', { className: 'share-link-output hidden' }, [
    el('label', { textContent: 'Share this link:' }),
    linkInput,
    linkTypeNote,
    copyBtn,
  ])

  function updateLink() {
    if (!selectedPlayer) {
      linkOutput.classList.add('hidden')
      return
    }
    const hasPpb = !!(playerPlaybooks[selectedPlayer]?.length)
    let url
    if (hasPpb) {
      // Personal playbook URL — no playbook ID needed
      url = `${window.location.origin}${window.location.pathname}#/share?player=${encodeURIComponent(selectedPlayer)}`
      linkTypeNote.textContent = '📋 Uses personal playbook'
    } else if (selectedPb) {
      // Fallback to team playbook
      url = `${window.location.origin}${window.location.pathname}#/share?playbook=${encodeURIComponent(selectedPb)}&player=${encodeURIComponent(selectedPlayer)}`
      linkTypeNote.textContent = '📚 Uses team playbook'
    } else {
      linkOutput.classList.add('hidden')
      return
    }
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
    el('label', { textContent: 'Player' }),
    playerSelect,
    el('label', { textContent: 'Playbook (fallback)' }),
    pbSelect,
  ])

  const container = el('div', { className: 'share-generator' }, [
    el('h1', { textContent: '🔗 Share Playbook' }),
    el('p', { textContent: 'Generate a link for a player to see their routes.' }),
    el('p', { textContent: 'Players with 📋 have personal playbooks — link uses that. Others fall back to a team playbook.', style: { fontSize: '13px', color: '#888', marginBottom: '12px' } }),
    form,
    linkOutput,
  ])

  outlet.appendChild(container)

  return () => {}
}

// ── Mode 2: Personal Player Playbook View ─────────────────────────────────────

function renderPersonalPlaybookView(playerName, ppbEntries, outlet, store) {
  // Hide nav bar for clean phone experience
  const nav = document.getElementById('app-nav')
  if (nav) nav.style.display = 'none'

  // Resolve plays from personal playbook entries
  const plays = ppbEntries
    .map(entry => ({
      ...entry,
      playData: getPlay(entry.playId),
    }))
    .filter(entry => entry.playData != null)

  if (plays.length === 0) {
    outlet.appendChild(el('div', { className: 'share-error card' }, [
      el('h2', { textContent: '📋 Empty Playbook' }),
      el('p', { textContent: `${playerName}'s playbook has no valid plays.`, style: { color: '#888' } }),
    ]))
    return () => {
      const nav = document.getElementById('app-nav')
      if (nav) nav.style.display = ''
    }
  }

  // Highlight toggle state (persisted to localStorage)
  let highlightOn = localStorage.getItem('pb_player_highlight_on') !== 'false'
  let currentSpeed = localStorage.getItem('pb_player_speed') || 'teaching'

  // ── Build DOM ────────────────────────────────────────────────────────────

  const counterEl = el('div', { className: 'player-view-counter', textContent: `1 / ${plays.length}` })

  const canvas = el('canvas', { style: { width: '100%', display: 'block' } })
  const canvasWrap = el('div', { className: 'player-view-canvas-wrap' }, [canvas])

  const codenameEl = el('h2', { className: 'player-view-codename' })
  const realnameEl = el('p', { className: 'player-view-realname hidden' })
  const positionBadgeEl = el('div', { className: 'player-position-badge hidden' })
  const playInfo = el('div', { className: 'player-view-play-info' }, [codenameEl, realnameEl])

  const prevBtn = el('button', { className: 'btn player-nav-btn', textContent: '◀ Prev' })
  const playBtn = el('button', { className: 'btn btn-primary player-play-btn', textContent: '▶ Play' })
  const nextBtn = el('button', { className: 'btn player-nav-btn', textContent: 'Next ▶' })

  const highlightBtn = el('button', {
    className: `btn btn-ghost btn-sm player-highlight-btn ${highlightOn ? 'active' : ''}`,
    textContent: '👤 My Route',
    title: 'Toggle route highlight for your position',
  })

  // Speed toggle buttons
  const speedBtns = SPEED_LABELS.map(s => el('button', {
    className: `btn btn-sm player-speed-btn ${s.key === currentSpeed ? 'active' : ''}`,
    textContent: s.label,
    onClick: () => {
      currentSpeed = s.key
      localStorage.setItem('pb_player_speed', currentSpeed)
      speedBtns.forEach((b, i) => b.classList.toggle('active', SPEED_LABELS[i].key === currentSpeed))
      if (animator) animator.setSpeed(currentSpeed)
    },
  }))
  const speedControls = el('div', { className: 'player-view-speed-controls' }, speedBtns)

  const controls = el('div', { className: 'player-view-controls' }, [prevBtn, playBtn, nextBtn])
  const extraControls = el('div', { className: 'player-view-extra-controls' }, [highlightBtn, speedControls])

  const view = el('div', { className: 'player-view' }, [
    el('div', { className: 'player-view-header' }, [
      el('h1', { textContent: `🏈 ${playerName}'s Playbook` }),
      el('p', { className: 'player-view-subtitle', textContent: `${plays.length} plays` }),
    ]),
    counterEl,
    positionBadgeEl,
    canvasWrap,
    playInfo,
    extraControls,
    controls,
  ])

  outlet.appendChild(view)

  // ── State ────────────────────────────────────────────────────────────────

  let currentIndex = 0
  let animator = null
  const baseRosterMap = store.getRosterMap()

  function getEntryRosterMap(entry) {
    // Build a modified rosterMap where the player replaces the default at their position
    return { ...baseRosterMap, [entry.position]: playerName }
  }

  function showPlay(index) {
    if (index < 0 || index >= plays.length) return
    currentIndex = index
    const entry = plays[currentIndex]
    const play = entry.playData
    const position = entry.position

    // Update counter
    counterEl.textContent = `${currentIndex + 1} / ${plays.length}`

    // Update play info
    codenameEl.textContent = play.name
    realnameEl.classList.add('hidden')

    // Update position badge
    positionBadgeEl.textContent = `📍 Line up as: ${position}`
    positionBadgeEl.classList.remove('hidden')

    // Update prev/next button states
    prevBtn.disabled = currentIndex === 0
    nextBtn.disabled = currentIndex === plays.length - 1

    // Destroy previous animator
    if (animator) { animator.destroy(); animator = null }

    // Size canvas — use 1.4 ratio for a taller field view
    const dpr = window.devicePixelRatio || 1
    const cssW = canvasWrap.offsetWidth || 360
    const cssH = Math.round(cssW * 1.4)
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    canvas.style.height = cssH + 'px'
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Build modified rosterMap for substitution
    const rosterMap = getEntryRosterMap(entry)

    // Create animator — show full play, with optional highlight
    animator = new PlayAnimator(canvas, play, {
      rosterMap,
      showDefense: true,
      showBall: true,
      showReadNumbers: false,
      showAllRoutes: true,
      highlightPosition: highlightOn ? position : null,
      speed: currentSpeed,
    })

    animator.onStateChange(state => {
      playBtn.textContent = state.isPlaying ? '⏸ Pause' : '▶ Play'
    })
  }

  // ── Button Handlers ──────────────────────────────────────────────────────

  prevBtn.onclick = () => showPlay(currentIndex - 1)
  nextBtn.onclick = () => showPlay(currentIndex + 1)

  playBtn.onclick = () => {
    if (!animator) return
    animator.getState().isPlaying ? animator.pause() : animator.play()
  }

  highlightBtn.onclick = () => {
    highlightOn = !highlightOn
    localStorage.setItem('pb_player_highlight_on', String(highlightOn))
    highlightBtn.classList.toggle('active', highlightOn)
    // Re-render current play with updated highlight
    if (animator) { animator.destroy(); animator = null }
    showPlay(currentIndex)
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

// ── Mode 3: Player View (Playbook-based, legacy / fallback) ───────────────────

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

  // Highlight toggle state (persisted to localStorage)
  let highlightOn = localStorage.getItem('pb_player_highlight_on') !== 'false'
  let currentSpeed = localStorage.getItem('pb_player_speed') || 'teaching'

  // ── Build DOM ────────────────────────────────────────────────────────────

  const counterEl = el('div', { className: 'player-view-counter', textContent: `1 / ${plays.length}` })

  const canvas = el('canvas', { style: { width: '100%', display: 'block' } })
  const canvasWrap = el('div', { className: 'player-view-canvas-wrap' }, [canvas])

  const codenameEl = el('h2', { className: 'player-view-codename' })
  const realnameEl = el('p', { className: 'player-view-realname hidden' })
  const playInfo = el('div', { className: 'player-view-play-info' }, [codenameEl, realnameEl])

  const prevBtn = el('button', { className: 'btn player-nav-btn', textContent: '◀ Prev' })
  const playBtn = el('button', { className: 'btn btn-primary player-play-btn', textContent: '▶ Play' })
  const nextBtn = el('button', { className: 'btn player-nav-btn', textContent: 'Next ▶' })

  const highlightBtn = el('button', {
    className: `btn btn-ghost btn-sm player-highlight-btn ${highlightOn ? 'active' : ''}`,
    textContent: '👤 My Route',
    title: 'Toggle route highlight for your position',
  })

  // Speed toggle buttons
  const speedBtns = SPEED_LABELS.map(s => el('button', {
    className: `btn btn-sm player-speed-btn ${s.key === currentSpeed ? 'active' : ''}`,
    textContent: s.label,
    onClick: () => {
      currentSpeed = s.key
      localStorage.setItem('pb_player_speed', currentSpeed)
      speedBtns.forEach((b, i) => b.classList.toggle('active', SPEED_LABELS[i].key === currentSpeed))
      if (animator) animator.setSpeed(currentSpeed)
    },
  }))
  const speedControls = el('div', { className: 'player-view-speed-controls' }, speedBtns)

  const controls = el('div', { className: 'player-view-controls' }, [prevBtn, playBtn, nextBtn])
  const extraControls = el('div', { className: 'player-view-extra-controls' }, [highlightBtn, speedControls])

  const view = el('div', { className: 'player-view' }, [
    el('div', { className: 'player-view-header' }, [
      el('h1', { textContent: `🏈 ${rosterPlayer.name}'s Playbook` }),
      el('p', { className: 'player-view-subtitle', textContent: `${pb.name} · ${playerPosition}` }),
    ]),
    counterEl,
    canvasWrap,
    playInfo,
    extraControls,
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

    // Size canvas — use 1.4 ratio for a taller field view
    const dpr = window.devicePixelRatio || 1
    const cssW = canvasWrap.offsetWidth || 360
    const cssH = Math.round(cssW * 1.4)
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    canvas.style.height = cssH + 'px'
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Create animator with player's position highlighted
    animator = new PlayAnimator(canvas, play, {
      rosterMap,
      showDefense: false,
      showBall: true,
      showReadNumbers: false,
      showAllRoutes: true,
      highlightPosition: highlightOn ? playerPosition : null,
      speed: currentSpeed,
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

  highlightBtn.onclick = () => {
    highlightOn = !highlightOn
    localStorage.setItem('pb_player_highlight_on', String(highlightOn))
    highlightBtn.classList.toggle('active', highlightOn)
    if (animator) { animator.destroy(); animator = null }
    showPlay(currentIndex)
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
