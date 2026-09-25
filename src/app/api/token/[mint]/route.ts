import { NextResponse } from "next/server";
import { cached } from "@/lib/server-cache";

/**
 * Token stats for the token page: DexScreener for the live numbers and the
 * pair, GeckoTerminal for the pool id the chart reads from. Server-side so
 * the browser never talks to either, cached a minute.
 */
export const revalidate = 60;

const SOL = "So11111111111111111111111111111111111111112";

export interface TokenStats {
  mint: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  /** Across every Solana pool the token sits in, either side. */
  liquidityUsd: number | null;
  /** The main pool alone (the one the chart reads). */
  mainPoolLiquidityUsd: number | null;
  pools: number;
  volume24hUsd: number | null;
  change: { m5: number | null; h1: number | null; h6: number | null; h24: number | null };
  txns24h: { buys: number; sells: number };
  buyers24h: number | null;
  sellers24h: number | null;
  supply: number | null;
  pairAddress: string | null;
  dex: string | null;
  poolId: string | null;
  createdAt: string | null;
  launchpad: string | null;
  websites: string[];
  socials: Array<{ type: string; url: string }>;
}

export async function GET(_req: Request, { params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return NextResponse.json({ error: "bad mint" }, { status: 400 });
  try {
    const out = await cached(`stats:${mint}`, 60_000, async () => {
    const [ds, gt] = await Promise.all([
      cached(`ds:${mint}`, 30_000, () => fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))).catch(() => null),
      cached(`gtpools:${mint}`, 300_000, () => fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mint}/pools?page=1`, { headers: { accept: "application/json" }, cache: "no-store" }).then((r) => { if (r.status === 429) throw new Error("gt 429"); return r.ok ? r.json() : null; })).catch(() => null),
    ]);
    const all: any[] = (ds?.pairs ?? []).filter((p: any) => p.chainId === "solana" && (p.baseToken?.address === mint || p.quoteToken?.address === mint));
    const pairs: any[] = all.filter((p: any) => p.baseToken?.address === mint);
    pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
    const p = pairs[0] ?? all.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0] ?? null;
    const totalLiquidity = all.length ? all.reduce((s: number, x: any) => s + (x.liquidity?.usd ?? 0), 0) : null;
    const totalVolume = all.length ? all.reduce((s: number, x: any) => s + (x.volume?.h24 ?? 0), 0) : null;
    const pools: any[] = gt?.data ?? [];
    const pool = pools.find((x) => x.attributes?.address === p?.pairAddress) ?? pools[0] ?? null;
    const tx = pool?.attributes?.transactions?.h24 ?? null;
    const out: TokenStats = {
      mint,
      symbol: p?.baseToken?.symbol ?? (mint === SOL ? "SOL" : mint.slice(0, 4)),
      name: p?.baseToken?.name ?? (mint === SOL ? "Solana" : mint.slice(0, 8)),
      imageUrl: p?.info?.imageUrl ?? null,
      priceUsd: p?.priceUsd != null ? Number(p.priceUsd) : pool ? Number(pool.attributes.base_token_price_usd) : null,
      marketCapUsd: p?.marketCap ?? (pool?.attributes?.market_cap_usd != null ? Number(pool.attributes.market_cap_usd) : null),
      fdvUsd: p?.fdv ?? (pool?.attributes?.fdv_usd != null ? Number(pool.attributes.fdv_usd) : null),
      liquidityUsd: totalLiquidity ?? (pool?.attributes?.reserve_in_usd != null ? Number(pool.attributes.reserve_in_usd) : null),
      mainPoolLiquidityUsd: p?.liquidity?.usd ?? (pool?.attributes?.reserve_in_usd != null ? Number(pool.attributes.reserve_in_usd) : null),
      pools: all.length || (pool ? 1 : 0),
      volume24hUsd: totalVolume ?? (pool?.attributes?.volume_usd?.h24 != null ? Number(pool.attributes.volume_usd.h24) : null),
      change: { m5: p?.priceChange?.m5 ?? null, h1: p?.priceChange?.h1 ?? null, h6: p?.priceChange?.h6 ?? null, h24: p?.priceChange?.h24 ?? null },
      txns24h: { buys: p?.txns?.h24?.buys ?? tx?.buys ?? 0, sells: p?.txns?.h24?.sells ?? tx?.sells ?? 0 },
      buyers24h: tx?.buyers ?? null,
      sellers24h: tx?.sellers ?? null,
      supply: p?.marketCap && p?.priceUsd ? Math.round(p.marketCap / Number(p.priceUsd)) : null,
      pairAddress: p?.pairAddress ?? pool?.attributes?.address ?? null,
      dex: p?.dexId ?? pool?.relationships?.dex?.data?.id ?? null,
      poolId: pool?.attributes?.address ?? p?.pairAddress ?? null,
      createdAt: p?.pairCreatedAt ? new Date(p.pairCreatedAt).toISOString() : pool?.attributes?.pool_created_at ?? null,
      launchpad: Array.isArray(p?.labels) && p.labels.length ? p.labels.join(", ") : (p?.dexId === "pumpfun" || p?.dexId === "pumpswap" ? "pump.fun" : null),
      websites: (p?.info?.websites ?? []).map((w: any) => w.url).filter(Boolean),
      socials: (p?.info?.socials ?? []).map((s: any) => ({ type: s.type, url: s.url })).filter((s: any) => s.url),
    };
    return out;
    });
    return NextResponse.json(out, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 502 });
  }
}
