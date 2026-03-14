// modules/gameday.js — Phase 4: Game Day Tools
// Interactive call sheet, play tracking, and game stats dashboard

import { state } from './state.js';
import { getPlayScore } from './coach.js';

// ── selectPlay callback from app.js ──────────────────────────
let _selectPlay = null;
export function setSelectPlayFn(fn) { _selectPlay = fn; }

// ── Situation definitions ─────────────────────────────────────
const SITUATIONS = [
  { id: '1st',      label: '1st Down',    coachState: { down: '1',  field: null, defense: null } },
  { id: 'rz',       label: 'Red Zone',    coachState: { down: null, field: 'rz', defense: null } },
  { id: 'bigplay',  label: 'Big Play',    coachState: { down: '4',  field: 'open', defense: null } },
  { id: 'nrz',      label: 'No-Run Zone', coachState: { down: null, field: 'nrz', defense: null } },
  { id: 'man',      label: 'vs Man',      coachState: { down: null, field: null, defense: 'man' } },
  { id: 'zone',     label: 'vs Zone',     coachState: { down: null, field: null, defense: 'zone' } },
  { id: 'blitz',    label: 'vs Blitz',    coachState: { down: null, field: null, defense: 'rush' } },
];

// ── localStorage state ────────────────────────────────────────
const LS_KEY = 'playbook:gameday';

function loadGameState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function defaultGameState() {
  return {
    gameId: Date.now(),
    startTime: Date.now(),
    calledPlays: [],   // [{ playName, playIdx, timestamp, result: null|'worked'|'didnt' }]
    playResults: {},   // { playName: { attempts, successes } }
    stats: {
      firstDowns: 0,
      touchdowns: 0,
      turnovers: 0,
      currentHalf: 1,
      half1Plays: 0,
      half2Plays: 0,
    },
  };
}

let gameState = loadGameState() || defaultGameState();

function saveGameState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(gameState));
  } catch (e) {}
}

// ── Current situation for call sheet ─────────────────────────
let currentSituationId = '1st';
let pendingResultIdx = null;  // index in calledPlays awaiting result

// ── Helpers ───────────────────────────────────────────────────

function getPlayResult(playName) {
  return gameState.playResults[playName] || { attempts: 0, successes: 0 };
}

function getSuccessRate(playName) {
  const r = getPlayResult(playName);
  if (r.attempts === 0) return null;
  return Math.round((r.successes / r.attempts) * 100);
}

function getPlayBadge(playName) {
  const r = getPlayResult(playName);
  if (r.attempts < 3) return '';
  const rate = r.successes / r.attempts;
  if (rate > 0.66) return '🔥';
  if (rate < 0.33) return '❄️';
  return '';
}

function getRankedPlays(situationId) {
  const sit = SITUATIONS.find(s => s.id === situationId);
  if (!sit) return [];

  // Temporarily set state.situation for scoring
  const origSituation = { ...state.situation };
  state.situation = { ...sit.coachState };

  const scored = PLAYS.map((play, idx) => ({
    name: play.name,
    idx,
    score: getPlayScore(play.name),
  })).sort((a, b) => b.score - a.score);

  state.situation = origSituation;
  return scored.slice(0, 6);
}

function getLastCalled(n = 3) {
  return gameState.calledPlays.slice(-n).reverse();
}

// ── DOM rendering ─────────────────────────────────────────────

export function renderCallSheet() {
  const panel = document.getElementById('gameday-panel');
  if (!panel || !panel.classList.contains('open')) return;

  renderSituationTabs();
  renderPlayList();
  renderLastCalled();
  renderResultPrompt();
}

function renderSituationTabs() {
  const container = document.getElementById('gd-situation-tabs');
  if (!container) return;

  container.innerHTML = '';
  SITUATIONS.forEach(sit => {
    const btn = document.createElement('button');
    btn.className = 'gd-sit-tab' + (sit.id === currentSituationId ? ' active' : '');
    btn.textContent = sit.label;
    btn.addEventListener('click', () => {
      currentSituationId = sit.id;
      renderCallSheet();
    });
    container.appendChild(btn);
  });
}

function renderPlayList() {
  const list = document.getElementById('gd-play-list');
  if (!list) return;

  const ranked = getRankedPlays(currentSituationId);
  list.innerHTML = '';

  ranked.forEach((rec) => {
    const badge = getPlayBadge(rec.name);
    const rate = getSuccessRate(rec.name);
    const result = getPlayResult(rec.name);

    const row = document.createElement('div');
    row.className = 'gd-play-row';

    const left = document.createElement('div');
    left.className = 'gd-play-left';

    const nameEl = document.createElement('span');
    nameEl.className = 'gd-play-name';
    nameEl.textContent = (badge ? badge + ' ' : '') + rec.name;

    const metaEl = document.createElement('span');
    metaEl.className = 'gd-play-meta';
    if (rate !== null) {
      metaEl.textContent = `${rate}% (${result.successes}/${result.attempts})`;
      if (result.successes / result.attempts > 0.66) metaEl.style.color = '#22c55e';
      else if (result.successes / result.attempts < 0.33 && result.attempts >= 3) metaEl.style.color = '#60a5fa';
    } else {
      metaEl.textContent = 'new';
      metaEl.style.color = '#666';
    }

    left.appendChild(nameEl);
    left.appendChild(metaEl);

    const callBtn = document.createElement('button');
    callBtn.className = 'gd-call-btn';
    callBtn.textContent = 'Call';
    callBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      callPlay(rec.name, rec.idx);
    });

    // Tap row → load play in viewer
    row.addEventListener('click', () => {
      if (_selectPlay) _selectPlay(rec.idx);
    });

    row.appendChild(left);
    row.appendChild(callBtn);
    list.appendChild(row);
  });
}

function renderLastCalled() {
  const ticker = document.getElementById('gd-last-called');
  if (!ticker) return;

  const last = getLastCalled(3);
  if (last.length === 0) {
    ticker.innerHTML = '<span style="color:#555;font-size:11px">No plays called yet</span>';
    return;
  }

  ticker.innerHTML = last.map(entry => {
    const icon = entry.result === 'worked' ? '✅' : entry.result === 'didnt' ? '❌' : '⏳';
    return `<span class="gd-ticker-item">${entry.playName} ${icon}</span>`;
  }).join('<span class="gd-ticker-sep">·</span>');
}

function renderResultPrompt() {
  const prompt = document.getElementById('gd-result-prompt');
  if (!prompt) return;

  if (pendingResultIdx === null) {
    prompt.style.display = 'none';
    return;
  }

  const entry = gameState.calledPlays[pendingResultIdx];
  if (!entry || entry.result !== null) {
    pendingResultIdx = null;
    prompt.style.display = 'none';
    return;
  }

  prompt.style.display = 'flex';
  const nameEl = prompt.querySelector('.gd-prompt-name');
  if (nameEl) nameEl.textContent = entry.playName;
}

// ── Play calling logic ────────────────────────────────────────

function callPlay(playName, playIdx) {
  // Load the play in viewer
  if (_selectPlay) _selectPlay(playIdx);

  // Log the call
  const entry = { playName, playIdx, timestamp: Date.now(), result: null };
  gameState.calledPlays.push(entry);

  // Track in half stats
  if (gameState.stats.currentHalf === 1) {
    gameState.stats.half1Plays++;
  } else {
    gameState.stats.half2Plays++;
  }

  pendingResultIdx = gameState.calledPlays.length - 1;
  saveGameState();
  renderCallSheet();
}

function recordResult(result) {
  if (pendingResultIdx === null) return;
  const entry = gameState.calledPlays[pendingResultIdx];
  if (!entry) return;

  entry.result = result;

  if (result !== 'skip') {
    if (!gameState.playResults[entry.playName]) {
      gameState.playResults[entry.playName] = { attempts: 0, successes: 0 };
    }
    if (result !== 'skip') {
      gameState.playResults[entry.playName].attempts++;
      if (result === 'worked') {
        gameState.playResults[entry.playName].successes++;
      }
    }
  }

  pendingResultIdx = null;
  saveGameState();
  renderCallSheet();
}

// ── Game Stats Dashboard ──────────────────────────────────────

function renderStatsDashboard() {
  const panel = document.getElementById('gd-stats-panel');
  if (!panel) return;

  const { stats, calledPlays, playResults } = gameState;
  const totalPlays = calledPlays.filter(p => p.result !== null && p.result !== 'skip').length;
  const worked = calledPlays.filter(p => p.result === 'worked').length;
  const successRate = totalPlays > 0 ? Math.round((worked / totalPlays) * 100) : 0;

  // Hot/cold plays
  const hotPlays = Object.entries(playResults)
    .filter(([, r]) => r.attempts >= 3 && r.successes / r.attempts > 0.66)
    .sort((a, b) => (b[1].successes / b[1].attempts) - (a[1].successes / a[1].attempts));

  const coldPlays = Object.entries(playResults)
    .filter(([, r]) => r.attempts >= 3 && r.successes / r.attempts < 0.33)
    .sort((a, b) => (a[1].successes / a[1].attempts) - (b[1].successes / b[1].attempts));

  panel.innerHTML = `
    <div class="gd-stats-header">
      <span class="gd-stats-title">📊 GAME STATS</span>
      <button class="gd-stats-close panel-close-btn" id="gd-stats-close-btn">✕</button>
    </div>
    <div class="gd-stats-body">
      <div class="gd-stats-section">
        <div class="gd-stats-row">
          <span class="gd-stats-label">Plays Run</span>
          <span class="gd-stats-val">${totalPlays}</span>
        </div>
        <div class="gd-stats-row">
          <span class="gd-stats-label">Success Rate</span>
          <span class="gd-stats-val">${successRate}%</span>
        </div>
        <div class="gd-stats-row">
          <span class="gd-stats-label">Worked / Didn't</span>
          <span class="gd-stats-val">${worked} / ${totalPlays - worked}</span>
        </div>
      </div>

      <div class="gd-stats-section">
        <div class="gd-stats-section-title">SCORE</div>
        <div class="gd-stats-row">
          <span class="gd-stats-label">First Downs</span>
          <div class="gd-stat-stepper">
            <button class="gd-step-btn" data-stat="firstDowns" data-delta="-1">−</button>
            <span class="gd-stat-num" id="stat-firstDowns">${stats.firstDowns}</span>
            <button class="gd-step-btn" data-stat="firstDowns" data-delta="1">+</button>
          </div>
        </div>
        <div class="gd-stats-row">
          <span class="gd-stats-label">Touchdowns</span>
          <div class="gd-stat-stepper">
            <button class="gd-step-btn" data-stat="touchdowns" data-delta="-1">−</button>
            <span class="gd-stat-num" id="stat-touchdowns">${stats.touchdowns}</span>
            <button class="gd-step-btn" data-stat="touchdowns" data-delta="1">+</button>
          </div>
        </div>
        <div class="gd-stats-row">
          <span class="gd-stats-label">Turnovers</span>
          <div class="gd-stat-stepper">
            <button class="gd-step-btn" data-stat="turnovers" data-delta="-1">−</button>
            <span class="gd-stat-num" id="stat-turnovers">${stats.turnovers}</span>
            <button class="gd-step-btn" data-stat="turnovers" data-delta="1">+</button>
          </div>
        </div>
      </div>

      <div class="gd-stats-section">
        <div class="gd-stats-section-title">BY HALF</div>
        <div class="gd-stats-row">
          <span class="gd-stats-label">1st Half Plays</span>
          <span class="gd-stats-val">${stats.half1Plays}</span>
        </div>
        <div class="gd-stats-row">
          <span class="gd-stats-label">2nd Half Plays</span>
          <span class="gd-stats-val">${stats.half2Plays}</span>
        </div>
        <div class="gd-stats-row">
          <span class="gd-stats-label">Current Half</span>
          <div class="gd-stat-stepper">
            <button class="gd-step-btn" data-stat="currentHalf" data-delta="-1">−</button>
            <span class="gd-stat-num" id="stat-currentHalf">${stats.currentHalf}</span>
            <button class="gd-step-btn" data-stat="currentHalf" data-delta="1">+</button>
          </div>
        </div>
      </div>

      ${hotPlays.length > 0 ? `
        <div class="gd-stats-section">
          <div class="gd-stats-section-title">🔥 HOT PLAYS</div>
          ${hotPlays.map(([name, r]) => `
            <div class="gd-stats-row">
              <span class="gd-stats-label">${name}</span>
              <span class="gd-stats-val" style="color:#22c55e">${Math.round(r.successes/r.attempts*100)}% (${r.successes}/${r.attempts})</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${coldPlays.length > 0 ? `
        <div class="gd-stats-section">
          <div class="gd-stats-section-title">❄️ COLD PLAYS</div>
          ${coldPlays.map(([name, r]) => `
            <div class="gd-stats-row">
              <span class="gd-stats-label">${name}</span>
              <span class="gd-stats-val" style="color:#60a5fa">${Math.round(r.successes/r.attempts*100)}% (${r.successes}/${r.attempts})</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="gd-stats-section">
        <div class="gd-stats-section-title">ALL PLAYS</div>
        ${Object.entries(gameState.playResults).length === 0
          ? '<div style="color:#555;font-size:12px;padding:4px 0">No plays tracked yet</div>'
          : Object.entries(gameState.playResults)
              .sort((a, b) => b[1].attempts - a[1].attempts)
              .map(([name, r]) => `
                <div class="gd-stats-row">
                  <span class="gd-stats-label">${getPlayBadge(name)} ${name}</span>
                  <span class="gd-stats-val">${Math.round(r.successes/r.attempts*100)}% (${r.successes}/${r.attempts})</span>
                </div>
              `).join('')
        }
      </div>
    </div>
  `;

  // Wire up stepper buttons
  panel.querySelectorAll('.gd-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const stat = btn.dataset.stat;
      const delta = parseInt(btn.dataset.delta);
      gameState.stats[stat] = Math.max(0, (gameState.stats[stat] || 0) + delta);
      saveGameState();
      // Update just the number
      const numEl = panel.querySelector(`#stat-${stat}`);
      if (numEl) numEl.textContent = gameState.stats[stat];
    });
  });

  const closeBtn = panel.querySelector('#gd-stats-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }
}

// ── New Game ──────────────────────────────────────────────────

function newGame() {
  if (!confirm('Start a new game? This will reset all play tracking and stats.')) return;
  gameState = defaultGameState();
  pendingResultIdx = null;
  saveGameState();
  renderCallSheet();
  // Close stats if open
  const statsPanel = document.getElementById('gd-stats-panel');
  if (statsPanel) statsPanel.style.display = 'none';
}

// ── Panel setup ───────────────────────────────────────────────

export function setupGamedayPanel() {
  const panel = document.getElementById('gameday-panel');
  const backdrop = document.getElementById('gameday-backdrop');
  const closeBtn = document.getElementById('gd-close-btn');
  const statsBtn = document.getElementById('gd-stats-btn');
  const wristbandBtn = document.getElementById('gd-wristband-btn');
  const newGameBtn = document.getElementById('gd-new-game-btn');
  const resultWorked = document.getElementById('gd-result-worked');
  const resultDidnt = document.getElementById('gd-result-didnt');
  const resultSkip = document.getElementById('gd-result-skip');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeGamedayPanel);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeGamedayPanel);
  }

  if (statsBtn) {
    statsBtn.addEventListener('click', () => {
      const statsPanel = document.getElementById('gd-stats-panel');
      if (statsPanel) {
        statsPanel.style.display = statsPanel.style.display === 'none' ? 'block' : 'none';
        if (statsPanel.style.display === 'block') renderStatsDashboard();
      }
    });
  }

  if (wristbandBtn) {
    wristbandBtn.addEventListener('click', () => {
      import('./wristband.js').then(mod => mod.generateWristband());
    });
  }

  if (newGameBtn) {
    newGameBtn.addEventListener('click', newGame);
  }

  if (resultWorked) {
    resultWorked.addEventListener('click', () => recordResult('worked'));
  }
  if (resultDidnt) {
    resultDidnt.addEventListener('click', () => recordResult('didnt'));
  }
  if (resultSkip) {
    resultSkip.addEventListener('click', () => recordResult('skip'));
  }
}

export function openGamedayPanel() {
  const panel = document.getElementById('gameday-panel');
  const backdrop = document.getElementById('gameday-backdrop');
  if (panel) panel.classList.add('open');
  if (backdrop) backdrop.classList.add('visible');
  renderCallSheet();
}

export function closeGamedayPanel() {
  const panel = document.getElementById('gameday-panel');
  const backdrop = document.getElementById('gameday-backdrop');
  if (panel) panel.classList.remove('open');
  if (backdrop) backdrop.classList.remove('visible');
}
