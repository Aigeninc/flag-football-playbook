import { el, clear } from '../utils/dom.js'

export function homeView(params, outlet) {
  const store = window.__store
  const state = store.get()
  const rosterCount = state.roster.length
  const playbookCount = state.playbooks.length
  const planCount = (state.practicePlans || []).length

  clear(outlet)

  const container = el('div', { className: 'home-view' }, [
    el('h1', { textContent: '🏈 Playbook', style: { fontSize: '28px', marginBottom: '8px' } }),
    el('p', { textContent: 'Flag Football Play Animator', style: { color: '#888', marginBottom: '24px' } }),
    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' } }, [
      makeNavCard('👥', 'Roster', `${rosterCount} player${rosterCount !== 1 ? 's' : ''}`, '#/roster'),
      makeNavCard('📚', 'Play Library', '37 plays', '#/library'),
      makeNavCard('📋', 'Playbooks', `${playbookCount} playbook${playbookCount !== 1 ? 's' : ''}`, '#/playbooks'),
      makeNavCard('🏃', 'Practice', `${planCount} plan${planCount !== 1 ? 's' : ''}`, '#/practice'),
    ])
  ])

  // Show roster warnings
  if (rosterCount > 0) {
    const rosterMap = store.getRosterMap()
    const missing = store.POSITIONS.filter(p => !rosterMap[p])
    if (missing.length > 0) {
      container.appendChild(
        el('div', {
          className: 'card',
          style: { marginTop: '16px', borderLeft: '3px solid #F59E0B' },
          innerHTML: `⚠️ Missing positions: <strong>${missing.join(', ')}</strong>`
        })
      )
    } else {
      container.appendChild(
        el('div', {
          className: 'card',
          style: { marginTop: '16px', borderLeft: '3px solid #10B981' },
          textContent: '✅ All positions filled — ready for game day!'
        })
      )
    }
  } else {
    container.appendChild(
      el('div', {
        className: 'card',
        style: { marginTop: '16px', borderLeft: '3px solid #3B82F6' },
        innerHTML: 'Get started by <a href="#/roster" style="color: #e94560;">adding your players</a>'
      })
    )
  }

  outlet.appendChild(container)
}

function makeNavCard(icon, title, subtitle, href) {
  const card = el('a', {
    href,
    className: 'card',
    style: { display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'transform 0.15s' }
  }, [
    el('div', { textContent: icon, style: { fontSize: '32px', marginBottom: '8px' } }),
    el('div', { textContent: title, style: { fontWeight: '600', fontSize: '16px' } }),
    el('div', { textContent: subtitle, style: { color: '#888', fontSize: '13px', marginTop: '4px' } }),
  ])
  card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-2px)')
  card.addEventListener('mouseleave', () => card.style.transform = '')
  return card
}
