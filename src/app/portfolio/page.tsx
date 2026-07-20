"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getBalance,
  getPortfolio,
  type BalanceResponse,
  type FullPortfolio,
} from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import Navbar from "@/components/Navbar";
import FundModal from "@/components/FundModal";

interface WalletState {
  address: string | null;
  chain: string;
  portfolio: FullPortfolio | null;
  loading: boolean;
}

function fmtUsd(v: number | null | undefined): string | null {
  if (v == null || v <= 0) return null;
  return `$${v.toFixed(2)}`;
}

function WalletCard({ label, state }: { label: string; state: WalletState }) {
  const p = state.portfolio;
  const hasHoldings =
    p && (p.solBalance > 0 || p.tokens.some((t) => t.balance > 0));
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-zinc-500">{state.chain}</span>
      </div>
      {state.address ? (
        <>
          <code className="text-xs text-zinc-500 break-all block">
            {state.address}
          </code>
          {state.loading ? (
            <p className="text-xs text-zinc-600 mt-2">Loading balances…</p>
          ) : p ? (
            hasHoldings ? (
              <div className="mt-3 space-y-1.5">
                {p.solBalance > 0 && (
                  <div className="flex items-baseline justify-between text-sm">
                    <span>
                      <span className="font-medium">{p.solBalance.toFixed(4)}</span>
                      <span className="text-zinc-400"> SOL</span>
                    </span>
                    {fmtUsd(p.solUsdValue) && (
                      <span className="text-xs text-zinc-500">
                        {fmtUsd(p.solUsdValue)}
                      </span>
                    )}
                  </div>
                )}
                {p.tokens
                  .filter((t) => t.balance > 0)
                  .map((t) => (
                    <div
                      key={t.mint}
                      className="flex items-baseline justify-between text-sm"
                    >
                      <span>
                        <span className="font-medium">
                          {t.balance.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}
                        </span>
                        <span className="text-zinc-400"> {t.symbol}</span>
                      </span>
                      {fmtUsd(t.usdValue) && (
                        <span className="text-xs text-zinc-500">
                          {fmtUsd(t.usdValue)}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 mt-2 italic">empty</p>
            )
          ) : (
            <p className="text-xs text-yellow-600 mt-2">balance unavailable</p>
          )}
        </>
      ) : (
        <span className="text-xs text-zinc-500 italic">not provisioned</span>
      )}
    </div>
  );
}

function PortfolioScreen({ platformId }: { platformId: string }) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [funding, setFunding] = useState(false);
  const [walletStates, setWalletStates] = useState<Record<string, WalletState>>(
    {}
  );

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const b = await getBalance(platformId);
      setBalance(b);
      const addrs: Record<string, { address: string | null; chain: string }> = {
        said: { address: b.saidWallet, chain: "Solana · Privy" },
        agentcash: { address: b.agentcashWallet, chain: "Solana · AgentCash" },
        purch: { address: b.purchWallet, chain: "Solana · Purch" },
      };
      // Seed/merge WITHOUT clobbering balances we already have — only show the
      // "Loading…" spinner on first appearance. Otherwise a refresh (incl. the
      // on-focus one) flashes every card back to loading. Refresh in place.
      setWalletStates((prev) => {
        const next: Record<string, WalletState> = {};
        for (const [key, v] of Object.entries(addrs)) {
          const existing = prev[key];
          next[key] = {
            address: v.address,
            chain: v.chain,
            portfolio: existing?.portfolio ?? null,
            loading: !!v.address && !existing?.portfolio,
          };
        }
        return next;
      });

      // Full portfolio (SOL + all SPL tokens) per provisioned wallet, in parallel.
      const fetches: Array<Promise<[string, FullPortfolio | null]>> = [];
      for (const [key, state] of Object.entries(addrs)) {
        if (state.address) {
          fetches.push(
            getPortfolio(state.address)
              .then((p) => [key, p] as [string, FullPortfolio])
              .catch(() => [key, null] as [string, null])
          );
        }
      }
      const results = await Promise.all(fetches);
      setWalletStates((prev) => {
        const next = { ...prev };
        for (const [key, p] of results) {
          // Keep the prior balance if a refresh fetch failed (p === null) so we
          // don't flash "unavailable" over good data.
          next[key] = { ...next[key], portfolio: p ?? next[key]?.portfolio ?? null, loading: false };
        }
        return next;
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [platformId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh when the tab regains focus so balances aren't stale after a send /
  // swap done elsewhere (chat, Telegram). Fixes the one-shot-on-mount gap.
  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  return (
    <main className="px-4 pt-24 pb-[calc(var(--tabbar-h)+1rem)] md:pb-12 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Wallet</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {balance?.displayName ?? "your agent"}
            {balance && balance.proTier > 0 && (
              <span className="ml-2 text-yellow-400">· Pro</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            disabled={refreshing}
            className="text-xs px-3 py-1 rounded-md border border-zinc-700 hover:border-zinc-500 disabled:opacity-40"
          >
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
          <Link
            href="/activity"
            className="text-xs px-3 py-1 rounded-md border border-zinc-700 hover:border-zinc-500"
          >
            Activity
          </Link>
          <Link
            href="/chat"
            className="text-xs px-3 py-1 rounded-md border border-zinc-700 hover:border-zinc-500"
          >
            Chat
          </Link>
        </div>
      </header>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}

      {error && (
        <div className="bg-red-950/30 border border-red-900 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {balance && (
        <>
          <div className="mb-6 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-500">Status: </span>
            {balance.verified ? (
              <span className="text-green-400">verified</span>
            ) : balance.registered ? (
              <span className="text-yellow-400">registered, awaiting verify</span>
            ) : (
              <span className="text-zinc-400">not registered</span>
            )}
            {balance.saidPda && (
              <>
                <span className="text-zinc-700 mx-2">·</span>
                <Link
                  href={`/agents/${encodeURIComponent(balance.platformId)}`}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  Public profile →
                </Link>
              </>
            )}
          </div>

          <div className="space-y-3">
            <WalletCard label="SAID identity" state={walletStates.said ?? { address: null, chain: "Solana · Privy", portfolio: null, loading: false }} />
            <WalletCard label="AgentCash" state={walletStates.agentcash ?? { address: null, chain: "Solana · AgentCash", portfolio: null, loading: false }} />
            <WalletCard label="Purch" state={walletStates.purch ?? { address: null, chain: "Solana · Purch", portfolio: null, loading: false }} />
          </div>

          <div className="mt-8 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <h2 className="text-sm font-medium mb-2">Funding</h2>
            <p className="text-xs text-zinc-500 mb-3">
              Top up your agent so it can swap, buy real-world goods, and call paid
              services.
            </p>
            {balance.saidWallet ? (
              <button
                onClick={() => setFunding(true)}
                className="inline-block text-sm px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition"
              >
                Add funds
              </button>
            ) : (
              <Link
                href="/fund"
                className="inline-block text-sm px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition"
              >
                Activate agent
              </Link>
            )}
          </div>

          {funding && balance.saidWallet && (
            <FundModal
              walletAddress={balance.saidWallet}
              onClose={() => setFunding(false)}
              onFunded={() => void load()}
            />
          )}
        </>
      )}
    </main>
  );
}

export default function PortfolioPage() {
  return (
    <>
      <Navbar />
      <AuthGate>{(platformId) => <PortfolioScreen platformId={platformId} />}</AuthGate>
    </>
  );
}
