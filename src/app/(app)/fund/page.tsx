"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { getBalance, type BalanceResponse } from "@/lib/api";
import AuthGate from "@/components/AuthGate";

const VERIFY_AMOUNT_SOL = 0.015;

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

    // Poll every 5s for verification status
    pollRef.current = setInterval(async () => {
      const b = await load();
      if (b?.verified) {
        if (pollRef.current) clearInterval(pollRef.current);
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
    // Solana Pay URI — wallet apps recognize this and prefill amount
    const uri = `solana:${wallet}?amount=${VERIFY_AMOUNT_SOL}&label=Verify%20Agent&message=Activate%20your%20SAID%20agent`;
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
    <main className="px-4 pt-24 md:px-8 md:pt-10 pb-[calc(var(--tabbar-h)+1rem)] md:pb-12 max-w-md md:max-w-lg mx-auto w-full">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Activate your agent</h1>
        <Link
          href="/portfolio"
          className="text-xs px-3 py-1 rounded-md border border-zinc-700 hover:border-zinc-500"
        >
          Back
        </Link>
      </header>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}

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
          <p className="text-xs text-zinc-400 mb-4">
            On-chain identity active. Pro features unlocked.
          </p>
          <Link
            href="/chat"
            className="inline-block text-sm px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition"
          >
            Open chat →
          </Link>
        </div>
      )}

      {balance && !balance.verified && balance.saidWallet && (
        <>
          <p className="text-sm text-zinc-400 mb-6">
            Send <span className="text-zinc-100 font-medium">{VERIFY_AMOUNT_SOL} SOL</span> to
            your agent&apos;s wallet to activate it. Verification happens automatically
            within ~30 seconds of the deposit landing.
          </p>

          {qrSvg && (
            <div className="flex justify-center mb-6">
              <div
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">Wallet address</span>
              <button
                onClick={copyAddress}
                className="text-xs px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700"
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <code className="text-xs text-zinc-300 break-all block">
              {balance.saidWallet}
            </code>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-500">
            <p className="mb-2">
              <span className="text-zinc-300">Tip:</span> Scan the QR with any
              Solana wallet app (Phantom, Solflare, Backpack) to auto-fill the amount.
            </p>
            <p>
              Watching this address — when {VERIFY_AMOUNT_SOL} SOL arrives, your
              agent will activate automatically. You can leave this page open.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span>Awaiting deposit…</span>
          </div>
        </>
      )}

      {balance && !balance.saidWallet && (
        <div className="bg-yellow-950/30 border border-yellow-900 rounded-xl px-4 py-3 text-sm text-yellow-300">
          Your agent doesn&apos;t have a wallet yet. Open chat and say hi — your
          agent gets provisioned on first message.
          <Link
            href="/chat"
            className="mt-3 inline-block text-sm px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition text-white"
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
