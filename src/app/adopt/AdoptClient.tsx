"use client";

import Link from "next/link";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { claimAgent } from "@/lib/api";

interface AdoptClientProps {
  platformId: string;
  /**
   * For X-launched agents (tw_<id>), this is the X user ID the signed-in Privy
   * account must match to prove ownership. For other platforms it's null and
   * any signed-in Privy user may claim (the /api/claim server check still
   * applies).
   */
  expectedXUserId: string | null;
}

type ClaimState =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "claimed"; linkedPlatformIds: string[] }
  | { kind: "error"; message: string };

/**
 * Client-side adopt flow.
 *
 * Signs the user in with Privy, then claims THIS page's agent (`platformId`)
 * under their identity. For X-launched agents we check the signed-in X account
 * (`user.twitter.subject`) matches `expectedXUserId` before calling the server,
 * so a wrong-account sign-in gets a clear message instead of an opaque 403.
 * `/api/claim` re-enforces the same match server-side — the front-end check is
 * just UX. Mirrors the canonical Privy → claim flow in useAgent / AuthGate.
 */
export function AdoptClient({ platformId, expectedXUserId }: AdoptClientProps) {
  const { ready, authenticated, user, login } = usePrivy();
  const [state, setState] = useState<ClaimState>({ kind: "idle" });

  const signedInXUserId = user?.twitter?.subject ?? null;
  const xMismatch =
    !!expectedXUserId && !!signedInXUserId && signedInXUserId !== expectedXUserId;

  async function handleClaim() {
    if (!user) {
      setState({ kind: "error", message: "Sign in first to claim this agent." });
      return;
    }
    // For X-launched agents, the signed-in X account must be the launcher.
    // The server enforces this too; we check here for a clearer message.
    if (expectedXUserId && signedInXUserId !== expectedXUserId) {
      setState({
        kind: "error",
        message:
          "This agent was launched from a different X account. Sign in with that account to claim it.",
      });
      return;
    }

    setState({ kind: "verifying" });
    try {
      const result = await claimAgent({
        platformId,
        privyUserId: user.id,
        verifiedXUserId: signedInXUserId ?? undefined,
        xUsername: user.twitter?.username ?? undefined,
      });
      setState({
        kind: "claimed",
        linkedPlatformIds: result.linkedPlatformIds,
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "claim failed",
      });
    }
  }

  if (state.kind === "claimed") {
    return (
      <section className="bg-green-950/30 border border-green-900 rounded-xl px-4 py-6">
        <p className="text-2xl mb-2">✅</p>
        <p className="text-sm font-medium text-green-300 mb-1">Agent claimed</p>
        <p className="text-xs text-[var(--dim)] mb-3">
          Now linked to your account. You can chat with it from Telegram, on
          this site, or any other surface that connects to the same Privy
          identity.
        </p>
        {state.linkedPlatformIds.length > 1 && (
          <p className="text-xs text-[var(--faint)] mb-3">
            Linked surfaces: {state.linkedPlatformIds.join(", ")}
          </p>
        )}
        <div className="flex gap-2">
          <Link
            href="/chat"
            className="text-sm px-4 py-2 rounded-lg bg-[var(--ink)] text-[var(--bg)] font-semibold hover:opacity-85"
          >
            Open chat →
          </Link>
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            className="text-sm px-4 py-2 rounded-lg border border-[var(--line)] hover:border-[var(--ink)]"
          >
            Open Telegram
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-4 py-5">
      <h2 className="text-sm font-medium mb-3">Claim this agent</h2>
      <p className="text-xs text-[var(--faint)] mb-4">
        {expectedXUserId
          ? "Sign in with the X account that launched this token. Privy verifies the link, then attaches the agent to your identity."
          : "Sign in with Privy to attach this agent to your identity."}
      </p>

      {!ready ? (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--line)] border-t-zinc-300 animate-spin" />
        </div>
      ) : !authenticated ? (
        <button
          onClick={login}
          className="w-full text-sm px-4 py-2 rounded-lg bg-[var(--ink)] text-[var(--bg)] font-semibold hover:opacity-85"
        >
          {expectedXUserId ? "Sign in with X →" : "Sign in →"}
        </button>
      ) : (
        <>
          <p className="text-xs text-[var(--faint)] mb-3">
            Signed in
            {user?.twitter?.username ? ` as @${user.twitter.username}` : ""}.
          </p>

          {xMismatch && (
            <p className="text-xs text-[var(--warn)] mb-3">
              You&apos;re signed in with a different X account than the one that
              launched this agent. Switch accounts to claim it.
            </p>
          )}

          {state.kind === "error" && (
            <p className="text-xs text-[#e06c5a] mb-3">{state.message}</p>
          )}

          <button
            onClick={() => void handleClaim()}
            disabled={state.kind === "verifying" || xMismatch}
            className="w-full text-sm px-4 py-2 rounded-lg bg-[var(--ink)] text-[var(--bg)] font-semibold hover:opacity-85 disabled:bg-[rgba(128,128,128,.18)] disabled:text-[var(--faint)]"
          >
            {state.kind === "verifying" ? "Claiming…" : "Claim agent"}
          </button>
        </>
      )}
    </section>
  );
}
