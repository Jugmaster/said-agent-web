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
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
      </div>
    );
  }

  if (agent.status === "guest") {
    return (
      <div className="min-h-[60vh] px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-10">
          <div className="inline-block px-3 py-1.5 mb-5 text-xs text-zinc-400 border border-zinc-700 rounded-full">
            Sign in required
          </div>
          <h2 className="text-2xl font-bold mb-2">Log in to use your agent.</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Sign in with Telegram to pick up where you left off with{" "}
            <span className="text-zinc-200">@saidinfrabot</span> — same agent,
            same wallet, same history. Or use email, Google, X, or a wallet for
            a fresh agent.
          </p>
          <button
            onClick={login}
            className="inline-block px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition"
          >
            Log in →
          </button>
          <p className="text-xs text-zinc-500 mt-4">
            Same login as{" "}
            <a
              href="https://www.saidprotocol.com"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-zinc-300"
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
      <div className="min-h-[60vh] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
          <p className="text-sm">Linking your agent…</p>
        </div>
      </div>
    );
  }

  if (agent.status === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-zinc-900 border border-red-900/40 rounded-xl px-6 py-8">
          <h2 className="text-lg font-semibold mb-2">Couldn&apos;t link your agent</h2>
          <p className="text-sm text-zinc-400 mb-4">{agent.error}</p>
          <button
            onClick={agent.refresh}
            className="px-4 py-2 border border-zinc-700 rounded-lg text-sm hover:border-zinc-500 transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <>{children(agent.platformId)}</>;
}
