# Implementation Guide: PWA & Offline Support

## Files to Create/Modify

| Action | Path |
|--------|------|
| **Create** | `sw.js` (in v2 root, same level as `index.html`) |
| **Create** | `manifest.json` (in v2 root) |
| **Create** | `js/generate-icons.js` (run once to create icon files) |
| **Create** | `icons/icon-192.png` (generated) |
| **Create** | `icons/icon-512.png` (generated) |
| **Modify** | `index.html` (add meta tags, manifest link, SW registration) |

No changes to `js/app.js`, `js/store.js`, or any view files.

## File 1: `manifest.json`

```json
{
  "name": "Flag Football Playbook",
  "short_name": "Playbook",
  "description": "Flag football play animator and playbook builder",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## File 2: `sw.js`

```js
const CACHE_NAME = 'playbook-v1'

const APP_SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/store.js',
  './js/router.js',
  './js/play-library.js',
  './js/utils/dom.js',
  './js/utils/storage.js',
  './js/canvas/renderer.js',
  './js/canvas/animator.js',
  './js/views/home.js',
  './js/views/roster.js',
  './js/views/playbook.js',
  './js/views/play-library.js',
  './js/views/play-viewer.js',
  './js/views/player-share.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
]

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  )
  // Activate immediately (don't wait for old tabs to close)
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  )
  // Take control of all open tabs immediately
  self.clients.claim()
})

// Fetch: cache-first for app shell, network-first for everything else
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        // Don't cache non-ok or opaque responses
        if (!response || response.status !== 200) return response
        // Cache a clone for future use
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return response
      })
    }).catch(() => {
      // Offline fallback — return index.html for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html')
      }
    })
  )
})

// Listen for messages from the app
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})
```

### Cache Update Strategy

When updating the app, change `CACHE_NAME` to `'playbook-v2'` (etc.). The activate handler will delete old caches.

## File 3: `index.html` Modifications

Replace the entire `<head>` section:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Playbook">
  <meta name="theme-color" content="#1a1a2e">
  <meta name="description" content="Flag football play animator and playbook builder">
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <title>Playbook</title>
  <link rel="stylesheet" href="css/app.css">
</head>
```

Add SW registration **before** the closing `</body>` tag, **after** the app.js script:

```html
  <script type="module" src="js/app.js"></script>
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available — show toast
                showUpdateToast(reg)
              }
            })
          })
        }).catch(err => console.error('SW registration failed:', err))
      })
    }

    function showUpdateToast(reg) {
      const toast = document.createElement('div')
      toast.className = 'update-toast'
      toast.innerHTML = '🔄 Update available <button onclick="applyUpdate()">Refresh</button>'
      document.body.appendChild(toast)
      window._pendingReg = reg
    }

    function applyUpdate() {
      const reg = window._pendingReg
      if (reg && reg.waiting) {
        reg.waiting.postMessage('skipWaiting')
      }
      // Reload once the new SW takes over
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  </script>
```

## File 4: Icon Generation Script `js/generate-icons.js`

This is a **one-time script** run in the browser console or as a standalone page. It generates simple canvas-drawn icons.

Create a temporary HTML file `generate-icons.html` in v2 root (can be deleted after use):

```html
<!DOCTYPE html>
<html>
<body>
<script>
function generateIcon(size) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.15)
  ctx.fill()

  // Football emoji-style shape
  const cx = size / 2
  const cy = size / 2
  const rx = size * 0.28
  const ry = size * 0.18

  ctx.fillStyle = '#8B4513'
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, -Math.PI / 6, 0, Math.PI * 2)
  ctx.fill()

  // Laces
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = size * 0.015
  const laceY = cy - ry * 0.1
  ctx.beginPath()
  ctx.moveTo(cx - rx * 0.5, laceY)
  ctx.lineTo(cx + rx * 0.5, laceY)
  ctx.stroke()

  // Cross laces
  for (let i = -2; i <= 2; i++) {
    const x = cx + i * rx * 0.2
    ctx.beginPath()
    ctx.moveTo(x, laceY - size * 0.03)
    ctx.lineTo(x, laceY + size * 0.03)
    ctx.stroke()
  }

  // Text
  ctx.fillStyle = '#e94560'
  ctx.font = `bold ${size * 0.12}px -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('PLAYBOOK', cx, cy + size * 0.32)

  return canvas.toDataURL('image/png')
}

// Generate and download
for (const size of [192, 512]) {
  const dataUrl = generateIcon(size)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `icon-${size}.png`
  a.click()
}
</script>
</body>
</html>
```

**Alternative (simpler):** The implementing agent can just create the icons programmatically using Node.js canvas, or create minimal placeholder PNGs. The key requirement is that `icons/icon-192.png` and `icons/icon-512.png` exist.

**Simplest approach:** Create the icons directory and generate them inline during build. Or use this single-line approach to create minimal valid PNGs:

```bash
mkdir -p icons
# The implementing agent should open generate-icons.html in a browser,
# save the downloaded files to icons/, then delete generate-icons.html.
```

## CSS to Append to `css/app.css`

```css
/* ═══════════════════════════════════════════════════════════════════════════
   PWA Update Toast
   ═══════════════════════════════════════════════════════════════════════════ */

.update-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #16213e;
  color: #e0e0e0;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 300;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #0f3460;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}
.update-toast button {
  background: #e94560;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.update-toast button:hover { background: #c73e54; }
```

## Edge Cases

1. **Service worker scope**: `sw.js` must be in the root of the app (same directory as `index.html`). If the app is served from a subdirectory, the scope is automatically that directory.
2. **HTTPS required**: Service workers only work over HTTPS or localhost. Ensure deployment uses HTTPS.
3. **Module scripts**: The SW uses classic script syntax (not ES modules). This is correct — service workers don't support `import` in all browsers.
4. **Hash-based routing**: Navigation fallback returns `index.html` which then handles the hash route client-side. This works correctly.
5. **localStorage vs SW cache**: The SW caches the *code* (HTML, CSS, JS). User data (roster, playbooks, preferences) is in localStorage and doesn't need SW caching.
6. **First load**: On first visit, the SW installs and caches everything. The app works immediately; SW activation happens in the background.
7. **iOS quirks**: `apple-mobile-web-app-capable` and `apple-touch-icon` are already handled. iOS doesn't show update prompts — users just re-open the app.
8. **roundRect polyfill**: `ctx.roundRect` may not exist in older browsers. For the icon generator only — not a runtime concern. If it fails, use a simple filled rectangle instead.

## Integration Points

- **No JS imports needed** — SW registration is a plain `<script>` block, not a module
- **`showToast` not available** in the inline script (it's in a module). The update toast uses its own DOM creation instead.
- **All existing JS files** must be listed in `APP_SHELL` array. If new files are added later, update `APP_SHELL`.

## Done Criteria

- [ ] `manifest.json` exists with correct `name`, `theme_color`, `icons`, `display: standalone`
- [ ] `sw.js` exists in v2 root directory
- [ ] `icons/icon-192.png` and `icons/icon-512.png` exist
- [ ] `index.html` has `<link rel="manifest">`, `<meta name="theme-color">`, `<link rel="apple-touch-icon">`
- [ ] `index.html` has SW registration script before `</body>`
- [ ] Opening in Chrome DevTools → Application → Service Workers shows SW registered
- [ ] Application → Cache Storage shows `playbook-v1` with all app shell files
- [ ] Turning off network (DevTools → Network → Offline) still loads the app
- [ ] All views work offline (home, roster, library, play viewer, playbooks)
- [ ] Chrome shows "Install" prompt or "Add to Home Screen" option
- [ ] On iOS Safari, "Add to Home Screen" creates a standalone app
- [ ] After updating `CACHE_NAME` and reloading, "Update available" toast appears
- [ ] Clicking "Refresh" on the toast reloads with new version
- [ ] `.update-toast` styled with dark theme
