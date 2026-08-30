"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import {
  getReputationLink,
  linkReputation,
  unlinkReputation,
  type ReputationLink,
} from "@/lib/api";

// For agents registered outside Butler — on the protocol directly, or through
// another integration. They already earned a reputation; this lets them cash it
// in here without moving the wallet or handing over a key. They sign a
// challenge, we verify it, and their fees get priced off that wallet's tier.

function challengeFor(platformId: string, wallet: string): string {
  return [
    "SAID Agent · link reputation",
    `Account: ${platformId}`,
    `Wallet: ${wallet}`,
    `Issued: ${new Date().toISOString()}`,
    "Signing proves you control this wallet. It authorises nothing else and moves no funds.",
  ].join("\n");
}

export default function LinkAgentPage() {
  return <AuthGate>{(platformId) => <LinkAgent platformId={platformId} />}</AuthGate>;
}

function LinkAgent({ platformId }: { platformId: string }) {
  const [current, setCurrent] = useState<ReputationLink | null>(null);
  const [wallet, setWallet] = useState("");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setCurrent(await getReputationLink(platformId));
    } catch {
      setCurrent({ wallet: null, tier: null });
    }
  }, [platformId]);

  useEffect(() => {
    void load();
  }, [load]);

  const walletValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.trim());

  async function copyChallenge() {
    if (!challenge) return;
    try {
      await navigator.clipboard.writeText(challenge);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* selectable on screen anyway */
    }
  }

  async function submit() {
    if (!challenge || !signature.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await linkReputation({
        platformId,
        wallet: wallet.trim(),
        signature: signature.trim(),
        message: challenge,
      });
      if (!r.ok) setError(r.message ?? "Couldn't verify that signature.");
      else {
        setChallenge(null);
        setSignature("");
        setWallet("");
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(var(--tabbar-h)+1.5rem)] md:px-6 md:pt-10 md:pb-12">
      <Link href="/settings" className="text-sm text-[var(--faint)] hover:text-[var(--ink)]">
        ← Settings
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Link an existing agent</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--dim)]">
        Registered an agent outside this app? Prove you control its wallet and
        your fees here get priced off the reputation it already earned. The
        wallet stays where it is, we never take a key, and it keeps earning its
        score from its own activity.
      </p>

      {current?.wallet ? (
        <div className="mt-6 rounded-2xl border border-[rgba(61,163,93,.35)]/60 bg-[rgba(61,163,93,.12)]/20 p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--good)]">Linked</div>
          <div className="mt-1 break-all font-mono text-sm text-[var(--ink)]">{current.wallet}</div>
          {current.tier && (
            <div className="mt-2 text-sm text-[var(--ink)]">
              Tier: <span className="font-semibold capitalize text-[var(--good)]">{current.tier}</span>
              {" — your cashback is priced at this tier."}
            </div>
          )}
          <button
            onClick={async () => {
              setBusy(true);
              await unlinkReputation(platformId);
              await load();
              setBusy(false);
            }}
            disabled={busy}
            className="mt-4 rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink)] hover:border-[var(--ink)] disabled:opacity-50"
          >
            Unlink
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide text-[var(--faint)]">
              Step 1 — your agent&apos;s wallet address
            </label>
            <input
              value={wallet}
              onChange={(e) => {
                setWallet(e.target.value);
                setChallenge(null);
              }}
              placeholder="Solana address"
              spellCheck={false}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 font-mono text-base outline-none focus:border-[var(--dim)] sm:text-sm"
            />
          </div>

          {!challenge ? (
            <button
              onClick={() => setChallenge(challengeFor(platformId, wallet.trim()))}
              disabled={!walletValid}
              className="w-full rounded-lg bg-[var(--ink)] py-3 text-sm font-semibold text-[var(--bg)] hover:opacity-85 disabled:opacity-40"
            >
              Generate challenge
            </button>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-[var(--faint)]">
                  Step 2 — sign this exact message with that wallet
                </label>
                <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3 font-mono text-xs text-[var(--dim)]">
                  {challenge}
                </pre>
                <button
                  onClick={() => void copyChallenge()}
                  className="mt-2 rounded-lg border border-[var(--line)] px-3 py-2 text-xs text-[var(--ink)] hover:border-[var(--ink)]"
                >
                  {copied ? "Copied ✓" : "Copy message"}
                </button>
                <p className="mt-2 text-xs text-[var(--faint)]">
                  Any wallet&apos;s &ldquo;sign message&rdquo; feature works, or sign it
                  with your keypair directly. This is a signature, not a
                  transaction — it can&apos;t move anything. Valid for 15 minutes.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-[var(--faint)]">
                  Step 3 — paste the signature
                </label>
                <textarea
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  rows={3}
                  placeholder="base58 signature"
                  spellCheck={false}
                  className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 font-mono text-base outline-none focus:border-[var(--dim)] sm:text-sm"
                />
              </div>

              <button
                onClick={() => void submit()}
                disabled={!signature.trim() || busy}
                className="w-full rounded-lg bg-[var(--ink)] py-3 text-sm font-semibold text-[var(--bg)] hover:opacity-85 disabled:opacity-40"
              >
                {busy ? "Verifying…" : "Link agent"}
              </button>
            </>
          )}

          {error && <p className="text-sm text-[#e06c5a]">{error}</p>}
        </div>
      )}
    </div>
  );
}
