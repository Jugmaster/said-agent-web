import { NextResponse } from "next/server";
import { cached } from "@/lib/server-cache";

/** Name, logo, price and 24h change for up to 30 mints at once (DexScreener), for the positions list. */
export async function GET(req: Request) {
  const mints = (new URL(req.url).searchParams.get("mints") ?? "").split(",").map((m) => m.trim()).filter((m) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(m)).slice(0, 30);
  if (mints.length === 0) return NextResponse.json({ tokens: {} });
  try {
    const tokens = await cached(`batch:${mints.slice().sort().join(",")}`, 30_000, async () => {
      const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mints.join(",")}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const j = await r.json();
      const out: Record<string, { symbol: string; name: string; imageUrl: string | null; priceUsd: number | null; marketCapUsd: number | null; change24h: number | null }> = {};
      for (const p of (j?.pairs ?? []) as any[]) {
        if (p.chainId !== "solana") continue;
        const a = p.baseToken?.address;
        if (!a || !mints.includes(a)) continue;
        const cur = out[a];
        const liq = p.liquidity?.usd ?? 0;
        if (cur && (cur as any)._liq >= liq) continue;
        out[a] = { symbol: p.baseToken.symbol, name: p.baseToken.name, imageUrl: p.info?.imageUrl ?? null, priceUsd: p.priceUsd != null ? Number(p.priceUsd) : null, marketCapUsd: p.marketCap ?? null, change24h: p.priceChange?.h24 ?? null, ...({ _liq: liq } as object) };
      }
      for (const k of Object.keys(out)) delete (out[k] as any)._liq;
      return out;
    });
    return NextResponse.json({ tokens }, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch {
    return NextResponse.json({ tokens: {} });
  }
}
