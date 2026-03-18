const CACHE_NAME = 'playbook-v4'

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
  './js/views/practice.js',
  './js/views/juke-tutorial.js',
  './js/canvas/juke-animator.js',
  './js/juke-data.js',
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
