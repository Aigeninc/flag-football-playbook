import { el, clear } from '../utils/dom.js'
import { PLAY_LIBRARY, filterPlays, getFormations, getTags, getFamilies } from '../play-library.js'
import { renderPlay } from '../canvas/renderer.js'

/**
 * Play Library view — browsable grid of all 30 plays with search & filter.
 */
export function playLibraryView(params, outlet) {
  clear(outlet)

  // ── State ──────────────────────────────────────────────────────────────────
  let filters = { search: '', formation: '', tag: '', family: '' }
  let currentPlays = [...PLAY_LIBRARY]

  // Get roster map from store if available
  const rosterMap = window.__store ? window.__store.getRosterMap() : {}

  // ── Header ─────────────────────────────────────────────────────────────────
  const countEl = el('span', {
    className: 'library-count',
    textContent: `Showing ${PLAY_LIBRARY.length} of ${PLAY_LIBRARY.length} plays`,
  })

  const header = el('div', { className: 'library-header' }, [
    el('h1', { textContent: '📚 Play Library' }),
    countEl,
  ])

  // ── Filter Bar ─────────────────────────────────────────────────────────────

  // Search input
  const searchInput = el('input', {
    type: 'text',
    className: 'input filter-search',
    placeholder: '🔍 Search plays…',
  })
  searchInput.addEventListener('input', () => {
    filters.search = searchInput.value
    refresh()
  })

  // Formation dropdown
  const formationSelect = buildSelect(
    'Formation',
    getFormations(),
    (v) => { filters.formation = v; refresh() }
  )

  // Tag dropdown
  const tagSelect = buildSelect(
    'Tag',
    getTags(),
    (v) => { filters.tag = v; refresh() }
  )

  // Family dropdown
  const familySelect = buildSelect(
    'Family',
    getFamilies(),
    (v) => { filters.family = v; refresh() }
  )

  // Clear button
  const clearBtn = el('button', {
    className: 'btn btn-ghost filter-clear hidden',
    textContent: '✕ Clear',
    onclick: () => {
      filters = { search: '', formation: '', tag: '', family: '' }
      searchInput.value = ''
      formationSelect.value = ''
      tagSelect.value = ''
      familySelect.value = ''
      clearBtn.classList.add('hidden')
      refresh()
    },
  })

  const filterBar = el('div', { className: 'filter-bar' }, [
    searchInput,
    formationSelect,
    tagSelect,
    familySelect,
    clearBtn,
  ])

  // ── Play Grid ──────────────────────────────────────────────────────────────
  const grid = el('div', { className: 'play-grid' })

  function refresh() {
    const hasFilter = filters.search || filters.formation || filters.tag || filters.family
    if (hasFilter) {
      clearBtn.classList.remove('hidden')
    } else {
      clearBtn.classList.add('hidden')
    }

    currentPlays = filterPlays(filters)
    countEl.textContent = `Showing ${currentPlays.length} of ${PLAY_LIBRARY.length} plays`

    // Rebuild grid
    clear(grid)
    if (currentPlays.length === 0) {
      grid.appendChild(el('p', {
        style: { color: '#888', gridColumn: '1 / -1', padding: '24px 0' },
        textContent: 'No plays match your filters.',
      }))
      return
    }

    for (const play of currentPlays) {
      grid.appendChild(buildPlayCard(play, rosterMap))
    }

    // Render all canvases after DOM insertion (needs to be in DOM for size)
    requestAnimationFrame(() => {
      for (const play of currentPlays) {
        const canvas = grid.querySelector(`[data-play-id="${play.id}"] canvas`)
        if (canvas) {
          canvas.width  = canvas.offsetWidth  || 200
          canvas.height = canvas.offsetHeight || 150
          renderPlay(canvas, play, { rosterMap, showDefense: true, showReadNumbers: false, mini: true })
        }
      }
    })
  }

  // Build initial grid
  refresh()

  // ── Assemble ───────────────────────────────────────────────────────────────
  outlet.appendChild(header)
  outlet.appendChild(filterBar)
  outlet.appendChild(grid)

  // Re-render canvases when window resizes (responsive grid may change card size)
  function onResize() {
    requestAnimationFrame(() => {
      for (const play of currentPlays) {
        const canvas = grid.querySelector(`[data-play-id="${play.id}"] canvas`)
        if (canvas && canvas.offsetWidth > 0) {
          canvas.width  = canvas.offsetWidth
          canvas.height = canvas.offsetHeight
          renderPlay(canvas, play, { rosterMap, showDefense: true, showReadNumbers: false, mini: true })
        }
      }
    })
  }
  window.addEventListener('resize', onResize)

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', onResize)
  }
}

// ── Card Builder ──────────────────────────────────────────────────────────────

function buildPlayCard(play, rosterMap) {
  const canvas = el('canvas', {})
  // Set intrinsic size; actual rendering happens after DOM insertion
  canvas.width  = 200
  canvas.height = 150

  const tagBadges = play.tags.slice(0, 3).map(t =>
    el('span', { className: 'tag-badge', textContent: t })
  )

  const typeIcon = play.isRunPlay ? '🏃' : '🎯'

  const info = el('div', { className: 'play-card-info' }, [
    el('div', { className: 'play-card-name', textContent: `${typeIcon} ${play.name}` }),
    el('div', { className: 'play-card-meta', textContent: `${play.formation}` }),
    el('div', { className: 'play-card-tags', style: { marginTop: '6px' } }, tagBadges),
  ])

  const card = el('div', {
    className: 'play-card',
    dataset: { playId: play.id },
    onclick: () => {
      window.location.hash = `#/play/${play.id}`
    },
  }, [canvas, info])

  return card
}

// ── Dropdown Builder ──────────────────────────────────────────────────────────

function buildSelect(label, options, onChange) {
  const select = el('select', { className: 'input filter-select' })

  // Default "all" option
  const defaultOpt = document.createElement('option')
  defaultOpt.value = ''
  defaultOpt.textContent = `${label} ▾`
  select.appendChild(defaultOpt)

  for (const opt of options) {
    const o = document.createElement('option')
    o.value = opt
    o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1)
    select.appendChild(o)
  }

  select.addEventListener('change', () => onChange(select.value))
  return select
}
