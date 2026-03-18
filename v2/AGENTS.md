# AGENTS.md — Flag Football Playbook PWA Reference

> Zero-context reference. Read this and be immediately productive.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Coordinate System](#2-coordinate-system)
3. [Data Schemas](#3-data-schemas)
4. [Store API](#4-store-api)
5. [Router](#5-router)
6. [View Pattern](#6-view-pattern)
7. [Canvas Rendering](#7-canvas-rendering)
8. [Play Library](#8-play-library)
9. [Styling Guide](#9-styling-guide)
10. [Common Patterns / Gotchas](#10-common-patterns--gotchas)

---

## 1. Architecture Overview

### Tech Stack

| Layer | Tech |
|-------|------|
| Language | Vanilla JavaScript (ES modules, no transpiler) |
| Rendering | HTML Canvas 2D API |
| State | Custom reactive store (localStorage persistence) |
| Routing | Hash-based SPA router (`#/path`) |
| Offline | Service Worker + `manifest.json` (installable PWA) |
| Dependencies | **Zero.** No npm, no bundler, no framework. |
| Entry | `<script type="module" src="js/app.js">` |

### File Structure

```
v2/
├── index.html                  # Shell: <nav id="app-nav"> + <main id="app-root">
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker (caching, offline)
├── css/
│   └── app.css                 # All styles — single file, section-commented
├── js/
│   ├── app.js                  # Bootstrap: store + router + nav render
│   ├── store.js                # Reactive state store with localStorage
│   ├── router.js               # Hash router with param/query parsing
│   ├── play-library.js         # PLAY_LIBRARY array + filter helpers
│   ├── utils/
│   │   ├── dom.js              # el(), clear(), showToast()
│   │   └── storage.js          # load(), save(), migrate()
│   ├── views/
│   │   ├── home.js             # Dashboard / nav cards
│   │   ├── roster.js           # Player management (CRUD table)
│   │   ├── play-library.js     # Browse/filter all 30 plays (grid)
│   │   ├── play-viewer.js      # Animated single-play viewer
│   │   ├── playbook.js         # Playbook builder (create/edit/order)
│   │   └── player-share.js     # Coach share-link generator + player read-only view
│   └── canvas/
│       ├── renderer.js         # Static renderPlay() + individual draw functions
│       └── animator.js         # PlayAnimator class (60fps, phase-based)
└── icons/
    └── icon-192.png            # PWA icon
```

### Boot Sequence

```
index.html loads js/app.js (type="module")
  │
  ├── createStore()           → hydrates state from localStorage
  │     └── window.__store = store   (global access for all views)
  │
  ├── createRouter(routes, #app-root)
  │
  ├── renderNav()             → builds <nav> links, marks active
  │
  └── router.start()
        └── window.addEventListener('hashchange', render)
              └── render()
                    ├── calls currentCleanup() if exists
                    ├── parses hash → matches route → extracts params
                    ├── outlet.innerHTML = ''
                    └── view(params, outlet) → currentCleanup
```

The `index.html` also contains inline service worker registration that shows an update toast when a new SW version is detected.

---

## 2. Coordinate System

### Field Coordinates

```
X: 0 ──────────────────────────── 35
   (left sideline)        (right sideline)
   center = 17.5

Y: negative  (behind LOS / backfield)
   Y = 0     ← Line of Scrimmage
   positive  (downfield)
```

- All positions, routes, and defense markers use `[x, y]` arrays in field coordinates
- Route waypoints are field coords, not canvas pixels
- Defense array: `[[x1,y1], [x2,y2], ...]` in field coords

### `fieldToCanvas()` — Coordinate Conversion

**Location:** `js/canvas/renderer.js` (also imported into `animator.js`)

```js
export function fieldToCanvas(fieldX, fieldY, canvasWidth, canvasHeight)
// Returns: { x: number, y: number }  (canvas pixels)
```

**How it works:**
```
padding = 20px on all sides
usableWidth  = canvasWidth  - 40
usableHeight = canvasHeight - 40

x = padding + (fieldX / 35) * usableWidth

losY = padding + usableHeight * 0.4   // LOS is 40% from top
scale = usableHeight / 30              // 30 "field units" tall
y = losY - fieldY * scale              // Y=0 → losY; positive=upward on screen
```

**Key insight:** The canvas Y-axis is inverted — positive fieldY (downfield) moves *up* on screen (smaller canvas Y), because we want "downfield" to appear toward the top of the canvas.

### LOS Position

- **Field:** `Y = 0`
- **Canvas:** 40% from the top of the canvas (leaving 60% for downfield routes)
- Behind LOS (negative Y) occupies the bottom 40%
- 25 units of downfield, 5 units of backfield visible by default

### Standard Player Starting Positions

| Position | Typical `pos` | Notes |
|----------|---------------|-------|
| QB | `[17.5, -3]` | Center of field, 3 yards back |
| C (Center) | `[17.5, 0]` | On the LOS, center |
| WR1 | `[4, 0]` or `[5, 0]` | Left side, on LOS |
| WR2 | `[24, 0]` or `[31, 0]` | Right side, on LOS |
| RB | `[17.5, -5.5]` | Behind QB in backfield |

Positions vary per formation — these are Spread defaults. Check each play for actuals.

---

## 3. Data Schemas

### Play Schema

Every play in `PLAY_LIBRARY` follows this structure:

```js
{
  id: 'mesh',                     // string — URL-safe kebab-case, unique, used as route param
  name: 'Mesh',                   // string — display name
  formation: 'Spread',            // string — see §8 for valid values
  tags: ['core'],                 // string[] — see §8 for valid tags
  family: 'mesh',                 // string — play family/concept group, see §8
  isRunPlay: false,               // boolean — true = run play; false = pass play

  description: {
    fake: '...',                  // string — what the defense sees (misdirection)
    target: '...',                // string — actual intent / coaching tip
  },

  // For run plays, qbLook is null:
  qbLook: {
    eyes: 'WR2',                  // string — position QB looks at PRE-throw (fake)
    throw: 'WR1',                 // string — position QB actually throws to
    tip: '...',                   // string — coaching cue for QB
  },
  // OR: qbLook: null             // for run plays

  positions: {
    QB:  {
      pos: [17.5, -3],            // [fieldX, fieldY] — starting position
      route: [],                  // [[x,y], ...] waypoints — empty = no route
      label: '',                  // string — route label shown on canvas (e.g. 'MESH', 'FLAT')
      read: 0,                    // number — read order badge (0 = no badge; 1=primary, 4=last)
      dashed: false,              // boolean — dashed route line (check-down / decoy)
      // Optional:
      motion: {                   // pre-snap motion
        from: [31, -1],           // [x,y] motion start position
        to: [24, -1],             // [x,y] motion end position (= pos above)
      },
    },
    C:   { pos, route, label, read, dashed },
    WR1: { pos, route, label, read, dashed },
    WR2: { pos, route, label, read, dashed },
    RB:  { pos, route, label, read, dashed },
  },

  defense: [[10,5], [17.5,8], [25,5], [8,13], [27,13]],
  // Array of [fieldX, fieldY] — drawn as gray X markers

  timing: { 1: 1.5, 2: 2.0, 3: 3.0, 4: 4.0 },
  // Maps read number → time in seconds when that receiver becomes open
  // Keys are strings of read numbers; values are float seconds from snap

  ballPath: [
    { from: 'C',  to: 'QB',  time: 0,   type: 'snap'    },
    { from: 'QB', to: 'WR1', time: 1.5, type: 'throw'   },
    // type can be: 'snap' | 'throw' | 'handoff' | 'lateral'
    // time = seconds from snap (snap itself is time: 0)
    // first event MUST be snap from C to QB
  ],
}
```

**Full example (Mesh play):**
```js
{
  id: 'mesh',
  name: 'Mesh',
  formation: 'Spread',
  tags: ['core'],
  family: 'mesh',
  isRunPlay: false,
  description: {
    fake: 'Defense sees two receivers crossing — looks like a basic crossing route',
    target: 'Man coverage: crossing routes create natural picks. Hit WR1 at the mesh point',
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
    WR2: { pos: [24,-1],   route: [[24,6],[3,6]],  label: 'MESH',  read: 2, dashed: false,
           motion: { from: [31,-1], to: [24,-1] } },
    RB:  { pos: [17.5,-5.5], route: [[17.5,-3.5],[6,1]], label: 'FLAT', read: 3, dashed: false },
  },
  defense: [[10,5],[17.5,8],[25,5],[8,13],[27,13]],
  timing: { 1:1.5, 2:2.0, 3:3.0, 4:4.0 },
  ballPath: [
    { from:'C', to:'QB', time:0, type:'snap' },
    { from:'QB', to:'WR1', time:1.5, type:'throw' },
  ],
}
```

### Roster Item Schema

```js
{
  id: 'player_1234567890',   // string — 'player_' + Date.now()
  name: 'Braelyn',           // string — display name
  position: 'QB',            // string — one of: 'QB' | 'C' | 'WR1' | 'WR2' | 'RB'
  number: 12,                // number | null — jersey number, 0–99
}
```

### Playbook Schema

```js
{
  id: 'pb_1234567890',       // string — 'pb_' + Date.now()
  name: 'Game Day Plays',    // string — user-editable name
  createdAt: 1234567890,     // number — Date.now() at creation
  plays: [
    {
      playId: 'mesh',        // string — must match a play id in PLAY_LIBRARY
      codeName: 'Blue 42',   // string — coach's code name for the play (can be '')
      order: 0,              // number — sort order (0-based integer)
    },
    // ...
  ],
}
```

### Store State Shape

```js
{
  roster:          [],        // RosterItem[]
  playbooks:       [],        // Playbook[]
  activePlaybookId: null,     // string | null — id of the active/selected playbook
  preferences: {
    showDefense:      true,   // boolean
    showBall:         true,   // boolean
    showReadNumbers:  true,   // boolean
    showAllRoutes:    true,   // boolean
    speed:            'full', // 'teaching' | 'walkthrough' | 'full' | 'fast'
    highlightPosition: null,  // string | null — position to highlight (dims others)
  },
}
```

### localStorage Keys

| Key | Value |
|-----|-------|
| `pb_roster` | `RosterItem[]` |
| `pb_playbooks` | `Playbook[]` |
| `pb_active_playbook` | `string \| null` |
| `pb_preferences` | `Preferences` |
| `pb_version` | `number` (schema version, currently `1`) |

---

## 4. Store API

**Access:** `window.__store` (set in `app.js`, available globally to all views)

### Methods

#### `store.get() → Object`
Returns a **deep copy** (JSON parse/stringify) of the current state. Safe to mutate the result.

```js
const { roster, preferences } = window.__store.get()
```

#### `store.set(partial) → void`
Merges partial state, persists to localStorage, notifies all subscribers.

**CRITICAL: `set()` does shallow merge per top-level key.**
- `roster`, `playbooks`, `activePlaybookId` → replace entirely
- `preferences` → `Object.assign` (shallow merge, so you can set one pref at a time)

```js
// Replace entire roster:
store.set({ roster: [...currentRoster, newPlayer] })

// Set one preference without touching others:
store.set({ preferences: { speed: 'teaching' } })  // only speed changes

// Set active playbook:
store.set({ activePlaybookId: 'pb_123' })
```

#### `store.subscribe(listener) → unsubscribeFn`
Registers a callback called with the new state after every `set()`. Returns an **unsubscribe function** — always call it on view cleanup.

```js
const unsubscribe = store.subscribe((newState) => {
  // re-render with newState
})
// Later:
unsubscribe()
```

#### `store.getRoster() → RosterItem[]`
Returns a shallow copy of the roster array.

#### `store.getPlaybooks() → Playbook[]`
Returns a shallow copy of the playbooks array.

#### `store.getActivePlaybook() → Playbook | null`
Finds and returns the playbook whose `id === state.activePlaybookId`, or `null`.

#### `store.getRosterMap() → Object`
Returns a position → name map built from starters (first player per position in POSITIONS order).

```js
// Example return:
{ QB: 'Braelyn', C: 'Lenox', WR1: 'Greyson', WR2: 'Marshall', RB: 'Cooper' }
// Only includes positions that have a player assigned
```

#### `store.POSITIONS`
Array constant: `['QB', 'C', 'WR1', 'WR2', 'RB']` — the canonical position order.

### Subscription + Cleanup Pattern

```js
export function myView(params, outlet) {
  const store = window.__store

  function render() {
    const state = store.get()
    // ... build DOM
  }

  const unsubscribe = store.subscribe(() => render())
  render()

  return () => unsubscribe()  // ← router calls this on navigation away
}
```

---

## 5. Router

**Location:** `js/router.js`

Hash-based SPA router. All URLs use the `#` fragment: `https://example.com/app/#/play/mesh`

### How Routes Are Defined

In `app.js`:
```js
const router = createRouter([
  { path: '/',          view: homeView },
  { path: '/roster',   view: rosterView },
  { path: '/library',  view: playLibraryView },
  { path: '/playbooks',view: playbookView },
  { path: '/play/:id', view: playViewerView },
  { path: '/share',    view: playerShareView },
], document.getElementById('app-root'))
```

### How to Add a New Route

1. Create `js/views/myView.js` with the standard view function
2. Import it in `app.js`
3. Add to the routes array: `{ path: '/my-path', view: myView }`
4. Optionally add a nav link in `renderNav()` in `app.js`

### Params and Query String Parsing

**Path params** (`:name` segments):
```
Route:  /play/:id
URL:    #/play/mesh-left
params: { id: 'mesh-left', query: {} }
```

**Query string** (after `?`):
```
URL:    #/share?playbook=pb_123&player=greyson
params: { query: { playbook: 'pb_123', player: 'greyson' } }
```

Both are passed as `params` to the view function:
```js
export function myView(params, outlet) {
  const id    = params.id           // path param
  const pbId  = params.query?.playbook  // query param
}
```

### Cleanup Function Pattern

The router stores the return value of each view call as `currentCleanup`. On every navigation:
1. Calls `currentCleanup()` if it's a function
2. Clears `outlet.innerHTML`
3. Calls the new view

If a view returns nothing (like `homeView`), that's fine — the router skips cleanup.

404 paths redirect to `#/`.

---

## 6. View Pattern

### Standard View Signature

```js
export function myView(params, outlet) {
  // params: { ...pathParams, query: { ...queryParams } }
  // outlet: HTMLElement (#app-root)

  // Build and append DOM to outlet
  // ...

  return () => {
    // Cleanup: remove event listeners, unsubscribe store, destroy animators
  }
}
```

### Using `el()`

```js
import { el, clear, showToast } from '../utils/dom.js'

// Basic element:
el('div', { className: 'card', textContent: 'Hello' })

// With children:
el('div', { className: 'container' }, [
  el('h1', { textContent: 'Title' }),
  el('p', { textContent: 'Body' }),
])

// Event handlers — use camelCase 'on' prefix:
el('button', { onClick: () => doSomething() })
// becomes: element.addEventListener('click', () => doSomething())

// Other supported attrs:
el('input', {
  className: 'input',
  type: 'text',
  placeholder: 'Enter name',
  value: 'default',
  dataset: { playId: 'mesh' },         // → element.dataset.playId
  style: { color: 'red', margin: '8px' }, // object style
})

// innerHTML (use sparingly):
el('div', { innerHTML: '⚠️ <strong>Warning</strong>' })
```

**`on` prefix rules:** Any attr starting with `on` → `addEventListener(attr.slice(2).toLowerCase(), fn)`. So `onClick`, `onChange`, `onInput`, `onKeydown` all work. Casing of the `on` part doesn't matter — it's always lowercased.

### `clear(parent)`
Removes all children: `parent.innerHTML = ''`

### `showToast(message, duration=2500)`
Shows a brief notification at the bottom of the screen. Auto-removes after `duration` ms.

```js
showToast('Player added!')
showToast('Error: duplicate play', 3000)
```

### Store Subscription Pattern

```js
export function rosterView(params, outlet) {
  const store = window.__store

  function render() {
    clear(outlet)
    const state = store.get()
    // ... build DOM from state
    outlet.appendChild(/* ... */)
  }

  const unsubscribe = store.subscribe(() => render())
  render()

  return () => unsubscribe()
}
```

### Internal State + Re-render Pattern (from `roster.js`)

For views that have local UI state (e.g., whether a form is open), keep it in a closure variable and call `render()` on state changes:

```js
export function rosterView(params, outlet) {
  const store = window.__store
  let showAddForm = false   // ← local UI state in closure

  function render() {
    clear(outlet)
    const roster = store.get().roster
    // Use both store state AND local state to build UI
    if (showAddForm) { /* build form */ }
    // ...
  }

  function buildAddForm() {
    // ... returns DOM
    // Mutates showAddForm and calls render()
  }

  const unsubscribe = store.subscribe(() => render())
  render()
  return () => unsubscribe()
}
```

This pattern avoids frameworks while maintaining reactivity. The key: `render()` always rebuilds from scratch using the latest state.

---

## 7. Canvas Rendering

### DPR (High-DPI) Setup Pattern

Always do this before creating a `PlayAnimator` or before calling `renderPlay()` on a dynamically sized canvas:

```js
const dpr = window.devicePixelRatio || 1
const cssW = container.offsetWidth     // CSS pixels
const cssH = Math.round(cssW * (2/3))  // desired aspect ratio

canvas.width  = Math.round(cssW * dpr)  // buffer size (physical pixels)
canvas.height = Math.round(cssH * dpr)

const ctx = canvas.getContext('2d')
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)  // scale context so you draw in CSS pixels
```

After this, all drawing coordinates are in CSS pixels. `fieldToCanvas()` uses `canvas.width / canvas.height` — but the animator corrects for DPR internally by using `canvas.width / dpr` for its coordinate math.

### Static Rendering: `renderPlay()`

**Location:** `js/canvas/renderer.js`

```js
import { renderPlay } from '../canvas/renderer.js'

renderPlay(canvas, play, options)
```

**Options:**
```js
{
  rosterMap:         {},     // { QB: 'Braelyn', ... } — names shown on dots
  showDefense:       true,   // draw gray X markers
  showReadNumbers:   true,   // draw yellow read-order badges
  showAllRoutes:     true,   // draw route lines (always true for static)
  highlightPosition: null,   // 'QB'|'WR1'|etc — dims all other positions to 0.2 opacity
  mini:              false,  // smaller dots/arrows, no route labels — for card thumbnails
}
```

**When to use `mini: true`:** In play card grids and playbook thumbnails. Smaller radius (7px vs 13px), no text labels, smaller arrows. Set `showReadNumbers: false` for mini too.

**Canvas must be in the DOM** (or have a nonzero offsetWidth) before calling `renderPlay()` for sizing. Use `requestAnimationFrame()`:

```js
outlet.appendChild(grid)
requestAnimationFrame(() => {
  for (const play of plays) {
    const canvas = grid.querySelector(`[data-play-id="${play.id}"] canvas`)
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    renderPlay(canvas, play, { mini: true, showDefense: true, showReadNumbers: false })
  }
})
```

### Individual Draw Functions (exported from `renderer.js`)

These are also used directly by the animator:

```js
drawField(ctx, w, h)                    // green field, yard lines, LOS
drawPlayer(ctx, x, y, label, color, opts)  // colored dot with label
drawRoute(ctx, points, color, opts)     // route line with arrow + optional label
drawDefense(ctx, positions, w, h)       // gray X markers
drawReadBadge(ctx, x, y, num)           // yellow circle with number
drawMotionPath(ctx, from, to, w, h)     // dotted pre-snap motion line
fieldToCanvas(fieldX, fieldY, w, h)     // coordinate conversion
```

### PlayAnimator

**Location:** `js/canvas/animator.js`

```js
import { PlayAnimator, SPEEDS, PHASES } from '../canvas/animator.js'
```

#### Constructor

```js
const animator = new PlayAnimator(canvas, play, options)
```

`options` (all optional):
```js
{
  showDefense:       true,
  showBall:          true,
  showReadNumbers:   true,
  showAllRoutes:     true,
  highlightPosition: null,
  rosterMap:         {},
  speed: 'full',    // 'teaching' | 'walkthrough' | 'full' | 'fast'
}
```

**CRITICAL:** The constructor stores the play in `this.playData`. The method to start playback is `this.play()`. Never name a variable or property `play` on the class — it shadows the method.

```js
// ✅ CORRECT — play data is at this.playData
this.playData = play

// ✅ CORRECT — play() method starts animation
animator.play()

// ❌ WRONG — would shadow the play() method
this.play = play  // DON'T DO THIS
```

#### Methods

```js
animator.play()                    // Start/resume animation (rAF loop)
animator.pause()                   // Pause animation
animator.reset()                   // Reset to t=0, re-render, stop
animator.destroy()                 // Pause + clear listeners (call on cleanup!)
animator.seekTo(timeSeconds)       // Jump to specific time (0 to totalDuration)
animator.stepForward()             // Jump to next phase boundary
animator.setSpeed(keyOrNumber)     // 'teaching'|'walkthrough'|'full'|'fast' or numeric multiplier
animator.updateOptions(newOpts)    // Merge options, re-render if paused
animator.getState()                // Returns current state object (see below)
animator.onStateChange(callback)   // Subscribe; returns unsubscribe fn
```

#### State Object (`getState()`)

```js
{
  phase:         'PRE_SNAP',   // current phase string (see PHASES)
  currentTime:   1.5,          // seconds from start
  totalDuration: 6.0,          // total seconds
  isPlaying:     true,
  speed:         1.0,          // current speed multiplier
}
```

#### Animation Phases (state machine)

```
PRE_SNAP  → players at starting positions, motion animates if present
SNAP      → C snaps to QB (0.3s)
ROUTES    → all players run their routes simultaneously
DELIVERY  → ball flies from QB to target (0.5s)
AFTER_CATCH → ball carrier holds, 1.5s hold
DONE      → animation complete, frozen
```

Phase boundaries are stored as `_snapStart`, `_snapEnd`, `_routeEnd`, `_deliveryEnd`, `_totalDuration`.

#### Speed Constants

```js
SPEEDS = {
  teaching:    0.25,
  walkthrough: 0.5,
  full:        1.0,
  fast:        2.0,
}
```

#### DPR Handling in Animator

The animator internally corrects for DPR:
```js
const dpr = window.devicePixelRatio || 1
const w = Math.round(this.canvas.width / dpr)   // CSS width
const h = Math.round(this.canvas.height / dpr)  // CSS height
```

This means the canvas buffer must be set to `cssSize * dpr` **before** creating the animator, and `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` must also be set. The animator itself does not set the transform — the view does it once during `initAnimator()`.

#### Typical Animator Initialization (from `play-viewer.js`)

```js
function initAnimator() {
  const dpr = window.devicePixelRatio || 1
  const cssW = canvasWrap.offsetWidth || canvas.offsetWidth
  const cssH = canvasWrap.offsetHeight || Math.round(cssW * (2 / 3))

  if (cssW < 50 && initRetries < 5) {   // retry if not laid out yet
    initRetries++
    requestAnimationFrame(initAnimator)
    return
  }

  canvas.width  = Math.round(cssW * dpr)
  canvas.height = Math.round(cssH * dpr)

  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (animator) animator.destroy()
  animator = new PlayAnimator(canvas, play, {
    rosterMap,
    showDefense: prefs.showDefense !== false,
    speed: prefs.speed || 'full',
    // ...
  })

  animator.onStateChange(state => {
    playBtn.textContent = state.isPlaying ? '⏸ Pause' : '▶ Play'
    // update progress bar etc
  })
}

requestAnimationFrame(initAnimator)
```

---

## 8. Play Library

**Location:** `js/play-library.js`

### How to Add a New Play

1. Add a new object to the `PLAY_LIBRARY` array following the schema in §3
2. Place it in a logical position (grouped by family with a comment header)
3. The play is immediately available in the library view — no registration needed

### Required Fields and Constraints

| Field | Required | Constraints |
|-------|----------|-------------|
| `id` | ✅ | Unique, kebab-case, URL-safe (no spaces/special chars) |
| `name` | ✅ | Display string |
| `formation` | ✅ | Must match an existing formation string (or introduce a new one) |
| `tags` | ✅ | Array, at least 1 tag. Use existing tags where possible |
| `family` | ✅ | String, groups related plays. Use existing families where possible |
| `isRunPlay` | ✅ | `true` or `false` |
| `description` | ✅ | Object with `fake` and `target` strings |
| `qbLook` | ✅ for pass plays | Object with `eyes`, `throw`, `tip`. **Must be `null` for run plays** |
| `positions` | ✅ | Object with all 5 positions: QB, C, WR1, WR2, RB |
| `defense` | ✅ | Array of `[x, y]` pairs (typically 5 defenders) |
| `timing` | ✅ | Object mapping read numbers to seconds |
| `ballPath` | ✅ | Array with at least the snap event |

### ballPath Rules

- **First event MUST be the snap:** `{ from: 'C', to: 'QB', time: 0, type: 'snap' }`
- `time` is seconds from snap moment (snap = 0, subsequent events = time after snap)
- Valid `type` values: `'snap'` | `'throw'` | `'handoff'` | `'lateral'`
- For run plays with no throw: only the snap event is needed (ball stays with carrier)

```js
// Pass play:
ballPath: [
  { from: 'C', to: 'QB', time: 0,   type: 'snap'  },
  { from: 'QB', to: 'WR1', time: 1.5, type: 'throw' },
]

// Run play:
ballPath: [
  { from: 'C',  to: 'QB',  time: 0,   type: 'snap'    },
  { from: 'QB', to: 'WR2', time: 0.6, type: 'handoff' },
]
```

### qbLook Rules

- For **pass plays** only — `null` for run plays
- `eyes` **must differ from** `throw` (the misdirection: QB looks one way, throws another)
- `eyes` and `throw` must be valid position keys present in `play.positions`

```js
qbLook: {
  eyes: 'WR2',    // who QB looks at (fake)
  throw: 'WR1',  // actual throw target — MUST ≠ eyes
  tip: 'Look off safety toward WR2, then hit WR1',
}
```

### timing Format

Maps read number → seconds after snap when that read becomes open:

```js
timing: { 1: 1.0, 2: 2.0, 3: 3.5, 4: 4.5 }
// Read 1 opens at 1.0s, read 2 at 2.0s, etc.
```

Keys must match the `read` values in `positions`. QB has `read: 0` (no badge). The center check-down typically gets `read: 4`.

### Available Formations

Derived from current library (`getFormations()` returns sorted unique list):
- `'Spread'` — standard 5-wide
- `'Twins Right'` — two receivers right
- `'Double-Back'` — two backs in backfield
- `'Trips Right'` — three receivers right
- `'Empty'` — no backs

Add new formations by using a new string — it will auto-appear in filter dropdowns.

### Available Tags

Current tags in library:
`'core'`, `'counter'`, `'trick'`, `'run'`, `'misdirection'`, `'deep'`, `'quick'`, `'flood'`, `'screen'`, `'red-zone'`

Add new tags freely — they auto-appear in dropdowns.

### Available Families

Current families: `'mesh'`, `'flood'`, `'reverse'`, `'double-back'`, `'quick-game'`, `'screen'`, `'trips'`, `'empty'`

Family groups related concepts (e.g., flood, flood-fake, flood-left are all `'flood'`).

### Filter/Search API

```js
import { filterPlays, getFormations, getTags, getFamilies, getPlay } from '../play-library.js'

// Get a single play by id:
const play = getPlay('mesh')  // returns play object or undefined

// Filter plays:
const results = filterPlays({
  formation: 'Spread',   // exact match, '' = all
  tag: 'core',           // exact match on any tag in play.tags, '' = all
  family: 'flood',       // exact match, '' = all
  search: 'mesh',        // substring match on id, name, tags, family, formation
})

// Get unique values for dropdowns:
const formations = getFormations()  // string[], sorted
const tags = getTags()              // string[], sorted
const families = getFamilies()      // string[], sorted
```

---

## 9. Styling Guide

### Dark Theme Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Background | `#1a1a2e` | `body` background |
| Surface | `#16213e` | Cards, nav bar |
| Surface Deep | `#0d1b36` | Inputs, table headers, nested backgrounds |
| Border | `#0f3460` | All borders, dividers |
| Text Primary | `#e0e0e0` | Body text |
| Text Muted | `#888` | Labels, metadata, placeholder text |
| Text Dim | `#666` | Very subtle text, empty states |
| Accent Red | `#e94560` | Primary buttons, active nav, focus rings, important UI |
| Accent Red Dark | `#c73e54` | Hover state for red buttons |
| Green (field) | `#2d5a27` | Canvas field background |

### Position Color Map

| Position | Hex | CSS Class |
|----------|-----|-----------|
| QB | `#3B82F6` (blue) | `.pos-qb` |
| C | `#8B5CF6` (purple) | `.pos-c` |
| WR1 | `#F77F00` (orange) | `.pos-wr1` |
| WR2 | `#FCBF49` (yellow) | `.pos-wr2` (dark text: `#1a1a2e`) |
| RB | `#10B981` (green) | `.pos-rb` |

These colors are defined in **both** `css/app.css` (as CSS classes) and in `renderer.js` / `animator.js` (as JS constants `POSITION_COLORS`). Keep them in sync if you change one.

### CSS Class Naming Conventions

- **BEM-ish** naming: `component-element` (no `--modifier` used, just add extra classes)
- Sections separated by `/* ═══ Section Name ═══ */` comment headers in `app.css`
- View-specific styles prefixed with view name: `.roster-*`, `.playbook-*`, `.player-view-*`
- Global utilities: `.btn`, `.card`, `.input`, `.hidden`, `.toast`

### Card Pattern

```html
<div class="card">
  <!-- padded 16px, background #16213e, border-radius 8px, margin-bottom 12px -->
</div>
```

Add `style="border-left: 3px solid #e94560"` for highlighted/warning cards.

### Button Classes

```html
<button class="btn">          <!-- base: blue #0f3460 -->
<button class="btn btn-primary">   <!-- red #e94560 — primary action -->
<button class="btn btn-danger">    <!-- red #e94560 — destructive action -->
<button class="btn btn-ghost">     <!-- transparent with border — secondary action -->
<button class="btn btn-sm">        <!-- smaller padding, 32px min-height -->
```

Minimum touch target: `min-height: 44px; min-width: 44px` on `.btn` (overridden to 32px for `.btn-sm`).

### Form Inputs

```html
<input class="input" type="text">
<select class="input">
<input class="input input-sm">    <!-- smaller, for inline edit rows -->
<input class="input input-error"> <!-- adds red border on validation fail -->
```

The `.input` class forces `font-size: 16px` to prevent iOS zoom on focus.

### Position Badge

```html
<span class="position-badge pos-qb">QB</span>
```

Inline pill with position background color. Use in tables, headers.

### Tag Badge

```html
<span class="tag-badge">core</span>
```

Small dark pill for play tags.

### Responsive Breakpoints

Only one breakpoint is used throughout:

```css
@media (max-width: 480px) {
  /* Mobile-specific overrides */
}
```

Used to:
- Stack form grid fields vertically (`roster-form-grid`)
- Hide jersey # column on roster table
- Reduce animation control sizes
- Stack playbook play items

### How to Append New CSS

Add styles to `css/app.css` at the bottom. Use section header pattern:

```css
/* ═══════════════════════════════════════════════════════════════════════════
   My New View — Phase X
   ═══════════════════════════════════════════════════════════════════════════ */

.my-view { /* ... */ }
.my-view-header { /* ... */ }

@media (max-width: 480px) {
  .my-view { /* mobile overrides */ }
}
```

---

## 10. Common Patterns / Gotchas

### ✅ Always Return a Cleanup Function from Views

The router calls `currentCleanup()` on navigation. If you don't return one and your view has subscriptions, event listeners, or animators — they will leak.

```js
export function myView(params, outlet) {
  const unsubscribe = store.subscribe(() => render())
  window.addEventListener('resize', onResize)
  // ...
  return () => {
    unsubscribe()
    window.removeEventListener('resize', onResize)
    if (animator) animator.destroy()
  }
}
```

Even if you have nothing to clean up, returning `() => {}` is good practice.

### ✅ Canvas DPR Setup (The 3-Line Pattern)

```js
const dpr = window.devicePixelRatio || 1
canvas.width  = Math.round(cssW * dpr)
canvas.height = Math.round(cssH * dpr)
const ctx = canvas.getContext('2d')
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)  // draw in CSS pixel space
```

Do this before every `new PlayAnimator()` and before `renderPlay()` on dynamically sized canvases.

### ⛔ Don't Shadow Class Methods with Data Properties

```js
// ❌ WRONG — shadows the play() method!
class PlayAnimator {
  constructor(canvas, play, options) {
    this.play = play          // THIS KILLS play()
  }
}

// ✅ CORRECT
constructor(canvas, play, options) {
  this.playData = play        // play data lives here
}
animator.play()               // method still works
```

This was a real bug. Play data is at `animator.playData`.

### ✅ Store `set()` Does Shallow Merge Per Key

```js
// ✅ Update one preference — others preserved:
store.set({ preferences: { speed: 'fast' } })

// ✅ Add a player — must spread existing:
store.set({ roster: [...store.get().roster, newPlayer] })

// ❌ Will wipe all other roster entries:
store.set({ roster: [newPlayer] })

// ❌ Will wipe preferences.showDefense, etc:
// (This is fine for preferences because set() uses Object.assign internally)
// Actually preferences DO use Object.assign — so partial updates work:
store.set({ preferences: { speed: 'fast' } })  // ✅ only speed changes
// But roster/playbooks/activePlaybookId are direct replace — always spread!
```

### ✅ `el()` handles `onClick` → `addEventListener('click', fn)`

Any `on`-prefixed key in attrs is wired as an event listener:

```js
el('button', { onClick: handleClick })      // ✅
el('button', { onChange: handleChange })    // ✅
el('input',  { onKeydown: handleKey })      // ✅
```

The key is lowercased after `on`: `onClick` → `click`, `onKeydown` → `keydown`.

Note: in `play-viewer.js` there's a pattern using `onClick` in `el()` for most buttons, but `playBtn.onclick = function() {...}` directly on the DOM element for the play button — both work.

### ✅ Filter Bar Pattern (`buildSelect` helper)

Both `play-library.js` view and `playbook.js` use an identical private `buildSelect` helper:

```js
function buildSelect(label, options, onChange) {
  const select = el('select', { className: 'input filter-select' })
  select.appendChild(el('option', { value: '', textContent: `${label} ▾` }))
  for (const opt of options) {
    const o = document.createElement('option')
    o.value = opt
    o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1)
    select.appendChild(o)
  }
  select.addEventListener('change', () => onChange(select.value))
  return select
}
```

Use this pattern when building any filter dropdown. Default option has `value: ''` = "show all".

### ✅ Canvas Thumbnails Must Wait for DOM Layout

```js
// ❌ Wrong — canvas has no size yet:
renderPlay(canvas, play, opts)

// ✅ Correct — wait for browser layout:
outlet.appendChild(container)
requestAnimationFrame(() => {
  const canvas = container.querySelector('canvas')
  canvas.width  = canvas.offsetWidth  || 200
  canvas.height = canvas.offsetHeight || 150
  renderPlay(canvas, play, opts)
})
```

### ✅ Playbook Play Entry Format

When adding a play to a playbook:

```js
pb.plays.push({
  playId: 'mesh',      // must match PLAY_LIBRARY id
  codeName: '',        // user's code name (can be empty)
  order: maxOrder + 1, // integer for sort order
})
store.set({ playbooks })  // always set the whole array
```

### ✅ Player Share URL Format

```
#/share?playbook=<playbookId>&player=<playerName>
```

The `playerShareView` checks `params.query.playbook` and `params.query.player`. If both present → player view (hides nav, highlights that player's position). If absent → share generator (coach view).

### ✅ Roster Map vs. Roster Array

- `store.getRosterMap()` → `{ QB: 'Braelyn', C: 'Lenox', ... }` — for canvas rendering
- `store.get().roster` → array of `RosterItem` objects — for management UI
- Only starters (first player per position) appear in the roster map

### ✅ Service Worker Update Flow

Handled entirely in `index.html` inline script. When a new SW is detected:
1. Shows `.update-toast` with a Refresh button
2. User clicks → `reg.waiting.postMessage('skipWaiting')`
3. `controllerchange` → `window.location.reload()`

No action needed in views — it's automatic.

---

*End of AGENTS.md — Last updated for v2 with 30 plays, 6 views, Phase 1–6 complete.*
