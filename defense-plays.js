// defense-plays.js — Defensive schemes for flag football playbook
// Zone is the BASE defense (80% of snaps). Man is the changeup.
//
// Coordinates: X = 0-35 (sideline to sideline), Y = -10 to 18, LOS at Y=0
//
// Structure per play:
//   offense   → grey squares (the enemy — what they're trying to do)
//   defenders → colored circles (YOUR players — what WE do)
//   concept   → 'zone' | 'man'
//   qbThrowTime → when the QB releases so defenders can break

const DEFENSE_PLAYS = [

  // ══════════════════════════════════════════════════════════════════
  //  ZONE — Play 1: vs Mesh / Crossing Routes
  //  The big teaching moment: zone KILLS picks. Defenders don't chase.
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'Zone: vs Mesh',
    concept: 'zone',
    vsFormation: 'vs Spread (Mesh)',
    whenToUse: [
      'BASE DEFENSE — run this 80% of the time',
      'Offense runs Mesh / crossing routes (their best play)',
      'Zone kills picks — defenders DON\'T chase across the field',
    ],
    notes: 'KEY: Receivers cross but YOU stay in your spot. They can\'t pick you if you\'re not following anybody. Watch QB eyes — break on the ball.',
    qbThrowTime: 2.2,

    // Offense (grey squares). These are the ENEMY showing their Mesh concept.
    offense: {
      QB:  { pos: [17.5, -3], label: 'QB' },
      C:   { pos: [17.5, 0],  label: 'C' },
      WR1: { pos: [4, 0],     route: [[4, 5], [32, 5]],            label: 'MESH →' },
      WR2: { pos: [31, 0],    route: [[31, 6], [3, 6]],            label: '← MESH' },
      RB:  { pos: [17.5, -5.5], route: [[17.5, -3.5], [6, 1]],    label: 'FLAT' },
    },

    // Defenders (colored circles). YOUR players. 3 short + 2 deep.
    //   pos  = where they line up pre-snap
    //   zone = where they drop to at snap (their "spot")
    defenders: {
      LC:  { pos: [5, 3],    zone: [5, 8],    color: '#22c55e', label: 'YOUR SPOT' },
      MLB: { pos: [17.5, 4], zone: [17.5, 7], color: '#2563eb', label: 'YOUR SPOT' },
      RC:  { pos: [30, 3],   zone: [30, 8],   color: '#22c55e', label: 'YOUR SPOT' },
      LS:  { pos: [10, 9],   zone: [10, 13],  color: '#f59e0b', label: 'DEEP LEFT' },
      RS:  { pos: [25, 9],   zone: [25, 13],  color: '#dc2626', label: 'DEEP RIGHT' },
    },

    // Labels drawn on the field at specific positions
    coachingPoints: [
      { x: 17.5, y: 5.5, text: 'THEY CROSS — YOU STAY!', color: '#22c55e', showAfter: 1.5 },
      { x: 17.5, y: -7,  text: 'WATCH QB EYES',          color: '#f59e0b', showAfter: 0.5 },
      { x: 10,   y: 1,   text: 'INTERCEPTOR!',           color: '#dc2626', showAfter: 2.5 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  ZONE — Play 2: vs Screen Pass
  //  QB eyes + not chasing fakes = shutdown the screen
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'Zone: vs Screen',
    concept: 'zone',
    vsFormation: 'vs Screen Pass',
    whenToUse: [
      'Offense keeps running short passes behind LOS',
      'QB stares away from where ball is going',
      'Receivers start "blocking" downfield too early — tip-off!',
    ],
    notes: 'Zone defenders: watch the QB\'s EYES not the fake routes. Deep routes are the distraction. Read the QB, read the screen, BREAK ON IT.',
    qbThrowTime: 2.8,

    offense: {
      QB:  { pos: [17.5, -3], label: 'QB' },
      C:   { pos: [17.5, 0],  label: 'C' },
      WR1: { pos: [4, 0],     route: [[4, 8], [4, 15]],            label: 'GO ROUTE\n(FAKE)' },
      WR2: { pos: [31, 0],    route: [[31, 8], [31, 15]],          label: 'GO ROUTE\n(FAKE)' },
      RB:  { pos: [17.5, -5.5], route: [[8, -5], [6, -1], [5, 3]], label: '← SCREEN!' },
    },

    defenders: {
      LC:  { pos: [5, 3],    zone: [5, 7],    color: '#22c55e', label: 'WATCH QB' },
      MLB: { pos: [17.5, 4], zone: [17.5, 6], color: '#2563eb', label: 'WATCH QB' },
      RC:  { pos: [30, 3],   zone: [30, 7],   color: '#22c55e', label: 'WATCH QB' },
      LS:  { pos: [10, 9],   zone: [10, 12],  color: '#f59e0b', label: 'DEEP LEFT' },
      RS:  { pos: [25, 9],   zone: [25, 12],  color: '#dc2626', label: 'DEEP RIGHT' },
    },

    coachingPoints: [
      { x: 17.5, y: -7,  text: 'WATCH QB EYES\nNOT THE FAKE!', color: '#f59e0b', showAfter: 0.5 },
      { x: 31, y: 12,    text: 'FAKES —\nDON\'T CHASE!',       color: '#888',    showAfter: 1.2 },
      { x: 6,  y: 4,     text: 'BREAK ON IT!\nINTERCEPTOR!',   color: '#22c55e', showAfter: 3.0 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  MAN — Play 3: vs Spread (Changeup)
  //  Show this AFTER zone plays. "When one guy is torching zones..."
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'Man: vs Spread',
    concept: 'man',
    vsFormation: 'vs Spread (Changeup)',
    whenToUse: [
      'CHANGEUP ONLY — don\'t run this every snap',
      'One receiver is torching your zones all game',
      'Put your best defender on their best player',
    ],
    notes: 'Each defender follows ONE player everywhere. They go, you go. Keep your eyes on YOUR GUY — not the ball, not other players.',
    qbThrowTime: 2.0,

    offense: {
      QB:  { pos: [17.5, -3], label: 'QB' },
      C:   { pos: [17.5, 0],  label: 'C' },
      WR1: { pos: [4, 0],     route: [[4, 5], [32, 5]],            label: 'MESH →' },
      WR2: { pos: [31, 0],    route: [[31, 6], [3, 6]],            label: '← MESH' },
      RB:  { pos: [17.5, -5.5], route: [[17.5, -3.5], [6, 1]],    label: 'FLAT' },
    },

    // Man defenders track their 'assignment' key in offense{}
    // They mirror the route with a 0.3s delay
    defenders: {
      D1:  { pos: [6, 3],    assignment: 'WR1', color: '#dc2626', label: 'FOLLOW WR1' },
      D2:  { pos: [29, 3],   assignment: 'WR2', color: '#2563eb', label: 'FOLLOW WR2' },
      D3:  { pos: [17.5, 6], assignment: 'RB',  color: '#22c55e', label: 'FOLLOW RB' },
      LS:  { pos: [10, 10],  zone: [10, 13],    color: '#f59e0b', label: 'DEEP HELP' },
      RS:  { pos: [25, 10],  zone: [25, 13],    color: '#8b5cf6', label: 'DEEP HELP' },
    },

    coachingPoints: [
      { x: 17.5, y: -7,  text: 'YOUR GUY MOVES\nYOU MOVE',  color: '#dc2626', showAfter: 0.3 },
      { x: 17.5, y: 11,  text: 'MIRROR HIM!',               color: '#2563eb', showAfter: 1.5 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  MAN — Play 4: vs 2-Back Formation
  //  Counter / Jet Sweep. Cover both backs first.
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'Man: vs 2-Back',
    concept: 'man',
    vsFormation: 'vs 2-Back (Counter/Sweep)',
    whenToUse: [
      'Offense lines up 2 backs — big confusion threat',
      'Counter sweep or jet motion coming',
      'Put a defender on EACH back right away',
    ],
    notes: 'Two backs = two threats going opposite directions. Pick yours BEFORE the snap. Don\'t wait. Don\'t guess. Know your guy.',
    qbThrowTime: 1.8,

    offense: {
      QB:  { pos: [17.5, -3],  label: 'QB' },
      C:   { pos: [17.5, 0],   label: 'C' },
      WR1: { pos: [4, 0],      route: [[4, 8], [4, 14]],           label: 'GO' },
      WR2: { pos: [31, 0],     route: [[31, 8], [31, 14]],         label: 'GO' },
      RB1: { pos: [13, -5],    route: [[13, -3], [5, 0], [3, 5]],  label: 'SWEEP!' },
      RB2: { pos: [22, -5],    route: [[22, -3], [30, 1]],         label: 'COUNTER' },
    },

    defenders: {
      D1:  { pos: [5, 3],    assignment: 'WR1', color: '#dc2626', label: 'FOLLOW WR1' },
      D2:  { pos: [30, 3],   assignment: 'WR2', color: '#2563eb', label: 'FOLLOW WR2' },
      D3:  { pos: [13, 2],   assignment: 'RB1', color: '#22c55e', label: 'YOUR GUY →' },
      D4:  { pos: [22, 2],   assignment: 'RB2', color: '#f59e0b', label: '← YOUR GUY' },
      LS:  { pos: [17.5, 9], zone: [17.5, 13],  color: '#8b5cf6', label: 'DEEP HELP' },
    },

    coachingPoints: [
      { x: 17.5, y: -8,  text: 'PICK YOUR GUY\nBEFORE THE SNAP!',  color: '#f59e0b', showAfter: 0.0 },
      { x: 17.5, y: 10,  text: 'STAY WITH HIM!',                   color: '#dc2626', showAfter: 1.2 },
    ],
  },

];
