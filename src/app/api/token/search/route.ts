import { NextResponse } from "next/server";

/** Token search by name, symbol or mint, Solana only, via DexScreener. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`, { next: { revalidate: 30 } });
    if (!r.ok) return NextResponse.json({ results: [] });
    const j = await r.json();
    const seen = new Set<string>();
    const results = ((j?.pairs ?? []) as any[])
      .filter((p) => p.chainId === "solana" && p.baseToken?.address)
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))
      .filter((p) => (seen.has(p.baseToken.address) ? false : (seen.add(p.baseToken.address), true)))
      .slice(0, 10)
      .map((p) => ({
        mint: p.baseToken.address,
        symbol: p.baseToken.symbol,
        name: p.baseToken.name,
        imageUrl: p.info?.imageUrl ?? null,
        priceUsd: p.priceUsd != null ? Number(p.priceUsd) : null,
        marketCapUsd: p.marketCap ?? null,
        liquidityUsd: p.liquidity?.usd ?? null,
        change24h: p.priceChange?.h24 ?? null,
      }));
    return NextResponse.json({ results }, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
