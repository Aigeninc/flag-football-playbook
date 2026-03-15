// modules/wristband.js — Wristband play sheet generator

// Generate a printable wristband-sized play sheet
export function generateWristband() {
  // Pick top plays — try to get a variety of situations
  const picks = selectWristbandPlays();

  const html = buildWristbandHTML(picks);
  const win = window.open('', '_blank', 'width=700,height=500');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

function selectWristbandPlays() {
  // Pick 8 plays that represent a diverse playbook
  const priorityPlays = [
    'Mesh',
    'Flood Right',
    'Quick Slants NRZ',
    'Flat-Wheel',
    'Hitch & Go',
    'Screen',
    'Fade',
    'Mesh Wheel',
  ];

  const plays = [];
  for (const name of priorityPlays) {
    const idx = PLAYS.findIndex(p => p.name === name);
    if (idx !== -1) {
      plays.push({ name, play: PLAYS[idx] });
    }
    if (plays.length >= 8) break;
  }

  // If we didn't find 8, fill from available plays
  if (plays.length < 8) {
    for (let i = 0; i < PLAYS.length && plays.length < 8; i++) {
      if (!plays.find(p => p.name === PLAYS[i].name)) {
        plays.push({ name: PLAYS[i].name, play: PLAYS[i] });
      }
    }
  }

  return plays;
}

function buildOneLineSummary(play) {
  if (play.whenToUse && play.whenToUse.length > 0) {
    // Trim to ~40 chars
    const line = play.whenToUse[0];
    return line.length > 42 ? line.slice(0, 40) + '…' : line;
  }
  return '';
}

function buildWristbandHTML(picks) {
  const cells = picks.map(({ name, play }) => {
    const summary = buildOneLineSummary(play);
    const formation = play.formation || '';
    return `
      <div class="play-cell">
        <div class="play-name">${name}</div>
        <div class="play-formation">${formation}</div>
        <div class="play-summary">${summary}</div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Wristband Play Sheet</title>
  <style>
    /* ── Screen preview ── */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, Arial, sans-serif;
      background: #fff;
      color: #000;
      padding: 16px;
    }
    h1 {
      font-size: 14px;
      text-align: center;
      margin-bottom: 12px;
      color: #333;
    }
    .play-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      max-width: 420px;
      margin: 0 auto;
    }
    .play-cell {
      border: 1.5px solid #333;
      border-radius: 4px;
      padding: 6px 8px;
      background: #fff;
      page-break-inside: avoid;
    }
    .play-name {
      font-size: 13px;
      font-weight: 900;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .play-formation {
      font-size: 9px;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }
    .play-summary {
      font-size: 9px;
      color: #333;
      margin-top: 3px;
      line-height: 1.3;
    }
    .print-hint {
      text-align: center;
      font-size: 12px;
      color: #777;
      margin-top: 16px;
    }
    .print-hint button {
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 13px;
      cursor: pointer;
      margin-left: 8px;
    }

    /* ── Print styles ── */
    @media print {
      body {
        padding: 2mm;
        background: #fff;
      }
      h1 { display: none; }
      .print-hint { display: none; }

      /* Wristband size: ~8cm × 20cm landscape */
      .play-grid {
        max-width: 100%;
        width: 100%;
        grid-template-columns: 1fr 1fr;
        gap: 2px;
      }
      .play-cell {
        border: 1px solid #000;
        padding: 3px 5px;
        border-radius: 2px;
      }
      .play-name { font-size: 9pt; }
      .play-formation { font-size: 6pt; }
      .play-summary { font-size: 6pt; margin-top: 1px; }

      @page {
        size: 4in 2in landscape;
        margin: 3mm;
      }
    }
  </style>
</head>
<body>
  <h1>🏈 Flag Football — Play Call Sheet</h1>
  <div class="play-grid">
    ${cells}
  </div>
  <div class="print-hint">
    Print on card stock, cut to wristband size, laminate for durability.
    <button onclick="window.print()">🖨️ Print</button>
  </div>
</body>
</html>`;
}
