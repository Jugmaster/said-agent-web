"use client";

import { useEffect, useState } from "react";

export type ThemePref = "system" | "light" | "dark";
const KEY = "atcha:theme";

/** Apply a preference: stamp data-theme for an explicit choice, remove it for system. */
export function applyTheme(pref: ThemePref): void {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", dark ? "#121110" : "#F6F4EE"));
}

export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** Light / Dark / System. Remembered on this device; applied before first paint by the inline script in layout. */
export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => { setPref(readThemePref()); }, []);
  const pick = (p: ThemePref) => {
    setPref(p);
    try { if (p === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, p); } catch {}
    applyTheme(p);
  };
  return (
    <div className="inline-flex rounded-full bg-btn p-0.5 text-xs">
      {(["light", "dark", "system"] as ThemePref[]).map((p) => (
        <button key={p} type="button" onClick={() => pick(p)} aria-pressed={pref === p} className={`rounded-full px-3 py-1.5 capitalize transition ${pref === p ? "bg-ink text-cream" : "text-grey hover:text-ink"}`}>
          {p}
        </button>
      ))}
    </div>
  );
}
