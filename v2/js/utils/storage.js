const CURRENT_VERSION = 6

// Default roster — preloaded so coach doesn't have to re-enter every time
const DEFAULT_ROSTER = [
  { id: 'player_braelyn', name: 'Braelyn', position: 'QB',    number: null },
  { id: 'player_lenox',   name: 'Lenox',   position: 'C',     number: null },
  { id: 'player_greyson', name: 'Greyson', position: 'WR1',   number: null },
  { id: 'player_cooper',  name: 'Cooper',  position: 'WR2',   number: null },
  { id: 'player_marshall',name: 'Marshall',position: 'RB',    number: null },
  { id: 'player_jordy',   name: 'Jordy',   position: 'BENCH', number: null },
  { id: 'player_zeke',    name: 'Zeke',    position: 'BENCH', number: null },
  { id: 'player_mason',   name: 'Mason',   position: 'BENCH', number: null },
]

/**
 * Load a value from localStorage, parsed from JSON.
 * @param {string} key
 * @param {*} fallback - Default value if key doesn't exist
 * @returns {*}
 */
export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/**
 * Save a value to localStorage as JSON.
 * @param {string} key
 * @param {*} value
 */
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage save failed:', e)
  }
}

/**
 * Run schema migrations if needed.
 */
export function migrate() {
  const version = load('pb_version', 0)

  if (version < 1) {
    // v0 → v1: initial schema
    save('pb_version', 1)
  }

  if (version < 2) {
    // v1 → v2: preload default roster if empty
    const existingRoster = load('pb_roster', [])
    if (existingRoster.length === 0) {
      save('pb_roster', DEFAULT_ROSTER)
    }
    save('pb_version', 2)
  }

  if (version < 3) {
    // v2 → v3: fix roster (duplicate Marshall, missing Jordy, Zeke wrong position)
    save('pb_roster', DEFAULT_ROSTER)
    save('pb_version', 3)
  }

  if (version < 4) {
    // v3 → v4: bench players use BENCH position instead of duplicate starter positions
    save('pb_roster', DEFAULT_ROSTER)
    save('pb_version', 4)
  }

  if (version < 5) {
    // v4 → v5: add practice plans + custom drills
    if (load('pb_practice_plans') === null) save('pb_practice_plans', [])
    if (load('pb_custom_drills') === null) save('pb_custom_drills', [])
    save('pb_version', 5)
  }

  if (version < 6) {
    // v5 → v6: add per-player playbooks
    if (load('pb_player_playbooks') === null) save('pb_player_playbooks', {})
    save('pb_version', 6)
  }
}
