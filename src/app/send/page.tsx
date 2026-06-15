"use client";

import { useState } from "react";
import Link from "next/link";
import { chat } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import Navbar from "@/components/Navbar";
import { useAgent } from "@/hooks/useAgent";
import { useSendableBalance, maxSendable } from "@/hooks/useSendableBalance";

type Platform = "telegram" | "x";
type Asset = "USDC" | "SOL";

function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

function isLikelyWalletAddress(s: string): boolean {
  // Solana base58 addresses are 32-44 chars and have no @ / no spaces.
  const t = s.trim();
  return !t.includes("@") && !t.includes(" ") && t.length >= 32 && t.length <= 44;
}

function truncMiddle(s: string, head = 6, tail = 6): string {
  return s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
}

// Render the butler's free-text result, but turn the two things that blow out
// the layout into tidy elements: explorer URLs become a short "View on
// Solscan ↗" link, and bare base58 addresses get middle-truncated. Splitting on
// whitespace (kept via the capture group) preserves the original line breaks
// under the parent's whitespace-pre-wrap.
function ResultText({ text }: { text: string }) {
  const tokens = text.split(/(\s+)/);
  return (
    <>
      {tokens.map((tok, i) => {
        if (/^https?:\/\//.test(tok)) {
          const isExplorer = /solscan\.io|solana\.fm|explorer\.solana/.test(tok);
          const label = isExplorer
            ? "View on Solscan ↗"
            : `${truncMiddle(tok.replace(/^https?:\/\//, ""), 16, 6)} ↗`;
          return (
            <a
              key={i}
              href={tok}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80"
            >
              {label}
            </a>
          );
        }
        if (/^[1-9A-HJ-NP-Za-km-z]{32,}$/.test(tok)) {
          return (
            <span key={i} title={tok} className="font-mono">
              {truncMiddle(tok)}
            </span>
          );
        }
        return <span key={i}>{tok}</span>;
      })}
    </>
  );
}

function SendScreen({ platformId }: { platformId: string }) {
  const agent = useAgent();
  const bal = useSendableBalance(
    agent.status === "ready" ? agent.walletAddress : null,
  );
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState<Platform>("telegram");
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState<Asset>("USDC");
  const [walletAddress, setWalletAddress] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    | { kind: "ok"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  const canSubmit =
    !sending &&
    amount.trim().length > 0 &&
    parseFloat(amount) > 0 &&
    (handle.trim().length > 0 || walletAddress.trim().length > 0);

  async function submit(): Promise<void> {
    if (!canSubmit) return;
    setSending(true);
    setResult(null);

    // Build a natural-language command that the butler's LLM router can
    // unambiguously parse into the right tool call. Handle is normalized
    // (no @, lowercased); wallet address fallback overrides handle when
    // provided in advanced mode.
    let cmd: string;
    if (walletAddress.trim()) {
      cmd = `send ${amount} ${asset} to ${walletAddress.trim()}`;
    } else {
      const h = normalizeHandle(handle);
      cmd = `send ${amount} ${asset} to @${h} on ${platform}`;
    }

    try {
      const res = await chat(platformId, cmd);
      setResult({ kind: "ok", message: res.message });
      // Funds just moved — refresh the displayed balance so it isn't stale.
      bal.refetch();
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Send failed.",
      });
    } finally {
      setSending(false);
    }
  }

  // If user pastes a wallet address into the @handle field, gently nudge
  // them to use the advanced fallback so we don't double-route.
  const handleLooksLikeAddress = isLikelyWalletAddress(handle);

  return (
    <div className="flex flex-col mt-24 px-5 pb-24 max-w-md mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Send</h1>
        <p className="text-sm text-zinc-500">
          One handle. Any chain. Your agent figures out the rest.
        </p>
      </div>

      {/* Agent balance — the two sendable assets, live from chain */}
      {agent.status === "ready" && agent.walletAddress && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div>
            <div className="text-xs text-zinc-500 mb-0.5">Your balance</div>
            {bal.error ? (
              <span className="text-sm text-yellow-500">couldn’t load</span>
            ) : bal.loading ? (
              <span className="text-sm text-zinc-500">loading…</span>
            ) : (
              <div className="flex items-baseline gap-3 text-sm">
                <span className="text-zinc-200">{bal.sol.toFixed(4)} SOL</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-200">{bal.usdc.toFixed(2)} USDC</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => bal.refetch()}
            disabled={bal.loading}
            className="text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition"
            aria-label="Refresh balance"
          >
            ↻
          </button>
        </div>
      )}

      {/* Recipient — handle-first */}
      <label className="block text-xs text-zinc-500 mb-2">RECIPIENT</label>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setPlatform("telegram")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
            platform === "telegram"
              ? "border-white bg-white text-black"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
          }`}
        >
          Telegram
        </button>
        <button
          type="button"
          onClick={() => setPlatform("x")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
            platform === "x"
              ? "border-white bg-white text-black"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
          }`}
        >
          X
        </button>
      </div>
      <div className="relative mb-1">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 select-none">
          @
        </span>
        <input
          type="text"
          value={handle.replace(/^@+/, "")}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={platform === "telegram" ? "username" : "handle"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          className="w-full pl-9 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-base placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
        />
      </div>
      {handleLooksLikeAddress && (
        <p className="text-xs text-yellow-500 mb-3">
          Looks like a wallet address — use “advanced” below to send to a raw
          address instead.
        </p>
      )}
      {!handleLooksLikeAddress && handle.trim() && (
        <p className="text-xs text-zinc-500 mb-3">
          If they don’t have a SAID agent yet, your funds stay in your wallet
          and they get an invite link to claim them.
        </p>
      )}
      {!handle.trim() && <div className="mb-3" />}

      {/* Amount + asset */}
      <label className="block text-xs text-zinc-500 mb-2">AMOUNT</label>
      <div className="flex gap-2 mb-1">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="flex-1 px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-base placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
        />
        <div className="flex bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
          {(["USDC", "SOL"] as Asset[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAsset(a)}
              className={`px-4 py-3 text-sm font-semibold transition ${
                asset === a
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6 flex justify-between text-xs text-zinc-500">
        <span>
          {asset === "USDC"
            ? "Sent on Solana, settles in seconds."
            : "Sent on Solana mainnet."}
        </span>
        {agent.status === "ready" && agent.walletAddress && !bal.loading && !bal.error && (
          <button
            type="button"
            onClick={() => {
              const max = maxSendable(asset, bal.sol, bal.usdc);
              setAmount(asset === "SOL" ? max.toFixed(4) : max.toFixed(2));
            }}
            className="font-semibold text-zinc-400 hover:text-white transition"
          >
            Max: {asset === "SOL"
              ? `${maxSendable(asset, bal.sol, bal.usdc).toFixed(4)} SOL`
              : `${maxSendable(asset, bal.sol, bal.usdc).toFixed(2)} USDC`}
          </button>
        )}
      </div>

      {/* Advanced: wallet address fallback */}
      <details
        open={advancedOpen}
        onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
        className="mb-6 border border-zinc-800 rounded-xl px-4 py-3 bg-zinc-900/40"
      >
        <summary className="cursor-pointer text-xs text-zinc-500 select-none">
          Send to a wallet address instead
        </summary>
        <div className="pt-3">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Paste Solana address"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <p className="text-xs text-zinc-500 mt-2">
            Overrides the @handle above when filled.
          </p>
        </div>
      </details>

      {/* Submit */}
      <button
        onClick={() => void submit()}
        disabled={!canSubmit}
        className="w-full py-3.5 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {sending ? "Sending…" : `Send ${amount || "—"} ${asset}`}
      </button>

      {/* Result */}
      {result && (
        <div
          className={`mt-5 px-4 py-3 rounded-xl border whitespace-pre-wrap break-words text-sm ${
            result.kind === "ok"
              ? "border-emerald-700/60 bg-emerald-950/30 text-emerald-200"
              : "border-red-700/60 bg-red-950/30 text-red-200"
          }`}
        >
          <ResultText text={result.message} />
        </div>
      )}

      <p className="mt-8 text-center text-xs text-zinc-600">
        Need something else?{" "}
        <Link href="/chat" className="text-zinc-400 hover:text-white">
          Ask your agent
        </Link>
      </p>
    </div>
  );
}

export default function SendPage() {
  return (
    <>
      <Navbar />
      <AuthGate>
        {(platformId) => <SendScreen platformId={platformId} />}
      </AuthGate>
    </>
  );
}
