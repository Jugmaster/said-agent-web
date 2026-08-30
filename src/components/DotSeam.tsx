"use client";

import { useEffect, useRef } from "react";

/**
 * The animated dot seam that separates a surface header from its content.
 *
 * Carries the dot-field identity from the protocol site into the app. Dots
 * fade out toward both horizontal ends and toward the top/bottom edges, so
 * the band reads as a seam rather than a block. Colour is resolved per frame
 * from the theme attribute, which means the toggle needs no re-mount.
 *
 * Respects prefers-reduced-motion by painting a single static frame instead
 * of animating.
 */
export default function DotSeam({ height = 56 }: { height?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const x = c.getContext("2d");
    if (!x) return;

    const dp = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let t = Math.random() * 10;
    let raf = 0;

    const size = () => {
      const r = c.getBoundingClientRect();
      if (!r.width) return;
      w = c.width = Math.round(r.width * dp);
      h = c.height = Math.round(height * dp);
    };

    const draw = () => {
      const r = c.getBoundingClientRect();
      if (r.width && Math.round(r.width * dp) !== c.width) size();
      if (!c.width || !c.height) return;
      const SP = 11 * dp;
      const cols = Math.ceil(w / SP);
      const rows = Math.ceil(h / SP);
      const dark = document.documentElement.dataset.theme !== "light";
      x.clearRect(0, 0, w, h);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const v = (Math.sin(col * 0.13 + t) + Math.cos(row * 0.5 + t * 1.25) + 2) / 4;
          // Vertical falloff from the band's centre line.
          const ey = 1 - Math.abs(((row + 0.5) / rows) * 2 - 1);
          // Horizontal falloff over the outer ~16% at each end.
          const ex = Math.min(1, Math.min(col, cols - 1 - col) / (cols * 0.16));
          const a = (0.05 + v * 0.3) * ey * ex;
          if (a < 0.02) continue;
          x.beginPath();
          x.arc(col * SP + SP / 2, row * SP + SP / 2, (0.5 + v * 1.5) * dp, 0, Math.PI * 2);
          x.fillStyle = `hsla(40,${dark ? 4 : 6}%,${
            dark ? Math.round(30 + v * 50) : Math.round(64 - v * 50)
          }%,${a})`;
          x.fill();
        }
      }
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ro = new ResizeObserver(size);
    ro.observe(c);
    size();

    if (reduced) {
      draw();
    } else {
      const loop = () => {
        raf = requestAnimationFrame(loop);
        t += 0.012;
        draw();
      };
      loop();
    }

    window.addEventListener("resize", size);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", size);
    };
  }, [height]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ display: "block", width: "100%", height, marginTop: 26 }}
    />
  );
}
