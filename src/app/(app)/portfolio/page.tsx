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
  const [main, setMain] = useState<FullPortfolio | null>(null); // the identity wallet — the ONLY one users see
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

  const total = walletUsdTotal(main);
  const holdings = (main?.tokens ?? []).filter((t) => t.balance > 0).sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

  // Rendered in BOTH the desktop aside and the mobile stack: it carries the
  // wallet address and copy button, the only way to fund the agent by hand.
  const identityCard = (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(128,128,128,.22)] to-[rgba(128,128,128,.18)] text-sm font-semibold text-[var(--ink)]">
          {(balance?.displayName ?? "A").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--ink)]">{balance?.displayName ?? "Your agent"}</div>
          <div className="text-xs">
            {balance?.verified ? <span className="text-[var(--good)]">● Verified</span> : balance?.registered ? <span className="text-[var(--warn)]">● Registered</span> : <span className="text-[var(--faint)]">○ Unverified</span>}
            {balance && balance.proTier > 0 && <span className="ml-2 text-[var(--warn)]">Pro</span>}
          </div>
        </div>
      </div>
      {balance?.saidWallet && (
        <button onClick={() => void copy(balance.saidWallet!)} className="mt-3 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-left font-mono text-sm text-[var(--dim)] hover:text-[var(--ink)]">
          {truncMiddle(balance.saidWallet, 6, 6)} {copied ? "✓" : "⧉"}
        </button>
      )}
      {balance?.saidPda && (
        <Link href={`/agents/${encodeURIComponent(balance.platformId)}`} className="mt-3 block rounded-lg border border-[var(--line)] py-3 text-center text-sm font-medium text-[var(--ink)] transition hover:border-[var(--dim)] hover:text-[var(--ink)]">
          Public profile →
        </Link>
      )}
    </section>
  );

  return (
    <div className="flex min-h-dvh">
      {/* MAIN */}
      <div className="min-w-0 flex-1 overflow-y-auto px-5 pt-[max(1.5rem,env(safe-area-inset-top))] md:px-8 md:pt-10 pb-[calc(var(--tabbar-h)+1.5rem)] md:pb-12">
        {/* Hero */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-[var(--faint)]">
              <span>Total value</span>
              {balance?.verified ? (
                <span className="text-[var(--good)]">· Verified</span>
              ) : balance?.registered ? (
                <span className="text-[var(--warn)]">· Registered</span>
              ) : null}
            </div>
            <div className="mt-1 text-4xl font-semibold tracking-tight text-[var(--ink)] md:text-5xl">
              {main == null && !error ? <span className="text-[var(--faint)]">$·····</span> : fmtUsd(total)}
            </div>
            <div className="mt-1.5 text-sm text-[var(--dim)]">
              {main ? `${main.solBalance.toFixed(4)} SOL · ${holdings.length} token${holdings.length === 1 ? "" : "s"}` : "—"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void load()} disabled={refreshing} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink)] transition hover:border-[var(--ink)] disabled:opacity-40">
              {refreshing ? "Refreshing…" : "↻ Refresh"}
            </button>
            {balance?.saidWallet ? (
              <button onClick={() => setFunding(true)} className="rounded-xl bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-85">
                Add funds
              </button>
            ) : (
              <Link href="/fund" className="rounded-xl bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-85">
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
          <h2 className="mb-3 text-sm font-medium text-[var(--ink)]">Holdings</h2>
          <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
            {main == null && !error ? (
              <div className="divide-y divide-[var(--line)]">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse bg-[var(--card)]" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                <HoldingRow symbol="SOL" balance={main?.solBalance ?? 0} usd={main?.solUsdValue ?? null} />
                {holdings.map((t) => (
                  <HoldingRow key={t.mint} symbol={t.symbol} balance={t.balance} usd={t.usdValue} />
                ))}
                {holdings.length === 0 && (main?.solBalance ?? 0) === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-[var(--faint)]">
                    Nothing here yet.{" "}
                    <button onClick={() => setFunding(true)} className="text-[var(--ink)] underline underline-offset-2 hover:text-[var(--ink)]">
                      Add funds
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Aside content inline on smaller screens. The identity card carries
            the wallet address + copy button, which is the only way to fund the
            agent from a phone, so it must not stay desktop-only. */}
        <div className="mt-9 space-y-6 xl:hidden">
          {identityCard}
          <RecentActivity receipts={receipts} />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-[var(--line)] p-5 pt-10 xl:flex">
{identityCard}
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
    <div className="flex items-center gap-3 bg-[var(--card)] px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(128,128,128,.18)] text-xs font-semibold text-[var(--ink)]">
        {symbol.slice(0, 3).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[var(--ink)]">{symbol}</div>
        <div className="truncate text-xs text-[var(--faint)]">
          {balance.toLocaleString(undefined, { maximumFractionDigits: balance < 1 ? 6 : 4 })}
        </div>
      </div>
      <div className="text-right text-sm font-medium text-[var(--ink)]">{usd != null && usd > 0 ? fmtUsd(usd) : "—"}</div>
    </div>
  );
}

function RecentActivity({ receipts }: { receipts: ActivityReceipt[] | null }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--faint)]">Recent activity</h2>
        <Link href="/activity" className="-my-1 py-2 text-sm text-[var(--dim)] transition hover:text-[var(--ink)]">View all →</Link>
      </div>
      {receipts === null ? (
        <p className="text-xs text-[var(--faint)]">Loading…</p>
      ) : receipts.length === 0 ? (
        <p className="text-xs italic text-[var(--faint)]">Nothing on-chain yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {receipts.map((r) => {
            const label = actionLabel(r.type);
            return (
              <div key={r.seq} className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2">
                <span className="text-base leading-none">{label.emoji}</span>
                <span className={`flex-1 text-sm font-medium ${label.color}`}>{label.text}</span>
                <span className="text-[11px] text-[var(--faint)]">{timeAgo(r.occurredAt)}</span>
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
