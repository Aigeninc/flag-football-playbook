// modules/touch.js — Touch/swipe and keyboard handlers

import { state } from './state.js';
import { togglePlayPause, replay } from './animation.js';

let _selectPlay = null;
let _selectDefPlay = null;
export function setSelectPlayFn(fn) { _selectPlay = fn; }
export function setSelectDefPlayFn(fn) { _selectDefPlay = fn; }

let touchStartX = 0, touchStartY = 0, touchStartTime = 0;

export function setupTouch() {
  const fc = document.getElementById('field-container');
  fc.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  fc.addEventListener('touchend', e => {
    if (state.editorActive) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    if (dt < 400 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (state.defenseViewActive) {
        // Navigate defense plays
        if (dx < 0 && state.currentDefPlayIdx < DEFENSE_PLAYS.length - 1) {
          if (_selectDefPlay) _selectDefPlay(state.currentDefPlayIdx + 1);
        } else if (dx > 0 && state.currentDefPlayIdx > 0) {
          if (_selectDefPlay) _selectDefPlay(state.currentDefPlayIdx - 1);
        }
      } else {
        if (dx < 0 && state.currentPlayIdx < PLAYS.length - 1) {
          if (_selectPlay) _selectPlay(state.currentPlayIdx + 1);
        } else if (dx > 0 && state.currentPlayIdx > 0) {
          if (_selectPlay) _selectPlay(state.currentPlayIdx - 1);
        }
      }
    }
  }, { passive: true });
}

export function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if (state.editorActive) return;
    if (e.key === 'ArrowRight') {
      if (state.defenseViewActive) {
        if (state.currentDefPlayIdx < DEFENSE_PLAYS.length - 1 && _selectDefPlay)
          _selectDefPlay(state.currentDefPlayIdx + 1);
      } else if (state.currentPlayIdx < PLAYS.length - 1) {
        if (_selectPlay) _selectPlay(state.currentPlayIdx + 1);
      }
    } else if (e.key === 'ArrowLeft') {
      if (state.defenseViewActive) {
        if (state.currentDefPlayIdx > 0 && _selectDefPlay)
          _selectDefPlay(state.currentDefPlayIdx - 1);
      } else if (state.currentPlayIdx > 0) {
        if (_selectPlay) _selectPlay(state.currentPlayIdx - 1);
      }
    } else if (e.key === ' ') {
      e.preventDefault(); togglePlayPause();
    } else if (e.key === 'r' || e.key === 'R') {
      replay();
    }
  });
}
