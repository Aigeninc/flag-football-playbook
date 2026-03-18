import { el, clear, showToast } from '../utils/dom.js'

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

  function render() {
    clear(outlet)
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

    // Global swap hint bar — visible whenever a player is selected
    if (selectedForSwap) {
      const selectedPlayer = roster.find(p => p.id === selectedForSwap)
      container.appendChild(el('div', { className: 'roster-swap-active-hint' }, [
        el('span', { textContent: `📍 ${selectedPlayer ? selectedPlayer.name : '?'} selected — tap another player to swap` }),
        el('button', {
          className: 'btn btn-ghost btn-sm',
          textContent: '✕ Cancel',
          onclick: (e) => { e.stopPropagation(); clearSwapSelection() },
        }),
      ]))
    }

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
      if (!selectedForSwap) {
        container.appendChild(el('div', {
          className: 'roster-swap-hint',
          textContent: 'Tap any player to select, then tap another to swap positions',
        }))
      }
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
    render()
  }

  // ─── Player Row ───────────────────────────────────────────────────────────
  function buildPlayerRow(player) {
    const isBench = player.position === 'BENCH'
    const isSelected = selectedForSwap === player.id
    const row = el('div', {
      className: `roster-player-row ${isBench ? 'roster-bench-player' : 'roster-starter'}${isSelected ? ' swap-selected' : ''}`,
      dataset: { playerId: player.id },
    })

    row.appendChild(el('span', {
      className: `position-badge ${POS_CLASS[player.position] || 'pos-bench'}`,
      textContent: player.position,
    }))
    row.appendChild(el('span', { className: 'roster-player-name', textContent: player.name }))
    row.appendChild(el('span', {
      className: 'roster-player-number',
      textContent: player.number != null ? `#${player.number}` : '',
    }))
    row.appendChild(el('div', { className: 'roster-row-actions' }, [
      el('button', {
        className: 'btn btn-ghost btn-sm',
        textContent: '✏️',
        onclick: (e) => { e.stopPropagation(); clearSwapSelection(); showEditModal(player) },
      }),
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
        render()  // re-render so the global swap hint bar appears immediately
      } else if (selectedForSwap === player.id) {
        clearSwapSelection()
      } else {
        // Swap positions between the two players
        const roster = store.get().roster
        const a = roster.find(p => p.id === selectedForSwap)
        const b = roster.find(p => p.id === player.id)
        if (a && b) {
          const tmpPos = a.position
          a.position = b.position  // a's new position = b's old position
          b.position = tmpPos      // b's new position = a's old position
          selectedForSwap = null
          store.set({ roster })
          // a.position and b.position now hold their NEW positions after the swap
          showToast(`${a.name} → ${a.position}, ${b.name} → ${b.position}`)
        } else {
          clearSwapSelection()
        }
      }
    })

    return row
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
