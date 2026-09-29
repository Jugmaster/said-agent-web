"use client";

import { useEffect, useState } from "react";
import s from "@/app/landing.module.css";

// First visit per tab only: the wordmark and a count to 100, then it slides away
// and the hero rows are released. Reduced motion and repeat visits skip it.
export default function Preloader() {
  // Rendered on the server so it is on screen from the first paint; a one-line
  // inline script in the page hides it before paint on repeat visits.
  const [pct, setPct] = useState<number | null>(0);
  const [away, setAway] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem("atcha-seen") === "1";
      sessionStorage.setItem("atcha-seen", "1");
    } catch {}
    const release = () => document.querySelectorAll<HTMLElement>("[data-hero]").forEach((el) => (el.dataset.hero = "go"));
    if (reduced || seen) {
      setPct(null);
      release();
      return;
    }
    document.body.style.overflow = "hidden";
    const t0 = performance.now();
    const DUR = 700;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR);
      setPct(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setAway(true);
        release();
        document.body.style.overflow = "";
        setTimeout(() => setPct(null), 800);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  if (pct === null) return null;
  return (
    <div className={`${s.loader} ${away ? s.loaderAway : ""}`} aria-hidden>
      <div className={s.loaderWord}>
        <span className={s.loaderMark} aria-hidden>@</span>
        atcha
      </div>
      <div className={s.loaderNum}>{pct}%</div>
    </div>
  );
}
