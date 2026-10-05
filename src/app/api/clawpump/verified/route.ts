import { NextResponse } from "next/server";
import { cached } from "@/lib/server-cache";
import { clawpumpIconUrl } from "@/lib/icon";

export const revalidate = 300;

export interface ClawpumpVerified { mint: string; symbol: string; name: string; imageUrl: string | null; marketCapUsd: number | null; volume24hUsd: number | null; liquidityUsd: number | null; agentName: string | null }

/** ClawPump's verified tokens, by 24h volume: the ones credit may trade under ClawPump's own floor. */
export async function GET() {
  try {
    const out = await cached("clawpump:verified:v2", 300_000, async () => {
      const r = await fetch("https://clawpump.tech/api/tokens?sort=volume24h&period=24h&limit=200", { headers: { accept: "application/json", "user-agent": "atcha" }, cache: "no-store" });
      if (!r.ok) throw new Error(`clawpump ${r.status}`);
      const body = (await r.json()) as { tokens?: any[] };
      return (body.tokens ?? []).filter((t) => t.verified).map((t): ClawpumpVerified => ({
        mint: t.mintAddress, symbol: String(t.symbol ?? ""), name: String(t.name ?? ""), imageUrl: clawpumpIconUrl(t.imageUrl),
        marketCapUsd: t.marketCap != null ? Number(t.marketCap) : null, volume24hUsd: t.volume24h != null ? Number(t.volume24h) : null, liquidityUsd: t.liquidity != null ? Number(t.liquidity) : null,
        agentName: t.agentName ?? null,
      }));
    });
    return NextResponse.json({ tokens: out }, { headers: { "Cache-Control": "public, max-age=120, s-maxage=300" } });
  } catch (err) {
    return NextResponse.json({ tokens: [], error: err instanceof Error ? err.message : "failed" }, { status: 200 });
  }
}
