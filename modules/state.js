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
  defenseMode: 'off',  // 'off' | 'man' | 'zone'
  showBall: false,
  sunlightMode: false,
  substitutions: {},   // { playIdx: { origName: replaceName } }
  subMenuOpen: false,
  subMenuTarget: null,
  coachMode: false,
  situation: { down: null, field: null, defense: null },
  queueMode: false,
  queue: [],           // [{ playIdx, result: null|'success'|'fail' }]
  queuePos: 0,

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

export function getActiveSubs() {
  return state.substitutions[state.currentPlayIdx] || {};
}

export function getDisplayName(originalName) {
  const subs = getActiveSubs();
  return subs[originalName] || originalName;
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
  return ALL_ROSTER.filter(name =>
    !LOCKED_PLAYERS.includes(name) &&
    !onField.includes(name) &&
    name !== currentHolder
  );
}

// ── Custom Play Storage ───────────────────────────────────────

export function loadCustomPlays() {
  try {
    const raw = localStorage.getItem('playbook:customPlays');
    if (raw) {
      const plays = JSON.parse(raw);
      if (Array.isArray(plays)) {
        plays.forEach(p => {
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
