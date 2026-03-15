// modules/touch.js — Touch/swipe and keyboard handlers

import { state } from './state.js';
import { togglePlayPause, replay } from './animation.js';

let _selectPlay = null;
export function setSelectPlayFn(fn) { _selectPlay = fn; }

let touchStartX = 0, touchStartY = 0, touchStartTime = 0;

export function setupTouch() {
  const fc = document.getElementById('field-container');
  fc.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  fc.addEventListener('touchend', e => {
    if (state.editorActive) return; // disable swipe navigation in edit mode
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    if (dt < 400 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && state.currentPlayIdx < PLAYS.length - 1) {
        if (_selectPlay) _selectPlay(state.currentPlayIdx + 1);
      } else if (dx > 0 && state.currentPlayIdx > 0) {
        if (_selectPlay) _selectPlay(state.currentPlayIdx - 1);
      }
    }
  }, { passive: true });
}

export function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if (state.editorActive) return; // disable shortcuts in edit mode
    if (e.key === 'ArrowRight' && state.currentPlayIdx < PLAYS.length - 1) {
      if (_selectPlay) _selectPlay(state.currentPlayIdx + 1);
    } else if (e.key === 'ArrowLeft' && state.currentPlayIdx > 0) {
      if (_selectPlay) _selectPlay(state.currentPlayIdx - 1);
    } else if (e.key === ' ') {
      e.preventDefault(); togglePlayPause();
    } else if (e.key === 'r' || e.key === 'R') {
      replay();
    }
  });
}
