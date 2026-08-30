"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DotSeam from "@/components/DotSeam";
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
    <section className="card">
      <div className="idrow">
        <span className="av">{(balance?.displayName ?? "A").slice(0, 1).toUpperCase()}</span>
        <span className="min-w-0 flex-1">
          <b className="truncate">{balance?.displayName ?? "Your agent"}</b>
          <span className="text-xs">
            {balance?.verified ? <span className="vchip">● Verified</span> : balance?.registered ? <span className="text-[var(--warn)]">● Registered</span> : <span className="text-[var(--faint)]">○ Unverified</span>}
            {balance && balance.proTier > 0 && <span className="ml-2 text-[var(--warn)]">Pro</span>}
          </span>
        </span>
      </div>
      {balance?.saidWallet && (
        <button onClick={() => void copy(balance.saidWallet!)} className="addr">
          {truncMiddle(balance.saidWallet, 6, 6)} {copied ? "✓" : "⧉"}
        </button>
      )}
      {balance?.saidPda && (
        <Link href={`/agents/${encodeURIComponent(balance.platformId)}`} className="outline">
          Public profile →
        </Link>
      )}
    </section>
  );

  return (
    <div className="surface">
      {/* MAIN */}
      <div className="col min-w-0 flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="head">
          <div>
            <div className="kickm">
              Wallet
              {balance?.verified ? (
                <> · <span style={{ color: "var(--good)" }}>verified</span></>
              ) : balance?.registered ? (
                <> · <span style={{ color: "var(--warn)" }}>registered</span></>
              ) : null}
            </div>
            <div className="big">
              {main == null && !error ? <span className="text-[var(--faint)]">$·····</span> : fmtUsd(total)}
            </div>
            <div className="subline">
              {main ? (
                <>
                  {main.solBalance.toFixed(4)} SOL<i>·</i>{holdings.length} token{holdings.length === 1 ? "" : "s"}
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => void load()} disabled={refreshing} className="ghost disabled:opacity-40">
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            {balance?.saidWallet ? (
              <button onClick={() => setFunding(true)} className="fill">Add funds</button>
            ) : (
              <Link href="/fund" className="fill">Set up agent</Link>
            )}
          </div>
        </div>

        <DotSeam />

        {error && (
          <div className="mt-6 rounded-[14px] border border-[rgba(224,108,90,.35)] bg-[rgba(224,108,90,.08)] px-4 py-3 text-sm text-[#e06c5a]">{error}</div>
        )}

        {/* Holdings */}
        <section className="sect" style={{ marginTop: 0 }}>
          <div className="head"><span className="h2">Holdings</span><Link href="/activity" className="more">Activity →</Link></div>
          <>
            {main == null && !error ? (
              <div className="grid3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="hold animate-pulse" style={{ height: 73 }} />
                ))}
              </div>
            ) : (
              <div className="grid3">
                <HoldingRow symbol="SOL" balance={main?.solBalance ?? 0} usd={main?.solUsdValue ?? null} />
                {holdings.map((t) => (
                  <HoldingRow key={t.mint} symbol={t.symbol} balance={t.balance} usd={t.usdValue} />
                ))}
                {holdings.length === 0 && (main?.solBalance ?? 0) === 0 && (
                  <div className="hold justify-center text-sm text-[var(--faint)]">
                    Nothing here yet.{" "}
                    <button onClick={() => setFunding(true)} className="ml-1 text-[var(--ink)] underline underline-offset-2">
                      Add funds
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
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
      <aside className="rail hidden shrink-0 overflow-y-auto xl:flex">
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
    <div className="hold">
      <span className="tok">{symbol.slice(0, 3).toUpperCase()}</span>
      <span className="m">
        <b className="truncate">{symbol}</b>
        <span className="truncate">
          {balance.toLocaleString(undefined, { maximumFractionDigits: balance < 1 ? 6 : 4 })}
        </span>
      </span>
      <span className="usd">{usd != null && usd > 0 ? fmtUsd(usd) : "—"}</span>
    </div>
  );
}

function RecentActivity({ receipts }: { receipts: ActivityReceipt[] | null }) {
  return (
    <section>
      <div className="head">
        <span className="lbl">Recent activity</span>
        <Link href="/activity" className="more">View all →</Link>
      </div>
      {receipts === null ? (
        <p className="mt-2 text-xs text-[var(--faint)]">Loading…</p>
      ) : receipts.length === 0 ? (
        <p className="mt-2 text-xs italic text-[var(--faint)]">Nothing on-chain yet.</p>
      ) : (
        <div className="qlist">
          {receipts.map((r) => {
            const label = actionLabel(r.type);
            return (
              <div key={r.seq} className="actrow">
                <span className="text-base leading-none">{label.emoji}</span>
                <span className="flex-1">{label.text}</span>
                <span className="when">{timeAgo(r.occurredAt)}</span>
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
