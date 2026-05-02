"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBalance, type BalanceResponse } from "@/lib/api";
import { getPlatformId } from "@/lib/identity";

function WalletRow({
  label,
  address,
  chain,
}: {
  label: string;
  address: string | null;
  chain: string;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-neutral-500">{chain}</span>
      </div>
      {address ? (
        <code className="text-xs text-neutral-400 break-all block">{address}</code>
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

  useEffect(() => {
    const id = getPlatformId();
    getBalance(id)
      .then(setBalance)
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100 px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Wallet</h1>
          <p className="text-xs text-neutral-500 mt-1">
            {balance?.displayName ?? "your agent"}
          </p>
        </div>
        <Link
          href="/chat"
          className="text-xs px-3 py-1 rounded-md border border-neutral-700 hover:border-neutral-500"
        >
          Back to chat
        </Link>
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
          </div>

          <div className="space-y-3">
            <WalletRow
              label="SAID identity"
              address={balance.saidWallet}
              chain="Solana · Privy"
            />
            <WalletRow
              label="AgentCash"
              address={balance.agentcashWallet}
              chain="BASE"
            />
            <WalletRow
              label="Purch"
              address={balance.purchWallet}
              chain="Solana"
            />
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
