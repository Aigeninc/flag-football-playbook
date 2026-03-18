// drill-library.js — Drill library for Practice Planner v2
// All 24 drills, category metadata, templates, and helpers

export const DRILL_CATEGORIES = {
  warmup:    { emoji: '🏃', label: 'Warm-Up',   color: '#22c55e' },
  evasion:   { emoji: '💨', label: 'Evasion',   color: '#f59e0b' },
  defense:   { emoji: '🛡️', label: 'Defense',   color: '#ef4444' },
  receiving: { emoji: '🙌', label: 'Receiving', color: '#3b82f6' },
  throwing:  { emoji: '🎯', label: 'Throwing',  color: '#8b5cf6' },
  team:      { emoji: '🏈', label: 'Team',      color: '#14b8a6' },
  scrimmage: { emoji: '🏟️', label: 'Scrimmage', color: '#f97316' },
}

export const DRILL_LIBRARY = [
  // ── WARMUP ──────────────────────────────────────────────────────────────
  {
    id: 'dynamic-warmup',
    name: 'Dynamic Warm-Up',
    category: 'warmup',
    duration: 7,
    description: 'Full movement prep: high knees, butt kicks, shuffles, sprints, flag-specific buzzes.',
    setup: 'Line up on sideline, go across and back (10-15 yards). All kids go simultaneously.',
    coachingPoints: [
      'We warm up like pros — no walking!',
      'Buzz feet = short choppy steps',
      'Include: high knees, butt kicks, Frankensteins, backpedal, side shuffle, sprints',
    ],
    playerCount: { min: 1, ideal: 10 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'defensive-shuffle',
    name: 'Defensive Shuffle',
    category: 'warmup',
    duration: 3,
    description: 'Side step skipping with arms wide for defense positioning.',
    setup: 'Line up on the sideline facing the field. Arms out wide — full wingspan.',
    coachingPoints: [
      'Stay low in athletic stance, knees bent',
      'Keep arms wide the ENTIRE time',
      'This is your defensive coverage zone',
    ],
    playerCount: { min: 1, ideal: 10 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'diamond-catch-high',
    name: 'Diamond Catch Circles (High)',
    category: 'warmup',
    duration: 2,
    description: 'Arm circles with diamond hand shape — teaches high catch technique.',
    setup: 'Stand with feet shoulder width apart. Make diamond with thumbs + index fingers touching.',
    coachingPoints: [
      'Diamond hands (thumbs together) for any ball ABOVE the chest',
      '10 circles forward, 10 circles backward',
      "Watch the diamond window — that's where the ball goes",
    ],
    playerCount: { min: 1, ideal: 10 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'pinky-catch-low',
    name: 'Pinky Catch Circles (Low)',
    category: 'warmup',
    duration: 2,
    description: 'Arm circles with pinkies crossed — teaches low catch technique.',
    setup: 'Stand with feet shoulder width apart. Cross pinky fingers, palms facing up (basket shape).',
    coachingPoints: [
      'Pinkies together for any ball BELOW the chest',
      '10 circles forward, 10 circles backward',
      "Watch the basket as it moves — that's where you scoop low balls",
    ],
    playerCount: { min: 1, ideal: 10 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },

  // ── EVASION ──────────────────────────────────────────────────────────────
  {
    id: 'mirror-dodge',
    name: 'Mirror Dodge',
    category: 'evasion',
    duration: 5,
    description: 'Pairs face each other, ball carrier jukes, defender mirrors. All pairs simultaneous.',
    setup: 'Pairs face each other 3 yards apart, cones as sideline boundaries (5-yard lane). ALL pairs go simultaneously.',
    coachingPoints: [
      "Watch for kids who only go one direction — force both sides",
      'Switch every 30 seconds',
      'Teaches hesitation moves and reading defender hips',
    ],
    playerCount: { min: 2, ideal: 10 },
    equipment: ['cones'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'gauntlet-run',
    name: 'Gauntlet Run',
    category: 'evasion',
    duration: 8,
    description: '4 defenders in boxes, runner chains juke moves past each one.',
    setup: '4 cones in a line, 5 yards apart. One defender at each cone (confined to 3-yard box). Run TWO parallel gauntlets.',
    coachingPoints: [
      "Don't use a move if you can just run past them — moves cost speed",
      'Chain moves: read the NEXT defender immediately',
      'After each run, runner replaces last defender, everyone shifts up',
    ],
    playerCount: { min: 5, ideal: 10 },
    equipment: ['cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: '1v1-open-field',
    name: '1v1 Open Field',
    category: 'evasion',
    duration: 5,
    description: 'One runner vs one flag puller in a 10×10 box. Tournament style.',
    setup: '10×10 yard box. Split into two groups. Pairs go simultaneously from each group.',
    coachingPoints: [
      'Attack space, not the defender',
      'Defender: Eyes-Buzz-Rip',
      'Losers do 2 push-ups. Winner stays.',
      'Keep it FAST — 10-second wait max between reps',
    ],
    playerCount: { min: 2, ideal: 10 },
    equipment: ['cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'cone-weave-relay',
    name: 'Cone Weave Relay',
    category: 'evasion',
    duration: 5,
    description: 'Relay race: weave through cones, dodge flag puller, sprint home.',
    setup: 'Two teams. 5 cones in zig-zag → one flag puller at the end → sprint to finish.',
    coachingPoints: [
      'Must touch each cone',
      'Flag puller rotates every 2 runners',
      'Teaches cutting + finishing when tired (4th quarter legs)',
    ],
    playerCount: { min: 6, ideal: 10 },
    equipment: ['cones'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'juke-relay',
    name: 'Juke Relay',
    category: 'evasion',
    duration: 5,
    description: 'Relay race with cone weaving + required juke moves at each station.',
    setup: 'Two teams. 4 cone stations, each requires a specific juke move (cut, drop, shimmy, spin). Sprint between stations.',
    coachingPoints: [
      'Call out which juke move at each station',
      'Must execute the move before advancing',
      'Team competition keeps energy high',
    ],
    playerCount: { min: 4, ideal: 10 },
    equipment: ['cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'follow-the-leader',
    name: 'Follow the Leader',
    category: 'evasion',
    duration: 5,
    description: 'Leader runs at 70%, others mimic cuts and moves in a line.',
    setup: 'Single file line, 2 yards between each player. Leader runs at 70% speed making cuts/moves.',
    coachingPoints: [
      'Rotate leaders every 60 seconds',
      "Keep spacing — don't bunch up",
      'Teaches reading body language and reactive cutting',
    ],
    playerCount: { min: 3, ideal: 8 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'sharks-and-minnows',
    name: 'Sharks & Minnows',
    category: 'evasion',
    duration: 8,
    description: 'Flag pulling + juke practice in a confined box. Sharks pull flags, minnows juke to survive.',
    setup: '20×15 yard box. 2 sharks in the middle, rest are minnows on one end line.',
    coachingPoints: [
      'Minnows must cross to the other side without losing a flag',
      'Tagged minnows become sharks',
      'Last minnow standing wins',
      'Teaches juking under pressure + flag pulling in traffic',
    ],
    playerCount: { min: 5, ideal: 10 },
    equipment: ['cones', 'flags'],
    difficulty: 1,
    isCustom: false,
  },

  // ── DEFENSE ──────────────────────────────────────────────────────────────
  {
    id: 'zone-drop-break',
    name: 'Zone Drop & Break',
    category: 'defense',
    duration: 8,
    description: "Defenders read coach's eyes/arm, break on the ball. Progress from standing to routes.",
    setup: '3 receivers stand at spots, 3 defenders in zone spots. Coach plays QB.',
    coachingPoints: [
      'Guard your grass, then GO when thrown',
      "Read coach's eyes and arm — not the receivers",
      'Quiz receivers not targeted: "Where was the open guy?"',
      'Rotate 1-2 kids per rep',
    ],
    playerCount: { min: 6, ideal: 10 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'shark-eyes',
    name: 'Shark Eyes',
    category: 'defense',
    duration: 5,
    description: "Circle passing game, defender in middle reads eyes and jumps throws.",
    setup: 'Circle of 5-6 kids passing, one defender in middle. Run TWO circles if 10+ kids.',
    coachingPoints: [
      "Defender reads thrower's EYES, not the ball",
      'Rotate every INT or every 30 seconds',
      'Two circles = ALL kids active simultaneously',
    ],
    playerCount: { min: 5, ideal: 10 },
    equipment: ['footballs'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'angle-pursuit',
    name: 'Angle Pursuit',
    category: 'defense',
    duration: 5,
    description: 'Defender takes correct angle to cut off sideline runner.',
    setup: 'Runner on sideline, defender starts 5 yards inside. Run multiple pairs simultaneously.',
    coachingPoints: [
      "Don't chase — beat them to the spot",
      'Take the correct angle to cut off, NOT run behind',
      '3-4 pairs at a time across the width',
    ],
    playerCount: { min: 2, ideal: 10 },
    equipment: ['cones'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'game-interceptor',
    name: 'Game Interceptor',
    category: 'defense',
    duration: 8,
    description: 'Zone defense trainer — QB throws to receivers, interceptors read and jump routes from zones.',
    setup: '3 receivers run short routes. 3 defenders in zone spots. QB (coach or player) reads and throws.',
    coachingPoints: [
      'Defenders: eyes on the QB, not the receivers',
      'Break on the ball when you see the arm go forward',
      'Receivers: run crisp routes to make it realistic',
      'Rotate offense/defense every 3-4 plays',
    ],
    playerCount: { min: 6, ideal: 10 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'shadow-flag-pulling',
    name: 'Shadow Flag Pulling',
    category: 'defense',
    duration: 5,
    description: "4v4 matched pairs — each player tries to grab their opponent's flag.",
    setup: '20×15 yard box. 4v4, each player assigned an opponent. Both teams have flags.',
    coachingPoints: [
      'Stay with YOUR assigned player',
      'Pull their flag while protecting yours',
      'Teaches man coverage awareness + flag pulling at speed',
    ],
    playerCount: { min: 4, ideal: 8 },
    equipment: ['cones', 'flags'],
    difficulty: 2,
    isCustom: false,
  },

  // ── RECEIVING ─────────────────────────────────────────────────────────────
  {
    id: 'quick-hands-triangle',
    name: 'Quick Hands Triangle',
    category: 'receiving',
    duration: 5,
    description: 'Groups of 3 in triangle, quick throws — catch and release under 2 seconds.',
    setup: 'Groups of 3, triangle formation, 5 yards apart. ALL groups go simultaneously.',
    coachingPoints: [
      'Catch and release in under 2 seconds',
      'Add a light defender in middle after comfortable',
      '10 kids = 3 groups of 3 + 1 rotating defender',
    ],
    playerCount: { min: 3, ideal: 10 },
    equipment: ['footballs'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'route-and-look',
    name: 'Route & Look',
    category: 'receiving',
    duration: 8,
    description: 'Receivers run routes, turn and find the ball at the break. Two lines simultaneous.',
    setup: 'Two lines of receivers, two QBs. Both lines run simultaneously to different sides.',
    coachingPoints: [
      'Must turn and find the ball at the break',
      'QB delivers on timing',
      'After catching, jog to back of opposite line',
      'This IS your passing offense — do it every practice',
    ],
    playerCount: { min: 4, ideal: 10 },
    equipment: ['footballs'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'crossing-route-catches',
    name: 'Crossing Route Catches',
    category: 'receiving',
    duration: 8,
    description: 'Receivers run crossing routes, catches at 5, 10, and 15 yards.',
    setup: 'Two lines on opposite sides. Receivers run crossing routes. QB in center throws timing passes.',
    coachingPoints: [
      "Eyes on the ball through the catch — don't look upfield yet",
      'Progress distances: 5 yards → 10 yards → 15 yards',
      'Teaches catching while running laterally (hardest catch for kids)',
    ],
    playerCount: { min: 3, ideal: 10 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },

  // ── THROWING ──────────────────────────────────────────────────────────────
  {
    id: 'target-ladder',
    name: 'Target Ladder',
    category: 'throwing',
    duration: 5,
    description: '3 cones at 5/8/12 yards. Must complete 2/3 to advance. Track accuracy.',
    setup: '3 cones at 5, 8, 12 yards. Run 2-3 stations side by side. Every kid throws.',
    coachingPoints: [
      'Must complete 2/3 to "advance"',
      'Track accuracy across sessions',
      '7-second clock means QB must be accurate on short/medium — no deep bombs',
    ],
    playerCount: { min: 2, ideal: 10 },
    equipment: ['footballs', 'cones'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'moving-target',
    name: 'Moving Target',
    category: 'throwing',
    duration: 5,
    description: 'QB on the line, receivers jog across at 8 yards. Lead the throw. Continuous flow.',
    setup: 'QB on the line. Receivers line up, one at a time jogs across at 8 yards. Next receiver goes as soon as throw is made.',
    coachingPoints: [
      'Lead the receiver — hit them in stride',
      'Continuous flow, no breaks',
      'Each kid gets a rep every 15 seconds',
      'Teaches timing — #1 skill gap in youth QBs',
    ],
    playerCount: { min: 3, ideal: 10 },
    equipment: ['footballs'],
    difficulty: 2,
    isCustom: false,
  },

  // ── TEAM ──────────────────────────────────────────────────────────────────
  {
    id: 'play-walkthrough',
    name: 'Offensive Play Drills',
    category: 'team',
    duration: 10,
    description: 'Walk-through/run-through of specific plays from the playbook.',
    setup: 'Full team at line of scrimmage. Walk through at teach speed first, then progress to run speed.',
    coachingPoints: [
      'Walk first, then jog, then full speed',
      'Each player must know their assignment BEFORE lining up',
      'Run each play 3-4 times minimum before moving on',
      'Tie to specific plays from the app playbook',
    ],
    playerCount: { min: 5, ideal: 8 },
    equipment: ['footballs', 'cones'],
    difficulty: 1,
    isCustom: false,
    linkedPlays: true,
  },
  {
    id: 'cool-down',
    name: 'Cool Down & Team Talk',
    category: 'team',
    duration: 5,
    description: 'Light stretching, recap what we learned, homework reminder.',
    setup: 'Circle up. Light stretches while coach talks.',
    coachingPoints: [
      'Recap 1-2 key things from today',
      'Shout out who did well and why',
      'Homework: 10 push-ups, 10 jumping jacks, 10 squats, 2 min run',
      '"Champions work every day"',
    ],
    playerCount: { min: 1, ideal: 10 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },

  // ── SCRIMMAGE ─────────────────────────────────────────────────────────────
  {
    id: 'scrimmage',
    name: 'Scrimmage',
    category: 'scrimmage',
    duration: 10,
    description: 'Full 5v5 scrimmage — situational or open.',
    setup: 'Full field or half field. 5v5 with subs rotating every series.',
    coachingPoints: [
      'Call specific situations: "3rd and long, red zone, etc."',
      'Rotate subs every series for equal playing time',
      'Coach BOTH sides — offense AND defense',
      'Stop and correct as needed, but keep it flowing',
    ],
    playerCount: { min: 8, ideal: 10 },
    equipment: ['footballs', 'cones', 'flags'],
    difficulty: 1,
    isCustom: false,
  },
]

export const PRACTICE_TEMPLATES = [
  {
    id: 'template-a',
    name: 'Template A: Evasion + Defense',
    emoji: '🅰️',
    totalMinutes: 75,
    blocks: [
      { drillId: 'dynamic-warmup',    duration: 7,  notes: '', linkedPlays: [] },
      { drillId: 'mirror-dodge',      duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'gauntlet-run',      duration: 8,  notes: '', linkedPlays: [] },
      { drillId: '1v1-open-field',    duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'shark-eyes',        duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'zone-drop-break',   duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'route-and-look',    duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'scrimmage',         duration: 10, notes: '', linkedPlays: [] },
      { drillId: 'cool-down',         duration: 5,  notes: '', linkedPlays: [] },
    ],
  },
  {
    id: 'template-b',
    name: 'Template B: Passing + Receiving',
    emoji: '🅱️',
    totalMinutes: 75,
    blocks: [
      { drillId: 'dynamic-warmup',        duration: 7,  notes: '', linkedPlays: [] },
      { drillId: 'quick-hands-triangle',  duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'route-and-look',        duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'moving-target',         duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'target-ladder',         duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'angle-pursuit',         duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'mirror-dodge',          duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'scrimmage',             duration: 12, notes: '', linkedPlays: [] },
      { drillId: 'cool-down',             duration: 5,  notes: '', linkedPlays: [] },
    ],
  },
  {
    id: 'template-c',
    name: 'Template C: Game Prep',
    emoji: '🅲️',
    totalMinutes: 75,
    blocks: [
      { drillId: 'dynamic-warmup',  duration: 7,  notes: '', linkedPlays: [] },
      { drillId: 'mirror-dodge',    duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'play-walkthrough',duration: 15, notes: '', linkedPlays: [] },
      { drillId: 'zone-drop-break', duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'scrimmage',       duration: 20, notes: '', linkedPlays: [] },
      { drillId: 'cool-down',       duration: 5,  notes: '', linkedPlays: [] },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Get a drill by ID (includes custom drills passed in).
 * @param {string} id
 * @param {Array} [customDrills=[]]
 * @returns {Object|undefined}
 */
export function getDrillById(id, customDrills = []) {
  return DRILL_LIBRARY.find(d => d.id === id) || customDrills.find(d => d.id === id)
}

/**
 * Get all drills in a category.
 * @param {string} cat - Category key or '' for all
 * @param {Array} [customDrills=[]]
 * @returns {Array}
 */
export function getDrillsByCategory(cat, customDrills = []) {
  const all = [...DRILL_LIBRARY, ...customDrills]
  if (!cat) return all
  return all.filter(d => d.category === cat)
}

/**
 * Filter drills by search string.
 * @param {string} search
 * @param {string} [cat='']
 * @param {Array} [customDrills=[]]
 * @returns {Array}
 */
export function filterDrills(search, cat = '', customDrills = []) {
  const all = getDrillsByCategory(cat, customDrills)
  if (!search) return all
  const q = search.toLowerCase()
  return all.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q) ||
    d.category.toLowerCase().includes(q)
  )
}
