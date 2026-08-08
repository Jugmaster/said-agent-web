/**
 * Market data for the token page — GeckoTerminal (free, no key, Solana).
 *
 * One token call gives name/symbol/image/price/market-cap/supply + the top
 * pool; the pool's OHLCV gives the price series we render as a market-cap line
 * (MC ≈ close × supply). Dep-free; swap the base URL for Birdeye later when we
 * want richer data.
 */

const GT = "https://api.geckoterminal.com/api/v2/networks/solana";

export interface TokenMeta {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  imageUrl: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null; // market_cap_usd, falling back to fdv_usd
  fdvUsd: number | null;
  supply: number | null; // normalized_total_supply
  volume24hUsd: number | null;
  topPool: string | null; // pool address for OHLCV
}

const num = (v: unknown): number | null =>
  v == null || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null;

export async function getToken(mint: string): Promise<TokenMeta | null> {
  const res = await fetch(`${GT}/tokens/${encodeURIComponent(mint)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const j = await res.json();
  const a = j?.data?.attributes;
  if (!a) return null;
  const topPoolId: string | undefined = j?.data?.relationships?.top_pools?.data?.[0]?.id;
  return {
    address: a.address,
    name: a.name ?? "Unknown",
    symbol: a.symbol ?? "?",
    decimals: Number(a.decimals ?? 0),
    imageUrl: a.image_url && a.image_url !== "missing.png" ? a.image_url : null,
    priceUsd: num(a.price_usd),
    marketCapUsd: num(a.market_cap_usd) ?? num(a.fdv_usd),
    fdvUsd: num(a.fdv_usd),
    supply: num(a.normalized_total_supply),
    volume24hUsd: num(a.volume_usd?.h24),
    topPool: topPoolId ? topPoolId.replace(/^solana_/, "") : null,
  };
}

export type Timeframe = "1H" | "4H" | "1D" | "7D" | "1M" | "ALL";
export const TIMEFRAMES: Timeframe[] = ["1H", "4H", "1D", "7D", "1M", "ALL"];

// UI timeframe → GeckoTerminal ohlcv path (unit) + aggregate + limit.
const TF: Record<Timeframe, { unit: "minute" | "hour" | "day"; aggregate: number; limit: number }> = {
  "1H": { unit: "minute", aggregate: 1, limit: 60 },
  "4H": { unit: "minute", aggregate: 5, limit: 48 },
  "1D": { unit: "minute", aggregate: 15, limit: 96 },
  "7D": { unit: "hour", aggregate: 1, limit: 168 },
  "1M": { unit: "hour", aggregate: 4, limit: 180 },
  ALL: { unit: "day", aggregate: 1, limit: 365 },
};

export interface Point {
  t: number; // unix seconds
  price: number; // close, USD
}

/** Price series (oldest → newest) for the token's top pool at a timeframe. */
export async function getPriceSeries(pool: string, tf: Timeframe): Promise<Point[]> {
  const c = TF[tf];
  const res = await fetch(
    `${GT}/pools/${encodeURIComponent(pool)}/ohlcv/${c.unit}?aggregate=${c.aggregate}&limit=${c.limit}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) return [];
  const j = await res.json();
  const list: number[][] = j?.data?.attributes?.ohlcv_list ?? [];
  // Newest-first from the API; each row = [ts, open, high, low, close, volume].
  return list
    .map((row) => ({ t: row[0], price: row[4] }))
    .filter((p) => Number.isFinite(p.price))
    .sort((a, b) => a.t - b.t);
}

/** Compact USD formatter for market caps: $378.4K, $1.7M, $12.3B. */
export function fmtUsdCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

/** Valid Solana mint (base58, 32–44 chars). */
export function isMint(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s.trim());
}
