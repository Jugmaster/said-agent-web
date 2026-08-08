"use client";

/**
 * Custom market-cap line chart — hand-rolled SVG, no charting lib, no
 * DexScreener embed. Renders the price/MC series as a smooth line with a soft
 * area gradient and a value tag at the line's end (Fomo-style). `vector-effect`
 * keeps the stroke crisp under non-uniform scaling so it's fully responsive.
 */

export interface ChartPoint {
  t: number; // unix seconds
  value: number; // market cap (USD)
}

export default function TokenChart({
  points,
  label,
  height = 260,
  loading = false,
}: {
  points: ChartPoint[];
  label?: string; // formatted current value for the end tag
  height?: number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-zinc-600">
        Loading chart…
      </div>
    );
  }
  if (points.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-zinc-600">
        No chart data for this timeframe.
      </div>
    );
  }

  const W = 1000;
  const H = 300;
  const padY = 10;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.abs(max) || 1;

  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => padY + (1 - (v - min) / range) * (H - padY * 2);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(p.value).toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  const up = values[values.length - 1] >= values[0];
  const color = up ? "#34d399" : "#f87171";
  const lastYpct = (y(values[values.length - 1]) / H) * 100;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="tokenchart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#tokenchart-fill)" />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <div
          className="pointer-events-none absolute right-0 -translate-y-1/2 rounded px-1.5 py-0.5 text-[11px] font-semibold text-black"
          style={{ top: `${lastYpct}%`, backgroundColor: color }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
