// modules/coach.js — Coach call sheet engine

import { state } from './state.js';
import { drawFrame } from './renderer.js';

// selectPlay callback registered from app.js
let _selectPlay = null;
export function setSelectPlayFn(fn) { _selectPlay = fn; }

const PLAY_SITUATIONS = {
  'Mesh':             { vs: { man: 95, zone: 60, rush: 70, idk: 75 }, down: { 1: 80, 2: 85, 3: 70, 4: 60 }, field: { open: 80, mid: 75, rz: 65, nrz: 70 }, why: 'Crossers beat man, natural picks' },
  'Flood Fake':       { vs: { man: 70, zone: 85, rush: 50, idk: 65 }, down: { 1: 75, 2: 80, 3: 60, 4: 50 }, field: { open: 85, mid: 75, rz: 60, nrz: 55 }, why: 'Looks like Flood Right → post burns deep' },
  'Flood Right':      { vs: { man: 65, zone: 90, rush: 60, idk: 75 }, down: { 1: 90, 2: 80, 3: 65, 4: 55 }, field: { open: 85, mid: 80, rz: 70, nrz: 65 }, why: '3 levels beat zone, safe 1st down call' },
  'Reverse':          { vs: { man: 80, zone: 75, rush: 40, idk: 70 }, down: { 1: 85, 2: 70, 3: 50, 4: 40 }, field: { open: 85, mid: 70, rz: 55, nrz: 10 }, why: 'Misdirection — defense chases wrong way' },
  'RPO Slant':        { vs: { man: 70, zone: 65, rush: 45, idk: 65 }, down: { 1: 80, 2: 75, 3: 55, 4: 45 }, field: { open: 75, mid: 70, rz: 60, nrz: 10 }, why: 'Run/pass option, keeps D guessing' },
  'Quick Slants NRZ': { vs: { man: 85, zone: 70, rush: 80, idk: 80 }, down: { 1: 65, 2: 70, 3: 85, 4: 80 }, field: { open: 60, mid: 75, rz: 85, nrz: 95 }, why: 'Fast release, best NRZ play' },
  'Flat-Wheel':       { vs: { man: 80, zone: 60, rush: 50, idk: 65 }, down: { 1: 60, 2: 65, 3: 75, 4: 70 }, field: { open: 70, mid: 65, rz: 85, nrz: 80 }, why: 'Big play — wheel beats flat coverage' },
  'Braelyn Lateral':  { vs: { man: 85, zone: 70, rush: 30, idk: 60 }, down: { 1: 50, 2: 55, 3: 60, 4: 70 }, field: { open: 65, mid: 70, rz: 75, nrz: 70 }, why: 'Trick play — QB becomes receiver' },
  'Flood Left':       { vs: { man: 65, zone: 85, rush: 60, idk: 75 }, down: { 1: 85, 2: 80, 3: 65, 4: 55 }, field: { open: 80, mid: 80, rz: 70, nrz: 65 }, why: 'Mirror of Flood Right — switch sides' },
  'Hitch & Go':       { vs: { man: 90, zone: 55, rush: 45, idk: 65 }, down: { 1: 55, 2: 65, 3: 75, 4: 80 }, field: { open: 80, mid: 70, rz: 55, nrz: 50 }, why: 'DB bites hitch → Greyson gone deep' },
  'Screen':           { vs: { man: 60, zone: 55, rush: 95, idk: 65 }, down: { 1: 60, 2: 70, 3: 55, 4: 45 }, field: { open: 75, mid: 65, rz: 50, nrz: 40 }, why: 'Punish aggressive rush' },
  'Reverse Fake':     { vs: { man: 80, zone: 70, rush: 50, idk: 70 }, down: { 1: 70, 2: 75, 3: 65, 4: 55 }, field: { open: 80, mid: 75, rz: 60, nrz: 55 }, why: 'Looks like Reverse → hit vacated side' },
  'Fade':             { vs: { man: 75, zone: 60, rush: 55, idk: 65 }, down: { 1: 45, 2: 50, 3: 65, 4: 85 }, field: { open: 50, mid: 55, rz: 90, nrz: 95 }, why: '50/50 ball to Marshall — goal line TD' },
  'Mesh Wheel':       { vs: { man: 90, zone: 55, rush: 60, idk: 70 }, down: { 1: 60, 2: 70, 3: 75, 4: 70 }, field: { open: 80, mid: 70, rz: 60, nrz: 55 }, why: 'Looks like Mesh → Cooper wheels deep' },
  'Slant & Go':       { vs: { man: 85, zone: 50, rush: 60, idk: 65 }, down: { 1: 55, 2: 65, 3: 80, 4: 75 }, field: { open: 80, mid: 70, rz: 55, nrz: 50 }, why: 'Looks like Slants → Greyson goes deep' },
  'Screen Fake Post': { vs: { man: 65, zone: 60, rush: 85, idk: 65 }, down: { 1: 55, 2: 60, 3: 70, 4: 75 }, field: { open: 80, mid: 70, rz: 55, nrz: 50 }, why: 'Looks like Screen → Greyson post deep' },
};

export function getPlayScore(playName) {
  const sit = PLAY_SITUATIONS[playName];
  if (!sit) return 0;
  let score = 50;
  if (state.situation.defense && sit.vs[state.situation.defense]) score += sit.vs[state.situation.defense] - 50;
  if (state.situation.down && sit.down[state.situation.down]) score += (sit.down[state.situation.down] - 50) * 0.7;
  if (state.situation.field && sit.field[state.situation.field]) score += (sit.field[state.situation.field] - 50) * 0.8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// P0-2 fix: guard flag so listeners are only added once across all panel toggles
let _coachListenersInit = false;

export function setupCoachPanel() {
  if (!_coachListenersInit) {
    document.querySelectorAll('.sit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.sit, value = btn.dataset.val;
        state.situation[category] = state.situation[category] === value ? null : value;
        document.querySelectorAll(`.sit-btn[data-sit="${category}"]`).forEach(b => b.classList.remove('active'));
        if (state.situation[category]) btn.classList.add('active');
        updateCoachRecs();
      });
    });
    _coachListenersInit = true;
  }

  // Sync button active states to current situation on every open
  document.querySelectorAll('.sit-btn').forEach(btn => {
    btn.classList.toggle('active', state.situation[btn.dataset.sit] === btn.dataset.val);
  });
  updateCoachRecs();
}

export function updateCoachRecs() {
  const recsDiv = document.getElementById('coach-recs');
  if (!recsDiv) return;
  recsDiv.innerHTML = '';

  if (!state.situation.down && !state.situation.field && !state.situation.defense) {
    recsDiv.innerHTML = '<div style="color:#888;font-size:11px;text-align:center;padding:8px">Tap situation above to get play recommendations</div>';
    return;
  }

  const scored = PLAYS.map((play, idx) => ({
    name: play.name, idx,
    score: getPlayScore(play.name),
    why: PLAY_SITUATIONS[play.name] ? PLAY_SITUATIONS[play.name].why : '',
  })).sort((a, b) => b.score - a.score);

  scored.slice(0, 5).forEach((rec, rank) => {
    const div = document.createElement('div');
    div.className = 'rec-play';
    const tagClass = rank === 0 ? 'best' : rank < 3 ? 'good' : 'ok';
    const tagText = rank === 0 ? '★ BEST' : rank < 3 ? 'GOOD' : 'OK';
    div.innerHTML = `<div><span class="rec-name">${rec.name}</span><span class="rec-why">${rec.why}</span></div><span class="rec-tag ${tagClass}">${tagText} ${rec.score}</span>`;
    div.addEventListener('click', () => {
      if (_selectPlay) _selectPlay(rec.idx);
      if (state.queueMode) {
        state.queue.push({ playIdx: rec.idx, result: null });
        state.queuePos = state.queue.length - 1;
      }
    });
    recsDiv.appendChild(div);
  });
}
