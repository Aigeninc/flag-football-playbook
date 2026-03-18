/**
 * Play Library — all 30 flag football plays in v2 position-based format.
 *
 * Name → Position mapping:
 *   Braelyn → QB  |  Lenox → C  |  Greyson → WR1  |  Marshall → WR2  |  Cooper → RB
 */

export const PLAY_LIBRARY = [

  // ── 1. MESH ──────────────────────────────────────────────────────────────
  {
    id: 'mesh',
    name: 'Mesh',
    formation: 'Spread',
    tags: ['core'],
    family: 'mesh',
    isRunPlay: false,
    description: {
      fake: 'Defense sees two receivers crossing — looks like a basic crossing route',
      target: 'Man coverage: crossing routes create natural picks. Hit WR1 at the mesh point for a quick, safe completion',
    },
    qbLook: {
      eyes: 'WR2',
      throw: 'WR1',
      tip: 'Look off the safety toward WR2, then hit WR1 at the mesh crossing point',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[22,3],[27,5]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [4,0],     route: [[4,5],[32,5]],  label: 'MESH',  read: 1, dashed: false },
      WR2: { pos: [24,-1],   route: [[24,6],[3,6]],  label: 'MESH',  read: 2, dashed: false, motion: { from: [31,-1], to: [24,-1] } },
      RB:  { pos: [17.5,-5.5], route: [[17.5,-3.5],[6,1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10,5],[17.5,8],[25,5],[8,13],[27,13]],
    timing: { 1:0.75, 2:2.0, 3:3.0, 4:4.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:0.75, type:'throw' },
    ],
  },

  // ── 2. FLOOD FAKE ─────────────────────────────────────────────────────────
  {
    id: 'flood-fake',
    name: 'Flood Fake',
    formation: 'Twins Right',
    tags: ['counter'],
    family: 'flood',
    isRunPlay: false,
    description: {
      fake: 'Looks exactly like Flood Right for the first second — defense jumps flat/corner combo',
      target: 'RB fakes flat then burns deep on a post. Use after running Flood Right 2–3 times',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'RB',
      tip: 'Show Flood Right with your eyes on WR1 corner, then hit RB burning deep on the post',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [27,0],    route: [[27,6],[33,15]], label: 'CORNER', read: 2, dashed: false },
      WR2: { pos: [32,0],    route: [[32,8],[34,8]],  label: 'OUT',    read: 3, dashed: false },
      RB:  { pos: [17.5,-5.5], route: [[22,-2],[30,1],[25,6],[17.5,14]], label: 'POST!', read: 1, dashed: false },
    },
    defense: [[8,7],[17,7],[26,5],[10,14],[28,12]],
    timing: { 1:2.0, 2:1.0, 3:2.5, 4:4.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'RB', time:2.0, type:'throw' },
    ],
  },

  // ── 3. FLOOD RIGHT ────────────────────────────────────────────────────────
  {
    id: 'flood-right',
    name: 'Flood Right',
    formation: 'Twins Right',
    tags: ['core'],
    family: 'flood',
    isRunPlay: false,
    description: {
      fake: 'Three receivers flood right at different depths — defense has to cover all three levels',
      target: '1st down play: high-percentage, zone-beater. Hit WR1 on corner, WR2 on out, or RB flat checkdown',
    },
    qbLook: {
      eyes: 'WR2',
      throw: 'WR1',
      tip: 'Scan right to left: corner is primary, OUT is second, flat is checkdown',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK',  read: 4, dashed: true },
      WR1: { pos: [27,0],    route: [[27,6],[33,15]], label: 'CORNER', read: 1, dashed: false },
      WR2: { pos: [32,0],    route: [[32,5],[35,5]],  label: 'OUT',    read: 2, dashed: false },
      RB:  { pos: [17.5,-5.5], route: [[22,-2],[32,2]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[8,7],[17,7],[26,5],[10,14],[28,12]],
    timing: { 1:1.0, 2:2.0, 3:3.5, 4:4.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:1.0, type:'throw' },
    ],
  },

  // ── 4. REVERSE ────────────────────────────────────────────────────────────
  {
    id: 'reverse',
    name: 'Reverse',
    formation: 'Spread',
    tags: ['trick', 'run', 'misdirection'],
    family: 'reverse',
    isRunPlay: true,
    description: {
      fake: 'QB hands off right to WR2 — defense flows right hard',
      target: 'WR1 takes the reverse handoff going left while defense is out of position',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [[21,-4]], label: 'HANDOFF', read: 0, dashed: true },
      C:   { pos: [17.5,0],  route: [[23,3],[28,5]], label: 'CHECK', read: 0, dashed: true },
      WR1: { pos: [26,-1],   route: [[20,-3],[15,-5],[10,-4],[5,-2],[2,2],[1,8],[2,15]], label: 'REVERSE!', read: 0, dashed: false, motion: { from: [4,-1], to: [26,-1] } },
      WR2: { pos: [17.5,-5.5], route: [[21,-4],[26,-3.5]], label: 'RUN RIGHT', read: 0, dashed: true },
      RB:  { pos: [31,0],    route: [[31,15]], label: 'GO (decoy)', read: 0, dashed: false },
    },
    defense: [[10,5],[17.5,7],[25,5],[7,12],[28,12]],
    timing: { 1: 0.8, 2: 1.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR2', time:0.5, type:'handoff' },
      { from:'WR2', to:'WR1', time:1.5, type:'lateral' },
    ],
  },

  // ── 5. RPO SLANT ──────────────────────────────────────────────────────────
  {
    id: 'rpo-slant',
    name: 'RPO Slant',
    formation: 'Spread',
    tags: ['rpo'],
    family: 'slant',
    isRunPlay: false,
    description: {
      fake: 'Defense sees a QB run or handoff — linebackers crash on the run',
      target: 'Read the linebacker: if he crashes, hand to WR2; if he drops into coverage, throw WR1 slant',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'WR1',
      tip: 'Read the linebacker: if he crashes on WR2 run, hand off; if he drops into coverage, throw WR1 slant',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [[19,-4]], label: '', read: 0, dashed: true },
      C:   { pos: [17.5,0],  route: [[23,3],[28,5]], label: 'CHECK', read: 2, dashed: true },
      WR1: { pos: [4,0],     route: [[4,2],[14,7]], label: 'SLANT', read: 1, dashed: false },
      WR2: { pos: [17.5,-5.5], route: [[19,-4],[26,-1]], label: 'RUN?', read: 0, dashed: true },
      RB:  { pos: [31,0],    route: [[31,14]], label: 'GO (clear)', read: 0, dashed: false },
    },
    defense: [[10,5],[17.5,6],[25,5],[7,12],[28,12]],
    timing: { 1:1.0, 2:2.0, 3:3.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:1.0, type:'throw' },
    ],
  },

  // ── 6. QUICK SLANTS NRZ ───────────────────────────────────────────────────
  {
    id: 'quick-slants-nrz',
    name: 'Quick Slants NRZ',
    formation: 'Spread',
    tags: ['core', 'nrz'],
    family: 'slant',
    isRunPlay: false,
    description: {
      fake: 'Both wide receivers fire off the line fast — defense scrambles to identify routes',
      target: 'Quick 1-count throw to either slant; RB flat is the hot checkdown in the No-Run Zone',
    },
    qbLook: {
      eyes: 'WR2',
      throw: 'WR1',
      tip: 'Both slants hit simultaneously — fire to the open one, WR1 first',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [4,0],     route: [[4,2],[12,5]], label: 'SLANT', read: 1, dashed: false },
      WR2: { pos: [31,0],    route: [[31,2],[23,5]], label: 'SLANT', read: 2, dashed: false },
      RB:  { pos: [17.5,-5.5], route: [[17.5,-3.5],[28,1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10,4],[17.5,6],[25,4],[8,9],[27,9]],
    timing: { 1:0.8, 2:1.0, 3:2.0, 4:3.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:0.8, type:'throw' },
    ],
  },

  // ── 7. FLAT-WHEEL ─────────────────────────────────────────────────────────
  {
    id: 'flat-wheel',
    name: 'Flat-Wheel',
    formation: 'RB Offset Right',
    tags: ['deep', 'nrz'],
    family: 'wheel',
    isRunPlay: false,
    description: {
      fake: 'RB leaks flat — cornerback commits to stopping the flat',
      target: 'WR2 runs a wheel route up the sideline; RB flat clears the corner. Good in No-Run Zone',
    },
    qbLook: {
      eyes: 'RB',
      throw: 'WR2',
      tip: 'Look toward RB flat to hold the corner, then hit WR2 on the wheel breaking deep',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [4,0],     route: [[4,2],[12,6]], label: 'SLANT', read: 2, dashed: false },
      WR2: { pos: [31,0],    route: [[33,2],[33,8],[33,15]], label: 'WHEEL!', read: 1, dashed: false },
      RB:  { pos: [24,-2],   route: [[28,0],[33,2]], label: 'FLAT (decoy)', read: 3, dashed: false },
    },
    defense: [[10,3],[17.5,5],[25,3],[6,10],[29,10]],
    timing: { 1:2.0, 2:1.5, 3:1.0, 4:4.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR2', time:2.0, type:'throw' },
    ],
  },

  // ── 8. BRAELYN LATERAL ────────────────────────────────────────────────────
  {
    id: 'braelyn-lateral',
    name: 'Braelyn Lateral',
    formation: 'Spread (WR2 offset)',
    tags: ['trick'],
    family: 'lateral',
    isRunPlay: false,
    description: {
      fake: 'Defense watches the lateral to WR2 — they\'re not watching QB who keeps running',
      target: 'QB laterals to WR2 who becomes the passer; QB runs into space and gets the ball back',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [[20,-3],[20,-2],[25,4]], label: 'FLAT', read: 1, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [4,0],     route: [[4,3],[14,8]], label: 'SLANT', read: 2, dashed: false },
      WR2: { pos: [22,-5],   route: [], label: '2nd QB — THROW', read: 0, dashed: false },
      RB:  { pos: [31,0],    route: [[31,15]], label: 'GO (clear)', read: 3, dashed: false },
    },
    defense: [[10,5],[17.5,7],[25,5],[7,13],[28,13]],
    timing: { 1:1.5, 2:2.0, 3:3.0, 4:4.0 },
    ballPath: [
      { from:'C',  to:'QB',  time:0,   type:'snap' },
      { from:'QB', to:'WR2', time:0.5, type:'lateral' },
      { from:'WR2',to:'QB',  time:1.5, type:'throw' },
    ],
  },

  // ── 9. FLOOD LEFT ─────────────────────────────────────────────────────────
  {
    id: 'flood-left',
    name: 'Flood Left',
    formation: 'Twins Left',
    tags: ['counter'],
    family: 'flood',
    isRunPlay: false,
    description: {
      fake: 'Flood overload to the left — mirror image of Flood Right to keep defense guessing',
      target: 'Three-level flood left: WR1 corner, WR2 out, RB flat checkdown',
    },
    qbLook: {
      eyes: 'WR2',
      throw: 'WR1',
      tip: 'Mirror of Flood Right — primary is WR1 corner route, same read progression',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[23,3],[28,5]], label: 'CHECK',  read: 4, dashed: true },
      WR1: { pos: [8,0],     route: [[8,6],[2,15]],  label: 'CORNER', read: 1, dashed: false },
      WR2: { pos: [3,0],     route: [[3,5],[0,5]],   label: 'OUT',    read: 2, dashed: false },
      RB:  { pos: [17.5,-5.5], route: [[13,-2],[3,2]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[8,5],[17,7],[27,7],[7,12],[25,14]],
    timing: { 1:1.0, 2:2.0, 3:3.5, 4:4.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:1.0, type:'throw' },
    ],
  },

  // ── 10. HITCH & GO ────────────────────────────────────────────────────────
  {
    id: 'hitch-and-go',
    name: 'Hitch & Go',
    formation: 'Spread',
    tags: ['deep'],
    family: 'hitch',
    isRunPlay: false,
    description: {
      fake: 'WR2 runs a hitch route — cornerback bites on the short route',
      target: 'WR1 sells a hitch then breaks deep on a go route once corner is frozen',
    },
    qbLook: {
      eyes: 'WR2',
      throw: 'WR1',
      tip: 'Look at WR2 hitch to hold the safety, then unload deep to WR1 on the go',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[22,3],[28,5]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [4,0],     route: [[4,5],[4,4],[3.5,3.5],[4,4],[4,5],[4,15]], label: 'GO!', read: 1, dashed: false },
      WR2: { pos: [11,-1],   route: [[11,5],[11,4]], label: 'HITCH', read: 2, dashed: false, motion: { from: [31,-1], to: [11,-1] } },
      RB:  { pos: [17.5,-5.5], route: [[17.5,-3.5],[6,1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10,4],[17.5,7],[25,4],[8,12],[27,12]],
    timing: { 1:3.0, 2:1.5, 3:2.5, 4:4.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:3.0, type:'throw' },
    ],
  },

  // ── 11. SCREEN ────────────────────────────────────────────────────────────
  {
    id: 'screen',
    name: 'Screen',
    formation: 'Spread',
    tags: ['core'],
    family: 'screen',
    isRunPlay: false,
    description: {
      fake: 'QB pump fakes deep with WR1 and WR2 clearing out — defense chases the deep routes',
      target: 'RB slips out behind the coverage for a screen pass with open field ahead',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'RB',
      tip: 'Pump fake deep to hold defenders, then quickly dump off to RB on the screen',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: 'PUMP FAKE', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 2, dashed: true },
      WR1: { pos: [4,0],     route: [[4,15]], label: 'GO (sell deep)', read: 0, dashed: true },
      WR2: { pos: [31,0],    route: [[31,15]], label: 'GO (sell deep)', read: 0, dashed: true },
      RB:  { pos: [24,-4],   route: [[24,-3],[28,-1],[33,3]], label: 'SCREEN!', read: 1, dashed: false, motion: { from: [17.5,-5.5], to: [24,-4] } },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1:2.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'RB', time:2.5, type:'throw' },
    ],
  },

  // ── 12. REVERSE FAKE ──────────────────────────────────────────────────────
  {
    id: 'reverse-fake',
    name: 'Reverse Fake',
    formation: 'Spread',
    tags: ['counter'],
    family: 'reverse',
    isRunPlay: false,
    description: {
      fake: 'WR2 fakes run right and WR1 shows reverse motion — defense reacts hard to both',
      target: 'WR1 slant is wide open after defense chases the reverse action',
    },
    qbLook: {
      eyes: 'WR2',
      throw: 'WR1',
      tip: 'Fake the reverse with pump, then throw slant to WR1 coming back inside',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: 'PUMP FAKE', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[23,3],[28,5]], label: 'CHECK', read: 3, dashed: true },
      WR1: { pos: [31,0],    route: [[31,3],[23,8]], label: 'SLANT!', read: 1, dashed: false },
      WR2: { pos: [17.5,-5.5], route: [[21,-4],[26,-3.5]], label: 'FAKE RUN', read: 0, dashed: true },
      RB:  { pos: [26,-1],   route: [[20,-3],[15,-4],[10,-3],[5,1],[3,5]], label: 'FAKE REVERSE', read: 2, dashed: true, motion: { from: [4,-1], to: [26,-1] } },
    },
    defense: [[10,5],[17.5,7],[25,5],[7,12],[28,12]],
    timing: { 1:1.5, 2:2.5, 3:3.0, 4:4.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:1.5, type:'throw' },
    ],
  },

  // ── 13. FADE ──────────────────────────────────────────────────────────────
  {
    id: 'fade',
    name: 'Fade',
    formation: 'Spread',
    tags: ['core', 'nrz', 'deep'],
    family: 'fade',
    isRunPlay: false,
    description: {
      fake: 'WR1 slant occupies inside corner — defense over-rotates inside',
      target: 'WR2 fade to the back corner is a 1-on-1 matchup outside. Great in No-Run Zone',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'WR2',
      tip: 'Look inside at WR1 slant to pull the safety, then throw to WR2 fade on the sideline',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [4,0],     route: [[4,2],[12,6]], label: 'SLANT', read: 2, dashed: false },
      WR2: { pos: [31,0],    route: [[33,5],[34,14]], label: 'FADE!', read: 1, dashed: false },
      RB:  { pos: [17.5,-5.5], route: [[17.5,-3.5],[28,1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10,4],[17.5,6],[25,4],[8,9],[27,9]],
    timing: { 1:2.0, 2:1.5, 3:2.5, 4:4.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR2', time:2.0, type:'throw' },
    ],
  },

  // ── 14. MESH WHEEL ────────────────────────────────────────────────────────
  {
    id: 'mesh-wheel',
    name: 'Mesh Wheel',
    formation: 'Spread',
    tags: ['counter', 'deep'],
    family: 'mesh',
    isRunPlay: false,
    description: {
      fake: 'Looks like standard Mesh crossing — defense follows the mesh routes',
      target: 'RB motions out then runs a wheel route deep while WR1 mesh clears underneath coverage',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'RB',
      tip: 'Look off the safety on WR1 mesh, then hit RB on the wheel breaking deep',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[22,3],[27,5]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [4,0],     route: [[4,5],[32,5]], label: 'MESH', read: 2, dashed: false },
      WR2: { pos: [17.5,-5.5], route: [[17.5,-3.5],[6,1]], label: 'FLAT', read: 3, dashed: false },
      RB:  { pos: [24,-1],   route: [[24,3],[22,4],[23,5],[24,6],[26,10],[27,15]], label: 'WHEEL!', read: 1, dashed: false, motion: { from: [31,-1], to: [24,-1] } },
    },
    defense: [[10,5],[17.5,8],[25,5],[8,13],[27,13]],
    timing: { 1:2.5, 2:1.5, 3:3.0, 4:4.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'RB', time:2.5, type:'throw' },
    ],
  },

  // ── 15. SLANT & GO ────────────────────────────────────────────────────────
  {
    id: 'slant-and-go',
    name: 'Slant & Go',
    formation: 'Spread',
    tags: ['deep', 'counter'],
    family: 'slant',
    isRunPlay: false,
    description: {
      fake: 'WR1 breaks on a slant — cornerback bites up for the quick slant',
      target: 'WR1 sells slant then releases deep on a go route once corner is frozen',
    },
    qbLook: {
      eyes: 'WR2',
      throw: 'WR1',
      tip: 'Look off at WR2 slant first, then fire deep to WR1 on the go',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [4,0],     route: [[4,2],[8,3],[6,4],[4,5],[2,10],[1,15]], label: 'GO!', read: 1, dashed: false },
      WR2: { pos: [31,0],    route: [[31,2],[23,5]], label: 'SLANT', read: 2, dashed: false },
      RB:  { pos: [17.5,-5.5], route: [[17.5,-3.5],[28,1]], label: 'FLAT', read: 3, dashed: false },
    },
    defense: [[10,4],[17.5,6],[25,4],[8,9],[27,9]],
    timing: { 1:2.5, 2:1.0, 3:2.0, 4:3.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:2.5, type:'throw' },
    ],
  },

  // ── 16. SCREEN FAKE POST ─────────────────────────────────────────────────
  {
    id: 'screen-fake-post',
    name: 'Screen Fake Post',
    formation: 'Spread',
    tags: ['counter'],
    family: 'screen',
    isRunPlay: false,
    description: {
      fake: 'RB leaks out on a screen — safety commits to stopping the screen',
      target: 'WR1 and WR2 run post routes behind the safety who bit on the screen fake',
    },
    qbLook: {
      eyes: 'RB',
      throw: 'WR1',
      tip: 'Pump toward the screen to freeze the safety, then hit WR1 on the post',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: 'PUMP FAKE', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 3, dashed: true },
      WR1: { pos: [4,0],     route: [[4,6],[12,14]], label: 'POST!', read: 1, dashed: false },
      WR2: { pos: [31,0],    route: [[31,6],[28,14]], label: 'POST', read: 2, dashed: false },
      RB:  { pos: [24,-4],   route: [[24,-3],[28,-1],[33,3]], label: 'SCREEN (decoy)', read: 0, dashed: true, motion: { from: [17.5,-5.5], to: [24,-4] } },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1:2.5, 2:2.5, 3:3.5, 4:4.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:2.5, type:'throw' },
    ],
  },

  // ── 17. JET SWEEP ─────────────────────────────────────────────────────────
  {
    id: 'jet-sweep',
    name: 'Jet Sweep',
    formation: 'Spread',
    tags: ['run', 'trick', 'misdirection'],
    family: 'jet',
    isRunPlay: true,
    description: {
      fake: 'WR1 motions pre-snap at full speed across the formation — defense follows the motion',
      target: 'WR1 takes a jet handoff and sweeps right while WR2 pulls the safety deep',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [[20,-2]], label: 'HANDOFF', read: 0, dashed: true },
      C:   { pos: [17.5,0],  route: [[23,3],[28,5]], label: '', read: 0, dashed: true },
      WR1: { pos: [21,-2],   route: [[26,-1],[33,2],[35,10]], label: 'JET SWEEP!', read: 0, dashed: false, motion: { from: [4,-1], to: [21,-2] } },
      WR2: { pos: [3,0],     route: [[3,15]], label: 'GO (pull safety)', read: 0, dashed: false },
      RB:  { pos: [31,0],    route: [[31,8]], label: 'GO (clear)', read: 0, dashed: true },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1: 0.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:0.5, type:'handoff' },
    ],
  },

  // ── 18. RB DRAW ───────────────────────────────────────────────────────────
  {
    id: 'rb-draw',
    name: 'RB Draw',
    formation: 'Spread',
    tags: ['run'],
    family: 'draw',
    isRunPlay: true,
    description: {
      fake: 'QB drops back like a pass play — linebackers drop into coverage',
      target: 'WR1 sneaks up the middle on a draw while linebackers are in pass coverage',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [[17.5,-6]], label: 'FAKE PASS', read: 0, dashed: true },
      C:   { pos: [17.5,0],  route: [], label: '', read: 0, dashed: false },
      WR1: { pos: [21,-5],   route: [[18,-3],[17.5,2],[17.5,12]], label: 'DRAW!', read: 0, dashed: false },
      WR2: { pos: [3,0],     route: [[3,15]], label: 'GO (sell pass)', read: 0, dashed: true },
      RB:  { pos: [31,0],    route: [[31,15]], label: 'GO (sell pass)', read: 0, dashed: true },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: {},
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:1.5, type:'handoff' },
    ],
  },

  // ── 19. END AROUND ────────────────────────────────────────────────────────
  {
    id: 'end-around',
    name: 'End Around',
    formation: 'Spread',
    tags: ['run', 'trick', 'misdirection'],
    family: 'reverse',
    isRunPlay: true,
    description: {
      fake: 'WR1 and WR2 both fake left — entire defense shifts left',
      target: 'WR1 motions from right and takes a handoff sweeping right while defense is going left',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [[20,-4]], label: 'HANDOFF', read: 0, dashed: true },
      C:   { pos: [17.5,0],  route: [[23,3],[28,5]], label: '', read: 0, dashed: true },
      WR1: { pos: [20,-4],   route: [[26,-3],[33,-1],[35,5],[34,14]], label: 'END AROUND!', read: 0, dashed: false, motion: { from: [31,-1], to: [20,-4] } },
      WR2: { pos: [3,0],     route: [[3,5],[8,2]], label: 'FAKE LEFT', read: 0, dashed: true },
      RB:  { pos: [31,0],    route: [[31,5],[25,2]], label: 'FAKE LEFT', read: 0, dashed: true },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1: 1.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:0.5, type:'handoff' },
    ],
  },

  // ── 20. RPO FLOOD ─────────────────────────────────────────────────────────
  {
    id: 'rpo-flood',
    name: 'RPO Flood',
    formation: 'Twins Right',
    tags: ['rpo'],
    family: 'flood',
    isRunPlay: false,
    description: {
      fake: 'WR1 sweeps right on a run — defense flows toward the run',
      target: 'Read corner: hand off to WR1 if they crash, or hit WR2 corner route if they chase the run',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'WR2',
      tip: 'Read the corner: hand off if they drop into coverage, throw WR2 corner if they crash on the run',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 3, dashed: true },
      WR1: { pos: [22,-5],   route: [[26,-3],[33,0],[35,8]], label: 'RUN RIGHT', read: 0, dashed: false },
      WR2: { pos: [27,0],    route: [[27,6],[33,15]], label: 'CORNER', read: 1, dashed: false },
      RB:  { pos: [33,0],    route: [[33,5],[35,5]], label: 'OUT', read: 2, dashed: false },
    },
    defense: [[8,7],[17,7],[26,5],[10,14],[28,12]],
    timing: { 1:1.0, 2:2.0, 3:3.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR2', time:1.0, type:'throw' },
    ],
  },

  // ── 21. TRIPLE OPTION ─────────────────────────────────────────────────────
  {
    id: 'triple-option',
    name: 'Triple Option',
    formation: 'Spread',
    tags: ['rpo'],
    family: 'option',
    isRunPlay: true,
    description: {
      fake: 'QB reads all three options pre-snap — defense has to commit somewhere',
      target: 'Three-read option: give to WR1 right, throw WR2 deep, or check to RB out at 8yds',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [[14,-2],[10,-2]], label: 'READS', read: 0, dashed: true },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 3, dashed: true },
      WR1: { pos: [22,-5],   route: [[26,-3],[33,0],[35,8]], label: 'RUN RIGHT', read: 0, dashed: false },
      WR2: { pos: [31,0],    route: [[31,15]], label: 'GO DEEP', read: 1, dashed: false },
      RB:  { pos: [3,0],     route: [[3,8],[5,8]], label: 'OUT 8yd', read: 2, dashed: false },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1:0.5, 2:2.0, 3:2.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:0.3, type:'handoff' },
    ],
  },

  // ── 22. BUBBLE SCREEN ────────────────────────────────────────────────────
  {
    id: 'bubble-screen',
    name: 'Bubble Screen',
    formation: 'Spread',
    tags: ['quick'],
    family: 'screen',
    isRunPlay: false,
    description: {
      fake: 'WR1 and WR2 clear vertically — corners follow them deep',
      target: 'RB bubbles into the flat for an instant throw — like a run play in the passing game',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'RB',
      tip: 'Barely look right at WR1, then instantly fire to RB bubble — no hesitation',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [], label: '', read: 0, dashed: false },
      WR1: { pos: [4,0],     route: [[4,15]], label: 'GO (clear)', read: 0, dashed: true },
      WR2: { pos: [31,0],    route: [[31,10]], label: 'GO (clear)', read: 0, dashed: true },
      RB:  { pos: [27,-2],   route: [[27,-2],[32,2],[34,8]], label: 'BUBBLE!', read: 1, dashed: false, motion: { from: [33,0], to: [27,-2] } },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1:0.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'RB', time:0.5, type:'throw' },
    ],
  },

  // ── 23. QUICK HITCH ───────────────────────────────────────────────────────
  {
    id: 'quick-hitch',
    name: 'Quick Hitch',
    formation: 'Spread',
    tags: ['quick'],
    family: 'hitch',
    isRunPlay: false,
    description: {
      fake: 'Defense plays back expecting a longer developing route',
      target: 'WR1 runs a quick hitch for an easy completion — ideal on short yardage and to get timing right',
    },
    qbLook: {
      eyes: 'WR2',
      throw: 'WR1',
      tip: 'Quick 1-count throw to WR1 hitch — look off briefly at WR2 then fire',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[7,5]], label: 'CHECK', read: 3, dashed: true },
      WR1: { pos: [4,0],     route: [[4,5],[4,4]], label: 'HITCH', read: 1, dashed: false },
      WR2: { pos: [31,0],    route: [[31,14]], label: 'GO (clear)', read: 0, dashed: true },
      RB:  { pos: [17.5,-5.5], route: [[17.5,-3.5],[28,1]], label: 'FLAT (clear)', read: 2, dashed: true },
    },
    defense: [[10,4],[17.5,6],[25,4],[8,9],[27,9]],
    timing: { 1:1.0, 2:2.0, 3:3.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:1.0, type:'throw' },
    ],
  },

  // ── 24. JET BUBBLE ────────────────────────────────────────────────────────
  {
    id: 'jet-bubble',
    name: 'Jet Bubble',
    formation: 'Spread',
    tags: ['quick', 'counter'],
    family: 'jet',
    isRunPlay: false,
    description: {
      fake: 'WR1 runs jet sweep motion — defense shifts to stop the jet',
      target: 'RB bubbles left into the vacated space while defense chases the jet fake',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'RB',
      tip: 'Freeze defense with WR1 jet motion, then instantly throw to RB bubble opposite side',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [], label: '', read: 0, dashed: false },
      WR1: { pos: [21,-2],   route: [[26,-1],[33,2]], label: 'JET FAKE', read: 0, dashed: true, motion: { from: [4,-1], to: [21,-2] } },
      WR2: { pos: [3,0],     route: [[3,14]], label: 'GO (clear)', read: 0, dashed: true },
      RB:  { pos: [8,-2],    route: [[8,-2],[3,2],[1,8]], label: 'BUBBLE!', read: 1, dashed: false, motion: { from: [14,0], to: [8,-2] } },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1:0.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'RB', time:0.5, type:'throw' },
    ],
  },

  // ── 25. FAKE JET DRAW ─────────────────────────────────────────────────────
  {
    id: 'fake-jet-draw',
    name: 'Fake Jet Draw',
    formation: 'Spread',
    tags: ['run', 'counter', 'misdirection'],
    family: 'jet',
    isRunPlay: true,
    description: {
      fake: 'WR1 runs full-speed jet sweep motion — entire defense shifts to stop the jet',
      target: 'RB draws up the middle while every defender is chasing WR1 to the right',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [[20,-2]], label: 'FAKE HANDOFF', read: 0, dashed: true },
      C:   { pos: [17.5,0],  route: [], label: '', read: 0, dashed: false },
      WR1: { pos: [21,-2],   route: [[26,-1],[33,2]], label: 'FAKE JET!', read: 0, dashed: true, motion: { from: [4,-1], to: [21,-2] } },
      WR2: { pos: [3,0],     route: [[3,14]], label: 'GO (decoy)', read: 0, dashed: true },
      RB:  { pos: [17.5,-5.5], route: [[17.5,-3],[17.5,2],[17.5,12]], label: 'DRAW!', read: 0, dashed: false },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1: 1.2 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'RB', time:1.0, type:'handoff' },
    ],
  },

  // ── 26. COUNTER SWEEP ─────────────────────────────────────────────────────
  {
    id: 'counter-sweep',
    name: 'Counter Sweep',
    formation: 'Double-Back',
    tags: ['run', 'misdirection'],
    family: 'counter',
    isRunPlay: true,
    description: {
      fake: 'WR2 fakes left — linebackers and corners crash left',
      target: 'WR1 takes a handoff counter-sweeping right into the vacated space',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [[15,-4]], label: 'FAKE + HAND', read: 0, dashed: true },
      C:   { pos: [17.5,0],  route: [], label: '', read: 0, dashed: false },
      WR1: { pos: [12,-5],   route: [[16,-3],[22,-1],[29,1],[33,6]], label: 'BALL CARRIER', read: 0, dashed: false },
      WR2: { pos: [23,-5],   route: [[18,-3],[12,-1],[7,1]], label: 'FAKE LEFT', read: 0, dashed: true },
      RB:  { pos: [31,0],    route: [[31,15]], label: 'GO (decoy)', read: 0, dashed: true },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1: 0.8 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:0.6, type:'handoff' },
    ],
  },

  // ── 27. COUNTER LEFT ──────────────────────────────────────────────────────
  {
    id: 'counter-left',
    name: 'Counter Left',
    formation: 'Double-Back',
    tags: ['run', 'misdirection'],
    family: 'counter',
    isRunPlay: true,
    description: {
      fake: 'WR1 fakes right — defense flows right',
      target: 'WR2 takes a counter-handoff sweeping left while defense over-pursues right',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [[20,-4]], label: 'FAKE + HAND', read: 0, dashed: true },
      C:   { pos: [17.5,0],  route: [], label: '', read: 0, dashed: false },
      WR1: { pos: [12,-5],   route: [[17,-3],[23,-1],[28,1]], label: 'FAKE RIGHT', read: 0, dashed: true },
      WR2: { pos: [23,-5],   route: [[19,-3],[13,-1],[6,1],[2,6]], label: 'BALL CARRIER', read: 0, dashed: false },
      RB:  { pos: [4,0],     route: [[4,15]], label: 'GO (decoy)', read: 0, dashed: true },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1: 0.8 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR2', time:0.6, type:'handoff' },
    ],
  },

  // ── 28. PLAY ACTION BOOT ──────────────────────────────────────────────────
  {
    id: 'play-action-boot',
    name: 'Play Action Boot',
    formation: 'Double-Back',
    tags: ['counter'],
    family: 'boot',
    isRunPlay: false,
    description: {
      fake: 'WR1 fakes a run carry right — linebackers flow right to stop the run',
      target: 'QB boots left away from the fake; RB runs a flat route into the vacated space',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'RB',
      tip: 'Show the run fake right, then boot left — RB flat should be wide open',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [[20,-4],[15,-2],[8,-1]], label: 'BOOT LEFT', read: 0, dashed: true },
      C:   { pos: [17.5,0],  route: [], label: '', read: 0, dashed: false },
      WR1: { pos: [12,-5],   route: [[18,-3],[24,-1]], label: 'FAKE CARRY', read: 0, dashed: true },
      WR2: { pos: [4,0],     route: [[4,15]], label: 'GO (clear)', read: 0, dashed: true },
      RB:  { pos: [23,-5],   route: [[20,-3],[13,-1],[6,2],[3,4]], label: 'FLAT!', read: 1, dashed: false },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 1:2.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'RB', time:2.0, type:'throw' },
    ],
  },

  // ── 29. (Hook & Ladder removed — lateral downfield is illegal per league rules) ──

  // ── 30. I-BONE ────────────────────────────────────────────────────────────
  {
    id: 'i-bone',
    name: 'I-Bone',
    formation: 'Stack / I-Bone',
    tags: ['run', 'rpo'],
    family: 'option',
    isRunPlay: true,
    description: {
      fake: 'Two backs stacked behind QB — defense has to defend both directions',
      target: 'QB reads defense and hands to WR1 going right or WR2 going left; RB runs a slant as a pass option',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: 'READ + HAND', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [], label: '', read: 0, dashed: false },
      WR1: { pos: [17.5,-5], route: [[22,-3],[28,-1],[33,3]], label: 'RIGHT', read: 0, dashed: false },
      WR2: { pos: [17.5,-8], route: [[13,-5],[7,-2],[2,2]], label: 'LEFT', read: 0, dashed: false },
      RB:  { pos: [31,0],    route: [[31,2],[26,5]], label: 'SLANT (if covered)', read: 2, dashed: false },
    },
    defense: [[10,5],[17.5,7],[25,5],[8,13],[27,13]],
    timing: { 2:1.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:0.4, type:'handoff' },
    ],
  },

  // ── SLANT-FLAT ────────────────────────────────────────────────────────────
  {
    id: 'slant-flat',
    name: 'Slant-Flat',
    formation: 'Spread',
    tags: ['quick', 'core'],
    family: 'quick-game',
    isRunPlay: false,
    description: {
      fake: 'WR1 fires off the line on a quick slant — flat defender has to respect it',
      target: 'Read the flat defender: he drops on slant → throw flat to RB; he jumps flat → hit WR1 on slant. Zone killer.',
    },
    qbLook: {
      eyes: 'RB',
      throw: 'WR1',
      tip: 'Eyes on RB flat to hold the flat defender, then fire WR1 on the slant',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[17.5,3],[17.5,5]], label: 'BLOCK', read: 0, dashed: true },
      WR1: { pos: [5,0],     route: [[5,2],[12,6]],      label: 'SLANT', read: 1, dashed: false },
      WR2: { pos: [31,0],    route: [[31,6],[31,12],[26,15]], label: 'DEEP', read: 0, dashed: true },
      RB:  { pos: [17.5,-5.5], route: [[10,-2],[5,1]],   label: 'FLAT',  read: 2, dashed: false },
    },
    defense: [[8,5],[17.5,7],[27,5],[5,12],[28,12]],
    timing: { 1:1.0, 2:1.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:1.0, type:'throw' },
    ],
  },

  // ── QUICK OUT ─────────────────────────────────────────────────────────────
  {
    id: 'quick-out',
    name: 'Quick Out',
    formation: 'Twins Right',
    tags: ['quick', 'core'],
    family: 'quick-game',
    isRunPlay: false,
    description: {
      fake: 'WR2 slants underneath — defense follows the inside move',
      target: 'WR1 breaks sharp to the sideline on a 5-yard out. Fastest throw in the book — 3-step drop and fire before coverage arrives.',
    },
    qbLook: {
      eyes: 'WR2',
      throw: 'WR1',
      tip: 'Quick 3-step drop, glance at WR2 slant inside, then fire immediately to WR1 on the out',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[8,5]], label: 'CHECK', read: 3, dashed: true },
      WR1: { pos: [28,0],    route: [[28,5],[34,5]], label: 'OUT',   read: 1, dashed: false },
      WR2: { pos: [33,0],    route: [[33,3],[26,6]], label: 'SLANT', read: 0, dashed: true },
      RB:  { pos: [17.5,-5.5], route: [[14,-2],[10,2]], label: 'CHECK', read: 2, dashed: false },
    },
    defense: [[10,6],[17.5,7],[28,4],[14,13],[30,10]],
    timing: { 1:0.9, 2:2.0, 3:3.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:0.9, type:'throw' },
    ],
  },

  // ── STICK CONCEPT ─────────────────────────────────────────────────────────
  {
    id: 'stick',
    name: 'Stick Concept',
    formation: 'Spread',
    tags: ['quick', 'core'],
    family: 'quick-game',
    isRunPlay: false,
    description: {
      fake: 'WR2 running flat draws outside linebacker — opens the middle',
      target: 'WR1 stops at 5 yards and sits in the zone hole (stick/stop route). RB wheels up the sideline for a 3-level stretch that kills zone.',
    },
    qbLook: {
      eyes: 'WR2',
      throw: 'WR1',
      tip: 'Look flat side at WR2 to clear the hook zone, then hit WR1 on the stick. If he\'s covered, wheel to RB late.',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[17.5,3]], label: 'BLOCK', read: 0, dashed: true },
      WR1: { pos: [5,0],     route: [[5,5]],          label: 'STICK',  read: 1, dashed: false },
      WR2: { pos: [31,0],    route: [[31,2],[35,2]],   label: 'FLAT',   read: 2, dashed: false },
      RB:  { pos: [17.5,-5.5], route: [[22,-2],[32,1],[33,8],[31,15]], label: 'WHEEL', read: 3, dashed: false },
    },
    defense: [[8,5],[17.5,8],[28,5],[6,13],[29,12]],
    timing: { 1:1.0, 2:1.5, 3:2.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR1', time:1.0, type:'throw' },
    ],
  },

  // ── SPACING ───────────────────────────────────────────────────────────────
  {
    id: 'spacing',
    name: 'Spacing',
    formation: 'Spread',
    tags: ['quick', 'core'],
    family: 'quick-game',
    isRunPlay: false,
    description: {
      fake: 'Looks like multiple routes going everywhere — defense frozen reading options',
      target: 'Every receiver finds a gap in zone at a different level. Overwhelms zone with evenly spaced options. Read the first open window.',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'WR2',
      tip: 'Eyes right on WR1 out to hold the corner, then come back to WR2 drag underneath. RB hook is the checkdown if both are covered.',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[17.5,4]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [30,0],    route: [[30,5],[34,8]],   label: 'OUT',  read: 3, dashed: false },
      WR2: { pos: [5,0],     route: [[5,2],[14,4]],    label: 'DRAG', read: 1, dashed: false },
      RB:  { pos: [17.5,-5.5], route: [[17.5,-2],[17.5,6]], label: 'HOOK', read: 2, dashed: false },
    },
    defense: [[8,6],[17.5,9],[28,6],[7,14],[28,14]],
    timing: { 1:1.0, 2:1.5, 3:2.0, 4:3.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR2', time:1.0, type:'throw' },
    ],
  },

  // ── SNAG CONCEPT ─────────────────────────────────────────────────────────
  {
    id: 'snag',
    name: 'Snag Concept',
    formation: 'Twins Right',
    tags: ['quick'],
    family: 'quick-game',
    isRunPlay: false,
    description: {
      fake: 'RB flat route draws the flat defender wide — he can\'t cover all three levels',
      target: 'Triangle read: WR2 snag/hitch sits in the zone gap, WR1 runs the corner over the top. Flat defender must choose one — hit whoever he doesn\'t cover.',
    },
    qbLook: {
      eyes: 'RB',
      throw: 'WR2',
      tip: 'Look at RB flat to freeze the flat defender, then come back to WR2 snag in the hole. If he crashes, throw the corner to WR1.',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[12,3],[8,5]], label: 'CHECK', read: 4, dashed: true },
      WR1: { pos: [28,0],    route: [[28,7],[33,14]], label: 'CORNER', read: 3, dashed: false },
      WR2: { pos: [33,0],    route: [[33,5]],         label: 'SNAG',   read: 1, dashed: false },
      RB:  { pos: [17.5,-5.5], route: [[22,-2],[32,1]], label: 'FLAT', read: 2, dashed: false },
    },
    defense: [[10,6],[17.5,7],[28,4],[14,13],[31,11]],
    timing: { 1:1.0, 2:1.5, 3:2.5, 4:4.0 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR2', time:1.0, type:'throw' },
    ],
  },

  // ── DOUBLE-BACK POWER RIGHT ───────────────────────────────────────────────
  {
    id: 'power-right',
    name: 'Power Right',
    formation: 'Double-Back',
    tags: ['run'],
    family: 'double-back',
    isRunPlay: true,
    description: {
      fake: 'WR1 leads as a blocker — defense sees a pulling guard and crashes down',
      target: 'WR2 takes the direct handoff and runs right behind WR1\'s lead block. Old school power run behind a lead blocker.',
    },
    qbLook: null,
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: 'READ + HAND', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [], label: '', read: 0, dashed: false },
      WR1: { pos: [13,-5],   route: [[17,-3],[22,-1],[27,3]], label: 'LEAD', read: 0, dashed: false },
      WR2: { pos: [22,-5],   route: [[22,-3],[27,-1],[32,4]], label: 'CARRY', read: 1, dashed: false },
      RB:  { pos: [31,0],    route: [[31,3],[28,7]], label: 'DECOY', read: 0, dashed: true },
    },
    defense: [[8,4],[17.5,6],[27,4],[10,12],[27,12]],
    timing: { 1:0.6 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR2', time:0.6, type:'handoff' },
    ],
  },

  // ── DOUBLE-BACK FLAT-SEAM ─────────────────────────────────────────────────
  {
    id: 'double-back-flat-seam',
    name: 'Double-Back Flat-Seam',
    formation: 'Double-Back',
    tags: ['counter'],
    family: 'double-back',
    isRunPlay: false,
    description: {
      fake: 'WR1 flat forces linebackers to rotate outside — seam opens up the middle',
      target: 'WR2 runs the seam straight up the middle while LBs chase the flat. Defense has to pick one — they can\'t cover both.',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'WR2',
      tip: 'Look left at WR1 flat to pull the LBs, then drill WR2 on the seam up the gut',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[17.5,4]], label: 'CHECK', read: 3, dashed: true },
      WR1: { pos: [13,-5],   route: [[8,-2],[4,2]],          label: 'FLAT', read: 2, dashed: false },
      WR2: { pos: [22,-5],   route: [[22,-2],[20,3],[18,10]], label: 'SEAM', read: 1, dashed: false },
      RB:  { pos: [31,0],    route: [[31,5],[28,12]],         label: 'DEEP', read: 0, dashed: true },
    },
    defense: [[8,5],[17.5,7],[27,5],[9,13],[27,13]],
    timing: { 1:1.5, 2:1.0, 3:3.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'WR2', time:1.5, type:'throw' },
    ],
  },

  // ── SLANT-WHEEL ───────────────────────────────────────────────────────────
  {
    id: 'slant-wheel',
    name: 'Slant-Wheel',
    formation: 'Spread',
    tags: ['deep', 'misdirection'],
    family: 'quick-game',
    isRunPlay: false,
    description: {
      fake: 'WR1 slant draws the underneath defender inside — creates a lane on the sideline',
      target: 'RB sells the flat then wheels up the sideline for a big gain. QB looks off safety with the slant, pumps, then hits the wheel deep.',
    },
    qbLook: {
      eyes: 'WR1',
      throw: 'RB',
      tip: 'Hard look at WR1 slant — even pump fake it — then fire to RB wheeling up the sideline behind the vacated zone',
    },
    positions: {
      QB:  { pos: [17.5,-3], route: [], label: '', read: 0, dashed: false },
      C:   { pos: [17.5,0],  route: [[17.5,3]], label: 'BLOCK', read: 0, dashed: true },
      WR1: { pos: [5,0],     route: [[5,2],[12,6]],                    label: 'SLANT', read: 1, dashed: false },
      WR2: { pos: [31,0],    route: [[31,7],[29,14]],                   label: 'POST',  read: 0, dashed: true },
      RB:  { pos: [17.5,-5.5], route: [[22,-2],[28,1],[33,6],[33,14]], label: 'WHEEL', read: 2, dashed: false },
    },
    defense: [[8,5],[17.5,8],[27,5],[7,14],[28,12]],
    timing: { 1:1.0, 2:2.5 },
    ballPath: [
      { from:'C', to:'QB', time:0, type:'snap' },
      { from:'QB', to:'RB', time:2.5, type:'throw' },
    ],
  },

]

// ── Helper Functions ──────────────────────────────────────────────────────────

export function getPlay(id) {
  return PLAY_LIBRARY.find(p => p.id === id)
}

export function getFormations() {
  return [...new Set(PLAY_LIBRARY.map(p => p.formation))].sort()
}

export function getTags() {
  return [...new Set(PLAY_LIBRARY.flatMap(p => p.tags))].sort()
}

export function getFamilies() {
  return [...new Set(PLAY_LIBRARY.map(p => p.family))].sort()
}

export function filterPlays({ formation, tag, family, search } = {}) {
  return PLAY_LIBRARY.filter(p => {
    if (formation && p.formation !== formation) return false
    if (tag && !p.tags.includes(tag)) return false
    if (family && p.family !== family) return false
    if (search) {
      const s = search.toLowerCase()
      if (
        !p.name.toLowerCase().includes(s) &&
        !p.id.includes(s) &&
        !p.tags.some(t => t.includes(s)) &&
        !p.family.includes(s) &&
        !p.formation.toLowerCase().includes(s)
      ) return false
    }
    return true
  })
}
