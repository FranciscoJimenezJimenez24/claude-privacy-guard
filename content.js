/**
 * Claude Privacy Guard - content.js
 * Injected at document_start in the MAIN world.
 *
 * Intercepts and locks document.title at both the JS descriptor level and the
 * DOM element level to prevent conversation titles from leaking into browser history,
 * screen captures, window titles, and third-party extensions.
 */
(() => {
  'use strict';

  const STATIC_TITLE = 'Claude';

  // 1. Prototype & Instance Descriptor Interception
  // Overriding Document.prototype.title neutralizes all programmatic updates (e.g., document.title = ...)
  const descriptor = {
    get() {
      return STATIC_TITLE;
    },
    set(_value) {
      // Silently discard dynamic titles assigned by React / Next.js
      // No errors are thrown to preserve frontend stability
    },
    configurable: true,
    enumerable: true
  };

  try {
    Object.defineProperty(Document.prototype, 'title', descriptor);
  } catch (_) {
    // If Document.prototype is non-configurable in current engine state, fallback to document instance
  }

  try {
    Object.defineProperty(document, 'title', descriptor);
  } catch (_) {
    // Already defined or restricted
  }

  // 2. DOM <title> Node Observer
  // React 18/19 & Next.js Head components manipulate DOM <title> tags directly in <head>.
  // We enforce that any <title> tag in the DOM maintains static text "Claude".
  let isEnforcing = false;

  const enforceTitleElements = () => {
    if (isEnforcing) return;
    isEnforcing = true;

    try {
      const titles = document.getElementsByTagName('title');
      if (titles.length === 0) {
        const head = document.head || document.documentElement;
        if (head) {
          const titleEl = document.createElement('title');
          titleEl.textContent = STATIC_TITLE;
          head.appendChild(titleEl);
        }
      } else {
        // Enforce static text on all title elements without removing them from DOM.
        // NOTE: Calling element.remove() on React-managed nodes causes fatal React Fiber
        // reconciliation crashes (NotFoundError during removeChild), freezing the chat UI.
        for (let i = 0; i < titles.length; i++) {
          if (titles[i].textContent !== STATIC_TITLE) {
            titles[i].textContent = STATIC_TITLE;
          }
        }
      }
    } catch (_) {
      // Clean and silent execution
    } finally {
      isEnforcing = false;
    }
  };

  // 3. Attach MutationObserver exclusively to <head>
  // Scoping to <head> prevents intercepting thousands of token streaming mutations in <body>.
  const initObserver = () => {
    enforceTitleElements();

    const observer = new MutationObserver((mutations) => {
      if (isEnforcing) return;

      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        const target = m.target;

        // Check for direct title mutations or characterData updates within <title>
        if (
          target &&
          (target.nodeName === 'TITLE' ||
            (target.parentNode && target.parentNode.nodeName === 'TITLE'))
        ) {
          enforceTitleElements();
          return;
        }

        // Check for added <title> nodes
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          for (let j = 0; j < m.addedNodes.length; j++) {
            const node = m.addedNodes[j];
            if (node.nodeName === 'TITLE') {
              enforceTitleElements();
              return;
            }
          }
        }
      }
    });

    const targetHead = document.head || document.documentElement;
    if (targetHead) {
      observer.observe(targetHead, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  };

  // Immediate start or bootstrap when head/documentElement is instantiated
  if (document.head || document.documentElement) {
    initObserver();
  } else {
    const earlyObserver = new MutationObserver(() => {
      if (document.head || document.documentElement) {
        earlyObserver.disconnect();
        initObserver();
      }
    });
    earlyObserver.observe(document, { childList: true });
  }

  // Backup check on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', enforceTitleElements, { once: true });
})();
