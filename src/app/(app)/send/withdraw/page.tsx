"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import {
  useWallets,
  useSignTransaction,
  useExportWallet,
} from "@privy-io/react-auth/solana";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

// Recovery/withdraw for the Privy EMBEDDED wallet — the wallet created by the
// browser login itself. Accounts onboarded via the claim path before the
// hosting-provisioning fix (2026-08-12) hold funds ONLY here, and the butler
// can never sign for this wallet: the key lives in Privy's iframe and releases
// signatures to the logged-in user alone. So this page builds the transfer,
// asks Privy for a signature client-side, and broadcasts it directly to RPC —
// no butler, no fee, user's own custody end to end.

const RPCS = [
  "https://solana-rpc.publicnode.com",
  "https://api.mainnet-beta.solana.com",
];

const TX_FEE_LAMPORTS = 5000;

async function rpc(method: string, params: unknown[]): Promise<any> {
  let lastErr: unknown = null;
  for (const url of RPCS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error.message ?? "rpc error");
      return j.result;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("all RPCs failed");
}

function isValidSolanaAddress(s: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) return false;
  try {
    new PublicKey(s);
    return true;
  } catch {
    return false;
  }
}

function short(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function WithdrawPage() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();
  const { exportWallet } = useExportWallet();

  const [selected, setSelected] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [dest, setDest] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [sig, setSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wallet = wallets.find((w) => w.address === selected) ?? wallets[0];

  const loadBalances = useCallback(async () => {
    const next: Record<string, number> = {};
    for (const w of wallets) {
      try {
        const r = await rpc("getBalance", [w.address]);
        next[w.address] = (r?.value ?? 0) / 1e9;
      } catch {
        // leave missing — renders as "?"
      }
    }
    setBalances(next);
  }, [wallets]);

  useEffect(() => {
    if (wallets.length) loadBalances();
  }, [wallets, loadBalances]);

  const balance = wallet ? balances[wallet.address] : undefined;
  const maxSol =
    balance != null
      ? Math.max(0, (balance * 1e9 - TX_FEE_LAMPORTS) / 1e9)
      : null;

  const amountNum = parseFloat(amount);
  // maxSol unknown (balance read failed) blocks submit — signing a tx against
  // an unknown balance just burns the user's time on a doomed broadcast.
  const canSend =
    !!wallet &&
    isValidSolanaAddress(dest.trim()) &&
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    maxSol != null &&
    amountNum <= maxSol + 1e-12 &&
    !busy;

  async function handleSend() {
    if (!wallet || !canSend) return;
    setBusy(true);
    setError(null);
    setSig(null);
    try {
      const from = new PublicKey(wallet.address);
      const to = new PublicKey(dest.trim());
      const lamports = Math.round(amountNum * 1e9);

      const blockhashInfo = await rpc("getLatestBlockhash", [{ commitment: "finalized" }]);
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports })
      );
      tx.feePayer = from;
      tx.recentBlockhash = blockhashInfo.value.blockhash;

      const unsigned = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      // Privy signs in its iframe — the key never touches this app.
      const { signedTransaction } = await signTransaction({
        transaction: new Uint8Array(unsigned),
        wallet,
        chain: "solana:mainnet",
      });

      // Broadcast ourselves: no dependency on Privy's RPC configuration.
      const b64 = btoa(String.fromCharCode(...signedTransaction));
      const signature = await rpc("sendTransaction", [
        b64,
        { encoding: "base64", skipPreflight: false, maxRetries: 3 },
      ]);
      setSig(signature);
      setAmount("");
      setTimeout(loadBalances, 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-[60vh] px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-10">
          <h2 className="text-2xl font-bold mb-2">Withdraw from your login wallet.</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Log in with the same account that received the funds — the wallet
            belongs to that login.
          </p>
          <button
            onClick={login}
            className="px-5 py-2.5 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-semibold hover:bg-white"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Withdraw</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Send SOL out of the embedded wallet created by this login. You sign in
          the Privy window — your key never leaves it. No fee; only the network
          cost (~0.000005 SOL).
        </p>
      </div>

      {wallets.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-sm text-zinc-400">
          No embedded wallet on this login yet. If your funds arrived on a
          different account, log out and back in with that exact account
          (same X / Telegram / email).
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
              From wallet
            </div>
            <div className="space-y-2">
              {wallets.map((w) => (
                <button
                  key={w.address}
                  onClick={() => setSelected(w.address)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left ${
                    wallet?.address === w.address
                      ? "border-zinc-500 bg-zinc-800"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <span className="font-mono text-sm">{short(w.address)}</span>
                  <span className="text-sm text-zinc-300">
                    {balances[w.address] != null
                      ? `${balances[w.address].toFixed(6)} SOL`
                      : "…"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-zinc-500 mb-2">
                Destination address
              </label>
              <input
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                placeholder="Solana address"
                spellCheck={false}
                className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none font-mono text-sm"
              />
              {dest.trim() && !isValidSolanaAddress(dest.trim()) && (
                <p className="text-xs text-red-400 mt-1.5">
                  That doesn&apos;t look like a valid Solana address.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-zinc-500 mb-2">
                Amount (SOL)
              </label>
              <div className="flex gap-2">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/^\./, "0."))}
                  placeholder="0.0"
                  inputMode="decimal"
                  className="flex-1 px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none text-sm"
                />
                <button
                  onClick={() => maxSol != null && setAmount(maxSol.toFixed(9).replace(/0+$/, "").replace(/\.$/, ""))}
                  disabled={maxSol == null || maxSol <= 0}
                  className="px-4 py-3 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                >
                  Max
                </button>
              </div>
              {maxSol != null && (
                <p className="text-xs text-zinc-500 mt-1.5">
                  Max {maxSol.toFixed(6)} SOL (balance minus network fee)
                </p>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full py-3 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-semibold hover:bg-white disabled:opacity-40"
            >
              {busy ? "Signing…" : "Sign & send"}
            </button>

            {sig && (
              <div className="text-sm text-emerald-400 break-all">
                Sent.{" "}
                <a
                  href={`https://solscan.io/tx/${sig}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  View on Solscan
                </a>
              </div>
            )}
            {error && <div className="text-sm text-red-400 break-all">{error}</div>}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <button
              onClick={() => wallet && exportWallet({ address: wallet.address })}
              className="underline hover:text-zinc-300"
            >
              Export private key instead
            </button>
            <Link href="/send" className="underline hover:text-zinc-300">
              Back to Send
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
