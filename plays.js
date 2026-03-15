// plays.js — 25 flag football plays (16 base + 9 new: run game + misdirection combos)
// Coordinates: X = 0-35 (sideline to sideline), Y = negative behind LOS, positive downfield
// LOS is at Y=0

const PLAYERS = {
  'Braelyn':  { color: '#1a1a1a', role: 'QB',     border: '#ffffff' },
  'Lenox':    { color: '#8b5cf6', role: 'Center' },
  'Greyson':  { color: '#dc2626', role: 'WR/RB' },
  'Marshall': { color: '#f59e0b', role: 'WR/RB' },  // Yellow - TALL, 2nd QB
  'Cooper':   { color: '#2dd4bf', role: 'WR/RB' },
  'Jordy':    { color: '#2563eb', role: 'Sub' },
  'Zeke':     { color: '#ff6600', role: 'Sub' },
  'Mason':    { color: '#22c55e', role: 'RB/Decoy' },
};

const PLAYS = [
  // ── 1. MESH ────────────────────────────────────────────────────────────
  {
    name: 'Mesh',
    formation: 'Spread',
    whenToUse: [
      'Man coverage — crossing creates natural picks',
      'Need a quick, safe completion',
      'Defense is tight on outside routes'
    ],
    notes: 'SUB: Jordy can replace Marshall at RB (flat)',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[22, 3], [27, 5]], label: 'CHECK', read: 4, dashed: true },
      Greyson:  { pos: [4, 0],     route: [[4, 5], [32, 5]], label: 'MESH', read: 1, dashed: false },
      Cooper:   { pos: [24, -1],    route: [[24, 6], [3, 6]], label: 'MESH', read: 2, dashed: false,
                  motion: { from: [31, -1], to: [24, -1] } },
      Marshall: { pos: [17.5, -5.5], route: [[17.5, -3.5], [6, 1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10, 5], [17.5, 8], [25, 5], [8, 13], [27, 13]],
    timing: { 1: 1.5, 2: 2.0, 3: 3.0, 4: 4.0 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 1.5, type: 'throw' },
    ],
  },

  // ── 2. FLOOD FAKE (replaces Quick Out) ──────────────────────────────────
  // MIRROR OF: Flood Right — identical formation + first 1 sec, then Cooper burns deep
  {
    name: 'Flood Fake',
    formation: 'Twins Right',
    whenToUse: [
      'After running Flood Right 2-3 times — defense cheats right',
      'Need a big play — Cooper deep post',
      'Defense is jumping the flat/corner combo'
    ],
    notes: 'LOOKS LIKE Flood Right for 1 sec! Cooper fakes flat then burns deep. MIRROR PLAY.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 4, dashed: true },
      Greyson:  { pos: [27, 0],    route: [[27, 6], [33, 16]], label: 'CORNER', read: 2, dashed: false },
      Marshall: { pos: [32, 0],    route: [[32, 8], [34, 8]], label: 'OUT', read: 3, dashed: false },
      Cooper:   { pos: [17.5, -5.5], route: [[22, -2], [30, 1], [25, 6], [17.5, 14]], label: 'POST!', read: 1, dashed: false },
    },
    defense: [[8, 7], [17, 7], [26, 5], [10, 14], [28, 12]],
    timing: { 1: 2.0, 2: 1.0, 3: 2.5, 4: 4.0 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Cooper', time: 2.0, type: 'throw' },
    ],
    specialLabels: [
      { x: 17.5, y: 16, text: '★ WIDE OPEN\nDEFENSE CHEATED RIGHT', color: '#2dd4bf' },
    ],
  },

  // ── 3. FLOOD RIGHT ─────────────────────────────────────────────────────
  {
    name: 'Flood Right',
    formation: 'Twins Right',
    whenToUse: [
      '1st down — safe, high-percentage',
      'Zone defense — 3 levels beat zone',
      'Need to move the chains'
    ],
    notes: 'SUB: Jordy can replace Cooper at RB (flat)',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 4, dashed: true },
      Greyson:  { pos: [27, 0],    route: [[27, 6], [33, 16]], label: 'CORNER', read: 1, dashed: false },
      Marshall: { pos: [32, 0],    route: [[32, 8], [34, 8]], label: 'OUT', read: 2, dashed: false },
      Cooper:   { pos: [17.5, -5.5], route: [[22, -2], [32, 2]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[8, 7], [17, 7], [26, 5], [10, 14], [28, 12]],
    timing: { 1: 1.0, 2: 2.0, 3: 3.5, 4: 4.5 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 1.0, type: 'throw' },
    ],
  },

  // ── 4. REVERSE ─────────────────────────────────────────────────────────
  {
    name: 'Reverse',
    formation: 'Spread',
    whenToUse: [
      'Defense is crashing to one side',
      "They're keying on receivers — trick them",
      'Need a big misdirection play'
    ],
    notes: 'SUB: Jordy can replace Greyson (decoy WR2). RUN PLAY — no read progression.',
    isRunPlay: true,
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [[21, -4]], label: 'HANDOFF', read: 0, dashed: true },
      Lenox:    { pos: [17.5, 0],  route: [[23, 3], [28, 5]], label: 'CHECK', read: 0, dashed: true },
      Greyson:  { pos: [31, 0],    route: [[31, 18]], label: 'GO (decoy)', read: 0, dashed: false },
      Marshall: { pos: [17.5, -5.5], route: [[21, -4], [26, -3.5]], label: 'RUN RIGHT', read: 0, dashed: true },
      Cooper:   { pos: [26, -1],     route: [[20, -3], [15, -5], [10, -4], [5, -2], [2, 2], [1, 8], [2, 18]],
                  label: 'REVERSE!', read: 0, dashed: false,
                  motion: { from: [4, -1], to: [26, -1] } },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [7, 12], [28, 12]],
    timing: {},
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Marshall', time: 0.5, type: 'handoff' },
      { from: 'Marshall', to: 'Cooper', time: 1.5, type: 'lateral' },
    ],
    specialLabels: [
      { x: 15, y: -5, text: 'PITCH', color: '#ff6600' },
      { x: 3, y: 19, text: '★ BALL CARRIER', color: '#2dd4bf' },
    ],
  },

  // ── 5. RPO SLANT ───────────────────────────────────────────────────────
  {
    name: 'RPO Slant',
    formation: 'Spread',
    whenToUse: [
      'Want Braelyn to have a run option',
      'Defense is predictable — make them guess',
      'Mix up the look — run AND pass threat'
    ],
    notes: 'SUB: Zeke can play RB here when ahead',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [[19, -4]], label: '', read: 0, dashed: true },
      Lenox:    { pos: [17.5, 0],  route: [[23, 3], [28, 5]], label: 'CHECK', read: 2, dashed: true },
      Cooper:   { pos: [4, 0],     route: [[4, 2], [14, 7]], label: 'SLANT', read: 1, dashed: false },
      Greyson:  { pos: [31, 0],    route: [[31, 14]], label: 'GO (clear)', read: 0, dashed: false },
      Marshall: { pos: [17.5, -5.5], route: [[19, -4], [26, -1]], label: 'RUN?', read: 0, dashed: true },
    },
    defense: [[10, 5], [17.5, 6], [25, 5], [7, 12], [28, 12]],
    timing: { 1: 1.0, 2: 2.0, 3: 3.5 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Marshall', time: 0.5, type: 'handoff' },
    ],
    specialLabels: [
      { x: 27, y: 1, text: 'OPT 1: RUN', color: '#f59e0b' },
      { x: 10, y: 10, text: 'OPT 2: SLANT or\nBRAELYN RUNS', color: '#2dd4bf' },
      { x: 26, y: -1, text: 'PITCH BACK', color: '#ff6600' },
    ],
  },

  // ── 6. QUICK SLANTS NRZ ────────────────────────────────────────────────
  {
    name: 'Quick Slants NRZ',
    formation: 'Spread',
    showNRZ: true,
    whenToUse: [
      'NO-RUN ZONE — must pass!',
      'Near midfield or goal line (5yd out)',
      'Need the fastest possible throw'
    ],
    notes: 'SUB: Jordy can replace Cooper at RB (flat)',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 4, dashed: true },
      Greyson:  { pos: [4, 0],     route: [[4, 2], [12, 5]], label: 'SLANT', read: 1, dashed: false },
      Marshall: { pos: [31, 0],    route: [[31, 2], [23, 5]], label: 'SLANT', read: 2, dashed: false },
      Cooper:   { pos: [17.5, -5.5], route: [[17.5, -3.5], [28, 1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10, 4], [17.5, 6], [25, 4], [8, 9], [27, 9]],
    timing: { 1: 0.8, 2: 1.0, 3: 2.0, 4: 3.5 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 0.8, type: 'throw' },
    ],
  },

  // ── 7. FLAT-WHEEL ──────────────────────────────────────────────────────
  {
    name: 'Flat-Wheel',
    formation: 'RB Offset Right',
    showNRZ: true,
    whenToUse: [
      'Need a BIG play — deep shot',
      'Goal line — wheel beats flat coverage',
      'Defense is sitting on short stuff'
    ],
    notes: 'SUB: Zeke can play RB (flat decoy) when ahead',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 4, dashed: true },
      Cooper:   { pos: [4, 0],     route: [[4, 2], [12, 6]], label: 'SLANT', read: 2, dashed: false },
      Marshall: { pos: [31, 0],    route: [[33, 2], [33, 8], [33, 16]], label: 'WHEEL!', read: 1, dashed: false,
                  fakeSegment: [[31, 0], [33, 2]] },
      Greyson:  { pos: [22, -5],     route: [[22, -2], [32, 2]], label: 'FLAT (decoy)', read: 3, dashed: false },
    },
    defense: [[10, 3], [17.5, 5], [25, 3], [6, 10], [29, 10]],
    timing: { 1: 2.0, 2: 1.5, 3: 1.0, 4: 4.0 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Marshall', time: 2.0, type: 'throw' },
    ],
  },

  // ── 8. BRAELYN LATERAL ─────────────────────────────────────────────────
  {
    name: 'Braelyn Lateral',
    formation: 'Spread (Marshall offset)',
    whenToUse: [
      'Surprise play — Braelyn becomes a RECEIVER',
      'Defense keying on Braelyn as passer all game',
      'Need a mismatch — nobody expects QB to run a route'
    ],
    notes: '⚠ RUSH IS LIVE after lateral — ball out in 1.5 sec! TRICK PLAY — max 2-3x per game.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [[20, -3], [20, -2], [25, 4]], label: 'FLAT', read: 1, dashed: false,
                  lateralTo: [22, -5] },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 4, dashed: true },
      Greyson:  { pos: [4, 0],     route: [[4, 3], [14, 8]], label: 'SLANT', read: 2, dashed: false },
      Cooper:   { pos: [31, 0],    route: [[31, 18]], label: 'GO (clear)', read: 3, dashed: false },
      Marshall: { pos: [22, -5],     route: [], label: '2nd QB — THROW', read: 0, dashed: false },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [7, 13], [28, 13]],
    timing: { 1: 1.5, 2: 2.0, 3: 3.0, 4: 4.0 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Marshall', time: 0.5, type: 'lateral' },
      { from: 'Marshall', to: 'Braelyn', time: 1.5, type: 'throw' },
    ],
    specialLabels: [
      { x: 17.5, y: -3, text: 'LATERAL', color: '#ff6600', toX: 22, toY: -5 },
    ],
  },

  // ── 9. FLOOD LEFT ──────────────────────────────────────────────────────
  {
    name: 'Flood Left',
    formation: 'Twins Left',
    whenToUse: [
      'Defense overplays RIGHT side',
      'Mirror of Flood Right — keep them guessing',
      'Zone defense — 3 levels beat zone'
    ],
    notes: 'SUB: Jordy can replace Greyson at RB (flat)',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[23, 3], [28, 5]], label: 'CHECK', read: 4, dashed: true },
      Cooper:   { pos: [8, 0],     route: [[8, 6], [2, 16]], label: 'CORNER', read: 1, dashed: false },
      Marshall: { pos: [3, 0],     route: [[3, 8], [1, 8]], label: 'OUT', read: 2, dashed: false },
      Greyson:  { pos: [17.5, -5.5], route: [[13, -2], [3, 2]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[8, 5], [17, 7], [27, 7], [7, 12], [25, 14]],
    timing: { 1: 1.0, 2: 2.0, 3: 3.5, 4: 4.5 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Cooper', time: 1.0, type: 'throw' },
    ],
  },

  // ── 10. HITCH & GO ─────────────────────────────────────────────────────
  {
    name: 'Hitch & Go',
    formation: 'Spread',
    whenToUse: [
      'Defense jumping short routes all game',
      'Counter after running Quick Out / Mesh',
      'Need a deep shot — DB bites on fake hitch'
    ],
    notes: 'Give to Greyson or Cooper (fastest). No subs on WR1.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[22, 3], [28, 5]], label: 'CHECK', read: 4, dashed: true },
      Greyson:  { pos: [4, 0],     route: [[4, 5], [4, 4], [3.5, 3.5], [4, 4], [4, 5], [4, 20]], label: 'GO!', read: 1, dashed: false,
                  fakeSegment: [[4, 0], [4, 5]], fakeLabel: 'FAKE HITCH' },
      Cooper:   { pos: [11, -1],    route: [[11, 5]], label: 'HITCH', read: 2, dashed: false,
                  motion: { from: [31, -1], to: [11, -1] } },
      Marshall: { pos: [17.5, -5.5], route: [[17.5, -3.5], [6, 1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10, 4], [17.5, 7], [25, 4], [8, 12], [27, 12]],
    timing: { 1: 3.0, 2: 1.5, 3: 2.5, 4: 4.0 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 3.0, type: 'throw' },
    ],
  },

  // ── 11. SCREEN ─────────────────────────────────────────────────────────
  {
    name: 'Screen',
    formation: 'Spread',
    whenToUse: [
      'Aggressive rush — let them fly by, dump underneath',
      'Defense playing tight man — clear them deep',
      'Need yards after catch — RB in space'
    ],
    notes: 'SUB: Jordy can replace Greyson/Marshall as go-route decoy',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: 'PUMP FAKE', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 2, dashed: true },
      Greyson:  { pos: [4, 0],     route: [[4, 18]], label: 'GO (sell deep)', read: 0, dashed: true },
      Marshall: { pos: [31, 0],    route: [[31, 18]], label: 'GO (sell deep)', read: 0, dashed: true },
      Cooper:   { pos: [24, -4],     route: [[24, -3], [28, -1], [33, 3]], label: 'SCREEN!', read: 1, dashed: false,
                  motion: { from: [17.5, -5.5], to: [24, -4] }, delay: 1.0 },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [8, 13], [27, 13]],
    timing: { 1: 2.5 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Cooper', time: 2.5, type: 'throw' },
    ],
    specialLabels: [
      { x: 19.5, y: -1, text: 'PUMP FAKE', color: '#1a1a1a' },
    ],
  },

  // ── 12. REVERSE FAKE (replaces Drag Cross) ──────────────────────────────
  // MIRROR OF: Reverse — same formation + motion, NO handoff, hit vacated side
  {
    name: 'Reverse Fake',
    formation: 'Spread',
    whenToUse: [
      'After running Reverse 1-2 times — defense crashes on motion',
      'Defense chasing Cooper across — leave the other side empty',
      'Need chunk yardage from misdirection'
    ],
    notes: 'LOOKS LIKE Reverse! Same motion. Braelyn pump fakes handoff, hits Greyson slant.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: 'PUMP FAKE', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[23, 3], [28, 5]], label: 'CHECK', read: 3, dashed: true },
      Greyson:  { pos: [31, 0],    route: [[31, 3], [23, 8]], label: 'SLANT!', read: 1, dashed: false },
      Marshall: { pos: [17.5, -5.5], route: [[21, -4], [26, -3.5]], label: 'FAKE RUN', read: 0, dashed: true },
      Cooper:   { pos: [26, -1],     route: [[20, -3], [15, -4], [10, -3], [5, 1], [3, 5]],
                  label: 'FAKE REVERSE', read: 2, dashed: true,
                  motion: { from: [4, -1], to: [26, -1] } },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [7, 12], [28, 12]],
    timing: { 1: 1.5, 2: 2.5, 3: 3.0, 4: 4.0 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 1.5, type: 'throw' },
    ],
    specialLabels: [
      { x: 17.5, y: -5, text: 'FAKE HANDOFF', color: '#ff6600' },
      { x: 23, y: 10, text: '★ DEFENSE CRASHES LEFT\nGREYSON WIDE OPEN RIGHT', color: '#dc2626' },
    ],
  },

  // ── 13. FADE ───────────────────────────────────────────────────────────
  {
    name: 'Fade',
    formation: 'Spread',
    showNRZ: true,
    whenToUse: [
      'Goal line / NO-RUN ZONE',
      'Need a TD — lob to back corner',
      '50/50 ball to tallest kid (Marshall)'
    ],
    notes: 'Always give fade to Marshall (tallest). No subs on WR1.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 4, dashed: true },
      Marshall: { pos: [31, 0],    route: [[33, 5], [34, 14]], label: 'FADE!', read: 1, dashed: false },
      Cooper:   { pos: [4, 0],     route: [[4, 2], [12, 6]], label: 'SLANT', read: 2, dashed: false },
      Greyson:  { pos: [17.5, -5.5], route: [[17.5, -3.5], [28, 1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10, 4], [17.5, 6], [25, 4], [8, 9], [27, 9]],
    timing: { 1: 2.0, 2: 1.5, 3: 2.5, 4: 4.0 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Marshall', time: 2.0, type: 'throw' },
    ],
    specialLabels: [
      { x: 34, y: 16, text: '★ TALLEST KID\nBACK CORNER', color: '#f59e0b' },
    ],
  },

  // ── 14. MESH WHEEL ─────────────────────────────────────────────────────
  // MIRROR OF: Mesh — same motion from Cooper, but Cooper wheels deep instead of crossing
  {
    name: 'Mesh Wheel',
    formation: 'Spread',
    whenToUse: [
      'After running Mesh 2-3 times — DB expects crossing route',
      'Defense jumping the mesh crossing — Cooper fakes cross, wheels deep',
      'Need a big play off a familiar look'
    ],
    notes: 'LOOKS LIKE Mesh! Cooper fakes the cross, wheels up sideline. DB bites inside = TD.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[22, 3], [27, 5]], label: 'CHECK', read: 4, dashed: true },
      Greyson:  { pos: [4, 0],     route: [[4, 5], [32, 5]], label: 'MESH', read: 2, dashed: false },
      Cooper:   { pos: [24, -1],    route: [[24, 3], [22, 4], [23, 5], [24, 6], [26, 10], [27, 16]], label: 'WHEEL!', read: 1, dashed: false,
                  motion: { from: [31, -1], to: [24, -1] } },
      Marshall: { pos: [17.5, -5.5], route: [[17.5, -3.5], [6, 1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10, 5], [17.5, 8], [25, 5], [8, 13], [27, 13]],
    timing: { 1: 2.5, 2: 1.5, 3: 3.0, 4: 4.0 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Cooper', time: 2.5, type: 'throw' },
    ],
    specialLabels: [
      { x: 22, y: 4, text: 'FAKE CROSS', color: '#2dd4bf' },
      { x: 27, y: 17, text: '★ DB BITES INSIDE\nCOOPER GONE', color: '#2dd4bf' },
    ],
  },

  // ── 15. SLANT & GO ─────────────────────────────────────────────────────
  // MIRROR OF: Quick Slants NRZ — same formation, Greyson fakes slant then goes deep
  {
    name: 'Slant & Go',
    formation: 'Spread',
    whenToUse: [
      'After running Quick Slants — DB jumping the slant inside',
      'Defense cheating inside on slant routes',
      'Need a deep shot from a familiar look'
    ],
    notes: 'LOOKS LIKE Quick Slants! Greyson fakes slant at 3yd then explodes deep outside. COUNTER PLAY.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 4, dashed: true },
      Greyson:  { pos: [4, 0],     route: [[4, 2], [8, 3], [6, 4], [4, 5], [2, 10], [1, 16]], label: 'GO!', read: 1, dashed: false },
      Marshall: { pos: [31, 0],    route: [[31, 2], [23, 5]], label: 'SLANT', read: 2, dashed: false },
      Cooper:   { pos: [17.5, -5.5], route: [[17.5, -3.5], [28, 1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10, 4], [17.5, 6], [25, 4], [8, 9], [27, 9]],
    timing: { 1: 2.5, 2: 1.0, 3: 2.0, 4: 3.5 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 2.5, type: 'throw' },
    ],
    specialLabels: [
      { x: 8, y: 3, text: 'FAKE SLANT', color: '#dc2626' },
      { x: 1, y: 17, text: '★ DB BITES SLANT\nGREYSON GONE', color: '#dc2626' },
    ],
  },

  // ── 17. JET SWEEP ──────────────────────────────────────────────────────
  // KEY play for new misdirection offense — Greyson motions L→R, takes handoff, sprints right edge
  {
    name: 'Jet Sweep',
    formation: 'Spread',
    isRunPlay: true,
    whenToUse: [
      'KEY misdirection run — new offense',
      'Defense over-pursuing or crashing inside',
      'Greyson speed on right edge — nobody can catch him'
    ],
    notes: 'Greyson motions L→R pre-snap. Mason fakes up middle. Marshall go route pulls safety. SPRINT to edge.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [[20, -2]], label: 'HANDOFF', read: 0, dashed: true },
      Lenox:    { pos: [17.5, 0],  route: [[23, 3], [28, 5]], label: '', read: 0, dashed: true },
      Greyson:  { pos: [21, -2],   route: [[26, -1], [33, 2], [35, 10]], label: 'JET SWEEP!', read: 0, dashed: false,
                  motion: { from: [4, -1], to: [21, -2] } },
      Marshall: { pos: [3, 0],     route: [[3, 18]], label: 'GO (pull safety)', read: 0, dashed: false },
      Cooper:   { pos: [31, 0],    route: [[31, 8]], label: 'GO (clear)', read: 0, dashed: true },
      Mason:    { pos: [21, -6],   route: [[17.5, -3], [17.5, 5]], label: 'FAKE RB', read: 0, dashed: true },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [8, 13], [27, 13]],
    timing: {},
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 0.5, type: 'handoff' },
    ],
    specialLabels: [
      { x: 17.5, y: 4, text: 'FAKE UP MIDDLE', color: '#22c55e' },
      { x: 35, y: 11, text: '★ GREYSON\nRIGHT EDGE', color: '#dc2626' },
    ],
  },

  // ── 18. RB DRAW ────────────────────────────────────────────────────────
  // Misdirection run: everything looks like pass, middle vacated, Greyson delayed handoff
  {
    name: 'RB Draw',
    formation: 'Spread',
    isRunPlay: true,
    whenToUse: [
      'Defense in all-out pass rush — nobody home in middle',
      'Everything looks like a pass → middle vacated',
      'Counter after throwing a lot — make them pay for rushing'
    ],
    notes: 'Braelyn FAKES drop-back pass. Marshall + Cooper sell go routes. Greyson DELAYED handoff up middle.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [[17.5, -6]], label: 'FAKE PASS', read: 0, dashed: true },
      Lenox:    { pos: [17.5, 0],  route: [], label: '', read: 0, dashed: false },
      Greyson:  { pos: [21, -5],   route: [[18, -3], [17.5, 2], [17.5, 12]], label: 'DRAW!', read: 0, dashed: false, delay: 1.5 },
      Marshall: { pos: [3, 0],     route: [[3, 18]], label: 'GO (sell pass)', read: 0, dashed: true },
      Cooper:   { pos: [31, 0],    route: [[31, 18]], label: 'GO (sell pass)', read: 0, dashed: true },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [8, 13], [27, 13]],
    timing: {},
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 1.5, type: 'handoff' },
    ],
    specialLabels: [
      { x: 17.5, y: -7, text: 'FAKE DROP BACK', color: '#1a1a1a' },
      { x: 17.5, y: 13, text: '★ MIDDLE VACATED\nGREYSON UNTOUCHED', color: '#f59e0b' },
    ],
  },

  // ── 19. END AROUND ─────────────────────────────────────────────────────
  // Cooper motions behind QB pre-snap, takes handoff, runs right edge
  {
    name: 'End Around',
    formation: 'Spread',
    isRunPlay: true,
    whenToUse: [
      'Defense over-pursues left side',
      'Counter after running Reverse — keeps defense honest',
      "Cooper is fastest — get him the ball on the edge"
    ],
    notes: 'Cooper motions from right BEHIND QB pre-snap. Marshall + Greyson sell fake LEFT. Cooper takes handoff RIGHT edge.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [[20, -4]], label: 'HANDOFF', read: 0, dashed: true },
      Lenox:    { pos: [17.5, 0],  route: [[23, 3], [28, 5]], label: '', read: 0, dashed: true },
      Greyson:  { pos: [31, 0],    route: [[31, 5], [25, 2]], label: 'FAKE LEFT', read: 0, dashed: true },
      Marshall: { pos: [3, 0],     route: [[3, 5], [8, 2]], label: 'FAKE LEFT', read: 0, dashed: true },
      Cooper:   { pos: [20, -4],   route: [[26, -3], [33, -1], [35, 5], [34, 14]], label: 'END AROUND!', read: 0, dashed: false,
                  motion: { from: [31, -1], to: [20, -4] } },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [8, 13], [27, 13]],
    timing: {},
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Cooper', time: 0.5, type: 'handoff' },
    ],
    specialLabels: [
      { x: 3, y: 7, text: 'FAKE LEFT', color: '#ff6600' },
      { x: 34, y: 16, text: '★ COOPER\nRIGHT EDGE', color: '#2dd4bf' },
    ],
  },

  // ── 20. RPO FLOOD ──────────────────────────────────────────────────────
  // Run-pass option: Greyson run right OR keep/throw flood (Marshall corner, Cooper out)
  {
    name: 'RPO Flood',
    formation: 'Twins Right',
    whenToUse: [
      'Run OR pass — force defense to choose',
      'Zone defense — flood combination beats zone',
      'Want Braelyn making live reads at the mesh point'
    ],
    notes: 'OPT 1: Give to Greyson → run right. OPT 2: Keep → read Flood. Marshall corner deep, Cooper out mid.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 3, dashed: true },
      Greyson:  { pos: [22, -5],   route: [[26, -3], [33, 0], [35, 8]], label: 'RUN RIGHT', read: 0, dashed: false },
      Marshall: { pos: [27, 0],    route: [[27, 6], [33, 16]], label: 'CORNER', read: 1, dashed: false },
      Cooper:   { pos: [33, 0],    route: [[33, 5], [35, 5]], label: 'OUT', read: 2, dashed: false },
    },
    defense: [[8, 7], [17, 7], [26, 5], [10, 14], [28, 12]],
    timing: { 1: 1.0, 2: 2.0, 3: 3.5 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 0.3, type: 'handoff' },
    ],
    specialLabels: [
      { x: 33, y: 9, text: 'OPT 1: GIVE\nGREYSON RUN', color: '#dc2626' },
      { x: 33, y: 17, text: 'OPT 2: KEEP\nMARSHALL CORNER', color: '#f59e0b' },
      { x: 35, y: 6, text: 'OPT 3: COOPER OUT', color: '#2dd4bf' },
    ],
  },

  // ── 21. TRIPLE OPTION ──────────────────────────────────────────────────
  // Max flexibility: run right → lateral back → pass Cooper deep or Marshall out
  {
    name: 'Triple Option',
    formation: 'Spread',
    whenToUse: [
      'Maximum flexibility — 3 answers on every snap',
      'Defense is guessing — make them wrong every time',
      'Greyson healthy and fast for perimeter threat'
    ],
    notes: 'OPT 1: Greyson run right. If stopped → lateral back to Braelyn. OPT 2: Cooper go deep. OPT 3: Marshall out 8yd.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [[14, -2], [10, -2]], label: 'READS', read: 0, dashed: true },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 3, dashed: true },
      Greyson:  { pos: [22, -5],   route: [[26, -3], [33, 0], [35, 8]], label: 'RUN RIGHT', read: 0, dashed: false },
      Cooper:   { pos: [31, 0],    route: [[31, 18]], label: 'GO DEEP', read: 1, dashed: false },
      Marshall: { pos: [3, 0],     route: [[3, 8], [5, 8]], label: 'OUT 8yd', read: 2, dashed: false },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [8, 13], [27, 13]],
    timing: { 1: 0.5, 2: 2.0, 3: 2.5 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 0.3, type: 'handoff' },
    ],
    specialLabels: [
      { x: 33, y: 9, text: 'OPT 1: RUN', color: '#dc2626' },
      { x: 10, y: -1, text: 'LATERAL BACK\nIF STOPPED', color: '#ff6600' },
      { x: 31, y: 19, text: 'OPT 2: GO DEEP', color: '#2dd4bf' },
      { x: 5, y: 9, text: 'OPT 3: OUT 8yd', color: '#f59e0b' },
    ],
  },

  // ── 22. BUBBLE SCREEN ──────────────────────────────────────────────────
  // Short pass behind LOS — almost a handoff through the air
  {
    name: 'Bubble Screen',
    formation: 'Spread',
    whenToUse: [
      'Defense pressing tight coverage — give them the yards',
      'Need a quick gain in space — catch and run',
      "Get Cooper or Greyson the ball immediately with blockers ahead"
    ],
    notes: 'Fastest completion — almost a handoff through air. Cooper catches 2yd behind LOS. Greyson + Marshall clear space.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [], label: '', read: 0, dashed: false },
      Greyson:  { pos: [4, 0],     route: [[4, 18]], label: 'GO (clear)', read: 0, dashed: true },
      Marshall: { pos: [31, 0],    route: [[31, 10]], label: 'GO (clear)', read: 0, dashed: true },
      Cooper:   { pos: [27, -2],   route: [[27, -2], [32, 2], [34, 8]], label: 'BUBBLE!', read: 1, dashed: false,
                  motion: { from: [33, 0], to: [27, -2] } },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [8, 13], [27, 13]],
    timing: { 1: 0.5 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Cooper', time: 0.5, type: 'throw' },
    ],
    specialLabels: [
      { x: 28, y: -3, text: '★ CATCH BEHIND LOS\nRUN IN SPACE', color: '#2dd4bf' },
    ],
  },

  // ── 23. QUICK HITCH ────────────────────────────────────────────────────
  // 3 steps upfield, turn — Braelyn delivers on 1-count
  {
    name: 'Quick Hitch',
    formation: 'Spread',
    whenToUse: [
      'Need a guaranteed completion',
      'Greyson 1-on-1 — 1-count beats any coverage',
      'Short yardage — pick up 5-6 yards quickly'
    ],
    notes: 'Greyson takes 3 steps upfield, TURNS. Braelyn delivers immediately — 1-count throw.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 3, dashed: true },
      Greyson:  { pos: [4, 0],     route: [[4, 5], [4, 4]], label: 'HITCH', read: 1, dashed: false },
      Marshall: { pos: [31, 0],    route: [[31, 14]], label: 'GO (clear)', read: 0, dashed: true },
      Cooper:   { pos: [17.5, -5.5], route: [[17.5, -3.5], [28, 1]], label: 'FLAT (clear)', read: 2, dashed: true },
    },
    defense: [[10, 4], [17.5, 6], [25, 4], [8, 9], [27, 9]],
    timing: { 1: 1.0, 2: 2.0, 3: 3.0 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 1.0, type: 'throw' },
    ],
    specialLabels: [
      { x: 4, y: 6, text: '★ 3 STEPS\nTURN & CATCH', color: '#dc2626' },
    ],
  },

  // ── 24. JET BUBBLE ─────────────────────────────────────────────────────
  // LOOKS LIKE Jet Sweep! Greyson motions right, defense chases, ball goes LEFT to Cooper bubble
  {
    name: 'Jet Bubble',
    formation: 'Spread',
    whenToUse: [
      'After Jet Sweep — defense chasing Greyson motion hard',
      'Defense overcommits to motion side',
      'Misdirection combo — motion right, ball goes LEFT'
    ],
    notes: 'LOOKS LIKE Jet Sweep! Greyson motions L→R. Defense chases RIGHT. Braelyn throws Bubble to Cooper going LEFT.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: '', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [], label: '', read: 0, dashed: false },
      Greyson:  { pos: [21, -2],   route: [[26, -1], [33, 2]], label: 'JET FAKE', read: 0, dashed: true,
                  motion: { from: [4, -1], to: [21, -2] } },
      Marshall: { pos: [3, 0],     route: [[3, 14]], label: 'GO (clear)', read: 0, dashed: true },
      Cooper:   { pos: [8, -2],    route: [[8, -2], [3, 2], [1, 8]], label: 'BUBBLE!', read: 1, dashed: false,
                  motion: { from: [14, 0], to: [8, -2] } },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [8, 13], [27, 13]],
    timing: { 1: 0.5 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Cooper', time: 0.5, type: 'throw' },
    ],
    specialLabels: [
      { x: 28, y: 3, text: 'DEFENSE\nCHASES RIGHT →', color: '#ff6600' },
      { x: 1, y: 9, text: '★ BALL GOES LEFT\nCOOPER WIDE OPEN', color: '#2dd4bf' },
    ],
  },

  // ── 25. FAKE JET DRAW ──────────────────────────────────────────────────
  // LOOKS LIKE Jet Sweep! Greyson motions + fake handoff, Mason draws up vacated middle
  {
    name: 'Fake Jet Draw',
    formation: 'Spread',
    isRunPlay: true,
    whenToUse: [
      'After Jet Sweep — defense crashes hard on Greyson motion',
      'Middle is wide open — everyone committed to edge',
      'Mason big body sells the delay perfectly'
    ],
    notes: 'LOOKS LIKE Jet Sweep! Greyson motions, Braelyn FAKES handoff. Mason delayed DRAW up middle. Everyone chases Greyson = untouched.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [[20, -2]], label: 'FAKE HANDOFF', read: 0, dashed: true },
      Lenox:    { pos: [17.5, 0],  route: [], label: '', read: 0, dashed: false },
      Greyson:  { pos: [21, -2],   route: [[26, -1], [33, 2]], label: 'FAKE JET!', read: 0, dashed: true,
                  motion: { from: [4, -1], to: [21, -2] },
                  fakeSegment: [[21, -2], [26, -1]] },
      Marshall: { pos: [3, 0],     route: [[3, 14]], label: 'GO (decoy)', read: 0, dashed: true },
      Cooper:   { pos: [31, 0],    route: [[31, 14]], label: 'GO (decoy)', read: 0, dashed: true },
      Mason:    { pos: [17.5, -6], route: [[17.5, -3], [17.5, 2], [17.5, 12]], label: 'DRAW!', read: 0, dashed: false, delay: 1.5 },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [8, 13], [27, 13]],
    timing: {},
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Mason', time: 1.5, type: 'handoff' },
    ],
    specialLabels: [
      { x: 20, y: -2, text: 'FAKE JET\nHANDOFF', color: '#ff6600' },
      { x: 17.5, y: 13, text: '★ MASON UNTOUCHED\nMIDDLE VACATED', color: '#22c55e' },
    ],
  },

  // ── 16. SCREEN FAKE POST ───────────────────────────────────────────────
  // MIRROR OF: Screen — same formation + pump fake, but instead of dumping short, go deep
  {
    name: 'Screen Fake Post',
    formation: 'Spread',
    whenToUse: [
      'After running Screen — defense crashes on Cooper',
      'Defense selling out to stop the screen',
      'Need the big play — Greyson/Marshall wide open deep'
    ],
    notes: 'LOOKS LIKE Screen! Pump fake, but Greyson runs a real post. Defense crashes screen = TD.',
    players: {
      Braelyn:  { pos: [17.5, -3],   route: [], label: 'PUMP FAKE', read: 0, dashed: false },
      Lenox:    { pos: [17.5, 0],  route: [[12, 3], [7, 5]], label: 'CHECK', read: 3, dashed: true },
      Greyson:  { pos: [4, 0],     route: [[4, 6], [12, 14]], label: 'POST!', read: 1, dashed: false },
      Marshall: { pos: [31, 0],    route: [[31, 6], [28, 14]], label: 'POST', read: 2, dashed: false },
      Cooper:   { pos: [24, -4],     route: [[24, -3], [28, -1], [33, 3]], label: 'SCREEN (decoy)', read: 0, dashed: true,
                  motion: { from: [17.5, -5.5], to: [24, -4] }, delay: 1.0 },
    },
    defense: [[10, 5], [17.5, 7], [25, 5], [8, 13], [27, 13]],
    timing: { 1: 2.5, 2: 2.5, 3: 3.5, 4: 4.0 },
    ballPath: [
      { from: 'Lenox', to: 'Braelyn', time: 0, type: 'snap' },
      { from: 'Braelyn', to: 'Greyson', time: 2.5, type: 'throw' },
    ],
    specialLabels: [
      { x: 19.5, y: -1, text: 'PUMP FAKE\n(sell screen)', color: '#1a1a1a' },
      { x: 12, y: 16, text: '★ DEFENSE CRASHES SCREEN\nGREYSON WIDE OPEN', color: '#dc2626' },
    ],
  },
];
