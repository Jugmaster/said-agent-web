"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getBalance,
  getPortfolio,
  getActivity,
  type BalanceResponse,
  type FullPortfolio,
  type ActivityReceipt,
} from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import FundModal from "@/components/FundModal";
import { truncMiddle, timeAgo, actionLabel } from "@/lib/format";
import { requestRefresh } from "@/lib/refresh";

function fmtUsd(v: number | null | undefined): string {
  if (v == null || v <= 0) return "$—";
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function walletUsdTotal(p: FullPortfolio | null): number {
  if (!p) return 0;
  const tokens = p.tokens.reduce((sum, t) => sum + (t.usdValue ?? 0), 0);
  return (p.solUsdValue ?? 0) + tokens;
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, []);
  return { copied, copy };
}

function PortfolioScreen({ platformId }: { platformId: string }) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [main, setMain] = useState<FullPortfolio | null>(null); // SAID identity wallet
  const [agentcash, setAgentcash] = useState<FullPortfolio | null>(null);
  const [purch, setPurch] = useState<FullPortfolio | null>(null);
  const [receipts, setReceipts] = useState<ActivityReceipt[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [funding, setFunding] = useState(false);
  const { copied, copy } = useCopy();

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const b = await getBalance(platformId);
      setBalance(b);
      await Promise.all([
        b.saidWallet ? getPortfolio(b.saidWallet).then(setMain).catch(() => {}) : Promise.resolve(),
        b.agentcashWallet ? getPortfolio(b.agentcashWallet).then(setAgentcash).catch(() => {}) : Promise.resolve(),
        b.purchWallet ? getPortfolio(b.purchWallet).then(setPurch).catch(() => {}) : Promise.resolve(),
        getActivity(platformId).then((a) => setReceipts(a.receipts.slice(0, 8))).catch(() => setReceipts([])),
      ]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    } finally {
      setRefreshing(false);
    }
  }, [platformId]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const total = walletUsdTotal(main) + walletUsdTotal(agentcash) + walletUsdTotal(purch);
  const holdings = (main?.tokens ?? []).filter((t) => t.balance > 0).sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

  return (
    <div className="flex min-h-dvh">
      {/* MAIN */}
      <div className="min-w-0 flex-1 overflow-y-auto px-5 pt-24 md:px-8 md:pt-10 pb-[calc(var(--tabbar-h)+1.5rem)] md:pb-12">
        {/* Hero */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span>Total value</span>
              {balance?.verified ? (
                <span className="text-emerald-400">· Verified</span>
              ) : balance?.registered ? (
                <span className="text-amber-400">· Registered</span>
              ) : null}
            </div>
            <div className="mt-1 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {main == null && !error ? <span className="text-zinc-700">$·····</span> : fmtUsd(total)}
            </div>
            <div className="mt-1.5 text-sm text-zinc-400">
              {main ? `${main.solBalance.toFixed(4)} SOL · ${holdings.length} token${holdings.length === 1 ? "" : "s"}` : "—"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void load()} disabled={refreshing} className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-zinc-500 disabled:opacity-40">
              {refreshing ? "Refreshing…" : "↻ Refresh"}
            </button>
            {balance?.saidWallet ? (
              <button onClick={() => setFunding(true)} className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200">
                Add funds
              </button>
            ) : (
              <Link href="/fund" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200">
                Set up agent
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        {/* Holdings */}
        <section className="mb-9">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Holdings</h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            {main == null && !error ? (
              <div className="divide-y divide-zinc-800/60">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse bg-zinc-900/40" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                <HoldingRow symbol="SOL" balance={main?.solBalance ?? 0} usd={main?.solUsdValue ?? null} />
                {holdings.map((t) => (
                  <HoldingRow key={t.mint} symbol={t.symbol} balance={t.balance} usd={t.usdValue} />
                ))}
                {holdings.length === 0 && (main?.solBalance ?? 0) === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-zinc-500">
                    Nothing here yet.{" "}
                    <button onClick={() => setFunding(true)} className="text-zinc-300 underline underline-offset-2 hover:text-white">
                      Add funds
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Sub-wallets */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Agent wallets</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SubWallet label="SAID identity" chain="Solana · Privy" address={balance?.saidWallet ?? null} value={walletUsdTotal(main)} onCopy={copy} copied={copied} primary />
            <SubWallet label="AgentCash" chain="Base · API spend" address={balance?.agentcashWallet ?? null} value={walletUsdTotal(agentcash)} onCopy={copy} copied={copied} />
            <SubWallet label="Purch" chain="Solana · Commerce" address={balance?.purchWallet ?? null} value={walletUsdTotal(purch)} onCopy={copy} copied={copied} />
          </div>
        </section>

        {/* Aside content inline on smaller screens */}
        <div className="mt-9 xl:hidden">
          <RecentActivity receipts={receipts} />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-zinc-800/60 p-5 pt-10 xl:flex">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-zinc-800 text-sm font-semibold text-white">
              {(balance?.displayName ?? "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{balance?.displayName ?? "Your agent"}</div>
              <div className="text-xs">
                {balance?.verified ? <span className="text-emerald-400">● Verified</span> : balance?.registered ? <span className="text-amber-400">● Registered</span> : <span className="text-zinc-500">○ Unverified</span>}
                {balance && balance.proTier > 0 && <span className="ml-2 text-amber-400">Pro</span>}
              </div>
            </div>
          </div>
          {balance?.saidWallet && (
            <button onClick={() => void copy(balance.saidWallet!)} className="mt-3 w-full rounded-lg border border-zinc-800/70 bg-zinc-950/50 px-3 py-2 text-left font-mono text-xs text-zinc-500 hover:text-zinc-300">
              {truncMiddle(balance.saidWallet, 6, 6)} {copied ? "✓" : ""}
            </button>
          )}
          {balance?.saidPda && (
            <Link href={`/agents/${encodeURIComponent(balance.platformId)}`} className="mt-3 block rounded-lg border border-zinc-800 py-2 text-center text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white">
              Public profile →
            </Link>
          )}
        </section>
        <RecentActivity receipts={receipts} />
      </aside>

      {funding && balance?.saidWallet && (
        <FundModal
          walletAddress={balance.saidWallet}
          onClose={() => setFunding(false)}
          onFunded={() => {
            requestRefresh();
            void load();
          }}
        />
      )}
    </div>
  );
}

function HoldingRow({ symbol, balance, usd }: { symbol: string; balance: number; usd: number | null }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900/40 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
        {symbol.slice(0, 3).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{symbol}</div>
        <div className="truncate text-xs text-zinc-500">
          {balance.toLocaleString(undefined, { maximumFractionDigits: balance < 1 ? 6 : 4 })}
        </div>
      </div>
      <div className="text-right text-sm font-medium text-zinc-200">{usd != null && usd > 0 ? fmtUsd(usd) : "—"}</div>
    </div>
  );
}

function SubWallet({
  label,
  chain,
  address,
  value,
  onCopy,
  copied,
  primary,
}: {
  label: string;
  chain: string;
  address: string | null;
  value: number;
  onCopy: (a: string) => void;
  copied: boolean;
  primary?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${primary ? "border-zinc-700 bg-zinc-900/60" : "border-zinc-800 bg-zinc-900/30"}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-[11px] text-zinc-500">{chain}</span>
      </div>
      {address ? (
        <>
          <button onClick={() => onCopy(address)} title={address} className="mt-2 font-mono text-xs text-zinc-500 transition hover:text-zinc-300">
            {truncMiddle(address, 6, 6)} {copied ? "✓" : ""}
          </button>
          <div className="mt-3 text-lg font-semibold text-white">{value > 0 ? fmtUsd(value) : "—"}</div>
        </>
      ) : (
        <p className="mt-2 text-xs italic text-zinc-600">not provisioned</p>
      )}
    </div>
  );
}

function RecentActivity({ receipts }: { receipts: ActivityReceipt[] | null }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Recent activity</h2>
        <Link href="/activity" className="text-[11px] text-zinc-500 transition hover:text-zinc-300">View all →</Link>
      </div>
      {receipts === null ? (
        <p className="text-xs text-zinc-600">Loading…</p>
      ) : receipts.length === 0 ? (
        <p className="text-xs italic text-zinc-600">Nothing on-chain yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {receipts.map((r) => {
            const label = actionLabel(r.type);
            return (
              <div key={r.seq} className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                <span className="text-base leading-none">{label.emoji}</span>
                <span className={`flex-1 text-sm font-medium ${label.color}`}>{label.text}</span>
                <span className="text-[11px] text-zinc-500">{timeAgo(r.occurredAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function PortfolioPage() {
  return <AuthGate>{(platformId) => <PortfolioScreen platformId={platformId} />}</AuthGate>;
}
