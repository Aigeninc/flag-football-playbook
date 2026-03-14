// modules/ui.js — DOM building, player filter, substitutions, info panel

import {
  state, LOCKED_PLAYERS, ALL_ROSTER,
  getActiveSubs, getDisplayName, getAvailableSubs,
  saveSunlightMode,
} from './state.js';
import { drawFrame } from './renderer.js';
import { togglePlayPause, replay, updateTimer } from './animation.js';

// selectPlay callback registered from app.js
let _selectPlay = null;
export function setSelectPlayFn(fn) { _selectPlay = fn; }

// ── Play Selector ─────────────────────────────────────────────

export function buildPlaySelector() {
  const container = document.getElementById('play-selector');
  container.innerHTML = '';
  PLAYS.forEach((play, i) => {
    const hasSubs = state.substitutions[i] && Object.keys(state.substitutions[i]).length > 0;
    const btn = document.createElement('button');
    let cls = 'play-btn' + (i === state.currentPlayIdx ? ' active' : '');
    if (play.isCustom) cls += ' custom';
    btn.className = cls;
    btn.textContent = play.name + (hasSubs ? ' ↔' : '') + (play.isCustom ? ' ★' : '');
    btn.addEventListener('click', () => {
      if (state.editorActive) return; // don't switch plays while editing
      if (state.queueMode) {
        state.queue.push({ playIdx: i, result: null });
        state.queuePos = state.queue.length - 1;
        if (_selectPlay) _selectPlay(i);
      } else {
        if (_selectPlay) _selectPlay(i);
      }
    });
    container.appendChild(btn);
  });
}

// ── Player Filter ─────────────────────────────────────────────

export function buildPlayerFilter() {
  const container = document.getElementById('player-filter');
  container.innerHTML = '';
  const play = PLAYS[state.currentPlayIdx];
  const subs = getActiveSubs();

  for (const origName of Object.keys(play.players)) {
    const dispName = subs[origName] || origName;
    const p = PLAYERS[dispName];
    if (!p) continue;
    const isLocked = LOCKED_PLAYERS.includes(origName);
    const isSub = dispName !== origName;

    const btn = document.createElement('button');
    btn.className = 'player-dot-btn' + (state.highlightPlayer === origName ? ' active' : '');
    btn.innerHTML = `<span class="dot" style="background:${p.color}${isSub ? ';box-shadow:0 0 4px 2px #fff' : ''}"></span><span class="name">${dispName}${isSub ? '↔' : ''}</span>`;

    let lastTap = 0;
    btn.addEventListener('click', (e) => {
      const now = Date.now();
      if (!isLocked && now - lastTap < 350) {
        e.preventDefault();
        state.highlightPlayer = null;
        openSubMenu(origName);
        lastTap = 0;
        return;
      }
      lastTap = now;
      setTimeout(() => {
        if (lastTap === now) {
          state.highlightPlayer = state.highlightPlayer === origName ? null : origName;
          closeSubMenu();
          buildPlayerFilter();
          drawFrame();
        }
      }, 360);
    });

    if (!isLocked) {
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        openSubMenu(origName);
      });
    }
    container.appendChild(btn);
  }

  if (Object.keys(subs).length > 0) {
    const resetBtn = document.createElement('button');
    resetBtn.className = 'player-dot-btn';
    resetBtn.innerHTML = '<span class="name" style="font-size:11px">↩ Reset</span>';
    resetBtn.style.opacity = '0.7';
    resetBtn.addEventListener('click', () => {
      delete state.substitutions[state.currentPlayIdx];
      closeSubMenu();
      buildPlayerFilter();
      drawFrame();
      buildPlaySelector();
    });
    container.appendChild(resetBtn);
  }
}

// ── Sub Menu ──────────────────────────────────────────────────

export function openSubMenu(targetOrigName) {
  closeSubMenu();
  state.subMenuTarget = targetOrigName;
  const available = getAvailableSubs(targetOrigName);
  if (!available.length) return;

  const menu = document.createElement('div');
  menu.id = 'sub-menu';
  menu.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:#1a1a2e;border:2px solid #f59e0b;border-radius:12px;padding:8px;display:flex;gap:8px;z-index:100;box-shadow:0 4px 20px rgba(0,0,0,0.5);';

  const header = document.createElement('div');
  header.style.cssText = 'color:#f59e0b;font-size:11px;font-weight:bold;padding:4px 8px;white-space:nowrap;display:flex;align-items:center;';
  header.textContent = `SUB ${getDisplayName(targetOrigName)}:`;
  menu.appendChild(header);

  for (const subName of available) {
    const p = PLAYERS[subName];
    const btn = document.createElement('button');
    btn.style.cssText = `background:${p.color};color:${(p.color === '#2dd4bf' || p.color === '#f59e0b') ? '#000' : '#fff'};border:2px solid #fff;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:bold;min-width:44px;min-height:44px;cursor:pointer;`;
    btn.textContent = subName;
    btn.addEventListener('click', () => makeSub(targetOrigName, subName));
    menu.appendChild(btn);
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = 'background:#333;color:#fff;border:1px solid #666;border-radius:8px;padding:6px 10px;font-size:12px;min-height:44px;cursor:pointer;';
  cancelBtn.textContent = '✕';
  cancelBtn.addEventListener('click', closeSubMenu);
  menu.appendChild(cancelBtn);

  document.body.appendChild(menu);
  state.subMenuOpen = true;
}

export function closeSubMenu() {
  const menu = document.getElementById('sub-menu');
  if (menu) menu.remove();
  state.subMenuOpen = false;
  state.subMenuTarget = null;
}

export function makeSub(origName, replacementName) {
  if (!state.substitutions[state.currentPlayIdx]) {
    state.substitutions[state.currentPlayIdx] = {};
  }
  state.substitutions[state.currentPlayIdx][origName] = replacementName;
  closeSubMenu();
  buildPlayerFilter();
  buildPlaySelector();
  drawFrame();
}

// ── Controls setup ────────────────────────────────────────────

export function buildControls() {
  document.getElementById('btn-play').addEventListener('click', togglePlayPause);
  document.getElementById('btn-replay').addEventListener('click', replay);

  const modeBtn = document.getElementById('btn-mode');
  modeBtn.addEventListener('click', () => {
    state.viewMode = state.viewMode === 'qb' ? 'game' : 'qb';
    modeBtn.textContent = state.viewMode === 'qb' ? '👁️' : '🏈';
    modeBtn.title = state.viewMode === 'qb' ? 'QB Study Mode' : 'Game Speed';
    const label = state.viewMode === 'qb' ? 'QB STUDY MODE' : 'GAME SPEED';
    document.getElementById('play-notes').textContent = label;
    setTimeout(() => {
      document.getElementById('play-notes').textContent = PLAYS[state.currentPlayIdx].notes || '';
    }, 1500);
    drawFrame();
  });

  const defBtn = document.getElementById('btn-defense');
  defBtn.addEventListener('click', () => {
    const modes = ['off', 'man', 'zone'];
    const idx = (modes.indexOf(state.defenseMode) + 1) % modes.length;
    state.defenseMode = modes[idx];
    const labels = { off: '🛡️', man: '🔴 MAN', zone: '🔵 ZONE' };
    defBtn.textContent = labels[state.defenseMode];
    document.getElementById('play-notes').textContent =
      state.defenseMode === 'off' ? (PLAYS[state.currentPlayIdx].notes || '') :
      state.defenseMode === 'man' ? 'MAN DEFENSE — each defender follows a receiver' :
      'ZONE DEFENSE — defenders guard areas, react to nearby routes';
    setTimeout(() => {
      document.getElementById('play-notes').textContent = PLAYS[state.currentPlayIdx].notes || '';
    }, 2000);
    drawFrame();
  });

  const ballBtn = document.getElementById('btn-ball');
  ballBtn.style.opacity = '0.4';
  ballBtn.addEventListener('click', () => {
    state.showBall = !state.showBall;
    ballBtn.style.opacity = state.showBall ? '1' : '0.4';
    drawFrame();
  });

  // Sunlight mode toggle
  const sunBtn = document.getElementById('btn-sun');
  if (sunBtn) {
    sunBtn.style.opacity = state.sunlightMode ? '1' : '0.4';
    sunBtn.addEventListener('click', () => {
      state.sunlightMode = !state.sunlightMode;
      sunBtn.style.opacity = state.sunlightMode ? '1' : '0.4';
      document.body.classList.toggle('sunlight', state.sunlightMode);
      saveSunlightMode();
      drawFrame();
    });
  }

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.speed = parseFloat(btn.dataset.speed);
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ── Info Panel ────────────────────────────────────────────────

export function updateInfoPanel() {
  const play = PLAYS[state.currentPlayIdx];
  document.getElementById('formation-label').textContent = 'Formation: ' + play.formation;
  document.getElementById('when-to-use').innerHTML = play.whenToUse
    .map(b => '<span class="bullet">•</span>' + b).join('&nbsp;&nbsp;');
  document.getElementById('play-notes').textContent = play.notes || '';
}
