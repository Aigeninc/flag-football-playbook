import { el, clear, showToast } from '../utils/dom.js'
import { PLAY_LIBRARY, filterPlays, getFormations, getTags, getFamilies } from '../play-library.js'
import { renderPlay } from '../canvas/renderer.js'

export function playbookView(params, outlet) {
  const store = window.__store
  let mode = 'view'          // 'view' | 'manage' | 'list'
  let selectedPlaybookId = store.get().activePlaybookId || null
  let searchFilters = { search: '', formation: '', tag: '', family: '' }

  // If no playbooks exist, start in list mode
  if (store.getPlaybooks().length === 0) mode = 'list'

  // If we have playbooks but none selected, pick the active or first
  if (selectedPlaybookId === null) {
    const pbs = store.getPlaybooks()
    if (pbs.length > 0) {
      selectedPlaybookId = store.get().activePlaybookId || pbs[0].id
    }
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  function render() {
    clear(outlet)
    const rosterMap = store.getRosterMap()
    const playbooks = store.getPlaybooks()

    // Validate selected playbook still exists
    if (selectedPlaybookId && !playbooks.some(p => p.id === selectedPlaybookId)) {
      selectedPlaybookId = playbooks.length > 0 ? playbooks[0].id : null
    }

    if (playbooks.length === 0 || mode === 'list') {
      renderPlaybookList(rosterMap)
    } else if (mode === 'manage') {
      renderManageMode(rosterMap)
    } else {
      renderFilteredLibrary(rosterMap)
    }
  }

  // ─── VIEW MODE: Filtered library showing only plays in this playbook ──────
  function renderFilteredLibrary(rosterMap) {
    const playbooks = store.getPlaybooks()
    const pb = playbooks.find(p => p.id === selectedPlaybookId)
    if (!pb) { mode = 'list'; render(); return }

    const view = el('div', { className: 'playbook-view' })

    // ── Playbook selector + actions bar
    const pbSelect = el('select', { className: 'input playbook-select' })
    for (const p of playbooks) {
      pbSelect.appendChild(el('option', { value: p.id, textContent: p.name }))
    }
    pbSelect.value = selectedPlaybookId
    pbSelect.addEventListener('change', () => {
      selectedPlaybookId = pbSelect.value
      render()
    })

    const header = el('div', { className: 'playbook-filter-header' }, [
      pbSelect,
      el('div', { className: 'playbook-header-actions' }, [
        el('button', {
          className: 'btn btn-ghost btn-sm',
          textContent: '⚙ Manage',
          onclick: () => { mode = 'manage'; render() },
        }),
        el('button', {
          className: 'btn btn-primary btn-sm',
          textContent: '+ New',
          onclick: createPlaybook,
        }),
      ]),
    ])
    view.appendChild(header)

    // ── Get plays in this playbook, sorted by order
    const sortedEntries = [...pb.plays].sort((a, b) => a.order - b.order)
    const playIds = new Set(sortedEntries.map(e => e.playId))
    const codeNames = {}
    for (const e of sortedEntries) {
      if (e.codeName) codeNames[e.playId] = e.codeName
    }

    // ── Filter bar (same as play library)
    const searchInput = el('input', {
      type: 'text',
      className: 'input filter-search',
      placeholder: '🔍 Search plays…',
      value: searchFilters.search,
    })
    searchInput.addEventListener('input', () => {
      searchFilters.search = searchInput.value
      refreshGrid()
    })

    const formationSelect = buildSelect('Formation', getFormations(), v => {
      searchFilters.formation = v; refreshGrid()
    })
    formationSelect.value = searchFilters.formation

    const tagSelect = buildSelect('Tag', getTags(), v => {
      searchFilters.tag = v; refreshGrid()
    })
    tagSelect.value = searchFilters.tag

    const familySelect = buildSelect('Family', getFamilies(), v => {
      searchFilters.family = v; refreshGrid()
    })
    familySelect.value = searchFilters.family

    const clearBtn = el('button', {
      className: 'btn btn-ghost filter-clear hidden',
      textContent: '✕ Clear',
      onclick: () => {
        searchFilters = { search: '', formation: '', tag: '', family: '' }
        searchInput.value = ''
        formationSelect.value = ''
        tagSelect.value = ''
        familySelect.value = ''
        clearBtn.classList.add('hidden')
        refreshGrid()
      },
    })

    const countEl = el('span', {
      className: 'library-count',
      textContent: `${sortedEntries.length} plays in "${pb.name}"`,
    })

    view.appendChild(el('div', { className: 'library-header', style: { marginTop: '8px' } }, [countEl]))
    view.appendChild(el('div', { className: 'filter-bar' }, [
      searchInput, formationSelect, tagSelect, familySelect, clearBtn,
    ]))

    // ── Play grid (same card style as library, but filtered to playbook)
    const grid = el('div', { className: 'play-grid' })

    function getFilteredPlays() {
      let plays = filterPlays(searchFilters).filter(p => playIds.has(p.id))
      // Sort by playbook order
      const orderMap = {}
      for (const e of sortedEntries) orderMap[e.playId] = e.order
      plays.sort((a, b) => (orderMap[a.id] || 0) - (orderMap[b.id] || 0))
      return plays
    }

    function refreshGrid() {
      const hasFilter = searchFilters.search || searchFilters.formation || searchFilters.tag || searchFilters.family
      clearBtn.classList.toggle('hidden', !hasFilter)

      clear(grid)
      const plays = getFilteredPlays()
      countEl.textContent = hasFilter
        ? `Showing ${plays.length} of ${sortedEntries.length} plays in "${pb.name}"`
        : `${sortedEntries.length} plays in "${pb.name}"`

      if (plays.length === 0 && sortedEntries.length === 0) {
        grid.appendChild(el('div', {
          style: { color: '#888', gridColumn: '1 / -1', padding: '24px 0', textAlign: 'center' },
        }, [
          el('p', { textContent: 'No plays in this playbook yet.' }),
          el('button', {
            className: 'btn btn-primary',
            style: { marginTop: '12px' },
            textContent: '⚙ Manage Plays',
            onclick: () => { mode = 'manage'; render() },
          }),
        ]))
      } else if (plays.length === 0) {
        grid.appendChild(el('p', {
          style: { color: '#888', gridColumn: '1 / -1', padding: '24px 0' },
          textContent: 'No plays match your filters.',
        }))
      } else {
        for (const play of plays) {
          grid.appendChild(buildPlayCard(play, rosterMap, codeNames[play.id]))
        }
      }

      // Render canvases
      requestAnimationFrame(() => {
        for (const play of plays) {
          const canvas = grid.querySelector(`[data-play-id="${play.id}"] canvas`)
          if (canvas && canvas.offsetWidth > 0) {
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
            renderPlay(canvas, play, { rosterMap, showDefense: true, showReadNumbers: false, mini: true })
          }
        }
      })
    }

    refreshGrid()
    view.appendChild(grid)
    outlet.appendChild(view)

    // Resize handler
    function onResize() {
      requestAnimationFrame(() => {
        const plays = getFilteredPlays()
        for (const play of plays) {
          const canvas = grid.querySelector(`[data-play-id="${play.id}"] canvas`)
          if (canvas && canvas.offsetWidth > 0) {
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
            renderPlay(canvas, play, { rosterMap, showDefense: true, showReadNumbers: false, mini: true })
          }
        }
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }

  // ─── MANAGE MODE: Add/remove/reorder plays, set code names ────────────────
  function renderManageMode(rosterMap) {
    const playbooks = store.getPlaybooks()
    const pb = playbooks.find(p => p.id === selectedPlaybookId)
    if (!pb) { mode = 'list'; render(); return }

    const activeId = store.get().activePlaybookId
    const isActive = pb.id === activeId

    const view = el('div', { className: 'playbook-view' })

    // ── Header
    const nameInput = el('input', {
      className: 'input playbook-name-input',
      type: 'text',
      value: pb.name,
    })
    nameInput.addEventListener('blur', () => saveName(nameInput.value))
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') nameInput.blur() })

    const activeEl = isActive
      ? el('span', { className: 'playbook-active-badge', textContent: '★ Active' })
      : el('button', {
          className: 'btn btn-ghost btn-sm',
          textContent: 'Set Active',
          onclick: () => {
            store.set({ activePlaybookId: pb.id })
            showToast(`"${pb.name}" set as active`)
            render()
          },
        })

    view.appendChild(el('div', { className: 'playbook-editor-header' }, [
      el('button', {
        className: 'btn btn-ghost btn-sm',
        textContent: '← Done',
        onclick: () => { mode = 'view'; render() },
      }),
      nameInput,
      activeEl,
    ]))

    // ── Current plays list with reorder + code names
    const sortedPlays = [...pb.plays].sort((a, b) => a.order - b.order)
    const playsList = el('div', { className: 'playbook-plays-list' })

    if (sortedPlays.length === 0) {
      playsList.appendChild(el('div', { className: 'playbook-empty-plays' }, [
        el('p', { textContent: 'No plays added yet. Use the picker below to add plays.' }),
      ]))
    } else {
      for (const entry of sortedPlays) {
        const play = PLAY_LIBRARY.find(p => p.id === entry.playId)
        if (!play) {
          playsList.appendChild(el('div', { className: 'playbook-play-item' }, [
            el('div', { className: 'playbook-play-info' }, [
              el('div', { className: 'playbook-play-real-name', textContent: `⚠️ Not found: ${entry.playId}` }),
            ]),
            el('div', { className: 'playbook-play-actions' }, [
              el('button', { className: 'btn btn-danger btn-sm', textContent: '✕', onclick: () => removePlay(entry.playId) }),
            ]),
          ]))
          continue
        }

        const codeNameInput = el('input', {
          className: 'input input-sm codename-input',
          type: 'text',
          value: entry.codeName,
          placeholder: 'Code name...',
        })
        codeNameInput.addEventListener('blur', () => saveCodeName(entry.playId, codeNameInput.value))
        codeNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') codeNameInput.blur() })

        const canvas = el('canvas', {})
        const thumb = el('div', { className: 'playbook-play-thumb' }, [canvas])

        playsList.appendChild(el('div', {
          className: 'playbook-play-item',
          dataset: { playId: entry.playId, order: String(entry.order) },
        }, [
          thumb,
          el('div', { className: 'playbook-play-info' }, [
            codeNameInput,
            el('div', { className: 'playbook-play-real-name', textContent: play.name }),
          ]),
          el('div', { className: 'playbook-play-actions' }, [
            el('button', { className: 'btn btn-ghost btn-sm', textContent: '▲', onclick: () => movePlay(entry.playId, -1) }),
            el('button', { className: 'btn btn-ghost btn-sm', textContent: '▼', onclick: () => movePlay(entry.playId, 1) }),
            el('button', { className: 'btn btn-danger btn-sm', textContent: '✕', onclick: () => removePlay(entry.playId) }),
          ]),
        ]))
      }
    }
    view.appendChild(playsList)

    // ── Play picker (always visible in manage mode)
    const picker = el('div', { className: 'playbook-play-picker' })
    picker.appendChild(el('h3', { textContent: 'Add Plays', style: { margin: '16px 0 8px', color: '#e94560' } }))

    const pickerSearch = el('input', {
      type: 'text',
      className: 'input filter-search',
      placeholder: '🔍 Search plays…',
      value: searchFilters.search,
    })
    pickerSearch.addEventListener('input', () => {
      searchFilters.search = pickerSearch.value
      rebuildPickerGrid()
    })

    const pickerFormation = buildSelect('Formation', getFormations(), v => {
      searchFilters.formation = v; rebuildPickerGrid()
    })
    pickerFormation.value = searchFilters.formation

    picker.appendChild(el('div', { className: 'filter-bar' }, [pickerSearch, pickerFormation]))

    const pickerGrid = el('div', { className: 'play-picker-grid' })
    picker.appendChild(pickerGrid)

    function rebuildPickerGrid() {
      clear(pickerGrid)
      const currentPb = store.getPlaybooks().find(p => p.id === selectedPlaybookId)
      const addedIds = new Set(currentPb ? currentPb.plays.map(e => e.playId) : [])
      const plays = filterPlays(searchFilters)

      for (const play of plays) {
        const alreadyAdded = addedIds.has(play.id)
        const canvas = el('canvas', {})
        const addBtn = el('button', {
          className: alreadyAdded ? 'btn btn-sm btn-added' : 'btn btn-primary btn-sm',
          textContent: alreadyAdded ? '✓ Added' : '+ Add',
          onclick: () => { if (!alreadyAdded) addPlayToPlaybook(play.id) },
        })
        if (alreadyAdded) addBtn.disabled = true

        pickerGrid.appendChild(el('div', {
          className: 'play-picker-card',
          dataset: { playId: play.id },
        }, [
          canvas,
          el('div', { className: 'play-picker-card-info' }, [
            el('span', { textContent: play.name }),
            addBtn,
          ]),
        ]))
      }

      requestAnimationFrame(() => {
        for (const play of plays) {
          const canvas = pickerGrid.querySelector(`.play-picker-card[data-play-id="${play.id}"] canvas`)
          if (!canvas) continue
          canvas.width = canvas.offsetWidth || 160
          canvas.height = canvas.offsetHeight || 120
          renderPlay(canvas, play, { rosterMap, showDefense: true, showReadNumbers: false, mini: true })
        }
      })
    }

    rebuildPickerGrid()
    view.appendChild(picker)

    // ── Delete playbook button
    view.appendChild(el('div', { style: { marginTop: '24px', textAlign: 'center' } }, [
      el('button', {
        className: 'btn btn-danger btn-sm',
        textContent: '🗑 Delete Playbook',
        onclick: () => deletePlaybook(pb),
      }),
    ]))

    outlet.appendChild(view)

    // Render thumbnails
    requestAnimationFrame(() => {
      for (const entry of sortedPlays) {
        const play = PLAY_LIBRARY.find(p => p.id === entry.playId)
        if (!play) continue
        const canvas = outlet.querySelector(`.playbook-play-item[data-play-id="${entry.playId}"] canvas`)
        if (!canvas) continue
        canvas.width = canvas.offsetWidth || 120
        canvas.height = canvas.offsetHeight || 90
        renderPlay(canvas, play, { rosterMap, showDefense: true, showReadNumbers: false, mini: true })
      }
    })
  }

  // ─── LIST MODE: Show all playbooks (for switching/creating) ───────────────
  function renderPlaybookList(rosterMap) {
    const playbooks = store.getPlaybooks()
    const activeId = store.get().activePlaybookId

    const view = el('div', { className: 'playbook-view' })
    view.appendChild(el('div', { className: 'playbook-list-header' }, [
      el('h1', { textContent: '📋 Playbooks' }),
      el('button', { className: 'btn btn-primary btn-sm', textContent: '+ New Playbook', onclick: createPlaybook }),
    ]))

    const grid = el('div', { className: 'playbook-grid' })

    if (playbooks.length === 0) {
      grid.appendChild(el('div', { className: 'playbook-empty' }, [
        el('p', { textContent: 'No playbooks yet. Create one to organize your plays for game day.' }),
      ]))
    } else {
      for (const pb of playbooks) {
        const isActive = pb.id === activeId
        const countText = `${pb.plays.length} play${pb.plays.length !== 1 ? 's' : ''}`

        grid.appendChild(el('div', {
          className: `playbook-card ${isActive ? 'playbook-card-active' : ''}`,
          onclick: () => { selectedPlaybookId = pb.id; mode = 'view'; render() },
          style: { cursor: 'pointer' },
        }, [
          el('div', { className: 'playbook-card-header' }, [
            el('h3', { textContent: pb.name }),
            el('span', { className: 'playbook-card-count', textContent: countText }),
          ]),
          isActive ? el('span', { className: 'playbook-active-badge', textContent: '★ Active' }) : null,
        ].filter(Boolean)))
      }
    }

    view.appendChild(grid)
    outlet.appendChild(view)
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  function createPlaybook() {
    const name = prompt('Playbook name:')
    if (!name || !name.trim()) return
    const playbooks = store.getPlaybooks()
    const pb = { id: 'pb_' + Date.now(), name: name.trim(), plays: [], createdAt: Date.now() }
    playbooks.push(pb)
    store.set({ playbooks })
    if (playbooks.length === 1) store.set({ activePlaybookId: pb.id })
    selectedPlaybookId = pb.id
    mode = 'manage'  // Go straight to manage so they can add plays
    render()
    showToast(`"${pb.name}" created — add some plays!`)
  }

  function deletePlaybook(pb) {
    if (!confirm(`Delete "${pb.name}"?`)) return
    const playbooks = store.getPlaybooks().filter(p => p.id !== pb.id)
    store.set({ playbooks })
    if (store.get().activePlaybookId === pb.id) store.set({ activePlaybookId: null })
    if (selectedPlaybookId === pb.id) selectedPlaybookId = null
    mode = playbooks.length > 0 ? 'view' : 'list'
    render()
    showToast(`"${pb.name}" deleted`)
  }

  function saveName(newName) {
    if (!newName.trim()) return
    const playbooks = store.getPlaybooks()
    const idx = playbooks.findIndex(p => p.id === selectedPlaybookId)
    if (idx === -1) return
    playbooks[idx].name = newName.trim()
    store.set({ playbooks })
  }

  function saveCodeName(playId, newCodeName) {
    const playbooks = store.getPlaybooks()
    const pb = playbooks.find(p => p.id === selectedPlaybookId)
    if (!pb) return
    const entry = pb.plays.find(e => e.playId === playId)
    if (!entry) return
    entry.codeName = newCodeName.trim()
    store.set({ playbooks })
  }

  function movePlay(playId, direction) {
    const playbooks = store.getPlaybooks()
    const pb = playbooks.find(p => p.id === selectedPlaybookId)
    if (!pb) return
    pb.plays.sort((a, b) => a.order - b.order)
    const idx = pb.plays.findIndex(e => e.playId === playId)
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= pb.plays.length) return
    const tmpOrder = pb.plays[idx].order
    pb.plays[idx].order = pb.plays[swapIdx].order
    pb.plays[swapIdx].order = tmpOrder
    store.set({ playbooks })
    render()
  }

  function addPlayToPlaybook(playId) {
    const playbooks = store.getPlaybooks()
    const pb = playbooks.find(p => p.id === selectedPlaybookId)
    if (!pb) return
    if (pb.plays.some(e => e.playId === playId)) { showToast('Already in playbook'); return }
    const maxOrder = pb.plays.length > 0 ? Math.max(...pb.plays.map(e => e.order)) + 1 : 0
    pb.plays.push({ playId, codeName: '', order: maxOrder })
    store.set({ playbooks })
    render()
    showToast('Play added')
  }

  function removePlay(playId) {
    const playbooks = store.getPlaybooks()
    const pb = playbooks.find(p => p.id === selectedPlaybookId)
    if (!pb) return
    pb.plays = pb.plays.filter(e => e.playId !== playId)
    pb.plays.sort((a, b) => a.order - b.order)
    pb.plays.forEach((e, i) => e.order = i)
    store.set({ playbooks })
    render()
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function buildSelect(label, options, onChange) {
    const select = el('select', { className: 'input filter-select' })
    select.appendChild(el('option', { value: '', textContent: `${label} ▾` }))
    for (const opt of options) {
      select.appendChild(el('option', { value: opt, textContent: opt.charAt(0).toUpperCase() + opt.slice(1) }))
    }
    select.addEventListener('change', () => onChange(select.value))
    return select
  }

  function buildPlayCard(play, rosterMap, codeName) {
    const canvas = el('canvas', {})
    canvas.width = 200
    canvas.height = 150

    const tagBadges = play.tags.slice(0, 3).map(t =>
      el('span', { className: 'tag-badge', textContent: t })
    )

    const typeIcon = play.isRunPlay ? '🏃' : '🎯'
    const displayName = codeName ? `${codeName}` : play.name

    const info = el('div', { className: 'play-card-info' }, [
      el('div', { className: 'play-card-name', textContent: `${typeIcon} ${displayName}` }),
      codeName
        ? el('div', { className: 'play-card-meta', textContent: `${play.name} · ${play.formation}` })
        : el('div', { className: 'play-card-meta', textContent: play.formation }),
      el('div', { className: 'play-card-tags', style: { marginTop: '6px' } }, tagBadges),
    ])

    return el('div', {
      className: 'play-card',
      dataset: { playId: play.id },
      onclick: () => { window.location.hash = `#/play/${play.id}` },
    }, [canvas, info])
  }

  // ─── Subscribe & init ─────────────────────────────────────────────────────
  const unsubscribe = store.subscribe(() => render())
  render()
  return () => unsubscribe()
}
