// modules/state.js — Application state and constants
// PLAYS and PLAYERS are loaded from plays.js as globals

export const TOTAL_TIME = 7.0;
export const ANIM_ROUTE_DURATION = 1.2;
export const PRE_SNAP_MOTION = 1.5;
export const SET_PAUSE = 0.6;
export const PRE_SNAP_TOTAL = PRE_SNAP_MOTION + SET_PAUSE;

export const FIELD_X_MIN = 0;
export const FIELD_X_MAX = 35;
export const FIELD_Y_MIN = -10;
export const FIELD_Y_MAX = 18;

export const LOCKED_PLAYERS = ['Braelyn', 'Lenox'];
export const ALL_ROSTER = ['Braelyn', 'Lenox', 'Greyson', 'Marshall', 'Cooper', 'Jordy', 'Zeke'];

// ── Roster / Lineup constants ─────────────────────────────────

export const POSITIONS = ['QB', 'C', 'WR1', 'WR2', 'RB'];

// Maps the DEFAULT player names → their canonical position
export const DEFAULT_POSITION_MAP = {
  'Braelyn': 'QB',
  'Lenox':   'C',
  'Greyson': 'WR1',
  'Marshall':'WR2',
  'Cooper':  'RB',
};

// Maps canonical position → default player name (inverse of above)
export const DEFAULT_LINEUP = {
  'QB':  'Braelyn',
  'C':   'Lenox',
  'WR1': 'Greyson',
  'WR2': 'Marshall',
  'RB':  'Cooper',
};

// Mutable application state (single object for easy sharing)
export const state = {
  currentPlayIdx: 0,
  animTime: 0,
  playing: false,
  speed: 1,
  lastFrameTs: null,
  highlightPlayer: null,
  animId: null,
  viewMode: 'qb',      // 'qb' = staggered reads, 'game' = simultaneous
  defenseMode: 'off',  // 'off' | 'man' | 'zone' — hardcoded off, defense UI removed for simplicity
  showBall: false,
  sunlightMode: false,
  substitutions: {},   // { playIdx: { origName: replaceName } } — per-play overrides
  subMenuOpen: false,
  subMenuTarget: null,
  coachMode: false,
  situation: { down: null, field: null, defense: null },
  queueMode: false,
  queue: [],           // [{ playIdx, result: null|'success'|'fail' }]
  queuePos: 0,

  // ── Roster & Lineup ───────────────────────────────────────
  roster: [],          // [{ id, name, number, positions, color }]
  lineup: {            // First team: position → player name
    QB: 'Braelyn', C: 'Lenox', WR1: 'Greyson', WR2: 'Marshall', RB: 'Cooper',
  },
  lineup2: {           // Second team: position → player name (null = empty)
    QB: null, C: null, WR1: null, WR2: null, RB: null,
  },
  activeTeam: '1',     // '1' or '2'
  rotationCounts: {},  // { playerName: playCount } for equal playing time

  // ── Editor state ─────────────────────────────────────────
  editorActive: false,
  editorPlay: null,          // deep copy of play being edited
  editorPlayIdx: null,       // index in PLAYS array, or -1 for new
  editorIsNew: false,        // true = will push new play on save
  editorSelectedPlayer: null,// player name key
  editorSelectedWaypoint: null, // { playerName, waypointIndex } | null
  editorUndoStack: [],       // array of editorPlay snapshots
};

// ── Pure helpers ─────────────────────────────────────────────

export function hasMotion(play) {
  return Object.values(play.players).some(pd => pd.motion);
}

export function getAnimStart(play) {
  return hasMotion(play) ? -PRE_SNAP_TOTAL : 0;
}

// Compute lineup-based subs: which default players are replaced by lineup
export function getLineupSubs() {
  const lineup = state.activeTeam === '1' ? state.lineup : state.lineup2;
  const result = {};
  for (const [position, assignedPlayer] of Object.entries(lineup)) {
    if (!assignedPlayer) continue;
    const defaultPlayer = DEFAULT_LINEUP[position];
    if (defaultPlayer && defaultPlayer !== assignedPlayer) {
      result[defaultPlayer] = assignedPlayer;
    }
  }
  return result;
}

// Get all active subs for current play: lineup subs + per-play overrides (per-play wins)
export function getActiveSubs() {
  const lineupSubs = getLineupSubs();
  const perPlaySubs = state.substitutions[state.currentPlayIdx] || {};
  return { ...lineupSubs, ...perPlaySubs };
}

// Get per-play subs only (without lineup subs)
export function getPerPlaySubs() {
  return state.substitutions[state.currentPlayIdx] || {};
}

export function getDisplayName(originalName) {
  // Per-play subs take priority over lineup subs
  const perPlaySubs = state.substitutions[state.currentPlayIdx] || {};
  if (perPlaySubs[originalName]) return perPlaySubs[originalName];

  // Lineup subs (based on current team assignment)
  const lineupSubs = getLineupSubs();
  if (lineupSubs[originalName]) return lineupSubs[originalName];

  return originalName;
}

export function getActiveRoster() {
  const subs = getActiveSubs();
  const play = PLAYS[state.currentPlayIdx]; // global from plays.js
  const onField = [];
  for (const origName of Object.keys(play.players)) {
    onField.push(subs[origName] || origName);
  }
  return onField;
}

export function getAvailableSubs(targetOriginal) {
  const onField = getActiveRoster();
  const currentHolder = getDisplayName(targetOriginal);
  // Use dynamic roster if populated, else fall back to hardcoded ALL_ROSTER
  const pool = state.roster.length > 0
    ? state.roster.map(p => p.name)
    : ALL_ROSTER;
  return pool.filter(name =>
    !LOCKED_PLAYERS.includes(name) &&
    !onField.includes(name) &&
    name !== currentHolder
  );
}

// Get display name for a specific play (not the currently viewed play)
export function getDisplayNameForPlay(originalName, playIdx) {
  const perPlaySubs = state.substitutions[playIdx] || {};
  if (perPlaySubs[originalName]) return perPlaySubs[originalName];
  const lineupSubs = getLineupSubs();
  if (lineupSubs[originalName]) return lineupSubs[originalName];
  return originalName;
}

// ── Play Validation ───────────────────────────────────────────

/**
 * P1-4 fix: Validate that a play object has the required structure
 * before adding it to PLAYS. Prevents malformed imports from crashing the renderer.
 */
export function isValidPlay(play) {
  if (!play || typeof play !== 'object') return false;
  if (!play.name || typeof play.name !== 'string') return false;
  if (!play.formation || typeof play.formation !== 'string') return false;
  if (!play.players || typeof play.players !== 'object' || Array.isArray(play.players)) return false;
  if (!play.defense || !Array.isArray(play.defense)) return false;
  if (!play.timing || typeof play.timing !== 'object') return false;
  // Validate each player entry has required pos and route fields
  for (const pd of Object.values(play.players)) {
    if (!pd || typeof pd !== 'object') return false;
    if (!Array.isArray(pd.pos) || pd.pos.length !== 2) return false;
    if (!Array.isArray(pd.route)) return false;
  }
  return true;
}

// ── Custom Play Storage ───────────────────────────────────────

export function loadCustomPlays() {
  try {
    const raw = localStorage.getItem('playbook:customPlays');
    if (raw) {
      const plays = JSON.parse(raw);
      if (Array.isArray(plays)) {
        plays.forEach(p => {
          // P1-4 fix: validate before pushing to prevent renderer crashes
          if (!isValidPlay(p)) {
            console.warn('Skipping invalid custom play from storage:', p?.name || '(unnamed)');
            return;
          }
          p.isCustom = true;
          PLAYS.push(p);
        });
      }
    }
  } catch (e) {
    console.warn('Failed to load custom plays:', e);
  }
}

export function saveCustomPlays() {
  try {
    const customPlays = PLAYS.filter(p => p.isCustom);
    localStorage.setItem('playbook:customPlays', JSON.stringify(customPlays));
  } catch (e) {}
}

// ── localStorage helpers ──────────────────────────────────────

export function saveQueueState() {
  try {
    localStorage.setItem('playbook:queueState', JSON.stringify({
      queue: state.queue,
      queuePos: state.queuePos,
    }));
  } catch (e) {}
}

export function loadQueueState() {
  try {
    const raw = localStorage.getItem('playbook:queueState');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.queue && Array.isArray(data.queue)) {
        state.queue = data.queue;
        state.queuePos = Math.min(data.queuePos || 0, Math.max(0, state.queue.length - 1));
      }
    }
  } catch (e) {}
}

export function loadPreferences() {
  try {
    if (localStorage.getItem('playbook:sunlightMode') === '1') {
      state.sunlightMode = true;
      document.body.classList.add('sunlight');
    }
  } catch (e) {}
}

export function saveSunlightMode() {
  try {
    localStorage.setItem('playbook:sunlightMode', state.sunlightMode ? '1' : '0');
  } catch (e) {}
}

export function saveSubstitutions() {
  try {
    localStorage.setItem('playbook:subs', JSON.stringify(state.substitutions));
  } catch (e) {}
}

export function loadSubstitutions() {
  try {
    const raw = localStorage.getItem('playbook:subs');
    if (raw) {
      state.substitutions = JSON.parse(raw);
    }
  } catch (e) {}
}
