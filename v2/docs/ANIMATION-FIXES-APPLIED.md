# Animation Fixes Applied — Flag Football Playbook v2

**Applied:** 2026-03-17  
**Source:** ANIMATION-AUDIT.md  
**Files Modified:** `js/canvas/animator.js`, `js/canvas/renderer.js`, `js/play-library.js`

---

## Summary

All bugs from the audit have been addressed. 4 fixes in code, 11 fixes in play data, plus a field zoom change and route capping across 37 plays.

---

## 1. ANIMATOR FIX — Eye Line Phase Switching (BUG-01 + BUG-04)

**File:** `js/canvas/animator.js`  
**Bugs fixed:** BUG-01 (eye line stays on look-off after throw, 31 plays), BUG-04 (backward eye lines, 4 plays)

### What changed
Replaced the old phase-based eye line logic (ROUTES/SNAP phase = yellow, DELIVERY phase = red) with time-based logic keyed on actual ball release time.

**Old logic:** Eye line switched when `phase === PHASES.DELIVERY` — which starts at `snapEnd + routeDuration`. Since `routeDuration` is inflated by late timing entries (like C's 4.0s checkdown), the switch happened 1–4 seconds after the ball was actually thrown.

**New logic:** Eye line switches when `t >= releaseAbsTime`, where `releaseAbsTime = snapEnd + lastNonSnapBallEvent.time`. This is the exact moment the ball leaves the QB's hand.

Also added a **backward eye line guard**: the yellow look-off line is only drawn if `eyesTarget[1] >= qbPos[1]` — i.e., the look-off target must be at or downfield of the QB. This prevents eye lines from pointing behind the QB (BUG-04), which was happening on Snag, RPO Slant, Flat-Wheel, and Screen Fake Post at the start of their routes phase.

Both fixes together ensure:
- Eye line switches at the correct moment (not 1–4 seconds late)
- Eye line never draws backward to a target in the backfield
- `qbLook: null` plays (run plays, Braelyn Lateral) are safely skipped by the existing `play.qbLook &&` guard

---

## 2. FIELD DEPTH CHANGE — Zoom In to 17 Yards

**File:** `js/canvas/renderer.js`  
**Bug fixed:** Field was rendering 22+ yards downfield, making routes tiny on mobile

### What changed
Added `FIELD_TOTAL_YARDS = 26` constant and used it in both `fieldToCanvas()` and `drawField()` instead of the hardcoded `35`.

- **Old:** `scale = usableHeight / 35` → ~22.75 yards visible downfield
- **New:** `scale = usableHeight / 26` → ~16.9 yards visible downfield (~17 yards)

With LOS at 65% from top and the new scale:
- **Downfield:** 0.65 × 26 = 16.9 yards (≈ 17 yards, covers all plays after capping)
- **Backfield:** 0.35 × 26 = 9.1 yards (covers deepest backfield positions at Y=−5.5)

Also updated yard lines in `drawField()` to stop at Y=15 instead of Y=25 — no point drawing lines in the area that's now cropped out.

This makes every route visually larger and clearer on mobile screens, which is the primary use case.

---

## 3. PLAY DATA FIXES — `js/play-library.js`

### FIX-02: Play Action Boot (BUG-02 — QB throws from past LOS)
- QB route last waypoint: `[8,2]` → `[8,-1]`
- QB now throws from Y=−1 (just behind LOS), not Y=2 (2 yards downfield)
- Teaches correct football: forward passes must be thrown from behind the LOS

### FIX-03: Slant-Flat (BUG-03 — qbLook.throw mismatch)
- `eyes: 'WR1'` → `eyes: 'RB'`
- `throw: 'RB'` → `throw: 'WR1'`
- Updated tip text to match
- The animation now shows QB looking at the flat (RB) to hold the flat defender, then firing the slant (WR1) — matches the `ballPath` throw target and teaches the correct read

### FIX-05: RPO Slant (BUG-04b — eye line pointed backward at WR2 in backfield)
- `qbLook.eyes: 'WR2'` → `qbLook.eyes: 'WR1'`
- `qbLook.throw` was already `'WR1'`, so now eyes and throw both point to WR1 slant
- Updated tip text to explain the RPO read correctly
- WR2 in the backfield was causing the backward eye line; this removes that entirely

### FIX-06: Flat-Wheel (BUG-04c — RB start at [22,−5] caused backward eye line)
- `RB: { pos: [22,-5], route: [[22,-2],[32,2]] }` → `{ pos: [24,-2], route: [[28,0],[33,2]] }`
- RB now starts closer to the LOS; eye line from QB to RB points slightly downfield, not backward
- Flat route concept preserved, just starting from a more natural alignment

### FIX-07: Braelyn Lateral (BUG-05 — eye line from QB, but WR2 is the passer)
- `qbLook: { eyes:'WR1', throw:'QB', ... }` → `qbLook: null`
- This is a trick play where QB becomes a receiver and WR2 throws; the QB-centric eye line system cannot represent this correctly
- Removing qbLook entirely is cleaner than drawing a misleading eye line from the wrong player
- The `play.qbLook &&` guard in animator.js safely handles `null` — no eye line drawn

### FIX-08: RB Draw (BUG-06 — unused timing entry)
- `timing: { 1: 1.0 }` → `timing: {}`
- `timing[1] = 1.0` was unused (no player with `read: 1`), and misleadingly suggested a 1.0s catch that doesn't exist
- The handoff at 1.5s still animates correctly; `_routeDuration` falls back to `Math.max(1.5, 0, 2.0) = 2.0`

### FIX-09: Mesh (BUG-07 — throw arrives past mesh crossing point)
- `timing[1]: 1.5` → `timing[1]: 0.75`
- `ballPath throw time: 1.5` → `0.75`
- WR1 now receives the ball at ~50% route progress (near the mesh crossing at field center) instead of at 100% progress (far sideline)
- Illustrates the "quick, safe at the crossing point" teaching concept correctly

### FIX-10: Flood Right & Flood Left — WR2 OUT Route (BUG-08)
**Flood Right:**
- `WR2 route: [[32,8],[34,8]]` → `[[32,5],[35,5]]`
- Out route breaks at 5 yards (not 8), with a sharper lateral break to the sideline

**Flood Left:**
- `WR2 route: [[3,8],[1,8]]` → `[[3,5],[0,5]]`
- Mirror fix — breaks at 5 yards, sharp break left to the sideline

### FIX-11: Hitch & Go — WR2 turn-back waypoint (BUG-09)
- `WR2 route: [[11,5]]` → `[[11,5],[11,4]]`
- Added Y=4 turn-back waypoint so WR2 shows the receiver stopping and coming back to the QB after the hitch
- Matches WR1's hitch-and-wiggle animation style; sells the hitch route concept

### FIX-12: Stick Concept — WR2 FLAT route (BUG-10)
- `WR2 route: [[31,3],[34,3]]` → `[[31,2],[35,2]]`
- Flatter route (breaks at 2 yards, not 3), stronger lateral push to sideline
- Better represents a flat route vs. the previous hitch-to-out shape

---

## 4. ROUTE DEPTH CAPPING — All routes capped at Y ≤ 15

**File:** `js/play-library.js`

Following the field depth change (max ~17 yards visible), all route waypoints with Y > 15 were capped to Y = 15. No defender positions exceeded Y = 15 (none needed adjustment).

**Plays affected (route endpoint capped):**

| Play | Position | Old endpoint | New endpoint |
|------|----------|-------------|-------------|
| Flood Fake | WR1 CORNER | `[33,16]` | `[33,15]` |
| Flood Right | WR1 CORNER | `[33,16]` | `[33,15]` |
| Flood Left | WR1 CORNER | `[2,16]` | `[2,15]` |
| Reverse | WR1 REVERSE | `[2,18]` | `[2,15]` |
| RPO Slant | RB GO | `[31,14]` | ✅ already OK |
| Flat-Wheel | WR2 WHEEL | `[33,16]` | `[33,15]` |
| Braelyn Lateral | RB GO | `[31,18]` | `[31,15]` |
| Hitch & Go | WR1 GO | `[4,22]` | `[4,15]` |
| Slant & Go | WR1 GO | `[1,16]` | `[1,15]` |
| Jet Sweep | WR2 GO | `[3,18]` | `[3,15]` |
| Mesh Wheel | RB WHEEL | `[27,16]` | `[27,15]` |
| Screen | WR1 GO | `[4,18]` | `[4,15]` |
| Screen | WR2 GO | `[31,18]` | `[31,15]` |
| RPO Flood | WR2 CORNER | `[33,16]` | `[33,15]` |
| Triple Option | WR2 GO DEEP | `[31,18]` | `[31,15]` |
| Bubble Screen | WR1 GO | `[4,18]` | `[4,15]` |
| RB Draw | WR2 GO | `[3,18]` | `[3,15]` |
| RB Draw | RB GO | `[31,18]` | `[31,15]` |
| Counter Sweep | RB GO | `[31,18]` | `[31,15]` |
| Counter Left | RB GO | `[4,18]` | `[4,15]` |
| Play Action Boot | WR2 GO | `[4,18]` | `[4,15]` |
| Slant-Flat | WR2 DEEP | `[26,18]` | `[26,15]` |
| Stick Concept | RB WHEEL | `[31,16]` | `[31,15]` |

All "GO (clear)", "GO (sell)", and "GO (decoy)" routes that extended past 15 yards were capped. These are routes intended to clear defenders, not to be thrown to — the animation doesn't need to show them running off the edge of the visible field.

---

## Verification Results

All 15 fix checks pass (Python verification script):
- ✅ FIX-02 QB boot [8,−1]
- ✅ FIX-03 slant-flat eyes:RB + throw:WR1
- ✅ FIX-05 RPO eyes:WR1
- ✅ FIX-06 RB pos [24,−2]
- ✅ FIX-07 braelyn qbLook: null
- ✅ FIX-08 rb-draw timing: {}
- ✅ FIX-09 mesh timing 0.75 + ballPath 0.75
- ✅ FIX-10 flood-right WR2 [32,5],[35,5]
- ✅ FIX-10 flood-left WR2 [3,5],[0,5]
- ✅ FIX-11 hitch WR2 turn-back [11,4]
- ✅ FIX-12 stick WR2 [31,2],[35,2]
- ✅ Route cap: no [X,18] in routes
- ✅ Route cap: no [X,16] in routes

All 5 renderer/animator checks pass:
- ✅ FIELD_TOTAL_YARDS = 26
- ✅ fieldToCanvas uses constant
- ✅ drawField uses constant
- ✅ Yard lines capped at 15
- ✅ Old hardcoded `/ 35` removed from scale

All 7 animator eye line checks pass:
- ✅ Time-based releaseAbsTime logic
- ✅ hasThrown boolean
- ✅ isPostSnap guard
- ✅ Eye line before release (isPostSnap && !hasThrown)
- ✅ Red line after release (isPostSnap && hasThrown)
- ✅ Backward eye line guard (eyesTarget[1] >= qbPos[1])
- ✅ Phase-based ROUTES/SNAP check removed

`js/play-library.js` syntax validation: ✅ Exit code 0 (Node v12 ESM check)

---

## Edge Cases Confirmed Safe

1. **Run plays (qbLook: null)** — The `play.qbLook && !play.isRunPlay` guard at the start of the QB Eyes block means no eye line code runs. The new `releaseAbsTime` computation is inside that block, so run plays are completely unaffected.

2. **Braelyn Lateral (qbLook: null after FIX-07)** — Same guard handles it. No eye line drawn. Previously drew a misleading line from QB (now a receiver) to WR1.

3. **Screen play (timing: { 1: 2.5 }, throw at 2.5)** — `releaseAbsTime = snapEnd + 2.5`. At t = snapEnd + 2.5, `hasThrown` becomes true. Eye line correctly switches exactly at throw time. This play was already a timing-accurate exception — the new logic keeps it correct.

4. **Slant-Wheel (timing: { 1:1.0, 2:2.5 }, throw at 2.5)** — Eye line switches at snapEnd + 2.5 exactly when ball is released to RB. Was already correct timing-wise; new logic preserves that.

5. **Plays with multiple ball events (Reverse, Braelyn Lateral)** — `releaseAbsTime` uses the **last** non-snap event. For Reverse: last event is `lateral` at t=1.5, so the eye line (if any) would switch at snapEnd + 1.5. These are run plays with `qbLook: null` anyway, so the eye line block is skipped entirely.
