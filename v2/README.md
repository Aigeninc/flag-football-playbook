# Flag Football Playbook v2

Animated flag football playbook for youth coaches. Position-based plays, roster management, playbook builder, and player share links.

## Tech Stack
- Vanilla JS + HTML5 Canvas
- Zero dependencies
- PWA (offline-capable)
- GitHub Pages deployment

## Development
No build step. Open `index.html` in a browser or serve with any static server:
```
python3 -m http.server 8080
```

## Architecture
- `js/store.js` — Reactive state with localStorage persistence
- `js/router.js` — Hash-based client-side router
- `js/views/` — View functions (one per route)
- `js/canvas/` — Field rendering and animation (Phase 3+)
- `js/utils/` — DOM helpers, storage wrapper
