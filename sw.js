// Service Worker for offline support
// Update CACHE_VERSION when assets change to bust old caches
const CACHE_VERSION = '20260314-phase3';
const CACHE_NAME = 'playbook-' + CACHE_VERSION;

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './plays.js',
  './app.js',
  './modules/state.js',
  './modules/renderer.js',
  './modules/animation.js',
  './modules/ui.js',
  './modules/coach.js',
  './modules/queue.js',
  './modules/touch.js',
  './modules/editor.js',
  './modules/roster.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
