// modules/editor.js — Play editor: create, edit, and manage custom plays

import { state, FIELD_X_MIN, FIELD_X_MAX, FIELD_Y_MIN, FIELD_Y_MAX, saveCustomPlays, isValidPlay } from './state.js';
import { fieldToCanvas, canvasToField, drawFrame } from './renderer.js';

// ── Formation Templates ───────────────────────────────────────

const FORMATIONS = {
  'Spread':         { Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [4,0],  Marshall: [31,0],  Cooper: [17.5,-5.5] },
  'Twins Right':    { Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [27,0], Marshall: [32,0],  Cooper: [17.5,-5.5] },
  'Twins Left':     { Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [8,0],  Marshall: [3,0],   Cooper: [17.5,-5.5] },
  'Trips Right':    { Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [24,0], Marshall: [28,0],  Cooper: [32,0]      },
  'Trips Left':     { Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [11,0], Marshall: [7,0],   Cooper: [3,0]       },
  'Bunch Right':    { Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [26,0], Marshall: [28,-1], Cooper: [30,0]      },
  'Bunch Left':     { Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [9,0],  Marshall: [7,-1],  Cooper: [5,0]       },
  'Stack':          { Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [17,1], Marshall: [4,0],   Cooper: [31,0]      },
  'Empty':          { Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [4,0],  Marshall: [31,0],  Cooper: [24,0]      },
  'RB Offset Right':{ Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [4,0],  Marshall: [31,0],  Cooper: [22,-5]     },
  'RB Offset Left': { Braelyn: [17.5,-3], Lenox: [17.5,0], Greyson: [4,0],  Marshall: [31,0],  Cooper: [13,-5]     },
};

const DEFAULT_DEFENSE = [[10,5],[17.5,8],[25,5],[8,13],[27,13]];
const PLAYER_ORDER = ['Braelyn','Lenox','Greyson','Marshall','Cooper'];

// ── Callbacks registered from app.js ─────────────────────────

let _buildPlaySelector = null;
let _updateInfoPanel = null;
let _selectPlay = null;

export function setEditorCallbacks(buildPS, updateIP, selectPlay) {
  _buildPlaySelector = buildPS;
  _updateInfoPanel = updateIP;
  _selectPlay = selectPlay;
}

// ── Deep Clone ────────────────────────────────────────────────

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

// ── Undo ──────────────────────────────────────────────────────

export function pushUndo() {
  if (!state.editorPlay) return;
  state.editorUndoStack.push(deepClone(state.editorPlay));
  if (state.editorUndoStack.length > 30) state.editorUndoStack.shift();
}

export function undoEdit() {
  if (!state.editorUndoStack.length) return;
  state.editorPlay = state.editorUndoStack.pop();
  state.editorSelectedPlayer = null;
  state.editorSelectedWaypoint = null;
  refreshPlayerPanel();
  drawFrame();
}

// ── Enter / Exit Edit Mode ────────────────────────────────────

export function enterEditMode(playIdx) {
  const play = PLAYS[playIdx];
  if (!play) return;

  const editCopy = deepClone(play);
  if (!play.isCustom) {
    // Built-in play: create a custom copy
    editCopy.id = 'custom-' + Date.now();
    editCopy.name = play.name + ' (Custom)';
    editCopy.isCustom = true;
    editCopy._builtinRef = playIdx;
    state.editorIsNew = true;
  } else {
    state.editorIsNew = false;
  }

  state.editorActive = true;
  state.editorPlay = editCopy;
  state.editorPlayIdx = playIdx;
  state.editorSelectedPlayer = null;
  state.editorSelectedWaypoint = null;
  state.editorUndoStack = [];

  // Pause any animation
  state.playing = false;
  const playBtn = document.getElementById('btn-play');
  if (playBtn) playBtn.textContent = '▶';

  showEditToolbar();
  drawFrame();
}

export function enterNewPlayMode(formationName) {
  const formation = FORMATIONS[formationName] || FORMATIONS['Spread'];
  const players = {};

  PLAYER_ORDER.forEach((name, i) => {
    const formKeys = Object.keys(formation);
    const pos = formation[name] || formation[formKeys[i]] || [17.5, 0];
    players[name] = {
      pos: [...pos],
      route: [],
      label: '',
      read: (name === 'Braelyn' || name === 'Lenox') ? 0 : i - 1,
      dashed: false,
    };
  });

  const newPlay = {
    id: 'custom-' + Date.now(),
    name: 'New Play',
    formation: formationName,
    whenToUse: [],
    notes: '',
    players,
    defense: deepClone(DEFAULT_DEFENSE),
    timing: {},
    ballPath: [{ from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' }],
    isCustom: true,
  };

  state.editorActive = true;
  state.editorPlay = newPlay;
  state.editorPlayIdx = -1;
  state.editorIsNew = true;
  state.editorSelectedPlayer = null;
  state.editorSelectedWaypoint = null;
  state.editorUndoStack = [];

  state.playing = false;
  const playBtn = document.getElementById('btn-play');
  if (playBtn) playBtn.textContent = '▶';

  showEditToolbar();
  drawFrame();
}

export function exitEditMode(save) {
  if (save && state.editorPlay) {
    const nameInput = document.getElementById('edit-play-name');
    if (nameInput) state.editorPlay.name = nameInput.value.trim() || 'New Play';
    const notesInput = document.getElementById('edit-when-to-use');
    if (notesInput) state.editorPlay.whenToUse = notesInput.value.trim()
      ? notesInput.value.split('•').map(l => l.trim()).filter(Boolean)
      : [];
    saveEditedPlay();
  }

  state.editorActive = false;
  state.editorPlay = null;
  state.editorPlayIdx = null;
  state.editorIsNew = false;
  state.editorSelectedPlayer = null;
  state.editorSelectedWaypoint = null;

  hideEditToolbar();
  if (save) {
    if (_buildPlaySelector) _buildPlaySelector();
    if (_updateInfoPanel) _updateInfoPanel();
  }
  drawFrame();
}

// ── Save Play ─────────────────────────────────────────────────

function computeAutoTiming(play) {
  const times = { 1: 1.5, 2: 2.5, 3: 3.5, 4: 4.5 };
  const timing = {};
  for (const pd of Object.values(play.players)) {
    if (pd.read > 0) timing[pd.read] = times[pd.read] || (pd.read * 1.0 + 0.5);
  }
  play.timing = timing;
}

function saveEditedPlay() {
  const play = state.editorPlay;
  computeAutoTiming(play);

  if (state.editorPlayIdx === -1 || state.editorIsNew) {
    PLAYS.push(play);
    state.currentPlayIdx = PLAYS.length - 1;
  } else {
    const idx = state.editorPlayIdx;
    if (PLAYS[idx] && PLAYS[idx].isCustom) {
      PLAYS[idx] = play;
      state.currentPlayIdx = idx;
    } else {
      // Replacing a built-in: check if override already exists
      const existingIdx = PLAYS.findIndex(p => p.isCustom && p._builtinRef === idx);
      if (existingIdx >= 0) {
        PLAYS[existingIdx] = play;
        state.currentPlayIdx = existingIdx;
      } else {
        PLAYS.push(play);
        state.currentPlayIdx = PLAYS.length - 1;
      }
    }
  }
  saveCustomPlays();
}

// ── Delete / Duplicate ────────────────────────────────────────

export function deleteCurrentPlay() {
  const idx = state.currentPlayIdx;
  if (!PLAYS[idx] || !PLAYS[idx].isCustom) {
    alert('Only custom plays can be deleted.\nBuilt-in plays are read-only.');
    return;
  }
  if (!confirm(`Delete "${PLAYS[idx].name}"?`)) return;

  PLAYS.splice(idx, 1);
  saveCustomPlays();
  state.currentPlayIdx = Math.max(0, idx - 1);
  if (_buildPlaySelector) _buildPlaySelector();
  if (_updateInfoPanel) _updateInfoPanel();
  drawFrame();
}

export function duplicateCurrentPlay() {
  const play = PLAYS[state.currentPlayIdx];
  const copy = deepClone(play);
  copy.id = 'custom-' + Date.now();
  copy.name = play.name + ' (Copy)';
  copy.isCustom = true;
  delete copy._builtinRef;

  PLAYS.push(copy);
  saveCustomPlays();

  // Jump to the new copy in edit mode
  const newIdx = PLAYS.length - 1;
  state.currentPlayIdx = newIdx;
  enterEditMode(newIdx);
}

// ── Export / Import ───────────────────────────────────────────

export function exportPlaybook() {
  const customPlays = PLAYS.filter(p => p.isCustom);
  if (customPlays.length === 0) {
    alert('No custom plays to export.\nCreate some plays first!');
    return;
  }
  const data = {
    version: 1,
    exportDate: new Date().toISOString(),
    appName: 'Flag Football Playbook',
    customPlays,
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'playbook-custom-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importPlaybook(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.customPlays || !Array.isArray(data.customPlays)) {
        alert('Invalid playbook file — missing customPlays array.');
        return;
      }
      const count = data.customPlays.length;
      if (!confirm(`Import ${count} custom play${count !== 1 ? 's' : ''}?\nThis will replace any existing custom plays.`)) return;

      // Remove existing custom plays
      let i = PLAYS.length - 1;
      while (i >= 0) {
        if (PLAYS[i].isCustom) PLAYS.splice(i, 1);
        i--;
      }

      // Add imported plays — P1-4 fix: validate each play before pushing to prevent renderer crashes
      let skipped = 0;
      data.customPlays.forEach(p => {
        if (!isValidPlay(p)) {
          console.warn('Skipping invalid play during import:', p?.name || '(unnamed)');
          skipped++;
          return;
        }
        p.isCustom = true;
        if (!p.id) p.id = 'custom-' + Date.now() + Math.random();
        PLAYS.push(p);
      });
      if (skipped > 0) {
        console.warn(`Import: ${skipped} play(s) were skipped due to invalid structure.`);
      }

      saveCustomPlays();
      state.currentPlayIdx = 0;
      if (_buildPlaySelector) _buildPlaySelector();
      if (_updateInfoPanel) _updateInfoPanel();
      drawFrame();
      const imported = count - skipped;
      const msg = skipped > 0
        ? `Imported ${imported} custom play${imported !== 1 ? 's' : ''}.\n(${skipped} skipped — invalid structure)`
        : `Imported ${imported} custom play${imported !== 1 ? 's' : ''}!`;
      alert(msg);
    } catch (err) {
      alert('Failed to import: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ── Canvas Hit Testing ────────────────────────────────────────

export function hitTestPlayers(cx, cy) {
  if (!state.editorPlay) return null;
  const HIT_RADIUS = 22;
  let nearest = null, nearestDist = Infinity;

  for (const [name, pd] of Object.entries(state.editorPlay.players)) {
    const [pcx, pcy] = fieldToCanvas(pd.pos[0], pd.pos[1]);
    const dist = Math.sqrt((cx - pcx) ** 2 + (cy - pcy) ** 2);
    if (dist < HIT_RADIUS && dist < nearestDist) {
      nearest = name;
      nearestDist = dist;
    }
  }
  return nearest;
}

export function hitTestWaypoints(cx, cy) {
  if (!state.editorPlay) return null;
  const HIT_RADIUS = 16;
  let nearest = null, nearestDist = Infinity;

  for (const [name, pd] of Object.entries(state.editorPlay.players)) {
    if (!pd.route || !pd.route.length) continue;
    for (let i = 0; i < pd.route.length; i++) {
      const [wcx, wcy] = fieldToCanvas(pd.route[i][0], pd.route[i][1]);
      const dist = Math.sqrt((cx - wcx) ** 2 + (cy - wcy) ** 2);
      if (dist < HIT_RADIUS && dist < nearestDist) {
        nearest = { playerName: name, waypointIndex: i };
        nearestDist = dist;
      }
    }
  }
  return nearest;
}

// ── Player Editing Actions ────────────────────────────────────

export function selectPlayer(name) {
  state.editorSelectedPlayer = name;
  state.editorSelectedWaypoint = null;
  refreshPlayerPanel();
  drawFrame();
}

export function deselectPlayer() {
  state.editorSelectedPlayer = null;
  state.editorSelectedWaypoint = null;
  refreshPlayerPanel();
  drawFrame();
}

export function clearPlayerRoute(name) {
  if (!state.editorPlay?.players[name]) return;
  pushUndo();
  state.editorPlay.players[name].route = [];
  state.editorSelectedWaypoint = null;
  drawFrame();
}

export function addWaypointToSelected(fieldX, fieldY) {
  const name = state.editorSelectedPlayer;
  if (!name || !state.editorPlay?.players[name]) return;
  const fx = Math.max(FIELD_X_MIN, Math.min(FIELD_X_MAX, fieldX));
  const fy = Math.max(FIELD_Y_MIN, Math.min(FIELD_Y_MAX, fieldY));
  pushUndo();
  state.editorPlay.players[name].route.push([fx, fy]);
  drawFrame();
}

export function deleteWaypoint(playerName, waypointIndex) {
  const pd = state.editorPlay?.players[playerName];
  if (!pd?.route) return;
  pushUndo();
  pd.route.splice(waypointIndex, 1);
  if (state.editorSelectedWaypoint?.playerName === playerName &&
      state.editorSelectedWaypoint?.waypointIndex === waypointIndex) {
    state.editorSelectedWaypoint = null;
  }
  drawFrame();
}

export function movePlayer(name, fieldX, fieldY) {
  const pd = state.editorPlay?.players[name];
  if (!pd) return;
  pd.pos = [
    Math.max(FIELD_X_MIN + 0.5, Math.min(FIELD_X_MAX - 0.5, fieldX)),
    Math.max(FIELD_Y_MIN + 0.5, Math.min(FIELD_Y_MAX - 0.5, fieldY)),
  ];
  drawFrame();
}

export function moveWaypoint(playerName, waypointIndex, fieldX, fieldY) {
  const pd = state.editorPlay?.players[playerName];
  if (!pd?.route || waypointIndex >= pd.route.length) return;
  pd.route[waypointIndex] = [
    Math.max(FIELD_X_MIN, Math.min(FIELD_X_MAX, fieldX)),
    Math.max(FIELD_Y_MIN, Math.min(FIELD_Y_MAX, fieldY)),
  ];
  drawFrame();
}

export function setPlayerRead(name, readVal) {
  const pd = state.editorPlay?.players[name];
  if (!pd) return;
  pushUndo();
  pd.read = readVal;
  refreshPlayerPanel();
  drawFrame();
}

export function setPlayerLabel(name, label) {
  const pd = state.editorPlay?.players[name];
  if (!pd) return;
  pd.label = label;
  drawFrame();
}

export function togglePlayerDashed(name) {
  const pd = state.editorPlay?.players[name];
  if (!pd) return;
  pushUndo();
  pd.dashed = !pd.dashed;
  refreshPlayerPanel();
  drawFrame();
}

export function applyFormation(formationName) {
  const formation = FORMATIONS[formationName];
  if (!formation || !state.editorPlay) return;
  pushUndo();

  PLAYER_ORDER.forEach((name, i) => {
    if (!state.editorPlay.players[name]) return;
    const pos = formation[name];
    if (pos) state.editorPlay.players[name].pos = [...pos];
  });

  state.editorPlay.formation = formationName;
  const formSel = document.getElementById('edit-formation-select');
  if (formSel) formSel.value = formationName;
  drawFrame();
}

// ── Canvas Pointer Events ─────────────────────────────────────

let _canvas = null;
let pointerDownPos = null;
let longPressTimer = null;
let isDragging = false;
let dragPushedUndo = false;
const DRAG_THRESHOLD = 8;
const LONG_PRESS_MS = 500;

// What we hit on pointerdown
let activeHitPlayer = null;
let activeHitWaypoint = null;

function getCanvasXY(e) {
  const rect = _canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onPointerDown(e) {
  if (!state.editorActive) return;
  e.preventDefault();

  const pos = getCanvasXY(e);
  pointerDownPos = pos;
  isDragging = false;
  dragPushedUndo = false;

  // Hit test waypoints first (smaller targets, higher priority when player selected)
  activeHitWaypoint = hitTestWaypoints(pos.x, pos.y);
  activeHitPlayer = activeHitWaypoint ? null : hitTestPlayers(pos.x, pos.y);

  // Long-press on waypoint → delete
  if (activeHitWaypoint) {
    const wp = activeHitWaypoint;
    longPressTimer = setTimeout(() => {
      deleteWaypoint(wp.playerName, wp.waypointIndex);
      activeHitWaypoint = null;
      isDragging = false;
      pointerDownPos = null;
    }, LONG_PRESS_MS);
  }

  try { _canvas.setPointerCapture(e.pointerId); } catch (err) {}
}

function onPointerMove(e) {
  if (!state.editorActive || !pointerDownPos) return;

  const pos = getCanvasXY(e);
  const dx = pos.x - pointerDownPos.x;
  const dy = pos.y - pointerDownPos.y;

  if (!isDragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
    isDragging = true;
    clearTimeout(longPressTimer);
    longPressTimer = null;

    // Only drag if we hit something
    if (!activeHitPlayer && !activeHitWaypoint) {
      isDragging = false;
    }
  }

  if (isDragging) {
    if (!dragPushedUndo) {
      pushUndo();
      dragPushedUndo = true;
    }
    const [fx, fy] = canvasToField(pos.x, pos.y);
    if (activeHitPlayer) {
      movePlayer(activeHitPlayer, fx, fy);
    } else if (activeHitWaypoint) {
      moveWaypoint(activeHitWaypoint.playerName, activeHitWaypoint.waypointIndex, fx, fy);
    }
  }
}

function onPointerUp(e) {
  if (!state.editorActive) return;
  clearTimeout(longPressTimer);
  longPressTimer = null;

  if (!isDragging && pointerDownPos) {
    const pos = getCanvasXY(e);

    if (activeHitWaypoint) {
      // Tap waypoint — select it (for visual feedback)
      state.editorSelectedWaypoint = activeHitWaypoint;
      drawFrame();
    } else if (activeHitPlayer) {
      // Tap player — select/deselect
      if (state.editorSelectedPlayer === activeHitPlayer) {
        deselectPlayer();
      } else {
        selectPlayer(activeHitPlayer);
      }
    } else {
      // Tap on empty field
      if (state.editorSelectedPlayer) {
        // Add waypoint to selected player's route
        const [fx, fy] = canvasToField(pos.x, pos.y);
        addWaypointToSelected(fx, fy);
      } else {
        deselectPlayer();
      }
    }
  }

  pointerDownPos = null;
  activeHitPlayer = null;
  activeHitWaypoint = null;
  isDragging = false;
  dragPushedUndo = false;
}

export function setupEditorCanvasEvents(canvas) {
  _canvas = canvas;
  canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('pointerup', onPointerUp, { passive: true });
  canvas.addEventListener('pointercancel', onPointerUp, { passive: true });
}

// ── Edit Toolbar UI ───────────────────────────────────────────

export function buildEditToolbar() {
  if (document.getElementById('edit-toolbar')) return;

  const toolbar = document.createElement('div');
  toolbar.id = 'edit-toolbar';
  toolbar.style.display = 'none';
  toolbar.innerHTML = `
    <div class="edit-row edit-row-top">
      <span class="edit-mode-icon">✏️</span>
      <input type="text" id="edit-play-name" class="edit-name-input" placeholder="Play Name" autocomplete="off" autocorrect="off" spellcheck="false">
      <button class="edit-btn edit-btn-save" id="edit-save">💾 Save</button>
      <button class="edit-btn edit-btn-cancel" id="edit-cancel">✕</button>
    </div>
    <div class="edit-row edit-row-actions">
      <button class="edit-btn edit-btn-new" id="edit-new">＋ New</button>
      <select id="edit-formation-select" class="edit-select">
        ${Object.keys(FORMATIONS).map(f => `<option value="${f}">${f}</option>`).join('')}
      </select>
      <button class="edit-btn" id="edit-apply-formation">Apply</button>
      <button class="edit-btn" id="edit-undo" title="Undo">↩</button>
      <button class="edit-btn edit-btn-dup" id="edit-duplicate" title="Duplicate play">📋</button>
      <button class="edit-btn edit-btn-danger" id="edit-delete" title="Delete play">🗑️</button>
      <button class="edit-btn" id="edit-export" title="Export playbook JSON">⬇️</button>
      <label class="edit-btn edit-btn-import" for="edit-import-file" title="Import playbook JSON">⬆️</label>
      <input type="file" id="edit-import-file" accept=".json" style="display:none">
    </div>
    <div id="player-edit-panel" class="edit-row player-panel" style="display:none">
      <span id="edit-player-name-label" class="edit-player-label">—</span>
      <span class="edit-mini-label">Read:</span>
      <button class="read-btn" data-read="0" title="No read">—</button>
      <button class="read-btn" data-read="1" title="1st read">①</button>
      <button class="read-btn" data-read="2" title="2nd read">②</button>
      <button class="read-btn" data-read="3" title="3rd read">③</button>
      <button class="read-btn" data-read="4" title="4th read">④</button>
      <button class="edit-btn edit-dash-btn" id="edit-dashed" title="Toggle dashed route">- - -</button>
      <input type="text" id="edit-label-input" class="edit-label-input" placeholder="Label (e.g. POST)" autocomplete="off">
      <button class="edit-btn edit-btn-clear" id="edit-clear-route" title="Clear route">Clear</button>
    </div>
    <div class="edit-row edit-row-notes">
      <span class="edit-mini-label">Notes:</span>
      <input type="text" id="edit-when-to-use" class="edit-notes-input" placeholder="When to use (optional)" autocomplete="off">
    </div>
  `;

  // Insert before the field-container
  const fieldContainer = document.getElementById('field-container');
  fieldContainer.parentNode.insertBefore(toolbar, fieldContainer);

  // ── Wire up toolbar events ──────────────────────────────────

  document.getElementById('edit-save').addEventListener('click', () => {
    exitEditMode(true);
  });

  document.getElementById('edit-cancel').addEventListener('click', () => {
    exitEditMode(false);
    if (_updateInfoPanel) _updateInfoPanel();
  });

  document.getElementById('edit-new').addEventListener('click', () => {
    const sel = document.getElementById('edit-formation-select');
    const formation = sel ? sel.value : 'Spread';
    if (state.editorActive) {
      // Already in edit mode: ask about unsaved changes
      if (!confirm('Discard current edits and start a new play?')) return;
      exitEditMode(false);
    }
    enterNewPlayMode(formation);
  });

  document.getElementById('edit-apply-formation').addEventListener('click', () => {
    const sel = document.getElementById('edit-formation-select');
    if (sel && state.editorActive) applyFormation(sel.value);
  });

  document.getElementById('edit-undo').addEventListener('click', undoEdit);

  document.getElementById('edit-duplicate').addEventListener('click', () => {
    exitEditMode(false);
    duplicateCurrentPlay();
  });

  document.getElementById('edit-delete').addEventListener('click', () => {
    if (state.editorActive && state.editorPlayIdx === -1) {
      // New play not yet saved — just cancel
      exitEditMode(false);
      if (_updateInfoPanel) _updateInfoPanel();
      return;
    }
    exitEditMode(false);
    deleteCurrentPlay();
  });

  document.getElementById('edit-export').addEventListener('click', exportPlaybook);

  document.getElementById('edit-import-file').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importPlaybook(e.target.files[0]);
      e.target.value = '';
    }
  });

  // Read order buttons
  document.querySelectorAll('.read-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = state.editorSelectedPlayer;
      if (!name || !state.editorPlay) return;
      setPlayerRead(name, parseInt(btn.dataset.read));
    });
  });

  document.getElementById('edit-dashed').addEventListener('click', () => {
    const name = state.editorSelectedPlayer;
    if (name) togglePlayerDashed(name);
  });

  document.getElementById('edit-label-input').addEventListener('input', (e) => {
    const name = state.editorSelectedPlayer;
    if (name) setPlayerLabel(name, e.target.value);
  });

  document.getElementById('edit-clear-route').addEventListener('click', () => {
    const name = state.editorSelectedPlayer;
    if (name) clearPlayerRoute(name);
  });
}

function showEditToolbar() {
  const toolbar = document.getElementById('edit-toolbar');
  if (toolbar) toolbar.style.display = 'flex';

  const editBtn = document.getElementById('btn-edit');
  if (editBtn) { editBtn.style.opacity = '1'; editBtn.classList.add('active'); }

  // Populate fields
  const nameInput = document.getElementById('edit-play-name');
  if (nameInput && state.editorPlay) nameInput.value = state.editorPlay.name || 'New Play';

  const notesInput = document.getElementById('edit-when-to-use');
  if (notesInput && state.editorPlay) {
    notesInput.value = (state.editorPlay.whenToUse || []).join(' • ');
  }

  const formSel = document.getElementById('edit-formation-select');
  if (formSel && state.editorPlay) formSel.value = state.editorPlay.formation || 'Spread';

  refreshPlayerPanel();

  // Disable play-btn during edit
  const playBtn = document.getElementById('btn-play');
  if (playBtn) { playBtn.disabled = true; playBtn.style.opacity = '0.3'; }
}

function hideEditToolbar() {
  const toolbar = document.getElementById('edit-toolbar');
  if (toolbar) toolbar.style.display = 'none';

  const editBtn = document.getElementById('btn-edit');
  if (editBtn) { editBtn.style.opacity = '0.4'; editBtn.classList.remove('active'); }

  const playerPanel = document.getElementById('player-edit-panel');
  if (playerPanel) playerPanel.style.display = 'none';

  // Re-enable play button
  const playBtn = document.getElementById('btn-play');
  if (playBtn) { playBtn.disabled = false; playBtn.style.opacity = '1'; }
}

function refreshPlayerPanel() {
  const panel = document.getElementById('player-edit-panel');
  if (!panel) return;

  const name = state.editorSelectedPlayer;
  if (!name || !state.editorPlay?.players[name]) {
    panel.style.display = 'none';
    return;
  }

  const pd = state.editorPlay.players[name];
  panel.style.display = 'flex';

  // Player name label
  const nameLabel = document.getElementById('edit-player-name-label');
  if (nameLabel) nameLabel.textContent = name;

  // Read buttons
  document.querySelectorAll('.read-btn').forEach(btn => {
    btn.classList.toggle('active', pd.read === parseInt(btn.dataset.read));
  });

  // Dashed toggle
  const dashedBtn = document.getElementById('edit-dashed');
  if (dashedBtn) dashedBtn.classList.toggle('active', pd.dashed);

  // Label input
  const labelInput = document.getElementById('edit-label-input');
  if (labelInput && document.activeElement !== labelInput) {
    labelInput.value = pd.label || '';
  }
}

// ── Button toggle handler (called from app.js) ────────────────

export function handleEditToggle() {
  if (state.editorActive) {
    // Already in edit mode — do nothing (use Save/Cancel in toolbar)
    return;
  }

  // If current play is built-in, inform user we'll make a copy
  const currentPlay = PLAYS[state.currentPlayIdx];
  if (currentPlay && !currentPlay.isCustom) {
    const proceed = confirm(
      `"${currentPlay.name}" is a built-in play.\n\nEditing will create a custom copy.\nProceed?`
    );
    if (!proceed) return;
  }

  enterEditMode(state.currentPlayIdx);
}
