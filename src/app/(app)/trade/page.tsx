"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import TokenSearch from "@/components/token/TokenSearch";
import PositionsList from "@/components/token/PositionsList";
import { getBalance, getPortfolio, getPositions, getHouseBudget, getCredits, type FullPortfolio, type Position, type HouseBudget, type CreditsSummary } from "@/lib/api";
import { useLaunch } from "@/components/LaunchProvider";
import { fmtMc } from "@/components/token/format";

/** One-tap entry points: majors and the stocks credit may trade. Each opens the chart with the Buy row. */
const MAJORS: Array<{ mint: string; symbol: string; name: string }> = [
  { mint: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij", symbol: "cbBTC", name: "Bitcoin" },
  { mint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs", symbol: "WETH", name: "Ethereum" },
  { mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", symbol: "mSOL", name: "Staked SOL" },
  { mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", symbol: "jitoSOL", name: "Jito SOL" },
  { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", name: "Dollar" },
];
const STOCKS: Array<{ mint: string; symbol: string; name: string }> = [
  { mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", symbol: "NVDAx", name: "NVIDIA" },
  { mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", symbol: "SPYx", name: "S&P 500" },
  { mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", symbol: "TSLAx", name: "Tesla" },
  { mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ", symbol: "AAPLx", name: "Apple" },
];

interface CpTok { mint: string; symbol: string; name: string; imageUrl: string | null; marketCapUsd: number | null; volume24hUsd: number | null }
function CpTile({ t }: { t: CpTok }) {
  return (
    <Link href={`/token/${t.mint}`} className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 transition hover:border-ring hover:bg-paper">
      {t.imageUrl ? <img src={t.imageUrl} alt="" className="h-8 w-8 rounded-full bg-card object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-btn text-xs text-grey">{t.symbol.slice(0, 2)}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{t.symbol} <span className="font-normal text-grey">{t.name}</span></span>
        <span className="block text-xs text-grey">{t.marketCapUsd != null ? `${fmtMc(t.marketCapUsd)} MC` : ""}{t.volume24hUsd != null ? ` · ${fmtMc(t.volume24hUsd)} 24h` : ""}</span>
      </span>
      <span className="text-xs text-grey">Buy →</span>
    </Link>
  );
}

function Tile({ mint, symbol, name }: { mint: string; symbol: string; name: string }) {
  return (
    <Link href={`/token/${mint}`} className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 transition hover:border-ring hover:bg-paper">
      <span><span className="text-sm font-semibold text-ink">{symbol}</span><span className="ml-2 text-xs text-grey">{name}</span></span>
      <span className="text-xs text-grey">Buy →</span>
    </Link>
  );
}

function TradeScreen({ platformId }: { platformId: string }) {
  const router = useRouter();
  const { launched, fundingOpen } = useLaunch();
  const [main, setMain] = useState<FullPortfolio | null>(null);
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [house, setHouse] = useState<HouseBudget | null>(null);
  const [credits, setCredits] = useState<CreditsSummary | null>(null);
  const [ca, setCa] = useState("");
  const [cp, setCp] = useState<CpTok[] | null>(null);
  useEffect(() => { fetch("/api/clawpump/verified", { cache: "no-store" }).then((r) => r.json()).then((j) => setCp(j.tokens ?? [])).catch(() => setCp([])); }, []);

  useEffect(() => {
    getBalance(platformId).then((b) => { if (b.saidWallet) void getPortfolio(b.saidWallet).then(setMain).catch(() => {}); }).catch(() => {});
    getPositions(platformId).then(setPositions).catch(() => {});
    getHouseBudget(platformId).then(setHouse).catch(() => {});
    getCredits(platformId).then(setCredits).catch(() => {});
  }, [platformId]);

  const houseUsd = house?.portfolio?.totalUsdValue ?? 0;
  const openCa = (e: React.FormEvent) => { e.preventDefault(); const s = ca.trim(); if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) router.push(`/token/${s}`); };

  return (
    <div className="mx-auto max-w-3xl px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(var(--tabbar-h)+1.5rem)] md:px-8 md:pt-10 md:pb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Trade</h1>
          <p className="mt-1 text-sm text-zinc-400">Paste a contract address or pick a token. One click buys; the passport refuses fakes first.</p>
        </div>
        {credits?.funded && (
          <div className="rounded-xl border border-line bg-card px-4 py-2.5 text-right">
            <div className="text-[11px] uppercase tracking-wider text-grey">Funded budget</div>
            <div className="text-lg font-semibold tabular-nums text-white">${houseUsd.toFixed(2)}</div>
            <div className="text-[11px] text-zinc-500">{credits.limits.tradeLeft > 0 ? `$${credits.limits.tradeLeft.toFixed(0)} of $${credits.limits.trade} left today` : "daily allowance used"}</div>
          </div>
        )}
      </div>

      {/* Paste a CA: the fastest path. */}
      <form onSubmit={openCa} className="mb-3 flex gap-2">
        <input value={ca} onChange={(e) => setCa(e.target.value)} placeholder="Paste a contract address" spellCheck={false} className="min-w-0 flex-1 rounded-xl border border-line bg-card px-4 py-3 font-mono text-sm text-ink placeholder:font-sans placeholder:text-grey focus:border-ink focus:outline-none" />
        <button type="submit" disabled={!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca.trim())} className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-cream transition hover:bg-coral-deep disabled:opacity-40">Open</button>
      </form>
      <div className="mb-8 flex items-center gap-3">
        <TokenSearch />
        <span className="text-xs text-grey">or search by name</span>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Majors <span className="ml-2 text-xs font-normal text-grey">the deep ones; a funded budget can trade any token the passport clears</span></h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{MAJORS.map((t) => <Tile key={t.mint} {...t} />)}</div>
      </section>
      {cp && cp.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">ClawPump verified <span className="ml-2 text-xs font-normal text-grey">teams ClawPump knows, up to a quarter of a funded budget each</span></h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{cp.slice(0, 12).map((t) => <CpTile key={t.mint} t={t} />)}</div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Stocks <span className="ml-2 text-xs font-normal text-grey">tokenised, the real ones; the passport knows the copies</span></h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{STOCKS.map((t) => <Tile key={t.mint} {...t} />)}</div>
      </section>

      {house?.wallet && house.portfolio && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Funded budget positions <span className="ml-2 text-xs font-normal text-grey">credit · {launched && fundingOpen ? "live" : "rehearsal"}</span></h2>
          <PositionsList holdings={house.portfolio.tokens} positions={house.positions} solBalance={house.portfolio.solBalance} solUsd={house.portfolio.solUsdValue ?? null} />
        </section>
      )}
      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Your positions</h2>
        {main ? (
          <PositionsList holdings={main.tokens} positions={positions} solBalance={main.solBalance} solUsd={main.solUsdValue ?? null} />
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">{[0, 1].map((i) => <div key={i} className="h-16 animate-pulse bg-card" />)}</div>
        )}
      </section>
    </div>
  );
}

export default function TradePage() {
  return <AuthGate>{(platformId) => <TradeScreen platformId={platformId} />}</AuthGate>;
}
