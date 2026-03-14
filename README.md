# 🏈 Flag Football Playbook

Animated play diagrams for a youth 5v5 flag football team. Mobile-first, iPad-optimized, works offline.

## Features

- **13 animated plays** with read progressions
- **QB Vision Timer** — 7-second pass clock with color-coded urgency
- **Read progression highlighting** — routes animate in read order with pulsing glow
- **Player color filter** — tap a player to isolate their route
- **Touch gestures** — swipe left/right to cycle plays
- **Speed controls** — 0.5x, 1x, 2x playback
- **PWA** — install on home screen, works offline
- **No build step** — pure vanilla HTML/CSS/JS

## Players

| Player | Color | Role |
|--------|-------|------|
| Braelyn | ⬛ Black | QB (every snap) |
| Lenox | 🟣 Purple | Center (every snap) |
| Greyson | 🔴 Red | WR/RB — FASTEST |
| Marshall | 🟡 Yellow | WR/RB — TALL, 2nd QB |
| Cooper | 🟢 Teal | WR/RB — FAST |
| Jordy | 🔵 Blue | Sub |
| Zeke | 🟠 Orange | Sub |

## Local Development

Just open `index.html` in a browser. No server needed.

```bash
# Or use any static server:
python3 -m http.server 8080
# Then open http://localhost:8080
```

## Deploy to GitHub Pages

1. Push to a GitHub repo (e.g. `Aigeninc/flag-football-playbook`)
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch** → `main` / `root`
4. The `.nojekyll` file ensures GitHub serves raw files
5. Access at `https://aigeninc.github.io/flag-football-playbook/`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← → | Previous/Next play |
| Space | Play/Pause |
| R | Replay |

## File Structure

```
├── index.html      # Main app shell
├── style.css       # All styles
├── app.js          # Rendering & animation engine
├── plays.js        # Play data (positions, routes, timing)
├── manifest.json   # PWA manifest
├── sw.js           # Service worker (offline)
├── .nojekyll       # GitHub Pages raw file serving
└── README.md       # This file
```
