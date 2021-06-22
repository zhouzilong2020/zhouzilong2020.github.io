/**
 * querySelector wrapper
 *
 * @param {string} selector Selector to query
 * @param {Element} [scope] Optional scope element for the selector
 */
export function qs(selector, scope) {
  return (scope || document).querySelector(selector);
}

/**
 * queryAllSelector wrapper
 *
 * @param {string} selector Selector to query
 * @param {Element} [scope] Optional scope element for the selector
 */
export function qa(selector, scope) {
  return (scope || document).querySelectorAll(selector);
}

/**
 * removeEventListener wrapper
 *
 * @param {Element|Window} target Target Element
 * @param {string} type Event name to bind to
 * @param {Function} callback Event callback
 * @param {boolean} [capture] Capture the event
 */
export function $noMore(target, type, callback, capture) {
  target.removeEventListener(type, callback, !!capture);
}

/**
 * addEventListener wrapper
 *
 * @param {Element|Window} target Target Element
 * @param {string} type Event name to bind to
 * @param {Function} callback Event callback
 * @param {boolean} [capture] Capture the event
 */
export function $on(target, type, callback, capture) {
  target.addEventListener(type, callback, !!capture);
}

/**
 * Attach a handler to an event for all elements matching a selector.
 *
 * @param {Element} target Element which the event must bubble to
 * @param {string} selector Selector to match
 * @param {string} type Event name
 * @param {Function} handler Function called when the event bubbles to target
 *                           from an element matching selector
 * @param {boolean} [capture] Capture the event
 * @param {boolean} verbose for debug
 */
export function $delegate(target, selector, type, handler, capture, verbose) {
  const dispatchEvent = (event) => {
    const targetElement = event.target;
    const potentialElements = target.querySelectorAll(selector);
    if (verbose) {
      console.log("target", targetElement);
      console.log("potaintial Match", potentialElements);
    }
    let i = potentialElements.length;
    while (i--) {
      // FIXME 这里到底是  potentialElements[i] === targetElement 还是有这个子节点就可以
      if (potentialElements[i] === targetElement) {
        if (verbose) {
          console.log("successful capture");
        }
        handler.call(targetElement, event);
        break;
      }
    }
  };

  $on(target, type, dispatchEvent, !!capture);
}

/**
 * Encode less-than and ampersand characters with entity codes to make user-
 * provided text safe to parse as HTML.
 *
 * @param {string} s String to escape
 *
 * @returns {string} String with unsafe characters escaped with entity codes
 */
export const escapeForHTML = (s) =>
  s.replace(/[&<]/g, (c) => (c === "&" ? "&amp;" : "&lt;"));
