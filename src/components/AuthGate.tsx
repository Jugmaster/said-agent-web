"use client";

import { ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAgent } from "@/hooks/useAgent";

interface Props {
  /** Render prop receives the resolved butler platformId once linking succeeds. */
  children: (platformId: string) => ReactNode;
}

/**
 * Gate any page that talks to butler as a specific user.
 *
 *   - Privy hydrating          → spinner placeholder
 *   - Not logged in            → "Log in" prompt
 *   - Logged in, claim pending → "Linking your agent…"
 *   - Claim error              → retry button
 *   - Ready                    → render children with the resolved platformId
 */
export default function AuthGate({ children }: Props) {
  const { login } = usePrivy();
  const agent = useAgent();

  if (agent.status === "not-ready") {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--line)] border-t-zinc-300 animate-spin" />
      </div>
    );
  }

  if (agent.status === "guest") {
    return (
      <div className="min-h-[60vh] px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-[var(--card)] border border-[var(--line)] rounded-xl px-6 py-10">
          <div className="inline-block px-3 py-1.5 mb-5 text-xs text-[var(--dim)] border border-[var(--line)] rounded-full">
            Sign in required
          </div>
          <h2 className="text-2xl font-bold mb-2">Log in to use your agent.</h2>
          <p className="text-sm text-[var(--dim)] mb-6">
            Sign in with Telegram to pick up where you left off with{" "}
            <span className="text-[var(--ink)]">@saidinfrabot</span> — same agent,
            same wallet, same history. Or use email, Google, X, or a wallet for
            a fresh agent.
          </p>
          <button
            onClick={login}
            className="inline-block px-6 py-3 bg-[var(--ink)] text-[var(--bg)] rounded-lg font-semibold hover:opacity-85 transition"
          >
            Log in →
          </button>
          <p className="text-xs text-[var(--faint)] mt-4">
            Same login as{" "}
            <a
              href="https://www.saidprotocol.com"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-[var(--ink)]"
            >
              saidprotocol.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (agent.status === "linking") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[var(--dim)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--line)] border-t-zinc-300 animate-spin" />
          <p className="text-sm">Linking your agent…</p>
        </div>
      </div>
    );
  }

  if (agent.status === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-[var(--card)] border border-red-900/40 rounded-xl px-6 py-8">
          <h2 className="text-lg font-semibold mb-2">Couldn&apos;t link your agent</h2>
          <p className="text-sm text-[var(--dim)] mb-4">{agent.error}</p>
          <button
            onClick={agent.refresh}
            className="px-4 py-2 border border-[var(--line)] rounded-lg text-sm hover:border-[var(--ink)] transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <>{children(agent.platformId)}</>;
}
