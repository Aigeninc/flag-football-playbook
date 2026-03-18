import { createStore } from './store.js'
import { createRouter } from './router.js'
import { homeView } from './views/home.js'
import { rosterView } from './views/roster.js'
import { playbookView } from './views/playbook.js'
import { playLibraryView } from './views/play-library.js'
import { playViewerView } from './views/play-viewer.js'
import { playerShareView } from './views/player-share.js'
import { practiceView } from './views/practice.js'

// Initialize store (global for view access)
const store = createStore()
window.__store = store

// Setup router
const router = createRouter([
  { path: '/', view: homeView },
  { path: '/roster', view: rosterView },
  { path: '/library', view: playLibraryView },
  { path: '/playbooks', view: playbookView },
  { path: '/play/:id', view: playViewerView },
  { path: '/share', view: playerShareView },
  { path: '/practice', view: practiceView },
], document.getElementById('app-root'))

// Render navigation
function renderNav() {
  const nav = document.getElementById('app-nav')
  const current = router.getCurrentPath()
  const links = [
    { hash: '#/', label: '🏈 Home', match: '/' },
    { hash: '#/roster', label: '👥 Roster', match: '/roster' },
    { hash: '#/library', label: '📚 Plays', match: '/library' },
    { hash: '#/playbooks', label: '📋 Playbooks', match: '/playbooks' },
    { hash: '#/practice', label: '🏃 Practice', match: '/practice' },
  ]
  nav.innerHTML = ''
  for (const { hash, label, match } of links) {
    const a = document.createElement('a')
    a.href = hash
    a.textContent = label
    if (current === match) a.classList.add('active')
    nav.appendChild(a)
  }
}

window.addEventListener('hashchange', renderNav)
renderNav()
router.start()
