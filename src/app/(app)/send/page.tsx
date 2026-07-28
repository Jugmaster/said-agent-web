"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { chat } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import MessageText from "@/components/MessageText";
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

function SendSuccessCard({
  amount,
  asset,
  recipient,
  message,
  onSendAnother,
}: {
  amount: string;
  asset: Asset;
  recipient: string;
  message: string;
  onSendAnother: () => void;
}) {
  const txUrl = message.match(/https?:\/\/[^\s)]*solscan[^\s)]*/)?.[0] ?? null;
  const inviteUrl = message.match(/https?:\/\/[^\s)]*\/invite\/[^\s)]*/)?.[0] ?? null;
  // Executed = funds moved on-chain now (recipient is/just-became a butler user).
  // No tx = pending: funds are reserved and auto-deliver when they log in.
  const executed = !!txUrl;

  return (
    <div className="mt-5 rounded-2xl border border-emerald-800/50 bg-gradient-to-b from-emerald-950/40 to-zinc-950 px-5 py-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 text-2xl">
        {executed ? "✓" : "↗"}
      </div>
      <div className="text-lg font-semibold text-white">
        {executed ? "Sent" : "On its way"} {amount} {asset}
      </div>
      <div className="mt-0.5 text-sm text-zinc-400">
        to <span className="text-zinc-200">{recipient}</span>
      </div>

      {executed ? (
        <p className="mt-2 text-xs text-emerald-300/80">
          They’ll see it the moment they open SAID.
        </p>
      ) : (
        <p className="mt-2 text-xs text-zinc-400">
          They’ll get it the moment they open SAID — even if they’re not on it yet.
        </p>
      )}

      <div className="mt-4 flex items-center justify-center gap-3">
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
          >
            View on Solscan ↗
          </a>
        )}
        {!executed && inviteUrl && (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
          >
            Share invite link ↗
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={onSendAnother}
        className="mt-5 w-full rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition"
      >
        Send another
      </button>
    </div>
  );
}

/** Desktop-only sidebar copy: what actually happens when you hit Send. */
function HowItWorksPanel() {
  const steps = [
    {
      title: "Pick a person, not an address",
      body: "Any Telegram or X handle works — they don’t need a wallet, or to have ever heard of SAID.",
    },
    {
      title: "Your agent routes it",
      body: "Funds move on Solana in seconds, with an on-chain receipt you can verify on Solscan.",
    },
    {
      title: "Not on SAID yet?",
      body: "Funds stay reserved in your wallet and they get an invite link. Delivery is automatic the moment they first log in.",
    },
  ];
  return (
    <aside className="hidden lg:flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
          How it works
        </h2>
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[11px] font-semibold text-zinc-400">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium text-zinc-200">{s.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-xs leading-relaxed text-zinc-500">
        <span className="text-zinc-300">Prefer typing?</span> Press{" "}
        <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
          ⌘K
        </kbd>{" "}
        anywhere and just say it — “send 5 USDC to @maya”.
      </div>
    </aside>
  );
}

function SendScreen({ platformId }: { platformId: string }) {
  const agent = useAgent();
  const bal = useSendableBalance(
    agent.status === "ready" ? agent.walletAddress : null,
  );
  // Prefill from query params so a "Tip / Send to this agent" link (e.g. from a
  // public agent page) drops the user into a ready-to-send form. The AuthGate
  // wrapper means a non-user must sign in to send — that sign-in is the hook.
  const params = useSearchParams();
  const [handle, setHandle] = useState(() =>
    (params.get("to") ?? "").replace(/^@+/, ""),
  );
  const [platform, setPlatform] = useState<Platform>(() =>
    params.get("platform") === "x" ? "x" : "telegram",
  );
  const [amount, setAmount] = useState(() => params.get("amount") ?? "");
  const [asset, setAsset] = useState<Asset>(() =>
    params.get("asset") === "SOL" ? "SOL" : "USDC",
  );
  const [walletAddress, setWalletAddress] = useState(
    () => params.get("address") ?? "",
  );
  const [advancedOpen, setAdvancedOpen] = useState(() => !!params.get("address"));
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    | { kind: "ok"; message: string; amount: string; asset: Asset; recipient: string }
    | { kind: "info"; message: string }
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

    const recipient = walletAddress.trim()
      ? walletAddress.trim()
      : `@${normalizeHandle(handle)}`;
    try {
      const res = await chat(platformId, cmd);
      // Butler returns HTTP 200 even when it REFUSES the send (e.g. an
      // unverified sender gets an "activate first" prompt). Only show the
      // success card when there's actual evidence the send happened: a tx
      // signature (executed) or an invite link (pending — funds reserved). A
      // not-sent step, or the absence of both, means nothing moved — show
      // butler's real message instead of a celebratory false success.
      const step = res.context?.step;
      const notSent = step
        ? ["unknown", "awaiting_name", "provisioned", "registered", "registered_unverified"].includes(step)
        : false;
      const hasTx = /solscan|solana\.fm|explorer\.solana/i.test(res.message);
      const hasInvite = /\/invite\/|[?&]start=invite_/i.test(res.message);
      if (!notSent && (hasTx || hasInvite)) {
        setResult({ kind: "ok", message: res.message, amount, asset, recipient });
        // Funds just moved — refresh the displayed balance so it isn't stale.
        bal.refetch();
      } else {
        setResult({ kind: "info", message: res.message });
      }
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
    <div className="mt-24 md:mt-0 md:pt-10 px-5 md:px-8 pb-[calc(var(--tabbar-h)+1.5rem)] md:pb-16 w-full max-w-md lg:max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Send</h1>
        <p className="text-sm text-zinc-500">
          One handle. Any chain. Your agent figures out the rest.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-12 lg:items-start">
        <div className="flex flex-col">
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
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-base sm:text-sm font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
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
            {sending
              ? "Sending…"
              : amount && parseFloat(amount) > 0
                ? `Send ${amount} ${asset}`
                : "Enter an amount to send"}
          </button>

          {/* Result */}
          {result?.kind === "ok" && (
            <SendSuccessCard
              amount={result.amount}
              asset={result.asset}
              recipient={result.recipient}
              message={result.message}
              onSendAnother={() => {
                setResult(null);
                setAmount("");
                setHandle("");
                setWalletAddress("");
              }}
            />
          )}
          {result?.kind === "info" && (
            <div className="mt-5 px-4 py-4 rounded-xl border border-zinc-700 bg-zinc-900/60 text-zinc-200 whitespace-pre-wrap break-words text-sm">
              <MessageText text={result.message} />
            </div>
          )}
          {result?.kind === "error" && (
            <div className="mt-5 px-4 py-3 rounded-xl border border-red-700/60 bg-red-950/30 text-red-200 whitespace-pre-wrap break-words text-sm">
              <MessageText text={result.message} />
            </div>
          )}

          <p className="mt-8 text-center text-xs text-zinc-600">
            Need something else?{" "}
            <Link href="/chat" className="text-zinc-400 hover:text-white">
              Ask your agent
            </Link>
          </p>
        </div>

        <HowItWorksPanel />
      </div>
    </div>
  );
}

export default function SendPage() {
  return (
    <>
      {/* Suspense: SendScreen reads query params via useSearchParams. */}
      <Suspense fallback={null}>
        <AuthGate>
          {(platformId) => <SendScreen platformId={platformId} />}
        </AuthGate>
      </Suspense>
    </>
  );
}
