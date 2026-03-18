/**
 * Create a hash-based client-side router.
 *
 * Routes use patterns like '/play/:id' which match '#/play/mesh-left'
 * and extract { id: 'mesh-left' } as params.
 *
 * Query params are also parsed: '#/share?player=greyson&playbook=pb1'
 * becomes params.query = { player: 'greyson', playbook: 'pb1' }
 *
 * @param {Array<{path: string, view: Function}>} routes
 * @param {HTMLElement} outlet - The #app-root element
 * @returns {{ navigate: Function, start: Function, getCurrentPath: Function }}
 */
export function createRouter(routes, outlet) {
  let currentCleanup = null

  function parseHash() {
    const hash = window.location.hash.slice(1) || '/'
    const [pathPart, queryPart] = hash.split('?')
    const path = pathPart || '/'
    const query = {}
    if (queryPart) {
      for (const pair of queryPart.split('&')) {
        const [key, val] = pair.split('=')
        if (key) query[decodeURIComponent(key)] = decodeURIComponent(val || '')
      }
    }
    return { path, query }
  }

  function matchRoute(path) {
    for (const route of routes) {
      const params = matchPattern(route.path, path)
      if (params !== null) return { route, params }
    }
    return null
  }

  function matchPattern(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean)
    const pathParts = path.split('/').filter(Boolean)
    if (patternParts.length !== pathParts.length) return null
    const params = {}
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i])
      } else if (patternParts[i] !== pathParts[i]) {
        return null
      }
    }
    return params
  }

  function render() {
    // Cleanup previous view
    if (typeof currentCleanup === 'function') {
      currentCleanup()
      currentCleanup = null
    }

    const { path, query } = parseHash()
    const match = matchRoute(path)

    outlet.innerHTML = ''

    if (match) {
      const params = { ...match.params, query }
      const result = match.route.view(params, outlet)
      // View can return a cleanup function
      if (typeof result === 'function') currentCleanup = result
    } else {
      // 404 — redirect to home
      window.location.hash = '#/'
    }
  }

  function navigate(path) {
    window.location.hash = '#' + path
  }

  function start() {
    window.addEventListener('hashchange', render)
    render()
  }

  function getCurrentPath() {
    return parseHash().path
  }

  return { navigate, start, getCurrentPath }
}
