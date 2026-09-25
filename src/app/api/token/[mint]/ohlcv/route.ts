import { NextResponse } from "next/server";
import { cached } from "@/lib/server-cache";

/**
 * Candles for the token page from GeckoTerminal (free, no key, ~30 req/min),
 * by the token's top pool. `tf` = 1m | 5m | 15m | 1h | 4h | 1d. Returned as
 * [time(s), open, high, low, close, volume] ascending.
 */
const TF: Record<string, { path: string; aggregate: number }> = {
  "1m": { path: "minute", aggregate: 1 },
  "5m": { path: "minute", aggregate: 5 },
  "15m": { path: "minute", aggregate: 15 },
  "1h": { path: "hour", aggregate: 1 },
  "4h": { path: "hour", aggregate: 4 },
  "1d": { path: "day", aggregate: 1 },
};

export async function GET(req: Request, { params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const url = new URL(req.url);
  const tf = TF[url.searchParams.get("tf") ?? "15m"] ?? TF["15m"];
  const limit = Math.min(1000, Number(url.searchParams.get("limit") ?? 300) || 300);
  let pool = url.searchParams.get("pool");
  try {
    if (!pool) {
      const gt = await cached(`gtpools:${mint}`, 300_000, () => fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mint}/pools?page=1`, { headers: { accept: "application/json" }, cache: "no-store" }).then((r) => { if (r.status === 429) throw new Error("gt 429"); return r.ok ? r.json() : null; })).catch(() => null);
      pool = gt?.data?.[0]?.attributes?.address ?? null;
    }
    if (!pool) return NextResponse.json({ candles: [], pool: null, error: "no pool" }, { headers: { "Cache-Control": "public, max-age=30" } });
    const key = `ohlcv:${pool}:${tf.path}:${tf.aggregate}:${limit}`;
    const candles = await cached<number[][]>(key, 25_000, async () => {
      const r = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/ohlcv/${tf.path}?aggregate=${tf.aggregate}&limit=${limit}&currency=usd`,
        { headers: { accept: "application/json" }, cache: "no-store" },
      );
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const j = await r.json();
      const list: number[][] = j?.data?.attributes?.ohlcv_list ?? [];
      return list.map((c) => c.map(Number)).sort((a, b) => a[0] - b[0]);
    });
    return NextResponse.json({ candles, pool }, { headers: { "Cache-Control": "public, max-age=15, s-maxage=30" } });
  } catch (err) {
    // Rate-limited with nothing cached: tell the client to try again shortly rather than "no chart".
    const msg = err instanceof Error ? err.message : "failed";
    return NextResponse.json({ candles: [], pool, error: msg, retryIn: /429/.test(msg) ? 8 : null }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
