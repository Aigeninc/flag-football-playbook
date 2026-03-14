// modules/roster.js — Roster management, lineup, and player routes
// PLAYS and PLAYERS are globals from plays.js

import {
  state, POSITIONS, DEFAULT_LINEUP, getLineupSubs, getDisplayNameForPlay, saveSubstitutions,
} from './state.js';
import { drawFrame } from './renderer.js';
import { buildPlaySelector, buildPlayerFilter } from './ui.js';

let _selectPlay = null;
export function setSelectPlayFn(fn) { _selectPlay = fn; }

// ── Color palette for new players ─────────────────────────────
const PLAYER_COLORS = [
  '#e11d48', '#16a34a', '#7c3aed', '#0891b2', '#c2410c',
  '#0369a1', '#65a30d', '#9333ea', '#b45309', '#0f766e',
  '#be185d', '#0f172a',
];

// Currently selected lineup slot for sub assignment
let selectedLineupSlot = null;

// ── Panel open/close ──────────────────────────────────────────

export function openRosterPanel() {
  const panel = document.getElementById('roster-panel');
  const backdrop = document.getElementById('roster-backdrop');
  if (!panel) return;
  selectedLineupSlot = null;
  panel.classList.add('open');
  if (backdrop) backdrop.classList.add('visible');
  renderRosterPanel();
}

export function closeRosterPanel() {
  const panel = document.getElementById('roster-panel');
  const backdrop = document.getElementById('roster-backdrop');
  if (!panel) return;
  selectedLineupSlot = null;
  panel.classList.remove('open');
  if (backdrop) backdrop.classList.remove('visible');
  // Hide any open sub-sections
  const routesSec = document.getElementById('routes-section');
  if (routesSec) routesSec.style.display = 'none';
  const formArea = document.getElementById('roster-form-area');
  if (formArea) formArea.style.display = 'none';
}

// ── Main render ───────────────────────────────────────────────

export function renderRosterPanel() {
  renderLineupGrid();
  renderBench();
  renderRotationBar();
  renderRoutesPlayerSelect();
}

function renderLineupGrid() {
  const grid = document.getElementById('lineup-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const lineup = getCurrentLineup();
  POSITIONS.forEach(pos => {
    const playerName = lineup[pos];
    const color = playerName ? getPlayerDisplayColor(playerName) : '#444';
    const shortName = playerName ? playerName.substring(0, 4) : '---';
    const isSelected = selectedLineupSlot === pos;

    const slot = document.createElement('div');
    slot.className = 'lineup-slot' + (isSelected ? ' selected' : '') + (!playerName ? ' empty' : '');

    slot.innerHTML = `
      <div class="lineup-slot-pos">${pos}</div>
      <div class="lineup-slot-circle" style="background:${color};border-color:${isSelected ? '#fff' : color}">
        <span class="lineup-slot-name">${shortName}</span>
      </div>
    `;

    slot.addEventListener('click', () => {
      if (selectedLineupSlot === pos) {
        selectedLineupSlot = null;
      } else {
        selectedLineupSlot = pos;
      }
      renderRosterPanel();
    });

    grid.appendChild(slot);
  });

  // Instruction hint
  const hint = document.createElement('div');
  hint.className = 'lineup-hint';
  if (selectedLineupSlot) {
    hint.textContent = `Tap a bench player to put them at ${selectedLineupSlot}`;
    hint.style.color = '#f59e0b';
  } else {
    hint.textContent = 'Tap a position to swap';
  }
  grid.appendChild(hint);
}

function renderBench() {
  const bench = document.getElementById('bench-list');
  if (!bench) return;
  bench.innerHTML = '';

  const lineup = getCurrentLineup();
  const starters = new Set(Object.values(lineup).filter(Boolean));

  // Show all roster players
  const benchPlayers = state.roster.filter(p => !starters.has(p.name));
  const starterPlayers = state.roster.filter(p => starters.has(p.name));

  // Bench players (available to sub in)
  if (benchPlayers.length > 0) {
    benchPlayers.forEach(player => {
      bench.appendChild(createBenchPlayerBtn(player, true));
    });
  }

  // Starters on bench (tap to edit)
  if (starterPlayers.length > 0) {
    const divider = document.createElement('div');
    divider.className = 'bench-divider';
    divider.textContent = '── Starters ──';
    bench.appendChild(divider);
    starterPlayers.forEach(player => {
      bench.appendChild(createBenchPlayerBtn(player, false));
    });
  }

  if (state.roster.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'bench-empty';
    empty.textContent = 'No players in roster';
    bench.appendChild(empty);
  }

  // Add player button
  const addBtn = document.createElement('button');
  addBtn.className = 'add-player-btn';
  addBtn.textContent = '+ Add Player';
  addBtn.addEventListener('click', () => showPlayerForm(null));
  bench.appendChild(addBtn);
}

function createBenchPlayerBtn(player, isBench) {
  const btn = document.createElement('div');
  btn.className = 'bench-player-btn' + (isBench && selectedLineupSlot ? ' sub-available' : '');

  const color = player.color || '#999';
  const posText = (player.positions || []).join(', ') || '—';

  btn.innerHTML = `
    <span class="bench-dot" style="background:${color}"></span>
    <span class="bench-name">${player.name}</span>
    <span class="bench-pos">${posText}</span>
    <span class="bench-number">#${player.number != null ? player.number : '?'}</span>
    <button class="bench-edit-btn" data-id="${player.id}" title="Edit">✏️</button>
  `;

  // Edit button
  btn.querySelector('.bench-edit-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    showPlayerForm(player);
  });

  // Main tap: assign to lineup or show options
  btn.addEventListener('click', () => {
    if (selectedLineupSlot && isBench) {
      assignToLineup(selectedLineupSlot, player.name);
    } else if (selectedLineupSlot && !isBench) {
      // Swap a starter's position
      assignToLineup(selectedLineupSlot, player.name);
    }
  });

  return btn;
}

function renderRotationBar() {
  const bar = document.getElementById('roster-rotation-bar');
  if (!bar) return;

  const teamLabel = state.activeTeam === '1' ? '1st Team' : '2nd Team';
  const teamIcon = state.activeTeam === '1' ? '🔴' : '🔵';

  bar.innerHTML = `
    <button class="team-toggle-btn" id="team-toggle-btn">
      ${teamIcon} ${teamLabel} &nbsp;⇄&nbsp; Switch
    </button>
    <div class="rotation-counts" id="rotation-counts">
      ${Object.entries(state.rotationCounts || {}).filter(([, c]) => c > 0).map(([name, count]) =>
        `<span class="rot-count">${name}: ${count}▸</span>`
      ).join('')}
    </div>
  `;

  document.getElementById('team-toggle-btn')?.addEventListener('click', toggleTeam);
}

function renderRoutesPlayerSelect() {
  const select = document.getElementById('routes-player-select');
  if (!select) return;
  select.innerHTML = '';

  state.roster.forEach(player => {
    const btn = document.createElement('button');
    btn.className = 'routes-player-btn';
    btn.style.cssText = `border-color:${player.color};background:rgba(0,0,0,0.3)`;
    btn.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${player.color};margin-right:4px"></span>${player.name}`;
    btn.addEventListener('click', () => openMyRoutes(player.name));
    select.appendChild(btn);
  });
}

// ── Lineup management ─────────────────────────────────────────

function getCurrentLineup() {
  return state.activeTeam === '1' ? state.lineup : state.lineup2;
}

function assignToLineup(position, playerName) {
  const lineup = getCurrentLineup();

  // If player is already in a different slot, remove them from there
  for (const [pos, name] of Object.entries(lineup)) {
    if (name === playerName && pos !== position) {
      lineup[pos] = null;
      break;
    }
  }

  lineup[position] = playerName;
  selectedLineupSlot = null;

  saveLineup();
  renderRosterPanel();
  buildPlayerFilter();
  buildPlaySelector();
  drawFrame();
}

function toggleTeam() {
  // Track how many plays on current lineup before switching
  const prevLineup = getCurrentLineup();
  if (!state.rotationCounts) state.rotationCounts = {};
  Object.values(prevLineup).forEach(name => {
    if (name) {
      state.rotationCounts[name] = (state.rotationCounts[name] || 0) + 1;
    }
  });

  state.activeTeam = state.activeTeam === '1' ? '2' : '1';

  saveLineup();
  renderRosterPanel();
  buildPlayerFilter();
  buildPlaySelector();
  drawFrame();

  // Update the header toggle button label
  const rosterBtn = document.getElementById('btn-roster');
  if (rosterBtn) {
    const label = state.activeTeam === '1' ? '👥' : '👥②';
    rosterBtn.textContent = label;
  }
}

// ── Player CRUD ───────────────────────────────────────────────

function showPlayerForm(player) {
  const formArea = document.getElementById('roster-form-area');
  if (!formArea) return;

  const isEdit = player != null;
  const title = isEdit ? `Edit ${player.name}` : 'Add Player';

  formArea.style.display = 'block';
  formArea.innerHTML = `
    <div class="roster-form">
      <div class="roster-form-title">${title}</div>
      <div class="form-row">
        <input type="text" class="roster-input" id="fp-name" placeholder="Name" maxlength="12"
          value="${isEdit ? player.name : ''}" autocomplete="off">
        <input type="number" class="roster-input roster-input-num" id="fp-number"
          placeholder="#" min="0" max="99" value="${isEdit && player.number != null ? player.number : ''}">
      </div>
      <div class="pos-checkboxes">
        ${POSITIONS.map(p => `
          <label class="pos-check">
            <input type="checkbox" value="${p}" ${isEdit && (player.positions||[]).includes(p) ? 'checked' : ''}>
            ${p}
          </label>
        `).join('')}
      </div>
      <div class="form-btns">
        <button class="form-btn form-btn-save" id="fp-save">
          ${isEdit ? 'Save' : 'Add'}
        </button>
        ${isEdit ? `<button class="form-btn form-btn-delete" id="fp-delete">🗑️ Remove</button>` : ''}
        <button class="form-btn form-btn-cancel" id="fp-cancel">Cancel</button>
      </div>
    </div>
  `;

  // Focus name input
  setTimeout(() => document.getElementById('fp-name')?.focus(), 50);

  document.getElementById('fp-save')?.addEventListener('click', () => {
    const name = document.getElementById('fp-name')?.value.trim();
    const number = document.getElementById('fp-number')?.value;
    const positions = [...formArea.querySelectorAll('.pos-check input:checked')].map(i => i.value);
    if (!name) return;

    if (isEdit) {
      updatePlayer(player.id, { name, number: parseInt(number) || 0, positions });
    } else {
      addPlayer({ name, number: parseInt(number) || 0, positions });
    }
    formArea.style.display = 'none';
    renderRosterPanel();
  });

  document.getElementById('fp-delete')?.addEventListener('click', () => {
    if (confirm(`Remove ${player.name} from roster?`)) {
      deletePlayer(player.id);
      formArea.style.display = 'none';
      renderRosterPanel();
    }
  });

  document.getElementById('fp-cancel')?.addEventListener('click', () => {
    formArea.style.display = 'none';
  });
}

function addPlayer({ name, number, positions }) {
  // Pick an unused color
  const usedColors = new Set(state.roster.map(p => p.color));
  const color = PLAYER_COLORS.find(c => !usedColors.has(c)) || PLAYER_COLORS[state.roster.length % PLAYER_COLORS.length];

  const player = {
    id: `player_${Date.now()}`,
    name, number: number || 0,
    positions: positions || [],
    color,
  };
  state.roster.push(player);

  // Register color in PLAYERS global so renderer knows their color
  if (!PLAYERS[name]) {
    PLAYERS[name] = { color, role: (positions[0]) || 'WR/RB' };
  }

  saveRoster();
}

function updatePlayer(id, { name, number, positions }) {
  const player = state.roster.find(p => p.id === id);
  if (!player) return;

  const oldName = player.name;
  player.name = name;
  player.number = number || 0;
  player.positions = positions;

  // Update PLAYERS global
  if (oldName !== name) {
    if (PLAYERS[oldName]) {
      PLAYERS[name] = { ...PLAYERS[oldName] };
      delete PLAYERS[oldName];
    }
  }
  if (!PLAYERS[name]) {
    PLAYERS[name] = { color: player.color, role: (positions[0]) || 'WR/RB' };
  }

  // Update lineup references if name changed
  if (oldName !== name) {
    for (const lineup of [state.lineup, state.lineup2]) {
      for (const [pos, pName] of Object.entries(lineup)) {
        if (pName === oldName) lineup[pos] = name;
      }
    }
    // Update substitutions
    for (const [playIdx, subs] of Object.entries(state.substitutions)) {
      for (const [orig, rep] of Object.entries(subs)) {
        if (rep === oldName) subs[orig] = name;
      }
    }
    saveSubstitutions();
  }

  saveRoster();
  saveLineup();
  buildPlayerFilter();
  buildPlaySelector();
  drawFrame();
}

function deletePlayer(id) {
  const idx = state.roster.findIndex(p => p.id === id);
  if (idx === -1) return;

  const player = state.roster[idx];
  state.roster.splice(idx, 1);

  // Remove from lineups
  for (const lineup of [state.lineup, state.lineup2]) {
    for (const [pos, name] of Object.entries(lineup)) {
      if (name === player.name) lineup[pos] = null;
    }
  }

  // Remove from substitutions
  for (const subs of Object.values(state.substitutions)) {
    for (const [orig, rep] of Object.entries(subs)) {
      if (rep === player.name) delete subs[orig];
    }
  }

  saveRoster();
  saveLineup();
  saveSubstitutions();
  buildPlayerFilter();
  buildPlaySelector();
  drawFrame();
}

// ── My Routes view ────────────────────────────────────────────

export function openMyRoutes(playerName) {
  const section = document.getElementById('routes-section');
  if (!section) return;

  section.style.display = 'block';
  section.innerHTML = `
    <div class="routes-header">
      <span class="routes-title">📍 ${playerName}'s Routes</span>
      <button class="routes-close-btn" id="routes-close-btn">✕</button>
    </div>
    <div class="routes-plays-grid" id="routes-plays-grid"></div>
  `;

  document.getElementById('routes-close-btn')?.addEventListener('click', () => {
    section.style.display = 'none';
  });

  const grid = document.getElementById('routes-plays-grid');
  const plays = getPlaysForPlayer(playerName);

  if (plays.length === 0) {
    grid.innerHTML = '<div class="routes-empty">No plays found</div>';
    return;
  }

  plays.forEach(({ play, idx, origName }) => {
    const chip = document.createElement('button');
    chip.className = 'routes-play-chip';
    const color = getPlayerDisplayColor(playerName);
    chip.style.borderColor = color;
    chip.innerHTML = `<strong>${play.name}</strong><span class="chip-pos">${play.formation}</span>`;
    chip.addEventListener('click', () => {
      if (_selectPlay) _selectPlay(idx);
      // Highlight this player's route
      state.highlightPlayer = origName;
      drawFrame();
    });
    grid.appendChild(chip);
  });
}

function getPlaysForPlayer(playerName) {
  const results = [];
  PLAYS.forEach((play, idx) => {
    for (const origName of Object.keys(play.players)) {
      const dispName = getDisplayNameForPlay(origName, idx);
      if (dispName === playerName) {
        results.push({ play, idx, origName });
        break;
      }
    }
  });
  return results;
}

// ── Color helper ──────────────────────────────────────────────

export function getPlayerDisplayColor(name) {
  if (PLAYERS[name]) return PLAYERS[name].color;
  const rp = state.roster.find(p => p.name === name);
  return rp ? rp.color : '#999';
}

// ── Init ──────────────────────────────────────────────────────

export function initRoster() {
  loadRosterFromStorage();
  loadLineupFromStorage();

  // Wire up the 👥 button
  const btn = document.getElementById('btn-roster');
  if (btn) {
    btn.style.opacity = '0.4';
    btn.addEventListener('click', () => {
      const panel = document.getElementById('roster-panel');
      const isOpen = panel?.classList.contains('open');
      if (isOpen) {
        closeRosterPanel();
        btn.style.opacity = '0.4';
      } else {
        openRosterPanel();
        btn.style.opacity = '1';
      }
    });
  }

  // Close on backdrop click
  const backdrop = document.getElementById('roster-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeRosterPanel();
      if (btn) btn.style.opacity = '0.4';
    });
  }

  // Close button inside panel
  const closeBtn = document.getElementById('roster-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeRosterPanel();
      if (btn) btn.style.opacity = '0.4';
    });
  }
}

// ── Storage ───────────────────────────────────────────────────

function loadRosterFromStorage() {
  try {
    const raw = localStorage.getItem('playbook:roster');
    if (raw) {
      state.roster = JSON.parse(raw);
      // Register all roster players in PLAYERS global
      state.roster.forEach(p => {
        if (!PLAYERS[p.name]) {
          PLAYERS[p.name] = { color: p.color, role: (p.positions || [])[0] || 'WR/RB' };
        }
      });
    } else {
      initDefaultRoster();
    }
  } catch (e) {
    console.warn('Failed to load roster:', e);
    initDefaultRoster();
  }
}

function initDefaultRoster() {
  // Pre-populate from the hardcoded plays.js PLAYERS
  state.roster = [
    { id: 'braelyn',  name: 'Braelyn',  number: 1,  positions: ['QB'],            color: '#1a1a1a' },
    { id: 'lenox',    name: 'Lenox',    number: 5,  positions: ['C'],             color: '#8b5cf6' },
    { id: 'greyson',  name: 'Greyson',  number: 11, positions: ['WR1', 'WR2'],    color: '#dc2626' },
    { id: 'marshall', name: 'Marshall', number: 7,  positions: ['WR2', 'QB'],     color: '#f59e0b' },
    { id: 'cooper',   name: 'Cooper',   number: 4,  positions: ['RB', 'WR2'],     color: '#2dd4bf' },
    { id: 'jordy',    name: 'Jordy',    number: 12, positions: ['WR1','WR2','RB'],color: '#2563eb' },
    { id: 'zeke',     name: 'Zeke',     number: 8,  positions: ['RB', 'WR2'],     color: '#ff6600' },
  ];
  saveRoster();
}

function loadLineupFromStorage() {
  try {
    const raw = localStorage.getItem('playbook:lineup');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.lineup)         state.lineup  = data.lineup;
      if (data.lineup2)        state.lineup2 = data.lineup2;
      if (data.activeTeam)     state.activeTeam = data.activeTeam;
      if (data.rotationCounts) state.rotationCounts = data.rotationCounts;
    }
  } catch (e) {
    console.warn('Failed to load lineup:', e);
  }
}

export function saveRoster() {
  try {
    localStorage.setItem('playbook:roster', JSON.stringify(state.roster));
  } catch (e) {}
}

export function saveLineup() {
  try {
    localStorage.setItem('playbook:lineup', JSON.stringify({
      lineup: state.lineup,
      lineup2: state.lineup2,
      activeTeam: state.activeTeam,
      rotationCounts: state.rotationCounts,
    }));
  } catch (e) {}
}
