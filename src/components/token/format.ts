/** Number formats for token pages: market cap, and prices down to memecoin dust. */
export function fmtMc(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

const SUB = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉", "₁₀", "₁₁"];

export function fmtPrice(v: number): string {
  if (v >= 1) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  if (v <= 0) return "$0";
  // 0.0₄2783 style for dust prices: count the zeros after the point.
  const s = v.toFixed(12).replace(/0+$/, "");
  const m = s.match(/^0\.(0*)(\d+)$/);
  if (!m) return `$${v}`;
  const zeros = m[1].length;
  const digits = m[2].slice(0, 4);
  return zeros >= 3 ? `$0.0${SUB[zeros] ?? zeros}${digits}` : `$${v.toFixed(zeros + 4)}`;
}
