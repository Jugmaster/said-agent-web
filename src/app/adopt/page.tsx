import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAgentProfile, type AgentProfileResponse } from "@/lib/api";
import { AdoptClient } from "./AdoptClient";

interface PageProps {
  searchParams: Promise<{ p?: string }>;
}

async function fetchAgent(
  platformId: string
): Promise<AgentProfileResponse | null> {
  try {
    return await getAgentProfile(platformId, { cache: "no-store" });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { p } = await searchParams;
  if (!p) return { title: "Claim your agent · SAID Agent" };
  const agent = await fetchAgent(p);
  const name = agent?.displayName ?? p;
  return {
    title: `Claim ${name} · SAID Agent`,
    description: `${name} was launched via @saidagent. Sign in to claim your agent and chat with it on Telegram or here on the web.`,
  };
}

/**
 * Adopt page — landing for users coming from a launch reply tweet.
 *
 * Flow:
 *   1. Server-renders the agent's identity (name, wallet, recent activity)
 *      so it shows up immediately even before the user signs in.
 *   2. Client component handles the claim CTA: triggers Privy auth,
 *      verifies the X identity matches platformId, calls /api/claim
 *      to link the Privy user to the agent.
 *   3. Once claimed, redirects to /chat where the agent appears under
 *      the user's identity (works across Telegram + PWA via the linked
 *      platform_ids).
 */
export default async function AdoptPage({ searchParams }: PageProps) {
  const { p: platformId } = await searchParams;

  if (!platformId) {
    return (
      <main className="min-h-dvh bg-neutral-950 text-neutral-100 px-4 py-6 max-w-md mx-auto">
        <div className="bg-yellow-950/30 border border-yellow-900 rounded-xl px-4 py-6 mt-12 text-center">
          <p className="text-sm text-yellow-300">
            Missing agent identifier. Adopt links should look like:
          </p>
          <code className="text-xs text-neutral-400 block mt-2 break-all">
            agent.saidprotocol.com/adopt?p=tw_…
          </code>
          <Link
            href="/"
            className="mt-4 inline-block text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  const agent = await fetchAgent(platformId);
  if (!agent) notFound();

  const isXLaunched = platformId.startsWith("tw_");
  const xUserId = isXLaunched ? platformId.slice("tw_".length) : null;

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100 px-4 py-6 max-w-md mx-auto">
      <header className="mb-6">
        <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← SAID Agent
        </Link>
      </header>

      <section className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">
          {agent.displayName ?? "Your agent"}
        </h1>
        <p className="text-sm text-neutral-400">
          {isXLaunched
            ? "Launched via @saidagent on X. Claim it to chat with it on Telegram or here on the web."
            : "Claim your agent and chat from any device."}
        </p>
      </section>

      {agent.saidWallet && (
        <section className="mb-6 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
          <div className="text-xs text-neutral-500 mb-1">Agent wallet</div>
          <code className="text-xs text-neutral-300 break-all block">
            {agent.saidWallet}
          </code>
          {agent.activityCounts.total > 0 && (
            <div className="mt-2 text-xs text-neutral-500">
              {agent.activityCounts.total} on-chain action
              {agent.activityCounts.total === 1 ? "" : "s"} · {agent.activityCounts.swaps} swap
              {agent.activityCounts.swaps === 1 ? "" : "s"} ·{" "}
              {agent.activityCounts.stakes} stake
              {agent.activityCounts.stakes === 1 ? "" : "s"}
            </div>
          )}
        </section>
      )}

      <AdoptClient platformId={platformId} expectedXUserId={xUserId} />

      <footer className="mt-12 pt-6 border-t border-neutral-900 text-xs text-neutral-600 text-center">
        <p>
          Your agent is yours. The wallet, identity, and on-chain
          history persist regardless of where you sign in from.
        </p>
      </footer>
    </main>
  );
}
