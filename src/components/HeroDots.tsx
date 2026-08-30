"use client";

import { useEffect, useRef } from "react";

/**
 * Full-viewport dot field behind the landing hero.
 *
 * The dots are sampled from the logo's alpha channel, so the field *is* the
 * mark rather than a generic grid. Scroll or swipe intent scatters them
 * outward and they settle back when the intent decays, which is the only
 * "scroll" feedback on a page that has nothing below the fold.
 *
 * Theme is read per frame from the root attribute (no attribute = dark, which
 * is this app's convention), so the toggle needs no re-mount.
 *
 * Under prefers-reduced-motion the field is drawn once, settled and static.
 */
export default function HeroDots() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const cx = cv.getContext("2d");
    if (!cx) return;

    const dp = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    let dots: {
      x: number; y: number; sx: number; sy: number; ph: number; sp: number;
    }[] = [];
    let t = Math.random() * 10;
    let scatter = 0;
    let raf = 0;

    const img = new Image();
    img.src = "/logo-white.png";

    const build = () => {
      W = cv.width = Math.round(window.innerWidth * dp);
      H = cv.height = Math.round(window.innerHeight * dp);
      if (!img.naturalWidth) return;
      const size = Math.min(window.innerHeight * 0.78, window.innerWidth * 0.6) * dp;
      const ox = (W - size) / 2;
      const oy = (H - size) / 2;
      const N = 42; // dots per side
      const oc = document.createElement("canvas");
      oc.width = oc.height = N;
      const og = oc.getContext("2d");
      if (!og) return;
      og.drawImage(img, 0, 0, N, N);
      const px = og.getImageData(0, 0, N, N).data;
      dots = [];
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          // Skip transparent pixels: what remains traces the mark.
          if (px[(r * N + c) * 4 + 3] < 90) continue;
          const a = Math.random() * Math.PI * 2;
          dots.push({
            x: ox + ((c + 0.5) / N) * size,
            y: oy + ((r + 0.5) / N) * size,
            sx: Math.cos(a) * (120 + Math.random() * 380) * dp,
            sy: Math.sin(a) * (120 + Math.random() * 380) * dp,
            ph: Math.random() * Math.PI * 2,
            sp: 0.6 + Math.random() * 0.8,
          });
        }
      }
    };

    const paint = () => {
      if (!dots.length) return;
      const dark = document.documentElement.dataset.theme !== "light";
      const e = 1 - Math.pow(1 - scatter, 2);
      cx.clearRect(0, 0, W, H);
      for (const d of dots) {
        const v = (Math.sin(d.ph + t * d.sp * 1.6) + 1) / 2;
        const a = (0.05 + v * 0.12) * (1 - e * 0.9);
        if (a < 0.004) continue;
        cx.beginPath();
        cx.arc(d.x + d.sx * e, d.y + d.sy * e, (0.7 + v * 1.5) * dp, 0, Math.PI * 2);
        cx.fillStyle = dark ? `hsla(40,8%,80%,${a})` : `hsla(40,8%,18%,${a})`;
        cx.fill();
      }
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    img.onload = () => {
      build();
      if (reduced) paint();
    };
    build();
    window.addEventListener("resize", build);

    const bump = (d: number) => {
      scatter = Math.min(1, scatter + Math.abs(d) / 900);
    };
    let ty0: number | null = null;
    const onWheel = (e: WheelEvent) => bump(e.deltaY);
    const onTouchStart = (e: TouchEvent) => {
      ty0 = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (ty0 != null) {
        bump((ty0 - e.touches[0].clientY) * 3);
        ty0 = e.touches[0].clientY;
      }
    };

    if (!reduced) {
      window.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      const render = () => {
        raf = requestAnimationFrame(render);
        t += 0.012;
        scatter *= 0.94;
        paint();
      };
      render();
    } else {
      paint();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
