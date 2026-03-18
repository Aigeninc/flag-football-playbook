# Implementation Guide: Playbook Builder

## Files to Create/Modify

| Action | Path |
|--------|------|
| **Replace** | `js/views/playbook.js` |
| **Append** | `css/app.css` |

No changes to `js/app.js` (route `/playbooks` already exists and imports `playbookView`).
No changes to `js/store.js` (already has `playbooks`, `activePlaybookId`, `getPlaybooks()`, `getActivePlaybook()`, `set({ playbooks })`, `set({ activePlaybookId })`).

## Store Schema

Already defined in store. Playbooks array items must conform to:

```js
{
  id: 'pb_' + Date.now(),       // unique string
  name: 'Game Day vs Eagles',   // user-editable string
  plays: [
    { playId: 'mesh', codeName: 'Lightning', order: 0 },
    { playId: 'flood-right', codeName: 'Dragon', order: 1 },
  ],
  createdAt: Date.now()          // epoch ms
}
```

## Implementation: `js/views/playbook.js`

### Imports

```js
import { el, clear, showToast } from '../utils/dom.js'
import { PLAY_LIBRARY, filterPlays, getFormations, getTags, getFamilies } from '../play-library.js'
import { renderPlay } from '../canvas/renderer.js'
```

### Export

```js
export function playbookView(params, outlet) {
  // ... body below
  // Must return cleanup function: () => unsubscribe()
}
```

### Internal State

```js
const store = window.__store
let selectedPlaybookId = null  // which playbook is being edited (null = list view)
let addingPlay = false         // show the play-picker panel
let searchFilters = { search: '', formation: '', tag: '', family: '' }
```

### View Modes

The view has **two modes** controlled by `selectedPlaybookId`:

1. **List mode** (`selectedPlaybookId === null`): shows all playbooks as cards + "Create" button
2. **Edit mode** (`selectedPlaybookId !== null`): shows the selected playbook's plays with full editing

### Mode 1: Playbook List

#### DOM Structure

```
div.playbook-view
  div.playbook-list-header
    h1  "📋 Playbooks"
    button.btn.btn-primary.btn-sm  "+ New Playbook"
  div.playbook-grid                    (CSS grid, same as play-grid)
    div.playbook-card                  (one per playbook)
      div.playbook-card-header
        h3  playbook.name
        span.playbook-card-count  "5 plays"
      div.playbook-card-actions
        button.btn.btn-primary.btn-sm  "Edit"
        button.btn.btn-ghost.btn-sm    (if active) "★ Active" / (else) "Set Active"
        button.btn.btn-danger.btn-sm   "Delete"
    div.playbook-empty                 (if no playbooks)
      p  "No playbooks yet. Create one to organize your plays."
```

#### "New Playbook" Button Handler

```js
function createPlaybook() {
  const name = prompt('Playbook name:')
  if (!name || !name.trim()) return
  const playbooks = store.getPlaybooks()
  const pb = {
    id: 'pb_' + Date.now(),
    name: name.trim(),
    plays: [],
    createdAt: Date.now()
  }
  playbooks.push(pb)
  store.set({ playbooks })
  // Auto-set as active if it's the first
  if (playbooks.length === 1) {
    store.set({ activePlaybookId: pb.id })
  }
  selectedPlaybookId = pb.id
  render()
  showToast(`"${pb.name}" created`)
}
```

#### Playbook Card Click Handlers

- **Edit**: set `selectedPlaybookId = pb.id`, call `render()`
- **Set Active**: `store.set({ activePlaybookId: pb.id })`, `showToast('...')`
- **Delete**: `confirm()` → filter out from playbooks array, `store.set({ playbooks })`. If deleted was active, set `activePlaybookId` to `null`. Call `render()`.

### Mode 2: Playbook Editor

#### DOM Structure

```
div.playbook-view
  div.playbook-editor-header
    button.btn.btn-ghost.btn-sm  "← Back"          (sets selectedPlaybookId=null, render())
    input.input.playbook-name-input                 (value=pb.name, blur/Enter saves)
    span.playbook-active-badge                      ("★ Active" or button "Set Active")
  div.playbook-plays-list                           (sortable list of plays)
    div.playbook-play-item[data-order="0"]          (one per play in playbook)
      div.playbook-play-thumb                       (canvas 120x90 for static render)
        canvas
      div.playbook-play-info
        input.input.input-sm.codename-input         (value=codeName, placeholder="Code name...")
        div.playbook-play-real-name                 (small, dimmed: real play name)
      div.playbook-play-actions
        button.btn.btn-ghost.btn-sm  "▲"            (move up)
        button.btn.btn-ghost.btn-sm  "▼"            (move down)
        button.btn.btn-ghost.btn-sm  "👁"           (navigate to #/play/${playId})
        button.btn.btn-danger.btn-sm  "✕"           (remove)
    div.playbook-empty-plays                        (if no plays)
      p  "No plays added yet. Use the button below to add plays."
  button.btn.btn-primary  "+ Add Plays"             (toggles addingPlay, render())
  div.playbook-play-picker                          (shown when addingPlay=true)
    div.filter-bar                                  (reuse same filter pattern as play-library)
      input.input.filter-search
      select.input.filter-select  (Formation)
      select.input.filter-select  (Tag)
      select.input.filter-select  (Family)
    div.play-picker-grid                            (smaller cards, 160px min)
      div.play-picker-card                          (one per play in PLAY_LIBRARY)
        canvas
        div.play-picker-card-info
          span  play.name
          button.btn.btn-primary.btn-sm  "+ Add"    (or "✓ Added" if already in playbook)
```

#### Playbook Name Editing

```js
const nameInput = el('input', {
  className: 'input playbook-name-input',
  type: 'text',
  value: pb.name,
})
nameInput.addEventListener('blur', () => saveName(nameInput.value))
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { nameInput.blur() }
})

function saveName(newName) {
  if (!newName.trim()) return
  const playbooks = store.getPlaybooks()
  const idx = playbooks.findIndex(p => p.id === pb.id)
  if (idx === -1) return
  playbooks[idx].name = newName.trim()
  store.set({ playbooks })
}
```

#### Code Name Editing

Each play item has an inline input. On `blur` or `Enter`, save:

```js
function saveCodeName(playId, newCodeName) {
  const playbooks = store.getPlaybooks()
  const pb = playbooks.find(p => p.id === selectedPlaybookId)
  if (!pb) return
  const entry = pb.plays.find(e => e.playId === playId)
  if (!entry) return
  entry.codeName = newCodeName.trim()
  store.set({ playbooks })
}
```

#### Reorder (Up/Down Buttons)

```js
function movePlay(playId, direction) {
  // direction: -1 (up) or +1 (down)
  const playbooks = store.getPlaybooks()
  const pb = playbooks.find(p => p.id === selectedPlaybookId)
  if (!pb) return
  // Sort by order first
  pb.plays.sort((a, b) => a.order - b.order)
  const idx = pb.plays.findIndex(e => e.playId === playId)
  const swapIdx = idx + direction
  if (swapIdx < 0 || swapIdx >= pb.plays.length) return
  // Swap order values
  const tmpOrder = pb.plays[idx].order
  pb.plays[idx].order = pb.plays[swapIdx].order
  pb.plays[swapIdx].order = tmpOrder
  store.set({ playbooks })
  render()
}
```

#### Add Play from Picker

```js
function addPlayToPlaybook(playId) {
  const playbooks = store.getPlaybooks()
  const pb = playbooks.find(p => p.id === selectedPlaybookId)
  if (!pb) return
  // Don't add duplicates
  if (pb.plays.some(e => e.playId === playId)) {
    showToast('Already in playbook')
    return
  }
  const maxOrder = pb.plays.length > 0 ? Math.max(...pb.plays.map(e => e.order)) + 1 : 0
  pb.plays.push({ playId, codeName: '', order: maxOrder })
  store.set({ playbooks })
  render()
  showToast('Play added')
}
```

#### Remove Play

```js
function removePlay(playId) {
  const playbooks = store.getPlaybooks()
  const pb = playbooks.find(p => p.id === selectedPlaybookId)
  if (!pb) return
  pb.plays = pb.plays.filter(e => e.playId !== playId)
  // Re-normalize order
  pb.plays.sort((a, b) => a.order - b.order)
  pb.plays.forEach((e, i) => e.order = i)
  store.set({ playbooks })
  render()
}
```

#### Play Picker Filter Bar

Reuse the exact same pattern from `play-library.js` view — build `searchInput`, `formationSelect`, `tagSelect`, `familySelect` using the same `buildSelect` helper (copy the local helper from play-library view). Call `filterPlays(searchFilters)` to get results. Render as smaller cards.

#### Canvas Thumbnails

After DOM insertion, in `requestAnimationFrame`:

```js
requestAnimationFrame(() => {
  // For each play item in the editor
  for (const entry of pb.plays) {
    const play = PLAY_LIBRARY.find(p => p.id === entry.playId)
    if (!play) continue
    const canvas = outlet.querySelector(`.playbook-play-item[data-play-id="${entry.playId}"] canvas`)
    if (!canvas) continue
    canvas.width = canvas.offsetWidth || 120
    canvas.height = canvas.offsetHeight || 90
    renderPlay(canvas, play, { rosterMap, showDefense: true, showReadNumbers: false, mini: true })
  }
  // For play picker cards
  for (const play of pickerPlays) {
    const canvas = outlet.querySelector(`.play-picker-card[data-play-id="${play.id}"] canvas`)
    if (!canvas) continue
    canvas.width = canvas.offsetWidth || 160
    canvas.height = canvas.offsetHeight || 120
    renderPlay(canvas, play, { rosterMap, showDefense: true, showReadNumbers: false, mini: true })
  }
})
```

#### Main render() Function

```js
function render() {
  clear(outlet)
  const rosterMap = store.getRosterMap()

  if (selectedPlaybookId === null) {
    renderPlaybookList(rosterMap)
  } else {
    renderPlaybookEditor(rosterMap)
  }
}
```

Split `renderPlaybookList` and `renderPlaybookEditor` into separate internal functions for clarity. Each builds the DOM structure described above and appends to `outlet`.

#### Store Subscription & Cleanup

```js
const unsubscribe = store.subscribe(() => render())
render()
return () => unsubscribe()
```

### Play-Picker `buildSelect` Helper

Copy this pattern directly (identical to play-library view):

```js
function buildSelect(label, options, onChange) {
  const select = el('select', { className: 'input filter-select' })
  select.appendChild(el('option', { value: '', textContent: `${label} ▾` }))
  for (const opt of options) {
    select.appendChild(el('option', { value: opt, textContent: opt.charAt(0).toUpperCase() + opt.slice(1) }))
  }
  select.addEventListener('change', () => onChange(select.value))
  return select
}
```

## CSS to Append to `css/app.css`

```css
/* ═══════════════════════════════════════════════════════════════════════════
   Playbook Builder — Phase 5
   ═══════════════════════════════════════════════════════════════════════════ */

.playbook-view { max-width: 900px; }

.playbook-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.playbook-list-header h1 { font-size: 22px; }

.playbook-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.playbook-card {
  background: #16213e;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid transparent;
  transition: border-color 0.15s;
}
.playbook-card:hover { border-color: #0f3460; }

.playbook-card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.playbook-card-header h3 { font-size: 16px; font-weight: 600; }
.playbook-card-count { font-size: 12px; color: #888; }

.playbook-card-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.playbook-active-badge {
  background: #e94560;
  color: #fff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.playbook-empty-plays {
  padding: 32px 16px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

/* Editor header */
.playbook-editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.playbook-name-input {
  flex: 1;
  min-width: 180px;
  font-size: 18px;
  font-weight: 600;
  background: transparent;
  border: 1px solid transparent;
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
}
.playbook-name-input:focus {
  background: #0d1b36;
  border-color: #e94560;
  outline: none;
}

/* Play list items */
.playbook-plays-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.playbook-play-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #16213e;
  border-radius: 8px;
  padding: 10px 12px;
  border: 1px solid #0f3460;
}

.playbook-play-thumb {
  flex: 0 0 120px;
  height: 90px;
  border-radius: 6px;
  overflow: hidden;
  background: #2d5a27;
}
.playbook-play-thumb canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.playbook-play-info {
  flex: 1;
  min-width: 0;
}
.codename-input {
  width: 100%;
  max-width: 200px;
  margin-bottom: 4px;
}
.playbook-play-real-name {
  font-size: 12px;
  color: #666;
}

.playbook-play-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Play picker */
.playbook-play-picker {
  margin-top: 12px;
  padding: 16px;
  background: #0d1b36;
  border-radius: 8px;
  border: 1px solid #0f3460;
}

.play-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.play-picker-card {
  background: #16213e;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid transparent;
  transition: border-color 0.15s;
}
.play-picker-card:hover { border-color: #0f3460; }
.play-picker-card canvas {
  width: 100%;
  aspect-ratio: 4 / 3;
  display: block;
}
.play-picker-card-info {
  padding: 6px 10px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.play-picker-card-info span {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.play-picker-card .btn-added {
  background: #10B981;
  pointer-events: none;
}

@media (max-width: 480px) {
  .playbook-play-item { flex-wrap: wrap; }
  .playbook-play-thumb { flex: 0 0 100%; height: 120px; }
  .playbook-play-actions { width: 100%; justify-content: flex-end; }
}
```

## Edge Cases

1. **Playbook deleted while being edited**: If `selectedPlaybookId` no longer exists in `store.getPlaybooks()` after a store change, reset to list view (`selectedPlaybookId = null`).
2. **Play removed from PLAY_LIBRARY**: When rendering a playbook's plays, skip entries where `PLAY_LIBRARY.find(p => p.id === entry.playId)` returns undefined. Show a warning badge "Play not found" instead.
3. **Duplicate play add**: Check before adding, show toast "Already in playbook".
4. **Empty code name**: Allowed — player share view will show the real play name if codeName is empty.
5. **No playbooks exist**: Show empty state with prominent "Create" button.
6. **Active playbook deleted**: Set `activePlaybookId` to `null`.

## Done Criteria

- [ ] `/playbooks` route shows list of playbooks (or empty state)
- [ ] Can create a new playbook via prompt dialog
- [ ] Can delete a playbook with confirmation
- [ ] Can click "Edit" to enter editor mode
- [ ] Editor shows playbook name as editable input
- [ ] "← Back" returns to list view
- [ ] Can add plays from picker (with search/filter)
- [ ] Added plays show canvas thumbnail and code name input
- [ ] Code names save on blur/Enter
- [ ] Up/down buttons reorder plays
- [ ] "✕" removes a play from the playbook
- [ ] "Set Active" / "★ Active" badge works
- [ ] Store persists across page reload (localStorage)
- [ ] Play thumbnails render correctly via `renderPlay()` with `mini: true`
