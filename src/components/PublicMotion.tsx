"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
 * Motion for the public pages, driven by data attributes so server-rendered
 * pages can opt in without becoming client components:
 *   data-hero              hero rows slide up on mount
 *   data-reveal / data-stagger   rise in when they enter the viewport
 *   data-count             numbers count up when revealed
 *   data-marquee           velocity-linked chip ticker
 *   data-stage             the pinned send demo, scrubbed by scroll
 *   data-close             the closing coral panel growing in
 *   data-nav               hides on scroll down, returns on scroll up
 */
export default function PublicMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = <T extends Element>(sel: string) => Array.from(document.querySelectorAll<T>(sel));
    const cleanups: Array<() => void> = [];

    // Hero rows.
    requestAnimationFrame(() => q<HTMLElement>("[data-hero]").forEach((el) => (el.dataset.hero = "go")));

    // Reveals.
    const revealEls = q<HTMLElement>("[data-reveal], [data-stagger]");
    const countUp = (root: HTMLElement) => {
      q<HTMLElement>("[data-count]", ).filter((c) => root === c || root.contains(c)).forEach((el) => {
        if (el.dataset.count === "done") return;
        el.dataset.count = "done";
        const raw = el.textContent ?? "";
        const m = raw.match(/-?[\d,]*\.?\d+/);
        if (!m) return;
        const target = parseFloat(m[0].replace(/,/g, ""));
        const decimals = (m[0].split(".")[1] ?? "").length;
        const pre = raw.slice(0, m.index), post = raw.slice((m.index ?? 0) + m[0].length);
        if (reduced || !isFinite(target)) return;
        const o = { v: 0 };
        gsap.to(o, {
          v: target, duration: 1.4, ease: "power3.out",
          onUpdate: () => { el.textContent = pre + o.v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + post; },
        });
      });
    };
    if (reduced || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => { if ("reveal" in el.dataset) el.dataset.reveal = "in"; else el.dataset.stagger = "in"; });
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          if ("reveal" in el.dataset) el.dataset.reveal = "in"; else el.dataset.stagger = "in";
          countUp(el);
          io.unobserve(el);
        });
      }, { threshold: 0.12 });
      revealEls.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    if (reduced) {
      q<HTMLElement>("[data-close]").forEach((el) => { el.dataset.close = "in"; el.style.transform = "none"; el.style.opacity = "1"; });
      q<HTMLElement>("[data-step]").forEach((s) => (s.dataset.on = ""));
      q<HTMLElement>("[data-done]").forEach((s) => (s.dataset.on = ""));
      return () => cleanups.forEach((f) => f());
    }

    // Smooth scroll, synced with ScrollTrigger.
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ duration: 1.4, smoothWheel: true, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => { gsap.ticker.remove(tick); lenis.destroy(); });

    // Nav: hide on scroll down past the hero, return on scroll up.
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    if (nav) {
      let lastY = 0;
      const onNav = () => {
        const y = window.scrollY;
        if (y > 500 && y > lastY + 4) nav.style.transform = "translateY(-100%)";
        else if (y < lastY - 4 || y <= 500) nav.style.transform = "";
        lastY = y;
      };
      nav.style.transition = "transform 0.35s ease";
      lenis.on("scroll", onNav);
    }

    // Marquee: ambient drift plus momentum from scrolling.
    const track = document.querySelector<HTMLElement>("[data-marquee]");
    if (track) {
      const html = track.innerHTML;
      let guard = 0;
      while (track.scrollWidth < window.innerWidth * 2 && guard++ < 6) track.innerHTML += html;
      const mEl = track.parentElement!;
      let pos = 0, vel = 0, half = track.scrollWidth / 2, hover = false, visible = true;
      let lastY = window.scrollY, lastT = performance.now();
      const onResize = () => { half = track.scrollWidth / 2; };
      window.addEventListener("resize", onResize);
      mEl.addEventListener("mouseenter", () => (hover = true));
      mEl.addEventListener("mouseleave", () => (hover = false));
      const vio = new IntersectionObserver((e) => (visible = e[0].isIntersecting));
      vio.observe(mEl);
      let raf = 0;
      const mTick = (now: number) => {
        const dt = Math.min(48, now - lastT) / 1000; lastT = now;
        const y = window.scrollY; const dy = y - lastY; lastY = y;
        if (visible) {
          vel += dy * 5.5; vel *= 0.93;
          pos += ((hover ? 0 : 38) + vel) * dt;
          if (half > 0) pos = ((pos % half) + half) % half;
          track.style.transform = `translateX(${-pos}px)`;
        }
        raf = requestAnimationFrame(mTick);
      };
      raf = requestAnimationFrame(mTick);
      cleanups.push(() => { cancelAnimationFrame(raf); vio.disconnect(); window.removeEventListener("resize", onResize); });
    }

    // The send demo: pinned by CSS, scrubbed here.
    const stage = document.querySelector<HTMLElement>("[data-stage]");
    if (stage && window.innerWidth > 880) {
      const steps = q<HTMLElement>("[data-step]");
      const amt = stage.querySelector<HTMLElement>("[data-amt]");
      const done = stage.querySelector<HTMLElement>("[data-done]");
      const card = stage.querySelector<HTMLElement>("[data-card]");
      const apply = (p: number) => {
        const c = (v: number) => Math.max(0, Math.min(1, v));
        if (amt) amt.textContent = `$${(c(p / 0.2) * 40).toFixed(2)}`;
        steps.forEach((s, i) => { if (p >= 0.24 + i * 0.15) s.dataset.on = ""; else delete s.dataset.on; });
        if (done) { if (p >= 0.88) done.dataset.on = ""; else delete done.dataset.on; }
        if (card) card.style.transform = `translateY(${(0.5 - p) * 26}px)`;
      };
      const st = ScrollTrigger.create({ trigger: stage, start: "top top", end: "bottom bottom", scrub: true, onUpdate: (self) => apply(self.progress) });
      apply(0);
      cleanups.push(() => st.kill());
    } else {
      q<HTMLElement>("[data-step]").forEach((s) => (s.dataset.on = ""));
      q<HTMLElement>("[data-done]").forEach((s) => (s.dataset.on = ""));
    }

    // The closing panel grows to full size as it arrives, then its content rises.
    const close = document.querySelector<HTMLElement>("[data-close]");
    if (close) {
      const st = ScrollTrigger.create({
        trigger: close, start: "top 90%", end: "top 35%", scrub: true,
        onUpdate: (self) => {
          const e = self.progress * self.progress * (3 - 2 * self.progress);
          close.style.transform = `scale(${0.94 + 0.06 * e})`;
          close.style.opacity = String(0.85 + 0.15 * e);
          if (self.progress > 0.7) close.dataset.close = "in";
        },
      });
      cleanups.push(() => st.kill());
    }

    ScrollTrigger.refresh();
    return () => cleanups.forEach((f) => f());
  }, [pathname]);

  return null;
}
