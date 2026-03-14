# UX Audit: Flag Football Playbook Mobile App

**Auditor:** Senior UX/UI Designer — Mobile Sports Apps  
**Date:** 2026-03-13  
**Devices Tested:** iPhone (portrait), iPad (portrait + landscape)  
**Context:** Sideline coaching tool for 8-10 year old flag football

---

## Part 1: UX Grades

### 1. Mobile Layout & Responsiveness — **F**

The #1 blocker. The field canvas has `flex: 1` and expands to fill all available viewport height, pushing the controls bar and info panel completely off-screen on iPhone. The play selector is partially cut off at the top. On a typical iPhone in portrait (roughly 660px viewport height after browser chrome), the play selector (~60px) + player filter (~44px) + timer (~40px) = ~144px of chrome, leaving ~516px for the canvas — which then pushes ~100px of controls + info panel below the fold. **Nothing below the canvas is visible without scrolling.**

The `100dvh` layout is correct in theory, but the canvas `flex: 1` greedily eats everything. There's no `min-height: 0` cooperation happening, and no max constraint on the canvas.

### 2. Touch Targets — **C+**

Buttons meet the 44px minimum (`min-height: 44px` on `.ctrl-btn` and `.speed-btn`). Player filter dots are only 36px — below Apple HIG. The play selector buttons are 44px. However, **none of this matters if the controls are off-screen.** Speed buttons are too small for cold fingers (44px width with 4px gap means easy mis-taps). The player dot buttons need more tap area.

### 3. Visual Hierarchy — **C**

Play name is visible in the selector strip (good). Formation label is buried in the info panel (which is off-screen). Route colors are well-differentiated. Read numbers (①②③) are clear. However, route labels ("MESH", "CHECK", etc.) use 10px font in small white boxes that cluster near the LOS area and overlap each other on mobile widths. The play name should be more prominent.

### 4. Information Density — **D+**

Too much crammed into the info panel. Formation, when-to-use bullets, AND play notes all fight for space. On desktop this works; on mobile it's noise. The timer bar with read markers, snap indicators ("MOTION", "SET!", "HIKE!"), route labels, read numbers, fake segment labels, and NRZ overlay all compete for attention on a small screen.

### 5. Readability — **D**

- Route labels: 10px bold — nearly illegible in bright sunlight
- Player names on dots: 8px bold — unreadable outdoors
- Timer segment labels: 10px — too small
- Info panel text: 11-13px — acceptable but below the fold
- Yard line labels: 10px — fine (decorative)
- White text on green field works for contrast, but the small sizes kill it

### 6. Navigation — **B**

Horizontal scrolling play selector is good. Swipe on field to change plays is intuitive. Keyboard shortcuts exist. However, with many plays the selector could benefit from grouping. The filter dots let you isolate a player's route which is excellent for showing a kid "here's YOUR route." Best part of the UX.

### 7. Animation Quality — **B+**

Routes animate progressively with staggered timing in QB Study mode. Read pulses are visually clear. Pre-snap motion with MOTION/SET/HIKE phases is well-conceived. Defender animation (man/zone) adds real coaching value. Arrow heads on routes are clear. This is the strongest part of the app — the animation engine is solid.

### 8. Outdoor/Field Usability — **D**

- Controls hidden = can't use the app at all
- Small text = can't read in sunlight
- Player filter wraps to 2 lines = wastes precious vertical space
- No high-contrast mode for sunlight
- Dark background (#1a1a2e) is actually good for reducing glare
- No way to quickly show "just this one play" to a kid

---

### Overall Grade: **D+**

### Shippable for Saturday? **NO** ❌

The app has an excellent animation engine and smart coaching features, but the mobile layout is fundamentally broken. Controls are invisible, text is too small, and the layout doesn't fit on a phone screen. The core interaction — play/pause, replay, speed — is inaccessible. This needs 2-3 hours of CSS surgery before it's game-ready.

---

## Part 2: Critical Fixes (Must-Do Before Game Day)

### Fix 1: Force Single-Screen Layout — No Scrolling

**Problem:** `#field-container` with `flex: 1` eats all viewport height, pushing controls off-screen. `overflow-x: hidden` on body doesn't prevent vertical overflow.

**Solution:** Lock body to `overflow: hidden`, ensure `#app` fills exactly `100dvh` with `overflow: hidden`, and constrain the field container properly.

**CSS changes:**
```css
html, body {
  height: 100%;
  overflow: hidden; /* ADD — prevent ALL scrolling */
}

#app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 900px;
  margin: 0 auto;
  overflow: hidden; /* ADD — nothing escapes */
}

#field-container {
  flex: 1;
  min-height: 0; /* CRITICAL — allows flex item to shrink below content size */
  overflow: hidden;
}
```

**Why:** This is THE fix. With `overflow: hidden` on html/body and `min-height: 0` on the flex child, the canvas will shrink to fit the remaining space after all `flex-shrink: 0` elements get their share. Controls become visible.

### Fix 2: Compact Player Filter — Single Row, No Wrapping

**Problem:** `flex-wrap: wrap` causes player dots to spill to a second line on narrow screens, wasting 40px+ of vertical space.

**Solution:** Remove wrap, make the filter horizontally scrollable like the play selector, and shrink dot buttons for mobile.

**CSS changes:**
```css
#player-filter {
  display: flex;
  gap: 6px;
  padding: 4px 12px;
  justify-content: center;
  flex-shrink: 0;
  flex-wrap: nowrap; /* CHANGE from wrap */
  overflow-x: auto; /* ADD — scroll if needed */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
#player-filter::-webkit-scrollbar { display: none; }

.player-dot-btn {
  min-height: 32px; /* REDUCE from 36px */
  padding: 3px 8px;
}
```

**Why:** 5 player dots should fit on one row on iPhone (320px+). If future plays have more players, horizontal scroll handles it.

### Fix 3: Tighten Field Vertical Range — Crop Empty Space

**Problem:** Field Y range is [-8, 24] = 32 yards. Most action happens between -4 and 16 yards. The top of the field (16-24 yard area) is mostly empty green with defenders, and below LOS (-8 to -4) is wasted space behind the offense.

**Solution:** Tighten the Y coordinate range to show only the relevant area.

**JS changes in app.js:**
```javascript
// Change these constants:
const FIELD_Y_MIN = -6;  // was -8 (trim 2 yards behind LOS)
const FIELD_Y_MAX = 20;  // was 24 (trim 4 yards of empty downfield)
```

**Why:** This crops 6 yards of empty space (19% of field height), making routes larger and more readable on the same canvas size. Defenders at y=13 are still visible. Routes rarely go past y=18.

### Fix 4: Move Info Panel into a Compact Strip Below Controls

**Problem:** Info panel (`#info-panel`) takes 60-80px of vertical space below the field with formation, when-to-use bullets, and notes. On mobile this pushes controls further off-screen and the text is rarely consulted during a game.

**Solution:** Collapse info into a single compact line and move it below controls. Show formation inline. Make when-to-use a tooltip/tap-to-expand.

**CSS changes:**
```css
#info-panel {
  padding: 2px 12px 4px;
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  align-items: baseline;
  overflow: hidden;
  max-height: 24px;
  font-size: 11px;
}

#formation-label {
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
}

#when-to-use {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#play-notes {
  display: none; /* Hide on mobile — not useful during game */
}
```

**HTML change:** Move `#info-panel` AFTER `#controls` in the DOM so controls appear first (more important).

**Why:** Formation is useful context. When-to-use is nice-to-have. Notes are irrelevant during a game. Compressing to one 24px strip saves 40-60px.

### Fix 5: Reduce Vertical Padding Everywhere

**Problem:** Each section has 8-12px padding top/bottom. With 6 sections, that's 60-96px of padding alone — nearly 15% of iPhone viewport.

**Solution:** Tighten all vertical padding for mobile.

**CSS changes:**
```css
#play-selector {
  padding: 4px 8px;  /* was 8px 12px */
  gap: 6px;
}

.play-btn {
  padding: 6px 14px;  /* was 10px 16px */
  min-height: 38px;   /* was 44px — acceptable for scrollable list */
  font-size: 13px;
}

#timer-container {
  padding: 2px 8px;  /* was 4px 12px */
}

#timer-bar {
  height: 24px;  /* was 32px */
}

#timer-time {
  font-size: 14px;  /* was 18px */
}

#controls {
  padding: 4px 8px;  /* was 8px 12px 12px */
  gap: 6px;
}

.ctrl-btn {
  min-width: 40px;
  min-height: 40px;
}
```

**Why:** Saves ~50px of vertical space. Combined with other fixes, this reclaims enough room to show everything on one screen.

---

## Part 3: Nice-to-Have Improvements

1. **High-contrast sunlight mode** — Toggle to boost route line widths to 6px, label fonts to 14px, and increase player dot radius to 18px. Add a ☀️ button.

2. **Play grouping** — Group plays by formation or situation (e.g., "Red Zone", "NRZ", "Motion") with collapsible headers in the selector.

3. **Tap-on-player to highlight** — Tap a player dot on the field to isolate their route (same as filter dot, but more discoverable for kids).

4. **Fullscreen mode** — Use the Fullscreen API on tap to eliminate browser chrome, gaining ~60px on iPhone.

5. **Landscape layout** — Side-by-side layout: field on left (60%), controls + info stacked on right (40%). Currently the landscape media query just makes things smaller.

6. **Haptic feedback** — Use `navigator.vibrate(10)` on play selection and snap moment for tactile confirmation.

7. **Route label collision avoidance** — Labels near LOS cluster together. Implement simple offset logic: if two labels are within 20px, nudge one vertically.

8. **"Show My Route" mode** — Big button per player that shows ONLY their route, enlarged, with a simple arrow and text like "Run HERE, then turn LEFT." For 8-year-olds.

9. **Offline indicator** — Show a subtle "📡 Offline Ready" badge when the service worker has cached the app. Coaches need confidence it works without WiFi.

10. **Swipe-up for details** — Info panel could be a bottom sheet that swipes up for full play details, swipes down to hide. Zero vertical cost when collapsed.

---

## Part 4: Recommended Layout Architecture

### Target: Everything on one screen, no scrolling

```
┌──────────────────────────────────────┐
│ [Play Selector] — horizontal scroll  │ ~38px
├──────────────────────────────────────┤
│ [●] [●] [●] [●] [●] Player Filter   │ ~32px
├──────────────────────────────────────┤
│ [QUICK][MEDIUM][DEEP][NOW!] Timer    │ ~24px
├──────────────────────────────────────┤
│                                      │
│          FIELD CANVAS                │ flex: 1
│        (fills remaining)             │ min-height: 0
│                                      │
├──────────────────────────────────────┤
│ 🔄 ▶ 👁️ 🛡️ [.25][.5][1x][2x]      │ ~44px
├──────────────────────────────────────┤
│ Formation: Trips Right • Use vs man  │ ~22px
└──────────────────────────────────────┘
```

### Total Chrome Height:
- Play selector: 38px (6px padding + 38px button)
- Player filter: 36px (4px padding + 32px buttons)
- Timer: 28px (2px padding + 24px bar)
- Controls: 48px (4px padding + 40px buttons)
- Info strip: 22px
- **Total: ~172px**

### iPhone 15 Pro (852px viewport in Safari, ~710px after browser chrome):
- Chrome: 172px
- **Canvas: 538px** ✓ plenty of room

### iPhone SE (667px viewport, ~560px after chrome):
- Chrome: 172px  
- **Canvas: 388px** ✓ tight but functional

### iPad (1024px portrait viewport):
- Chrome: 172px
- **Canvas: 852px** ✓ luxurious

### CSS Architecture

```css
html, body {
  height: 100%;
  overflow: hidden;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 900px;
  margin: 0 auto;
  overflow: hidden;
}

/* All sections except canvas are flex-shrink: 0 (fixed height) */
#play-selector { flex-shrink: 0; }
#player-filter { flex-shrink: 0; }
#timer-container { flex-shrink: 0; }
#controls { flex-shrink: 0; }
#info-panel { flex-shrink: 0; }

/* Canvas fills remaining space */
#field-container {
  flex: 1;
  min-height: 0;      /* Allow shrinking below content size */
  overflow: hidden;
}
```

### Landscape Mode (iPhone)

When `orientation: landscape` AND `max-height: 500px`:

```
┌────────────────────────────────────────────────────┐
│ [Play1][Play2]... │  FIELD CANVAS  │ 🔄 ▶ 👁️ 🛡️  │
│ [●][●][●][●][●]  │                │ [.5][1x][2x]  │
│ Timer ░░░░░░░░░░  │                │ Form: Trips   │
└────────────────────────────────────────────────────┘
```

This would be a future improvement (Part 3) — requires significant layout restructuring with CSS grid. For Saturday, portrait-only is fine.

### Portrait vs Landscape Handling

For the Saturday deadline, focus on portrait:
- Use `@media (orientation: landscape) and (max-height: 500px)` to further reduce padding
- Reduce play button and control sizes
- Consider hiding the info strip entirely in landscape (formation visible on field)

### DOM Order (Recommended)

```html
<div id="app">
  <div id="play-selector"></div>
  <div id="player-filter"></div>
  <div id="timer-container">...</div>
  <div id="field-container"><canvas></canvas></div>
  <div id="controls">...</div>
  <div id="info-panel">...</div>
</div>
```

Controls ABOVE info panel — controls are more important and should be closest to the field canvas for quick access.

---

## Summary

| Priority | Fix | Time Estimate |
|----------|-----|---------------|
| 🔴 P0 | Lock viewport, overflow hidden, min-height: 0 | 10 min |
| 🔴 P0 | Compact player filter to single row | 5 min |
| 🔴 P0 | Tighten field Y range | 2 min |
| 🟡 P1 | Compress info panel to single strip | 15 min |
| 🟡 P1 | Reduce all vertical padding | 10 min |
| **Total** | | **~45 min** |

After these fixes, the app will be **shippable for Saturday**. The animation engine is the star — we just need to get out of its way on mobile.
