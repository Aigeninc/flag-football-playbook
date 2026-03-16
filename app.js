// app.js — Orchestrator: wires all modules together
// PLAYS and PLAYERS are globals loaded from plays.js (regular script)

import {
  state, getAnimStart, loadQueueState, loadPreferences, loadCustomPlays, loadSubstitutions,
  loadActivePlaySet,
} from './modules/state.js';

import {
  initCanvas, resizeCanvas, drawFrame,
} from './modules/renderer.js';

import {
  startAnimation, updateTimer, togglePlayPause, replay,
  setUpdateTimerFn,
} from './modules/animation.js';

import {
  buildPlaySelector, buildPlayerFilter, buildControls, updateInfoPanel,
  setSelectPlayFn as uiSetSelectPlay,
  setSelectDefPlayFn as uiSetSelectDefPlay,
  setupDefenseToggle, updateDefenseToggleBtn,
} from './modules/ui.js';

import {
  setupCoachPanel, updateCoachRecs,
  setSelectPlayFn as coachSetSelectPlay,
} from './modules/coach.js';

import {
  renderQueue, markPlay, advanceQueue,
  setSelectPlayFn as queueSetSelectPlay,
  setBuildPlaySelectorFn,
} from './modules/queue.js';

import {
  setupTouch, setupKeyboard,
  setSelectPlayFn as touchSetSelectPlay,
  setSelectDefPlayFn as touchSetSelectDefPlay,
} from './modules/touch.js';

import {
  buildEditToolbar, setupEditorCanvasEvents,
  setEditorCallbacks, handleEditToggle,
} from './modules/editor.js';

import {
  initRoster, setSelectPlayFn as rosterSetSelectPlay,
} from './modules/roster.js';

import {
  setupGamedayPanel, openGamedayPanel, closeGamedayPanel,
  setSelectPlayFn as gamedaySetSelectPlay,
} from './modules/gameday.js';

// ── selectPlay — central navigation function ──────────────────

function selectPlay(idx) {
  state.currentPlayIdx = idx;
  state.animTime = getAnimStart(PLAYS[idx]);
  state.playing = false;
  state.highlightPlayer = null;
  state.lastFrameTs = null;

  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = '▶';

  buildPlaySelector();
  buildPlayerFilter();
  updateInfoPanel();
  drawFrame();
  updateTimer();

  const btns = document.querySelectorAll('.play-btn');
  if (btns[idx]) btns[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

// ── selectDefPlay — defense play navigation ───────────────────

function selectDefPlay(idx) {
  state.currentDefPlayIdx = idx;
  state.animTime = 0;
  state.playing = false;
  state.lastFrameTs = null;

  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = '▶';

  buildPlaySelector();
  updateInfoPanel();
  drawFrame();
  updateTimer();

  // Scroll the selected defense button into view
  const btns = document.querySelectorAll('.def-play-btn');
  if (btns[idx]) btns[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

// ── toggleDefenseView ─────────────────────────────────────────

function toggleDefenseView() {
  state.defenseViewActive = !state.defenseViewActive;

  // Reset animation
  state.animTime = 0;
  state.playing = false;
  state.highlightPlayer = null;
  state.lastFrameTs = null;

  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = '▶';

  updateDefenseToggleBtn();
  buildPlaySelector();

  if (state.defenseViewActive) {
    // Hide player filter in defense mode (defenders aren't named roster players)
    document.getElementById('player-filter').style.display = 'none';
  } else {
    document.getElementById('player-filter').style.display = '';
    buildPlayerFilter();
  }

  updateInfoPanel();
  drawFrame();
  updateTimer();
  setTimeout(() => startAnimation(), 400);
}

// ── Coach & Queue panel accordion (mutually exclusive) ────────

function setupPanelToggles() {
  const coachBtn = document.getElementById('btn-coach');
  const queueBtn = document.getElementById('btn-queue');
  const coachPanel = document.getElementById('coach-panel');
  const queueBar = document.getElementById('queue-bar');

  coachBtn.addEventListener('click', () => {
    state.coachMode = !state.coachMode;
    if (state.coachMode && state.queueMode) {
      state.queueMode = false;
      queueBtn.style.opacity = '0.4';
      queueBar.style.display = 'none';
    }
    coachBtn.style.opacity = state.coachMode ? '1' : '0.4';
    coachPanel.style.display = state.coachMode ? 'block' : 'none';
    if (state.coachMode) setupCoachPanel();
  });

  queueBtn.addEventListener('click', () => {
    state.queueMode = !state.queueMode;
    if (state.queueMode && state.coachMode) {
      state.coachMode = false;
      coachBtn.style.opacity = '0.4';
      coachPanel.style.display = 'none';
    }
    queueBtn.style.opacity = state.queueMode ? '1' : '0.4';
    renderQueue();
    buildPlaySelector();
  });

  document.getElementById('queue-success').addEventListener('click', () => markPlay('success'));
  document.getElementById('queue-fail').addEventListener('click', () => markPlay('fail'));
  document.getElementById('queue-next').addEventListener('click', () => advanceQueue(1));
  document.getElementById('queue-prev').addEventListener('click', () => advanceQueue(-1));
  document.getElementById('queue-clear').addEventListener('click', () => {
    state.queue = [];
    state.queuePos = 0;
    try { localStorage.removeItem('playbook:queueState'); } catch (e) {}
    renderQueue();
  });
}

// ── Game Day button ───────────────────────────────────────────

function setupGamedayButton() {
  const gamedayBtn = document.getElementById('btn-gameday');
  if (!gamedayBtn) return;
  gamedayBtn.addEventListener('click', () => {
    const panel = document.getElementById('gameday-panel');
    if (panel && panel.classList.contains('open')) {
      closeGamedayPanel();
      gamedayBtn.style.opacity = '0.4';
    } else {
      openGamedayPanel();
      gamedayBtn.style.opacity = '1';
    }
  });
}

// ── Edit button ───────────────────────────────────────────────

function setupEditButton() {
  const editBtn = document.getElementById('btn-edit');
  if (!editBtn) return;
  editBtn.addEventListener('click', () => {
    handleEditToggle();
  });
}

// ── Init ──────────────────────────────────────────────────────

function init() {
  // Load saved preferences before rendering
  loadPreferences();
  loadQueueState();
  loadCustomPlays(); // Load custom plays from localStorage into PLAYS array
  loadSubstitutions(); // Load persisted per-play subs
  loadActivePlaySet(); // Load game day play filter

  // Wire up selectPlay callbacks in each module
  uiSetSelectPlay(selectPlay);
  uiSetSelectDefPlay(selectDefPlay);
  coachSetSelectPlay(selectPlay);
  queueSetSelectPlay(selectPlay);
  touchSetSelectPlay(selectPlay);
  touchSetSelectDefPlay(selectDefPlay);
  rosterSetSelectPlay(selectPlay);
  gamedaySetSelectPlay(selectPlay);
  setBuildPlaySelectorFn(buildPlaySelector);

  // Wire up defense toggle
  setupDefenseToggle(toggleDefenseView);

  // Pass updateTimer to animation loop
  setUpdateTimerFn(updateTimer);

  // Restore sunlight button opacity if mode was loaded
  if (state.sunlightMode) {
    const sunBtn = document.getElementById('btn-sun');
    if (sunBtn) sunBtn.style.opacity = '1';
  }

  initCanvas();

  // Wire up editor callbacks
  setEditorCallbacks(buildPlaySelector, updateInfoPanel, selectPlay);
  buildEditToolbar();
  setupEditorCanvasEvents(document.getElementById('field-canvas'));
  setupEditButton();

  buildPlaySelector();
  buildPlayerFilter();
  buildControls();
  updateInfoPanel();
  updateTimer();
  setupTouch();
  setupKeyboard();
  setupPanelToggles();
  initRoster(); // Phase 3: initialize roster/lineup panel
  setupGamedayPanel(); // Phase 4: initialize game day call sheet
  setupGamedayButton(); // Phase 4: wire up 🎯 button

  window.addEventListener('resize', () => {
    resizeCanvas();
    updateTimer();
  });

  // Start from pre-snap and auto-play
  state.animTime = getAnimStart(PLAYS[state.currentPlayIdx]);
  drawFrame();
  updateTimer();
  setTimeout(() => startAnimation(), 500);
}

// Modules are always deferred; DOM is ready by the time this runs
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
