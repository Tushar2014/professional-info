/**
 * Additive motion only. Nothing in this file renders content.
 *
 * POLARITY, and it is the whole design of this file. Every animated element is
 * already in its final state in the server rendered HTML. This script ARMS an
 * element by adding .is-armed, which is the only thing in the codebase that
 * applies a hidden or zero-scale pre-state, and then releases it when it scrolls
 * into view. Nothing is keyed on html.js, because html.js is added by an inline
 * head script and is therefore present whether or not this module ever loads,
 * parses or runs.
 *
 * The consequence, which is the point: if this module throws, if the bundle is
 * blocked, if IntersectionObserver is missing or if reduced motion is set, no
 * element is ever armed and the page stays exactly as the server sent it. The
 * hider and the revealer are the same few lines, so they cannot fail apart.
 *
 * Each concern below is also isolated, so one broken feature cannot take the
 * other three down with it.
 */

/** Runs one additive enhancement. A throw is swallowed on purpose: every caller
 *  here only ever improves a page that is already complete without it. */
function safely(run: () => void): void {
  try {
    run()
  } catch {
    /* The page is already correct. There is nothing to fall back to. */
  }
}

const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const reveals = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
const spans = Array.from(document.querySelectorAll<HTMLElement>('[data-span]'))
const meters = Array.from(document.querySelectorAll<HTMLElement>('[data-meter]'))

if (!reduce) {
  safely(armAndObserveReveals)
  safely(() => armAndObserveGroup(spans, 'is-drawn', '--si', 0.25))
  safely(() => armAndObserveGroup(meters, 'is-filled', '--mi', 0.2))
}

function armAndObserveReveals(): void {
  if (reveals.length === 0) return

  // The observer is constructed FIRST and nothing is armed until it exists. A
  // throw on this line leaves every block visible, which is the failure mode
  // this ordering is here to guarantee.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-in')
        observer.unobserve(entry.target)
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -12% 0px' },
  )

  for (const el of reveals) {
    el.classList.add('is-armed')
    observer.observe(el)
  }
}

/**
 * Arms every element in a group, then releases the whole group together the
 * first time any member of it becomes visible, with a stagger index so the
 * cluster draws in reading order rather than in scroll order.
 *
 * Same ordering rule as above: observer first, arm second.
 */
function armAndObserveGroup(
  elements: HTMLElement[],
  releasedClass: string,
  indexProperty: string,
  threshold: number,
): void {
  if (elements.length === 0) return

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        for (const el of elements) el.classList.add(releasedClass)
        observer.disconnect()
        return
      }
    },
    { threshold },
  )

  elements.forEach((el, index) => {
    el.style.setProperty(indexProperty, String(index))
    el.classList.add('is-armed')
    observer.observe(el)
  })
}

/* ------------------------------------------------------------------------- */
/* Nav scroll spy. aria-current moves between the in page section anchors and
   the 2px steel indicator follows it in CSS. The route links in the same bar
   carry aria-current="page" from the server and are never touched here. The
   links themselves work with the script absent.                              */
/* ------------------------------------------------------------------------- */

safely(() => {
  const navLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.nav-link[data-section]'),
  )
  if (navLinks.length === 0) return

  const sections = navLinks
    .map((link) => document.getElementById(link.dataset.section ?? ''))
    .filter((el): el is HTMLElement => el !== null)
  if (sections.length === 0) return

  // "location" and not "page": these are anchors into the document the reader is
  // already on, and only a link whose href resolves to the current pathname is
  // ever aria-current="page".
  const setCurrent = (id: string): void => {
    for (const link of navLinks) {
      if (link.dataset.section === id) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    }
  }

  const spy = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setCurrent(visible.target.id)
    },
    { threshold: [0.2, 0.5], rootMargin: '-60px 0px -40% 0px' },
  )
  for (const section of sections) spy.observe(section)
})

/* ------------------------------------------------------------------------- */
/* Header hairline. Present in CSS by default; the script REMOVES it near the
   top of the page and restores it below 24px of scroll. JS hides, never draws. */
/* ------------------------------------------------------------------------- */

safely(() => {
  const header = document.querySelector<HTMLElement>('.site-header')
  if (!header) return

  const syncHeader = (): void => {
    header.classList.toggle('at-top', window.scrollY < 24)
  }
  syncHeader()
  window.addEventListener('scroll', syncHeader, { passive: true })
})
