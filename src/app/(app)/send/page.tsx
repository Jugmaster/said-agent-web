"use client";

import { Suspense, useEffect, useState } from "react";
import DotSeam from "@/components/DotSeam";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { chat, agentSend, getSends, type SendRecord } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import AuthGate from "@/components/AuthGate";
import MessageText from "@/components/MessageText";
import { useAgent } from "@/hooks/useAgent";
import { useSendableBalance, maxSendable } from "@/hooks/useSendableBalance";
import { requestRefresh } from "@/lib/refresh";

type Platform = "telegram" | "x";
type Asset = "USDC" | "SOL";

function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

// Telegram and X usernames are letters/digits/underscores only. Anything else
// must not reach the butler: the command is interpolated into an LLM router
// prompt, so free text in the handle field is a prompt-injection vector.
function isValidHandle(h: string): boolean {
  return /^[a-z0-9_]{1,32}$/.test(h);
}

function isValidSolanaAddress(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
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
    <div className="mt-5 rounded-2xl border border-[rgba(61,163,93,.35)] bg-gradient-to-b from-[rgba(61,163,93,.10)] to-[var(--bg)] px-5 py-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--good)]/15 text-[var(--good)] text-2xl">
        {executed ? "✓" : "↗"}
      </div>
      <div className="text-lg font-semibold text-[var(--ink)]">
        {executed ? "Sent" : "On its way"} {amount} {asset}
      </div>
      <div className="mt-0.5 text-sm text-[var(--dim)]">
        to <span className="text-[var(--ink)]">{recipient}</span>
      </div>

      {executed ? (
        <p className="mt-2 text-xs text-[var(--good)]">
          They’ll see it the moment they open SAID.
        </p>
      ) : (
        <p className="mt-2 text-xs text-[var(--dim)]">
          They’ll get it the moment they open SAID — even if they’re not on it yet.
        </p>
      )}

      <div className="mt-4 flex items-center justify-center gap-3">
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[var(--good)] underline underline-offset-2 hover:text-[var(--good)]"
          >
            View on Solscan ↗
          </a>
        )}
        {!executed && inviteUrl && (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[var(--dim)] underline underline-offset-2 hover:text-[var(--ink)]"
          >
            Share invite link ↗
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={onSendAnother}
        className="mt-5 w-full rounded-xl border border-[var(--line)] py-2.5 text-sm font-medium text-[var(--ink)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition"
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
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--faint)] mb-4">
          How it works
        </h2>
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[11px] font-semibold text-[var(--dim)]">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium text-[var(--ink)]">{s.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--faint)]">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 text-xs leading-relaxed text-[var(--faint)]">
        <span className="text-[var(--ink)]">Prefer typing?</span> Press{" "}
        <kbd className="rounded border border-[var(--line)] bg-[rgba(128,128,128,.18)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">
          ⌘K
        </kbd>{" "}
        anywhere and just say it — “send 5 USDC to @maya”.
      </div>
    </div>
  );
}

/** Right-of-form panel: recent recipients (one-tap re-send) + your send
 * history with claim status — the "where's my money" trust surface. */
function SendsPanel({
  platformId,
  refreshKey,
  onPick,
}: {
  platformId: string;
  refreshKey: number;
  onPick: (handle: string, platform: Platform) => void;
}) {
  const [sends, setSends] = useState<SendRecord[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSends(platformId)
      .then((r) => !cancelled && setSends(r.sends))
      .catch(() => !cancelled && setSends([]));
    return () => {
      cancelled = true;
    };
  }, [platformId, refreshKey]);

  // Unique recipients, most recent first, successful sends only.
  const recents: SendRecord[] = [];
  for (const s of sends ?? []) {
    if (s.outcome !== "executed" && s.outcome !== "pending") continue;
    if (recents.some((r) => r.recipientHandle === s.recipientHandle)) continue;
    recents.push(s);
    if (recents.length >= 6) break;
  }

  function statusLabel(s: SendRecord): { text: string; cls: string } {
    if (s.outcome === "executed") return { text: "delivered", cls: "text-[var(--good)]" };
    if (s.outcome === "pending") {
      if (s.claimStatus === "claimed") return { text: "claimed", cls: "text-[var(--good)]" };
      if (s.claimStatus === "expired") return { text: "expired", cls: "text-[var(--faint)]" };
      if (s.claimStatus === "cancelled") return { text: "cancelled", cls: "text-[var(--faint)]" };
      return { text: "awaiting claim", cls: "text-[var(--warn)]" };
    }
    return { text: s.outcome, cls: "text-[#e06c5a]" };
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Recent recipients */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--faint)]">
          Recent recipients
        </h2>
        {sends === null ? (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full border border-[var(--line)] bg-[var(--card)]" />
            ))}
          </div>
        ) : recents.length === 0 ? (
          <p className="text-xs italic text-[var(--faint)]">
            People you send to appear here for one-tap re-sends.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recents.map((s) => (
              <button
                key={s.recipientHandle}
                type="button"
                onClick={() => onPick(s.recipientHandle, s.platform === "x" ? "x" : "telegram")}
                className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] py-1.5 pl-1.5 pr-3.5 transition hover:border-[var(--dim)]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(128,128,128,.18)] text-[10px] font-semibold text-[var(--ink)]">
                  {s.recipientHandle.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-sm text-[var(--ink)]">@{s.recipientHandle}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Your sends */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--faint)]">
          Your sends
        </h2>
        {sends === null ? (
          <div className="h-32 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--card)]" />
        ) : sends.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-sm text-[var(--faint)]">
            No sends yet. Your first one shows up here — with live claim status
            for recipients who aren&apos;t on SAID yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
            <div className="divide-y divide-[var(--line)]">
              {sends.slice(0, 10).map((s, i) => {
                const st = statusLabel(s);
                return (
                  <div key={`${s.ts}-${i}`} className="flex items-center gap-3 bg-[var(--card)] px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(128,128,128,.18)] text-xs font-semibold text-[var(--ink)]">
                      {s.recipientHandle.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--ink)]">
                        @{s.recipientHandle}
                        <span className="ml-1.5 text-xs text-[var(--faint)]">{s.platform === "x" ? "on X" : "on Telegram"}</span>
                      </div>
                      <div className={`text-xs ${st.cls}`}>{st.text}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[var(--ink)]">
                        {s.amount} {s.asset}
                      </div>
                      <div className="text-[11px] text-[var(--faint)]">{timeAgo(new Date(s.ts).toISOString())}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
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
  // Bumped after each successful send so the history panel refetches.
  const [sendsNonce, setSendsNonce] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<
    | { kind: "ok"; message: string; amount: string; asset: Asset; recipient: string }
    | { kind: "info"; message: string }
    | { kind: "waitlist"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  const addr = walletAddress.trim();
  const handleNorm = normalizeHandle(handle);
  const addrInvalid = addr.length > 0 && !isValidSolanaAddress(addr);
  const handleInvalid = !addr && handle.trim().length > 0 && !isValidHandle(handleNorm);
  // Client-side ceiling when we have a trustworthy balance read; the butler
  // enforces the real limit, this just stops obvious over-sends up front.
  const balanceKnown = !bal.loading && !bal.error;
  const overBalance =
    balanceKnown &&
    amount.trim().length > 0 &&
    parseFloat(amount) > maxSendable(asset, bal.sol, bal.usdc) + 1e-9;

  const canSubmit =
    !sending &&
    amount.trim().length > 0 &&
    parseFloat(amount) > 0 &&
    !overBalance &&
    !addrInvalid &&
    !handleInvalid &&
    (handle.trim().length > 0 || addr.length > 0);

  async function submit(): Promise<void> {
    // sending re-check: a mobile double-tap can fire two clicks before React
    // re-renders the disabled state — never let two /api/send calls race.
    if (!canSubmit || sending) return;
    setConfirming(false);
    setSending(true);
    setResult(null);

    const recipient = addr ? addr : `@${handleNorm}`;
    try {
      if (addr) {
        // Raw-address fallback stays on the chat path — the typed /api/send is
        // handle-only (it resolves SAID handles, not literal addresses). Same
        // success-detection as before: only celebrate on real evidence funds
        // moved. The address is base58-validated above, so no free text rides
        // into the router prompt.
        const res = await chat(platformId, `send ${amount} ${asset} to ${addr}`);
        const step = res.context?.step;
        const notSent = step
          ? ["unknown", "awaiting_name", "provisioned", "registered", "registered_unverified"].includes(step)
          : false;
        const hasTx = /solscan|solana\.fm|explorer\.solana/i.test(res.message);
        if (!notSent && hasTx) {
          setResult({ kind: "ok", message: res.message, amount, asset, recipient });
          requestRefresh();
        } else {
          setResult({ kind: "info", message: res.message });
        }
      } else {
        // Send-by-handle goes through the typed endpoint: no LLM in the money
        // path, a structured result instead of scraping a reply. `executed`
        // means funds moved now (verified recipient); `inviteToken` means they
        // were reserved and settle when the recipient logs in and claims.
        const r = await agentSend({
          platformId,
          handle: handleNorm,
          platform,
          asset,
          amount: parseFloat(amount),
        });
        if (r.ok && (r.executed || r.inviteToken)) {
          setResult({ kind: "ok", message: r.message, amount, asset, recipient });
          // Funds moved (or were reserved) — refresh every balance surface.
          requestRefresh();
          setSendsNonce((n) => n + 1);
        } else if (r.ok) {
          // Accepted but nothing moved (e.g. butler asked the sender to activate
          // first) — surface butler's real message, don't fake success.
          setResult({ kind: "info", message: r.message });
        } else if (r.gated) {
          // Not in the first-access cohort — a waitlist, not a failure.
          setResult({ kind: "waitlist", message: r.message });
        } else {
          setResult({ kind: "error", message: r.message });
        }
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

  // Any edit invalidates a pending confirmation — the user must re-confirm
  // exactly what will be sent.
  useEffect(() => {
    setConfirming(false);
  }, [handle, platform, amount, asset, walletAddress]);

  return (
    <div className="surface">
      {/* MAIN — form + send history fill the canvas like the sibling pages */}
      <div className="col min-w-0 flex-1 overflow-y-auto">
        <div className="kickm">Send · Solana mainnet</div>
        <div className="big">
          {amount || "0"} <span style={{ color: "var(--faint)", fontSize: ".42em", letterSpacing: 0 }}>{asset}</span>
        </div>
        <div className="subline">
          {handle ? (
            <>to <b style={{ fontWeight: 500, color: "var(--ink)" }}>{handle}</b><i>·</i>screened before funds move</>
          ) : (
            "One handle. Any chain. Your agent figures out the rest."
          )}
        </div>

        <DotSeam />

        <div className="flex w-full flex-col">
        <div className="flex flex-col">
          {/* Agent balance — the two sendable assets, live from chain */}
          {agent.status === "ready" && agent.walletAddress && (
            <div className="mb-6 flex items-center justify-between rounded-[14px] border border-[var(--line)] px-4 py-3">
              <div>
                <div className="lbl mb-1">Your balance</div>
                {bal.error ? (
                  <span className="text-sm text-[var(--warn)]">couldn’t load</span>
                ) : bal.loading ? (
                  <span className="text-sm text-[var(--faint)]">loading…</span>
                ) : (
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="text-[var(--ink)]">{bal.sol.toFixed(4)} SOL</span>
                    <span className="text-[var(--faint)]">·</span>
                    <span className="text-[var(--ink)]">{bal.usdc.toFixed(2)} USDC</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => bal.refetch()}
                disabled={bal.loading}
                className="text-xs text-[var(--faint)] hover:text-[var(--ink)] disabled:opacity-40 transition"
                aria-label="Refresh balance"
              >
                ↻
              </button>
            </div>
          )}

          {/* Recipient — handle-first */}
          <label className="lbl mb-2 block">Recipient</label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setPlatform("telegram")}
              className={`tab${platform === "telegram" ? " on" : ""}`}
            >
              Telegram
            </button>
            <button
              type="button"
              onClick={() => setPlatform("x")}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition ${
                platform === "x"
                  ? "border-white bg-[var(--ink)] text-[var(--bg)]"
                  : "border-[var(--line)] text-[var(--dim)] hover:border-[var(--ink)]"
              }`}
            >
              X
            </button>
          </div>
          <div className="relative mb-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--faint)] select-none">
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
              className="w-full pl-9 pr-4 py-3 bg-[var(--card)] border border-[var(--line)] rounded-xl text-base placeholder-zinc-600 focus:outline-none focus:border-[var(--dim)]"
            />
          </div>
          {handleLooksLikeAddress && (
            <p className="text-xs text-[var(--warn)] mb-3">
              Looks like a wallet address — use “advanced” below to send to a raw
              address instead.
            </p>
          )}
          {!handleLooksLikeAddress && handleInvalid && (
            <p className="text-xs text-[var(--warn)] mb-3">
              Handles can only contain letters, numbers and underscores.
            </p>
          )}
          {!handleLooksLikeAddress && !handleInvalid && handle.trim() && (
            <p className="text-xs text-[var(--faint)] mb-3">
              If they don’t have a SAID agent yet, your funds stay in your wallet
              and they get an invite link to claim them.
            </p>
          )}
          {!handle.trim() && <div className="mb-3" />}

          {/* Amount + asset */}
          <label className="block text-xs text-[var(--faint)] mb-2">AMOUNT</label>
          <div className="flex gap-2 mb-1">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 px-4 py-3 bg-[var(--card)] border border-[var(--line)] rounded-xl text-2xl font-semibold placeholder-zinc-600 focus:outline-none focus:border-[var(--dim)]"
            />
            <div className="flex bg-[var(--card)] border border-[var(--line)] rounded-xl overflow-hidden">
              {(["USDC", "SOL"] as Asset[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAsset(a)}
                  className={`px-4 py-3 text-sm font-semibold transition ${
                    asset === a
                      ? "bg-[var(--ink)] text-[var(--bg)]"
                      : "text-[var(--dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6 flex justify-between text-xs text-[var(--faint)]">
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
                className="font-semibold text-[var(--dim)] hover:text-[var(--ink)] transition"
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
            className="mb-6 border border-[var(--line)] rounded-xl px-4 py-3 bg-[var(--card)]"
          >
            <summary className="cursor-pointer text-xs text-[var(--faint)] select-none">
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
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-base sm:text-sm font-mono placeholder-zinc-600 focus:outline-none focus:border-[var(--dim)]"
              />
              {addrInvalid ? (
                <p className="text-xs text-[var(--warn)] mt-2">
                  That doesn’t look like a valid Solana address.
                </p>
              ) : (
                <p className="text-xs text-[var(--faint)] mt-2">
                  Overrides the @handle above when filled.
                </p>
              )}
            </div>
          </details>

          {/* Submit — two-step: review, then confirm. Money only moves on the
              explicit confirm click. */}
          {overBalance && (
            <p className="mb-2 text-xs text-[var(--warn)]">
              That’s more than you can send — max{" "}
              {asset === "SOL"
                ? `${maxSendable(asset, bal.sol, bal.usdc).toFixed(4)} SOL`
                : `${maxSendable(asset, bal.sol, bal.usdc).toFixed(2)} USDC`}
              .
            </p>
          )}
          {confirming && canSubmit ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4">
              <p className="text-sm text-[var(--ink)] text-center">
                Send{" "}
                <span className="font-semibold text-[var(--ink)]">
                  {amount} {asset}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-[var(--ink)] break-all">
                  {addr ? addr : `@${handleNorm} on ${platform === "x" ? "X" : "Telegram"}`}
                </span>
                ?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-3 rounded-xl border border-[var(--line)] text-sm font-medium text-[var(--ink)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={sending}
                  className="flex-1 py-3 rounded-xl bg-[var(--ink)] text-[var(--bg)] text-sm font-semibold hover:opacity-85 transition disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Confirm send"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              disabled={!canSubmit}
              className="w-full py-3.5 bg-[var(--ink)] text-[var(--bg)] rounded-xl font-semibold hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {sending
                ? "Sending…"
                : amount && parseFloat(amount) > 0
                  ? `Send ${amount} ${asset}`
                  : "Enter an amount to send"}
            </button>
          )}

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
            <div className="mt-5 px-4 py-4 rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] whitespace-pre-wrap break-words text-sm">
              <MessageText text={result.message} />
            </div>
          )}
          {result?.kind === "waitlist" && (
            <div className="mt-5 px-5 py-6 rounded-xl border border-[rgba(122,167,217,.30)] bg-gradient-to-b from-[rgba(122,167,217,.10)] to-[var(--bg)] text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(122,167,217,.15)] text-2xl">
                ✦
              </div>
              <div className="text-lg font-semibold text-[var(--ink)]">You&apos;re on the list</div>
              <p className="mt-2 text-sm text-[var(--ink)] whitespace-pre-wrap break-words">
                <MessageText text={result.message} />
              </p>
            </div>
          )}
          {result?.kind === "error" && (
            <div className="mt-5 px-4 py-3 rounded-xl border border-red-700/60 bg-red-950/30 text-red-200 whitespace-pre-wrap break-words text-sm">
              <MessageText text={result.message} />
            </div>
          )}

          <p className="mt-8 text-center text-xs text-[var(--faint)]">
            Need something else?{" "}
            <Link href="/chat" className="text-[var(--dim)] hover:text-[var(--ink)]">
              Ask your agent
            </Link>
          </p>
      </div>

        <div className="mt-10">
          <SendsPanel
            platformId={platformId}
            refreshKey={sendsNonce}
            onPick={(h, p) => {
              setHandle(h);
              setPlatform(p);
              setWalletAddress("");
            }}
          />
        </div>
        </div>

        {/* How-it-works inline on smaller screens (aside is xl-only) */}
        <div className="mt-10 max-w-md xl:hidden">
          <HowItWorksPanel />
        </div>
      </div>

      {/* RIGHT RAIL — matches the app's context-panel pattern */}
      <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-[var(--line)] p-5 pt-10 xl:flex">
        <HowItWorksPanel />
      </aside>
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
