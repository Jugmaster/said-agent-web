"use client";

/**
 * Telegram Mini App funding page.
 *
 * Bot sends an inline_keyboard with web_app buttons pointing here. Telegram
 * opens this page in a webview INSIDE the chat (not Safari). The page reads
 * ?wallet= and optional ?amount= from the URL, then kicks off Privy's funding
 * flow (Moonpay / Coinbase Pay under the hood) targeting the butler-managed
 * wallet as the destination.
 *
 * When the flow completes (or user cancels), the page closes itself via
 * Telegram's WebApp.close() so the user lands back in the chat.
 *
 * Currently private beta (gated by butler-side allowlist).
 */

import { useEffect, useState } from "react";
import { useFundWallet, usePrivy } from "@privy-io/react-auth";

// Telegram WebApp SDK types — use the same shape src/lib/identity.ts declares,
// extended with the methods this page actually uses (close, expand).
// Accessing via `(...)` casts keeps us forward-compatible with the SDK without
// fighting TypeScript's structural type checking.
interface TelegramWebApp {
  ready: () => void;
  close: () => void;
  expand: () => void;
}

export default function FundOnrampPage() {
  const { ready, authenticated, login } = usePrivy();
  const { fundWallet } = useFundWallet();
  const [wallet, setWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "funding" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isTelegram, setIsTelegram] = useState(false);

  // Read URL params + initialize Telegram WebApp SDK
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get("wallet");
    const a = params.get("amount");
    setWallet(w);
    setAmount(a);

    const tg = (window.Telegram?.WebApp as TelegramWebApp | undefined) ?? null;
    if (tg) {
      setIsTelegram(true);
      tg.ready?.();
      tg.expand?.();
    }

    setPhase(w ? "ready" : "error");
    if (!w) setErrorMsg("Missing wallet address in URL.");
  }, []);

  async function start(): Promise<void> {
    if (!wallet) return;
    if (!authenticated) {
      // Privy requires an authed session to fund. If they're not logged in
      // (Mini App context may carry no auth cookie), prompt login first.
      login();
      return;
    }
    setPhase("funding");
    try {
      // Privy v3 useFundWallet signature: fundWallet({ address, options? })
      // Privy will open its onramp modal (Moonpay / Coinbase Pay), user pays
      // via card or Apple Pay, funds settle to `wallet` (butler-managed).
      await fundWallet({
        address: wallet,
        options: amount
          ? ({ amount } as unknown as Parameters<typeof fundWallet>[0]["options"])
          : undefined,
      });
      setPhase("done");
      // Auto-close after success so user lands back in the Telegram chat.
      setTimeout(() => {
        const tg = window.Telegram?.WebApp as TelegramWebApp | undefined;
        tg?.close?.();
      }, 1500);
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  function close(): void {
    const tg = window.Telegram?.WebApp as TelegramWebApp | undefined;
    if (isTelegram && tg?.close) {
      tg.close();
    } else {
      window.history.back();
    }
  }

  if (phase === "loading" || !ready) {
    return (
      <main className="min-h-dvh bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="min-h-dvh bg-zinc-950 text-zinc-100 px-6 py-8 flex flex-col items-center justify-center">
        <p className="text-2xl mb-3">⚠️</p>
        <p className="text-sm text-red-300 mb-2">Couldn&apos;t open funding</p>
        <p className="text-xs text-zinc-400 mb-6 max-w-xs text-center">{errorMsg}</p>
        <button onClick={close} className="text-sm px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500">
          Close
        </button>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="min-h-dvh bg-zinc-950 text-zinc-100 px-6 py-8 flex flex-col items-center justify-center">
        <p className="text-3xl mb-3">✅</p>
        <p className="text-sm font-medium mb-2">Payment submitted</p>
        <p className="text-xs text-zinc-400 mb-6 max-w-xs text-center">
          Funds should land in your wallet in ~30 seconds. I&apos;ll DM you when they do.
        </p>
      </main>
    );
  }

  if (phase === "funding") {
    return (
      <main className="min-h-dvh bg-zinc-950 text-zinc-100 px-6 py-8 flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin mb-4" />
        <p className="text-sm text-zinc-300">Opening payment...</p>
      </main>
    );
  }

  // ready state — show the confirm card
  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100 px-6 py-8">
      <div className="max-w-sm mx-auto">
        <div className="mb-8">
          <p className="text-xs text-zinc-500 mb-1">Fund your agent</p>
          <h1 className="text-3xl font-semibold">
            {amount ? `$${amount}` : "Pick amount"}
          </h1>
          <p className="text-xs text-zinc-500 mt-2 break-all">
            → {wallet?.slice(0, 8)}…{wallet?.slice(-6)}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6 text-xs text-zinc-400 leading-relaxed">
          You&apos;ll pay with card or Apple Pay via Privy&apos;s onramp partner.
          SOL lands in your butler wallet — your agent DMs you the moment it
          confirms (~30 seconds).
          <br />
          <br />
          Card fees ~3-5%. KYC required for amounts over ~$200.
        </div>

        <button
          onClick={() => void start()}
          className="w-full py-3.5 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 transition mb-2"
        >
          Continue to payment →
        </button>

        <button
          onClick={close}
          className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-200 transition"
        >
          Cancel
        </button>
      </div>
    </main>
  );
}
