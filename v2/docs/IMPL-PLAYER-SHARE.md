# Implementation Guide: Player Share View

## Files to Create/Modify

| Action | Path |
|--------|------|
| **Replace** | `js/views/player-share.js` |
| **Append** | `css/app.css` |

No changes to `js/app.js` — route `/share` already exists and imports `playerShareView`.
No changes to `js/store.js` — all needed methods already exist.

## How It Works

Coach navigates to `#/share` (from playbook editor or manually). The share view shows a **link generator**: pick a playbook, pick a player, get a URL. The URL looks like:

```
#/share?playbook=pb_1710700000000&player=Greyson
```

When opened with both query params, the view enters **player mode**: read-only, phone-optimized, showing only that player's routes with code names.

## Implementation: `js/views/player-share.js`

### Imports

```js
import { el, clear, showToast } from '../utils/dom.js'
import { getPlay, PLAY_LIBRARY } from '../play-library.js'
import { PlayAnimator } from '../canvas/animator.js'
import { renderPlay } from '../canvas/renderer.js'
```

### Export

```js
export function playerShareView(params, outlet) {
  // params.query.playbook — playbook id (optional)
  // params.query.player — player name (optional)
  // Must return cleanup function
}
```

### View Routing Logic

```js
const store = window.__store
const playbookId = params.query?.playbook || null
const playerName = params.query?.player || null

clear(outlet)

if (playbookId && playerName) {
  return renderPlayerView(playbookId, playerName, outlet)
} else {
  return renderShareGenerator(outlet)
}
```

### Mode 1: Share Link Generator (Coach View)

Shown when URL has no/incomplete query params. This is the coach's tool to generate share links.

#### DOM Structure

```
div.share-generator
  h1  "🔗 Share Playbook"
  p   "Generate a link for a player to see their routes."
  div.share-form
    label  "Playbook"
    select.input#share-playbook-select
      option  "-- Select Playbook --"
      option[value=pb.id]  pb.name   (for each playbook)
    label  "Player"
    select.input#share-player-select
      option  "-- Select Player --"
      option[value=player.name]  "player.name (player.position)"   (for each roster member)
  div.share-link-output.hidden
    label  "Share this link:"
    input.input.share-link-input[readonly]
    button.btn.btn-primary  "📋 Copy"
```

#### Logic

```js
function renderShareGenerator(outlet) {
  const playbooks = store.getPlaybooks()
  const roster = store.get().roster

  let selectedPb = null
  let selectedPlayer = null

  // ... build DOM as above ...

  const linkOutput = el('div', { className: 'share-link-output hidden' })
  const linkInput = el('input', { className: 'input share-link-input', type: 'text', readonly: 'readonly' })

  function updateLink() {
    if (!selectedPb || !selectedPlayer) {
      linkOutput.classList.add('hidden')
      return
    }
    const url = `${window.location.origin}${window.location.pathname}#/share?playbook=${encodeURIComponent(selectedPb)}&player=${encodeURIComponent(selectedPlayer)}`
    linkInput.value = url
    linkOutput.classList.remove('hidden')
  }

  // Copy button
  const copyBtn = el('button', {
    className: 'btn btn-primary',
    textContent: '📋 Copy Link',
    onclick: () => {
      navigator.clipboard.writeText(linkInput.value).then(() => showToast('Link copied!'))
    }
  })

  // playbook select onChange: selectedPb = value, updateLink()
  // player select onChange: selectedPlayer = value, updateLink()

  // ... assemble and append to outlet ...

  // No cleanup needed for generator
  return () => {}
}
```

### Mode 2: Player View (Read-Only)

#### Data Loading

```js
function renderPlayerView(playbookId, playerName, outlet) {
  const playbooks = store.getPlaybooks()
  const pb = playbooks.find(p => p.id === playbookId)

  if (!pb) {
    outlet.appendChild(el('div', { className: 'share-error card' }, [
      el('h2', { textContent: '❌ Playbook not found' }),
      el('p', { textContent: 'This playbook may have been deleted.', style: { color: '#888' } }),
    ]))
    return () => {}
  }

  // Find the player's position from roster
  const roster = store.get().roster
  const rosterPlayer = roster.find(p => p.name.toLowerCase() === playerName.toLowerCase())
  const playerPosition = rosterPlayer ? rosterPlayer.position : null

  if (!playerPosition) {
    outlet.appendChild(el('div', { className: 'share-error card' }, [
      el('h2', { textContent: `❌ Player "${playerName}" not found` }),
      el('p', { textContent: 'Check the roster and try again.', style: { color: '#888' } }),
    ]))
    return () => {}
  }

  // Resolve plays — filter out any with missing play data
  const plays = pb.plays
    .sort((a, b) => a.order - b.order)
    .map(entry => ({
      ...entry,
      playData: getPlay(entry.playId),
    }))
    .filter(entry => entry.playData != null)

  if (plays.length === 0) {
    outlet.appendChild(el('div', { className: 'share-error card' }, [
      el('h2', { textContent: '📋 No plays in this playbook' }),
    ]))
    return () => {}
  }

  // ... render player view ...
}
```

#### Player View DOM Structure

```
div.player-view
  div.player-view-header
    h1  "🏈 {playerName}'s Playbook"
    p.player-view-subtitle  "{pb.name} · {playerPosition}"
  div.player-view-counter
    span  "1 / 5"
  div.player-view-canvas-wrap
    canvas
  div.player-view-play-info
    h2.player-view-codename  codeName || playData.name
    p.player-view-realname   playData.name  (small, dimmed — only if codeName exists)
  div.player-view-controls
    button.btn.player-nav-btn  "◀ Prev"
    button.btn.btn-primary.player-play-btn  "▶ Play"
    button.btn.player-nav-btn  "Next ▶"
```

#### Navigation State & Animator

```js
let currentIndex = 0
let animator = null
const rosterMap = store.getRosterMap()

function showPlay(index) {
  if (index < 0 || index >= plays.length) return
  currentIndex = index
  const entry = plays[currentIndex]
  const play = entry.playData

  // Update counter
  counterEl.textContent = `${currentIndex + 1} / ${plays.length}`

  // Update play info
  codenameEl.textContent = entry.codeName || play.name
  if (entry.codeName) {
    realnameEl.textContent = play.name
    realnameEl.classList.remove('hidden')
  } else {
    realnameEl.classList.add('hidden')
  }

  // Destroy previous animator
  if (animator) { animator.destroy(); animator = null }

  // Size canvas
  const dpr = window.devicePixelRatio || 1
  const cssW = canvasWrap.offsetWidth || 360
  const cssH = Math.round(cssW * (2 / 3))
  canvas.width = Math.round(cssW * dpr)
  canvas.height = Math.round(cssH * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Create animator with player's position highlighted
  animator = new PlayAnimator(canvas, play, {
    rosterMap,
    showDefense: false,
    showBall: true,
    showReadNumbers: false,
    showAllRoutes: true,
    highlightPosition: playerPosition,
    speed: 'full',
  })

  animator.onStateChange(state => {
    playBtn.textContent = state.isPlaying ? '⏸ Pause' : '▶ Play'
  })

  // Update prev/next button states
  prevBtn.disabled = currentIndex === 0
  nextBtn.disabled = currentIndex === plays.length - 1
}
```

#### Touch Swipe Navigation

```js
let touchStartX = 0
let touchStartY = 0

canvasWrap.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}, { passive: true })

canvasWrap.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  // Only trigger if horizontal swipe > 50px and more horizontal than vertical
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) showPlay(currentIndex + 1)  // swipe left = next
    else showPlay(currentIndex - 1)          // swipe right = prev
  }
}, { passive: true })
```

#### Play/Pause Button

```js
playBtn.onclick = () => {
  if (!animator) return
  animator.getState().isPlaying ? animator.pause() : animator.play()
}
```

#### Canvas Tap (Toggle Play/Pause)

```js
canvas.addEventListener('click', () => {
  if (!animator) return
  animator.getState().isPlaying ? animator.pause() : animator.play()
})
```

#### Resize Handler

```js
function onResize() {
  requestAnimationFrame(() => showPlay(currentIndex))
}
window.addEventListener('resize', onResize)
```

#### Initial Render

```js
// Assemble DOM, append to outlet
// ...
showPlay(0)
```

#### Cleanup

```js
return () => {
  window.removeEventListener('resize', onResize)
  if (animator) animator.destroy()
}
```

### Hide Navigation Bar

The player share view should hide the main nav for a cleaner phone experience. Do this at the top of `renderPlayerView`:

```js
const nav = document.getElementById('app-nav')
if (nav) nav.style.display = 'none'
```

And restore in cleanup:

```js
return () => {
  window.removeEventListener('resize', onResize)
  if (animator) animator.destroy()
  const nav = document.getElementById('app-nav')
  if (nav) nav.style.display = ''
}
```

## CSS to Append to `css/app.css`

```css
/* ═══════════════════════════════════════════════════════════════════════════
   Player Share View — Phase 6
   ═══════════════════════════════════════════════════════════════════════════ */

/* Share Generator (Coach) */
.share-generator {
  max-width: 500px;
  margin: 0 auto;
}
.share-generator h1 { font-size: 22px; margin-bottom: 8px; }
.share-generator > p { color: #888; margin-bottom: 20px; }

.share-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.share-form label {
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  margin-bottom: -6px;
}

.share-link-output {
  background: #16213e;
  border-radius: 8px;
  padding: 16px;
}
.share-link-output label {
  display: block;
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}
.share-link-input {
  margin-bottom: 10px;
  font-size: 13px;
  color: #e94560;
  background: #0d1b36;
}

/* Player View (Read-Only) */
.player-view {
  max-width: 480px;
  margin: 0 auto;
  padding: 0;
  -webkit-user-select: none;
  user-select: none;
}

.player-view-header {
  text-align: center;
  padding: 16px 16px 8px;
}
.player-view-header h1 {
  font-size: 22px;
  margin-bottom: 4px;
}
.player-view-subtitle {
  font-size: 13px;
  color: #888;
}

.player-view-counter {
  text-align: center;
  font-size: 14px;
  color: #888;
  padding: 8px 0;
}

.player-view-canvas-wrap {
  width: 100%;
  aspect-ratio: 3 / 2;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #2d5a27;
  touch-action: pan-y;
}
.player-view-canvas-wrap canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.player-view-play-info {
  text-align: center;
  padding: 12px 16px;
}
.player-view-codename {
  font-size: 24px;
  font-weight: 700;
  color: #e94560;
}
.player-view-realname {
  font-size: 13px;
  color: #555;
  margin-top: 2px;
}

.player-view-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 24px;
}

.player-nav-btn {
  background: #0f3460;
  color: #fff;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  min-height: 48px;
  min-width: 48px;
  transition: background 0.15s;
}
.player-nav-btn:hover { background: #1a4a8a; }
.player-nav-btn:disabled { opacity: 0.3; pointer-events: none; }

.player-play-btn {
  min-width: 100px;
  min-height: 48px;
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 8px;
}

.share-error {
  text-align: center;
  padding: 48px 24px;
}
.share-error h2 { margin-bottom: 8px; }
```

## Edge Cases

1. **Player name case-insensitive**: Match `playerName.toLowerCase()` against `roster.name.toLowerCase()`.
2. **Playbook not found**: Show error card, no crash.
3. **Player not on roster**: Show error card explaining player not found.
4. **Empty playbook (0 plays)**: Show message, no crash.
5. **Play in playbook but deleted from library**: Skip it (filtered out in data loading).
6. **No localStorage data on player's phone**: This is the main limitation. Data must be in localStorage. The share link only works on the same device or if the player opens it on the coach's device. Document this — future enhancement could use URL-encoded JSON blob or a share API.
7. **Swipe vs scroll conflict**: Only trigger swipe when `|dx| > |dy|` and `|dx| > 50px`.
8. **Canvas not laid out yet**: Use `requestAnimationFrame` and retry pattern (same as play-viewer).
9. **Navigator.clipboard not available**: Wrap in try/catch, fall back to `select()` + `document.execCommand('copy')`.

## Integration Points

- `PlayAnimator` from `js/canvas/animator.js` — constructor takes `(canvas, play, options)`, use `highlightPosition` option
- `getPlay(id)` from `js/play-library.js` — resolve playId to full play data
- `store.getPlaybooks()` — get all playbooks
- `store.getRosterMap()` — get position→name mapping
- `store.get().roster` — get full roster for player lookup

## Done Criteria

- [ ] `#/share` (no params) shows link generator with playbook + player dropdowns
- [ ] Selecting both generates a valid share URL
- [ ] Copy button copies URL to clipboard
- [ ] `#/share?playbook=X&player=Y` shows player view
- [ ] Player view hides nav bar
- [ ] Shows code name as primary title, real name as subtitle
- [ ] Canvas shows animated play with player's position highlighted
- [ ] Play/Pause button and canvas tap work
- [ ] Prev/Next buttons navigate between plays
- [ ] Swipe gestures work on touch devices
- [ ] Counter shows "1 / N" correctly
- [ ] Error states render cleanly (missing playbook, missing player, empty playbook)
- [ ] Nav bar restores when navigating away
- [ ] Cleanup destroys animator and removes event listeners
