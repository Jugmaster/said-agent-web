import { NextResponse } from "next/server";
import { iconUrl } from "@/lib/icon";
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
        out[a] = { symbol: p.baseToken.symbol, name: p.baseToken.name, imageUrl: iconUrl(p.info?.imageUrl), priceUsd: p.priceUsd != null ? Number(p.priceUsd) : null, marketCapUsd: p.marketCap ?? null, change24h: p.priceChange?.h24 ?? null, ...({ _liq: liq } as object) };
      }
      for (const k of Object.keys(out)) delete (out[k] as any)._liq;
      // DexScreener has no picture for many listed tokens (the xStocks among them),
      // and nothing at all for some. Jupiter's token metadata fills those in; a
      // logo does not change, so it is cached for hours rather than seconds.
      const missing = mints.filter((m) => !out[m] || !out[m].imageUrl);
      await Promise.all(missing.map(async (m) => {
        const j = await cached(`jup:${m}`, 6 * 3_600_000, async () => {
          const r = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${m}`, { cache: "no-store" });
          if (!r.ok) throw new Error(`jup ${r.status}`);
          const arr = (await r.json()) as any[];
          const t = arr.find((x) => x?.id === m) ?? null;
          return t ? { symbol: String(t.symbol ?? ""), name: String(t.name ?? ""), icon: iconUrl(t.icon as string | null), priceUsd: t.usdPrice != null ? Number(t.usdPrice) : null, marketCapUsd: t.mcap != null ? Number(t.mcap) : null, change24h: t.stats24h?.priceChange != null ? Number(t.stats24h.priceChange) : null } : null;
        }).catch(() => null);
        if (!j) return;
        if (out[m]) { out[m].imageUrl = out[m].imageUrl ?? j.icon; return; }
        out[m] = { symbol: j.symbol, name: j.name, imageUrl: j.icon, priceUsd: j.priceUsd, marketCapUsd: j.marketCapUsd, change24h: j.change24h };
      }));
      return out;
    });
    return NextResponse.json({ tokens }, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch {
    return NextResponse.json({ tokens: {} });
  }
}
