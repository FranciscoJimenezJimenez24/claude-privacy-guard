/**
 * Claude Privacy Guard - content.js
 * Injected at document_start in the MAIN world.
 */
(() => {
  'use strict';

  const STATIC_TITLE = 'Claude';

  // 1. Interceptar lecturas y escrituras mediante document.title en JS
  const descriptor = {
    get() {
      return STATIC_TITLE;
    },
    set(_value) {
      // Descartar silenciosamente asignaciones programáticas (document.title = ...)
    },
    configurable: true,
    enumerable: true
  };

  try {
    Object.defineProperty(Document.prototype, 'title', descriptor);
  } catch (_) { }

  try {
    Object.defineProperty(document, 'title', descriptor);
  } catch (_) { }

  // 2. Sanitizar el texto de <title> mutando SOLO nodeValue de los TextNodes existentes.
  // IMPORTANTE: Nunca usar element.textContent = ... ni element.remove(), ya que
  // destruyen los nodos Text/Comment hijos referenciados por React Fiber.
  let headObserver = null;

  const sanitizeTitleElement = (titleEl) => {
    const children = titleEl.childNodes;
    let mainTextApplied = false;

    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.nodeType === Node.TEXT_NODE) {
        const targetText = mainTextApplied ? '' : STATIC_TITLE;
        if (node.nodeValue !== targetText) {
          node.nodeValue = targetText;
        }
        mainTextApplied = true;
      }
    }
  };

  const enforceHeadTitles = () => {
    if (!document.head) return;

    const titles = document.head.getElementsByTagName('title');
    for (let i = 0; i < titles.length; i++) {
      sanitizeTitleElement(titles[i]);
    }

    // Limpiar la cola de mutaciones generadas por nuestro propio cambio de nodeValue
    if (headObserver) {
      headObserver.takeRecords();
    }
  };

  // 3. Enganchar el MutationObserver EXCLUSIVAMENTE cuando document.head exista
  const attachHeadObserver = () => {
    if (!document.head || headObserver) return;

    enforceHeadTitles();

    headObserver = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        const target = m.target;

        if (
          target.nodeName === 'TITLE' ||
          (target.parentNode && target.parentNode.nodeName === 'TITLE')
        ) {
          enforceHeadTitles();
          return;
        }

        if (m.type === 'childList' && m.addedNodes.length > 0) {
          for (let j = 0; j < m.addedNodes.length; j++) {
            if (m.addedNodes[j].nodeName === 'TITLE') {
              enforceHeadTitles();
              return;
            }
          }
        }
      }
    });

    headObserver.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true
    });
  };

  // Si document.head aún es null en document_start, vigilar solo hasta que se cree <head>
  if (document.head) {
    attachHeadObserver();
  } else {
    const bootstrapObserver = new MutationObserver(() => {
      if (document.head) {
        bootstrapObserver.disconnect();
        attachHeadObserver();
      }
    });
    bootstrapObserver.observe(document, {
      childList: true,
      subtree: true
    });
  }

  document.addEventListener('DOMContentLoaded', enforceHeadTitles, { once: true });
})();