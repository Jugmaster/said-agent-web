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
import { usePrivy, useLoginWithTelegram } from "@privy-io/react-auth";
import { useAgent } from "@/hooks/useAgent";
// Solana-specific fundWallet — the root useFundWallet is EVM-only and resolves
// the chain to NaN for Solana addresses. The /solana variant + the
// SolanaFundingPlugin (registered in providers.tsx) handle Solana destinations
// natively.
import { useFundWallet } from "@privy-io/react-auth/solana";

// Telegram WebApp SDK types — use the same shape src/lib/identity.ts declares,
// extended with the methods this page actually uses (close, expand).
// Accessing via `(...)` casts keeps us forward-compatible with the SDK without
// fighting TypeScript's structural type checking.
interface TelegramWebApp {
  ready: () => void;
  close: () => void;
  expand: () => void;
  initData?: string;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
}

export default function FundOnrampPage() {
  const { ready, authenticated, login, user, linkTelegram } = usePrivy();
  const { login: loginWithTelegram } = useLoginWithTelegram();
  const { fundWallet } = useFundWallet();
  const agent = useAgent();
  const [wallet, setWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "funding" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isTelegram, setIsTelegram] = useState(false);
  const [initDataRaw, setInitDataRaw] = useState<string | null>(null);
  const [autoAuthAttempted, setAutoAuthAttempted] = useState(false);

  // Read URL params + initialize Telegram WebApp SDK
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawW = params.get("wallet");
    // The wallet param comes from a URL anyone can craft — a link on our real
    // domain must never route a card payment to an arbitrary address. Shape
    // check here; hard ownership check against the session's own agent below.
    const w = rawW && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(rawW) ? rawW : null;
    const a = params.get("amount");
    setWallet(w);
    setAmount(a);

    const tg = (window.Telegram?.WebApp as TelegramWebApp | undefined) ?? null;
    if (tg) {
      setIsTelegram(true);
      tg.ready?.();
      tg.expand?.();
      // Capture the signed initData payload — Privy uses this to silently
      // authenticate the user via @saidinfrabot's HMAC instead of showing
      // an OAuth popup. Requires the bot token registered in Privy dashboard.
      if (tg.initData) setInitDataRaw(tg.initData);
    }

    setPhase(w ? "ready" : "error");
    if (!w) setErrorMsg("Missing or invalid wallet address in URL.");
  }, []);

  // Auto-auth: when we're inside Telegram and not yet authenticated, trigger
  // the headless Privy Telegram login. With @saidinfrabot's token configured
  // in Privy dashboard and BotFather domain set, Privy verifies WebApp.initData
  // server-side and creates the session WITHOUT a popup.
  useEffect(() => {
    if (!ready || !isTelegram || authenticated || autoAuthAttempted) return;
    setAutoAuthAttempted(true);
    loginWithTelegram().catch((err) => {
      console.warn("[fund-onramp] auto-auth failed:", err);
      // Fall through — user can still tap "Continue to payment" which will
      // trigger the regular login() path with the visible Privy modal.
    });
  }, [ready, isTelegram, authenticated, autoAuthAttempted, loginWithTelegram]);

  // After auth, opportunistically link Telegram if the user doesn't have it
  // attached yet — covers the case where a user logged in via email/X on the
  // web and is now opening the Mini App. Cheap no-op if already linked.
  useEffect(() => {
    if (!authenticated || !isTelegram || !initDataRaw) return;
    if (user?.telegram?.telegramUserId) return;
    try {
      linkTelegram({ launchParams: { initDataRaw } });
    } catch (err) {
      console.warn("[fund-onramp] linkTelegram failed:", err);
    }
  }, [authenticated, isTelegram, initDataRaw, user, linkTelegram]);

  async function start(): Promise<void> {
    if (!wallet) return;

    // Ownership check: once the session's own agent resolves, the destination
    // MUST be that agent's wallet. A crafted ?wallet= link on our domain must
    // never route someone's card payment to a stranger's address.
    if (authenticated) {
      if (agent.status !== "ready") {
        setErrorMsg("Still linking your agent — try again in a few seconds.");
        return;
      }
      if (!agent.walletAddress || agent.walletAddress !== wallet) {
        setPhase("error");
        setErrorMsg(
          "This funding link doesn't match your agent's wallet. Ask your agent for a fresh funding link (say \"fund\" in chat).",
        );
        return;
      }
    }

    // Run Privy's EMBEDDED onramp in place — no browser bounce. Privy mounts
    // the card/MoonPay flow in an in-app iframe (it ships its own MoonPay
    // merchant key), so the user funds without leaving the Telegram Mini App.
    // fundWallet on-ramps to ANY Solana address, so funding the butler-managed
    // agent wallet works even though it isn't the session's own embedded
    // wallet. Inside Telegram this is the whole point — keep the spark.
    if (!authenticated) {
      // Need a Privy session to launch the onramp. Inside Telegram the
      // initData auto-auth above usually handles this; if it hasn't landed
      // yet, prompt the Telegram login explicitly.
      login({ loginMethods: ["telegram"] } as Parameters<typeof login>[0]);
      return;
    }
    setPhase("funding");
    try {
      await fundWallet({
        address: wallet,
        options: {
          // Jump straight to the card flow (MoonPay) — skip the method picker.
          defaultFundingMethod: "card",
          card: { preferredProvider: "moonpay" },
          asset: "native-currency",
          ...(amount ? { amount } : {}),
        } as unknown as Parameters<typeof fundWallet>[0]["options"],
      });
      setPhase("done");
      // Privy's Solana fundWallet resolves when the onramp UI opens, NOT when
      // payment completes — so we don't tg.close() here (would yank the flow
      // mid-checkout). The deposit-monitor DMs the user when SOL actually
      // lands on-chain.
    } catch (err) {
      setPhase("error");
      const raw = err instanceof Error ? err.message : String(err);
      // Defensive fallback — if any chain/funding resolution issue slips
      // through, show the wallet address so the user can fund manually
      // instead of staring at a raw error string.
      if (raw.toLowerCase().includes("nan") || raw.toLowerCase().includes("chain")) {
        setErrorMsg(
          `Card onramp unavailable right now. Send SOL to your agent wallet from any wallet or exchange:\n\n${wallet}`,
        );
      } else {
        setErrorMsg(raw);
      }
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
        <p className="text-sm font-medium mb-2">Payment window open</p>
        <p className="text-xs text-zinc-400 mb-6 max-w-xs text-center">
          Complete your card payment in the window that just opened. SOL lands
          in your wallet ~30 seconds after payment confirms; I&apos;ll DM you
          when it does.
        </p>
        <button
          onClick={close}
          className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 transition"
        >
          Done — back to chat
        </button>
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
