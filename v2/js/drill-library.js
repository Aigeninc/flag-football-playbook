// drill-library.js — Drill library for Practice Planner v2
// Research-backed drill library — max participation, no 1v1 drills
// Last updated: 2026-03-18
// KEY PRINCIPLE: Every drill = ALL 9 players active simultaneously. Zero line-standing.
//
// TAG SYSTEM:
//   'full-team'        — all players active simultaneously
//   'pairs'            — partner drills, everyone paired up
//   'station'          — multiple stations, small groups rotate
//   'quick-rotate-1v1' — 1v1 format but next pair goes <15 sec after last
//   'game'             — game-like / competitive format

export const DRILL_CATEGORIES = {
  warmup:    { emoji: '🏃', label: 'Warm-Up',        color: '#22c55e' },
  evasion:   { emoji: '💨', label: 'Evasion',        color: '#f59e0b' },
  defense:   { emoji: '🛡️', label: 'Defense',        color: '#ef4444' },
  receiving: { emoji: '🙌', label: 'Receiving',      color: '#3b82f6' },
  throwing:  { emoji: '🎯', label: 'Throwing',       color: '#8b5cf6' },
  handoffs:  { emoji: '🤝', label: 'Handoffs',       color: '#ec4899' },
  routes:    { emoji: '📐', label: 'Route Running',  color: '#06b6d4' },
  team:      { emoji: '🏈', label: 'Team',           color: '#14b8a6' },
  scrimmage: { emoji: '🏟️', label: 'Scrimmage',      color: '#f97316' },
}

export const DRILL_LIBRARY = [
  // ── WARMUP ──────────────────────────────────────────────────────────────
  {
    id: 'dynamic-warmup',
    name: 'Dynamic Warm-Up',
    category: 'warmup',
    tags: ['full-team'],
    duration: 7,
    description: 'Full movement prep: high knees, butt kicks, shuffles, sprints, flag-specific buzzes. ALL players go at once across the width.',
    setup: 'Line up on sideline, go across and back (10-15 yards). All 9 kids go simultaneously — nobody waits.',
    coachingPoints: [
      'We warm up like pros — no walking!',
      'Buzz feet = short choppy steps, stay low',
      'Sequence: high knees → butt kicks → Frankensteins → backpedal → side shuffle left → side shuffle right → sprint',
      'On the sprint, RACE — first one wins bragging rights',
      '"Up tempo" — the speed you practice is the speed you play',
    ],
    playerCount: { min: 1, ideal: 10 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'arrow-warmup',
    name: 'Arrow Warmup (Coach D)',
    category: 'warmup',
    tags: ['full-team', 'quick-rotate-1v1'],
    duration: 6,
    description: "Coach D's signature 4-cone diamond warm-up that teaches DB footwork, agility, and defensive stance — all in one rapid-rep circuit. 2 lines, everyone moving.",
    setup: '4 cones in a diamond, 5-10 yards between cones. 2 lines behind the back cone. Pattern: sprint to front cone → circle it → shuffle to right cone → shuffle to left cone → sprint back to front cone → backpedal to start. Both lines run simultaneously, rapid reps.',
    coachingPoints: [
      'Start every rep in defensive cornerback stance — knees bent, weight forward, arms ready',
      'Shuffles: never cross your feet, stay square',
      'Reveal your best athletes naturally — field awareness and body control show up immediately',
      'Level 2: add flags at side cones — defender pulls flag as they shuffle past',
      'Level 3: end with a catch — coach throws at the final front cone',
      '"Rapid reps" — next person goes the moment the previous one reaches the front cone first time',
    ],
    playerCount: { min: 2, ideal: 9 },
    equipment: ['cones'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'defensive-shuffle',
    name: 'Defensive Shuffle',
    category: 'warmup',
    tags: ['full-team'],
    duration: 3,
    description: 'Side step shuffling with arms wide — defense positioning muscle memory. All players go simultaneously.',
    setup: 'Line up on the sideline facing the field. Arms out wide — full wingspan. All go at same time.',
    coachingPoints: [
      'Stay low in athletic stance, knees bent',
      'Keep arms wide the ENTIRE time',
      'Never cross your feet — shuffle step only',
      'This is your defensive coverage zone width',
      '"Break down, shuffle" — that\'s the mantra every rep',
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
    tags: ['full-team'],
    duration: 2,
    description: 'Arm circles with diamond hand shape — teaches high catch technique. All players do it simultaneously.',
    setup: 'Stand with feet shoulder width apart. Make diamond with thumbs + index fingers touching. ALL go at once.',
    coachingPoints: [
      '"Diamond" hands (thumbs together) for any ball ABOVE the chest',
      '10 circles forward, 10 circles backward',
      '"Watch it in" — eyes on ball all the way into hands before tucking',
      'Squeeze at the end — hands are your gloves',
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
    tags: ['full-team'],
    duration: 2,
    description: 'Arm circles with pinkies crossed — teaches low catch technique. All players simultaneously.',
    setup: 'Stand with feet shoulder width apart. Cross pinky fingers, palms facing up (basket shape). All go at once.',
    coachingPoints: [
      '"Pinkies down" — for any ball AT or BELOW the chest',
      '10 circles forward, 10 circles backward',
      'No T-Rex arms — extend FULLY to meet the ball, don\'t wait for it',
      'Low balls are the hardest — practice them most',
    ],
    playerCount: { min: 1, ideal: 10 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'tag-n-go',
    name: 'Tag & Go (Flag Warm-Up)',
    category: 'warmup',
    tags: ['full-team', 'game'],
    duration: 4,
    description: 'All players on, everyone tries to pull everyone else\'s flags while protecting their own. Pure chaos warm-up.',
    setup: '20×20 yard box. All 9 kids have flags on. On GO — pull flags, protect yours. If you lose both flags you\'re still in but count your pulls.',
    coachingPoints: [
      'Eyes UP — see the whole field, not just one target',
      'Reach for the hip, not the flag tape — grab from the belt handle, pull UP not across',
      'Keep moving — standing still = easy target',
      'Count your successful pulls — compete against yourself',
      '"Break down, shuffle" — don\'t lunge, stay square to your target',
    ],
    playerCount: { min: 5, ideal: 9 },
    equipment: ['cones', 'flags'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'captains-coming',
    name: "Captain's Coming (MOJO)",
    category: 'warmup',
    tags: ['full-team', 'game'],
    duration: 5,
    description: 'Story-based game that teaches sharp cutting, direction changes, and listening — disguised as pure fun. Every kid active every second.',
    setup: 'Rectangular space with 4 named sides: North, South, East, West (or use Port/Starboard/Bow/Stern). Coach calls a side — all kids sprint there immediately. Add special commands as kids learn them.',
    coachingPoints: [
      '"Captain\'s coming!" → everyone freezes, stands at attention, salutes, yells back "Aye aye, Captain!"',
      '"Hit the deck!" → everyone drops to ground immediately',
      '"Raise the sails!" → make rowing motion',
      '"Man overboard!" → pair up immediately, one on all fours, partner stands on their back',
      'Teaches: sharp cuts, change of direction, listening, reaction time — disguised as play',
      'Last one to each location does 3 jumping jacks — keeps it competitive',
    ],
    playerCount: { min: 4, ideal: 9 },
    equipment: ['cones'],
    difficulty: 1,
    isCustom: false,
  },

  // ── EVASION ──────────────────────────────────────────────────────────────
  {
    id: 'mirror-dodge',
    name: '4v4 Mirror Dodge',
    category: 'evasion',
    tags: ['pairs'],
    jukeRelated: ['cut-juke', 'drop', 'shimmy'],
    duration: 5,
    description: '4 pairs face each other simultaneously — ball carrier jukes, defender mirrors. All 8 players moving at once, coach watches all.',
    setup: '4 pairs face each other 3 yards apart. Use cones to mark 5-yard lanes. ALL 4 pairs go simultaneously on coach\'s signal. Swap roles every 30 sec.',
    coachingPoints: [
      'Ball carrier: juke BOTH directions — show them you can go either way',
      'Defender: watch the HIPS not the eyes — "belly button doesn\'t lie"',
      'Switch every 30 seconds so everyone defends and attacks',
      '"Break down, shuffle" — defender stays square, shuffles side-to-side, doesn\'t plant and lunge',
    ],
    playerCount: { min: 2, ideal: 8 },
    equipment: ['cones'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'gauntlet-run',
    name: 'Double Gauntlet Run',
    category: 'evasion',
    tags: ['station'],
    jukeRelated: ['cut-juke', 'drop', 'get-skinny', 'speed-change', 'shimmy', 'spin'],
    duration: 8,
    description: 'TWO parallel gauntlets running simultaneously — 4 defenders per gauntlet, runner chains juke moves past each. Zero waiting.',
    setup: '4 cones in a line, 5 yards apart = one gauntlet. Set up TWO parallel gauntlets 10 yards apart. 1 defender at each cone (confined to 3-yard box). Both runners go simultaneously.',
    coachingPoints: [
      '"Speed is your friend" — juking slows you down and gives the defender time',
      'Chain moves: read the NEXT defender before you finish the current one',
      'After each run, runner replaces the last defender, everyone shifts up one',
      'Defenders: "Break down, shuffle, follow the belly button" — stay square, move laterally',
      'Both gauntlets race — competitive pressure',
    ],
    playerCount: { min: 5, ideal: 10 },
    equipment: ['cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'group-open-field',
    name: 'Group Open Field (4v4 Simultaneous)',
    category: 'evasion',
    tags: ['quick-rotate-1v1', 'station'],
    jukeRelated: ['cut-juke', 'drop', 'shimmy', 'spin'],
    duration: 5,
    description: '4 pairs run simultaneously in separate 10×10 boxes — ball carrier vs flag puller. No waiting in line. Classic 1v1 redesigned for 100% participation.',
    setup: 'Mark 4 separate 10×10 boxes using cones. 1 ball carrier + 1 defender per box. All 4 pairs go on coach\'s signal. Rotate roles every rep. 9th kid rotates into a box each rep.',
    coachingPoints: [
      'Attack space, not the defender — go around, not through',
      'Defender: Eyes → Buzz feet → Rip the flag (3-step process)',
      'After each rep, ball carrier and defender swap immediately',
      '"Pull from the handle at the top" — reach up, not across',
    ],
    playerCount: { min: 4, ideal: 9 },
    equipment: ['cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'cone-weave-relay',
    name: 'Cone Weave Relay',
    category: 'evasion',
    tags: ['station', 'game'],
    jukeRelated: ['cut-juke', 'get-skinny'],
    duration: 5,
    description: 'TWO relay teams run simultaneously — weave through cones, dodge a live flag puller, sprint home.',
    setup: 'Two teams of 4-5. Each team has 5 zig-zag cones + one flag puller at the end. Both teams race simultaneously. Flag puller rotates every 2 runners.',
    coachingPoints: [
      'Must touch each cone — shortcuts = redo',
      'Flag puller rotates every 2 runners so everyone gets reps',
      'Teaches cutting + finishing when tired (4th quarter legs)',
      'Losing team does 5 jumping jacks — keeps stakes alive',
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
    tags: ['station', 'game'],
    jukeRelated: ['cut-juke', 'drop', 'shimmy', 'spin'],
    duration: 5,
    description: 'Two teams race through juke stations — each cone requires a specific move. Competition drives intensity.',
    setup: 'Two parallel relay courses. 4 cone stations per course: station 1=cut, 2=drop, 3=shimmy, 4=spin. Coach calls each move as runners approach. Both teams go simultaneously.',
    coachingPoints: [
      'Call out which move at each station before they reach it',
      'Must execute the move or they redo that cone',
      'Team competition keeps energy high — don\'t let them sleepwalk through',
      'Rotate which move goes at which station each round',
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
    tags: ['full-team'],
    jukeRelated: ['cut-juke', 'drop', 'speed-change'],
    duration: 5,
    description: 'Leader runs at 70%, others mimic cuts and moves in a chain. All 9 players moving the whole time.',
    setup: 'Single file line, 2 yards between each player. Leader runs at 70% speed making sharp cuts and juke moves in open space.',
    coachingPoints: [
      'Rotate leaders every 60 seconds — put your fastest kid in the MIDDLE',
      "Keep spacing — don't bunch up or you can't mirror the cuts",
      'Teaches reading body language and reactive cutting — key for route running too',
      'Leader: make it HARD — don\'t just jog in a straight line',
    ],
    playerCount: { min: 3, ideal: 9 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'sharks-and-minnows',
    name: 'Sharks & Minnows',
    category: 'evasion',
    tags: ['full-team', 'game'],
    jukeRelated: ['cut-juke', 'drop', 'shimmy', 'spin'],
    duration: 8,
    description: 'Flag pulling + juke practice in a confined box. ALL players active — sharks hunt, minnows juke to survive.',
    setup: '20×15 yard box. Start: 2 sharks in middle, all others are minnows at one end line. Minnows cross to other side without losing a flag. Tagged minnows become sharks.',
    coachingPoints: [
      'Minnows must get from one end to the other — no camping on the line',
      'Last minnow standing wins that round',
      'Teaches juking under pressure + flag pulling in traffic simultaneously',
      '"Up tempo" — great for end of practice, everyone is active every second',
    ],
    playerCount: { min: 5, ideal: 10 },
    equipment: ['cones', 'flags'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'big-bad-wolf',
    name: 'Big Bad Wolf (MOJO)',
    category: 'evasion',
    tags: ['full-team', 'game'],
    jukeRelated: ['cut-juke', 'speed-change'],
    duration: 6,
    description: 'Stealth advance + evasion game that teaches pursuit angles for the wolf and evasive running for kids. Different energy than Sharks & Minnows — slower buildup, explosive finish.',
    setup: 'Kids line up on one end line, coach/Big Bad Wolf on the other end with back turned. Kids call "What time is it, Big Bad Wolf?" — wolf calls a number (e.g., "3 o\'clock" = 3 steps forward). Kids advance. When wolf calls "Dinner time!" — turns and chases. First tagged becomes new wolf.',
    coachingPoints: [
      'Wolf: practice pursuit angles — aim WHERE they\'re going, not where they ARE',
      'Kids: when you hear "Dinner time!" explode immediately — hesitation = caught',
      'Teaches deceptive movement: kids sneak forward quietly, then sprint for their lives',
      'Rotate wolf so multiple kids get reps reading the chase angle',
      'Fun factor keeps energy high at end of practice — use as a reward drill',
    ],
    playerCount: { min: 4, ideal: 9 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },

  // ── DEFENSE ──────────────────────────────────────────────────────────────
  {
    id: 'zone-drop-break',
    name: 'Zone Drop & Break',
    category: 'defense',
    tags: ['full-team'],
    duration: 8,
    description: "5 defenders in zone spots read coach's eyes/arm and break on the ball. 4 receivers run routes. Rotate every 3 plays.",
    setup: 'Full-width zone setup. 4 receivers at positions, 5 defenders in zone spots (think cover 2 or cover 3). Coach plays QB. All 9 kids active.',
    coachingPoints: [
      'Defenders: guard your grass FIRST, then GO when thrown',
      '"Me, me, me!" — claim any ball in the air by yelling it out loud',
      '"Who\'s got him?" — defenders verbally communicate coverage responsibility',
      '"Out! out!" / "In! in!" — call the route type as you see it develop',
      'Quiz the non-targeted receivers: "Where was the open guy?" — forces mental engagement',
      'Rotate offense/defense every 3 plays — everyone plays both sides',
    ],
    playerCount: { min: 6, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'shark-eyes',
    name: 'Shark Eyes (Two Circles)',
    category: 'defense',
    tags: ['station'],
    duration: 5,
    description: "TWO simultaneous circles passing, one defender in each reads eyes and jumps throws. All 9 players active.",
    setup: 'Two circles of 4 kids passing + 1 defender in middle = 10 total. With 9 kids: one circle of 5 + one circle of 4. Both run simultaneously.',
    coachingPoints: [
      "Defender reads thrower's EYES, not the ball — the eyes telegraph the throw",
      'Rotate defender every INT or every 30 seconds',
      'Two circles = ALL kids active simultaneously — no watching',
      '"Me, me, me" — defender claims every ball they go for',
      'Passers: sell your eyes to a fake receiver, then throw elsewhere',
    ],
    playerCount: { min: 5, ideal: 10 },
    equipment: ['footballs'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'angle-pursuit',
    name: 'Angle Pursuit (Multi-Lane)',
    category: 'defense',
    tags: ['pairs'],
    duration: 5,
    description: 'Defenders take correct pursuit angle to cut off sideline runners. Run 4 pairs simultaneously across the width.',
    setup: 'Set up 4 parallel lanes across the 25-yard width. Runner starts on their sideline, defender starts 5 yards inside. All 4 pairs go simultaneously on signal.',
    coachingPoints: [
      "Don't chase — beat them to the spot ahead of them",
      'Take the correct angle: aim where they\'re GOING, not where they ARE',
      'All 4 pairs go at once — coach watches angles from behind',
      'Swap runner/defender each rep',
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
    tags: ['full-team', 'game'],
    duration: 8,
    description: 'Full 5v4 zone defense — QB throws to 4 receivers, 5 defenders read and jump routes from zones. All 9 players active.',
    setup: '4 receivers run short/medium routes from scrimmage line. 5 defenders in zone. Coach or best QB throws. All 9 kids active every play.',
    coachingPoints: [
      'Defenders: eyes on the QB, break when the arm goes forward',
      '"Me, me, me!" — loud call when going for the ball',
      '"Switch!" — safety calls it when taking over a receiver from the corner',
      'Rotate offense/defense every 3-4 plays',
    ],
    playerCount: { min: 6, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'shadow-flag-pulling',
    name: 'Shadow Flag Pulling (4v4+)',
    category: 'defense',
    tags: ['pairs'],
    duration: 5,
    description: '4v4 matched pairs in a box — each player tries to grab their assigned opponent\'s flag while protecting their own. All 8 active.',
    setup: '20×15 yard box. 4v4, each player assigned one opponent. Both teams wear flags. On GO, everyone tries to pull their assigned opponent\'s flag.',
    coachingPoints: [
      'Stay with YOUR assigned player — don\'t poach others',
      'Pull their flag while protecting yours — multitask!',
      'Teaches man coverage awareness + flag pulling at speed',
      '9th player rotates in every 45 seconds',
    ],
    playerCount: { min: 4, ideal: 9 },
    equipment: ['cones', 'flags'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'flag-war',
    name: 'Flag War (3v3v3)',
    category: 'defense',
    tags: ['full-team', 'game'],
    duration: 6,
    description: '3 teams of 3 simultaneously try to collect the most flags. All 9 players active pulling and protecting.',
    setup: '25×20 yard box. 3 teams of 3 (shirt colors or pinnies). All 9 players have flags. Teams try to pull opponent flags. Count flags collected in 60 seconds. 3 rounds.',
    coachingPoints: [
      'Eyes up — see all threats, not just one person chasing you',
      'Protect your flags by moving — standing still is the worst strategy',
      '"Pull from the handle at the top" — yank UP, not across',
      'Team with most flags after 60 seconds wins the round',
    ],
    playerCount: { min: 6, ideal: 9 },
    equipment: ['cones', 'flags'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'spinner-pull',
    name: 'Spinner Pull (Coach D)',
    category: 'defense',
    tags: ['station', 'quick-rotate-1v1'],
    duration: 8,
    description: "Coach D's signature flag pull drill — 2 simultaneous diamond stations, spinning targets, rapid reps. All 9 kids active. Best drill in the library for flag pull technique.",
    setup: '2 stations, each with 4 cones in a diamond (~4 yards apart). 4 kids on cones with flags on, 1 defender in middle doing quick feet. Kids assigned numbers 1-4 but stand on any cone (randomize). One kid yells "ball!" — defender sprints to that cone, pulls flag properly. That kid rotates/spins their body to simulate a moving target. Run both stations simultaneously.',
    coachingPoints: [
      '"Break down" — get as wide and low as possible before pulling (feels unnatural, must be drilled)',
      '"Shuffle laterally" — don\'t plant and lunge, side-step, stay square',
      '"Pull from the handle at the top" — reach UP, grab where the handle attaches, yank cleanly',
      '"Watch the belly button, not the head" — fakes happen up top, hips tell the truth',
      'Rotate: after all 4 pulls, defender rotates out, new person comes in',
      '<15 seconds downtime per kid — keeps tempo high',
    ],
    playerCount: { min: 5, ideal: 10 },
    equipment: ['cones', 'flags'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'reaction-flag-pull',
    name: 'Reaction Flag Pull (NFL FLAG)',
    category: 'defense',
    tags: ['pairs'],
    duration: 5,
    description: 'Pairs lock arm-in-arm, numbered 1 and 2 — coach calls a number, that player immediately becomes the defender and tries to pull partner\'s flag. Both engaged every single rep.',
    setup: 'All kids pair up (9 kids → 4 pairs + coach plays with the 9th, or pair with a partner and rotate). Stand arm-in-arm. Coach calls "1!" or "2!" — that person drops the arm and goes for partner\'s flag immediately.',
    coachingPoints: [
      'React INSTANTLY — no hesitation on the number call',
      'Ball carrier: move away the moment you hear a number (any number — you never know)',
      'Defender: "Break down, shuffle" — don\'t just lunge wildly',
      '"Pull from the handle at the top" — even at this short range',
      'Add spacing: start 3 yards apart and increase as they improve',
      'Switch who is 1 and who is 2 after each round',
    ],
    playerCount: { min: 2, ideal: 10 },
    equipment: ['flags'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'w-drill',
    name: 'W Drill (NFL FLAG)',
    category: 'defense',
    tags: ['station'],
    duration: 6,
    description: 'NFL FLAG DB drill — cones in W pattern, player backpedals, opens hips, transitions, and finishes with an interception. Teaches every DB movement skill. 2 lines, rapid reps.',
    setup: '5 cones in a W pattern, 5 yards between each point. 2 lines (or 1 line if fewer than 6). Player starts in DB stance, backpedals to first far cone, opens hip and runs up around it, backpedals again to next far cone, opens hip and sprints to finish cone. Catch interception at the end.',
    coachingPoints: [
      'Start every rep in proper DB stance: feet shoulder-width, knees bent, on balls of feet, slight bounce',
      '"If you\'re standing like Frankenstein, you\'ll get burned" — stay in athletic ready position',
      'Backpedal: weight forward over toes, fast choppy steps, arms pumping',
      '"Open up your hip" — at each cone, turn the hip first, then the body follows. Do NOT spin your whole body at once',
      '"Me, me, me!" — call out loud when catching the final interception',
      'Level 2: add a ball carrier after the INT — DB must pivot and pull flag',
    ],
    playerCount: { min: 2, ideal: 10 },
    equipment: ['cones', 'footballs'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'know-your-leverage',
    name: 'Know Your Leverage (NFL FLAG)',
    category: 'defense',
    tags: ['station'],
    duration: 6,
    description: '2 defenders learn to communicate and cut off a ball carrier based on release direction. Coach assigns direction to RB secretly. Teaches verbal communication and positioning.',
    setup: '5 cones on each side of a 15-yard lane. 2 defenders at one end, 1 RB at the other. Coach shows RB which direction to go (behind defenders so they can\'t see). On snap, RB takes off — defenders must communicate and cut off the correct side.',
    coachingPoints: [
      '"Who\'s got him? Who\'s got him?" — defenders must say this out loud immediately',
      '"Red Rover, nobody gets by" — outside defender gets wide first, funnels runner inside',
      'Read the RB\'s hips and first step — that tells you direction before they\'re at full speed',
      'Outside defender: contain the sideline. Inside defender: chase the angle.',
      'After each rep, rotate: 1 defender becomes RB, RB goes to end of line',
      'Put your less athletic kids as outside contain — they don\'t need speed for that job',
    ],
    playerCount: { min: 3, ideal: 9 },
    equipment: ['cones'],
    difficulty: 2,
    isCustom: false,
  },

  // ── ROUTE RUNNING ─────────────────────────────────────────────────────────
  {
    id: 'route-tree-walkthrough',
    name: 'Route Tree Walkthrough (All 9)',
    category: 'routes',
    tags: ['full-team'],
    duration: 8,
    description: 'All 9 players run the same route simultaneously — coach calls route, everyone executes. 0 waiting.',
    setup: 'All 9 players spread across the line of scrimmage 3 yards apart. Coach calls a route (out, curl, go, slant, cross). All 9 run it simultaneously.',
    coachingPoints: [
      'Out route: 5-7 yards → sharp 90° cut toward sideline — PLANT the outside foot. "Good sell" — make defender think you\'re going inside first.',
      'Curl route: 6 yards → turn back to the QB — find the window',
      'Go route: full sprint — look back at 10-12 yards over inside shoulder',
      'Slant: 3 yards off line → 45° cut across the middle — eyes up through traffic',
      'Comeback: 10 yards → STOP, come back 2-3 yards to the ball. Drill the STOP — kids skip this.',
      'Use cones on the field to mark each route\'s exact path — "Don\'t just explain it, put cones down"',
    ],
    playerCount: { min: 1, ideal: 9 },
    equipment: ['cones'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'two-line-routes',
    name: 'Two-Line Route Running',
    category: 'routes',
    tags: ['station'],
    duration: 8,
    description: 'Two simultaneous route lines with two QBs — everyone gets a rep every 30 seconds. The core passing drill.',
    setup: 'Split into 2 groups of 4-5. Two QBs (or coach throws for both with two balls). Both lines run the same route simultaneously to opposite sides.',
    coachingPoints: [
      'Must turn and FIND the ball at the break — eyes to QB',
      '"Watch it in" — eyes on the ball all the way into the hands before tucking',
      'QB delivers on timing — throw before the receiver is fully open',
      'After catching, jog to back of OPPOSITE line (mixes groups)',
      'This IS your passing offense — do it every single practice',
    ],
    playerCount: { min: 4, ideal: 10 },
    equipment: ['footballs'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'four-corner-routes',
    name: 'Four Corner Route Circuit',
    category: 'routes',
    tags: ['station'],
    duration: 8,
    description: 'Four stations in corners of a 20×15 area — each corner runs a different route simultaneously. Coach moves to each.',
    setup: 'Mark 4 corners with cones. Corner 1: out routes. Corner 2: curl routes. Corner 3: go routes. Corner 4: slant routes. 2-3 kids per corner. Rotate every 90 sec. Coach throws to each group.',
    coachingPoints: [
      'Focus on the BREAK — sharp cuts, not round loops',
      'Plant the correct foot: outside foot for out/curl, inside foot for slant',
      'Use cones to mark the exact break point at each station — visual guides eliminate confusion',
      'Rotate clockwise every 90 seconds — everyone hits every route',
    ],
    playerCount: { min: 4, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'crossing-route-catches',
    name: 'Crossing Route Catches',
    category: 'routes',
    tags: ['pairs'],
    duration: 8,
    description: 'Receivers from opposite sides run crossing routes simultaneously — QB leads the throw. Hardest catch for kids, needs the most reps.',
    setup: 'Two lines on opposite ends of a 15-yard span. Coach/QB in center throws timing passes. Both receivers cross simultaneously.',
    coachingPoints: [
      '"Watch it in" — eyes on ball all the way through the catch before looking upfield',
      'Progress distances: 5 yards → 10 yards → 15 yards',
      'Catches while running laterally are the hardest for kids — this drill fixes it',
      'QB: lead the receiver toward their break direction',
    ],
    playerCount: { min: 3, ideal: 10 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'jerk-route-drill',
    name: 'Jerk Route Drill (NFL FLAG)',
    category: 'routes',
    tags: ['station'],
    duration: 6,
    description: 'WR runs the "jerk" — 5 yards up, 2 outside steps, hard inside break back to the QB, tuck, turn upfield. Two lines run simultaneously. Teaches the fake-and-break core to every out route.',
    setup: '2 cone lines, WRs run simultaneously in both. Pattern: 5 yards up → plant outside foot → 2 steps fake outside → sharp break back inside/to QB at 45° angle → receive ball → tuck → turn upfield. Coach or second QB throws.',
    coachingPoints: [
      '"Good sell" — make the defender think you\'re going deep before breaking',
      'Plant the OUTSIDE foot hard on the break — without it the cut is a curve not a break',
      'Eyes to QB immediately at the break — the ball should be coming',
      '"Watch it in" — catch first, run second',
      'Add a passive defender once kids have the footwork down — "sell" becomes everything',
      'Progression: walk → 50% → 75% → full speed with QB',
    ],
    playerCount: { min: 2, ideal: 10 },
    equipment: ['cones', 'footballs'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'route-recognition-relay',
    name: 'Route Recognition Relay',
    category: 'routes',
    tags: ['full-team'],
    duration: 7,
    description: 'Coach calls a play, receivers must run their CORRECT assigned routes from memory — tests play recognition while running.',
    setup: 'Full 5-receiver set at the line. Coach calls a play from your actual playbook. Receivers line up and run their assigned routes WITHOUT a huddle walkthrough first.',
    coachingPoints: [
      'Test if they remembered — don\'t re-explain before the snap',
      'After each play: "What route were you supposed to run?" — accountability',
      'Bridges drill time and game time — closest thing to real reps',
      'Start with your 3 most common plays',
      'Use wristbands — kids look at wrist, see the route, go immediately. No re-explaining.',
    ],
    playerCount: { min: 5, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 3,
    isCustom: false,
  },
  {
    id: 'run-and-cut',
    name: 'Run and Cut (NFL FLAG)',
    category: 'routes',
    tags: ['pairs', 'full-team'],
    duration: 5,
    description: '2 RBs/receivers run simultaneously, reading a coach signal mid-run and cutting that direction. Builds vision while running full speed — key RB skill.',
    setup: '3 cones per lane (left cone, center start, right cone). 2 kids run simultaneously from center cone. Mid-run, coach points left or right — runners cut over that cone. All pairs go at once (arrange 4 pairs across the field). Rotate.',
    coachingPoints: [
      'Eyes UP while running — must see the signal while at full speed',
      'No peeking before you start — the point is to read on the move',
      'Plant the outside foot and drive through the cut — don\'t round it',
      'Progress: start at slow jog, add speed as reads become instinctive',
      'Teaches field awareness and mid-run decision-making — critical for open-field play',
    ],
    playerCount: { min: 2, ideal: 10 },
    equipment: ['cones'],
    difficulty: 2,
    isCustom: false,
  },

  // ── RECEIVING ─────────────────────────────────────────────────────────────
  {
    id: 'quick-hands-triangle',
    name: 'Quick Hands Triangle',
    category: 'receiving',
    tags: ['station'],
    duration: 5,
    description: 'Groups of 3 in triangles, quick throws — catch and release under 2 seconds. THREE simultaneous triangles for 9 players.',
    setup: 'Groups of 3, triangle formation, 5 yards apart. With 9 kids = 3 triangles all running simultaneously. Add a light defender in the middle after comfortable.',
    coachingPoints: [
      'Catch and release in under 2 seconds — rapid fire',
      '"Watch it in" before releasing — eyes on ball all the way',
      'SOFT hands — don\'t grab, let the ball come to you',
      'Add a light defender in middle after comfortable — now they have to be quick',
    ],
    playerCount: { min: 3, ideal: 9 },
    equipment: ['footballs'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'nine-player-circuit',
    name: '9-Player Catch Circuit',
    category: 'receiving',
    tags: ['station'],
    duration: 8,
    description: 'Three groups of 3 rotate through three catching stations simultaneously — deep ball, short slant, over-the-shoulder.',
    setup: 'Station A (5 yd): quick out catches. Station B (10 yd): crossing catches. Station C (15 yd): go-route deep catches. 3 kids per station, all go simultaneously. Rotate stations every 90 sec.',
    coachingPoints: [
      'Station A: SHORT catches — tuck immediately after catch',
      'Station B: LATERAL catches while running — hardest, needs focus. "Watch it in."',
      'Station C: DEEP ball — look over your inside shoulder at 12 yards',
      'Coach needs 3 footballs or a helper QB at one station',
    ],
    playerCount: { min: 6, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'rapid-fire-catch',
    name: 'Rapid Fire Catch',
    category: 'receiving',
    tags: ['full-team'],
    duration: 5,
    description: 'All 9 players line up 8 yards from coach, run routes one right after another in a continuous flow — a catch every 5 seconds.',
    setup: 'All 9 players in a line 8 yards away. Coach throws to each player as they jog across in continuous motion. As soon as ball is caught, next player goes.',
    coachingPoints: [
      'Continuous flow — next kid goes while coach already has next ball ready',
      'Use 2 balls: one in air, one in hand ready',
      'Vary route type: first pass = out, next = cross, next = curl, etc.',
      '"Watch it in" — no peeking upfield before the catch',
      'Every kid gets a catch every 45 seconds — high reps',
    ],
    playerCount: { min: 3, ideal: 9 },
    equipment: ['footballs'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'floor-is-lava',
    name: 'Floor Is Lava (MOJO)',
    category: 'receiving',
    tags: ['pairs', 'game'],
    duration: 6,
    description: 'Pairs play catch while constantly moving between cone "islands." Ball in the air = both must be on an island. Teaches catching on the move, footwork, and spatial awareness. All kids active simultaneously.',
    setup: 'Scatter 12+ cones as "islands" across a 20×20 yard area. All kids paired up (4-5 pairs). Partners stand on separate cones and play catch. After each catch, they must move to a different cone before their partner throws again. The "floor" between cones is lava.',
    coachingPoints: [
      '"Watch it in" — catch first, then move to the next island',
      'Both players must be on a cone when the ball is in the air — enforce this',
      'Pairs compete: first to 10 catches without dropping wins',
      'Add rule: can\'t use the same island twice in a row',
      'Naturally creates catching while arriving at a spot — mimics route running instinct',
    ],
    playerCount: { min: 4, ideal: 10 },
    equipment: ['cones', 'footballs'],
    difficulty: 1,
    isCustom: false,
  },

  // ── THROWING ──────────────────────────────────────────────────────────────
  {
    id: 'target-ladder',
    name: 'Target Ladder (Multi-Station)',
    category: 'throwing',
    tags: ['station'],
    duration: 5,
    description: '3 throwing stations side-by-side at 5/8/12 yards — all throwers go simultaneously. Track accuracy.',
    setup: '3 parallel stations with receiver cones at 5, 8, 12 yards. 3 kids throwing simultaneously. Must complete 2/3 to "advance." Rotate throwers every 3 reps.',
    coachingPoints: [
      'Must complete 2/3 to advance — keeps it honest',
      'Track accuracy across sessions — progress is motivating',
      '7-second clock means QB must be accurate on short/medium — no deep bombs',
      'Step INTO the throw — plant your front foot toward the target. Hips rotate through.',
    ],
    playerCount: { min: 2, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'moving-target',
    name: 'Moving Target',
    category: 'throwing',
    tags: ['full-team'],
    duration: 5,
    description: 'QB on the line, all receivers jog across at 8 yards in continuous flow — lead the throw. Continuous for 5 minutes.',
    setup: 'QB on the line (coach). Receivers line up at one side, jog across at 8 yards. As soon as one throw is made, next receiver goes. Use 2 footballs.',
    coachingPoints: [
      'Lead the receiver — hit them in stride AHEAD of where they ARE',
      '"Watch it in" — receiver eyes on ball all the way to hands',
      'Continuous flow — no breaks between reps',
      'Teaches timing — the #1 skill gap in youth QBs',
    ],
    playerCount: { min: 3, ideal: 9 },
    equipment: ['footballs'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'qb-rotation-drill',
    name: 'QB Rotation — Everyone Throws',
    category: 'throwing',
    tags: ['station'],
    duration: 6,
    description: 'Every kid takes 3 snaps as QB — develops understanding of the position and builds confidence for the whole team.',
    setup: 'Center snaps to rotating QBs. 3-4 receivers run routes. Coach stands next to QB to coach in-ear. Each kid gets 3 throws then rotates to receiver. All 9 rotate through.',
    coachingPoints: [
      'Every kid should try QB — the ones who play other positions will respect it',
      'Keep coaching simple: "Step toward your target. Thumb snaps DOWN to opposite hip on release."',
      'High release — ball up, snap through. 5-yard warmup before going deeper.',
      'Praise the attempt, correct the mechanics — not the result',
      '"When you roll out, still get your steps and footwork right — don\'t flail and throw"',
    ],
    playerCount: { min: 3, ideal: 9 },
    equipment: ['footballs'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'pocket-awareness-drill',
    name: 'QB Pocket Awareness (NFL FLAG)',
    category: 'throwing',
    tags: ['quick-rotate-1v1', 'station'],
    duration: 6,
    description: 'Center snaps, QB reads coach hand signals simulating pass rush movement, then throws to the indicated side. Builds pocket presence and scramble mechanics. Two stations run simultaneously.',
    setup: '2 stations: QB + center + 1 stationary WR per side. Coach signals left or right mid-play (simulating pass rush forcing QB to that side). On "release" signal, QB throws to WR on that side. Add scramble variant: QB rolls out, WR runs a short pattern after.',
    coachingPoints: [
      'Warm up at 5 yards before adding the signal reads',
      '"When you roll out, still get your steps and footwork right — don\'t just flail"',
      'QB thumb snaps DOWN to opposite hip on release — not over the top',
      'Hips rotate through — front of hips point at target at moment of release',
      'Teaches pocket movement and "move, then throw" sequencing',
      'Keep it at 3 reps per QB before rotating — fresh mechanics every time',
    ],
    playerCount: { min: 3, ideal: 9 },
    equipment: ['footballs'],
    difficulty: 2,
    isCustom: false,
  },

  // ── HANDOFFS ──────────────────────────────────────────────────────────────
  {
    id: 'handoff-circuit',
    name: 'Handoff Circuit (3 Stations)',
    category: 'handoffs',
    tags: ['station'],
    duration: 8,
    description: 'Three parallel handoff stations running simultaneously — QB-to-RB handoff timing and ball security. All 9 kids active.',
    setup: '3 stations, 3 kids each (QB, RB, 1 waiting). QB takes snap, RBs run 3 routes: (1) direct handoff left, (2) direct handoff right, (3) fake handoff + QB keeps. All 3 stations go simultaneously.',
    coachingPoints: [
      'RB: make a POCKET with your arms — inside elbow up, outside elbow down',
      'QB: push the ball into the belly pocket firmly, then RIDE it before deciding to give or keep',
      'RB tucks the ball immediately — two hands on it until past the line',
      'Fake handoffs are 50% of the drill — sell the fake!',
    ],
    playerCount: { min: 3, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'yellow-brick-road',
    name: 'Yellow Brick Road Handoff (Coach D)',
    category: 'handoffs',
    tags: ['station'],
    duration: 8,
    description: "Coach D's split-back formation fake + handoff drill. Two simultaneous lines: one QB line and two RB lines practice the fake-and-real sequence. Core mechanic for the best misdirection play at this age.",
    setup: 'Mark cones showing the two RB paths: Path A (the "yellow brick road") = long arc to the sideline. Path B = tight opposite direction. 2 stations running simultaneously. RB-A "chomps down" (fake) and follows the long cone path to sideline. RB-B takes real handoff going the other way. Rotate: after each rep, A becomes QB, QB becomes B, B becomes A.',
    coachingPoints: [
      '"Follow the yellow brick road" — RB-A takes the LONG way to the sideline, don\'t cut inside. The cones mark the path.',
      '"Chomp down" — fake receiver grips elbows down, acts like they have the ball the ENTIRE run, no peeking',
      'QB: turn, fake FULLY into RB-A, then ride and hand off to RB-B — don\'t telegraph the real ball',
      'Watch for kids who naturally sell the fake — they are your best fakers (not always your fastest kids)',
      'Add a live defender after the walk-through — defenders instinctively follow the fake when it\'s done well',
      'Drill just the QB turn + hand motion separately before adding RBs',
    ],
    playerCount: { min: 3, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'shovel-pass-circuit',
    name: 'Shovel Pass Circuit',
    category: 'handoffs',
    tags: ['station'],
    duration: 6,
    description: 'QB shovel-passes to flat receivers simultaneously at all 3 stations. Builds the short game and flag-zone attack.',
    setup: '3 parallel QB-receiver pairs, 5 yards apart. QB snaps, receiver crosses at 3 yards in the flat. QB shovels a quick pass. All 3 pairs go simultaneously.',
    coachingPoints: [
      'Shovel pass: underhanded push-pass to the flat — quick release',
      'Receiver must be moving AWAY from center when they receive it (forward pass rule)',
      'Ball must travel forward — no backward toss (it\'s a pass, not a lateral)',
      'Tuck immediately — it\'s live, there are defenders',
    ],
    playerCount: { min: 3, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'diamond-handoff',
    name: 'Diamond Formation Handoff',
    category: 'handoffs',
    tags: ['full-team'],
    duration: 6,
    description: 'Full 5-player diamond formation practices handoffs, fakes, and reads. All 9 run through in two waves.',
    setup: 'Line up full diamond: QB, 2 slots, 2 edges. Run 3-4 plays that use handoffs/fakes. Wave 1 (5 kids) runs while wave 2 (4 kids) watches and identifies what each player is doing.',
    coachingPoints: [
      'Wave 2 must watch and be able to explain each player\'s assignment',
      'Focus on the FAKE — if defenders aren\'t fooled, the play doesn\'t work',
      'QB: eyes downfield after the handoff — sell that you kept it',
      'RB: after receiving ball, run NORTH-SOUTH immediately, not sideways',
    ],
    playerCount: { min: 5, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 3,
    isCustom: false,
  },

  // ── TEAM ──────────────────────────────────────────────────────────────────
  {
    id: 'play-walkthrough',
    name: 'Offensive Play Drills',
    category: 'team',
    tags: ['full-team'],
    duration: 10,
    description: 'Walk-through/run-through of specific plays from the playbook. All 9 active each rep.',
    setup: 'Full team at line of scrimmage. Walk through at teach speed first, then progress to run speed. 4 on offense (5th rotating), 4 on defense simulating.',
    coachingPoints: [
      'Walk first, then jog, then full speed — in that order every time',
      'Put cones on the field showing each player\'s EXACT path before snapping — "Don\'t just explain it"',
      'Use wristbands — kid looks at wrist, knows the play, no re-explaining needed',
      'Each player must know their assignment BEFORE lining up — ask them',
      'Run each play 3-4 times minimum before moving on',
      'Defense: give realistic coverage, don\'t just stand there',
    ],
    playerCount: { min: 5, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 1,
    isCustom: false,
    linkedPlays: true,
  },
  {
    id: 'play-recognition-quiz',
    name: 'Play Recognition Quiz',
    category: 'team',
    tags: ['full-team'],
    duration: 5,
    description: 'Coach points to a player, calls a play — player must describe their assignment from memory before the snap. Tests play knowledge without running.',
    setup: 'All 9 players at scrimmage line. Coach calls a play name. Before they run it, coach points to 2-3 players and asks "What\'s YOUR assignment on this play?" Then they run it.',
    coachingPoints: [
      'Random selection — no warning who will be asked',
      'Wrong answer = play doesn\'t run, they must explain it correctly first',
      'Then run the play and see if they executed what they said',
      'Builds game-speed recall — most important mental skill for this age',
    ],
    playerCount: { min: 5, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 2,
    isCustom: false,
    linkedPlays: true,
  },
  {
    id: 'no-huddle-drill',
    name: 'No-Huddle Fast Break',
    category: 'team',
    tags: ['full-team', 'game'],
    duration: 8,
    description: 'QB calls play at the line — offense must line up and run in under 10 seconds. Builds communication and game-speed recall.',
    setup: 'Full 5v4 or 5v5. No huddle — QB calls play at line using your play naming system. 10-second play clock. Coach counts it down.',
    coachingPoints: [
      '10-second clock — hustle to the line or it\'s a procedure penalty',
      'QB: loud and clear, use your play names. Kids look at wristband.',
      'Other players: confirm your assignment with a nod or thumbs up',
      '"Up tempo" — this is the speed of the game. Practice slow = play slow.',
      'Teaches game-speed communication — the hardest soft skill at this age',
    ],
    playerCount: { min: 5, ideal: 9 },
    equipment: ['footballs', 'cones'],
    difficulty: 3,
    isCustom: false,
    linkedPlays: true,
  },
  {
    id: 'cool-down',
    name: 'Cool Down & Team Talk',
    category: 'team',
    tags: ['full-team'],
    duration: 5,
    description: 'Light stretching, recap what we learned, shout-outs, homework reminder. All 9 in a circle.',
    setup: 'Circle up. Light stretches while coach talks. Everyone faces in.',
    coachingPoints: [
      'Recap 1-2 KEY things from today — not everything',
      'Shout out 2-3 specific kids for SPECIFIC plays — names and actions matter',
      '"Don\'t be upset if you missed the flag or missed the ball — positive attitude, you\'ll get it next time"',
      'Homework: 10 push-ups, 10 jumping jacks, 10 squats, 2 min jog',
      '"Champions work every day" — end with the team chant',
    ],
    playerCount: { min: 1, ideal: 9 },
    equipment: [],
    difficulty: 1,
    isCustom: false,
  },

  // ── SCRIMMAGE ─────────────────────────────────────────────────────────────
  {
    id: 'scrimmage',
    name: 'Scrimmage',
    category: 'scrimmage',
    tags: ['full-team', 'game'],
    duration: 10,
    description: 'Full 5v4 scrimmage — situational or open. 9th player rotates in each series.',
    setup: 'Full field or half field. 5 on offense vs 4 on defense + rotating 9th player. Swap every series.',
    coachingPoints: [
      'Call specific situations: "3rd and long", "red zone", "2-minute drill"',
      'Rotate the 9th player into a key position each series — everyone gets reps',
      'Coach BOTH sides between plays — 15-second coaching window max',
      'Stop and correct but keep it FLOWING — scrimmage is their favorite part',
      'End on a positive play — let a less prominent player score last',
    ],
    playerCount: { min: 8, ideal: 9 },
    equipment: ['footballs', 'cones', 'flags'],
    difficulty: 1,
    isCustom: false,
  },
  {
    id: 'red-zone-scrimmage',
    name: 'Red Zone Scrimmage',
    category: 'scrimmage',
    tags: ['full-team', 'game'],
    duration: 8,
    description: 'Ball starts at the 10-yard line — score or stop in 3 plays. High-pressure situational reps.',
    setup: 'Set up 10-yard red zone. Offense gets 3 plays to score, defense tries to stop. 5v4. Reset after each series, swap offense/defense.',
    coachingPoints: [
      'Red zone = short routes, quick throws — no 20-yard bombs',
      'Defense tightens up — everything is worth more here',
      '"Nobody gets by" — Red Rover rule for outside linebackers',
      'Use your 3 best red zone plays from your playbook',
    ],
    playerCount: { min: 8, ideal: 9 },
    equipment: ['footballs', 'cones', 'flags'],
    difficulty: 2,
    isCustom: false,
  },
  {
    id: 'two-minute-drill',
    name: 'Two-Minute Drill',
    category: 'scrimmage',
    tags: ['full-team', 'game'],
    duration: 6,
    description: 'Offense starts at midfield with 2 minutes to score — simulates real game pressure. Tests everything at once.',
    setup: 'Ball at midfield. 2 minutes on the clock. Offense works fast, no-huddle. Defense plays real coverage. Coach tracks clock.',
    coachingPoints: [
      'Offense: hurry to the line after every play — clock is running',
      '"Up tempo" — no walking between plays',
      'QB: check ball placement first, then sprint to line and call play',
      'Focus plays: sideline routes (stop clock), spikes only if desperate',
      'Best learning tool in the game — use it at least once per game-prep week',
    ],
    playerCount: { min: 8, ideal: 9 },
    equipment: ['footballs', 'cones', 'flags'],
    difficulty: 3,
    isCustom: false,
  },
]

export const PRACTICE_TEMPLATES = [
  {
    id: 'template-a',
    name: 'Template A: Evasion + Defense',
    emoji: '🅰️',
    totalMinutes: 60,
    blocks: [
      { drillId: 'dynamic-warmup',     duration: 7,  notes: '', linkedPlays: [] },
      { drillId: 'tag-n-go',           duration: 4,  notes: '', linkedPlays: [] },
      { drillId: 'mirror-dodge',       duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'gauntlet-run',       duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'shark-eyes',         duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'zone-drop-break',    duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'two-line-routes',    duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'scrimmage',          duration: 10, notes: '', linkedPlays: [] },
      { drillId: 'cool-down',          duration: 5,  notes: '', linkedPlays: [] },
    ],
  },
  {
    id: 'template-b',
    name: 'Template B: Passing + Receiving',
    emoji: '🅱️',
    totalMinutes: 60,
    blocks: [
      { drillId: 'dynamic-warmup',       duration: 7,  notes: '', linkedPlays: [] },
      { drillId: 'diamond-catch-high',   duration: 2,  notes: '', linkedPlays: [] },
      { drillId: 'pinky-catch-low',      duration: 2,  notes: '', linkedPlays: [] },
      { drillId: 'quick-hands-triangle', duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'two-line-routes',      duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'moving-target',        duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'target-ladder',        duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'angle-pursuit',        duration: 5,  notes: '', linkedPlays: [] },
      { drillId: 'scrimmage',            duration: 10, notes: '', linkedPlays: [] },
      { drillId: 'cool-down',            duration: 5,  notes: '', linkedPlays: [] },
    ],
  },
  {
    id: 'template-c',
    name: 'Template C: Game Prep',
    emoji: '🅲️',
    totalMinutes: 60,
    blocks: [
      { drillId: 'dynamic-warmup',       duration: 7,  notes: '', linkedPlays: [] },
      { drillId: 'tag-n-go',             duration: 4,  notes: '', linkedPlays: [] },
      { drillId: 'route-tree-walkthrough', duration: 5, notes: '', linkedPlays: [] },
      { drillId: 'play-walkthrough',     duration: 10, notes: '', linkedPlays: [] },
      { drillId: 'zone-drop-break',      duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'no-huddle-drill',      duration: 6,  notes: '', linkedPlays: [] },
      { drillId: 'red-zone-scrimmage',   duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'cool-down',            duration: 5,  notes: '', linkedPlays: [] },
    ],
  },
  {
    id: 'template-d',
    name: 'Template D: Handoffs + Routes',
    emoji: '🅳',
    totalMinutes: 60,
    blocks: [
      { drillId: 'dynamic-warmup',       duration: 7,  notes: '', linkedPlays: [] },
      { drillId: 'defensive-shuffle',    duration: 3,  notes: '', linkedPlays: [] },
      { drillId: 'handoff-circuit',      duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'four-corner-routes',   duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'shovel-pass-circuit',  duration: 6,  notes: '', linkedPlays: [] },
      { drillId: 'game-interceptor',     duration: 8,  notes: '', linkedPlays: [] },
      { drillId: 'scrimmage',            duration: 10, notes: '', linkedPlays: [] },
      { drillId: 'cool-down',            duration: 5,  notes: '', linkedPlays: [] },
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

/**
 * Filter drills by tag.
 * @param {string} tag - One of: 'full-team', 'pairs', 'station', 'quick-rotate-1v1', 'game'
 * @param {Array} [customDrills=[]]
 * @returns {Array}
 */
export function filterDrillsByTag(tag, customDrills = []) {
  const all = [...DRILL_LIBRARY, ...customDrills]
  if (!tag) return all
  return all.filter(d => d.tags && d.tags.includes(tag))
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * CHANGELOG — 2026-03-18 YouTube Coaching Intel Merge
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * NEW DRILLS ADDED (11 total — from Coach D, NFL FLAG, MOJO Sports):
 * ──────────────────────────────────────────────────────────────────
 *  1. arrow-warmup          (warmup)   — Coach D's 4-cone diamond footwork warmup.
 *                                        Teaches DB stance, shuffle, backpedal in one
 *                                        rapid-rep circuit. Replaces generic shuffle warmup
 *                                        with football-specific movement.
 *
 *  2. captains-coming       (warmup)   — MOJO Sports. Story-based game: sprint to named
 *                                        sides, react to special commands. Disguises cutting
 *                                        and direction-change training as pure play.
 *
 *  3. big-bad-wolf          (evasion)  — MOJO Sports. Stealth advance + explosive sprint
 *                                        game. Teaches pursuit angles (wolf) and evasive
 *                                        running (kids). Different energy from Sharks &
 *                                        Minnows — slower build, single explosive moment.
 *
 *  4. spinner-pull          (defense)  — Coach D's signature flag pull drill. 2 diamond
 *                                        stations simultaneously. Spinning targets simulate
 *                                        real defenders. Best drill in the library for
 *                                        flag pull technique under realistic conditions.
 *
 *  5. reaction-flag-pull    (defense)  — NFL FLAG. Arm-in-arm pairs, numbered 1/2. Coach
 *                                        calls a number — instant defender/ball carrier
 *                                        assignment. Both players engaged every rep with
 *                                        zero downtime.
 *
 *  6. w-drill               (defense)  — NFL FLAG. 5-cone W pattern teaches every DB
 *                                        movement skill: backpedal, hip open, transition,
 *                                        interception. Level 2 adds flag pull after INT.
 *
 *  7. know-your-leverage    (defense)  — NFL FLAG. 2 defenders + 1 RB, secret direction
 *                                        assignment. Forces defenders to communicate
 *                                        "Who's got him?" and assign sideline contain.
 *
 *  8. jerk-route-drill      (routes)   — NFL FLAG "jerk" route: 5 yards up, fake outside,
 *                                        break inside to QB. Two lines simultaneous. Teaches
 *                                        the fake-and-break foundation for all out routes.
 *
 *  9. run-and-cut           (routes)   — NFL FLAG. 2+ RBs run simultaneously, read coach
 *                                        signal mid-run and cut that direction. Builds
 *                                        vision-while-running and in-game decision-making.
 *
 * 10. floor-is-lava         (receiving)— MOJO Sports. Pairs play catch while moving between
 *                                        cone "islands." Naturally creates catching on the
 *                                        move, mimicking route-running reception instinct.
 *
 * 11. yellow-brick-road     (handoffs) — Coach D's split-back formation fake + handoff drill.
 *                                        Two simultaneous lines. Teaches the "chomp down"
 *                                        fake RB mechanic and QB ride-and-give. Core mechanic
 *                                        for the best misdirection play at this age level.
 *
 * 12. pocket-awareness-drill (throwing)— NFL FLAG. QB reads coach hand signals simulating
 *                                        pass rush, then throws to that side. Teaches pocket
 *                                        movement and scramble mechanics. Two stations.
 *
 * TAGS ADDED (all 43 original + 12 new drills):
 * ──────────────────────────────────────────────
 * Every drill now has a `tags: []` field with one or more of:
 *   'full-team'        — all players simultaneously active
 *   'pairs'            — everyone paired up and working
 *   'station'          — small groups rotating through stations
 *   'quick-rotate-1v1' — 1v1 format but <15 sec downtime per kid
 *   'game'             — game-like / competitive format
 *
 * COACHING CUES ENHANCED (Coach D + NFL FLAG language added):
 * ────────────────────────────────────────────────────────────
 *  - "Follow the yellow brick road" → yellow-brick-road, route-tree-walkthrough
 *  - "Chomp down" → yellow-brick-road
 *  - "Snowplow" → referenced in red-zone coaching notes
 *  - "Red Rover, nobody gets by" → know-your-leverage, red-zone-scrimmage
 *  - "Watch the belly button, not the head" → spinner-pull, gauntlet-run, tag-n-go
 *  - "Pull from the handle at the top" → spinner-pull, tag-n-go, group-open-field, flag-war
 *  - "Break down, shuffle" → defensive-shuffle, mirror-dodge, spinner-pull, tag-n-go
 *  - "Me, me, me!" → shark-eyes, zone-drop-break, game-interceptor, w-drill
 *  - "Who's got him?" → zone-drop-break, know-your-leverage
 *  - "Watch it in" → diamond-catch-high, two-line-routes, quick-hands-triangle, moving-target, rapid-fire-catch, jerk-route-drill, floor-is-lava, crossing-route-catches
 *  - "Up tempo" → dynamic-warmup, sharks-and-minnows, no-huddle-drill, two-minute-drill
 *  - "Good sell" → route-tree-walkthrough, jerk-route-drill
 *  - Thumb snap DOWN cue → qb-rotation-drill, pocket-awareness-drill
 *
 * NEW HELPER FUNCTION:
 *   filterDrillsByTag(tag) — filter drill library by participation format tag
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
