import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAgentProfile, type AgentProfileResponse } from "@/lib/api";
import Navbar from "@/components/Navbar";

interface PageProps {
  params: Promise<{ platformId: string }>;
}

// React cache(): generateMetadata and the page body both need the profile —
// share one butler fetch per request instead of two (no-store skips the
// framework's own dedupe).
const fetchAgent = cache(
  async (platformId: string): Promise<AgentProfileResponse | null> => {
    try {
      return await getAgentProfile(platformId, { cache: "no-store" });
    } catch {
      return null;
    }
  },
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { platformId } = await params;
  const agent = await fetchAgent(platformId);
  if (!agent) {
    return {
      title: "Agent not found · SAID Agent",
      description: "This agent doesn't exist on SAID Protocol.",
    };
  }
  const name = agent.displayName || `Agent ${platformId}`;
  const desc = agent.verified
    ? `${name} is a verified SAID Protocol agent. ${agent.activityCounts.total} on-chain actions, ${agent.activityCounts.swaps} swaps, ${agent.activityCounts.stakes} stakes.`
    : `${name} is an unverified SAID Protocol agent.`;
  return {
    title: `${name} · SAID Agent`,
    description: desc,
    openGraph: {
      title: `${name} · SAID Agent`,
      description: desc,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${name} · SAID Agent`,
      description: desc,
    },
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-4 py-3">
      <div className="text-xs text-[var(--faint)]">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { platformId } = await params;
  const agent = await fetchAgent(platformId);
  if (!agent) notFound();

  const name = agent.displayName || `Agent ${platformId}`;

  const isX = platformId.startsWith("tw_");
  // Prefer the @handle for X agents (their display_name IS the X handle); fall
  // back to the identity wallet for everyone else. Either way the visitor lands
  // in /send pre-filled and must sign in to send — that sign-in is the adoption.
  const tipHref =
    isX && agent.displayName
      ? `/send?to=${encodeURIComponent(agent.displayName)}&platform=x`
      : agent.saidWallet
        ? `/send?address=${encodeURIComponent(agent.saidWallet)}`
        : "/send";
  const canTip = !!(agent.saidWallet || (isX && agent.displayName));

  return (
    <>
      <Navbar />
      <main className="px-4 md:px-8 pt-28 pb-16 max-w-2xl md:max-w-4xl mx-auto w-full">
        {/* Identity header — tip CTA rides alongside on desktop */}
        <section className="mb-8 md:flex md:items-start md:justify-between md:gap-8">
          <div className="flex items-start gap-4 min-w-0">
            <span className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--card)] border border-[var(--line)] text-xl font-semibold">
              {name[0]?.toUpperCase() ?? "•"}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-semibold">{name}</h1>
                {agent.verified && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-950 text-[var(--good)] border border-green-900">
                    verified
                  </span>
                )}
                {agent.proTier > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-950 text-yellow-400 border border-yellow-900">
                    Pro tier
                  </span>
                )}
              </div>
              {/* Platform, not the raw backend id. The id is in the URL for
                  anyone who needs it; rendering it as a subtitle just looks
                  like a leaked internal. */}
              <p className="text-xs text-[var(--faint)] mt-1">
                {platformId.startsWith("tw_")
                  ? "Agent on X"
                  : platformId.startsWith("tg_")
                    ? "Agent on Telegram"
                    : "SAID agent"}
              </p>
              {agent.saidWallet && (
                <div className="mt-3 rounded-xl bg-[var(--card)] border border-[var(--line)] px-4 py-3 max-w-full">
                  <div className="text-xs text-[var(--faint)] mb-1">
                    SAID identity wallet
                  </div>
                  <code className="text-xs text-[var(--ink)] break-all block">
                    {agent.saidWallet}
                  </code>
                </div>
              )}
            </div>
          </div>

          {canTip && (
            <div className="mt-6 md:mt-0 md:w-72 shrink-0">
              <Link
                href={tipHref}
                className="block w-full text-center rounded-xl bg-[var(--ink)] text-[var(--bg)] font-semibold py-3 hover:opacity-85 transition"
              >
                Send {name} a tip →
              </Link>
              <p className="mt-2 text-center text-xs text-[var(--faint)]">
                Sign in with Telegram, X, or email to send — funds move from
                your own wallet.
              </p>
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-[var(--dim)] mb-3">Activity</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total actions" value={agent.activityCounts.total} />
            <StatCard label="Swaps" value={agent.activityCounts.swaps} />
            <StatCard label="Stakes" value={agent.activityCounts.stakes} />
            <StatCard label="Anchored" value={agent.activityCounts.anchored} />
          </div>
        </section>

        {agent.recentActivity.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-[var(--dim)] mb-3">Recent</h2>
            <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-2">
              {agent.recentActivity.map((a) => (
                <div
                  key={a.seq}
                  className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm font-medium capitalize">
                      {a.type === "idle_compute"
                        ? "IDLE compute"
                        : a.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-[var(--faint)] ml-2">
                      {formatDate(a.occurredAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {a.type === "idle_compute" && agent.saidWallet && (
                      <a
                        href={`https://api.earnidle.com/api/public/node-earnings?wallet=${agent.saidWallet}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--good)]/80 hover:text-[var(--good)]"
                        title="Verify this agent's IDLE work at the source"
                      >
                        verify on IDLE ↗
                      </a>
                    )}
                    {a.onChainTx && (
                      <a
                        href={`https://solscan.io/tx/${a.onChainTx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--faint)] hover:text-[var(--ink)]"
                      >
                        tx ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-12 pt-6 border-t border-[var(--line)] text-xs text-[var(--faint)] text-center">
          <p>This agent runs on SAID Protocol.</p>
          <Link
            href="/"
            className="text-[var(--dim)] hover:text-[var(--ink)] mt-2 inline-block"
          >
            Get your own butler →
          </Link>
        </footer>
      </main>
    </>
  );
}
