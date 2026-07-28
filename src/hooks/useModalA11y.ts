"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Baseline dialog behavior for a modal rendered while mounted:
 *   - Esc closes it
 *   - Tab / Shift+Tab cycle inside the panel (focus trap)
 *   - focus moves into the panel on open and returns to the trigger on close
 *
 * The panel element should carry role="dialog" aria-modal="true" and a
 * tabIndex={-1} so the container itself can take initial focus when the
 * dialog has no obvious first control.
 */
export function useModalA11y(
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  /** For dialogs that stay mounted while hidden (e.g. the ⌘K palette),
   *  pass their open flag so the trap engages/releases with it. */
  active: boolean = true,
): void {
  useEffect(() => {
    const panel = panelRef.current;
    if (!active || !panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus in unless something inside (e.g. an autofocused input)
    // already has it by the time this effect runs.
    if (!panel.contains(document.activeElement)) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [panelRef, onClose, active]);
}
