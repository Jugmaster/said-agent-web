/**
 * Tiny refresh bus: anything that may have moved funds (an agent reply, a
 * send, a detected deposit) calls requestRefresh(), and every live data
 * surface (balance hooks, the chat activity rail) re-fetches. Keeps the
 * dashboard reacting to what the agent does without threading callbacks
 * through the tree. Same window-event pattern as the "said:ask" hand-off.
 */

const REFRESH_EVENT = "said:refresh";

export function requestRefresh(): void {
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

/** Subscribe; returns the unsubscribe function (effect-friendly). */
export function onRefresh(cb: () => void): () => void {
  window.addEventListener(REFRESH_EVENT, cb);
  return () => window.removeEventListener(REFRESH_EVENT, cb);
}
