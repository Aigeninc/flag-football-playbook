import { load, save, migrate } from './utils/storage.js'

const POSITIONS = ['QB', 'C', 'WR1', 'WR2', 'RB']

const DEFAULT_STATE = {
  roster: [],
  playbooks: [],
  activePlaybookId: null,
  preferences: {
    showDefense: true,
    showBall: true,
    showReadNumbers: true,
    showAllRoutes: true,
    speed: 'full',
    highlightPosition: null
  },
  practicePlans: [],
  customDrills: [],
  activePracticePlanId: null,
  practicePrefs: { timerMode: 'timer' },
}

/**
 * Create a reactive store with localStorage persistence.
 * Single source of truth for app state.
 */
export function createStore() {
  // Run migrations first
  migrate()

  // Hydrate from localStorage
  const state = {
    roster: load('pb_roster', DEFAULT_STATE.roster),
    playbooks: load('pb_playbooks', DEFAULT_STATE.playbooks),
    activePlaybookId: load('pb_active_playbook', DEFAULT_STATE.activePlaybookId),
    preferences: { ...DEFAULT_STATE.preferences, ...load('pb_preferences', {}) },
    practicePlans: load('pb_practice_plans', DEFAULT_STATE.practicePlans),
    customDrills: load('pb_custom_drills', DEFAULT_STATE.customDrills),
    activePracticePlanId: load('pb_active_practice_plan', DEFAULT_STATE.activePracticePlanId),
    practicePrefs: { ...DEFAULT_STATE.practicePrefs, ...load('pb_practice_prefs', {}) },
  }

  const listeners = new Set()

  /**
   * Get a deep copy of current state.
   * @returns {Object} Frozen copy of state
   */
  function get() {
    return JSON.parse(JSON.stringify(state))
  }

  /**
   * Merge partial state, persist to localStorage, notify subscribers.
   * @param {Object} partial - Partial state to merge
   */
  function set(partial) {
    if (partial.roster !== undefined) {
      state.roster = partial.roster
      save('pb_roster', state.roster)
    }
    if (partial.playbooks !== undefined) {
      state.playbooks = partial.playbooks
      save('pb_playbooks', state.playbooks)
    }
    if (partial.activePlaybookId !== undefined) {
      state.activePlaybookId = partial.activePlaybookId
      save('pb_active_playbook', state.activePlaybookId)
    }
    if (partial.preferences !== undefined) {
      Object.assign(state.preferences, partial.preferences)
      save('pb_preferences', state.preferences)
    }
    if (partial.practicePlans !== undefined) {
      state.practicePlans = partial.practicePlans
      save('pb_practice_plans', state.practicePlans)
    }
    if (partial.customDrills !== undefined) {
      state.customDrills = partial.customDrills
      save('pb_custom_drills', state.customDrills)
    }
    if (partial.activePracticePlanId !== undefined) {
      state.activePracticePlanId = partial.activePracticePlanId
      save('pb_active_practice_plan', state.activePracticePlanId)
    }
    if (partial.practicePrefs !== undefined) {
      Object.assign(state.practicePrefs, partial.practicePrefs)
      save('pb_practice_prefs', state.practicePrefs)
    }
    // Notify all subscribers
    for (const fn of listeners) {
      try { fn(get()) } catch (e) { console.error('Store subscriber error:', e) }
    }
  }

  /**
   * Subscribe to state changes.
   * @param {Function} listener - Called with new state on each change
   * @returns {Function} Unsubscribe function
   */
  function subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  /**
   * Get roster as array.
   * @returns {Array}
   */
  function getRoster() {
    return [...state.roster]
  }

  /**
   * Get all playbooks.
   * @returns {Array}
   */
  function getPlaybooks() {
    return [...state.playbooks]
  }

  /**
   * Get the active playbook object.
   * @returns {Object|null}
   */
  function getActivePlaybook() {
    if (!state.activePlaybookId) return null
    return state.playbooks.find(pb => pb.id === state.activePlaybookId) || null
  }

  /**
   * Build position → player name map from roster (starters only).
   * @returns {Object} e.g. { QB: 'Braelyn', WR1: 'Greyson', ... }
   */
  function getRosterMap() {
    const map = {}
    for (const pos of POSITIONS) {
      const player = state.roster.find(p => p.position === pos)
      if (player) map[pos] = player.name
    }
    return map
  }

  return { get, set, subscribe, getRoster, getPlaybooks, getActivePlaybook, getRosterMap, POSITIONS }
}
