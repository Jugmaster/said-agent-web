"use client";

import { useEffect, useState } from "react";

/**
 * Light/dark switch for the public surfaces.
 *
 * Convention matches the app: no attribute means dark (the default), and
 * `data-theme="light"` opts into light. The landing design writes it the other
 * way round, but the signed-in app already ships the dark-default form and one
 * convention across both is worth more than matching the mock's attribute name
 * — DotSeam and HeroDots both read it this way.
 *
 * The stored value is applied by an inline script in the document head, so the
 * first paint is already correct; this component only reflects and toggles it.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.dataset.theme === "light");
  }, []);

  function toggle() {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("said-theme", next);
    } catch {
      // storage unavailable (private mode) — the toggle still works for this page view
    }
    setLight(next === "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Toggle dark mode"
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)] transition-colors hover:border-[var(--ink)] ${className}`}
    >
      <svg
        width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round"
        className="absolute transition-[opacity,transform] duration-500"
        style={{ opacity: light ? 0 : 1, transform: light ? "rotate(60deg)" : "none" }}
      >
        <circle cx="8" cy="8" r="3.2" />
        <line x1="8" y1="0.8" x2="8" y2="2.6" /><line x1="8" y1="13.4" x2="8" y2="15.2" />
        <line x1="0.8" y1="8" x2="2.6" y2="8" /><line x1="13.4" y1="8" x2="15.2" y2="8" />
        <line x1="2.9" y1="2.9" x2="4.2" y2="4.2" /><line x1="11.8" y1="11.8" x2="13.1" y2="13.1" />
        <line x1="2.9" y1="13.1" x2="4.2" y2="11.8" /><line x1="11.8" y1="4.2" x2="13.1" y2="2.9" />
      </svg>
      <svg
        width="15" height="15" viewBox="0 0 16 16" fill="currentColor"
        className="absolute transition-[opacity,transform] duration-500"
        style={{ opacity: light ? 1 : 0, transform: light ? "none" : "rotate(-60deg)" }}
      >
        <path d="M13.5 9.8A6 6 0 0 1 6.2 2.5a6 6 0 1 0 7.3 7.3Z" />
      </svg>
    </button>
  );
}
