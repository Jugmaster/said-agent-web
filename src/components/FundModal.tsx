"use client";

/**
 * Native in-PWA funding pop-up.
 *
 * The Telegram Mini App funds via /fund-onramp (reads ?wallet= + Telegram
 * initData, confirms completion by DMing the user). Web/PWA users have neither
 * a URL-passed wallet nor a Telegram channel, so this modal:
 *   - targets the agent's own SAID wallet (passed in, = balance.saidWallet),
 *   - relies on the existing Privy session (rendered behind AuthGate — no login
 *     prompt, no forced Telegram login),
 *   - polls the chain for the deposit to land (no DM to wait on),
 * while reusing the same Privy Solana card on-ramp (MoonPay) the Telegram page
 * uses. Purely additive — it does not touch the /fund-onramp flow.
 */

import { useEffect, useRef, useState } from "react";
import { useFundWallet } from "@privy-io/react-auth/solana";
import { getOnChainBalances } from "@/lib/api";

type Phase = "idle" | "opening" | "waiting" | "done" | "error";

interface FundModalProps {
  /** Destination Solana address — the agent's SAID wallet. */
  walletAddress: string;
  onClose: () => void;
  /** Fired once funds are detected on-chain so the caller can refresh balances. */
  onFunded?: () => void;
}

// ~10 minutes of polling at 8s cadence before we stop watching and tell the
// user their balance will update on its own (card settlement can lag).
const POLL_INTERVAL_MS = 8000;
const MAX_POLLS = 75;

export default function FundModal({ walletAddress, onClose, onFunded }: FundModalProps) {
  const { fundWallet } = useFundWallet();
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [slow, setSlow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const baselineSol = useRef<number | null>(null);

  // Watch the chain for the deposit. Privy's Solana fundWallet resolves when the
  // MoonPay window OPENS, not when payment settles — so this is how a web user
  // learns their money arrived.
  useEffect(() => {
    if (phase !== "waiting") return;
    let cancelled = false;
    let polls = 0;

    const tick = async () => {
      polls += 1;
      try {
        const { sol } = await getOnChainBalances(walletAddress);
        const base = baselineSol.current ?? 0;
        if (!cancelled && sol > base + 1e-6) {
          setPhase("done");
          onFunded?.();
          return;
        }
      } catch {
        // transient RPC hiccup — keep watching
      }
      if (!cancelled && polls >= MAX_POLLS) {
        cancelled = true;
        clearInterval(id);
        setSlow(true); // stop polling; payment may still be settling
      }
    };

    const id = setInterval(tick, POLL_INTERVAL_MS);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, walletAddress, onFunded]);

  async function start(): Promise<void> {
    setPhase("opening");
    setErrorMsg("");
    setSlow(false);
    // Snapshot the balance BEFORE the on-ramp so we can detect the increase.
    const before = await getOnChainBalances(walletAddress).catch(() => ({ sol: 0, usdc: 0 }));
    baselineSol.current = before.sol;
    try {
      await fundWallet({
        address: walletAddress,
        options: {
          // Jump straight to the card flow (MoonPay); user enters the amount in
          // MoonPay's own UI. Mirrors /fund-onramp's proven option shape.
          defaultFundingMethod: "card",
          card: { preferredProvider: "moonpay" },
          asset: "native-currency",
        } as unknown as Parameters<typeof fundWallet>[0]["options"],
      });
      setPhase("waiting");
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setPhase("error");
      // The known Privy Solana failure mode is a chain/NaN resolution error —
      // fall back to a manual-deposit instruction instead of a raw stack string.
      if (raw.toLowerCase().includes("nan") || raw.toLowerCase().includes("chain")) {
        setErrorMsg(
          `Card on-ramp is unavailable right now. You can still fund by sending SOL or USDC to your agent wallet from any wallet or exchange:\n\n${walletAddress}`,
        );
      } else {
        setErrorMsg(raw);
      }
    }
  }

  async function copyAddress(): Promise<void> {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — no-op, address is visible to copy manually
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "idle" && (
          <>
            <p className="text-xs text-zinc-500 mb-1">Add funds</p>
            <h2 className="text-2xl font-semibold mb-4">Buy with card</h2>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 mb-5 text-xs text-zinc-400 leading-relaxed">
              Pay with card or Apple Pay via Privy&apos;s on-ramp partner. SOL
              lands in your agent wallet in ~1–3 minutes — this window updates
              the moment it does.
              <br />
              <br />
              Card fees ~3–5%. KYC may be required.
            </div>
            <button
              onClick={() => void start()}
              className="w-full py-3.5 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 transition mb-2"
            >
              Continue to payment →
            </button>

            <button
              onClick={() => setShowAddress((v) => !v)}
              className="w-full py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition"
            >
              Or send crypto directly
            </button>
            {showAddress && (
              <div className="mt-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3">
                <p className="text-[11px] text-zinc-500 mb-1">
                  Send SOL or USDC (Solana) to:
                </p>
                <code className="text-xs text-zinc-300 break-all block mb-2">
                  {walletAddress}
                </code>
                <button
                  onClick={() => void copyAddress()}
                  className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 hover:border-zinc-500"
                >
                  {copied ? "Copied ✓" : "Copy address"}
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 mt-1 text-sm text-zinc-500 hover:text-zinc-300 transition"
            >
              Cancel
            </button>
          </>
        )}

        {phase === "opening" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin mb-4" />
            <p className="text-sm text-zinc-300">Opening payment…</p>
          </div>
        )}

        {phase === "waiting" && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            {!slow ? (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin mb-4" />
                <p className="text-sm font-medium mb-1">Waiting for your deposit</p>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Finish your card payment in the window that opened. This updates
                  automatically when SOL lands (~1–3 min).
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-3">⏳</p>
                <p className="text-sm font-medium mb-1">Still processing</p>
                <p className="text-xs text-zinc-400 max-w-xs mb-4">
                  Card payments can take a few minutes. You can close this — your
                  balance updates on its own once the payment settles.
                </p>
              </>
            )}
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2.5 text-sm rounded-lg border border-zinc-700 hover:border-zinc-500"
            >
              Close
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-sm font-medium mb-1">Funds added</p>
            <p className="text-xs text-zinc-400 max-w-xs mb-5">
              Your agent is topped up and ready to swap, send, and buy.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 transition"
            >
              Done
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-2xl mb-3">⚠️</p>
            <p className="text-sm text-red-300 mb-2">Couldn&apos;t open card payment</p>
            <p className="text-xs text-zinc-400 mb-5 max-w-xs whitespace-pre-line break-words">
              {errorMsg}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void copyAddress()}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-700 hover:border-zinc-500"
              >
                {copied ? "Copied ✓" : "Copy address"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-700 hover:border-zinc-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
