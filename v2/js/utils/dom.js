/**
 * Create a DOM element with attributes and children.
 * @param {string} tag - Tag name
 * @param {Object} [attrs] - Attributes: className, id, textContent, innerHTML, onclick, dataset, style, type, value, placeholder, etc.
 * @param {(HTMLElement|string)[]} [children] - Child elements or text strings
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag)
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') element.className = val
    else if (key === 'textContent') element.textContent = val
    else if (key === 'innerHTML') element.innerHTML = val
    else if (key === 'dataset') Object.assign(element.dataset, val)
    else if (key === 'style' && typeof val === 'object') Object.assign(element.style, val)
    else if (key.startsWith('on')) element.addEventListener(key.slice(2).toLowerCase(), val)
    else if (typeof val === 'boolean') { if (val) element.setAttribute(key, ''); else element.removeAttribute(key) }
    else element.setAttribute(key, val)
  }
  for (const child of children) {
    if (typeof child === 'string') element.appendChild(document.createTextNode(child))
    else if (child instanceof HTMLElement) element.appendChild(child)
  }
  return element
}

/**
 * Remove all children from an element.
 * @param {HTMLElement} parent
 */
export function clear(parent) {
  parent.innerHTML = ''
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {number} [duration=2500] - ms before fade
 */
export function showToast(message, duration = 2500) {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()
  const toast = el('div', { className: 'toast', textContent: message })
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), duration)
}
