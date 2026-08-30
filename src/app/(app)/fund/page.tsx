"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { getBalance, type BalanceResponse } from "@/lib/api";
import AuthGate from "@/components/AuthGate";


function FundScreen({ platformId }: { platformId: string }) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial load + poll for verification
  useEffect(() => {
    async function load() {
      try {
        const b = await getBalance(platformId);
        setBalance(b);
        return b;
      } catch (e) {
        setError(e instanceof Error ? e.message : "load failed");
        return null;
      } finally {
        setLoading(false);
      }
    }

    load();

    // Poll every 5s for verification status — bounded (~10 min) so a tab
    // parked here doesn't hammer the butler forever.
    let polls = 0;
    pollRef.current = setInterval(async () => {
      const b = await load();
      if ((b?.verified || ++polls >= 120) && pollRef.current) {
        clearInterval(pollRef.current);
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [platformId]);

  // Generate QR when wallet known
  useEffect(() => {
    const wallet = balance?.saidWallet;
    if (!wallet) {
      setQrSvg(null);
      return;
    }
    // Solana Pay URI — wallet apps recognize this and prefill the recipient;
    // the user picks the amount (activation is free, this is just a top-up).
    const uri = `solana:${wallet}?label=Fund%20SAID%20Agent&message=Top%20up%20your%20SAID%20agent`;
    QRCode.toString(uri, {
      type: "svg",
      margin: 1,
      width: 240,
      color: { dark: "#fafafa", light: "#0a0a0a" },
    })
      .then(setQrSvg)
      .catch(() => setQrSvg(null));
  }, [balance?.saidWallet]);

  async function copyAddress() {
    if (!balance?.saidWallet) return;
    await navigator.clipboard.writeText(balance.saidWallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] md:px-8 md:pt-10 pb-[calc(var(--tabbar-h)+1rem)] md:pb-12 max-w-md md:max-w-lg mx-auto w-full">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Fund your agent</h1>
        <Link
          href="/portfolio"
          className="text-xs px-3 py-1 rounded-md border border-[var(--line)] hover:border-[var(--ink)]"
        >
          Back
        </Link>
      </header>

      {loading && <p className="text-sm text-[var(--faint)]">Loading…</p>}

      {error && (
        <div className="bg-red-950/30 border border-red-900 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {balance && balance.verified && (
        <div className="bg-green-950/30 border border-green-900 rounded-xl px-4 py-6 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm font-medium text-green-300 mb-1">
            {balance.displayName ?? "Your agent"} is verified
          </p>
          <p className="text-xs text-[var(--dim)] mb-4">
            On-chain identity active. Pro features unlocked.
          </p>
          <Link
            href="/chat"
            className="inline-block text-sm px-4 py-2 rounded-lg bg-[var(--ink)] text-[var(--bg)] font-semibold hover:opacity-85 transition"
          >
            Open chat →
          </Link>
        </div>
      )}

      {balance && !balance.verified && balance.saidWallet && (
        <>
          <p className="text-sm text-[var(--dim)] mb-6">
            Activation is <span className="text-[var(--ink)] font-medium">free and automatic</span> —
            no deposit needed. Top up your agent&apos;s wallet here so it can
            swap, send, and buy: send SOL or USDC to the address below.
          </p>

          {qrSvg && (
            <div className="flex justify-center mb-6">
              <div
                className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-4"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
          )}

          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--faint)]">Wallet address</span>
              <button
                onClick={copyAddress}
                className="text-xs px-2 py-0.5 rounded bg-[rgba(128,128,128,.18)] hover:bg-[rgba(128,128,128,.22)]"
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <code className="text-xs text-[var(--ink)] break-all block">
              {balance.saidWallet}
            </code>
          </div>

          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-4 py-3 text-xs text-[var(--faint)]">
            <p className="mb-2">
              <span className="text-[var(--ink)]">Tip:</span> Scan the QR with any
              Solana wallet app (Phantom, Solflare, Backpack) to auto-fill the
              address.
            </p>
            <p>
              Your agent verifies its on-chain identity automatically — this
              page updates once it&apos;s active.
            </p>
          </div>
        </>
      )}

      {balance && !balance.saidWallet && (
        <div className="bg-yellow-950/30 border border-yellow-900 rounded-xl px-4 py-3 text-sm text-yellow-300">
          Your agent doesn&apos;t have a wallet yet. Open chat and say hi — your
          agent gets provisioned on first message.
          <Link
            href="/chat"
            className="mt-3 inline-block text-sm px-4 py-2 rounded-lg bg-[var(--ink)] text-[var(--bg)] font-semibold hover:opacity-85 transition"
          >
            Open chat →
          </Link>
        </div>
      )}
    </main>
  );
}

export default function FundPage() {
  return (
    <AuthGate>{(platformId) => <FundScreen platformId={platformId} />}</AuthGate>
  );
}
