// modules/animation.js — Animation loop, timing, play/pause/replay

import {
  state, TOTAL_TIME,
  hasMotion, getAnimStart,
} from './state.js';
import { drawFrame } from './renderer.js';

// updateTimer callback registered from app.js (to avoid circular dep)
let _updateTimer = null;
export function setUpdateTimerFn(fn) { _updateTimer = fn; }

// ── Animation loop ────────────────────────────────────────────

function doUpdateTimer() { if (_updateTimer) _updateTimer(); }

function animateLoop(ts) {
  if (!state.playing) { state.animId = null; return; }
  if (state.lastFrameTs === null) state.lastFrameTs = ts;
  const dt = ((ts - state.lastFrameTs) / 1000) * state.speed;
  state.lastFrameTs = ts;
  state.animTime += dt;

  if (state.animTime >= TOTAL_TIME) {
    state.animTime = TOTAL_TIME;
    state.playing = false;
    updatePlayPauseBtn();
  }

  drawFrame();
  doUpdateTimer();
  state.animId = requestAnimationFrame(animateLoop);
}

// ── Public API ────────────────────────────────────────────────

export function startAnimation() {
  state.playing = true;
  state.lastFrameTs = null;
  updatePlayPauseBtn();
  state.animId = requestAnimationFrame(animateLoop);
}

export function pauseAnimation() {
  state.playing = false;
  state.lastFrameTs = null;
  updatePlayPauseBtn();
}

export function togglePlayPause() {
  if (state.playing) {
    pauseAnimation();
  } else {
    if (state.animTime >= TOTAL_TIME) {
      const play = PLAYS[state.currentPlayIdx];
      state.animTime = getAnimStart(play);
    }
    startAnimation();
  }
}

export function replay() {
  const play = PLAYS[state.currentPlayIdx];
  state.animTime = getAnimStart(play);
  drawFrame();
  doUpdateTimer();
  startAnimation();
}

function updatePlayPauseBtn() {
  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = state.playing ? '⏸' : '▶';
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

  if (state.animTime < -(0.6) && hasMotion(play)) {  // SET_PAUSE = 0.6
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

  document.querySelectorAll('.read-marker').forEach(m => m.remove());
  const bar = document.getElementById('timer-bar');
  if (!bar) return;
  for (const [readStr, time] of Object.entries(play.timing)) {
    const readNum = parseInt(readStr);
    const marker = document.createElement('div');
    marker.className = 'read-marker' + (state.animTime >= time ? ' visible' : '');
    marker.textContent = '①②③④'[readNum - 1] || readNum;
    marker.style.left = (time / TOTAL_TIME * 100) + '%';
    bar.appendChild(marker);
  }
}
