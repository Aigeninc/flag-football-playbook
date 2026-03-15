# Flag Football Playbook — Product Plan

**Document Version:** 1.0
**Date:** 2026-03-14
**Author:** Opus Review Agent
**Project:** ~/projects/flag-football-playbook/

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Product Vision](#2-product-vision)
3. [Phase 1: Foundation & Polish](#3-phase-1-foundation--polish)
4. [Phase 2: Customization Engine](#4-phase-2-customization-engine)
5. [Phase 3: Player & Team Management](#5-phase-3-player--team-management)
6. [Phase 4: Game Day Tools](#6-phase-4-game-day-tools)
7. [Phase 5: Practice Planning](#7-phase-5-practice-planning)
8. [Phase 6: Monetization Prep](#8-phase-6-monetization-prep)
9. [Technical Recommendations](#9-technical-recommendations)

---

## 1. Current State Assessment

### Code Quality Rating: B

**Strengths:**
- Clean, well-structured vanilla JS — single IIFE, clear variable naming
- Solid separation of concerns: `plays.js` (data), `app.js` (engine), `style.css` (presentation)
- Canvas rendering engine is genuinely impressive — staggered read animations, pre-snap motion sequences (MOTION → SET → HIKE), ball physics with parabolic arcs on throws, man/zone defender AI
- Play data model is rich: positions, routes, timing, ball paths, fake segments, special labels, substitution notes
- Service worker for offline — correct cache-first strategy
- No build step, no dependencies, no framework overhead — loads instantly

**Weaknesses:**
- `app.js` is a single 960-line IIFE — no module separation. Drawing, state management, UI building, animation logic, coach engine, and queue system are all interleaved
- Hardcoded roster (`ALL_ROSTER`, `LOCKED_PLAYERS`, `PLAYERS` constant) — can't customize without editing source
- Substitution state is ephemeral (in-memory only) — lost on refresh
- Play situation scoring (`PLAY_SITUATIONS`) is hardcoded alongside data — should be derivable from play properties
- Canvas hit testing is absent — can't tap on players/routes on the field
- No error handling or defensive coding — assumes data is always perfect
- Version cache busting is manual (`?v=23`)

### UI/UX Assessment: D+ (per UX Audit)

The existing UX audit (dated 2026-03-13) is thorough and accurate. Key findings:

- **Critical:** Field canvas with `flex: 1` pushes controls completely off-screen on iPhone. The app is literally unusable on mobile in its current state.
- **Severe:** Text sizes (8-10px) are illegible outdoors in sunlight — the exact environment this app is used in
- **Moderate:** Player filter can wrap to 2 rows, wasting vertical space. Info panel is noisy with formation + bullets + notes all competing
- **Good:** Animation engine quality is excellent (B+). Play selector with horizontal scroll is intuitive. Player filtering for "show my route" is the best coaching feature
- **Good:** Dark background (#1a1a2e) actually reduces glare — good choice for outdoor use

Most UX audit fixes are CSS-only and estimated at ~45 minutes total. These are documented in detail in `UX-AUDIT.md`.

### Feature Inventory (What Exists)

| Feature | Status | Quality |
|---------|--------|---------|
| 16 animated plays | ✅ Working | Excellent — routes, timing, ball paths |
| QB study mode (staggered reads) | ✅ Working | Excellent |
| Game speed mode (all routes at once) | ✅ Working | Good |
| Man/Zone defense simulation | ✅ Working | Good — reactive AI |
| Ball animation with throw arcs | ✅ Working | Very good |
| Pre-snap motion (MOTION → SET → HIKE) | ✅ Working | Polished |
| Player color filter (isolate one route) | ✅ Working | Best coaching feature |
| In-game substitutions | ✅ Working | Functional but no persistence |
| Coach call sheet (situation → play recommendation) | ✅ Working | Clever scoring system |
| Play queue with success/fail tracking | ✅ Working | Basic but functional |
| Speed controls (0.25x–2x) | ✅ Working | Good |
| Swipe navigation between plays | ✅ Working | Smooth |
| Keyboard shortcuts | ✅ Working | Desktop only |
| PWA with offline support | ✅ Working | Basic service worker |
| NRZ field overlay | ✅ Working | Clear visual |

### Technical Debt / Issues

1. **Mobile layout is broken** — controls invisible on phones (P0 blocker)
2. **No data persistence** — subs, queue, play results all lost on refresh
3. **Monolithic app.js** — 960 lines, needs module separation for maintainability
4. **Hardcoded roster** — 7 kids baked into source code
5. **No testing** — zero tests of any kind
6. **Manual cache busting** — `?v=23` query params in HTML and SW
7. **SVG emoji icon** — manifest uses an inline SVG emoji as the PWA icon, looks unprofessional
8. **No proper app icon** — needs real icons at 192px and 512px
9. **Plays.js is static** — no way to add/edit/remove plays without editing code
10. **Canvas not responsive to orientation changes** — landscape mode just shrinks everything
11. **No analytics or error reporting** — can't know how it's used or what breaks
12. **Service worker caches by exact URL** — query string changes invalidate cache

---

## 2. Product Vision

### Target User

**Primary:** Youth flag football coaches (5v5, 7v7) coaching kids ages 6-12.

Persona: Keith — a tech-savvy dad coaching his kid's flag football team. He's spent hours designing plays but has no good tool to share them with parents/players or use them on the sideline. He has 9 kids, varying experience levels (0-4 years), and limited practice time (75 min, 2x/week). He needs plays his 8-year-olds can understand, a way to show each kid THEIR route, and a call sheet he can glance at during games.

**Secondary:** Youth coaches in general who want something better than drawing on a whiteboard. Parents who want to help their kid practice at home.

### Core Value Proposition

**An interactive animated playbook that makes youth flag football coaching easier.**

1. **Animated plays** — not static diagrams. Routes draw in real-time with timing, so kids and coaches SEE how the play develops
2. **"Show My Route" mode** — tap a player to isolate just their route. Hand the phone to a kid: "This is YOUR job"
3. **Coach's brain on the sideline** — situation-based play recommendations (down, field position, coverage type) eliminate deer-in-headlights play calling
4. **Works on a phone at the park** — PWA, offline, one hand, bright sunlight

### Differentiator: Why This Beats the Alternatives

| Alternative | Problem This App Solves |
|-------------|------------------------|
| Drawing on a whiteboard | Whiteboard can't animate timing. Kids don't understand static arrows. This shows the play MOVING. |
| Static PDF playbooks | PDFs are boring. Kids don't study them. Animated plays are engaging. Can't do "show my route" with a PDF. |
| FirstDown PlayBook ($10-15/mo) | Expensive, complex, designed for serious coaches not dads. Overkill for 5v5 youth. |
| Hudl / GameChanger | Post-game analysis tools, not pre-game playbook tools. Different problem. |
| PlayMaker Pro | Desktop app, $30+, no mobile-first, no animation, aimed at high school+ |
| Free online play designers | Draw plays but don't animate them. No routing, no timing, no coaching intelligence. |

The app sits in a gap: **too simple for serious high school coaches, exactly right for youth coaches who want something better than napkins but don't need a $15/month platform.**

---

## 3. Phase 1: Foundation & Polish

**Goal:** Make the existing app great for Keith — fix mobile, fix readability, polish the experience. This is the "make it work on Saturday" phase.

**Estimated Effort:** Medium (2-3 Sonnet agent sessions)

### 1.1 Fix Mobile Layout (Critical)

**Files to modify:** `style.css`, `index.html`

**Changes:**

CSS — Lock viewport, enable flex shrink:
```css
html, body {
  height: 100%;
  overflow: hidden; /* prevent ALL scrolling */
}

#app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 900px;
  margin: 0 auto;
  overflow: hidden; /* nothing escapes */
}

#field-container {
  flex: 1;
  min-height: 0; /* CRITICAL — allows flex item to shrink */
  overflow: hidden;
}
```

HTML — Move `#info-panel` AFTER `#controls` in DOM order:
```html
<div id="field-container">...</div>
<div id="controls">...</div>        <!-- controls closer to field -->
<div id="info-panel">...</div>      <!-- less important, below -->
<div id="coach-panel">...</div>
<div id="queue-bar">...</div>
```

Compact player filter:
```css
#player-filter {
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
```

Reduce all vertical padding by ~40% on mobile (detailed values in UX-AUDIT.md Fix 5).

**Acceptance Criteria:**
- [ ] On iPhone SE (375×667), all UI elements visible without scrolling
- [ ] On iPhone 15 (393×852), field canvas gets 500px+ of height
- [ ] Controls (play/pause, replay, speed) always visible and tappable
- [ ] Player filter stays on one row, scrolls horizontally if needed
- [ ] Coach panel and queue bar appear between controls and info panel when toggled

### 1.2 Tighten Field Viewport

**Files to modify:** `app.js`

Crop empty space above and below the action area:
```javascript
const FIELD_Y_MIN = -8;   // keep as-is (behind LOS needed for RB positions)
const FIELD_Y_MAX = 20;   // was 24 — trim 4 yards of empty downfield
```

Reduce canvas margins: `mx = 16, my = 8` (was 24, 12).

**Acceptance Criteria:**
- [ ] Routes and players are visibly larger on the same screen size
- [ ] All player positions (including RB at y=-5.5) still visible
- [ ] Deep routes (y=18-20) still render without clipping
- [ ] Defenders at y=13 still visible

### 1.3 Improve Text Readability for Outdoor Use

**Files to modify:** `app.js`, `style.css`

Increase canvas text sizes:
- Player names on dots: 8px → 10px bold
- Route labels: 10px → 12px bold
- Read numbers: 13px → 15px bold (circle radius 11→14)
- Timer segment labels: 10px → 12px
- Yard line labels: 10px → stay (decorative)

Add a "sunlight mode" toggle (☀️ button):
- Route line widths: 4.5px → 7px
- Player dot radius: 15 → 20
- Label font sizes: +3px across the board
- Higher contrast field green (#2d6a2e → #1a5e1a)
- Brighter route colors (boost saturation)

Store sunlight mode preference in `localStorage`.

**Acceptance Criteria:**
- [ ] Player names readable at arm's length on a phone
- [ ] Route labels readable in direct sunlight
- [ ] Sunlight mode toggle persists across sessions
- [ ] Regular mode still looks good indoors / on desktop

### 1.4 Proper PWA Icon and Metadata

**Files to create:** `icons/icon-192.png`, `icons/icon-512.png`, `icons/apple-touch-icon.png`
**Files to modify:** `manifest.json`, `index.html`

Generate proper icons: football field with play arrows overlay, not just an emoji.

Update manifest:
```json
{
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Add to index.html:
```html
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
```

**Acceptance Criteria:**
- [ ] App icon looks professional on iOS and Android home screen
- [ ] Manifest validates with Chrome DevTools Lighthouse
- [ ] App is installable as PWA on both platforms

### 1.5 Landscape Layout (Nice-to-Have)

**Files to modify:** `style.css`, `app.js`

When `orientation: landscape` AND `max-height: 500px`, switch to a 2-column layout:
- Left column (35%): play selector + player filter + timer (stacked vertically)
- Right column (65%): field canvas
- Controls overlay at bottom of field column

This is a significant CSS restructuring. If time is tight, the simpler approach from UX-AUDIT.md (just shrink everything) is acceptable for Phase 1.

**Acceptance Criteria:**
- [ ] Landscape on phone shows field and controls without scrolling
- [ ] Play selector is accessible in landscape
- [ ] Switching orientation doesn't break state

### 1.6 Bug Fixes and Polish

**Files to modify:** `app.js`, `style.css`

Known issues to fix:
1. **Service worker cache busting** — Replace manual `?v=23` with content-hash based versioning or timestamp-based cache name
2. **Speed button state** — After selecting a speed and switching plays, the active speed button should persist (it does, but verify)
3. **Queue score persistence** — Queue results should survive page refresh (save to localStorage)
4. **Read markers overlap on narrow timer** — Add collision avoidance for read marker badges above timer bar
5. **Coach panel + Queue panel** — Both can be open simultaneously, pushing content off-screen. Make them mutually exclusive or accordion-style
6. **Touch event handling** — Swipe sometimes conflicts with scroll on play selector. Use `touch-action: pan-x` consistently
7. **Offline indicator** — Show subtle "📡 Offline Ready" badge when service worker is installed

**Acceptance Criteria:**
- [ ] All listed bugs fixed
- [ ] No console errors or warnings
- [ ] App loads and works fully offline after first visit

### 1.7 Refactor app.js into Modules

**Files to create:** `modules/state.js`, `modules/renderer.js`, `modules/animation.js`, `modules/ui.js`, `modules/coach.js`, `modules/queue.js`, `modules/touch.js`
**Files to modify:** `app.js` → becomes thin orchestrator, `index.html`

Break the 960-line monolith into logical modules:
- `state.js` — All state variables, getters/setters, substitution logic
- `renderer.js` — All canvas drawing functions (field, players, routes, defenders, ball, labels)
- `animation.js` — Animation loop, timing, play/pause/replay, speed control
- `ui.js` — DOM building (play selector, player filter, controls, info panel)
- `coach.js` — Coach call sheet engine, situation scoring, recommendations
- `queue.js` — Play queue state and rendering
- `touch.js` — Touch/swipe handlers, keyboard shortcuts

Use ES module `import/export` with `<script type="module">`. No build step needed — modern browsers support native modules.

**Acceptance Criteria:**
- [ ] All functionality identical after refactor
- [ ] Each module is <200 lines
- [ ] Clear dependency graph (renderer depends on state, not vice versa)
- [ ] Still no build step required — works with `python3 -m http.server`

### Phase 1 Data Model

No data model changes needed. Existing `PLAYS` array and `PLAYERS` object are sufficient. The only addition is `localStorage` keys:

```javascript
// localStorage keys
'playbook:sunlightMode'     // boolean
'playbook:queueState'       // JSON: { queue: [...], queuePos: number }
'playbook:substitutions'    // JSON: { playIdx: { origName: replacementName } }
'playbook:lastViewMode'     // 'qb' | 'game'
'playbook:lastDefenseMode'  // 'off' | 'man' | 'zone'
```

---

## 4. Phase 2: Customization Engine

**Goal:** Let coaches create, edit, and manage their own plays. This is the transition from "Keith's personal tool" to "a tool any coach can use."

**Estimated Effort:** Large (3-4 Sonnet agent sessions)

### 2.1 Play Editor — Route Drawing on Canvas

**Files to create:** `modules/editor.js`, `modules/field-editor.css` (or section in style.css)
**Files to modify:** `index.html`, `app.js` (orchestrator)

**Architecture:**

Editor modes (toggled via edit button ✏️):
1. **View mode** (default) — current behavior, animations play
2. **Edit mode** — canvas becomes interactive, tap/drag to modify

In edit mode:
- Tap empty field → place player (shows formation options)
- Tap existing player → select for editing (highlight with handles)
- Drag selected player → move position
- Tap selected player's route endpoint → add waypoint
- Drag waypoint → adjust route
- Long-press waypoint → delete it
- Double-tap player → edit properties modal (name, read order, label, dashed, etc.)

Route drawing workflow:
1. Select a player (tap on their dot)
2. Tap on field to add route waypoints (in sequence)
3. Each tap adds `[x, y]` to the player's `route` array
4. Route renders in real-time as you add points
5. Tap "Done" to finish that player's route
6. Edit route by dragging existing waypoints

**Canvas Hit Testing (required for editor):**
```javascript
function hitTestPlayers(canvasX, canvasY) {
  // Convert canvas coords to field coords
  // Check distance to each player position
  // Return nearest player within 20px radius, or null
}

function hitTestWaypoints(canvasX, canvasY, playerName) {
  // Check distance to each waypoint of the given player's route
  // Return { playerName, waypointIndex } or null
}
```

**UI — Edit Toolbar:**
```
┌──────────────────────────────────────┐
│ ✏️ EDIT MODE                   [Done]│
├──────────────────────────────────────┤
│ [+Player] [Formation▼] [Timing] [📋]│
│ Selected: Greyson — Read: ①          │
│ Route: 3 points — [Clear] [Undo]     │
├──────────────────────────────────────┤
│                                      │
│          FIELD CANVAS (interactive)  │
│     ○ Greyson (selected, handles)    │
│     ● Other players (dimmed)         │
│                                      │
├──────────────────────────────────────┤
│ [Delete Play] [Duplicate] [Save]     │
└──────────────────────────────────────┘
```

**Data Model — Editable Play:**

Same structure as existing `PLAYS` entries, but stored in localStorage:
```javascript
// Custom plays stored separately from built-in plays
'playbook:customPlays'  // JSON array of play objects (same schema as PLAYS)
'playbook:playOrder'    // JSON array of { type: 'builtin'|'custom', index: number }
```

Each custom play follows the existing schema:
```javascript
{
  id: 'custom-1710000000',  // timestamp-based ID
  name: 'My Play',
  formation: 'Custom',
  whenToUse: ['User-defined notes'],
  notes: '',
  players: {
    'Braelyn': { pos: [17.5, -3], route: [], label: '', read: 0, dashed: false },
    // ...
  },
  defense: [[10, 5], [17.5, 8], [25, 5], [8, 13], [27, 13]],
  timing: {},
  ballPath: [],
  isCustom: true,
}
```

**Acceptance Criteria:**
- [ ] Can create a new blank play
- [ ] Can place 5 players on the field by tapping
- [ ] Can draw routes by tapping sequential waypoints
- [ ] Can drag players and waypoints to adjust positions
- [ ] Can set read order (1-4) for each player
- [ ] Can set route labels per player
- [ ] Can delete waypoints and players
- [ ] New play animates correctly in view mode
- [ ] Custom plays persist in localStorage across sessions
- [ ] Can edit existing built-in plays (creates an "override" copy)
- [ ] Can delete custom plays
- [ ] Can reorder plays in the selector

### 2.2 Formation Templates

**Files to modify:** `modules/editor.js`

Pre-built formation templates that place 5 players in standard positions:

```javascript
const FORMATIONS = {
  'Spread':          { positions: { C: [17.5, 0], QB: [17.5, -3], WR1: [4, 0], WR2: [31, 0], RB: [17.5, -5.5] } },
  'Twins Right':     { positions: { C: [17.5, 0], QB: [17.5, -3], WR1: [27, 0], WR2: [32, 0], RB: [17.5, -5.5] } },
  'Twins Left':      { positions: { C: [17.5, 0], QB: [17.5, -3], WR1: [8, 0], WR2: [3, 0], RB: [17.5, -5.5] } },
  'Trips Right':     { positions: { C: [17.5, 0], QB: [17.5, -3], WR1: [24, 0], WR2: [28, 0], WR3: [32, 0] } },
  'Trips Left':      { positions: { C: [17.5, 0], QB: [17.5, -3], WR1: [11, 0], WR2: [7, 0], WR3: [3, 0] } },
  'Bunch Right':     { positions: { C: [17.5, 0], QB: [17.5, -3], WR1: [26, 0], WR2: [28, -1], WR3: [30, 0] } },
  'Bunch Left':      { positions: { C: [17.5, 0], QB: [17.5, -3], WR1: [9, 0], WR2: [7, -1], WR3: [5, 0] } },
  'RB Offset Right':  { positions: { C: [17.5, 0], QB: [17.5, -3], WR1: [4, 0], WR2: [31, 0], RB: [22, -5] } },
  'RB Offset Left':  { positions: { C: [17.5, 0], QB: [17.5, -3], WR1: [4, 0], WR2: [31, 0], RB: [13, -5] } },
  'Empty':           { positions: { C: [17.5, 0], QB: [17.5, -3], WR1: [4, 0], WR2: [31, 0], WR3: [24, 0] } },
};
```

User selects formation → players snap to positions → then draw routes.

**Acceptance Criteria:**
- [ ] Formation picker dropdown in edit mode
- [ ] Selecting formation repositions all players
- [ ] Custom formations can be saved
- [ ] Formation name auto-populates play's `formation` field

### 2.3 Pre-Snap Motion Editor

**Files to modify:** `modules/editor.js`

Allow setting motion on a player:
1. Select player in edit mode
2. Tap "Add Motion" button
3. Tap the field where the player starts pre-motion
4. Motion path renders: `from` (tap point) → `to` (current position)

Data stored as existing `motion: { from: [x, y], to: [x, y] }` property.

**Acceptance Criteria:**
- [ ] Can add pre-snap motion to any non-center player
- [ ] Motion animates correctly in view mode (MOTION → SET → HIKE sequence)
- [ ] Can remove motion from a player
- [ ] Can adjust motion start point by dragging

### 2.4 Ball Path Editor

**Files to modify:** `modules/editor.js`

Ball path defines who has the ball and when:
1. In edit mode, a "Ball" section shows the ball path timeline
2. Default: snap from Center to QB at time 0
3. "Add Event" button → pick type (snap/throw/handoff/lateral) → pick from player → pick to player → set time
4. Timeline shows events in order

**Acceptance Criteria:**
- [ ] Can define ball path with snap, throw, handoff, lateral events
- [ ] Ball animation works correctly in view mode
- [ ] Throw arcs render properly for custom throws
- [ ] Can edit/delete ball path events

### 2.5 Import/Export

**Files to create:** `modules/import-export.js`

- **Export:** Save entire playbook (built-in overrides + custom plays) as JSON file download
- **Import:** Upload JSON file to load a playbook
- **Share link:** Encode a single play as a compressed URL parameter (for sharing one play)

```javascript
// Export format
{
  version: 1,
  exportDate: '2026-03-14T10:00:00Z',
  teamName: 'SP Chiefs',
  customPlays: [...],
  builtinOverrides: { 0: {...}, 3: {...} },  // index → modified play
  roster: {...},  // Phase 3
}
```

**Acceptance Criteria:**
- [ ] Export downloads a `.json` file
- [ ] Import loads and validates the JSON
- [ ] Malformed JSON shows a clear error
- [ ] Share link encodes a single play (URL length < 2000 chars with compression)

### Phase 2 Component Architecture

```
index.html
├── modules/
│   ├── state.js          (from Phase 1)
│   ├── renderer.js       (from Phase 1, add hit testing)
│   ├── animation.js      (from Phase 1)
│   ├── ui.js             (from Phase 1, add edit mode toggle)
│   ├── coach.js          (from Phase 1)
│   ├── queue.js          (from Phase 1)
│   ├── touch.js          (from Phase 1, add edit mode gestures)
│   ├── editor.js         (NEW — play editor logic)
│   ├── formations.js     (NEW — formation templates)
│   └── import-export.js  (NEW — playbook I/O)
├── plays.js              (built-in plays, read-only)
└── app.js                (orchestrator)
```

---

## 5. Phase 3: Player & Team Management

**Goal:** Move from hardcoded roster to a flexible team management system. Any coach can set up their team, assign players to positions, and get personalized route cards.

**Estimated Effort:** Medium (2-3 Sonnet agent sessions)

### 3.1 Roster Management

**Files to create:** `modules/roster.js`, `pages/roster.html` (or in-app panel)
**Files to modify:** `plays.js` (decouple hardcoded PLAYERS), `modules/state.js`, `modules/renderer.js`

**Roster Data Model:**
```javascript
// localStorage key: 'playbook:roster'
{
  teamName: 'SP Chiefs',
  players: [
    {
      id: 'player-1',
      name: 'Braelyn',
      nickname: '',
      color: '#1a1a1a',
      borderColor: '#ffffff',
      role: 'QB',           // QB, Center, WR, RB, Sub
      tier: 'starter',      // starter, rotation, sub
      attributes: {
        speed: 4,           // 1-5 scale
        agility: 3,
        hands: 4,
        arm: 5,
        footballIQ: 4,
        toughness: 3,
      },
      locked: true,         // Can't be subbed out (QB, Center)
      jerseyNumber: null,
      notes: 'Only girl on roster — strong arm, smart',
    },
    // ... up to 15 players
  ],
}
```

**UI — Roster Panel:**
```
┌──────────────────────────────────────┐
│ 👥 TEAM ROSTER            [+ Player] │
├──────────────────────────────────────┤
│ ● Braelyn Fisher     QB    ★★★★☆    │
│   #-- | Speed:4 Hands:4 Arm:5       │
├──────────────────────────────────────┤
│ ● Lenox Lindsay      C     ★★★☆☆   │
│   #-- | Speed:3 Hands:3 Arm:2       │
├──────────────────────────────────────┤
│ ... (scrollable list)                │
├──────────────────────────────────────┤
│ Starters: 5 | Rotation: 2 | Subs: 2 │
└──────────────────────────────────────┘
```

Tap a player → edit modal with:
- Name, color (picker), role (dropdown), attributes (1-5 star taps), notes
- Color picker should include preset "team colors" plus custom

**Migration path:** On first load, if no roster exists in localStorage, auto-import from the current hardcoded `PLAYERS` object so existing users see their familiar setup.

**Acceptance Criteria:**
- [ ] Can add/edit/remove players from roster
- [ ] Player colors show on field and in filter
- [ ] Roster persists in localStorage
- [ ] Changing a player's color updates all plays
- [ ] Plays reference generic positions (QB, C, WR1, WR2, RB) with player assignments, not hardcoded names
- [ ] Max 15 players per roster

### 3.2 Player-Specific Route Cards

**Files to create:** `modules/route-cards.js`

Auto-generate a personalized view for each player showing ONLY their route across all plays:

```
┌──────────────────────────────────────┐
│ 🏈 COOPER'S ROUTE CARD              │
├──────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │Mesh │ │Flood│ │Rev. │ │Slant│   │
│ │ ↗→  │ │ →↑  │ │←←← │ │ →↗  │   │
│ │CROSS│ │FLAT │ │REV! │ │FLAT │   │
│ └─────┘ └─────┘ └─────┘ └─────┘   │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │FWhel│ │Later│ │Scrn │           │
│ │ ↑↑  │ │ N/A │ │ →↑  │           │
│ │SLANT│ │     │ │SCRN!│           │
│ └─────┘ └─────┘ └─────┘           │
├──────────────────────────────────────┤
│ [Print] [Share]                      │
└──────────────────────────────────────┘
```

Each mini-card shows:
- Play name
- Simplified route arrow (one or two direction arrows)
- Route label
- The player's read number (if any)

This replaces the Python-generated player card PNGs with an in-app, always-current version.

**Print-friendly version:** CSS `@media print` stylesheet that formats cards for 8.5×11 paper, 4 cards per page.

**Acceptance Criteria:**
- [ ] Route card view accessible from roster panel
- [ ] Shows all plays the player appears in
- [ ] Each play shows a mini field with just that player's route highlighted
- [ ] Printable to paper (CSS print layout)
- [ ] Shareable as image (canvas → PNG export)

### 3.3 Depth Chart and Rotation

**Files to create:** `modules/depth-chart.js`

Simple depth chart interface:

```
Position    Starter    Backup
QB          Braelyn    Marshall
Center      Lenox      Bear
WR1         Greyson    Jordy
WR2         Cooper     Mason
RB          Marshall   Zeke
```

Drag players between positions. The depth chart drives substitution recommendations — when subbing in the editor, suggest the backup for that position first.

**Acceptance Criteria:**
- [ ] Can assign starters and backups for each position
- [ ] Substitution menu prioritizes depth chart backups
- [ ] Depth chart persists in localStorage
- [ ] Can drag players between slots

### 3.4 Attendance Tracker (Lightweight)

**Files to create:** `modules/attendance.js`

Before each practice/game, coach marks who's present. This adjusts:
- Which players appear in the substitution pool
- Rotation recommendations
- Route card generation (only generate for present players)

```javascript
// localStorage key: 'playbook:attendance'
{
  '2026-03-15': {
    type: 'practice', // or 'game'
    present: ['player-1', 'player-2', ...],
    absent: ['player-5'],
  }
}
```

**Acceptance Criteria:**
- [ ] Quick attendance check-in screen (checkboxes)
- [ ] Absent players excluded from substitution pool
- [ ] Attendance history viewable
- [ ] "Who's here today?" affects all downstream features

### Phase 3 Data Flow

```
Roster (localStorage)
  ↓
Depth Chart (who plays where)
  ↓
Attendance (who's here today)
  ↓
Play Renderer (colors, names from roster)
  ↓
Substitution Engine (suggest backups based on depth chart + attendance)
  ↓
Route Cards (generated per player from plays + roster)
```

---

## 6. Phase 4: Game Day Tools

**Goal:** Turn the app into a complete sideline companion — call plays, track results, see stats, print wristbands.

**Estimated Effort:** Large (3-4 Sonnet agent sessions)

### 4.1 Interactive Call Sheet (Enhanced Coach Panel)

**Files to modify:** `modules/coach.js`, `style.css`
**Files to create:** `modules/call-sheet.js`

Evolve the existing coach panel into a full call sheet:

```
┌──────────────────────────────────────┐
│ 🧠 CALL SHEET           [Score: 7-0]│
├──────────────────────────────────────┤
│ DOWN: [1st][2nd][3rd][4th]           │
│ FIELD: [Open][Mid][RZ][NRZ]         │
│ THEY:  [Man][Zone][Rush][?]          │
├──────────────────────────────────────┤
│ ★ BEST: Mesh (95)        [▶ Call]   │
│   GOOD: Flood Right (80) [▶ Call]   │
│   GOOD: Reverse (75)     [▶ Call]   │
│   OK:   RPO Slant (65)   [▶ Call]   │
│   OK:   Screen (60)      [▶ Call]   │
├──────────────────────────────────────┤
│ HISTORY: Mesh✅ Flood✅ Mesh❌ Rev✅  │
│ Recent: 3/4 (75%) | Mesh: 1/2 (50%) │
├──────────────────────────────────────┤
│ TENDENCIES:                          │
│ • Run Mesh 2x → try Mesh Wheel      │
│ • Flood Right 2x → try Flood Fake   │
│ • Screen 1x → set up Screen Fake    │
└──────────────────────────────────────┘
```

**Key additions over current coach panel:**

1. **"Call" button** — Taps to call the play, auto-adds to queue, starts animation
2. **Play history strip** — Shows last N plays called with ✅/❌ results
3. **Tendency tracker** — Warns when you've run the same play too many times and suggests the counter/mirror play
4. **Score tracker** — Simple scoreboard (tap to increment)
5. **Counter-play recommendations** — After running Mesh 2x, suggest Mesh Wheel. After Flood Right 2x, suggest Flood Fake. This uses the mirror play relationships already documented in play notes.

**Counter-play mapping** (new data in plays.js or separate config):
```javascript
const COUNTER_PLAYS = {
  'Mesh':           { counter: 'Mesh Wheel',       after: 2, reason: 'DB expects crossing → Cooper wheels deep' },
  'Flood Right':    { counter: 'Flood Fake',        after: 2, reason: 'Defense cheats right → Cooper post deep' },
  'Quick Slants NRZ': { counter: 'Slant & Go',     after: 2, reason: 'DB jumps slant → Greyson goes deep' },
  'Screen':         { counter: 'Screen Fake Post',  after: 1, reason: 'Defense crashes screen → Greyson post' },
  'Reverse':        { counter: 'Reverse Fake',      after: 1, reason: 'Defense chases motion → Greyson slant open' },
};
```

**Acceptance Criteria:**
- [ ] Call button immediately loads and starts the play
- [ ] Play history shows last 20 plays with results
- [ ] Tendency tracker triggers after configured number of repeats
- [ ] Counter-play suggestions appear contextually
- [ ] Score tracker with +6, +1, +2 buttons (TD, PAT, safety)
- [ ] All game state persists in localStorage

### 4.2 Play Tracking and Stats

**Files to create:** `modules/game-stats.js`

Track per-play results throughout a game:

```javascript
// localStorage key: 'playbook:games'
{
  '2026-03-15': {
    opponent: 'Team Red',
    score: { us: 21, them: 14 },
    plays: [
      {
        playName: 'Mesh',
        quarter: 1,
        down: 1,
        result: 'success',     // success | fail | turnover | penalty
        yards: 8,              // optional
        td: false,
        notes: 'Greyson wide open',
        timestamp: '2026-03-15T10:32:00',
      },
      // ...
    ],
  },
}
```

**Halftime Stats View:**
```
┌──────────────────────────────────────┐
│ 📊 HALFTIME STATS                   │
├──────────────────────────────────────┤
│ Score: US 14 — THEM 7               │
│ Plays: 12 | Success: 8 (67%)        │
├──────────────────────────────────────┤
│ BEST PLAYS:              SUCCESS %   │
│  Mesh                    3/3 (100%)  │
│  Flood Right             2/2 (100%)  │
│  Hitch & Go              1/2 (50%)   │
├──────────────────────────────────────┤
│ OVERUSED:                            │
│  ⚠ Mesh run 3x — try Mesh Wheel    │
├──────────────────────────────────────┤
│ UNDERUSED:                           │
│  Screen (0x) — they're rushing       │
│  Braelyn Lateral (0x) — surprise!    │
├──────────────────────────────────────┤
│ THEY'RE PLAYING: Man (80% of snaps) │
│ → Focus on: Mesh, Slants, Crosses   │
└──────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Can record result (success/fail) and optional yards for each play
- [ ] Halftime stats view shows per-play success rates
- [ ] Overuse/underuse warnings
- [ ] Coverage tendency tracking (man vs zone)
- [ ] Post-game summary exportable

### 4.3 Wristband Play Sheet Generator

**Files to create:** `modules/wristband.js`

Generate printable wristband play sheets for the QB and other players:

**QB Wristband (8 plays, 2-column):**
```
┌───────────┬───────────┐
│ 1. Mesh   │ 5. Slants │
│ 2. Flood R│ 6. Wheel  │
│ 3. Reverse│ 7. Lateral│
│ 4. Screen │ 8. Fade   │
└───────────┴───────────┘
```

**Player Wristband (simplified, just their route):**
```
┌───────────────────────┐
│ COOPER'S CALLS        │
│ 1. → Cross L→R       │
│ 2. → Flat R          │
│ 3. →← Reverse!       │
│ 4. → Flat R          │
│ 5. → Slant           │
│ 6. ↑ Screen!         │
│ 7. ↑ Go (clear)      │
│ 8. → Flat            │
└───────────────────────┘
```

Print layout: 4 wristbands per page, designed for standard wristband coach sheets (3" × 5").

**Acceptance Criteria:**
- [ ] Select which plays to include on wristband (8-12)
- [ ] QB wristband shows play names + key routes
- [ ] Player wristband shows their route name per play
- [ ] Print layout fits standard wristband dimensions
- [ ] PDF export option

### 4.4 Game Timer Integration

**Files to create:** `modules/game-timer.js`

Simple game clock for leagues that don't have a scoreboard:
- Configurable quarter length (default: 10 min running, 2 min stopped for last 2 min of half)
- Half marker
- Timeout tracker (3 per half)
- Play clock (7 seconds — already exists, just integrate with game flow)

This is lower priority — many leagues provide game clocks. But useful for scrimmages and practices.

**Acceptance Criteria:**
- [ ] Start/stop game clock
- [ ] Quarter counter with configurable lengths
- [ ] Timeout tracking
- [ ] Buzzer/vibrate at quarter end

### Phase 4 Data Model Additions

```javascript
// New localStorage keys
'playbook:currentGame'     // Active game state (in-progress)
'playbook:gameHistory'     // Array of completed games
'playbook:wristbandConfig' // Which plays, order, player assignments
'playbook:counterPlays'    // Counter-play relationships
```

---

## 7. Phase 5: Practice Planning

**Goal:** Move the practice plans, drill library, and skill progression from markdown files into the app.

**Estimated Effort:** Large (3-4 Sonnet agent sessions)

### 5.1 Drill Library

**Files to create:** `modules/drills.js`, `data/drills.json`
**Source data:** `~/clawd/memory/flag-football/PRACTICE-DRILL-PLAN.md`

Convert the existing drill catalog into structured data:

```javascript
// data/drills.json
[
  {
    id: 'mirror-dodge',
    name: 'Mirror Dodge',
    category: 'evasion',      // evasion, flag-pulling, passing, routes, team
    duration: 5,              // minutes
    players: 'all',           // 'all' | 'pairs' | 'groups-of-3' | 'team'
    equipment: ['cones'],
    description: 'Pairs face each other 3yd apart in 5yd lane. Ball carrier shuffles/jukes, defender mirrors.',
    coachingPoints: [
      'Eyes on hips, not ball',
      'React, dont guess',
      'Stay low in athletic stance',
    ],
    progression: [
      { week: 1, focus: 'Basic mirror' },
      { week: 2, focus: 'Add juke move' },
      { week: 3, focus: 'Add spin move' },
    ],
    relatedPlays: [],  // which plays this drill prepares for
    ageAdaptation: {
      '6-7': 'Wider lane (8yd), slower pace',
      '8-10': 'Standard',
      '11-12': 'Narrower lane (3yd), add flag pull',
    },
  },
  // ... 15-20 drills from PRACTICE-DRILL-PLAN.md
]
```

**UI — Drill Library:**
```
┌──────────────────────────────────────┐
│ 📋 DRILL LIBRARY    [Filter▼] [+New]│
├──────────────────────────────────────┤
│ 🏃 EVASION                          │
│   Mirror Dodge — 5 min — All        │
│   Gauntlet — 8 min — Groups         │
│   1v1 Juke — 5 min — Pairs          │
├──────────────────────────────────────┤
│ 🏈 PASSING                          │
│   Quick Release — 5 min — Pairs     │
│   Read Progression — 10 min — Team  │
├──────────────────────────────────────┤
│ 👋 FLAG PULLING                     │
│   Eyes-Buzz-Rip — 5 min — Pairs     │
│   Gauntlet Pull — 8 min — Groups    │
├──────────────────────────────────────┤
│ 🏃‍♂️ ROUTES                          │
│   Route Trees — 10 min — All        │
│   Timing Routes — 8 min — QB+WR    │
└──────────────────────────────────────┘
```

Tap a drill → expanded view with description, coaching points, setup diagram, and progression notes.

**Acceptance Criteria:**
- [ ] 15+ drills loaded from existing practice plan data
- [ ] Filterable by category, duration, player count
- [ ] Drill detail view with coaching points
- [ ] Can add custom drills
- [ ] Each drill links to related plays

### 5.2 Practice Plan Builder

**Files to create:** `modules/practice-plan.js`

Drag-and-drop practice plan builder:

```
┌──────────────────────────────────────┐
│ 📝 PRACTICE PLAN — Week 3, Tue      │
│ Total: 75 min | Drills: 8           │
├──────────────────────────────────────┤
│ 0:00 │ Warm-up Jog         │  5 min │
│ 0:05 │ Mirror Dodge         │  5 min │
│ 0:10 │ Eyes-Buzz-Rip        │  5 min │
│ 0:15 │ Quick Release         │  5 min │
│ 0:20 │ ★ INSTALL: Mesh      │ 10 min │
│ 0:30 │ Route Trees          │  8 min │
│ 0:38 │ ★ INSTALL: Flood R   │ 10 min │
│ 0:48 │ 5v5 Scrimmage        │ 15 min │
│ 1:03 │ Water + Huddle        │  5 min │
│ 1:08 │ Conditioning          │  7 min │
├──────────────────────────────────────┤
│ [+ Add Drill] [+ Add Play Install]  │
│ [Save] [Copy to Next Week] [Print]  │
└──────────────────────────────────────┘
```

Features:
- Drag to reorder drills
- Auto-calculate start times
- "Install Play" blocks that link to specific plays (opens the play animation during practice)
- Templates: "First Practice", "Game Week", "Light Practice"
- Print-friendly format

**Data Model:**
```javascript
// localStorage key: 'playbook:practicePlans'
{
  '2026-03-18': {
    week: 3,
    day: 'tuesday',
    totalMinutes: 75,
    blocks: [
      { type: 'drill', drillId: 'warm-up-jog', duration: 5, notes: '' },
      { type: 'drill', drillId: 'mirror-dodge', duration: 5, notes: 'Focus on juke this week' },
      { type: 'play-install', playId: 0, duration: 10, notes: 'Walk through, then half speed' },
      { type: 'scrimmage', duration: 15, notes: 'Run only installed plays' },
      { type: 'custom', name: 'Water + Huddle', duration: 5, notes: '' },
    ],
  },
}
```

**Acceptance Criteria:**
- [ ] Can create a practice plan by adding drills from the library
- [ ] Can add play installation blocks (links to playbook plays)
- [ ] Drag to reorder blocks
- [ ] Auto-calculates timeline
- [ ] Can save and duplicate plans
- [ ] Print-friendly layout
- [ ] Templates for common practice structures

### 5.3 Progressive Skill Building

**Files to create:** `modules/progression.js`

Week-over-week progression tracker:

```
┌──────────────────────────────────────┐
│ 📈 SEASON PROGRESSION               │
├──────────────────────────────────────┤
│ Week 1: Fundamentals                 │
│   ✅ Flag pulling basics             │
│   ✅ 2x2 Spread formation           │
│   ✅ Play: Mesh                      │
│   ✅ Play: Flood Right               │
├──────────────────────────────────────┤
│ Week 2: Quick Game                   │
│   ✅ Route running (slant, out)      │
│   ✅ Play: Quick Slants NRZ          │
│   ⬜ Play: Screen                    │
│   ⬜ Play: RPO Slant                 │
├──────────────────────────────────────┤
│ Week 3: Misdirection (this week)     │
│   ⬜ Pre-snap motion                 │
│   ⬜ Play: Reverse                   │
│   ⬜ Play: Hitch & Go               │
│   ⬜ Man vs Zone recognition         │
├──────────────────────────────────────┤
│ [Edit Plan] [Reset]                  │
└──────────────────────────────────────┘
```

This is a simple checklist with suggested week-by-week skill and play introduction order. Pre-populated with a sensible default for 5v5 youth, editable by the coach.

**Acceptance Criteria:**
- [ ] Default 8-week progression plan
- [ ] Check off skills/plays as mastered
- [ ] Editable (add/remove/reorder items)
- [ ] Links plays to the playbook for quick review
- [ ] Visual progress tracker (% complete per week)

---

## 8. Phase 6: Monetization Prep

**Goal:** If the app gains traction, prepare it for wider distribution with auth, sharing, and subscription tiers.

**Estimated Effort:** XL (multiple phases, backend required)

### 6.1 Auth + Accounts

**Backend:** Supabase (PostgreSQL + Auth + Storage)
**Files to create:** `modules/auth.js`, `api/` directory

Supabase provides:
- Email/password auth (free tier: 50K MAU)
- Social login (Google, Apple)
- PostgreSQL database
- Row-level security
- File storage (for custom play diagrams, exported playbooks)

**User Model:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  team_name TEXT,
  tier TEXT DEFAULT 'free',  -- 'free', 'coach', 'pro'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Data Migration:**
- On signup, upload localStorage data to Supabase
- On login, sync from Supabase to localStorage
- Offline-first: always write to localStorage, sync to cloud when online
- Conflict resolution: last-write-wins with timestamps

**Acceptance Criteria:**
- [ ] Email/password signup and login
- [ ] Google and Apple social login
- [ ] Data syncs between devices
- [ ] Offline-first with background sync
- [ ] Existing localStorage users can migrate seamlessly

### 6.2 Playbook Sharing / Marketplace

**Backend:** Supabase Storage + Database

Allow coaches to share playbooks:

```sql
CREATE TABLE shared_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  format TEXT DEFAULT '5v5',  -- '5v5', '7v7'
  age_group TEXT,             -- '6-8', '8-10', '10-12'
  play_count INTEGER,
  data JSONB NOT NULL,
  downloads INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  price_cents INTEGER DEFAULT 0,  -- 0 = free
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Features:
- **Share publicly** — anyone can download
- **Share via link** — private link to specific people
- **Marketplace** (future) — sell premium playbooks ($2.99-$9.99)
- **Rating system** — 1-5 stars with reviews

**Acceptance Criteria:**
- [ ] Can share a playbook publicly
- [ ] Can share via private link
- [ ] Can browse and download shared playbooks
- [ ] Rating and review system
- [ ] Author attribution

### 6.3 Team Invites

Allow coaches to invite assistant coaches and parents:

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'viewer',  -- 'owner', 'coach', 'parent', 'viewer'
  invite_code TEXT UNIQUE,
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Roles:
- **Owner** — full access, billing
- **Coach** — edit plays, manage roster, call sheet
- **Parent** — view-only, see their kid's route cards
- **Viewer** — read-only access to playbook

**Acceptance Criteria:**
- [ ] Generate invite link/code for team
- [ ] Role-based access control
- [ ] Parents see only their kid's info
- [ ] Real-time sync (Supabase Realtime)

### 6.4 Subscription Tiers

| Feature | Free | Coach ($4.99/mo) | Pro ($9.99/mo) |
|---------|------|-------------------|-----------------|
| View built-in plays | ✅ | ✅ | ✅ |
| Create custom plays | 3 max | Unlimited | Unlimited |
| Player roster | 5 max | 20 max | 50 max |
| Route cards | ✅ | ✅ | ✅ |
| Call sheet | ✅ | ✅ | ✅ |
| Game stats | Last 3 games | Full season | Multi-season |
| Practice plans | 1 template | Full library | Full + custom drills |
| Wristband generator | ❌ | ✅ | ✅ |
| Team sharing | ❌ | 3 members | Unlimited |
| Cloud sync | ❌ | ✅ | ✅ |
| Export to PDF | ❌ | ✅ | ✅ |
| Marketplace access | Browse | Buy + Sell | Buy + Sell |
| Support | Community | Email | Priority |

Payment: Stripe Checkout (simplest integration, handles mobile well).

**Acceptance Criteria:**
- [ ] Free tier works fully offline with no account
- [ ] Paywall is soft — never blocks viewing built-in plays
- [ ] Stripe integration for recurring billing
- [ ] Tier enforcement on feature gates
- [ ] 7-day free trial for Coach tier

---

## 9. Technical Recommendations

### Should It Stay Vanilla JS?

**Recommendation: Stay vanilla through Phase 2. Evaluate at Phase 3.**

**Arguments for staying vanilla:**
- Zero build step — crucial for the "just open index.html" developer experience
- No framework churn — this app will last years without maintenance
- PWA/offline is simpler without framework hydration
- The app is fundamentally a canvas renderer, not a CRUD app — React's DOM diffing adds nothing for canvas work
- File size: current app is ~100KB total. A React build would be 150KB+ of framework alone
- Any competent agent can modify vanilla JS without setup

**Arguments for migrating to Svelte (Phase 3+):**
- Roster management, practice planning, and settings screens ARE CRUD-heavy — forms, lists, modals
- State management gets complex with roster + plays + games + drills + settings
- Svelte compiles to vanilla JS (small bundle, no runtime), so the "no framework overhead" argument is weaker
- SvelteKit would give routing for multi-page app structure

**Decision:** 
- **Phase 1-2:** Stay vanilla JS with ES modules. The canvas engine doesn't benefit from a framework.
- **Phase 3+:** If building, consider Svelte for the management pages (roster, practice plans, settings) while keeping the canvas renderer as vanilla JS. Svelte can mount components into specific DOM containers — no need for full SPA rewrite.
- **Phase 6:** If going full SaaS, SvelteKit with Supabase backend is the recommended stack.

### Backend Needs

| Phase | Backend | Recommendation |
|-------|---------|---------------|
| 1-2 | None | Pure client-side, localStorage |
| 3-4 | None | Still localStorage, but prepare data models for migration |
| 5 | Optional | Cloud sync nice-to-have, not required |
| 6 | Required | Supabase (PostgreSQL + Auth + Storage + Realtime) |

**Why Supabase over Firebase:**
- PostgreSQL > Firestore for relational data (teams → players → plays → games)
- Row-level security is more intuitive
- Free tier is generous (500MB DB, 1GB storage, 50K MAU)
- Better offline-first story with pg_graphql
- SQL is portable if you outgrow Supabase

### PWA Improvements

Phase 1:
- Fix service worker to use content-hash caching
- Add proper app icons (192px, 512px PNG)
- Add `apple-touch-icon` meta tag
- Add offline fallback page

Phase 2+:
- Background sync for cloud data
- Push notifications (game reminders, practice alerts)
- Share target API (receive shared playbooks)
- Web App Manifest shortcuts (quick-launch to call sheet, practice plan)

### Performance Considerations

The app is already fast (no dependencies, canvas rendering). Key things to watch:

1. **Canvas redraw optimization** — currently redraws entire field every frame. For static moments (not animating), draw once and cache. Use `requestAnimationFrame` only when animating.
2. **localStorage size** — 5-10MB limit. With full game history across a season, could approach limits. Compress JSON or move to IndexedDB for larger datasets.
3. **Image export** — Route card generation involves drawing to canvas → `toDataURL()`. Batch this for multiple players to avoid UI jank.
4. **Module loading** — ES modules load in waterfall. Use `modulepreload` hints in HTML for critical modules.

### Testing Strategy

- **Phase 1:** Manual testing checklist (device matrix: iPhone SE, iPhone 15, iPad, Android phone)
- **Phase 2:** Add Playwright E2E tests for play editor (create play, draw route, save, verify animation)
- **Phase 3+:** Unit tests for data models (roster, depth chart, stats calculations) using Vitest (works with vanilla JS modules)

### Deployment

- **Current:** GitHub Pages (free, auto-deploy from `main`)
- **Phase 1-5:** Stay on GitHub Pages — no backend needed
- **Phase 6:** Migrate to Vercel (SvelteKit) or keep GitHub Pages for static + Supabase for backend
- **Custom domain:** flagplaybook.com or similar ($12/yr)

---

## Phase Summary

| Phase | Goal | Effort | Key Deliverable |
|-------|------|--------|----------------|
| **1** | Foundation & Polish | M (2-3 sessions) | Working mobile app for Saturday games |
| **2** | Customization Engine | L (3-4 sessions) | Custom play creator with drag routes |
| **3** | Player & Team Management | M (2-3 sessions) | Roster, route cards, depth chart |
| **4** | Game Day Tools | L (3-4 sessions) | Smart call sheet, stats, wristbands |
| **5** | Practice Planning | L (3-4 sessions) | Drill library, practice plan builder |
| **6** | Monetization Prep | XL (5+ sessions) | Auth, sharing, subscriptions |

**Total estimated effort:** 18-22 Sonnet agent sessions across all phases.

**Recommended order:** 1 → 2 → 4 → 3 → 5 → 6

Rationale for reordering 4 before 3: The game day tools (enhanced call sheet, play tracking) provide immediate coaching value with the existing hardcoded roster. Roster management is important but doesn't unblock coaching utility. Getting the call sheet and wristbands ready for game day has higher ROI than roster CRUD.

---

*This plan should be sufficient for a Sonnet agent to pick up any phase and implement it cold. Each phase has explicit files, data models, UI wireframes, and acceptance criteria. No questions needed — just build.*
