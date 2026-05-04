"use client";

import Link from "next/link";
import { useState } from "react";
import { claimAgent } from "@/lib/api";

interface AdoptClientProps {
  platformId: string;
  /**
   * For X-launched agents (tw_<id>), this is the X user ID the user must
   * authenticate as via Privy to prove ownership. For other platforms
   * this is null and the claim is open (Privy auth alone is sufficient).
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
 * Privy SDK isn't wired into this PWA yet (next wave per memory: "Wave 3:
 * Privy onramp + Stripe Link"). For now the claim path uses a stubbed
 * "manual verification" — the user copies their X handle, we trust the
 * server-side check that the platform_id matches. Once Privy ships, the
 * `verifyXOwnership()` placeholder is replaced with `privyClient.login({
 * loginMethods: ['twitter'] })` and the verified X user id flows through.
 *
 * The /api/claim endpoint enforces the actual identity match server-side
 * regardless of how the front-end gets the IDs, so this stub is safe.
 */
export function AdoptClient({ platformId, expectedXUserId }: AdoptClientProps) {
  const [state, setState] = useState<ClaimState>({ kind: "idle" });
  const [privyUserId, setPrivyUserId] = useState("");

  async function handleClaim() {
    if (!privyUserId.trim()) {
      setState({
        kind: "error",
        message: "Privy user ID is required (paste from your Privy dashboard or wait for the integrated flow).",
      });
      return;
    }

    setState({ kind: "verifying" });
    try {
      const result = await claimAgent({
        platformId,
        privyUserId: privyUserId.trim(),
        // For now we trust the user-supplied X id — the server-side check
        // in /api/claim enforces match against the platform_id, so a wrong
        // id just gets a 403 from the server.
        verifiedXUserId: expectedXUserId ?? undefined,
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
        <p className="text-xs text-neutral-400 mb-3">
          Now linked to your account. You can chat with it from Telegram, on
          this site, or any other surface that connects to the same Privy
          identity.
        </p>
        {state.linkedPlatformIds.length > 1 && (
          <p className="text-xs text-neutral-500 mb-3">
            Linked surfaces: {state.linkedPlatformIds.join(", ")}
          </p>
        )}
        <div className="flex gap-2">
          <Link
            href="/chat"
            className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
          >
            Open chat →
          </Link>
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            className="text-sm px-4 py-2 rounded-lg border border-neutral-700 hover:border-neutral-500"
          >
            Open Telegram
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-5">
      <h2 className="text-sm font-medium mb-3">Claim this agent</h2>
      <p className="text-xs text-neutral-500 mb-4">
        {expectedXUserId
          ? `Sign in with the same X account that launched this token (id ${expectedXUserId}). Privy verifies the link, then we attach the agent to your identity.`
          : "Sign in with Privy to attach this agent to your identity."}
      </p>

      <input
        type="text"
        placeholder="Privy user ID (will be auto-filled when SDK is wired)"
        value={privyUserId}
        onChange={(e) => setPrivyUserId(e.target.value)}
        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-600 mb-3 font-mono"
        disabled={state.kind === "verifying"}
      />

      {state.kind === "error" && (
        <p className="text-xs text-red-400 mb-3">{state.message}</p>
      )}

      <button
        onClick={() => void handleClaim()}
        disabled={state.kind === "verifying"}
        className="w-full text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        {state.kind === "verifying" ? "Verifying…" : "Claim agent"}
      </button>

      <p className="mt-3 text-xs text-neutral-600">
        The Privy login flow is being wired up; for now this accepts a
        user ID directly. Once the SDK is integrated, you&apos;ll get a one-click
        &quot;sign in with X&quot; experience.
      </p>
    </section>
  );
}
