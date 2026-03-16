// modules/animation.js — Animation loop, timing, play/pause/replay

import {
  state, TOTAL_TIME, SET_PAUSE,
  hasMotion, getAnimStart,
} from './state.js';
import { drawFrame } from './renderer.js';

// updateTimer callback registered from app.js (to avoid circular dep)
let _updateTimer = null;
export function setUpdateTimerFn(fn) { _updateTimer = fn; }

// ── Animation loop ────────────────────────────────────────────

function doUpdateTimer() { if (_updateTimer) _updateTimer(); }

function animateLoop(ts) {
  if (!state.playing) {
    // P0-1 fix: clear animId and return, frame was already canceled by pauseAnimation
    state.animId = null;
    return;
  }
  if (state.lastFrameTs === null) state.lastFrameTs = ts;
  const dt = ((ts - state.lastFrameTs) / 1000) * state.speed;
  state.lastFrameTs = ts;
  state.animTime += dt;

  if (state.animTime >= TOTAL_TIME) {
    state.animTime = TOTAL_TIME;
    state.playing = false;
    state.animId = null;           // P0-1 fix: clear before stop
    updatePlayPauseBtn();
    drawFrame();
    doUpdateTimer();
    return;                        // P0-1 fix: do NOT re-queue another RAF
  }

  drawFrame();
  doUpdateTimer();
  state.animId = requestAnimationFrame(animateLoop);
}

// ── Public API ────────────────────────────────────────────────

export function startAnimation() {
  // P0-1 fix: cancel any in-flight RAF before starting a new loop
  if (state.animId != null) {
    cancelAnimationFrame(state.animId);
    state.animId = null;
  }
  state.playing = true;
  state.lastFrameTs = null;
  updatePlayPauseBtn();
  state.animId = requestAnimationFrame(animateLoop);
}

export function pauseAnimation() {
  state.playing = false;
  state.lastFrameTs = null;
  // P0-1 fix: cancel the outstanding RAF immediately
  if (state.animId != null) {
    cancelAnimationFrame(state.animId);
    state.animId = null;
  }
  updatePlayPauseBtn();
}

export function togglePlayPause() {
  if (state.playing) {
    pauseAnimation();
  } else {
    if (state.animTime >= TOTAL_TIME) {
      state.animTime = state.defenseViewActive ? 0 : getAnimStart(PLAYS[state.currentPlayIdx]);
    }
    startAnimation();
  }
}

export function replay() {
  // Defense plays have no pre-snap motion — always start at 0
  if (state.defenseViewActive) {
    state.animTime = 0;
  } else {
    const play = PLAYS[state.currentPlayIdx];
    state.animTime = getAnimStart(play);
  }
  drawFrame();
  doUpdateTimer();
  startAnimation();
}

function updatePlayPauseBtn() {
  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = state.playing ? '⏸' : '▶';
}

// ── Read Marker management (P1-1 fix) ────────────────────────
// Markers are created once per play change, not every animation frame.

let _readMarkerEls = [];
let _readMarkerPlayIdx = -1;

/** Call when the current play changes to rebuild marker elements. */
export function resetReadMarkers() {
  const bar = document.getElementById('timer-bar');
  if (!bar) return;

  // Remove old markers
  _readMarkerEls.forEach(m => m.remove());
  _readMarkerEls = [];

  const play = PLAYS[state.currentPlayIdx];
  if (!play || !play.timing) return;

  for (const [readStr, time] of Object.entries(play.timing)) {
    const readNum = parseInt(readStr);
    const marker = document.createElement('div');
    marker.className = 'read-marker';
    marker.textContent = '①②③④'[readNum - 1] || readNum;
    marker.dataset.time = time;
    marker.style.left = (time / TOTAL_TIME * 100) + '%';
    bar.appendChild(marker);
    _readMarkerEls.push(marker);
  }

  _readMarkerPlayIdx = state.currentPlayIdx;
}

// ── Timer ─────────────────────────────────────────────────────

export function updateTimer() {
  const play = PLAYS[state.currentPlayIdx];
  const needle = document.getElementById('timer-needle');
  const timeLabel = document.getElementById('timer-time');
  if (!needle || !timeLabel) return;

  const postSnapTime = Math.max(0, state.animTime);
  const pct = Math.min(postSnapTime / TOTAL_TIME, 1) * 100;
  needle.style.left = pct + '%';

  if (state.animTime < -(SET_PAUSE) && hasMotion(play)) {
    timeLabel.textContent = 'MOTION'; timeLabel.style.color = '#f59e0b';
  } else if (state.animTime < 0 && hasMotion(play)) {
    timeLabel.textContent = 'SET'; timeLabel.style.color = '#22c55e';
  } else {
    timeLabel.textContent = postSnapTime.toFixed(1) + 's';
    if (postSnapTime < 2) timeLabel.style.color = '#22c55e';
    else if (postSnapTime < 4) timeLabel.style.color = '#eab308';
    else if (postSnapTime < 6) timeLabel.style.color = '#f97316';
    else timeLabel.style.color = '#ef4444';
  }

  // P1-1 fix: if play changed since last setup, rebuild markers first
  if (state.currentPlayIdx !== _readMarkerPlayIdx) {
    resetReadMarkers();
  }

  // P1-1 fix: update visibility only — no DOM create/destroy per frame
  _readMarkerEls.forEach(marker => {
    const time = parseFloat(marker.dataset.time);
    if (state.animTime >= time) {
      marker.classList.add('visible');
    } else {
      marker.classList.remove('visible');
    }
  });
}
