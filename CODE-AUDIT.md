# Code Audit: Flag Football Playbook PWA

**Auditor:** Senior Frontend Engineer  
**Date:** 2026-03-14  
**Branch:** dev/phase-1-polish (3 phases committed)  
**Stack:** Vanilla JS, ES Modules, Canvas, no build tools  
**Total LOC:** ~6,800 (excluding .md files)

---

## 1. Executive Summary

### Overall Grade: B-

This is a well-conceived, well-executed vanilla JS app with an impressive canvas rendering engine and thoughtful coaching features. The architecture is clean for its size, the module boundaries are sensible, and the play data model is rich. For a no-framework, no-build-tools project, this is solid work.

However, it has accumulated real bugs, some architectural shortcuts that will hurt maintainability, and a few patterns that are borderline dangerous (memory leaks, missing cleanup, innerHTML with dynamic data). Nothing is catastrophic, but the codebase needs a cleanup pass before more features are added.

### Top 3 Strengths

1. **Canvas rendering engine (renderer.js)** — Genuinely impressive. Staggered read animations, pre-snap motion sequences, ball physics with parabolic arcs, man/zone defender AI, edit-mode rendering with waypoint handles. This is the core differentiator and it's well-built.

2. **Play data model (plays.js)** — Rich, expressive, and consistent. 16 plays with routes, timing, ball paths, fake segments, motion, special labels. The data structure is clean enough to be editor-friendly.

3. **Module architecture** — Clean separation into 9 focused modules with a thin orchestrator (app.js at 184 lines). Dependency injection via `setSelectPlayFn` callbacks avoids circular imports. Each module has a clear responsibility.

### Top 3 Concerns

1. **Memory leaks: 60 event listeners added, 0 removed.** No `removeEventListener` calls anywhere. The animation loop never calls `cancelAnimationFrame`. DOM elements created via `innerHTML` inside panels get recreated on every render without cleanup. Over a game session with repeated panel opens/closes, this leaks.

2. **Read markers recreated every animation frame.** `updateTimer()` runs `document.querySelectorAll('.read-marker').forEach(m => m.remove())` then recreates 3-4 DOM elements every single frame (~60fps). That's 180-240 DOM mutations per second during animation. This is the biggest performance issue.

3. **Globals dependency pattern.** `PLAYS` and `PLAYERS` are loaded as global variables from a non-module `<script>` tag, then referenced from ES modules. This works but is fragile — no import, no type checking, no tree shaking, and it creates an implicit contract that every module silently depends on.

---

## 2. Per-File Review

### index.html — Grade: B+

**Lines:** 160  
**Issues:**

- **Line 148-150:** Service worker registration is in a non-module `<script>` at the bottom, but `plays.js` is also a non-module script. Load order dependency is implicit — if someone reorders these tags, the app breaks silently.
- **Line 3:** `user-scalable=no` prevents pinch-to-zoom. Acceptable for a game-day app but an accessibility concern. Consider allowing zoom in non-game contexts.
- **Good:** Clean semantic structure. Roster panel markup is well-organized with clear section IDs. Edit toolbar is injected by JS (correct — it's complex and conditional).
- **Good:** `viewport-fit=cover` and `apple-mobile-web-app-capable` are correct for PWA.

### style.css — Grade: B

**Lines:** 1,176  
**Issues:**

- **Consistency issue:** Mix of hardcoded colors and CSS variables. Some colors use `var(--surface)` while others use raw hex (`#333`, `#555`, `#222`, `#111`). Lines 268-280 (queue bar), lines 339-380 (edit toolbar) are worst offenders — dozens of hardcoded hex values that should be variables.
- **No BEM or naming convention.** Class names are functional (`.play-btn`, `.ctrl-btn`, `.queue-chip`) but there's no consistent methodology. Not a big deal at this scale, but `.edit-btn-save` vs `.form-btn-save` vs `.edit-btn-danger` vs `.form-btn-delete` is inconsistent.
- **Landscape media query (line 221):** Reduces touch targets to 36px (below Apple HIG 44px minimum). This is noted in the query but still ships.
- **`.read-marker` (line 116):** Has `transition: opacity 0.3s` but gets recreated every frame — the transition never fires because the element is brand new each time.
- **Good:** The layout architecture is solid — flexbox column with `min-height: 0` on the canvas container. The viewport locking works.
- **Good:** Scrollbar hiding with both `-webkit-scrollbar` and `scrollbar-width: none` covers all browsers.
- **Good:** Touch targets are 44px on most interactive elements.

### app.js — Grade: A-

**Lines:** 184  
**Issues:**

- **Clean orchestrator.** This is what app.js should look like — imports, wiring, init. No business logic leaking in.
- **Line 26:** `selectPlay()` function is the central navigation function. Well-designed — called from 5 different modules via callback injection.
- **Line 67-78:** Panel toggle logic (coach/queue mutual exclusion) uses inline `style.display` manipulation. Should use CSS classes for consistency with the roster panel pattern (which uses `.open`/`.visible` classes).
- **Line 104:** `loadSubstitutions()` is called in init — good, subs persist.
- **Line 131:** `setTimeout(() => startAnimation(), 500)` — magic number. What happens in those 500ms? Comment would help.
- **Good:** `document.readyState` check at bottom is correct ES module loading pattern.

### plays.js — Grade: B+

**Lines:** 475  
**Issues:**

- **Not an ES module.** Loaded as a regular script, creates `PLAYERS` and `PLAYS` globals. This is the root cause of the globals dependency issue. Should be `export const PLAYS = [...]` in an ES module.
- **Line 5:** `PLAYERS` object defines 7 players with colors and roles. The `border` property only exists on Braelyn — inconsistent. Other players default to `#fff` border in the renderer.
- **Hardcoded names throughout.** Every play references 'Braelyn', 'Lenox', etc. The roster system (phase 3) works around this with substitution mapping rather than fixing the root issue. This means the play data is permanently coupled to these 5 specific kids.
- **Good:** Data structure is rich and well-documented. Comments explain each play's purpose and mirror relationships.
- **Good:** `motion`, `fakeSegment`, `fakeLabel`, `specialLabels`, `ballPath` — these optional fields are handled gracefully everywhere they're consumed.

### sw.js — Grade: B-

**Lines:** 42  
**Issues:**

- **Cache-first strategy with no network fallback for updates.** Line 32: `caches.match(e.request).then(r => r || fetch(e.request))`. Once cached, the user NEVER gets updates until `CACHE_VERSION` is manually changed. There's no stale-while-revalidate, no update notification. 
- **Line 1:** `CACHE_VERSION` is a manual string (`'20260314-phase3'`). Must be manually updated on every deploy or users get stale code. This will eventually bite someone.
- **No error handling.** If `caches.open()` fails or a cached asset is corrupted, the SW silently serves nothing.
- **Good:** `skipWaiting()` + `clients.claim()` ensures new SW activates immediately. Correct.
- **Good:** Asset list is complete and matches all actual files.

### manifest.json — Grade: C+

**Lines:** 17  
**Issues:**

- **SVG emoji icon (line 11).** This works technically but looks unprofessional on home screens. Android renders it as a tiny emoji in a large transparent square. iOS may not render it at all.
- **No `apple-touch-icon` in index.html.** iOS won't pick up the manifest icon — it uses the `<link rel="apple-touch-icon">` tag which doesn't exist.
- **Missing `id` field.** Best practice for PWA manifests is to include an `id` for stable identity across URL changes.
- **`"orientation": "any"` is correct** for a coaching app that should work in both orientations.

### modules/state.js — Grade: B+

**Lines:** 242  
**Issues:**

- **Mutable state object is well-designed.** Single `state` object shared across modules. Clear, predictable, grep-able. This is the right pattern for this scale of app.
- **Lines 129-137:** `getActiveRoster()` references `PLAYS` global (line 133). This module has 5 references to the `PLAYS` global — the highest coupling to the non-module global.
- **Line 53:** `state.roster` typed as `[]` but used as array of objects with `{ id, name, number, positions, color }`. No validation when loading from localStorage.
- **Lines 170-181:** `loadCustomPlays()` does `PLAYS.push(p)` — mutating the global `PLAYS` array from within a module. This is the most architecturally questionable pattern. If custom plays have invalid structure, they silently corrupt the PLAYS array.
- **Lines 175-176:** Only catches JSON.parse errors. If a custom play has missing `players` or `defense` properties, it'll push garbage into PLAYS and crash the renderer later.
- **Good:** All localStorage reads wrapped in try/catch. Robust against corrupt data.
- **Good:** `getDisplayName()` priority chain (per-play > lineup > original) is correct and well-documented.
- **Good:** Pure helper functions like `hasMotion()`, `getAnimStart()` are properly exported.

### modules/renderer.js — Grade: B+

**Lines:** 786  
**Issues:**

- **The star of the show.** This is genuinely good canvas code. Coordinate mapping, player positioning along routes, ball physics, defense AI — all well-implemented.
- **Line 49:** `resizeCanvas()` calls `drawFrame()` at the end. This means every resize triggers a full redraw, which is correct. But `drawFrame()` is also called from animation loop — no debounce on resize.
- **Lines 65-73:** `drawFrame()` branches on `state.editorActive`. The editor rendering functions (`drawEditRoutes`, `drawEditPlayers`, etc.) are ~100 lines of code that only run in edit mode. These could be in editor.js to keep renderer focused.
- **Line 251:** `getPlayerColor()` falls back to `state.roster` search if not in `PLAYERS` global. This is a O(n) scan on every draw call for every player. With 7 players at 60fps, that's 420 array scans/second. Negligible now, but worth noting.
- **Lines 146-162:** `drawEditRoutes()` duplicates route drawing logic from `drawRoutes()` (lines 230-300). Significant DRY violation — ~60 lines of similar arrow/label/stroke logic.
- **Line 323:** `drawDefense()` — defender squares are drawn at 14×14 hardcoded size, not scaled by `sunlightMode`. Inconsistent with player dots which do scale.
- **`fieldToCanvas()` and `canvasToField()` are exported** — good, used by editor.js for hit testing.
- **No off-screen canvas or caching.** Every frame redraws the entire field (grid lines, LOS, yard markers) even when only the animation changes. For a 60fps animation, this is wasteful. A static background layer cached as ImageData would halve the draw cost.

### modules/animation.js — Grade: B-

**Lines:** 110  
**Issues:**

- **BUG (Line 18):** `if (!state.playing) { state.animId = null; return; }` — when animation stops, `state.animId` is set to null but `cancelAnimationFrame` is never called. If `startAnimation()` is called rapidly (e.g., double-tap play button), multiple animation loops can run simultaneously because the old RAF callback still fires before checking `state.playing`.
- **Line 32:** `state.animId = requestAnimationFrame(animateLoop)` — this overwrites the previous animId without canceling it first. If `startAnimation()` is called while already playing, the old loop is orphaned.
- **Lines 86-109:** `updateTimer()` is called here AND from ui.js build functions. It removes and recreates DOM elements (`.read-marker`) every call. During animation this fires at 60fps — creating/destroying DOM elements 60 times per second. **This is the #1 performance issue.**
- **Line 93:** `document.querySelectorAll('.read-marker').forEach(m => m.remove())` — DOM query + removal every frame. Should create markers once and update visibility.
- **Line 89:** Magic number `0.6` with comment `// SET_PAUSE = 0.6`. The constant is defined in state.js but not imported here — using a magic number instead.
- **Good:** The animation loop itself is clean — delta time calculation, speed multiplier, boundary clamping.

### modules/ui.js — Grade: B-

**Lines:** 240  
**Issues:**

- **Lines 119-155:** `openSubMenu()` creates a menu with inline `style.cssText` strings containing full CSS declarations. This is ~40 lines of JS-embedded CSS. Should use CSS classes.
- **Line 58-89:** `buildPlayerFilter()` uses a double-tap detection with `setTimeout(360ms)`. This creates a 360ms delay on EVERY single tap to wait and see if a double-tap follows. On a sideline, every tap feels sluggish. This is a UX bug disguised as a feature.
- **Line 69:** `lastTap` variable is scoped per button via closure — correct, but non-obvious.
- **Line 14:** `container.innerHTML = ''` on every `buildPlaySelector()` call. This nukes and recreates all play buttons. If called during animation (it is, via selectPlay), this causes unnecessary DOM thrashing.
- **Lines 119-155:** Sub menu uses `position:fixed;bottom:120px` — hardcoded offset. On different screen sizes or with coach/queue panels open, this could overlap or be positioned incorrectly.
- **Good:** `openSubMenu` / `closeSubMenu` properly manage the sub-menu lifecycle (create/remove from body).
- **Good:** Controls setup is clean and well-organized.

### modules/coach.js — Grade: B+

**Lines:** 85  
**Issues:**

- **Line 43:** `setupCoachPanel()` adds click listeners to `.sit-btn` elements every time it's called. If the coach panel is toggled on/off multiple times, listeners accumulate. Each button gets N click handlers after N toggles.
- **Line 26:** `getPlayScore()` scoring formula is reasonable but the weights are arbitrary (0.7 for down, 0.8 for field). No documentation on why these specific weights.
- **Good:** Play situation data is well-structured and comprehensive.
- **Good:** Top-5 recommendation display with ranking badges is clean.

### modules/queue.js — Grade: B+

**Lines:** 71  
**Issues:**

- **Minimal, focused module.** Does exactly what it should.
- **Line 17:** `advanceQueue()` calls `_selectPlay()` which triggers a full UI rebuild. If queue is long, this could cause a visible frame skip.
- **Line 45:** `scrollIntoView` on active chip — good UX touch.
- **Good:** Queue state persists via `saveQueueState()`.

### modules/touch.js — Grade: B

**Lines:** 47  
**Issues:**

- **Line 16-28:** Touch event listeners added to `#field-container` with `{ passive: true }`. This is correct — no `preventDefault()` needed.
- **Swipe detection (line 22):** `Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5` — reasonable thresholds.
- **Line 33-44:** Keyboard handler added to `document` — never removed. Not a problem since the app doesn't have page navigation, but technically a leak.
- **No touch-action coordination.** The field container has `touch-action: pan-x` in CSS, but the touch handler listens for horizontal swipes. These compete — the browser's pan-x gesture might fire before the JS swipe detection, causing double-navigation.

### modules/editor.js — Grade: B-

**Lines:** 791  
**Issues:**

- **Largest module.** At 791 lines, this is nearly as big as renderer.js. It handles: formation templates, edit mode enter/exit, canvas hit testing, player editing actions, drag/drop, pointer events, toolbar UI, import/export. That's at least 3 separate concerns.
- **Lines 568-672:** `buildEditToolbar()` creates the entire toolbar DOM via `innerHTML` template literal and then wires 12+ event listeners. This is called once (good) but the function is 100 lines long.
- **Line 247-261:** `exportPlaybook()` creates and clicks an `<a>` element for download. Line 258 removes it, but `URL.revokeObjectURL(url)` is called synchronously — the download might not have started yet. Should revoke after a timeout.
- **Lines 263-295:** `importPlaybook()` removes existing custom plays with a reverse loop (correct) but doesn't validate individual play structure. A malformed play in the import file would corrupt the PLAYS array.
- **Line 410:** `LONG_PRESS_MS = 500` for waypoint deletion. No visual feedback during the long press — user has no idea something is about to happen until it does.
- **Lines 424-470:** Pointer event handlers (`onPointerDown`, `onPointerMove`, `onPointerUp`) use module-level variables (`pointerDownPos`, `isDragging`, `activeHitPlayer`, etc.) for state. This is effectively a state machine implemented with scattered variables — fragile but works.
- **Good:** Undo stack with 30-entry limit. Push/pop pattern is clean.
- **Good:** Formation templates are comprehensive (11 formations).
- **Good:** Hit testing with separate player/waypoint layers and priority logic.

### modules/roster.js — Grade: B-

**Lines:** 606  
**Issues:**

- **Second-largest module.** Handles: panel open/close, lineup grid, bench rendering, rotation tracking, player CRUD, "my routes" view, color management, localStorage persistence. Could be split into roster-data.js (CRUD + storage) and roster-ui.js (rendering).
- **Line 255:** `assignToLineup()` removes player from old slot before assigning to new one, but doesn't check if the player being displaced from the target slot needs to go somewhere. If position A has PlayerX and you assign PlayerY to A, PlayerX just vanishes from the lineup (becomes null).
- **Lines 278-289:** `toggleTeam()` increments rotation counts for ALL current lineup players every time you switch teams. This means every team toggle adds a count — even if you toggle back and forth without playing any plays. The rotation tracking is fundamentally flawed.
- **Line 331-378:** `showPlayerForm()` uses `innerHTML` to create a form with hardcoded HTML. The `value` attribute is set from `player.name` without escaping. If a player name contains `"` or `<`, this would break the form or create an XSS vector. Not a real security risk (it's a local app) but sloppy.
- **Line 394:** `addPlayer()` registers the player in `PLAYERS` global — mutating a global from deep inside a module. Same pattern issue as state.js's `loadCustomPlays()`.
- **Lines 457-477:** `openMyRoutes()` creates DOM via innerHTML then wires event listeners. Same pattern as elsewhere, but adds listeners without cleanup on re-open. Opening "My Routes" for different players accumulates close-button handlers.
- **Good:** Default roster initialization with fallback from PLAYERS global is well-handled.
- **Good:** Player rename cascades through lineups and substitutions.

### PRODUCT-PLAN.md — Grade: A

**Lines:** 1,347  
Extremely thorough. Well-structured phase plan with data models, wireframes, acceptance criteria. The technical recommendations (stay vanilla through phase 2, evaluate Svelte at phase 3) are sound. The competitive analysis is insightful.

### UX-AUDIT.md — Grade: A-

**Lines:** 378  
Accurate and actionable. The critical fixes were all addressed in Phase 1. The layout architecture diagram and pixel math are correct. The "Part 3: Nice-to-Have" list is prioritized well.

---

## 3. Cross-Cutting Concerns

### 3.1 State Management

**Pattern:** Single mutable `state` object in state.js, shared by reference across all modules.  
**Grade:** B

This is the right choice for this scale. The state object is well-organized with clear property grouping. However:

- **No state change notifications.** When `state.currentPlayIdx` changes, every consumer must be manually told to re-render. The `selectPlay()` function in app.js manually calls 6 different update functions. If you forget one, you get stale UI.
- **Global mutations from anywhere.** Any module can write `state.foo = bar` at any time. There's no single place to trace state changes. For debugging, you'd need to add `console.log` in every module.
- **`PLAYS` and `PLAYERS` globals** are mutated by state.js (`loadCustomPlays` pushes to PLAYS), roster.js (adds to PLAYERS), and editor.js (pushes/splices PLAYS). Three different modules mutating the same global array is a recipe for hard-to-trace bugs.

### 3.2 Event Handling

**Pattern:** addEventListener calls in init functions, never removed.  
**Grade:** C

- **60 event listeners added, 0 removed.** This is acceptable for a single-page app where nothing unmounts — but the coach panel listeners (coach.js line 43) ARE added multiple times because `setupCoachPanel()` is called on every toggle.
- **No event delegation.** Each play button, each queue chip, each bench player gets its own click handler. The play selector rebuilds all button handlers on every `buildPlaySelector()` call. A single delegated listener on the container would be cleaner.
- **The double-tap detection in ui.js** (line 58-89) adds a 360ms latency to every player filter tap. This should be replaced with a dedicated sub button or long-press (not double-tap).

### 3.3 DOM Management

**Pattern:** `innerHTML = ''` to clear, then createElement or innerHTML to rebuild.  
**Grade:** C+

- **innerHTML is used 22 times** across the codebase. Most are for panel content that's rebuilt on every render. This is fine for performance (innerHTML is fast) but:
  - Player names and play names are interpolated without escaping (roster.js line 155, ui.js line 31). Low risk since data is user-controlled locally, but still sloppy.
  - Every rebuild destroys and recreates event listeners on child elements.
- **Read markers in animation.js** are the worst offender — DOM elements created and destroyed every frame during animation.

### 3.4 Module Dependencies

```
app.js (orchestrator)
├── state.js (pure state, no deps)
├── renderer.js → state.js
├── animation.js → state.js, renderer.js
├── ui.js → state.js, renderer.js, animation.js
├── coach.js → state.js, renderer.js
├── queue.js → state.js
├── touch.js → state.js, animation.js
├── editor.js → state.js, renderer.js
└── roster.js → state.js, renderer.js, ui.js
```

**Grade:** B+

- **No circular dependencies.** The `setSelectPlayFn` callback injection pattern avoids the most common circular dep (ui.js ↔ app.js).
- **roster.js imports from ui.js** (`buildPlaySelector`, `buildPlayerFilter`). This creates a dependency from a "feature module" to a "core UI module" — acceptable but worth noting. If ui.js ever imports from roster.js, you get a cycle.
- **All modules depend on the PLAYS/PLAYERS globals** without importing them. This hidden dependency is the biggest architectural concern.

---

## 4. Bug List

### BUG-1: Multiple animation loops can run simultaneously (P0)
**File:** modules/animation.js, lines 18, 32, 38-42  
**Description:** `startAnimation()` calls `requestAnimationFrame(animateLoop)` without canceling any existing animation frame. If called rapidly (double-tap play, or toggling play/pause quickly), multiple RAF callbacks queue up. Each one advances `state.animTime`, causing the animation to run at 2x-Nx speed.  
**Reproduction:** Tap play button rapidly 5 times. Watch animation speed up.

### BUG-2: Coach panel accumulates duplicate event listeners (P0)
**File:** modules/coach.js, line 43  
**Description:** `setupCoachPanel()` is called every time the coach panel is toggled on. It does `document.querySelectorAll('.sit-btn').forEach(btn => { btn.addEventListener('click', ...) })`. Each toggle adds another set of click handlers. After 5 toggles, each button fires 5 times per click.  
**Reproduction:** Toggle coach panel on/off 5 times. Click a situation button. Observe it fires multiple times (check with console.log).

### BUG-3: Read markers cause 60fps DOM thrashing (P1)
**File:** modules/animation.js, lines 99-109  
**Description:** `updateTimer()` is called every animation frame. It removes ALL `.read-marker` elements and recreates 3-4 new ones. At 60fps, this is 180-240 DOM create/destroy operations per second. Causes GC pressure and potential jank on low-end phones.  
**Impact:** Performance degradation during animation, especially on older phones.

### BUG-4: Rotation counting is incorrect (P1)
**File:** modules/roster.js, lines 278-289  
**Description:** `toggleTeam()` increments rotation counts for all current lineup players every time you toggle teams — not when plays are actually run. Toggling back and forth inflates counts. The `rotationCounts` field is meaningless.  
**Expected:** Rotation counts should increment when a play is run (marked success/fail in queue), not on team toggle.

### BUG-5: Player displacement on lineup assignment (P1)
**File:** modules/roster.js, line 255  
**Description:** `assignToLineup()` clears the displaced player's old slot but doesn't handle the player being replaced in the target slot. If WR1 has Greyson and you assign Jordy to WR1, Greyson becomes `null` — effectively removed from the lineup with no way to get them back except manually re-assigning.  
**Expected:** Greyson should swap to Jordy's old slot (bench) or the user should be asked.

### BUG-6: Custom play import doesn't validate structure (P2)
**File:** modules/editor.js, lines 263-295; modules/state.js, lines 170-181  
**Description:** `importPlaybook()` checks for `data.customPlays` array existence but doesn't validate individual play structure. A play missing `players`, `defense`, or `timing` will be pushed to PLAYS and crash the renderer on first render.  
**Expected:** Validate required fields before pushing to PLAYS.

### BUG-7: Double-tap player filter causes 360ms delay on every tap (P2)
**File:** modules/ui.js, lines 58-89  
**Description:** The double-tap-to-sub feature adds `setTimeout(360)` to every single-tap action on the player filter. This means highlighting a player's route always has a 360ms delay. On the sideline, this feels broken.  
**Expected:** Use a different gesture (long-press, or explicit sub button) for substitutions. Single tap should be instant.

### BUG-8: `touch-action: pan-x` conflicts with swipe handler (P2)
**File:** style.css line 159 (`#field-container { touch-action: pan-x; }`), modules/touch.js lines 16-28  
**Description:** CSS `touch-action: pan-x` tells the browser to handle horizontal panning natively. But the JS touch handler also listens for horizontal swipes to navigate plays. Both fire, potentially causing double-navigation or the browser consuming the gesture before JS sees it.  
**Expected:** Either use CSS `touch-action: none` on the field container and handle everything in JS, or use `touch-action: pan-x` and remove the JS swipe handler.

---

## 5. Implementation Plan

### P0 — Fix Immediately (Bugs / Broken Behavior)

#### P0-1: Fix animation loop leak
**What's wrong:** Multiple animation loops can run simultaneously  
**Files:** `modules/animation.js`  
**Fix:**
```javascript
export function startAnimation() {
  if (state.animId) cancelAnimationFrame(state.animId);
  state.playing = true;
  state.lastFrameTs = null;
  updatePlayPauseBtn();
  state.animId = requestAnimationFrame(animateLoop);
}

export function pauseAnimation() {
  state.playing = false;
  state.lastFrameTs = null;
  if (state.animId) {
    cancelAnimationFrame(state.animId);
    state.animId = null;
  }
  updatePlayPauseBtn();
}
```
**Effort:** S (10 min)  
**Why it matters:** Without this, rapid button tapping causes the animation to speed up uncontrollably. A coach tapping play/pause on the sideline will hit this.

#### P0-2: Fix coach panel listener accumulation
**What's wrong:** Event listeners accumulate on every panel toggle  
**Files:** `modules/coach.js`  
**Fix:** Add a guard flag, or move listener setup to a one-time init, or use event delegation on the panel:
```javascript
let _coachInitialized = false;

export function setupCoachPanel() {
  if (!_coachInitialized) {
    document.querySelectorAll('.sit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.sit, value = btn.dataset.val;
        state.situation[category] = state.situation[category] === value ? null : value;
        document.querySelectorAll(`.sit-btn[data-sit="${category}"]`).forEach(b => b.classList.remove('active'));
        if (state.situation[category]) btn.classList.add('active');
        updateCoachRecs();
      });
    });
    _coachInitialized = true;
  }
  // Sync button states to current situation
  document.querySelectorAll('.sit-btn').forEach(btn => {
    btn.classList.toggle('active', state.situation[btn.dataset.sit] === btn.dataset.val);
  });
  updateCoachRecs();
}
```
**Effort:** S (15 min)  
**Why it matters:** After toggling the coach panel a few times during a game, buttons fire multiple times causing incorrect state.

---

### P1 — Fix Before Adding More Features (Quality / Architecture)

#### P1-1: Fix read marker DOM thrashing
**What's wrong:** 180-240 DOM mutations/second during animation  
**Files:** `modules/animation.js`  
**Fix:** Create read markers once, update visibility/position:
```javascript
let readMarkerEls = [];

function ensureReadMarkers(play) {
  const bar = document.getElementById('timer-bar');
  if (!bar) return;
  // Remove old markers if play changed
  readMarkerEls.forEach(m => m.remove());
  readMarkerEls = [];
  
  for (const [readStr, time] of Object.entries(play.timing)) {
    const readNum = parseInt(readStr);
    const marker = document.createElement('div');
    marker.className = 'read-marker';
    marker.textContent = '①②③④'[readNum - 1] || readNum;
    marker.style.left = (time / TOTAL_TIME * 100) + '%';
    bar.appendChild(marker);
    readMarkerEls.push(marker);
  }
}

// In updateTimer(), replace the remove/recreate block with:
readMarkerEls.forEach((m, i) => {
  const time = parseFloat(m.style.left) / 100 * TOTAL_TIME;
  m.classList.toggle('visible', state.animTime >= time);
});
```
Call `ensureReadMarkers()` only when the play changes (in `selectPlay()`), not on every frame.  
**Effort:** S (20 min)  
**Why it matters:** Biggest performance win for the least effort. 240 DOM ops/sec → 0 during animation.

#### P1-2: Convert plays.js to ES module
**What's wrong:** PLAYS and PLAYERS are globals, creating hidden dependencies  
**Files:** `plays.js` → rename to `plays.js` (keep), `index.html`, all modules  
**Fix:**
1. Add `export` to PLAYERS and PLAYS in plays.js
2. Change `<script src="plays.js">` to `<script type="module" src="plays.js">`
3. In each module that uses PLAYS/PLAYERS, add `import { PLAYS, PLAYERS } from '../plays.js'`
4. Remove the global reference  

**Effort:** M (1 hour) — tedious but mechanical  
**Why it matters:** Eliminates the #1 architectural concern. All dependencies become explicit. Also enables proper IDE support (autocomplete, go-to-definition).

#### P1-3: Fix rotation tracking
**What's wrong:** Rotation counts increment on team toggle, not on plays run  
**Files:** `modules/roster.js`, `modules/queue.js`  
**Fix:** Remove rotation counting from `toggleTeam()`. Instead, increment in `markPlay()`:
```javascript
// In queue.js markPlay():
export function markPlay(result) {
  if (!state.queue.length) return;
  state.queue[state.queuePos].result = result;
  
  // Track rotation counts for who was on field
  const play = PLAYS[state.queue[state.queuePos].playIdx];
  if (play) {
    for (const origName of Object.keys(play.players)) {
      const dispName = getDisplayName(origName);
      state.rotationCounts[dispName] = (state.rotationCounts[dispName] || 0) + 1;
    }
  }
  
  saveQueueState();
  renderQueue();
  if (state.queuePos < state.queue.length - 1) advanceQueue(1);
}
```
**Effort:** S (20 min)  
**Why it matters:** Rotation fairness is important for youth sports. Incorrect counts undermine coach trust.

#### P1-4: Add validation to custom play loading/importing
**What's wrong:** Invalid play data crashes the renderer  
**Files:** `modules/state.js`, `modules/editor.js`  
**Fix:** Add a validation function:
```javascript
function isValidPlay(play) {
  if (!play || typeof play !== 'object') return false;
  if (!play.name || typeof play.name !== 'string') return false;
  if (!play.players || typeof play.players !== 'object') return false;
  if (!play.defense || !Array.isArray(play.defense)) return false;
  if (!play.formation) return false;
  // Validate each player has pos and route
  for (const pd of Object.values(play.players)) {
    if (!pd.pos || !Array.isArray(pd.pos) || pd.pos.length !== 2) return false;
    if (!Array.isArray(pd.route)) return false;
  }
  return true;
}
```
Use it in `loadCustomPlays()` and `importPlaybook()` — skip invalid plays with a console warning.  
**Effort:** S (30 min)  
**Why it matters:** Prevents the app from crashing when localStorage gets corrupted or a bad file is imported.

#### P1-5: Inline styles → CSS classes for panels
**What's wrong:** Coach/queue panels use `style.display = 'none'/'block'` while roster panel uses CSS classes (`.open`, `.visible`)  
**Files:** `app.js`, `style.css`  
**Fix:** Add CSS classes:
```css
#coach-panel, #queue-bar { display: none; }
#coach-panel.active { display: block; }
#queue-bar.active { display: block; }
```
Replace `panel.style.display = 'block'` with `panel.classList.add('active')`.  
**Effort:** S (15 min)  
**Why it matters:** Consistency. Three different patterns for the same concept (show/hide a panel) makes the code harder to maintain.

#### P1-6: Extract editor rendering from renderer.js
**What's wrong:** Edit-mode rendering functions (~120 lines) are in renderer.js  
**Files:** `modules/renderer.js`, `modules/editor.js`  
**Fix:** Move `drawEditRoutes`, `drawEditPlayers`, `drawEditWaypointHandles`, `drawEditSelectionRing`, `drawEditHint` to editor.js. Export a single `drawEditFrame()` function. In renderer.js `drawFrame()`, call the editor's draw function.  
**Effort:** M (45 min)  
**Why it matters:** Keeps renderer.js focused on play rendering. Editor.js already owns editor state and logic — it should own editor rendering too.

#### P1-7: Hardcode CSS variable usage for all colors
**What's wrong:** Mix of CSS variables and hardcoded hex values  
**Files:** `style.css`  
**Fix:** Add missing CSS variables and replace hardcoded values:
```css
:root {
  /* ...existing... */
  --surface-dark: #0d1a2e;
  --border-subtle: #1e3a5f;
  --border-dim: #444;
  --text-muted: #aaa;
  --danger: #ef4444;
  --danger-bg: #450a0a;
  --success: #22c55e;
  --success-bg: #166534;
  --warning: #f59e0b;
}
```
Then replace the ~40 hardcoded hex values in the queue, edit toolbar, and roster sections.  
**Effort:** M (30 min)  
**Why it matters:** Makes theming possible (dark mode is already done, sunlight mode changes 3 variables) and makes the codebase more maintainable.

---

### P2 — Nice-to-Have Polish (Fix When Convenient)

#### P2-1: Replace double-tap sub gesture with explicit button
**What's wrong:** 360ms delay on every player filter tap  
**Files:** `modules/ui.js`  
**Fix:** Remove the double-tap detection. Add a small "↔" swap icon button next to non-locked players. Tap the icon to open the sub menu, tap the dot to highlight.  
**Effort:** M (30 min)  
**Why it matters:** Removes the most noticeable UX lag in the app.

#### P2-2: Fix touch-action conflict
**What's wrong:** CSS touch-action and JS swipe handler compete  
**Files:** `style.css`, `modules/touch.js`  
**Fix:** Change `#field-container { touch-action: none; }` since the JS handler manages all touch interaction on the field. Keep `touch-action: pan-x` only on scrollable containers (play selector, player filter).  
**Effort:** S (10 min)  
**Why it matters:** Prevents potential double-navigation on some browsers/devices.

#### P2-3: Add event delegation for dynamic lists
**What's wrong:** Each dynamically created button gets its own listener  
**Files:** `modules/ui.js`, `modules/queue.js`, `modules/roster.js`  
**Fix:** Use event delegation on container elements:
```javascript
document.getElementById('play-selector').addEventListener('click', (e) => {
  const btn = e.target.closest('.play-btn');
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx);
  // handle click...
});
```
**Effort:** M (1 hour across multiple files)  
**Why it matters:** Cleaner, fewer listeners, works automatically when content is rebuilt.

#### P2-4: Cache static canvas background
**What's wrong:** Field grid, LOS, NRZ zone redrawn every frame  
**Files:** `modules/renderer.js`  
**Fix:** Draw the static field to an off-screen canvas, cache as ImageData. In `drawFrame()`, `putImageData` the cached background, then draw dynamic elements on top. Invalidate cache when play changes (NRZ) or sunlight mode toggles.  
**Effort:** M (45 min)  
**Why it matters:** ~30% rendering performance improvement. Most of `drawField()` is unchanging between frames.

#### P2-5: Proper PWA icons
**What's wrong:** SVG emoji icon looks unprofessional  
**Files:** `manifest.json`, `index.html`, create icon files  
**Fix:** Generate proper PNG icons at 192px and 512px. A football field with play arrows would be on-brand. Add `<link rel="apple-touch-icon">` to HTML.  
**Effort:** S (20 min with a tool like favicon.io)  
**Why it matters:** Professional appearance when installed as a PWA.

#### P2-6: Service worker stale-while-revalidate
**What's wrong:** Cache-first with no update mechanism  
**Files:** `sw.js`  
**Fix:** Switch to stale-while-revalidate for JS/CSS:
```javascript
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, response.clone()));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
```
**Effort:** S (15 min)  
**Why it matters:** Users get instant loads from cache AND eventual updates from network.

#### P2-7: Escape player names in innerHTML
**What's wrong:** Player names interpolated raw into HTML  
**Files:** `modules/roster.js`, `modules/ui.js`  
**Fix:** Add a simple escape function:
```javascript
function esc(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}
```
Use `esc(player.name)` everywhere a name is interpolated into innerHTML.  
**Effort:** S (20 min)  
**Why it matters:** Defense in depth. Even if the data is local, escaping prevents weird bugs from names with special characters.

#### P2-8: Add visual feedback for long-press waypoint delete
**What's wrong:** No indication that a long press is being detected  
**Files:** `modules/editor.js`  
**Fix:** Start a CSS animation (pulse/grow) on the waypoint when the long press timer starts. Cancel it if the pointer moves.  
**Effort:** S (20 min)  
**Why it matters:** Discoverable interactions. Users won't know long-press deletes without feedback.

---

## Grades Summary

| Category | Grade | Notes |
|----------|-------|-------|
| **Code Quality** | B | Clean and readable, but innerHTML patterns, no escaping, magic numbers |
| **Architecture** | B+ | Clean module boundaries, callback injection. Globals dependency is the weak spot |
| **Correctness** | B- | Animation loop bug, coach listener accumulation, rotation tracking broken |
| **Mobile / UX** | B | Phase 1 fixed layout. Double-tap delay, touch-action conflict remain |
| **Performance** | C+ | Read marker DOM thrashing is bad. No canvas caching. Otherwise fine |
| **Consistency** | B- | Three different panel show/hide patterns, mixed CSS vars/hardcoded, inconsistent naming |

**Overall: B-**

This is a solid foundation with real coaching value. The canvas engine is genuinely impressive. Fix the P0 bugs (animation loop, coach listeners), address the P1 performance issue (read markers), and this codebase is ready for the next phase of features.
