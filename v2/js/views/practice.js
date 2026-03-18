// views/practice.js — Practice Planner view (Builder + Run modes) for v2
// Pattern: view function, el() DOM helpers, store API, storage load/save

import { el, clear, showToast } from '../utils/dom.js'
import { DRILL_LIBRARY, DRILL_CATEGORIES, PRACTICE_TEMPLATES, getDrillById, getDrillsByCategory } from '../drill-library.js'
import { PLAY_LIBRARY } from '../play-library.js'
import { renderJukeTutorial } from './juke-tutorial.js'

// ─────────────────────────────────────────────────────────────────────────────
// Main view entry point
// ─────────────────────────────────────────────────────────────────────────────

export function practiceView(params, outlet) {
  const store = window.__store

  // Local UI state (closure)
  let mode = 'builder'         // 'builder' | 'run'
  let currentPlan = null       // Plan being edited / running
  let expandedBlockIdx = -1    // Which block is expanded in builder
  let showDrillPicker = false
  let drillPickerInsertIdx = -1  // Insert after this index (-1 = append)
  let drillPickerCategory = ''
  let showTemplates = false
  let showSavedPlans = false
  let showPlaySelector = -1    // Block idx for play linker, -1 = closed
  let showCustomForm = false
  let showJukeOverlay = false
  let jukeInitialMoveId = 'cut-juke'
  let jukeCleanup = null

  // Run mode state
  let runBlockIdx = 0
  let runTimerInterval = null
  let runTimerSeconds = 0
  let runTimerRunning = false
  let runTimerMode = 'timer'     // 'timer' | 'stopwatch'
  let runTimerExpired = false
  let runSetupExpanded = false
  let runPointsExpanded = true

  function getState() {
    return store.get()
  }

  function getPracticePlans() {
    return getState().practicePlans || []
  }

  function getCustomDrills() {
    return getState().customDrills || []
  }

  function getDrill(id) {
    return getDrillById(id, getCustomDrills())
  }

  function getTimeUsed(plan) {
    if (!plan) return 0
    return plan.blocks.reduce((sum, b) => sum + (b.duration || 0), 0)
  }

  // ─── Timer helpers ─────────────────────────────────────────────────────────

  function stopTimer() {
    if (runTimerInterval) {
      clearInterval(runTimerInterval)
      runTimerInterval = null
    }
    runTimerRunning = false
  }

  function resetTimerForBlock(blockIdx) {
    stopTimer()
    runTimerExpired = false
    if (!currentPlan || blockIdx >= currentPlan.blocks.length) return
    const block = currentPlan.blocks[blockIdx]
    if (runTimerMode === 'timer') {
      runTimerSeconds = (block.duration || 5) * 60
    } else {
      runTimerSeconds = 0
    }
  }

  function startTimer() {
    if (runTimerRunning) return
    runTimerRunning = true
    runTimerInterval = setInterval(() => {
      if (runTimerMode === 'timer') {
        if (runTimerSeconds > 0) {
          runTimerSeconds--
        } else {
          runTimerExpired = true
        }
      } else {
        runTimerSeconds++
      }
      renderTimerDisplay()
    }, 1000)
  }

  function formatTime(secs) {
    const m = Math.floor(Math.abs(secs) / 60)
    const s = Math.abs(secs) % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Lightweight: only update the timer display element in run view
  function renderTimerDisplay() {
    const timerEl = outlet.querySelector('.pp-run-timer')
    const pauseBtn = outlet.querySelector('.pp-run-pause-btn')
    if (!timerEl) return
    timerEl.textContent = formatTime(runTimerSeconds)
    timerEl.className = 'pp-run-timer'
    if (runTimerMode === 'stopwatch') {
      timerEl.classList.add(runTimerRunning ? 'stopwatch' : 'paused')
    } else if (runTimerExpired) {
      timerEl.classList.add('expired')
    } else if (runTimerRunning) {
      timerEl.classList.add('running')
    } else {
      timerEl.classList.add('paused')
    }
    if (pauseBtn) pauseBtn.textContent = runTimerRunning ? '⏸' : '▶'
  }

  // ─── Render: root dispatcher ───────────────────────────────────────────────

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

    if (mode === 'run' && currentPlan) {
      renderRunView()
    } else {
      renderBuilderView()
    }
  }

  // ─── Builder View ─────────────────────────────────────────────────────────

  function renderBuilderView() {
    const container = el('div', { className: 'pp-builder' })

    // Header
    container.appendChild(el('div', { className: 'pp-builder-header' }, [
      el('h2', { textContent: '🏃 Practice Planner', style: { margin: '0 0 4px 0' } }),
      el('p', { textContent: 'Build and run your practice plan', style: { color: '#888', fontSize: '13px', margin: 0 } }),
    ]))

    if (showDrillPicker) {
      container.appendChild(renderDrillPickerPanel())
      outlet.appendChild(container)
      return
    }

    if (showTemplates) {
      container.appendChild(renderTemplatesPicker())
      outlet.appendChild(container)
      return
    }

    if (showCustomForm) {
      container.appendChild(renderCustomDrillForm())
      outlet.appendChild(container)
      return
    }

    if (showPlaySelector >= 0) {
      container.appendChild(renderPlaySelector(showPlaySelector))
      outlet.appendChild(container)
      return
    }

    if (!currentPlan) {
      container.appendChild(renderNoPlanState())
    } else {
      container.appendChild(renderPlanEditor())
    }

    // Juke Tutorial entry card
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
        el('div', { className: 'jk-entry-desc', textContent: '6 animated evasion techniques with coaching cues' }),
      ]),
    ]))

    // Saved plans section
    container.appendChild(renderSavedPlansSection())

    outlet.appendChild(container)
  }

  // ── No-plan state ──────────────────────────────────────────────────────────

  function renderNoPlanState() {
    return el('div', { className: 'card', style: { textAlign: 'center', padding: '32px 16px' } }, [
      el('div', { textContent: '📋', style: { fontSize: '48px', marginBottom: '12px' } }),
      el('p', { textContent: 'No plan loaded. Create a new one or load a saved plan.', style: { color: '#aaa', marginBottom: '20px' } }),
      el('button', {
        className: 'btn btn-primary',
        textContent: '+ New Practice Plan',
        onClick: () => { showTemplates = true; render() },
      }),
    ])
  }

  // ── Plan editor ────────────────────────────────────────────────────────────

  function renderPlanEditor() {
    const wrap = el('div', {})

    // Plan name (inline editable)
    const nameInput = el('input', {
      className: 'input',
      type: 'text',
      value: currentPlan.name,
      style: { fontWeight: '600', fontSize: '16px', marginBottom: '8px' },
      onInput: (e) => { currentPlan.name = e.target.value },
    })
    wrap.appendChild(el('div', { className: 'pp-plan-header' }, [
      el('label', { textContent: 'Plan Name', style: { fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' } }),
      nameInput,
    ]))

    // Duration pills
    const durations = [60, 75, 90]
    const pillsRow = el('div', { className: 'pp-duration-pills' }, durations.map(d =>
      el('button', {
        className: `pp-duration-pill${currentPlan.totalMinutes === d ? ' active' : ''}`,
        textContent: `${d} min`,
        onClick: () => { currentPlan.totalMinutes = d; render() },
      })
    ))
    const customInput = el('input', {
      className: 'input input-sm',
      type: 'number',
      min: '15',
      max: '180',
      value: currentPlan.totalMinutes,
      style: { width: '64px', textAlign: 'center' },
      onChange: (e) => {
        const v = parseInt(e.target.value)
        if (v >= 15 && v <= 180) { currentPlan.totalMinutes = v; render() }
      },
    })
    pillsRow.appendChild(customInput)
    wrap.appendChild(pillsRow)

    // Time bar
    const used = getTimeUsed(currentPlan)
    const total = currentPlan.totalMinutes || 75
    const pct = Math.min(100, (used / total) * 100)
    const barColor = pct >= 100 ? '#ef4444' : pct >= 85 ? '#f59e0b' : '#22c55e'
    wrap.appendChild(el('div', { className: 'pp-time-bar-wrap' }, [
      el('div', { className: 'pp-time-label', textContent: `Used: ${used} / ${total} min` }),
      el('div', { className: 'pp-time-bar' }, [
        el('div', { className: 'pp-time-fill', style: { width: `${pct}%`, background: barColor } }),
      ]),
    ]))

    // Block list
    const blocksWrap = el('div', { className: 'pp-blocks' })
    if (currentPlan.blocks.length === 0) {
      blocksWrap.appendChild(el('div', { className: 'pp-empty-blocks', textContent: 'No drills yet. Add your first drill below.' }))
    }

    currentPlan.blocks.forEach((block, idx) => {
      blocksWrap.appendChild(renderBlockCard(block, idx))
      // "Add drill here" between blocks
      blocksWrap.appendChild(el('button', {
        className: 'pp-add-drill-btn-inline',
        textContent: '＋',
        title: 'Add drill here',
        onClick: () => { drillPickerInsertIdx = idx; showDrillPicker = true; render() },
      }))
    })

    // Main "+ Add Drill" button
    blocksWrap.appendChild(el('button', {
      className: 'btn pp-add-drill-btn',
      textContent: '+ Add Drill',
      onClick: () => { drillPickerInsertIdx = -1; showDrillPicker = true; render() },
    }))

    wrap.appendChild(blocksWrap)

    // Action bar
    wrap.appendChild(el('div', { className: 'pp-action-bar' }, [
      el('button', {
        className: 'btn btn-sm',
        textContent: '💾 Save',
        onClick: () => savePlan(),
      }),
      el('button', {
        className: 'btn btn-sm btn-ghost',
        textContent: '📋 Duplicate',
        onClick: () => duplicatePlan(),
      }),
      el('button', {
        className: 'btn btn-sm btn-danger',
        textContent: '🗑️',
        onClick: () => {
          if (confirm('Delete this plan?')) { deletePlan(currentPlan.id); currentPlan = null; render() }
        },
      }),
    ]))

    // Run CTA
    wrap.appendChild(el('button', {
      className: 'btn btn-primary pp-run-cta',
      textContent: '▶ Run This Plan',
      onClick: () => startRunMode(),
    }))

    // New plan button
    wrap.appendChild(el('button', {
      className: 'btn btn-ghost',
      textContent: '+ New Plan',
      style: { marginTop: '8px', width: '100%' },
      onClick: () => { showTemplates = true; render() },
    }))

    return wrap
  }

  // ── Block card ─────────────────────────────────────────────────────────────

  function renderBlockCard(block, idx) {
    const drill = getDrill(block.drillId)
    const catMeta = DRILL_CATEGORIES[drill?.category] || { emoji: '📋', label: block.drillId, color: '#888' }
    const isExpanded = expandedBlockIdx === idx

    const card = el('div', {
      className: `pp-block${isExpanded ? ' pp-block-expanded' : ''}`,
      onClick: (e) => {
        // Don't collapse if clicking inner controls
        if (e.target.closest('.pp-block-detail')) return
        expandedBlockIdx = isExpanded ? -1 : idx
        render()
      },
    })

    // Header
    const header = el('div', { className: 'pp-block-header' }, [
      el('span', { className: 'pp-block-num', textContent: String(idx + 1) }),
      el('span', { className: 'pp-block-name', textContent: drill?.name || block.drillId }),
      el('span', {
        className: 'pp-block-cat',
        textContent: `${catMeta.emoji} ${catMeta.label}`,
        style: { background: catMeta.color + '22', color: catMeta.color, border: `1px solid ${catMeta.color}44` },
      }),
      el('span', { className: 'pp-block-time', textContent: `${block.duration}m` }),
    ])
    card.appendChild(header)

    // Note preview (collapsed)
    if (!isExpanded && block.notes) {
      card.appendChild(el('div', { className: 'pp-block-note-preview', textContent: `📝 ${block.notes}` }))
    }

    // Linked plays preview (collapsed, for play-walkthrough)
    if (!isExpanded && block.linkedPlays && block.linkedPlays.length > 0) {
      card.appendChild(el('div', { className: 'pp-block-note-preview', textContent: block.linkedPlays.join(', ') }))
    }

    // Expanded detail
    if (isExpanded) {
      card.appendChild(renderBlockDetail(block, idx, drill, catMeta))
    }

    return card
  }

  // ── Block detail (expanded) ─────────────────────────────────────────────────

  function renderBlockDetail(block, idx, drill, catMeta) {
    const detail = el('div', { className: 'pp-block-detail', onClick: (e) => e.stopPropagation() })

    // Time stepper
    detail.appendChild(el('div', { className: 'pp-time-stepper' }, [
      el('button', {
        className: 'btn btn-sm pp-step-btn',
        textContent: '◀',
        onClick: () => { block.duration = Math.max(1, (block.duration || 5) - 5); render() },
      }),
      el('span', { className: 'pp-step-val', textContent: `${block.duration} min` }),
      el('button', {
        className: 'btn btn-sm pp-step-btn',
        textContent: '▶',
        onClick: () => { block.duration = Math.min(60, (block.duration || 5) + 5); render() },
      }),
    ]))

    // Notes textarea
    const notesTA = el('textarea', {
      className: 'input pp-notes-input',
      placeholder: 'Coach notes for this drill...',
      style: { height: '64px', resize: 'vertical' },
    })
    notesTA.value = block.notes || ''
    notesTA.addEventListener('input', (e) => { block.notes = e.target.value })
    detail.appendChild(el('label', { style: { fontSize: '12px', color: '#888', display: 'block', marginTop: '8px', marginBottom: '2px' }, textContent: 'Notes' }))
    detail.appendChild(notesTA)

    // Coaching points (read-only)
    if (drill && drill.coachingPoints && drill.coachingPoints.length > 0) {
      detail.appendChild(el('div', { className: 'pp-block-points' }, [
        el('div', { textContent: '🎯 Coaching Points', style: { fontWeight: '600', fontSize: '12px', color: '#aaa', marginBottom: '4px' } }),
        el('ul', { style: { margin: '0', paddingLeft: '16px' } },
          drill.coachingPoints.map(pt => el('li', { textContent: pt, style: { fontSize: '12px', color: '#ccc', marginBottom: '2px' } }))
        ),
      ]))
    }

    // Play linker (for play-walkthrough)
    if (drill && drill.linkedPlays) {
      detail.appendChild(renderPlayLinkerInline(block, idx))
    }

    // Juke tutorial trigger for evasion drills
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

    // Move + remove actions
    detail.appendChild(el('div', { className: 'pp-block-actions' }, [
      el('button', {
        className: 'btn btn-sm btn-ghost',
        textContent: '↑ Up',
        disabled: idx === 0,
        onClick: () => { moveBlock(idx, -1); expandedBlockIdx = idx - 1; render() },
      }),
      el('button', {
        className: 'btn btn-sm btn-ghost',
        textContent: '↓ Down',
        disabled: idx === currentPlan.blocks.length - 1,
        onClick: () => { moveBlock(idx, 1); expandedBlockIdx = idx + 1; render() },
      }),
      el('button', {
        className: 'btn btn-sm btn-danger',
        textContent: '🗑️ Remove',
        onClick: () => { removeBlock(idx); expandedBlockIdx = -1; render() },
      }),
    ]))

    return detail
  }

  // ── Play linker inline ──────────────────────────────────────────────────────

  function renderPlayLinkerInline(block, idx) {
    const wrap = el('div', { className: 'pp-play-linker' })
    wrap.appendChild(el('div', { textContent: '🏈 Linked Plays', style: { fontSize: '12px', color: '#aaa', fontWeight: '600', marginBottom: '4px' } }))

    const chips = el('div', { className: 'pp-play-chips' })
    for (const playName of (block.linkedPlays || [])) {
      chips.appendChild(el('span', { className: 'pp-play-chip' }, [
        el('span', { textContent: playName }),
        el('button', {
          className: 'pp-play-chip-remove',
          textContent: '✕',
          onClick: () => {
            block.linkedPlays = block.linkedPlays.filter(n => n !== playName)
            render()
          },
        }),
      ]))
    }
    wrap.appendChild(chips)

    wrap.appendChild(el('button', {
      className: 'btn btn-sm btn-ghost',
      textContent: '+ Link a Play',
      style: { marginTop: '4px' },
      onClick: () => { showPlaySelector = idx; render() },
    }))

    return wrap
  }

  // ── Play selector overlay ───────────────────────────────────────────────────

  function renderPlaySelector(forBlockIdx) {
    const block = currentPlan.blocks[forBlockIdx]
    const linked = block.linkedPlays || []

    const wrap = el('div', { className: 'pp-overlay' })
    wrap.appendChild(el('div', { className: 'pp-overlay-header' }, [
      el('button', {
        className: 'btn btn-sm btn-ghost',
        textContent: '← Back',
        onClick: () => { showPlaySelector = -1; render() },
      }),
      el('span', { textContent: 'Link a Play', style: { fontWeight: '600' } }),
    ]))

    const list = el('div', { className: 'pp-play-selector-list' })
    for (const play of PLAY_LIBRARY) {
      const isLinked = linked.includes(play.name)
      list.appendChild(el('div', {
        className: `pp-play-option${isLinked ? ' selected' : ''}`,
        onClick: () => {
          if (!isLinked) {
            block.linkedPlays = [...(block.linkedPlays || []), play.name]
          } else {
            block.linkedPlays = block.linkedPlays.filter(n => n !== play.name)
          }
          render()
        },
      }, [
        el('span', { textContent: isLinked ? '✅' : '○', style: { marginRight: '8px' } }),
        el('span', { textContent: play.name }),
      ]))
    }
    wrap.appendChild(list)
    return wrap
  }

  // ── Drill picker panel ──────────────────────────────────────────────────────

  function renderDrillPickerPanel() {
    const wrap = el('div', { className: 'pp-overlay' })

    wrap.appendChild(el('div', { className: 'pp-overlay-header' }, [
      el('button', {
        className: 'btn btn-sm btn-ghost',
        textContent: '← Back',
        onClick: () => { showDrillPicker = false; render() },
      }),
      el('span', { textContent: 'Add Drill', style: { fontWeight: '600' } }),
    ]))

    // Category pills
    const allCats = ['', ...Object.keys(DRILL_CATEGORIES)]
    const pickers = el('div', { className: 'pp-cat-pills' },
      allCats.map(cat => {
        const meta = cat ? DRILL_CATEGORIES[cat] : null
        return el('button', {
          className: `pp-cat-pill${drillPickerCategory === cat ? ' active' : ''}`,
          textContent: cat ? `${meta.emoji} ${meta.label}` : 'All',
          onClick: () => { drillPickerCategory = cat; render() },
        })
      })
    )
    wrap.appendChild(pickers)

    // Drill list
    const drills = getDrillsByCategory(drillPickerCategory, getCustomDrills())
    const list = el('div', { className: 'pp-drill-list' })
    for (const drill of drills) {
      const catMeta = DRILL_CATEGORIES[drill.category] || { emoji: '📋', label: drill.category, color: '#888' }
      list.appendChild(el('div', {
        className: 'pp-drill-card',
        onClick: () => {
          addDrill(drill.id)
          showDrillPicker = false
          render()
        },
      }, [
        el('div', { className: 'pp-drill-card-header' }, [
          el('span', { className: 'pp-drill-card-name', textContent: drill.name }),
          el('span', {
            className: 'pp-drill-card-cat',
            textContent: `${catMeta.emoji} ${catMeta.label}`,
            style: { color: catMeta.color },
          }),
          el('span', { className: 'pp-drill-card-time', textContent: `${drill.duration}m` }),
        ]),
        el('div', { className: 'pp-drill-card-desc', textContent: drill.description }),
        drill.isCustom ? el('span', { textContent: '✨ Custom', style: { fontSize: '11px', color: '#f59e0b' } }) : el('span', {}),
      ]))
    }

    // Create custom drill
    list.appendChild(el('button', {
      className: 'btn btn-ghost pp-custom-drill-btn',
      textContent: '＋ Create Custom Drill',
      onClick: () => { showDrillPicker = false; showCustomForm = true; render() },
    }))

    wrap.appendChild(list)
    return wrap
  }

  // ── Custom drill form ───────────────────────────────────────────────────────

  function renderCustomDrillForm() {
    let newDrill = {
      id: '',
      name: '',
      category: 'team',
      duration: 5,
      description: '',
      setup: '',
      coachingPoints: [],
      playerCount: { min: 2, ideal: 10 },
      equipment: [],
      difficulty: 1,
      isCustom: true,
    }

    const wrap = el('div', { className: 'pp-overlay' })
    wrap.appendChild(el('div', { className: 'pp-overlay-header' }, [
      el('button', {
        className: 'btn btn-sm btn-ghost',
        textContent: '← Back',
        onClick: () => { showCustomForm = false; showDrillPicker = true; render() },
      }),
      el('span', { textContent: 'Create Custom Drill', style: { fontWeight: '600' } }),
    ]))

    const form = el('div', { className: 'pp-custom-form' })

    const nameInput = el('input', { className: 'input', type: 'text', placeholder: 'Drill name' })
    nameInput.addEventListener('input', e => { newDrill.name = e.target.value })
    form.appendChild(el('label', { textContent: 'Name', className: 'pp-form-label' }))
    form.appendChild(nameInput)

    const catSelect = el('select', { className: 'input' })
    for (const [key, meta] of Object.entries(DRILL_CATEGORIES)) {
      catSelect.appendChild(el('option', { value: key, textContent: `${meta.emoji} ${meta.label}` }))
    }
    catSelect.value = 'team'
    catSelect.addEventListener('change', e => { newDrill.category = e.target.value })
    form.appendChild(el('label', { textContent: 'Category', className: 'pp-form-label' }))
    form.appendChild(catSelect)

    const durationWrap = el('div', { className: 'pp-time-stepper', style: { margin: '8px 0' } }, [
      el('button', { className: 'btn btn-sm pp-step-btn', textContent: '◀', onClick: () => {
        newDrill.duration = Math.max(1, newDrill.duration - 1)
        durationLabel.textContent = `${newDrill.duration} min`
      }}),
    ])
    const durationLabel = el('span', { className: 'pp-step-val', textContent: '5 min' })
    durationWrap.appendChild(durationLabel)
    durationWrap.appendChild(el('button', { className: 'btn btn-sm pp-step-btn', textContent: '▶', onClick: () => {
      newDrill.duration = Math.min(60, newDrill.duration + 1)
      durationLabel.textContent = `${newDrill.duration} min`
    }}))
    form.appendChild(el('label', { textContent: 'Duration', className: 'pp-form-label' }))
    form.appendChild(durationWrap)

    const descTA = el('textarea', { className: 'input pp-notes-input', placeholder: 'Description...' })
    descTA.addEventListener('input', e => { newDrill.description = e.target.value })
    form.appendChild(el('label', { textContent: 'Description', className: 'pp-form-label' }))
    form.appendChild(descTA)

    form.appendChild(el('button', {
      className: 'btn btn-primary',
      textContent: 'Save Custom Drill',
      style: { marginTop: '12px', width: '100%' },
      onClick: () => {
        if (!newDrill.name.trim()) { showToast('Please enter a drill name'); return }
        newDrill.id = 'custom-' + Date.now()
        const state = store.get()
        const customDrills = [...(state.customDrills || []), newDrill]
        store.set({ customDrills })
        showToast('Custom drill saved!')
        showCustomForm = false
        showDrillPicker = true
        render()
      },
    }))

    wrap.appendChild(form)
    return wrap
  }

  // ── Templates picker ─────────────────────────────────────────────────────────

  function renderTemplatesPicker() {
    const wrap = el('div', { className: 'pp-overlay' })
    wrap.appendChild(el('div', { className: 'pp-overlay-header' }, [
      el('button', {
        className: 'btn btn-sm btn-ghost',
        textContent: '← Back',
        onClick: () => { showTemplates = false; render() },
      }),
      el('span', { textContent: 'New Practice Plan', style: { fontWeight: '600' } }),
    ]))

    // Blank plan
    wrap.appendChild(el('div', {
      className: 'pp-template-card',
      onClick: () => {
        currentPlan = createBlankPlan()
        showTemplates = false
        render()
      },
    }, [
      el('div', { className: 'pp-template-name', textContent: '📄 Blank Plan (75 min)' }),
      el('div', { className: 'pp-template-drills', textContent: 'Start fresh with just Warm-Up + Cool Down' }),
    ]))

    // Template cards
    for (const tpl of PRACTICE_TEMPLATES) {
      const drillNames = tpl.blocks.map(b => {
        const d = getDrillById(b.drillId)
        return d ? d.name : b.drillId
      }).join(' → ')
      wrap.appendChild(el('div', {
        className: 'pp-template-card',
        onClick: () => {
          currentPlan = createPlanFromTemplate(tpl)
          showTemplates = false
          render()
        },
      }, [
        el('div', { className: 'pp-template-name', textContent: `${tpl.emoji} ${tpl.name}` }),
        el('div', { className: 'pp-template-drills', textContent: drillNames }),
      ]))
    }

    // Load existing
    const plans = getPracticePlans()
    if (plans.length > 0) {
      wrap.appendChild(el('div', {
        className: 'pp-template-card',
        onClick: () => { showTemplates = false; showSavedPlans = true; render() },
      }, [
        el('div', { className: 'pp-template-name', textContent: '📋 Duplicate Existing...' }),
        el('div', { className: 'pp-template-drills', textContent: `${plans.length} saved plan${plans.length !== 1 ? 's' : ''} to copy` }),
      ]))
    }

    return wrap
  }

  // ── Saved plans section ──────────────────────────────────────────────────────

  function renderSavedPlansSection() {
    const plans = getPracticePlans()
    const wrap = el('div', { className: 'pp-saved-plans' })

    const toggleHeader = el('div', {
      className: 'pp-saved-plans-header',
      onClick: () => { showSavedPlans = !showSavedPlans; render() },
    }, [
      el('span', { textContent: `── Saved Plans (${plans.length}) ──`, style: { color: '#888', fontSize: '13px' } }),
      el('span', { textContent: showSavedPlans ? '▾' : '▸', style: { color: '#888', marginLeft: '8px' } }),
    ])
    wrap.appendChild(toggleHeader)

    if (showSavedPlans) {
      if (plans.length === 0) {
        wrap.appendChild(el('div', { style: { color: '#666', fontSize: '13px', padding: '8px 0' }, textContent: 'No saved plans yet.' }))
      }
      for (const plan of plans) {
        const used = getTimeUsed(plan)
        const row = el('div', { className: 'pp-saved-plan-row' }, [
          el('div', { className: 'pp-saved-plan-name', textContent: plan.name }),
          el('div', { className: 'pp-saved-plan-meta', textContent: `${plan.blocks.length} blocks · ${used} min` }),
        ])
        const actions = el('div', { className: 'pp-saved-plan-actions' })
        actions.appendChild(el('button', {
          className: 'btn btn-sm',
          textContent: '📂 Load',
          onClick: () => {
            if (currentPlan && currentPlan.id !== plan.id) {
              if (!confirm('Load this plan? Unsaved changes will be lost.')) return
            }
            currentPlan = JSON.parse(JSON.stringify(plan))
            showSavedPlans = false
            render()
          },
        }))
        actions.appendChild(el('button', {
          className: 'btn btn-sm btn-danger',
          textContent: '🗑️',
          onClick: () => {
            if (confirm(`Delete "${plan.name}"?`)) {
              deletePlan(plan.id)
              if (currentPlan && currentPlan.id === plan.id) currentPlan = null
              render()
            }
          },
        }))
        row.appendChild(actions)
        wrap.appendChild(row)
      }
    }

    return wrap
  }

  // ─── Run View ──────────────────────────────────────────────────────────────

  function renderRunView() {
    const plan = currentPlan
    const block = plan.blocks[runBlockIdx]
    const drill = getDrill(block.drillId)
    const catMeta = DRILL_CATEGORIES[drill?.category] || { emoji: '📋', label: '', color: '#888' }

    const container = el('div', { className: 'pp-run-view' })

    // Header row
    container.appendChild(el('div', { className: 'pp-run-header' }, [
      el('button', {
        className: 'btn btn-sm btn-ghost',
        textContent: '← Builder',
        onClick: () => {
          stopTimer()
          mode = 'builder'
          render()
        },
      }),
      el('span', { textContent: plan.name, style: { fontSize: '13px', color: '#aaa' } }),
    ]))

    // Big drill name
    container.appendChild(el('div', { className: 'pp-run-drill-name', textContent: drill?.name || block.drillId }))

    // Category tag
    container.appendChild(el('div', { className: 'pp-run-cat-tag' }, [
      el('span', {
        textContent: `${catMeta.emoji} ${catMeta.label}`,
        style: { background: catMeta.color + '22', color: catMeta.color, padding: '2px 8px', borderRadius: '8px', fontSize: '12px' },
      }),
    ]))

    // Timer area
    const timerClass = (() => {
      if (runTimerMode === 'stopwatch') return runTimerRunning ? 'stopwatch' : 'paused'
      if (runTimerExpired) return 'expired'
      if (runTimerRunning) return 'running'
      return 'paused'
    })()

    const timerDisplay = el('div', {
      className: `pp-run-timer ${timerClass}`,
      textContent: formatTime(runTimerSeconds),
      title: 'Tap to toggle timer/stopwatch mode',
      onClick: () => {
        stopTimer()
        runTimerMode = runTimerMode === 'timer' ? 'stopwatch' : 'timer'
        resetTimerForBlock(runBlockIdx)
        render()
      },
    })
    const timerModeLabel = el('div', {
      className: 'pp-run-timer-mode',
      textContent: runTimerMode === 'timer' ? '⬇ Timer (tap to switch)' : '⬆ Stopwatch (tap to switch)',
    })
    container.appendChild(el('div', { className: 'pp-run-timer-wrap' }, [timerDisplay, timerModeLabel]))

    // Coaching points card
    if (drill && drill.coachingPoints && drill.coachingPoints.length > 0) {
      const pts = el('div', { className: 'pp-run-points' })
      const ptsHeader = el('div', {
        className: 'pp-run-points-header',
        onClick: () => { runPointsExpanded = !runPointsExpanded; render() },
      }, [
        el('span', { textContent: '🎯 Coaching Points' }),
        el('span', { textContent: runPointsExpanded ? '▾' : '▸' }),
      ])
      pts.appendChild(ptsHeader)
      if (runPointsExpanded) {
        pts.appendChild(el('ul', { className: 'pp-run-points-list' },
          drill.coachingPoints.map(pt => el('li', { textContent: pt }))
        ))
      }
      container.appendChild(pts)
    }

    // Setup card (collapsed by default)
    if (drill && drill.setup) {
      const setup = el('div', { className: 'pp-run-setup' })
      const setupHeader = el('div', {
        className: 'pp-run-setup-header',
        onClick: () => { runSetupExpanded = !runSetupExpanded; render() },
      }, [
        el('span', { textContent: '📋 Setup' }),
        el('span', { textContent: runSetupExpanded ? '▾' : '▸' }),
      ])
      setup.appendChild(setupHeader)
      if (runSetupExpanded) {
        setup.appendChild(el('div', { className: 'pp-run-setup-body', textContent: drill.setup }))
      }
      container.appendChild(setup)
    }

    // Coach note
    if (block.notes) {
      container.appendChild(el('div', { className: 'pp-run-note', textContent: `📝 ${block.notes}` }))
    }

    // Linked plays
    if (block.linkedPlays && block.linkedPlays.length > 0) {
      const chipsWrap = el('div', { className: 'pp-play-chips', style: { margin: '8px 0' } })
      for (const playName of block.linkedPlays) {
        chipsWrap.appendChild(el('a', {
          href: `#/play/${PLAY_LIBRARY.find(p => p.name === playName)?.id || ''}`,
          className: 'pp-play-chip',
          style: { textDecoration: 'none', cursor: 'pointer' },
          textContent: `🏈 ${playName}`,
        }))
      }
      container.appendChild(el('div', {}, [
        el('div', { textContent: 'Linked Plays:', style: { fontSize: '12px', color: '#aaa', marginBottom: '4px' } }),
        chipsWrap,
      ]))
    }

    // Navigation row
    const pauseBtn = el('button', {
      className: 'btn pp-run-nav-btn pp-run-pause-btn',
      textContent: runTimerRunning ? '⏸' : '▶',
      onClick: () => {
        if (runTimerRunning) {
          stopTimer()
        } else {
          startTimer()
        }
        renderTimerDisplay()
      },
    })
    container.appendChild(el('div', { className: 'pp-run-nav' }, [
      el('button', {
        className: 'btn pp-run-nav-btn',
        textContent: '◀ Prev',
        disabled: runBlockIdx === 0,
        onClick: () => { stopTimer(); runBlockIdx--; resetTimerForBlock(runBlockIdx); runSetupExpanded = false; render() },
      }),
      pauseBtn,
      el('button', {
        className: 'btn pp-run-nav-btn',
        textContent: 'Next ▶',
        disabled: runBlockIdx >= plan.blocks.length - 1,
        onClick: () => {
          stopTimer()
          if (runBlockIdx >= plan.blocks.length - 1) {
            // Practice complete
            mode = 'complete'
            renderCompleteView()
            return
          }
          runBlockIdx++
          resetTimerForBlock(runBlockIdx)
          runSetupExpanded = false
          render()
        },
      }),
    ]))

    // Progress dots
    const dots = el('div', { className: 'pp-progress-dots' })
    for (let i = 0; i < plan.blocks.length; i++) {
      dots.appendChild(el('span', {
        className: `pp-dot${i < runBlockIdx ? ' done' : i === runBlockIdx ? ' current' : ''}`,
      }))
    }
    container.appendChild(dots)

    // Progress label
    const totalRemaining = plan.blocks.slice(runBlockIdx).reduce((s, b) => s + b.duration, 0)
    container.appendChild(el('div', { className: 'pp-progress-label' }, [
      el('span', { textContent: `${runBlockIdx + 1} / ${plan.blocks.length} blocks` }),
      el('span', { textContent: ` · ${totalRemaining} min remaining` }),
    ]))

    outlet.appendChild(container)
  }

  function renderCompleteView() {
    clear(outlet)
    const container = el('div', { className: 'pp-complete' }, [
      el('div', { textContent: '🎉', style: { fontSize: '64px', textAlign: 'center' } }),
      el('h2', { textContent: 'Practice Complete!', style: { textAlign: 'center' } }),
      el('p', { textContent: 'Great work today, team!', style: { textAlign: 'center', color: '#aaa' } }),
      el('button', {
        className: 'btn btn-primary',
        textContent: '← Back to Builder',
        style: { display: 'block', margin: '24px auto 0' },
        onClick: () => {
          stopTimer()
          mode = 'builder'
          runBlockIdx = 0
          render()
        },
      }),
    ])
    outlet.appendChild(container)
  }

  // ─── Plan CRUD ──────────────────────────────────────────────────────────────

  function createBlankPlan() {
    return {
      id: 'pp_' + Date.now(),
      name: 'New Practice Plan',
      totalMinutes: 75,
      createdAt: Date.now(),
      blocks: [
        { drillId: 'dynamic-warmup', duration: 7, notes: '', linkedPlays: [] },
        { drillId: 'cool-down', duration: 5, notes: '', linkedPlays: [] },
      ],
    }
  }

  function createPlanFromTemplate(tpl) {
    return {
      id: 'pp_' + Date.now(),
      name: tpl.name,
      totalMinutes: tpl.totalMinutes,
      createdAt: Date.now(),
      blocks: tpl.blocks.map(b => ({ ...b, notes: b.notes || '', linkedPlays: [...(b.linkedPlays || [])] })),
    }
  }

  function addDrill(drillId) {
    const drill = getDrill(drillId)
    const block = { drillId, duration: drill ? drill.duration : 5, notes: '', linkedPlays: [] }
    if (!currentPlan) currentPlan = createBlankPlan()
    if (drillPickerInsertIdx >= 0) {
      currentPlan.blocks.splice(drillPickerInsertIdx + 1, 0, block)
    } else {
      currentPlan.blocks.push(block)
    }
  }

  function removeBlock(idx) {
    currentPlan.blocks.splice(idx, 1)
  }

  function moveBlock(idx, dir) {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= currentPlan.blocks.length) return
    const blocks = currentPlan.blocks
    const tmp = blocks[idx]
    blocks[idx] = blocks[newIdx]
    blocks[newIdx] = tmp
  }

  function savePlan() {
    if (!currentPlan) return
    const state = store.get()
    const plans = [...(state.practicePlans || [])]
    const existing = plans.findIndex(p => p.id === currentPlan.id)
    const saved = { ...currentPlan, updatedAt: Date.now() }
    if (existing >= 0) {
      plans[existing] = saved
    } else {
      plans.push(saved)
    }
    store.set({ practicePlans: plans })
    showToast('Plan saved! ✅')
  }

  function duplicatePlan() {
    if (!currentPlan) return
    const dup = JSON.parse(JSON.stringify(currentPlan))
    dup.id = 'pp_' + Date.now()
    dup.name = dup.name + ' (Copy)'
    dup.createdAt = Date.now()
    currentPlan = dup
    showToast('Duplicated! Save to keep.')
    render()
  }

  function deletePlan(planId) {
    const state = store.get()
    const plans = (state.practicePlans || []).filter(p => p.id !== planId)
    store.set({ practicePlans: plans })
    showToast('Plan deleted.')
  }

  function startRunMode() {
    if (!currentPlan || currentPlan.blocks.length === 0) {
      showToast('Add some drills first!')
      return
    }
    savePlan()
    mode = 'run'
    runBlockIdx = 0
    runSetupExpanded = false
    runPointsExpanded = true
    const prefs = store.get().practicePrefs || {}
    runTimerMode = prefs.timerMode || 'timer'
    resetTimerForBlock(0)
    render()
  }

  // ─── Store subscription ─────────────────────────────────────────────────────

  const unsubscribe = store.subscribe(() => {
    // Re-render if practice plan data changed from outside this view
    render()
  })

  // Initial load: check if there's an active plan
  const initialState = store.get()
  if (initialState.activePracticePlanId) {
    const plans = initialState.practicePlans || []
    const found = plans.find(p => p.id === initialState.activePracticePlanId)
    if (found) currentPlan = JSON.parse(JSON.stringify(found))
  }

  render()

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  return () => {
    stopTimer()
    unsubscribe()
    if (jukeCleanup) jukeCleanup()
  }
}
