import { el, clear, showToast } from '../utils/dom.js'
import { PLAY_LIBRARY } from '../play-library.js'

const FIELD_POSITIONS = ['QB', 'C', 'WR1', 'WR2', 'RB']
const ALL_POSITIONS = [...FIELD_POSITIONS, 'BENCH']

const POS_CLASS = {
  QB:    'pos-qb',
  C:     'pos-c',
  WR1:   'pos-wr1',
  WR2:   'pos-wr2',
  RB:    'pos-rb',
  BENCH: 'pos-bench',
}

export function rosterView(params, outlet) {
  const store = window.__store
  let showAddForm = false
  let selectedForSwap = null

  // Playbook editor state
  let editingPlaybookFor = null  // player name currently being edited, or null
  let editorState = {}           // { playId: { checked, position } } — local edit state
  let editorInitKey = null       // tracks which player's state is currently loaded

  // ─── Master render ─────────────────────────────────────────────────────────
  function render() {
    clear(outlet)

    // If in playbook editor mode, show editor instead of roster
    if (editingPlaybookFor !== null) {
      outlet.appendChild(buildPlaybookEditor(editingPlaybookFor))
      return
    }

    const roster = store.get().roster
    const container = el('div', { className: 'card roster-card' })

    // Header
    container.appendChild(el('div', { className: 'roster-header' }, [
      el('h1', { className: 'roster-title', textContent: '👥 Roster' }),
      el('button', {
        className: 'btn btn-primary btn-sm',
        textContent: '+ Add',
        onclick: () => { showAddForm = true; render(); focusNameInput() },
      }),
    ]))

    if (showAddForm) container.appendChild(buildAddForm())

    if (roster.length === 0 && !showAddForm) {
      container.appendChild(el('div', { className: 'roster-empty' }, [
        el('p', { textContent: 'No players yet. Add your first player to get started.' }),
      ]))
      outlet.appendChild(container)
      return
    }

    // Split starters vs bench by position value
    const starters = roster.filter(p => p.position !== 'BENCH')
    const bench = roster.filter(p => p.position === 'BENCH')

    // Sort starters by position order
    starters.sort((a, b) => FIELD_POSITIONS.indexOf(a.position) - FIELD_POSITIONS.indexOf(b.position))

    // Starters
    container.appendChild(el('div', { className: 'roster-section-label', textContent: 'STARTERS' }))
    const startersList = el('div', { className: 'roster-list' })
    for (const player of starters) {
      startersList.appendChild(buildPlayerRow(player))
    }
    container.appendChild(startersList)

    // Bench
    if (bench.length > 0) {
      container.appendChild(el('div', {
        className: 'roster-section-label roster-bench-label',
        textContent: `BENCH (${bench.length})`,
      }))
      container.appendChild(el('div', {
        className: 'roster-swap-hint',
        textContent: 'Tap a bench player, then tap a starter to swap them in',
      }))
      const benchList = el('div', { className: 'roster-list roster-bench' })
      for (const player of bench) {
        benchList.appendChild(buildPlayerRow(player))
      }
      container.appendChild(benchList)
    }

    // Position warnings
    const filledPositions = new Set(starters.map(p => p.position))
    const missing = FIELD_POSITIONS.filter(pos => !filledPositions.has(pos))
    if (missing.length > 0) {
      container.appendChild(el('div', { className: 'roster-warning' }, [
        el('span', { textContent: `⚠️ Missing: ${missing.join(', ')}` }),
      ]))
    } else {
      container.appendChild(el('div', { className: 'roster-warning roster-all-clear' }, [
        el('span', { textContent: '✅ All positions filled' }),
      ]))
    }

    outlet.appendChild(container)
  }

  function focusNameInput() {
    requestAnimationFrame(() => {
      const inp = outlet.querySelector('.roster-add-form input[type="text"]')
      if (inp) inp.focus()
    })
  }

  function clearSwapSelection() {
    selectedForSwap = null
    outlet.querySelectorAll('.roster-player-row').forEach(r => r.classList.remove('swap-selected'))
  }

  // ─── Player Row ───────────────────────────────────────────────────────────
  function buildPlayerRow(player) {
    const isBench = player.position === 'BENCH'
    const row = el('div', {
      className: `roster-player-row ${isBench ? 'roster-bench-player' : 'roster-starter'}`,
      dataset: { playerId: player.id },
    })

    row.appendChild(el('span', {
      className: `position-badge ${POS_CLASS[player.position] || ''}`,
      textContent: player.position,
    }))
    row.appendChild(el('span', { className: 'roster-player-name', textContent: player.name }))
    row.appendChild(el('span', {
      className: 'roster-player-number',
      textContent: player.number != null ? `#${player.number}` : '',
    }))

    // Check if player has a personal playbook
    const state = store.get()
    const hasPlaybook = !!(state.playerPlaybooks?.[player.name]?.length)

    row.appendChild(el('div', { className: 'roster-row-actions' }, [
      // Playbook editor button
      el('button', {
        className: `btn btn-ghost btn-sm ${hasPlaybook ? 'ppb-has-playbook' : ''}`,
        textContent: '📋',
        title: hasPlaybook ? `Edit ${player.name}'s playbook` : `Create ${player.name}'s playbook`,
        onclick: (e) => {
          e.stopPropagation()
          clearSwapSelection()
          editingPlaybookFor = player.name
          editorInitKey = null  // force fresh initialization
          render()
        },
      }),
      // Share link button
      el('button', {
        className: 'btn btn-ghost btn-sm',
        textContent: '📤',
        title: `Copy ${player.name}'s share link`,
        onclick: (e) => {
          e.stopPropagation()
          clearSwapSelection()
          const url = `${window.location.origin}${window.location.pathname}#/share?player=${encodeURIComponent(player.name)}`
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => showToast(`📋 Copied ${player.name}'s link!`))
              .catch(() => fallbackCopy(url, player.name))
          } else {
            fallbackCopy(url, player.name)
          }
        },
      }),
      // Edit button
      el('button', {
        className: 'btn btn-ghost btn-sm',
        textContent: '✏️',
        onclick: (e) => { e.stopPropagation(); clearSwapSelection(); showEditModal(player) },
      }),
      // Delete button
      el('button', {
        className: 'btn btn-danger btn-sm',
        textContent: '✕',
        onclick: (e) => {
          e.stopPropagation(); clearSwapSelection()
          if (confirm(`Remove ${player.name}?`)) {
            const roster = store.get().roster.filter(p => p.id !== player.id)
            store.set({ roster }); render()
            showToast(`${player.name} removed`)
          }
        },
      }),
    ]))

    // Tap-to-swap
    row.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) return

      if (selectedForSwap === null) {
        selectedForSwap = player.id
        row.classList.add('swap-selected')
      } else if (selectedForSwap === player.id) {
        clearSwapSelection()
      } else {
        // Swap positions between the two players
        const roster = store.get().roster
        const a = roster.find(p => p.id === selectedForSwap)
        const b = roster.find(p => p.id === player.id)
        if (a && b) {
          const tmpPos = a.position
          a.position = b.position
          b.position = tmpPos
          selectedForSwap = null
          store.set({ roster })
          showToast(`${a.name} → ${b.position}, ${b.name} → ${a.position}`)
          render()
        } else {
          clearSwapSelection()
        }
      }
    })

    return row
  }

  function fallbackCopy(url, playerName) {
    const inp = document.createElement('input')
    inp.value = url
    inp.style.position = 'fixed'
    inp.style.opacity = '0'
    document.body.appendChild(inp)
    inp.select()
    try { document.execCommand('copy') } catch (_) {}
    document.body.removeChild(inp)
    showToast(`📋 Copied ${playerName}'s link!`)
  }

  // ─── Playbook Editor ──────────────────────────────────────────────────────
  function initEditorState(playerName) {
    if (editorInitKey === playerName) return  // already initialized for this player

    editorInitKey = playerName

    const state = store.get()
    const player = state.roster.find(p => p.name === playerName)
    const rosterPos = player?.position
    const isStarter = rosterPos && rosterPos !== 'BENCH'
    const existing = (state.playerPlaybooks || {})[playerName] || []

    editorState = {}
    for (const play of PLAY_LIBRARY) {
      const entry = existing.find(e => e.playId === play.id)
      if (entry) {
        editorState[play.id] = { checked: true, position: entry.position }
      } else {
        editorState[play.id] = {
          checked: isStarter,              // pre-check all plays for starters
          position: isStarter ? rosterPos : 'WR1',  // default to their position
        }
      }
    }
  }

  function buildPlaybookEditor(playerName) {
    initEditorState(playerName)

    const container = el('div', { className: 'card ppb-editor' })

    // Header
    const header = el('div', { className: 'ppb-editor-header' }, [
      el('button', {
        className: 'btn btn-ghost btn-sm',
        textContent: '← Back',
        onclick: () => { editingPlaybookFor = null; editorInitKey = null; render() },
      }),
      el('h2', { className: 'ppb-editor-title', textContent: `📋 ${playerName}'s Playbook` }),
    ])
    container.appendChild(header)

    // Play count hint
    const checkedCount = Object.values(editorState).filter(e => e.checked).length
    const hint = el('p', {
      className: 'ppb-editor-hint',
      textContent: `${checkedCount} of ${PLAY_LIBRARY.length} plays selected. Check each play and assign this player's position.`,
    })
    container.appendChild(hint)

    // Play list
    const playList = el('div', { className: 'ppb-play-list' })

    for (const play of PLAY_LIBRARY) {
      const editEntry = editorState[play.id]
      const row = el('div', { className: `ppb-play-row ${editEntry.checked ? 'ppb-play-row-active' : ''}` })

      const cbId = `ppb-cb-${play.id}`
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'ppb-checkbox'
      checkbox.id = cbId
      checkbox.checked = editEntry.checked

      const nameLabel = document.createElement('label')
      nameLabel.htmlFor = cbId
      nameLabel.className = 'ppb-play-name'
      nameLabel.textContent = play.name

      const posSelect = el('select', { className: 'input ppb-position-select' },
        FIELD_POSITIONS.map(p => el('option', { value: p, textContent: p }))
      )
      posSelect.value = editEntry.position
      posSelect.disabled = !editEntry.checked

      // Wire up events
      checkbox.addEventListener('change', () => {
        editorState[play.id].checked = checkbox.checked
        posSelect.disabled = !checkbox.checked
        row.classList.toggle('ppb-play-row-active', checkbox.checked)
        // Update hint counter
        const newCount = Object.values(editorState).filter(e => e.checked).length
        hint.textContent = `${newCount} of ${PLAY_LIBRARY.length} plays selected. Check each play and assign this player's position.`
      })

      posSelect.addEventListener('change', () => {
        editorState[play.id].position = posSelect.value
      })

      row.appendChild(checkbox)
      row.appendChild(nameLabel)
      row.appendChild(posSelect)
      playList.appendChild(row)
    }

    container.appendChild(playList)

    // Actions
    container.appendChild(el('div', { className: 'ppb-editor-actions' }, [
      el('button', {
        className: 'btn btn-primary',
        textContent: '💾 Save Playbook',
        onclick: () => {
          const rosterMap = store.getRosterMap()
          const entries = PLAY_LIBRARY
            .filter(play => editorState[play.id]?.checked)
            .map(play => ({
              playId: play.id,
              position: editorState[play.id].position,
              replacesPlayer: rosterMap[editorState[play.id].position] || editorState[play.id].position,
            }))

          const playerPlaybooks = { ...(store.get().playerPlaybooks || {}) }
          playerPlaybooks[playerName] = entries
          store.set({ playerPlaybooks })

          showToast(`✅ ${playerName}'s playbook saved (${entries.length} plays)`)
          editingPlaybookFor = null
          editorInitKey = null
          render()
        },
      }),
      el('button', {
        className: 'btn btn-ghost',
        textContent: 'Cancel',
        onclick: () => { editingPlaybookFor = null; editorInitKey = null; render() },
      }),
    ]))

    return container
  }

  // ─── Edit modal ───────────────────────────────────────────────────────────
  function showEditModal(player) {
    const overlay = el('div', { className: 'modal-overlay' })
    const modal = el('div', { className: 'modal-content' })

    const nameInput = el('input', { className: 'input', type: 'text', value: player.name })
    const posSelect = buildPositionSelect(player.position, true)
    const numInput = el('input', { className: 'input', type: 'number', value: player.number != null ? String(player.number) : '', placeholder: '#', min: '0', max: '99' })

    function doSave() {
      if (!nameInput.value.trim()) return
      const roster = store.get().roster.map(p =>
        p.id === player.id ? { ...p, name: nameInput.value.trim(), position: posSelect.value, number: numInput.value !== '' ? parseInt(numInput.value, 10) : null } : p
      )
      store.set({ roster }); overlay.remove(); render()
      showToast('Updated')
    }

    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSave() })

    modal.appendChild(el('h3', { textContent: `Edit ${player.name}`, style: { marginBottom: '12px' } }))
    modal.appendChild(el('div', { className: 'modal-form' }, [
      el('label', { textContent: 'Name' }), nameInput,
      el('label', { textContent: 'Position' }), posSelect,
      el('label', { textContent: 'Number' }), numInput,
    ]))
    modal.appendChild(el('div', { className: 'modal-actions' }, [
      el('button', { className: 'btn btn-primary', textContent: 'Save', onclick: doSave }),
      el('button', { className: 'btn btn-ghost', textContent: 'Cancel', onclick: () => overlay.remove() }),
    ]))

    overlay.appendChild(modal)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
    document.body.appendChild(overlay)
    nameInput.focus()
  }

  // ─── Add form ─────────────────────────────────────────────────────────────
  function buildAddForm() {
    const nameInput = el('input', { className: 'input', type: 'text', placeholder: 'Player name *' })
    const posSelect = buildPositionSelect(null, true)
    const numInput = el('input', { className: 'input', type: 'number', placeholder: '#', min: '0', max: '99' })

    function add() {
      let ok = true
      if (!nameInput.value.trim()) { nameInput.classList.add('input-error'); ok = false } else { nameInput.classList.remove('input-error') }
      if (!posSelect.value) { posSelect.classList.add('input-error'); ok = false } else { posSelect.classList.remove('input-error') }
      if (!ok) return
      const roster = store.get().roster
      roster.push({ id: 'player_' + Date.now(), name: nameInput.value.trim(), position: posSelect.value, number: numInput.value !== '' ? parseInt(numInput.value, 10) : null })
      store.set({ roster })
      showToast(`${nameInput.value.trim()} added`)
      nameInput.value = ''; posSelect.value = ''; numInput.value = ''
      render(); showAddForm = true; focusNameInput()
    }

    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') add()
      if (e.key === 'Escape') { showAddForm = false; render() }
    })

    return el('div', { className: 'roster-add-form' }, [
      el('div', { className: 'roster-form-grid' }, [nameInput, posSelect, numInput]),
      el('div', { className: 'roster-form-actions' }, [
        el('button', { className: 'btn btn-primary btn-sm', textContent: 'Add', onclick: add }),
        el('button', { className: 'btn btn-ghost btn-sm', textContent: 'Cancel', onclick: () => { showAddForm = false; render() } }),
      ]),
    ])
  }

  function buildPositionSelect(selected, includeBench) {
    const positions = includeBench ? ALL_POSITIONS : FIELD_POSITIONS
    const sel = el('select', { className: 'input' }, [
      el('option', { value: '', textContent: '-- Position' }),
      ...positions.map(p => el('option', { value: p, textContent: p })),
    ])
    if (selected) sel.value = selected
    return sel
  }

  render()
  return () => {}
}
