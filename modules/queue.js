// modules/queue.js — Play queue state and rendering

import { state, saveQueueState } from './state.js';

// selectPlay callback registered from app.js
let _selectPlay = null;
export function setSelectPlayFn(fn) { _selectPlay = fn; }
// buildPlaySelector callback
let _buildPlaySelector = null;
export function setBuildPlaySelectorFn(fn) { _buildPlaySelector = fn; }

export function markPlay(result) {
  if (!state.queue.length) return;
  state.queue[state.queuePos].result = result;
  saveQueueState();
  renderQueue();
  if (state.queuePos < state.queue.length - 1) advanceQueue(1);
}

export function advanceQueue(dir) {
  if (!state.queue.length) return;
  state.queuePos = Math.max(0, Math.min(state.queue.length - 1, state.queuePos + dir));
  if (_selectPlay) _selectPlay(state.queue[state.queuePos].playIdx);
  saveQueueState();
  renderQueue();
}

export function renderQueue() {
  const bar = document.getElementById('queue-bar');
  if (!bar) return;
  if (!state.queueMode) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';

  const playsDiv = document.getElementById('queue-plays');
  playsDiv.innerHTML = '';

  if (!state.queue.length) {
    document.getElementById('queue-status').textContent = 'QUEUE: Tap plays to add ↑';
    document.getElementById('queue-score').textContent = '';
    return;
  }

  const total = state.queue.length;
  const played = state.queue.filter(q => q.result !== null).length;
  const successes = state.queue.filter(q => q.result === 'success').length;
  const fails = state.queue.filter(q => q.result === 'fail').length;
  document.getElementById('queue-status').textContent = `PLAY ${state.queuePos + 1} of ${total}`;
  document.getElementById('queue-score').textContent = played > 0
    ? `✅${successes} ❌${fails} (${Math.round(successes / played * 100)}%)`
    : '';

  state.queue.forEach((q, i) => {
    const chip = document.createElement('div');
    chip.className = 'queue-chip' +
      (i === state.queuePos ? ' active' : '') +
      (q.result === 'success' ? ' success' : '') +
      (q.result === 'fail' ? ' fail' : '');
    const name = PLAYS[q.playIdx].name;
    const resultIcon = q.result === 'success' ? ' ✅' : q.result === 'fail' ? ' ❌' : '';
    chip.innerHTML = `<span>${i + 1}. ${name}</span><span class="chip-result">${resultIcon}</span>`;
    chip.addEventListener('click', () => {
      state.queuePos = i;
      if (_selectPlay) _selectPlay(state.queue[i].playIdx);
      renderQueue();
    });
    playsDiv.appendChild(chip);
  });

  const activeChip = playsDiv.querySelector('.queue-chip.active');
  if (activeChip) activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}
