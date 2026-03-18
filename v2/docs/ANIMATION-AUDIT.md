# Animation Audit — Flag Football Playbook v2

**Audited:** 2026-03-17  
**Files:** `js/play-library.js` (37 plays), `js/canvas/animator.js`, `js/canvas/renderer.js`  
**Purpose:** Verify every play's animation matches its actual play definition. This is a coaching tool for kids — wrong animations teach wrong football.

---

## 1. Animator Logic Summary

### Coordinate System
- Field: X = 0–35 (left to right sideline), Y = negative behind LOS, positive downfield
- LOS at Y=0, canvas renders at 65% from top
- `fieldToCanvas()` handles all conversions

### Phase Timeline
```
[PRE_SNAP] → [SNAP] → [ROUTES] → [DELIVERY] → [AFTER_CATCH] → [DONE]
    |             |        |            |              |
  0s          snapStart  snapEnd   routeEnd      deliveryEnd   totalDuration
```
- `_preSnapDuration` = 1.0s if motion exists, 0.15s if not
- `_snapDuration` = 0.3s
- `_routeDuration` = `Math.max(maxDeliveryTime, maxPlayerTiming, 2.0)`
  - `maxDeliveryTime` = max of all non-snap ballPath event times
  - `maxPlayerTiming` = max of all entries in `play.timing`
- `deliveryDuration` = 0.5s (ball flight time, hardcoded)
- `AFTER_CATCH_HOLD` = 1.5s

### How Eye Lines Work
```javascript
// During SNAP or ROUTES phase → yellow dashed line from QB to qbLook.eyes
if (phase === PHASES.ROUTES || phase === PHASES.SNAP) {
  drawEyeLine(qbPos → playerPositions[play.qbLook.eyes])
}
// During DELIVERY or AFTER_CATCH phase → red dashed line from QB to qbLook.throw
if (phase === PHASES.DELIVERY || phase === PHASES.AFTER_CATCH) {
  line(qbPos → playerPositions[play.qbLook.throw])
}
```

**Critical flaw:** The DELIVERY phase starts at `_routeEnd = snapEnd + _routeDuration`. But `_routeDuration = Math.max(maxDeliveryTime, maxPlayerTiming, 2.0)`. For nearly every play, `maxPlayerTiming > maxDeliveryTime`, so `_routeDuration > throw_time`. This means the ball gets thrown **during the ROUTES phase**, not the DELIVERY phase. The eye line never switches from "look-off target" to "throw target" until after the ball has already been caught — sometimes 1–4 seconds too late.

### How Ball Path Works
```javascript
// Ball event absolute start = snapEnd + evt.time
absStart = snapEnd + evt.time
absEnd = absStart + flight  // throw=0.5, handoff=0.2, snap=0.3

// In flight: draw ball at lerp(from, to, progress)
// Not in flight: ball is with last completed event's "to" player (carrier)
```

### How Routes Animate
- Each player has `playerRouteDuration`:
  - If `data.read > 0` and `timing[data.read]` exists → use that timing value
  - Otherwise → use `Math.max(_routeDuration, 2.0)`
- Route uses Catmull-Rom spline interpolation through waypoints
- Progress = `Math.min(1, routeElapsed / playerRouteDuration)`, clamps at 1

---

## 2. Per-Play Audit Table

**Legend:**  
✅ Pass | ❌ Fail | ⚠️ Minor Issue | — N/A (run play, no qbLook)

| # | Play | qbLook Eye Line | Ball Path Timing | Route Accuracy | Pre-Snap Motion | Defense | QB Movement | Notes |
|---|------|----------------|-----------------|----------------|----------------|---------|-------------|-------|
| 1 | Mesh | ⚠️ Gap 2.5s | ✅ | ✅ | ✅ WR2 L→R | ✅ | — | Eye line to WR2 for 2.5s after WR1 already has ball |
| 2 | Flood Fake | ⚠️ Gap 2.0s | ✅ | ⚠️ WR2 OUT minimal | ✅ RB post | ✅ | — | Eye on WR1 for 2s after RB already has ball |
| 3 | Flood Right | ⚠️ Gap 3.5s | ✅ | ⚠️ WR2 OUT only 2yds | — | ✅ | — | Worst eye-line gap: 3.5s |
| 4 | Reverse | — | ✅ handoff+lateral | ✅ | ✅ WR1 R→L | ✅ | ✅ fakes right | Run play — no eye line |
| 5 | RPO Slant | ❌ Eye backward | ⚠️ Gap 2.5s | ✅ | — | ✅ | ✅ fakes right | WR2 at [17.5,-5.5] — eye line points BEHIND QB at start |
| 6 | Quick Slants NRZ | ⚠️ Gap 2.7s | ✅ | ✅ | — | ✅ | — | 2.7s gap |
| 7 | Flat-Wheel | ❌ Eye backward | ⚠️ Gap 2.0s | ✅ | — | ✅ | — | RB at [22,-5] — eye line points behind QB; 2.0s gap |
| 8 | Braelyn Lateral | ❌ Wrong player | ⚠️ Gap 2.5s | ✅ | — | ✅ | ✅ QB becomes receiver | Eye line from QB, but WR2 is the passer |
| 9 | Flood Left | ⚠️ Gap 3.5s | ✅ | ⚠️ WR2 OUT only 2yds | — | ✅ | — | Mirror of Flood Right |
| 10 | Hitch & Go | ⚠️ Gap 1.0s | ✅ | ⚠️ WR2 HITCH no turn-back | ✅ WR2 L→R | ✅ | — | WR2 hitch is just a stop, no turn |
| 11 | Screen | ✅ No gap | ✅ | ✅ | ✅ RB moves | ✅ | — | One of the few plays with correct phase timing |
| 12 | Reverse Fake | ⚠️ Gap 2.5s | ✅ | ✅ | ✅ RB R→L fake | ✅ | — | |
| 13 | Fade | ⚠️ Gap 2.0s | ✅ | ✅ | — | ✅ | — | |
| 14 | Mesh Wheel | ⚠️ Gap 1.5s | ✅ | ✅ | ✅ RB L→R | ✅ | — | |
| 15 | Slant & Go | ⚠️ Gap 1.0s | ✅ | ✅ route wiggles OK | — | ✅ | — | |
| 16 | Screen Fake Post | ❌ Eye backward | ⚠️ Gap 1.5s | ✅ | ✅ RB moves | ✅ | — | RB starts at [24,-4] — eye briefly behind LOS |
| 17 | Jet Sweep | — | ✅ handoff | ✅ | ✅ WR1 L→R | ✅ | ✅ fakes handoff | Run play |
| 18 | RB Draw | — | ⚠️ timing/handoff mismatch | ✅ | — | ✅ | ✅ fakes pass | timing[1]=1.0 but handoff at 1.5 |
| 19 | End Around | — | ✅ handoff | ✅ | ✅ WR1 R→L | ✅ | ✅ fakes handoff | Run play |
| 20 | RPO Flood | ⚠️ Gap 2.5s | ✅ | ✅ | — | ✅ | — | |
| 21 | Triple Option | — | ✅ handoff | ✅ | — | ✅ | ✅ reads left | Run play |
| 22 | Bubble Screen | ⚠️ Gap 1.5s | ✅ | ✅ | ✅ RB moves | ✅ | — | Ball caught at 1.0s, eye stays on WR1 for 1.0s more |
| 23 | Quick Hitch | ⚠️ Gap 2.0s | ✅ | ✅ | — | ✅ | — | |
| 24 | Jet Bubble | ⚠️ Gap 1.5s | ✅ | ✅ | ✅ WR1+RB move | ✅ | — | |
| 25 | Fake Jet Draw | — | ✅ handoff | ✅ | ✅ WR1 L→R | ✅ | ✅ fakes handoff | Run play |
| 26 | Counter Sweep | — | ✅ handoff | ✅ | — | ✅ | ✅ fakes left | Run play |
| 27 | Counter Left | — | ✅ handoff | ✅ | — | ✅ | ✅ fakes right | Run play |
| 28 | Play Action Boot | ✅ No gap | ❌ QB past LOS at throw | ✅ concept | — | ✅ | ❌ QB at Y=2 (past LOS) | **Keith's specific bug confirmed** |
| 29 | I-Bone | — | ✅ handoff | ✅ | — | ✅ | — | Run play |
| 30 | Slant-Flat | ❌ throw mismatch | ⚠️ Gap 1.0s | ✅ | — | ✅ | — | qbLook.throw='RB' but ball goes to WR1 |
| 31 | Quick Out | ⚠️ Gap 2.6s | ✅ | ✅ | — | ✅ | — | |
| 32 | Stick | ⚠️ Gap 1.5s | ✅ | ⚠️ WR2 FLAT barely moves | — | ✅ | — | |
| 33 | Spacing | ⚠️ Gap 2.5s | ✅ | ✅ | — | ✅ | — | |
| 34 | Snag | ❌ Eye backward | ⚠️ Gap 3.0s | ✅ | — | ✅ | — | RB at [17.5,-5.5] — eye line points straight behind QB |
| 35 | Power Right | — | ✅ handoff | ✅ | — | ✅ | — | Run play |
| 36 | Double-Back Flat-Seam | ⚠️ Gap 2.0s | ✅ | ✅ | — | ✅ | — | |
| 37 | Slant-Wheel | ✅ No gap | ✅ | ✅ | — | ✅ | — | One of the few plays with correct phase timing |

---

## 3. Bugs Found

### BUG-01 ❌ CRITICAL (Systemic): Eye Line Stays on Look-Off Target After Ball Is Thrown

**Affects:** 31 of 37 plays (all pass plays except Screen, Play Action Boot, Slant-Wheel)

**What's wrong:**  
The yellow dashed eye line is supposed to show the QB looking off the defense before throwing. After the throw, the eye line should switch to the throw target. But the switch only happens when the DELIVERY phase starts — which is at `snapEnd + _routeDuration`. Since `_routeDuration = Math.max(maxDeliveryTime, maxPlayerTiming, 2.0)`, and most plays have late timing entries (e.g., C check at 4.0s), the DELIVERY phase starts 1–4 seconds **after** the ball has already been thrown.

**Effect on kids:** QB throws the ball, kids can see the ball flying to WR1, but the yellow "QB is looking here" line is still pointing at WR2. The child learns that after throwing, QB keeps staring at the look-off. This undermines the entire look-off teaching concept.

**Gaps by play:**
| Play | Throw Time | Route Duration | Eye Line Gap |
|------|-----------|----------------|-------------|
| Flood Right | 1.0s | 4.5s | **3.5s** |
| Flood Left | 1.0s | 4.5s | **3.5s** |
| Snag | 1.0s | 4.0s | **3.0s** |
| Quick Out | 0.9s | 3.5s | **2.6s** |
| Quick Slants NRZ | 0.8s | 3.5s | **2.7s** |
| Mesh | 1.5s | 4.0s | **2.5s** |
| Flood Fake | 2.0s | 4.0s | **2.0s** |
| RPO Slant | 1.0s | 3.5s | **2.5s** |
| Spacing | 1.0s | 3.5s | **2.5s** |
| Braelyn Lateral | 1.5s | 4.0s | **2.5s** |
| Reverse Fake | 1.5s | 4.0s | **2.5s** |
| RPO Flood | 1.0s | 3.5s | **2.5s** |
| Quick Hitch | 1.0s | 3.0s | **2.0s** |
| Fade | 2.0s | 4.0s | **2.0s** |
| Flat-Wheel | 2.0s | 4.0s | **2.0s** |
| Double-Back Flat-Seam | 1.5s | 3.5s | **2.0s** |
| Screen Fake Post | 2.5s | 4.0s | **1.5s** |
| Mesh Wheel | 2.5s | 4.0s | **1.5s** |
| Jet Bubble | 0.5s | 2.0s | **1.5s** |
| Bubble Screen | 0.5s | 2.0s | **1.5s** |
| Stick | 1.0s | 2.5s | **1.5s** |
| Slant-Flat | 1.0s | 2.0s | **1.0s** |
| Slant & Go | 2.5s | 3.5s | **1.0s** |
| Hitch & Go | 3.0s | 4.0s | **1.0s** |
| Snag | 1.0s | 4.0s | **3.0s** |

**Root cause in `animator.js`:**  
```javascript
// animator.js ~line 316
if (phase === PHASES.ROUTES || phase === PHASES.SNAP) {
  const eyesTarget = playerPositions[play.qbLook.eyes]  // ← stays here too long
  // ...
}
if (phase === PHASES.DELIVERY || phase === PHASES.AFTER_CATCH) {  // ← starts too late
  const throwTarget = playerPositions[play.qbLook.throw]
  // ...
}
```

---

### BUG-02 ❌ DATA BUG: Play Action Boot — QB Throws From Beyond the LOS

**Play:** `play-action-boot`

**What's wrong:**  
QB's route is `[[20,-4],[15,-2],[8,2]]`. The final waypoint `[8,2]` places the QB **2 yards past the line of scrimmage** (Y=2 is downfield; Y=0 is LOS). At throw time (t=2.0s), QB's route progress = 1.0, so QB is at `[8,2]`. A forward pass thrown from beyond the LOS is illegal in football. Teaching kids this visual is wrong — QBs must be behind the LOS when throwing.

**What Keith saw:** QB throwing a "forward pass beyond the LOS" — this is exactly it.

**The RB is also past the LOS:** At throw time, RB (read=1, timing[1]=2.0, progress=1.0) is at `[3,4]` — also 4 yards past the LOS. So the throw goes from Y=2 to Y=4, both downfield.

**What the play should look like:** QB should throw from behind the LOS (Y ≤ -0.5). The boot route should end before crossing the line.

---

### BUG-03 ❌ DATA BUG: Slant-Flat — qbLook.throw Doesn't Match ballPath Target

**Play:** `slant-flat`

**What's wrong:**
- `qbLook.throw = 'RB'` — animator will draw QB "looking at RB" during delivery phase
- `ballPath` throws to `WR1` — ball actually goes to WR1 on the slant
- During DELIVERY phase, the eye line points to RB (who didn't catch the ball), while WR1 has the ball

**Effect on kids:** The ball goes to WR1, but the coaching eye line says QB was looking at the RB when she threw. This teaches the wrong read. The child learns: "after the slant fake, QB looks at the running back... but the ball goes to the slant?" That's confusing.

**Context:** The play description says "Read the flat defender: he drops on slant → throw flat to RB; he jumps flat → hit WR1 on slant." The default animation throws to WR1 (correct — slant is open), so `qbLook.throw` should be `'WR1'` to match.

---

### BUG-04 ❌ VISUAL BUG: Eye Line Points BACKWARD at Play Start (4 Plays)

The QB eye line draws to `playerPositions[qbLook.eyes]`. Some plays have the look-off target starting **behind** the QB (Y more negative than QB at Y=-3). This makes the yellow eye line point backward — over the QB's shoulder toward the backfield — which looks like the QB is staring at the ground behind them.

**Affected plays:**

**a) Snag** (`eyes: 'RB'`):  
RB position: `[17.5, -5.5]` — directly behind QB at `[17.5, -3]`. Eye line goes straight backward at kickoff of routes phase. RB route: `[[22,-2],[32,1]]` — RB eventually reaches the flat. But for the first ~0.5–1s of the play, the eye line stabs backward.

**b) RPO Slant** (`eyes: 'WR2'`):  
WR2 is playing RB position: `[17.5, -5.5]`. Eye line points straight backward at QB's backfield receiver. WR2 route: `[[19,-4],[26,-1]]` — moves right but stays behind LOS for the whole route.  
Combined with BUG-01, the eye line points backward at a player who never crosses the LOS.

**c) Flat-Wheel** (`eyes: 'RB'`):  
RB at `[22,-5]`. Eye line from QB at [17.5,-3] to RB at [22,-5] — points down and slightly right, behind the LOS. The intent is "look toward RB flat" but RB hasn't reached the flat yet.

**d) Screen Fake Post** (`eyes: 'RB'`):  
RB after motion: `[24,-4]`. At start of routes, eye line goes to [24,-4] — slightly behind LOS. Less severe than others but still looks wrong at animation start.

---

### BUG-05 ⚠️ CONCEPTUAL BUG: Braelyn Lateral — Eye Line From Wrong Player

**Play:** `braelyn-lateral`

**What's wrong:**  
The `qbLook` is always interpreted as QB's perspective. But in Braelyn Lateral, QB laterals to WR2 who becomes the PASSER. WR2 is supposed to look at WR1 slant (to freeze the safety) before throwing back to QB running a flat route.

**What the animation shows:**  
Eye line from QB (now a flat route runner, at `[20,-3]`→`[25,4]`) to WR1. This shows the player-who-is-now-a-receiver "looking at" WR1's slant, which makes no football sense.

**What it should show:**  
Eye line from WR2 (the new passer, standing at `[22,-5]`) to WR1. Then during delivery, from WR2 to QB.

---

### BUG-06 ⚠️ DATA BUG: RB Draw — Timing Entry Inconsistency

**Play:** `rb-draw`

**What's wrong:**
- `timing: { 1: 1.0 }` — timing entry for read 1 is 1.0s
- `ballPath handoff at time: 1.5` — ball arrives at 1.5s
- WR1 (the draw carrier) has `read: 0` — so WR1's route doesn't use `timing[1]` anyway

`timing[1] = 1.0` does nothing useful (no player has `read: 1`). The handoff at 1.5s is within the 2.0s `_routeDuration`, so the animation works, but the data is misleading. A player looking at the timing would expect someone to catch a ball at 1.0s.

---

### BUG-07 ⚠️ MINOR DATA BUG: Mesh — Throw Arrives After Mesh Crossing Point

**Play:** `mesh`

**What's wrong:**  
The description says "Hit WR1 at the mesh point for a quick, safe completion." The mesh crossing (where WR1 and WR2 routes intersect) happens when WR1 is roughly at field position `[14-16, 5]` — about 50% through WR1's route. But `timing[1] = 1.5` means WR1 finishes their entire route in 1.5s (progress = 1.0, WR1 at `[32,5]`). The throw arrives when WR1 is at the FAR RIGHT sideline, not at the mesh crossing in the middle of the field.

**Effect:** Kids see the throw going to a receiver who's already run 28 yards past the mesh point. It doesn't illustrate the "quick, safe at the crossing" concept.

---

### BUG-08 ⚠️ MINOR ROUTE BUG: Flood Right/Left — WR2 OUT Route Is Barely an Out

**Plays:** `flood-right`, `flood-left`

**Flood Right WR2:** route `[[32,8],[34,8]]` — starts at [32,0], runs straight to [32,8] (straight vertical), then moves 2 yards right to [34,8]. From x=32, 2 yards right barely reaches the sideline. Looks more like a comeback or a go than a proper OUT.

**Flood Left WR2:** route `[[3,8],[1,8]]` — similar issue, runs to [3,8] then 2 yards left to [1,8].

A proper out route should break sharply toward the sideline. The current data shows the receiver barely turning — it more resembles a "flag" or "curl." The label says OUT but the route looks vertical with a minimal break.

---

### BUG-09 ⚠️ MINOR ROUTE BUG: Hitch & Go — WR2 Hitch Has No Turn-Back Motion

**Play:** `hitch-and-go`

**What's wrong:**  
WR2 HITCH route is `[[11,5]]` — just one waypoint. WR2 runs straight from `[11,-1]` to `[11,5]` and stops. A realistic hitch shows the receiver stopping AND turning back toward the QB (Y decreases slightly at the end). Compare WR1's hitch-then-go: `[4,5],[4,4],[3.5,3.5],[4,4],[4,5]` which wiggles to sell the hitch. WR2 has no turn-back.

---

### BUG-10 ⚠️ MINOR ROUTE BUG: Stick Concept — WR2 FLAT Barely Moves Laterally

**Play:** `stick`

**What's wrong:**  
WR2 FLAT route is `[[31,3],[34,3]]`. From [31,0], WR2 goes to [31,3] (straight up 3 yards) then to [34,3] (3 yards right). A FLAT route should go primarily toward the sideline, not first vertically. The route looks more like a hitch-to-out than a flat.

---

## 4. Animator Code Fixes

### FIX-01: Fix Eye Line Phase Switching (Fixes BUG-01)

**File:** `js/canvas/animator.js`  
**Location:** Inside `_render()`, in the "QB Eyes visualization" block (~line 310–345)

**Current code:**
```javascript
// Before delivery: look at eyes target
if (phase === PHASES.ROUTES || phase === PHASES.SNAP) {
  const eyesTarget = playerPositions[play.qbLook.eyes]
  if (eyesTarget) {
    const eyesCanvas = fieldToCanvas(eyesTarget[0], eyesTarget[1], w, h)
    drawEyeLine(ctx, qbCanvas.x, qbCanvas.y, eyesCanvas.x, eyesCanvas.y, 1)
    // Eye emoji near QB
    ctx.save()
    ctx.font = '12px serif'
    ctx.textAlign = 'center'
    ctx.fillText('👀', qbCanvas.x + 18, qbCanvas.y - 12)
    ctx.restore()
  }
}

// During/after delivery: line to throw target
if (phase === PHASES.DELIVERY || phase === PHASES.AFTER_CATCH) {
  const throwTarget = playerPositions[play.qbLook.throw]
  if (throwTarget) {
    const throwCanvas = fieldToCanvas(throwTarget[0], throwTarget[1], w, h)
    ctx.save()
    ctx.strokeStyle = 'rgba(233,69,96,0.6)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(qbCanvas.x, qbCanvas.y)
    ctx.lineTo(throwCanvas.x, throwCanvas.y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }
}
```

**Replacement code:**
```javascript
// Determine the absolute time when the QB/passer releases the ball
// (find the last non-snap event — throw, handoff, or lateral)
const ballEvents = (play.ballPath || []).filter(e => e.type !== 'snap')
const releaseEvent = ballEvents.length > 0 ? ballEvents[ballEvents.length - 1] : null
const releaseAbsTime = releaseEvent ? this._snapEnd + releaseEvent.time : this._deliveryEnd

const hasThrown = t >= releaseAbsTime
const isPostSnap = phase !== PHASES.PRE_SNAP && phase !== PHASES.DONE

if (isPostSnap && !hasThrown) {
  // Before release: yellow dashed eye line to look-off target
  const eyesTarget = playerPositions[play.qbLook.eyes]
  if (eyesTarget) {
    const eyesCanvas = fieldToCanvas(eyesTarget[0], eyesTarget[1], w, h)
    drawEyeLine(ctx, qbCanvas.x, qbCanvas.y, eyesCanvas.x, eyesCanvas.y, 1)
    ctx.save()
    ctx.font = '12px serif'
    ctx.textAlign = 'center'
    ctx.fillText('👀', qbCanvas.x + 18, qbCanvas.y - 12)
    ctx.restore()
  }
}

if (isPostSnap && hasThrown) {
  // After release: red dashed line to throw target
  const throwTarget = playerPositions[play.qbLook.throw]
  if (throwTarget) {
    const throwCanvas = fieldToCanvas(throwTarget[0], throwTarget[1], w, h)
    ctx.save()
    ctx.strokeStyle = 'rgba(233,69,96,0.6)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(qbCanvas.x, qbCanvas.y)
    ctx.lineTo(throwCanvas.x, throwCanvas.y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }
}
```

**Why this works:** The eye line now switches exactly when the ball leaves the QB's hand (or when the last ball event starts), not when an unrelated DELIVERY phase begins. For the Mesh play, this means the eye line switches at 1.5s (when WR1 catches the ball) instead of 4.0s. For Flood Right, it switches at 1.0s instead of 4.5s.

---

### FIX-01b: Handle Eye Line for Braelyn Lateral (Fixes BUG-05)

For the Braelyn Lateral specifically, the `qbLook` should be set to `null` in play-library.js (see Play Data Fixes below). But if you want the animator to handle the "passer is not QB" case, you'd need a more structural change:

```javascript
// In the QB Eyes visualization block, use a "passerPos" instead of always QB
const passerPos = play.qbLook.passer
  ? playerPositions[play.qbLook.passer]
  : playerPositions.QB
```

This requires adding an optional `qbLook.passer` field to plays where a non-QB throws.

---

## 5. Play Data Fixes

### FIX-02: Play Action Boot — Fix QB Route (Fixes BUG-02)

**File:** `js/play-library.js`, play `play-action-boot`

**Current:**
```javascript
QB: { pos: [17.5,-3], route: [[20,-4],[15,-2],[8,2]], label: 'BOOT LEFT', read: 0, dashed: true },
```

**Fixed:**
```javascript
QB: { pos: [17.5,-3], route: [[20,-4],[15,-2],[8,-1]], label: 'BOOT LEFT', read: 0, dashed: true },
```

**Change:** Last waypoint from `[8,2]` → `[8,-1]`. This keeps the QB just behind the LOS (Y=-1) when throwing, which is legally correct and visually appropriate for a bootleg. The QB has rolled out to the left hash at Y=-1, throws to RB running the flat.

**Optional — also fix RB endpoint:** The RB ends up at `[3,4]` at throw time (4 yards past LOS). The throw from QB at [8,-1] to RB at some mid-route position is more realistic. To have the RB catch the ball near the LOS, you could also reduce the timing or adjust the RB route. But this is secondary — the QB fix is the critical one.

---

### FIX-03: Slant-Flat — Fix qbLook.throw (Fixes BUG-03)

**File:** `js/play-library.js`, play `slant-flat`

**Current:**
```javascript
qbLook: {
  eyes: 'WR1',
  throw: 'RB',
  tip: 'Eyes on WR1 slant to hold the flat defender, then dump to RB in the flat if he bites',
},
// ...
ballPath: [
  { from:'C', to:'QB', time:0, type:'snap' },
  { from:'QB', to:'WR1', time:1.0, type:'throw' },
],
```

**Option A — Fix qbLook.throw to match ballPath (throw to slant):**
```javascript
qbLook: {
  eyes: 'RB',           // ← changed: look at the flat to hold flat defender
  throw: 'WR1',         // ← changed: then throw the slant
  tip: 'Eyes on RB flat to hold the flat defender, then fire WR1 on the slant if he bites',
},
```
Note: also swap eyes to 'RB' — the tip says look at the flat defender's coverage, so looking toward where the flat threat (RB) is going makes more sense as the "freeze" mechanism.

**Option B — Change ballPath to throw to RB (throw to flat):**
```javascript
qbLook: {
  eyes: 'WR1',
  throw: 'RB',
  tip: 'Eyes on WR1 slant to hold the flat defender, then dump to RB in the flat if he bites',
},
// ...
ballPath: [
  { from:'C', to:'QB', time:0, type:'snap' },
  { from:'QB', to:'RB', time:1.5, type:'throw' },  // ← throw to RB instead
],
```

**Recommendation:** Option A is better because the Slant-Flat concept is most commonly taught as throwing the slant (WR1) when the flat defender bites. The "eyes on flat" to freeze the defender is the look-off, then the QB fires the slant. This matches "he jumps flat → hit WR1 on slant."

---

### FIX-04: Snag — Delay Eye Line or Adjust RB Start (Fixes BUG-04a)

**File:** `js/play-library.js`, play `snag`

**Option A — Change RB starting position so it's closer to LOS:**
```javascript
// Current:
RB: { pos: [17.5,-5.5], route: [[22,-2],[32,1]], label: 'FLAT', read: 2, dashed: false },

// Fixed: Offset RB pre-snap to a closer position (still looks like a backfield RB)
RB: { pos: [22,-3], route: [[26,0],[32,2]], label: 'FLAT', read: 2, dashed: false },
```
This puts RB closer to the LOS so the eye line points slightly forward or horizontal rather than backward.

**Option B (Animator fix):** In the eye line code, only draw the eye line if the eyesTarget is at Y ≥ QB's Y (i.e., at or downfield from QB):
```javascript
// Only draw eye line if target is not behind QB
const eyesTarget = playerPositions[play.qbLook.eyes]
if (eyesTarget && eyesTarget[1] >= qbPos[1]) {  // don't look backward
  // ... draw eye line
}
```
This is cleaner and fixes all "backward eye line" cases without touching play data.

---

### FIX-05: RPO Slant — Fix WR2 (eye target) Position (Fixes BUG-04b)

**File:** `js/play-library.js`, play `rpo-slant`

The `qbLook.eyes = 'WR2'` but WR2 is in the backfield at [17.5,-5.5] and never crosses the LOS (route ends at [26,-1]). For an RPO, the QB is supposed to read the linebacker, with eyes on the WR side. The eye line backward to WR2 in the backfield makes no sense.

**Option A — Change qbLook.eyes to WR1 (the actual slant):**
```javascript
qbLook: {
  eyes: 'WR1',   // ← QB reads the WR1 slant coverage
  throw: 'WR1',
  tip: 'Read the linebacker: if he crashes on WR2 run, hand off; if he drops into coverage, throw WR1 slant',
},
```

**Option B — Move WR2 to LOS:**
```javascript
WR2: { pos: [19,0], route: [[22,0],[28,-0.5]], label: 'RUN?', read: 0, dashed: true },
```
This makes WR2's fake run start from near the LOS, so the eye line points forward.

**Recommendation:** Option A — for an RPO, the QB's eyes should key on the slant coverage, not on the run-fake carrier. This better teaches the RPO concept.

---

### FIX-06: Flat-Wheel — Adjust RB Start Position (Fixes BUG-04c)

**File:** `js/play-library.js`, play `flat-wheel`

```javascript
// Current:
RB: { pos: [22,-5], route: [[22,-2],[32,2]], label: 'FLAT (decoy)', read: 3, dashed: false },

// Fixed: Move RB starting position closer to LOS
RB: { pos: [24,-2], route: [[28,0],[33,2]], label: 'FLAT (decoy)', read: 3, dashed: false },
```
This keeps the "RB leaks to the flat" concept but starts from a position where the eye line points forward rather than backward.

---

### FIX-07: Braelyn Lateral — Fix qbLook (Fixes BUG-05)

**File:** `js/play-library.js`, play `braelyn-lateral`

The play is a trick where WR2 becomes the passer. The `qbLook` system is QB-centric and can't cleanly represent WR2's perspective.

**Option A — Set qbLook to null (simplest):**
```javascript
qbLook: null,
```
No eye line is drawn for this play. Kids learn from the description text instead.

**Option B — Add a passer field (requires animator change):**
```javascript
qbLook: {
  passer: 'WR2',         // ← who is looking
  eyes: 'WR1',           // WR2 looks at WR1 slant to freeze safety
  throw: 'QB',           // then throws to QB running flat
  tip: 'WR2 looks at WR1 slant to freeze safety, then fires to QB running the flat',
},
```
This requires the animator to use `qbLook.passer` as the source of the eye line instead of always QB. See FIX-01b above.

---

### FIX-08: RB Draw — Fix timing Entry (Fixes BUG-06)

**File:** `js/play-library.js`, play `rb-draw`

```javascript
// Current:
timing: { 1: 1.0 },

// Fixed (remove unused entry, or use 0 to indicate minimum):
timing: {},
```
Or simply remove the timing entry since WR1 (the draw carrier) has `read: 0` and doesn't use timing entries.

---

### FIX-09: Mesh — Adjust Throw Timing to Hit Mesh Point (Fixes BUG-07)

**File:** `js/play-library.js`, play `mesh`

For WR1 to receive the ball at the mesh crossing point (~[14-16, 5]), the throw should happen when WR1 is at ~50% progress through their route. WR1's route spans 33 field yards, and WR1 takes 1.5s to complete it. At 50% progress, ~0.75s into routes.

```javascript
// Current:
timing: { 1:1.5, 2:2.0, 3:3.0, 4:4.0 },
ballPath: [
  { from:'C', to:'QB', time:0, type:'snap' },
  { from:'QB', to:'WR1', time:1.5, type:'throw' },
],

// Fixed: Throw at 0.75s so WR1 catches at the mesh crossing point
timing: { 1:0.75, 2:2.0, 3:3.0, 4:4.0 },
ballPath: [
  { from:'C', to:'QB', time:0, type:'snap' },
  { from:'QB', to:'WR1', time:0.75, type:'throw' },
],
```

Note: This also reduces the eye-line gap from 2.5s to 1.25s (see BUG-01 fix for complete solution).

---

### FIX-10: Flood Right/Left — Fix WR2 OUT Route (Fixes BUG-08)

**Flood Right:**
```javascript
// Current:
WR2: { pos: [32,0], route: [[32,8],[34,8]], label: 'OUT', read: 2, dashed: false },

// Fixed: sharper out-breaking route
WR2: { pos: [32,0], route: [[32,5],[35,5]], label: 'OUT', read: 2, dashed: false },
```

**Flood Left:**
```javascript
// Current:
WR2: { pos: [3,0], route: [[3,8],[1,8]], label: 'OUT', read: 2, dashed: false },

// Fixed:
WR2: { pos: [3,0], route: [[3,5],[0,5]], label: 'OUT', read: 2, dashed: false },
```

Both changes: break at 5 yards depth (not 8) and make the break sharper. OUT routes typically break at 5 yards.

---

### FIX-11: Hitch & Go — Add Turn-Back to WR2 Hitch (Fixes BUG-09)

**File:** `js/play-library.js`, play `hitch-and-go`

```javascript
// Current:
WR2: { pos: [11,-1], route: [[11,5]], label: 'HITCH', read: 2, dashed: false, motion: {...} },

// Fixed: add turn-back waypoint to show receiver coming back to QB
WR2: { pos: [11,-1], route: [[11,5],[11,4]], label: 'HITCH', read: 2, dashed: false, motion: {...} },
```

---

### FIX-12: Stick — Fix WR2 FLAT Route (Fixes BUG-10)

**File:** `js/play-library.js`, play `stick`

```javascript
// Current:
WR2: { pos: [31,0], route: [[31,3],[34,3]], label: 'FLAT', read: 2, dashed: false },

// Fixed: break immediately to the flat (minimal vertical, strong lateral)
WR2: { pos: [31,0], route: [[31,2],[35,2]], label: 'FLAT', read: 2, dashed: false },
```

---

## 6. Summary of Priority Fixes

| Priority | Bug | Type | File | Impact |
|----------|-----|------|------|--------|
| 🔴 P1 | BUG-01: Eye line stays on look-off target after throw | **Animator Logic** | `animator.js` | Affects 31/37 plays — core teaching broken |
| 🔴 P1 | BUG-02: Play Action Boot QB past LOS | **Play Data** | `play-library.js` | Teaches illegal play, Keith's specific report |
| 🟠 P2 | BUG-03: Slant-Flat qbLook.throw mismatch | **Play Data** | `play-library.js` | Wrong coaching cue during delivery |
| 🟠 P2 | BUG-04: Eye line points backward (4 plays) | **Play Data** or Animator | Both | Visually wrong, confuses kids |
| 🟡 P3 | BUG-05: Braelyn Lateral eye from wrong player | **Play Data** | `play-library.js` | Misleading in trick play |
| 🟡 P3 | BUG-07: Mesh throw arrives past mesh point | **Play Data** | `play-library.js` | Description doesn't match animation |
| 🟢 P4 | BUG-06: RB Draw timing entry unused | **Play Data** | `play-library.js` | Data cleanup only |
| 🟢 P4 | BUG-08/09/10: Minor route shape issues | **Play Data** | `play-library.js` | Cosmetic route accuracy |

---

## 7. Verification Notes

### Plays Confirmed Correct
- **Screen** (play #11): No eye-line gap, ball timing matches, RB screen route is accurate. ✅
- **Play Action Boot** (play #28): No eye-line gap ✅, but QB past LOS ❌
- **Slant-Wheel** (play #37): No eye-line gap, all routes correct. ✅
- **All run plays** (Reverse, Jet Sweep, RB Draw, End Around, Triple Option, Fake Jet Draw, Counter Sweep, Counter Left, I-Bone, Power Right): All use `handoff` type correctly, none have `isRunPlay: true` with a `throw` type. ✅
- **All pre-snap motions**: All motion `from/to` paths are directionally logical and players end up at their `pos` correctly. ✅
- **Defense positions**: Reasonable for all plays — 3 near-LOS defenders and 2 safeties for most plays. ✅

### How the Root Cause Manifests
The `_routeDuration` is inflated by late timing entries (like C's check-down at 4.0s, or RB's flat at 3.5s). This is correct for showing those routes animating until completion. But it accidentally delays the DELIVERY phase, causing the eye line to stay in "look-off mode" long after the ball is gone. The fix (FIX-01) decouples eye line switching from phase switching — eye line reacts to the actual ball release time.
