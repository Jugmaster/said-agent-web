'use client';

import { useEffect, useRef } from 'react';

// ═══ 3D Simplex Noise ═══
const grad3 = [
  [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
  [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
  [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1],
];

const p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
const perm = new Array(512).fill(0).map((_, i) => p[i & 255]);

function dot3(g: number[], x: number, y: number, z: number) {
  return g[0] * x + g[1] * y + g[2] * z;
}

function noise3D(x: number, y: number, z: number) {
  const F3 = 1 / 3, G3 = 1 / 6;
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
  const t = (i + j + k) * G3;
  const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) {
    if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; }
    else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; }
    else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; }
  } else {
    if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; }
    else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; }
    else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; }
  }
  const x1=x0-i1+G3, y1=y0-j1+G3, z1=z0-k1+G3;
  const x2=x0-i2+2*G3, y2=y0-j2+2*G3, z2=z0-k2+2*G3;
  const x3=x0-1+3*G3, y3=y0-1+3*G3, z3=z0-1+3*G3;
  const ii=i&255, jj=j&255, kk=k&255;
  const gi0=perm[ii+perm[jj+perm[kk]]]%12;
  const gi1=perm[ii+i1+perm[jj+j1+perm[kk+k1]]]%12;
  const gi2=perm[ii+i2+perm[jj+j2+perm[kk+k2]]]%12;
  const gi3=perm[ii+1+perm[jj+1+perm[kk+1]]]%12;
  let n0=0, n1=0, n2=0, n3=0;
  let t0=0.6-x0*x0-y0*y0-z0*z0;
  if (t0>=0) { t0*=t0; n0=t0*t0*dot3(grad3[gi0],x0,y0,z0); }
  let t1=0.6-x1*x1-y1*y1-z1*z1;
  if (t1>=0) { t1*=t1; n1=t1*t1*dot3(grad3[gi1],x1,y1,z1); }
  let t2=0.6-x2*x2-y2*y2-z2*z2;
  if (t2>=0) { t2*=t2; n2=t2*t2*dot3(grad3[gi2],x2,y2,z2); }
  let t3=0.6-x3*x3-y3*y3-z3*z3;
  if (t3>=0) { t3*=t3; n3=t3*t3*dot3(grad3[gi3],x3,y3,z3); }
  return 32*(n0+n1+n2+n3);
}

// ═══ Dot Grid Background Component ═══
interface DotGridBackgroundProps {
  spacing?: number;
  energy?: number;
  breathe?: number;
  breatheSpeed?: number;
  drift?: boolean;
  driftAmount?: number;
  bg?: string;
}

export default function DotGridBackground({
  spacing = 9,
  energy: energyProp = 0.7,
  breathe: breatheAmp = 0,
  breatheSpeed = 1.5,
  drift = true,
  driftAmount = 0.2,
  bg = '#09090b',
}: DotGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0, cols = 0, rows = 0;
    let time = 0;
    let currentEnergy = energyProp;
    const energyTarget = energyProp;
    const decayRate = 0.04;
    let raf = 0;
    let opacity = 1;
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W;
      canvas!.height = H;
      cols = Math.ceil(W / spacing);
      rows = Math.ceil(H / spacing);
    }

    function onScroll() {
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (y <= vh * 0.5) opacity = 1;
      else if (y >= vh * 2.5) opacity = 0.25;
      else opacity = 1 - ((y - vh * 0.5) / (vh * 2)) * 0.75;
      if (canvas) canvas.style.opacity = String(opacity);
      if (vignetteRef.current) vignetteRef.current.style.opacity = String(opacity);
    }

    function render() {
      raf = requestAnimationFrame(render);
      if (opacity < 0.05) return;

      time += 0.014;
      currentEnergy += (energyTarget - currentEnergy) * decayRate;

      const sp = spacing;
      const t = time;

      // Breathing — sine wave modulating energy
      const breatheVal = breatheAmp * Math.sin(t * breatheSpeed);

      // Drift — slow noise-based energy wandering
      const driftVal = drift ? driftAmount * noise3D(t * 0.3, 0, 0) : 0;

      // Effective energy this frame
      const en = Math.max(0, Math.min(1, currentEnergy + breatheVal + driftVal));

      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, W, H);

      // Constant noise speed
      const speed = 0.12;
      const tb = t * speed;
      const tf = tb * 1.67;
      const tff = tb * 2.5;

      for (let row = 0; row < rows; row++) {
        const py = row * sp;
        const ny = row / rows;
        for (let col = 0; col < cols; col++) {
          const px = col * sp;
          const nx = col / cols;

          // 3-octave noise + local variation
          let n = noise3D(nx * 1.5, ny * 1.5, tb) * 0.55
                + noise3D(nx * 3, ny * 3, tf) * 0.3
                + noise3D(nx * 6, ny * 6, tff) * 0.15;

          // Local variation — prevents uniform grid look
          n += noise3D(nx * 8, ny * 8, t * 0.25) * 0.12;

          let nm = (n + 1) * 0.5;
          if (nm < 0) nm = 0;
          if (nm > 1) nm = 1;

          const total = Math.min(1, nm * (0.25 + en * 0.75));

          // Dot properties — warm amber HSL tint
          const r = 0.5 + total * 3.5;
          const a = 0.08 + total * 0.58;
          const h = Math.round(42 + total * 18);  // 42-60 hue (amber)
          const s = Math.round(3 + total * 25);   // 3-28% saturation
          const l = Math.round(8 + total * 52);   // 8-58% lightness

          ctx!.beginPath();
          ctx!.arc(px, py, r, 0, Math.PI * 2);
          ctx!.fillStyle = `hsla(${h},${s}%,${l}%,${a})`;
          ctx!.fill();
        }
      }
    }

    const onResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 100);
    };

    resize();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      cancelAnimationFrame(raf);
    };
  }, [spacing, energyProp, breatheAmp, breatheSpeed, drift, driftAmount, bg]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
      />
      <div
        ref={vignetteRef}
        style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 30%, rgba(9,9,11,.8) 100%)' }}
      />
    </>
  );
}
