"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getBalance,
  getOnChainBalances,
  type BalanceResponse,
  type OnChainBalances,
} from "@/lib/api";
import { getPlatformId } from "@/lib/identity";

interface WalletState {
  address: string | null;
  chain: string;
  balances: OnChainBalances | null;
  loading: boolean;
}

function WalletCard({
  label,
  state,
}: {
  label: string;
  state: WalletState;
}) {
  const total =
    state.balances && (state.balances.sol > 0 || state.balances.usdc > 0);
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-neutral-500">{state.chain}</span>
      </div>
      {state.address ? (
        <>
          <code className="text-xs text-neutral-500 break-all block">
            {state.address}
          </code>
          {state.loading ? (
            <p className="text-xs text-neutral-600 mt-2">Loading balances…</p>
          ) : state.balances ? (
            total ? (
              <div className="mt-3 flex gap-4 text-sm">
                {state.balances.sol > 0 && (
                  <div>
                    <span className="text-neutral-400">SOL </span>
                    <span className="font-medium">
                      {state.balances.sol.toFixed(4)}
                    </span>
                  </div>
                )}
                {state.balances.usdc > 0 && (
                  <div>
                    <span className="text-neutral-400">USDC </span>
                    <span className="font-medium">
                      {state.balances.usdc.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-600 mt-2 italic">empty</p>
            )
          ) : null}
        </>
      ) : (
        <span className="text-xs text-neutral-500 italic">not provisioned</span>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletStates, setWalletStates] = useState<Record<string, WalletState>>(
    {}
  );

  useEffect(() => {
    const id = getPlatformId();
    getBalance(id)
      .then(async (b) => {
        setBalance(b);
        const initial: Record<string, WalletState> = {
          said: { address: b.saidWallet, chain: "Solana · Privy", balances: null, loading: !!b.saidWallet },
          agentcash: { address: b.agentcashWallet, chain: "Solana · AgentCash", balances: null, loading: !!b.agentcashWallet },
          purch: { address: b.purchWallet, chain: "Solana · Purch", balances: null, loading: !!b.purchWallet },
        };
        setWalletStates(initial);

        // Fetch on-chain balances in parallel for any provisioned wallet
        const fetches: Array<Promise<[string, OnChainBalances | null]>> = [];
        for (const [key, state] of Object.entries(initial)) {
          if (state.address) {
            fetches.push(
              getOnChainBalances(state.address)
                .then((bal) => [key, bal] as [string, OnChainBalances])
                .catch(() => [key, null] as [string, null])
            );
          }
        }
        const results = await Promise.all(fetches);
        setWalletStates((prev) => {
          const next = { ...prev };
          for (const [key, bal] of results) {
            next[key] = { ...next[key], balances: bal, loading: false };
          }
          return next;
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100 px-4 py-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Wallet</h1>
          <p className="text-xs text-neutral-500 mt-1">
            {balance?.displayName ?? "your agent"}
            {balance && balance.proTier > 0 && (
              <span className="ml-2 text-yellow-400">· Pro</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/activity"
            className="text-xs px-3 py-1 rounded-md border border-neutral-700 hover:border-neutral-500"
          >
            Activity
          </Link>
          <Link
            href="/chat"
            className="text-xs px-3 py-1 rounded-md border border-neutral-700 hover:border-neutral-500"
          >
            Chat
          </Link>
        </div>
      </header>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}

      {error && (
        <div className="bg-red-950/30 border border-red-900 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {balance && (
        <>
          <div className="mb-6 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
            <span className="text-neutral-500">Status: </span>
            {balance.verified ? (
              <span className="text-green-400">verified</span>
            ) : balance.registered ? (
              <span className="text-yellow-400">registered, awaiting verify</span>
            ) : (
              <span className="text-neutral-400">not registered</span>
            )}
            {balance.saidPda && (
              <>
                <span className="text-neutral-700 mx-2">·</span>
                <Link
                  href={`/agents/${encodeURIComponent(balance.platformId)}`}
                  className="text-neutral-400 hover:text-neutral-200"
                >
                  Public profile →
                </Link>
              </>
            )}
          </div>

          <div className="space-y-3">
            <WalletCard label="SAID identity" state={walletStates.said ?? { address: null, chain: "Solana · Privy", balances: null, loading: false }} />
            <WalletCard label="AgentCash" state={walletStates.agentcash ?? { address: null, chain: "Solana · AgentCash", balances: null, loading: false }} />
            <WalletCard label="Purch" state={walletStates.purch ?? { address: null, chain: "Solana · Purch", balances: null, loading: false }} />
          </div>

          <div className="mt-8 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800">
            <h2 className="text-sm font-medium mb-2">Funding</h2>
            <p className="text-xs text-neutral-500 mb-3">
              Top up your agent so it can swap, buy real-world goods, and call paid
              services.
            </p>
            <Link
              href="/fund"
              className="inline-block text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
            >
              Add funds
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
