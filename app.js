// app.js — Flag Football Playbook Animator
(function () {
  'use strict';

  // ── State ────────────────────────────────────────────────
  let currentPlayIdx = 0;
  let animTime = 0;           // seconds into animation (negative = pre-snap phase)
  let playing = false;
  let speed = 1;
  let lastFrameTs = null;
  let highlightPlayer = null; // null = show all
  let animId = null;
  let viewMode = 'qb'; // 'qb' = staggered reads (study), 'game' = all routes simultaneous

  const TOTAL_TIME = 7.0;     // pass clock (post-snap)
  const ANIM_ROUTE_DURATION = 1.2; // seconds to draw a single route
  const PRE_SNAP_MOTION = 1.5;  // seconds for motion animation
  const SET_PAUSE = 0.6;        // seconds for "SET" display after motion
  const PRE_SNAP_TOTAL = PRE_SNAP_MOTION + SET_PAUSE; // total pre-snap time

  // Animation phases:
  // animTime < -SET_PAUSE         = motion phase (player moving to position)
  // -SET_PAUSE <= animTime < 0    = SET phase (player set, waiting for hike)
  // animTime == 0                 = HIKE! (snap)
  // animTime > 0                  = post-snap, routes drawing, timer counting

  function hasMotion(play) {
    return Object.values(play.players).some(pd => pd.motion);
  }

  function getAnimStart(play) {
    return hasMotion(play) ? -PRE_SNAP_TOTAL : 0;
  }

  // ── Field coordinate mapping ─────────────────────────────
  // Play coords: X=[0,35], Y=[-8, 24] (LOS at 0, positive = downfield)
  const FIELD_X_MIN = 0, FIELD_X_MAX = 35;
  const FIELD_Y_MIN = -8, FIELD_Y_MAX = 24;
  let canvas, ctx;
  let fieldRect = { x: 0, y: 0, w: 0, h: 0 };

  function fieldToCanvas(fx, fy) {
    const cx = fieldRect.x + ((fx - FIELD_X_MIN) / (FIELD_X_MAX - FIELD_X_MIN)) * fieldRect.w;
    // Y inverted: positive Y (downfield) = UP on screen for football perspective
    // Actually: top of canvas = far downfield, bottom = behind LOS
    const cy = fieldRect.y + ((FIELD_Y_MAX - fy) / (FIELD_Y_MAX - FIELD_Y_MIN)) * fieldRect.h;
    return [cx, cy];
  }

  function scaleLen(yards) {
    return (yards / (FIELD_X_MAX - FIELD_X_MIN)) * fieldRect.w;
  }

  // ── Canvas Setup ─────────────────────────────────────────
  function initCanvas() {
    canvas = document.getElementById('field-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
  }

  function resizeCanvas() {
    const container = document.getElementById('field-container');
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Field rect with margins
    const mx = 24, my = 12;
    fieldRect = { x: mx, y: my, w: w - mx * 2, h: h - my * 2 };

    drawFrame();
  }

  // ── Drawing ──────────────────────────────────────────────
  function drawFrame() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    const play = PLAYS[currentPlayIdx];
    drawField(play);
    drawDefense(play);
    drawMotions(play);
    drawRoutes(play);
    drawPlayers(play);
    drawSpecialLabels(play);
    drawSnapIndicator(play);
  }

  function drawField(play) {
    // Green background
    ctx.fillStyle = '#2d6a2e';
    ctx.fillRect(fieldRect.x, fieldRect.y, fieldRect.w, fieldRect.h);

    // Yard lines
    for (let y = FIELD_Y_MIN; y <= FIELD_Y_MAX; y += 5) {
      const [, cy] = fieldToCanvas(0, y);
      if (y === 0) {
        // LOS - gold
        ctx.strokeStyle = '#f5d742';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
      }
      ctx.beginPath();
      ctx.moveTo(fieldRect.x, cy);
      ctx.lineTo(fieldRect.x + fieldRect.w, cy);
      ctx.stroke();

      // Yard label
      if (y >= 0 && y <= 20 && y % 5 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(y + ' yd', fieldRect.x - 4, cy);
      }
    }

    // LOS label
    const [, losCy] = fieldToCanvas(0, 0);
    ctx.fillStyle = '#f5d742';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOS', fieldRect.x + fieldRect.w + 3, losCy);

    // NRZ overlay
    if (play.showNRZ) {
      const [nx1, ny1] = fieldToCanvas(0, 5);
      const [nx2, ny2] = fieldToCanvas(35, 0);
      ctx.fillStyle = 'rgba(255,102,0,0.15)';
      ctx.fillRect(nx1, ny1, nx2 - nx1, ny2 - ny1);
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(nx1, ny1, nx2 - nx1, ny2 - ny1);
      ctx.setLineDash([]);

      // NRZ label
      const [nrzmx, nrzmy] = fieldToCanvas(17.5, 2.5);
      ctx.fillStyle = '#ff6600';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.8;
      ctx.fillText('NO-RUN ZONE', nrzmx, nrzmy);
      ctx.globalAlpha = 1;
    }

    // Sidelines
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fieldRect.x, fieldRect.y);
    ctx.lineTo(fieldRect.x, fieldRect.y + fieldRect.h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fieldRect.x + fieldRect.w, fieldRect.y);
    ctx.lineTo(fieldRect.x + fieldRect.w, fieldRect.y + fieldRect.h);
    ctx.stroke();
  }

  function drawDefense(play) {
    for (const [dx, dy] of play.defense) {
      const [cx, cy] = fieldToCanvas(dx, dy);
      const sz = 14;
      ctx.fillStyle = '#888';
      ctx.fillRect(cx - sz, cy - sz, sz * 2, sz * 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - sz, cy - sz, sz * 2, sz * 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('D', cx, cy);
    }
  }

  function drawMotions(play) {
    for (const [name, pd] of Object.entries(play.players)) {
      if (!pd.motion) continue;
      const ghosted = highlightPlayer && highlightPlayer !== name;
      const alpha = ghosted ? 0.15 : 0.7;
      const color = getPlayerColor(name);
      const [fx, fy] = fieldToCanvas(pd.motion.from[0], pd.motion.from[1]);
      const [tx, ty] = fieldToCanvas(pd.motion.to[0], pd.motion.to[1]);

      // Calculate motion progress (only during pre-snap motion phase)
      let motionProgress = 1; // default: fully complete
      if (animTime < -SET_PAUSE) {
        // In motion phase
        const motionElapsed = animTime - getAnimStart(play);
        motionProgress = Math.max(0, Math.min(1, motionElapsed / PRE_SNAP_MOTION));
      }
      // After motion phase (SET or post-snap), motion is complete

      // Ghost dot at origin (always show)
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(fx, fy, 15, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dotted motion path (draw only the completed portion)
      const currentX = fx + (tx - fx) * motionProgress;
      const currentY = fy + (ty - fy) * motionProgress;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow at current position
      if (motionProgress > 0.05) {
        drawArrowhead(currentX, currentY, Math.atan2(ty - fy, tx - fx), color, 10);
      }

      // During motion phase, draw the moving player dot at the current position
      if (motionProgress < 1) {
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 15, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        const tc = (color === '#2dd4bf' || color === '#f59e0b') ? '#000' : '#fff';
        ctx.fillStyle = tc;
        ctx.font = 'bold 8px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.substring(0, 7), currentX, currentY);
      }

      // MOTION label
      const mx = (fx + tx) / 2;
      const my = (fy + ty) / 2;
      ctx.fillStyle = color;
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('MOTION', mx, my - 8);

      ctx.globalAlpha = 1;
    }
  }

  function getPlayerColor(name) {
    return PLAYERS[name] ? PLAYERS[name].color : '#fff';
  }

  function getRouteStartTime(play, read) {
    if (viewMode === 'game') return 0; // All routes start at snap in game mode
    if (read <= 0) return 0;
    const timing = play.timing[read];
    if (timing === undefined) return 0;
    // Route starts drawing a bit before the read opens
    return Math.max(0, timing - ANIM_ROUTE_DURATION);
  }

  function drawRoutes(play) {
    for (const [name, pd] of Object.entries(play.players)) {
      if (!pd.route || pd.route.length === 0) continue;
      const ghosted = highlightPlayer && highlightPlayer !== name;
      const color = getPlayerColor(name);
      const baseAlpha = ghosted ? 0.12 : 1;

      // Determine timing
      const routeStart = pd.read > 0 ? getRouteStartTime(play, pd.read) : 0;
      const routeEnd = routeStart + ANIM_ROUTE_DURATION;

      // Full path: start pos + waypoints
      const fullPath = [pd.pos, ...pd.route];

      // Calculate total path length
      let totalLen = 0;
      const segLens = [];
      for (let i = 1; i < fullPath.length; i++) {
        const [x1, y1] = fieldToCanvas(fullPath[i - 1][0], fullPath[i - 1][1]);
        const [x2, y2] = fieldToCanvas(fullPath[i][0], fullPath[i][1]);
        const sl = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        segLens.push(sl);
        totalLen += sl;
      }

      // How much of route to draw
      let progress = 1;
      if (playing || animTime < TOTAL_TIME) {
        if (animTime < routeStart) progress = 0;
        else if (animTime < routeEnd) progress = (animTime - routeStart) / ANIM_ROUTE_DURATION;
        else progress = 1;
      }

      if (progress <= 0) continue;

      const drawLen = totalLen * Math.min(progress, 1);

      // Draw fake segment first (dashed, before main route)
      if (pd.fakeSegment && progress > 0) {
        ctx.globalAlpha = baseAlpha * 0.7;
        const [fs1, fs2] = pd.fakeSegment;
        const [fx1, fy1] = fieldToCanvas(fs1[0], fs1[1]);
        const [fx2, fy2] = fieldToCanvas(fs2[0], fs2[1]);
        ctx.beginPath();
        ctx.moveTo(fx1, fy1);
        ctx.lineTo(fx2, fy2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Fake label
        if (pd.fakeLabel) {
          const fmx = (fx1 + fx2) / 2, fmy = (fy1 + fy2) / 2;
          drawLabel(fmx + 10, fmy - 10, pd.fakeLabel, color, baseAlpha * 0.7, true);
        }
        ctx.globalAlpha = 1;
      }

      // Draw the main route
      ctx.globalAlpha = baseAlpha;
      ctx.beginPath();
      let drawnSoFar = 0;
      let endPoint = fieldToCanvas(fullPath[0][0], fullPath[0][1]);
      const [sx, sy] = endPoint;
      ctx.moveTo(sx, sy);
      let prevAngle = 0;

      for (let i = 1; i < fullPath.length; i++) {
        const [x1, y1] = fieldToCanvas(fullPath[i - 1][0], fullPath[i - 1][1]);
        const [x2, y2] = fieldToCanvas(fullPath[i][0], fullPath[i][1]);
        const sl = segLens[i - 1];

        if (drawnSoFar + sl <= drawLen) {
          ctx.lineTo(x2, y2);
          endPoint = [x2, y2];
          prevAngle = Math.atan2(y2 - y1, x2 - x1);
          drawnSoFar += sl;
        } else {
          const remain = drawLen - drawnSoFar;
          const frac = remain / sl;
          const ix = x1 + (x2 - x1) * frac;
          const iy = y1 + (y2 - y1) * frac;
          ctx.lineTo(ix, iy);
          endPoint = [ix, iy];
          prevAngle = Math.atan2(iy - y1, ix - x1);
          break;
        }
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = pd.dashed ? 3 : 4.5;
      if (pd.dashed) {
        ctx.setLineDash([8, 5]);
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead at current end
      if (progress > 0.05) {
        drawArrowhead(endPoint[0], endPoint[1], prevAngle, color, 12);
      }

      // Route label (only when fully drawn)
      if (progress >= 1 && pd.label && pd.label !== '' && pd.label !== 'PUMP FAKE') {
        const [lx, ly] = endPoint;
        drawLabel(lx + 8, ly - 8, pd.label, color, baseAlpha);
      }

      // Read number
      if (pd.read > 0 && progress >= 1) {
        const [rx, ry] = endPoint;
        drawReadNumber(rx - 14, ry + 14, pd.read, baseAlpha);
      }

      // Pulsing glow on current read
      if (pd.read > 0 && !ghosted) {
        const readTime = play.timing[pd.read];
        if (readTime !== undefined) {
          const dt = Math.abs(animTime - readTime);
          if (dt < 0.8) {
            const pulse = 0.5 + 0.5 * Math.sin(animTime * 8);
            const [px, py] = fieldToCanvas(pd.pos[0], pd.pos[1]);
            ctx.beginPath();
            ctx.arc(px, py, 22 + pulse * 6, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.4 + pulse * 0.4;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      ctx.globalAlpha = 1;
    }
  }

  function drawArrowhead(x, y, angle, color, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.5);
    ctx.lineTo(-size, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawLabel(x, y, text, color, alpha, italic) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const lines = text.split('\n');
    const lineH = 13;
    const maxW = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);

    ctx.font = (italic ? 'italic ' : '') + 'bold 10px system-ui';
    // Re-measure with correct font
    const realMaxW = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
    const pad = 4;
    const bw = realMaxW + pad * 2;
    const bh = lines.length * lineH + pad;

    // Clamp to field
    const cw = canvas.width / (window.devicePixelRatio || 1);
    if (x + bw > cw - 4) x = cw - bw - 4;
    if (x < 4) x = 4;

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x - pad, y - lineH + 2 - pad, bw, bh, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y - lineH + 4 + i * lineH);
    }
    ctx.restore();
  }

  function drawReadNumber(x, y, n, alpha) {
    const syms = { 1: '①', 2: '②', 3: '③', 4: '④' };
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(syms[n] || n, x, y);
    ctx.restore();
  }

  function drawPlayers(play) {
    for (const [name, pd] of Object.entries(play.players)) {
      const ghosted = highlightPlayer && highlightPlayer !== name;
      const color = getPlayerColor(name);
      const [cx, cy] = fieldToCanvas(pd.pos[0], pd.pos[1]);
      const r = 15;

      ctx.globalAlpha = ghosted ? 0.2 : 1;

      // Dot
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = (PLAYERS[name] && PLAYERS[name].border) || '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Name
      const tc = (color === '#2dd4bf' || color === '#f59e0b' || color === '#f5d742') ? '#000' : '#fff';
      ctx.fillStyle = tc;
      ctx.font = 'bold 8px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.substring(0, 7), cx, cy);

      ctx.globalAlpha = 1;
    }
  }

  function drawSpecialLabels(play) {
    if (!play.specialLabels) return;
    for (const sl of play.specialLabels) {
      const [cx, cy] = fieldToCanvas(sl.x, sl.y);
      drawLabel(cx, cy, sl.text, sl.color, 0.9);

      // Draw lateral arrow if specified
      if (sl.toX !== undefined) {
        const [tx, ty] = fieldToCanvas(sl.toX, sl.toY);
        ctx.strokeStyle = sl.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
        drawArrowhead(tx, ty, Math.atan2(ty - cy, tx - cx), sl.color, 10);
      }
    }
  }

  function drawSnapIndicator(play) {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const cx = w / 2;

    if (hasMotion(play)) {
      if (animTime < -SET_PAUSE) {
        // MOTION phase — show "MOTION" indicator
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#1a1a2e';
        roundRect(ctx, cx - 70, 30, 140, 40, 8);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        roundRect(ctx, cx - 70, 30, 140, 40, 8);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 20px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⟵ MOTION', cx, 50);
        ctx.restore();
      } else if (animTime < 0) {
        // SET phase — player is set, about to hike
        const pulse = 0.7 + 0.3 * Math.sin(animTime * 12);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#1a1a2e';
        roundRect(ctx, cx - 50, 30, 100, 40, 8);
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        roundRect(ctx, cx - 50, 30, 100, 40, 8);
        ctx.stroke();
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SET!', cx, 50);
        ctx.restore();
      } else if (animTime < 0.5) {
        // HIKE flash — first 0.5s after snap
        const fade = 1 - (animTime / 0.5);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#dc2626';
        roundRect(ctx, cx - 55, 25, 110, 50, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HIKE!', cx, 50);
        ctx.restore();
      }
    } else {
      // No motion plays — just show HIKE at start
      if (animTime >= 0 && animTime < 0.5) {
        const fade = 1 - (animTime / 0.5);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#dc2626';
        roundRect(ctx, cx - 55, 25, 110, 50, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HIKE!', cx, 50);
        ctx.restore();
      }
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── Timer ────────────────────────────────────────────────
  function updateTimer() {
    const play = PLAYS[currentPlayIdx];
    const needle = document.getElementById('timer-needle');
    const timeLabel = document.getElementById('timer-time');

    // Timer only counts post-snap time (7-second clock starts at HIKE)
    const postSnapTime = Math.max(0, animTime);
    const pct = Math.min(postSnapTime / TOTAL_TIME, 1) * 100;
    needle.style.left = pct + '%';

    if (animTime < -SET_PAUSE && hasMotion(play)) {
      timeLabel.textContent = 'MOTION';
      timeLabel.style.color = '#f59e0b';
    } else if (animTime < 0 && hasMotion(play)) {
      timeLabel.textContent = 'SET';
      timeLabel.style.color = '#22c55e';
    } else {
      timeLabel.textContent = postSnapTime.toFixed(1) + 's';
      if (postSnapTime < 2) timeLabel.style.color = '#22c55e';
      else if (postSnapTime < 4) timeLabel.style.color = '#eab308';
      else if (postSnapTime < 6) timeLabel.style.color = '#f97316';
      else timeLabel.style.color = '#ef4444';
    }

    // Read markers
    const markers = document.querySelectorAll('.read-marker');
    markers.forEach(m => m.remove());

    const bar = document.getElementById('timer-bar');
    const barW = bar.clientWidth;
    for (const [readStr, time] of Object.entries(play.timing)) {
      const readNum = parseInt(readStr);
      const marker = document.createElement('div');
      marker.className = 'read-marker' + (animTime >= time ? ' visible' : '');
      marker.textContent = '①②③④'[readNum - 1] || readNum;
      marker.style.left = (time / TOTAL_TIME * 100) + '%';
      bar.appendChild(marker);
    }
  }

  // ── Animation Loop ───────────────────────────────────────
  function animate(ts) {
    if (!playing) { animId = null; return; }
    if (lastFrameTs === null) lastFrameTs = ts;
    const dt = ((ts - lastFrameTs) / 1000) * speed;
    lastFrameTs = ts;
    animTime += dt;

    if (animTime >= TOTAL_TIME) {
      animTime = TOTAL_TIME;
      playing = false;
      updatePlayPauseBtn();
    }

    drawFrame();
    updateTimer();
    animId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    playing = true;
    lastFrameTs = null;
    updatePlayPauseBtn();
    animId = requestAnimationFrame(animate);
  }

  function pauseAnimation() {
    playing = false;
    lastFrameTs = null;
    updatePlayPauseBtn();
  }

  function togglePlayPause() {
    if (playing) {
      pauseAnimation();
    } else {
      if (animTime >= TOTAL_TIME) {
        const play = PLAYS[currentPlayIdx];
        animTime = getAnimStart(play);
      }
      startAnimation();
    }
  }

  function replay() {
    const play = PLAYS[currentPlayIdx];
    animTime = getAnimStart(play);
    drawFrame();
    updateTimer();
    startAnimation();
  }

  function updatePlayPauseBtn() {
    const btn = document.getElementById('btn-play');
    btn.textContent = playing ? '⏸' : '▶';
  }

  // ── UI Setup ─────────────────────────────────────────────
  function buildPlaySelector() {
    const container = document.getElementById('play-selector');
    container.innerHTML = '';
    PLAYS.forEach((play, i) => {
      const btn = document.createElement('button');
      btn.className = 'play-btn' + (i === currentPlayIdx ? ' active' : '');
      btn.textContent = play.name;
      btn.addEventListener('click', () => selectPlay(i));
      container.appendChild(btn);
    });
  }

  function buildPlayerFilter() {
    const container = document.getElementById('player-filter');
    container.innerHTML = '';
    // Only show the 5 starters for each play
    const play = PLAYS[currentPlayIdx];
    for (const name of Object.keys(play.players)) {
      const p = PLAYERS[name];
      if (!p) continue;
      const btn = document.createElement('button');
      btn.className = 'player-dot-btn' + (highlightPlayer === name ? ' active' : '');
      btn.innerHTML = `<span class="dot" style="background:${p.color}"></span><span class="name">${name}</span>`;
      btn.addEventListener('click', () => {
        highlightPlayer = highlightPlayer === name ? null : name;
        buildPlayerFilter();
        drawFrame();
      });
      container.appendChild(btn);
    }
  }

  function buildControls() {
    document.getElementById('btn-play').addEventListener('click', togglePlayPause);
    document.getElementById('btn-replay').addEventListener('click', replay);

    const modeBtn = document.getElementById('btn-mode');
    modeBtn.addEventListener('click', () => {
      viewMode = viewMode === 'qb' ? 'game' : 'qb';
      modeBtn.textContent = viewMode === 'qb' ? '👁️' : '🏈';
      modeBtn.title = viewMode === 'qb' ? 'QB Study Mode (staggered reads)' : 'Game Speed (all routes at once)';
      // Show mode label briefly
      const label = viewMode === 'qb' ? 'QB STUDY MODE' : 'GAME SPEED';
      document.getElementById('play-notes').textContent = label;
      setTimeout(() => {
        document.getElementById('play-notes').textContent = PLAYS[currentPlayIdx].notes || '';
      }, 1500);
      drawFrame();
    });

    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        speed = parseFloat(btn.dataset.speed);
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function selectPlay(idx) {
    currentPlayIdx = idx;
    animTime = getAnimStart(PLAYS[idx]);
    playing = false;
    highlightPlayer = null;
    lastFrameTs = null;
    updatePlayPauseBtn();
    buildPlaySelector();
    buildPlayerFilter();
    updateInfoPanel();
    drawFrame();
    updateTimer();

    // Scroll the active button into view
    const btns = document.querySelectorAll('.play-btn');
    if (btns[idx]) btns[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  function updateInfoPanel() {
    const play = PLAYS[currentPlayIdx];
    document.getElementById('formation-label').textContent = 'Formation: ' + play.formation;
    document.getElementById('when-to-use').innerHTML = play.whenToUse
      .map(b => '<span class="bullet">•</span>' + b).join('&nbsp;&nbsp;');
    document.getElementById('play-notes').textContent = play.notes || '';
  }

  // ── Touch / Swipe ────────────────────────────────────────
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;

  function setupTouch() {
    const fc = document.getElementById('field-container');
    fc.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    fc.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const dt = Date.now() - touchStartTime;
      if (dt < 400 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0 && currentPlayIdx < PLAYS.length - 1) selectPlay(currentPlayIdx + 1);
        else if (dx > 0 && currentPlayIdx > 0) selectPlay(currentPlayIdx - 1);
      }
    }, { passive: true });
  }

  // ── Keyboard ─────────────────────────────────────────────
  function setupKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' && currentPlayIdx < PLAYS.length - 1) selectPlay(currentPlayIdx + 1);
      else if (e.key === 'ArrowLeft' && currentPlayIdx > 0) selectPlay(currentPlayIdx - 1);
      else if (e.key === ' ') { e.preventDefault(); togglePlayPause(); }
      else if (e.key === 'r' || e.key === 'R') replay();
    });
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    initCanvas();
    buildPlaySelector();
    buildPlayerFilter();
    buildControls();
    updateInfoPanel();
    updateTimer();
    setupTouch();
    setupKeyboard();

    window.addEventListener('resize', () => {
      resizeCanvas();
      updateTimer();
    });

    // Start from pre-snap and auto-play
    animTime = getAnimStart(PLAYS[currentPlayIdx]);
    drawFrame();
    updateTimer();
    setTimeout(() => startAnimation(), 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
