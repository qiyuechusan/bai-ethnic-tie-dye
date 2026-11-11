export function initHomeExtras() {
  function switchView(viewName) {
    const targetView = document.getElementById('view-' + viewName)
    if (!targetView) return

    document.querySelectorAll('.page-view').forEach((view) => {
      view.classList.remove('active')
    })
    targetView.classList.add('active')
    document.body.dataset.view = viewName
    document.querySelectorAll('.main-nav [data-view]').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.view === viewName)
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.dispatchEvent(new CustomEvent('viewchange', { detail: { viewName } }))

    const nav = document.getElementById('mainNav')
    const menuButton = document.getElementById('menuButton')
    if (nav && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open')
      if (menuButton) menuButton.setAttribute('aria-expanded', 'false')
    }
  }

  function openPattern() {
    switchView('heritage')
    if (typeof window.openModal === 'function') window.openModal('modal-pattern')
  }

  function openScenario() {
    switchView('heritage')
    if (typeof window.openModal === 'function') window.openModal('modal-pattern')
    window.requestAnimationFrame(() => window.module3?.enterScenarios())
  }

  function openGallery() {
    switchView('modules')
    if (typeof window.openModal === 'function') window.openModal('modal-ask')
  }

  Object.assign(window, { switchView, openPattern, openScenario, openGallery })

  const hashView = window.location.hash.slice(1)
  let initialView

  if (hashView === 'pattern') {
    initialView = 'heritage'
  } else if (hashView === 'gallery') {
    initialView = 'modules'
  } else if (hashView) {
    if (['modules', 'heritage'].includes(hashView) || document.getElementById('view-' + hashView)) {
      initialView = hashView
    } else {
      initialView = 'home'
    }
  } else {
    initialView = 'home'
  }

  document.body.dataset.view = initialView
  document.querySelectorAll('.main-nav [data-view]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.view === initialView)
  })

  if (initialView !== 'home') {
    window.requestAnimationFrame(() => switchView(initialView))
  }
}
