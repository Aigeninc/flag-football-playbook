// modules/renderer.js — Canvas rendering engine
// PLAYS and PLAYERS are globals from plays.js

import {
  state, FIELD_X_MIN, FIELD_X_MAX, FIELD_Y_MIN, FIELD_Y_MAX,
  TOTAL_TIME, ANIM_ROUTE_DURATION, PRE_SNAP_MOTION, SET_PAUSE, PRE_SNAP_TOTAL,
  hasMotion, getAnimStart, getDisplayName, getActiveSubs,
} from './state.js';

let canvas, ctx;
export let fieldRect = { x: 0, y: 0, w: 0, h: 0 };

const BALL_TRANS = { snap: 0.3, throw: 0.5, handoff: 0.25, lateral: 0.3, carry: 0 };

const ZONE_POSITIONS = {
  CB_L:     { start: [6, 5],    zone: [5, 8] },
  CB_R:     { start: [29, 5],   zone: [30, 8] },
  MLB:      { start: [17.5, 7], zone: [17.5, 6] },
  SAFETY_L: { start: [10, 13],  zone: [10, 12] },
  SAFETY_R: { start: [28, 12],  zone: [25, 12] },
};
const ZONE_ROLES = ['CB_L', 'MLB', 'CB_R', 'SAFETY_L', 'SAFETY_R'];

// ── Coordinate mapping ────────────────────────────────────────

export function fieldToCanvas(fx, fy) {
  const cx = fieldRect.x + ((fx - FIELD_X_MIN) / (FIELD_X_MAX - FIELD_X_MIN)) * fieldRect.w;
  const cy = fieldRect.y + ((FIELD_Y_MAX - fy) / (FIELD_Y_MAX - FIELD_Y_MIN)) * fieldRect.h;
  return [cx, cy];
}

export function canvasToField(cx, cy) {
  const fx = FIELD_X_MIN + ((cx - fieldRect.x) / fieldRect.w) * (FIELD_X_MAX - FIELD_X_MIN);
  const fy = FIELD_Y_MAX - ((cy - fieldRect.y) / fieldRect.h) * (FIELD_Y_MAX - FIELD_Y_MIN);
  return [fx, fy];
}

export function scaleLen(yards) {
  return (yards / (FIELD_X_MAX - FIELD_X_MIN)) * fieldRect.w;
}

// ── Canvas setup ──────────────────────────────────────────────

export function initCanvas() {
  canvas = document.getElementById('field-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
}

export function resizeCanvas() {
  const container = document.getElementById('field-container');
  const dpr = window.devicePixelRatio || 1;
  const w = container.clientWidth;
  const h = container.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const mx = 16, my = 8;
  fieldRect = { x: mx, y: my, w: w - mx * 2, h: h - my * 2 };
  drawFrame();
}

// ── Main frame ────────────────────────────────────────────────

export function drawFrame() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, w, h);

  if (state.editorActive && state.editorPlay) {
    // Edit mode — draw static editor view
    const play = state.editorPlay;
    drawField(play);
    drawDefense(play);
    drawEditRoutes(play);
    drawEditPlayers(play);
    drawEditWaypointHandles(play);
    drawEditSelectionRing();
    drawEditHint();
    return;
  }

  const play = PLAYS[state.currentPlayIdx];
  drawField(play);
  drawDefense(play);
  drawMotions(play);
  drawRoutes(play);
  drawPlayers(play);
  drawBall(play);
  drawSpecialLabels(play);
  drawSnapIndicator(play);
}

// ── Edit Mode Rendering ───────────────────────────────────────

function drawEditRoutes(play) {
  for (const [name, pd] of Object.entries(play.players)) {
    const isSelected = state.editorSelectedPlayer === name;
    const color = getPlayerColor(name);
    const alpha = (state.editorSelectedPlayer && !isSelected) ? 0.45 : 1.0;
    if (!pd.route || !pd.route.length) continue;

    ctx.globalAlpha = alpha;
    const fullPath = [pd.pos, ...pd.route];
    ctx.beginPath();
    const [sx, sy] = fieldToCanvas(fullPath[0][0], fullPath[0][1]);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < fullPath.length; i++) {
      const [cx2, cy2] = fieldToCanvas(fullPath[i][0], fullPath[i][1]);
      ctx.lineTo(cx2, cy2);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = pd.dashed ? 3 : 4.5;
    if (pd.dashed) ctx.setLineDash([8, 5]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead
    if (fullPath.length >= 2) {
      const last = fullPath[fullPath.length - 1];
      const prev = fullPath[fullPath.length - 2];
      const [lx, ly] = fieldToCanvas(last[0], last[1]);
      const [px, py] = fieldToCanvas(prev[0], prev[1]);
      drawArrowhead(lx, ly, Math.atan2(ly - py, lx - px), color, 12);
    }

    // Route label at end
    if (pd.label) {
      const last = pd.route[pd.route.length - 1];
      const [lx, ly] = fieldToCanvas(last[0], last[1]);
      drawLabel(lx + 8, ly - 8, pd.label, color, alpha);
    }

    ctx.globalAlpha = 1;
  }
}

function drawEditPlayers(play) {
  for (const [name, pd] of Object.entries(play.players)) {
    const isSelected = state.editorSelectedPlayer === name;
    const color = getPlayerColor(name);
    const [cx, cy] = fieldToCanvas(pd.pos[0], pd.pos[1]);
    const r = 15;

    ctx.globalAlpha = (state.editorSelectedPlayer && !isSelected) ? 0.5 : 1;

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();

    const tc = (color === '#2dd4bf' || color === '#f59e0b' || color === '#f5d742') ? '#000' : '#fff';
    ctx.fillStyle = tc;
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name.substring(0, 7), cx, cy);

    // Read order badge
    if (pd.read > 0) {
      const syms = ['①', '②', '③', '④'];
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx - 14, cy + 14, 9, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#000'; ctx.font = 'bold 9px system-ui';
      ctx.fillText(syms[pd.read - 1] || pd.read, cx - 14, cy + 14);
    }

    ctx.globalAlpha = 1;
  }
}

function drawEditWaypointHandles(play) {
  for (const [name, pd] of Object.entries(play.players)) {
    if (!pd.route || !pd.route.length) continue;
    const isSelected = state.editorSelectedPlayer === name;
    const color = getPlayerColor(name);

    for (let i = 0; i < pd.route.length; i++) {
      const [cx, cy] = fieldToCanvas(pd.route[i][0], pd.route[i][1]);
      const isWpSelected = state.editorSelectedWaypoint?.playerName === name &&
                           state.editorSelectedWaypoint?.waypointIndex === i;

      ctx.globalAlpha = isSelected ? 1.0 : 0.5;
      ctx.beginPath(); ctx.arc(cx, cy, isWpSelected ? 10 : 7, 0, Math.PI * 2);
      ctx.fillStyle = isWpSelected ? '#fff' : color;
      ctx.strokeStyle = isWpSelected ? color : '#fff';
      ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

function drawEditSelectionRing() {
  if (!state.editorSelectedPlayer || !state.editorPlay) return;
  const pd = state.editorPlay.players[state.editorSelectedPlayer];
  if (!pd) return;
  const [cx, cy] = fieldToCanvas(pd.pos[0], pd.pos[1]);
  const color = getPlayerColor(state.editorSelectedPlayer);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawEditHint() {
  const cw = canvas.width / (window.devicePixelRatio || 1);
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  roundRect(ctx, cw / 2 - 100, fieldRect.y + fieldRect.h - 28, 200, 22, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (state.editorSelectedPlayer) {
    ctx.fillText('Tap field → add waypoint  |  Drag → move  |  Hold waypoint → delete', cw / 2, fieldRect.y + fieldRect.h - 17);
  } else {
    ctx.fillText('Tap a player to select  •  Drag to move', cw / 2, fieldRect.y + fieldRect.h - 17);
  }
  ctx.restore();
}

// ── Field ─────────────────────────────────────────────────────

function drawField(play) {
  ctx.fillStyle = state.sunlightMode ? '#1a5e1a' : '#2d6a2e';
  ctx.fillRect(fieldRect.x, fieldRect.y, fieldRect.w, fieldRect.h);

  for (let y = FIELD_Y_MIN; y <= FIELD_Y_MAX; y += 5) {
    const [, cy] = fieldToCanvas(0, y);
    if (y === 0) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
    }
    ctx.beginPath(); ctx.moveTo(fieldRect.x, cy); ctx.lineTo(fieldRect.x + fieldRect.w, cy); ctx.stroke();
    if (y >= 0 && y <= 20 && y % 5 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(y + ' yd', fieldRect.x - 4, cy);
    }
  }

  const [, losCy] = fieldToCanvas(0, 0);
  ctx.strokeStyle = '#f5d742'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
  ctx.beginPath(); ctx.moveTo(fieldRect.x, losCy); ctx.lineTo(fieldRect.x + fieldRect.w, losCy); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#f5d742'; ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('LOS', fieldRect.x + fieldRect.w + 3, losCy);
  ctx.textAlign = 'right'; ctx.fillText('LOS', fieldRect.x - 3, losCy);

  if (play.showNRZ) {
    const [nx1, ny1] = fieldToCanvas(0, 5);
    const [nx2, ny2] = fieldToCanvas(35, 0);
    ctx.fillStyle = 'rgba(255,102,0,0.15)';
    ctx.fillRect(nx1, ny1, nx2 - nx1, ny2 - ny1);
    ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.strokeRect(nx1, ny1, nx2 - nx1, ny2 - ny1); ctx.setLineDash([]);
    const [nrzmx, nrzmy] = fieldToCanvas(17.5, 2.5);
    ctx.fillStyle = '#ff6600'; ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.8;
    ctx.fillText('NO-RUN ZONE', nrzmx, nrzmy); ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(fieldRect.x, fieldRect.y); ctx.lineTo(fieldRect.x, fieldRect.y + fieldRect.h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(fieldRect.x + fieldRect.w, fieldRect.y); ctx.lineTo(fieldRect.x + fieldRect.w, fieldRect.y + fieldRect.h); ctx.stroke();
}

// ── Defense ───────────────────────────────────────────────────

function getManAssignment(play, defIdx) {
  const receivers = Object.entries(play.players)
    .filter(([n, pd]) => pd.route && pd.route.length > 0 && pd.read > 0)
    .sort((a, b) => a[1].read - b[1].read);
  if (defIdx < receivers.length) return receivers[defIdx];
  const remaining = Object.entries(play.players)
    .filter(([n, pd]) => pd.route && pd.route.length > 0)
    .filter(([n]) => !receivers.slice(0, defIdx).some(([rn]) => rn === n));
  return remaining.length > 0 ? remaining[0] : null;
}

function getDefenderPosition(play, defIdx, defStart) {
  if (state.defenseMode === 'off' || state.animTime <= 0) return defStart;
  const postTime = Math.max(0, state.animTime);
  const moveTime = Math.max(0, postTime - 0.3);

  if (state.defenseMode === 'man') {
    const assignment = getManAssignment(play, defIdx);
    if (!assignment) return defStart;
    const [name, pd] = assignment;
    const offensePos = getPlayerPosition(play, name, pd);
    const adjustedProgress = Math.min(1, moveTime * 0.6);
    const dx = defStart[0] + (offensePos[0] - defStart[0]) * adjustedProgress;
    const dy = defStart[1] + (offensePos[1] - defStart[1]) * adjustedProgress;
    return [dx, Math.max(offensePos[1], dy + 1)];
  }

  if (state.defenseMode === 'zone') {
    const role = ZONE_ROLES[defIdx] || 'MLB';
    const zoneTarget = ZONE_POSITIONS[role].zone;
    const shiftTime = Math.min(1, moveTime * 0.8);
    let zx = defStart[0] + (zoneTarget[0] - defStart[0]) * shiftTime;
    let zy = defStart[1] + (zoneTarget[1] - defStart[1]) * shiftTime;
    if (moveTime > 1.0) {
      const driftTime = Math.min(1, (moveTime - 1.0) * 0.4);
      let nearestDist = Infinity, nearestPos = null;
      for (const [name, pd] of Object.entries(play.players)) {
        if (!pd.route || !pd.route.length) continue;
        const rpos = getPlayerPosition(play, name, pd);
        const dist = Math.sqrt((rpos[0] - zx) ** 2 + (rpos[1] - zy) ** 2);
        if (dist < 12 && dist < nearestDist) { nearestDist = dist; nearestPos = rpos; }
      }
      if (nearestPos) {
        zx += (nearestPos[0] - zx) * driftTime * 0.4;
        zy += (nearestPos[1] - zy) * driftTime * 0.3;
      }
    }
    return [zx, zy];
  }
  return defStart;
}

function drawDefense(play) {
  if (state.defenseMode === 'off') return; // Skip rendering entirely when defense is off
  for (let i = 0; i < play.defense.length; i++) {
    const [startX, startY] = play.defense[i];
    const [dx, dy] = getDefenderPosition(play, i, [startX, startY]);
    const [cx, cy] = fieldToCanvas(dx, dy);
    const sz = 14;
    let fillColor = '#888', label = 'D';
    if (state.defenseMode === 'man') { fillColor = '#cc4444'; label = 'M'; }
    else if (state.defenseMode === 'zone') {
      fillColor = '#4466cc'; label = 'Z';
      if (state.animTime > 0) {
        ctx.globalAlpha = 0.1;
        ctx.beginPath(); ctx.arc(cx, cy, scaleLen(10), 0, Math.PI * 2);
        ctx.fillStyle = '#4466cc'; ctx.fill(); ctx.globalAlpha = 1;
      }
    }
    ctx.fillStyle = fillColor;
    ctx.fillRect(cx - sz, cy - sz, sz * 2, sz * 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - sz, cy - sz, sz * 2, sz * 2);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
  }
}

// ── Player helpers ────────────────────────────────────────────

function getPlayerColor(name) {
  const displayName = getDisplayName(name);
  if (PLAYERS[displayName]) return PLAYERS[displayName].color;
  // Check dynamic roster for newly added players
  const rp = state.roster ? state.roster.find(p => p.name === displayName) : null;
  return rp ? rp.color : '#999';
}

function getPlayerDisplayName(origName) { return getDisplayName(origName); }

function getRouteStartTime(play, read) {
  if (state.viewMode === 'game') return 0;
  if (read <= 0) return 0;
  const timing = play.timing[read];
  if (timing === undefined) return 0;
  return Math.max(0, timing - ANIM_ROUTE_DURATION);
}

export function getPlayerPosition(play, name, pd) {
  if (!pd.route || pd.route.length === 0 || state.animTime <= 0) return pd.pos;
  const routeStart = getRouteStartTime(play, pd.read);
  if (state.animTime < routeStart) return pd.pos;
  const progress = Math.min(1, (state.animTime - routeStart) / ANIM_ROUTE_DURATION);
  const fullPath = [pd.pos, ...pd.route];
  let totalLen = 0;
  const segLens = [];
  for (let i = 1; i < fullPath.length; i++) {
    const dx = fullPath[i][0] - fullPath[i-1][0];
    const dy = fullPath[i][1] - fullPath[i-1][1];
    const sl = Math.sqrt(dx*dx + dy*dy);
    segLens.push(sl); totalLen += sl;
  }
  const targetLen = totalLen * progress;
  let accumulated = 0;
  for (let i = 1; i < fullPath.length; i++) {
    if (accumulated + segLens[i-1] >= targetLen) {
      const remain = targetLen - accumulated;
      const frac = remain / segLens[i-1];
      return [
        fullPath[i-1][0] + (fullPath[i][0] - fullPath[i-1][0]) * frac,
        fullPath[i-1][1] + (fullPath[i][1] - fullPath[i-1][1]) * frac,
      ];
    }
    accumulated += segLens[i-1];
  }
  return pd.route[pd.route.length - 1];
}

// ── Motions ───────────────────────────────────────────────────

function drawMotions(play) {
  for (const [name, pd] of Object.entries(play.players)) {
    if (!pd.motion) continue;
    const ghosted = state.highlightPlayer && state.highlightPlayer !== name;
    const alpha = ghosted ? 0.15 : 0.7;
    const color = getPlayerColor(name);
    const [fx, fy] = fieldToCanvas(pd.motion.from[0], pd.motion.from[1]);
    const [tx, ty] = fieldToCanvas(pd.motion.to[0], pd.motion.to[1]);
    const animStart = getAnimStart(play);
    let motionProgress = 1;
    if (state.animTime < -SET_PAUSE) {
      const motionElapsed = state.animTime - animStart;
      motionProgress = Math.max(0, Math.min(1, motionElapsed / PRE_SNAP_MOTION));
    }
    const motDotR = state.sunlightMode ? 19 : 15;

    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath(); ctx.arc(fx, fy, motDotR, 0, Math.PI * 2);
    ctx.strokeStyle = color; ctx.lineWidth = state.sunlightMode ? 3 : 2;
    ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);

    const currentX = fx + (tx - fx) * motionProgress;
    const currentY = fy + (ty - fy) * motionProgress;
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = color; ctx.lineWidth = state.sunlightMode ? 4 : 2.5;
    ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);

    if (motionProgress > 0.05) drawArrowhead(currentX, currentY, Math.atan2(ty - fy, tx - fx), color, 10);

    if (motionProgress < 1) {
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(currentX, currentY, motDotR, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = state.sunlightMode ? 3.5 : 2.5; ctx.stroke();
      const tc = (color === '#2dd4bf' || color === '#f59e0b') ? '#000' : '#fff';
      ctx.fillStyle = tc;
      ctx.font = `bold ${state.sunlightMode ? 11 : 9}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(getPlayerDisplayName(name).substring(0, 7), currentX, currentY);
    }

    const mx = (fx + tx) / 2, my = (fy + ty) / 2;
    ctx.fillStyle = color; ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('MOTION', mx, my - 8);
    ctx.globalAlpha = 1;
  }
}

// ── Routes ────────────────────────────────────────────────────

function drawRoutes(play) {
  for (const [name, pd] of Object.entries(play.players)) {
    if (!pd.route || !pd.route.length) continue;
    const ghosted = state.highlightPlayer && state.highlightPlayer !== name;
    const color = getPlayerColor(name);
    const baseAlpha = ghosted ? 0.12 : 1;
    const routeStart = pd.read > 0 ? getRouteStartTime(play, pd.read) : 0;
    const routeEnd = routeStart + ANIM_ROUTE_DURATION;
    const fullPath = [pd.pos, ...pd.route];

    let totalLen = 0;
    const segLens = [];
    for (let i = 1; i < fullPath.length; i++) {
      const [x1, y1] = fieldToCanvas(fullPath[i-1][0], fullPath[i-1][1]);
      const [x2, y2] = fieldToCanvas(fullPath[i][0], fullPath[i][1]);
      const sl = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
      segLens.push(sl); totalLen += sl;
    }

    let progress = 1;
    if (state.playing || state.animTime < TOTAL_TIME) {
      if (state.animTime < routeStart) progress = 0;
      else if (state.animTime < routeEnd) progress = (state.animTime - routeStart) / ANIM_ROUTE_DURATION;
      else progress = 1;
    }
    if (progress <= 0) continue;
    const drawLen = totalLen * Math.min(progress, 1);

    if (pd.fakeSegment && progress > 0) {
      ctx.globalAlpha = baseAlpha * 0.7;
      const [fs1, fs2] = pd.fakeSegment;
      const [fx1, fy1] = fieldToCanvas(fs1[0], fs1[1]);
      const [fx2, fy2] = fieldToCanvas(fs2[0], fs2[1]);
      ctx.beginPath(); ctx.moveTo(fx1, fy1); ctx.lineTo(fx2, fy2);
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
      if (pd.fakeLabel) {
        const fmx = (fx1 + fx2) / 2, fmy = (fy1 + fy2) / 2;
        drawLabel(fmx + 10, fmy - 10, pd.fakeLabel, color, baseAlpha * 0.7, true);
      }
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = baseAlpha;
    ctx.beginPath();
    let drawnSoFar = 0, endPoint = fieldToCanvas(fullPath[0][0], fullPath[0][1]), prevAngle = 0;
    const [sx, sy] = endPoint;
    ctx.moveTo(sx, sy);

    for (let i = 1; i < fullPath.length; i++) {
      const [x1, y1] = fieldToCanvas(fullPath[i-1][0], fullPath[i-1][1]);
      const [x2, y2] = fieldToCanvas(fullPath[i][0], fullPath[i][1]);
      const sl = segLens[i-1];
      if (drawnSoFar + sl <= drawLen) {
        ctx.lineTo(x2, y2); endPoint = [x2, y2]; prevAngle = Math.atan2(y2-y1, x2-x1); drawnSoFar += sl;
      } else {
        const remain = drawLen - drawnSoFar, frac = remain / sl;
        const ix = x1 + (x2-x1)*frac, iy = y1 + (y2-y1)*frac;
        ctx.lineTo(ix, iy); endPoint = [ix, iy]; prevAngle = Math.atan2(iy-y1, ix-x1); break;
      }
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = pd.dashed ? (state.sunlightMode ? 4 : 3) : (state.sunlightMode ? 7 : 4.5);
    if (pd.dashed) ctx.setLineDash([8, 5]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.setLineDash([]);

    if (progress > 0.05) drawArrowhead(endPoint[0], endPoint[1], prevAngle, color, 12);

    if (progress >= 1 && pd.label && pd.label !== '' && pd.label !== 'PUMP FAKE') {
      const [lx, ly] = endPoint;
      drawLabel(lx + 8, ly - 8, pd.label, color, baseAlpha);
    }

    if (pd.read > 0 && progress >= 1) {
      const [rx, ry] = endPoint;
      drawReadNumber(rx - (state.sunlightMode ? 18 : 14), ry + (state.sunlightMode ? 18 : 14), pd.read, baseAlpha);
    }

    if (pd.read > 0 && !ghosted) {
      const readTime = play.timing[pd.read];
      if (readTime !== undefined) {
        const dt = Math.abs(state.animTime - readTime);
        if (dt < 0.8) {
          const pulse = 0.5 + 0.5 * Math.sin(state.animTime * 8);
          const [px, py] = fieldToCanvas(pd.pos[0], pd.pos[1]);
          ctx.beginPath(); ctx.arc(px, py, 22 + pulse * 6, 0, Math.PI * 2);
          ctx.strokeStyle = color; ctx.lineWidth = 3;
          ctx.globalAlpha = 0.4 + pulse * 0.4; ctx.stroke(); ctx.globalAlpha = 1;
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

// ── Players ───────────────────────────────────────────────────

function drawPlayers(play) {
  for (const [name, pd] of Object.entries(play.players)) {
    if (pd.motion && state.animTime < -SET_PAUSE) continue;
    const ghosted = state.highlightPlayer && state.highlightPlayer !== name;
    const color = getPlayerColor(name);
    const currentPos = getPlayerPosition(play, name, pd);
    const [cx, cy] = fieldToCanvas(currentPos[0], currentPos[1]);
    const r = state.sunlightMode ? 19 : 15;

    ctx.globalAlpha = ghosted ? 0.2 : 1;
    const dispName = getPlayerDisplayName(name);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = (PLAYERS[dispName] && PLAYERS[dispName].border) || '#fff';
    ctx.lineWidth = state.sunlightMode ? 3.5 : 2.5; ctx.stroke();

    const tc = (color === '#2dd4bf' || color === '#f59e0b' || color === '#f5d742') ? '#000' : '#fff';
    ctx.fillStyle = tc;
    ctx.font = `bold ${state.sunlightMode ? 11 : 9}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // Show up to 7 chars of name
    ctx.fillText(dispName.substring(0, 7), cx, cy);
    ctx.globalAlpha = 1;
  }
}

// ── Ball ──────────────────────────────────────────────────────

function getBallPosition(play) {
  if (!play.ballPath || !play.ballPath.length) {
    const qbPd = play.players['Braelyn'];
    return qbPd ? getPlayerPosition(play, 'Braelyn', qbPd) : [17.5, -3];
  }
  const bp = play.ballPath;
  if (state.animTime < 0) {
    const snapperPd = play.players[bp[0].from];
    return snapperPd ? snapperPd.pos : [17.5, 0];
  }
  let lastHolder = bp[0].from;
  for (let i = 0; i < bp.length; i++) {
    const seg = bp[i];
    const dur = BALL_TRANS[seg.type] || 0.3;
    const segEnd = seg.time + dur;
    if (state.animTime < seg.time) break;
    if (state.animTime < segEnd) {
      const t = (state.animTime - seg.time) / dur;
      const fromPd = play.players[seg.from], toPd = play.players[seg.to];
      if (!fromPd || !toPd) { lastHolder = seg.to; break; }
      const fromPos = getPlayerPosition(play, seg.from, fromPd);
      const toPos = getPlayerPosition(play, seg.to, toPd);
      if (seg.type === 'throw') {
        const dx = toPos[0]-fromPos[0], dy = toPos[1]-fromPos[1];
        const dist = Math.sqrt(dx*dx+dy*dy) || 1;
        const perpX = -dy/dist, perpY = dx/dist;
        const arcH = Math.min(4, dist*0.35);
        const ctrlX = (fromPos[0]+toPos[0])/2 + perpX*arcH;
        const ctrlY = (fromPos[1]+toPos[1])/2 + perpY*arcH;
        return [
          (1-t)*(1-t)*fromPos[0] + 2*(1-t)*t*ctrlX + t*t*toPos[0],
          (1-t)*(1-t)*fromPos[1] + 2*(1-t)*t*ctrlY + t*t*toPos[1],
        ];
      }
      return [fromPos[0]+(toPos[0]-fromPos[0])*t, fromPos[1]+(toPos[1]-fromPos[1])*t];
    }
    lastHolder = seg.to;
  }
  const holderPd = play.players[lastHolder];
  if (!holderPd) return [17.5, -3];
  return getPlayerPosition(play, lastHolder, holderPd);
}

const BALL_REDUNDANT_KEYWORDS = ['PITCH', 'HANDOFF', 'LATERAL', 'BALL CARRIER'];

function drawBall(play) {
  if (!state.showBall || !play.ballPath) return;
  if (state.animTime > 0) {
    for (const seg of play.ballPath) {
      if (seg.type !== 'throw') continue;
      if (state.animTime < seg.time) break;
      const fromPd = play.players[seg.from], toPd = play.players[seg.to];
      if (!fromPd || !toPd) continue;
      const fromPos = getPlayerPosition(play, seg.from, fromPd);
      const toPos = getPlayerPosition(play, seg.to, toPd);
      const dx = toPos[0]-fromPos[0], dy = toPos[1]-fromPos[1];
      const dist = Math.sqrt(dx*dx+dy*dy) || 1;
      const perpX = -dy/dist, perpY = dx/dist;
      const arcH = Math.min(4, dist*0.35);
      const [fx, fy] = fieldToCanvas(fromPos[0], fromPos[1]);
      const [tx, ty] = fieldToCanvas(toPos[0], toPos[1]);
      const ctrlXf = (fromPos[0]+toPos[0])/2 + perpX*arcH;
      const ctrlYf = (fromPos[1]+toPos[1])/2 + perpY*arcH;
      const [cx2, cy2] = fieldToCanvas(ctrlXf, ctrlYf);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,210,100,0.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(cx2, cy2, tx, ty); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
  }
  const [bfx, bfy] = getBallPosition(play);
  const [bcx, bcy] = fieldToCanvas(bfx, bfy);
  const R = 7;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 2;
  ctx.beginPath(); ctx.arc(bcx, bcy, R, 0, Math.PI * 2);
  ctx.fillStyle = '#8B4513'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bcx-R+2, bcy); ctx.lineTo(bcx+R-2, bcy); ctx.stroke();
  ctx.lineWidth = 0.8;
  for (let lx = bcx-2; lx <= bcx+3; lx += 2) {
    ctx.beginPath(); ctx.moveTo(lx, bcy-2.5); ctx.lineTo(lx, bcy+2.5); ctx.stroke();
  }
  ctx.restore();
}

// ── Special labels ────────────────────────────────────────────

function drawSpecialLabels(play) {
  if (!play.specialLabels) return;
  for (const sl of play.specialLabels) {
    if (state.showBall && BALL_REDUNDANT_KEYWORDS.some(kw => sl.text.toUpperCase().includes(kw))) continue;
    const [cx, cy] = fieldToCanvas(sl.x, sl.y);
    drawLabel(cx, cy, sl.text, sl.color, 0.9);
    if (sl.toX !== undefined) {
      const [tx, ty] = fieldToCanvas(sl.toX, sl.toY);
      ctx.strokeStyle = sl.color; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
      drawArrowhead(tx, ty, Math.atan2(ty-cy, tx-cx), sl.color, 10);
    }
  }
}

// ── Snap indicator ────────────────────────────────────────────

function drawSnapIndicator(play) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const cx = w / 2;
  if (hasMotion(play)) {
    if (state.animTime < -SET_PAUSE) {
      ctx.save(); ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#1a1a2e'; roundRect(ctx, cx-70, 30, 140, 40, 8); ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; roundRect(ctx, cx-70, 30, 140, 40, 8); ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 20px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⟵ MOTION', cx, 50); ctx.restore();
    } else if (state.animTime < 0) {
      const pulse = 0.7 + 0.3 * Math.sin(state.animTime * 12);
      ctx.save(); ctx.globalAlpha = pulse;
      ctx.fillStyle = '#1a1a2e'; roundRect(ctx, cx-50, 30, 100, 40, 8); ctx.fill();
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3; roundRect(ctx, cx-50, 30, 100, 40, 8); ctx.stroke();
      ctx.fillStyle = '#22c55e'; ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SET!', cx, 50); ctx.restore();
    } else if (state.animTime < 0.5) {
      const fade = 1 - (state.animTime / 0.5);
      ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = '#dc2626';
      roundRect(ctx, cx-55, 25, 110, 50, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HIKE!', cx, 50); ctx.restore();
    }
  } else if (state.animTime >= 0 && state.animTime < 0.5) {
    const fade = 1 - (state.animTime / 0.5);
    ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = '#dc2626';
    roundRect(ctx, cx-55, 25, 110, 50, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HIKE!', cx, 50); ctx.restore();
  }
}

// ── Drawing utilities ─────────────────────────────────────────

function drawArrowhead(x, y, angle, color, size) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size*0.5); ctx.lineTo(-size, size*0.5);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawLabel(x, y, text, color, alpha, italic) {
  ctx.save(); ctx.globalAlpha = alpha;
  const lines = text.split('\n');
  const labelPx = state.sunlightMode ? 13 : 11;
  const lineH = state.sunlightMode ? 16 : 13;
  ctx.font = (italic ? 'italic ' : '') + `bold ${labelPx}px system-ui`;
  const realMaxW = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
  const pad = 4;
  const bw = realMaxW + pad * 2;
  const bh = lines.length * lineH + pad;
  const cw = canvas.width / (window.devicePixelRatio || 1);
  if (x + bw > cw - 4) x = cw - bw - 4;
  if (x < 4) x = 4;
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  roundRect(ctx, x - pad, y - lineH + 2 - pad, bw, bh, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y - lineH + 4 + i * lineH);
  }
  ctx.restore();
}

function drawReadNumber(x, y, n, alpha) {
  const syms = { 1: '①', 2: '②', 3: '③', 4: '④' };
  const circR = state.sunlightMode ? 15 : 12;
  const fontSize = state.sunlightMode ? 16 : 14;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = '#333';
  ctx.lineWidth = state.sunlightMode ? 2 : 1;
  ctx.beginPath(); ctx.arc(x, y, circR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1a1a'; ctx.font = `bold ${fontSize}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(syms[n] || n, x, y); ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
