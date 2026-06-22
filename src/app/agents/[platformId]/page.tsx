import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAgentProfile, type AgentProfileResponse } from "@/lib/api";

interface PageProps {
  params: Promise<{ platformId: string }>;
}

async function fetchAgent(platformId: string): Promise<AgentProfileResponse | null> {
  try {
    return await getAgentProfile(platformId, { cache: "no-store" });
  } catch {
    return null;
  }
}

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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
      <div className="text-xs text-neutral-500">{label}</div>
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

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100 px-4 py-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <Link
          href="/"
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          ← SAID Agent
        </Link>
      </header>

      <section className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-semibold">{name}</h1>
            <p className="text-xs text-neutral-500 mt-1 font-mono">{platformId}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {agent.verified && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-950 text-green-400 border border-green-900">
                verified
              </span>
            )}
            {agent.proTier > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-950 text-yellow-400 border border-yellow-900">
                Pro tier
              </span>
            )}
          </div>
        </div>

        {agent.saidWallet && (
          <div className="mt-4 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
            <div className="text-xs text-neutral-500 mb-1">SAID identity wallet</div>
            <code className="text-xs text-neutral-300 break-all block">
              {agent.saidWallet}
            </code>
          </div>
        )}
      </section>

      {(agent.saidWallet || (isX && agent.displayName)) && (
        <section className="mb-8">
          <Link
            href={tipHref}
            className="block w-full text-center rounded-xl bg-white text-black font-semibold py-3 hover:bg-neutral-200 transition"
          >
            Send {name} a tip →
          </Link>
          <p className="mt-2 text-center text-xs text-neutral-500">
            Sign in with Telegram, X, or email to send — funds move from your own
            wallet.
          </p>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-400 mb-3">Activity</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total actions" value={agent.activityCounts.total} />
          <StatCard label="Swaps" value={agent.activityCounts.swaps} />
          <StatCard label="Stakes" value={agent.activityCounts.stakes} />
          <StatCard label="Anchored" value={agent.activityCounts.anchored} />
        </div>
      </section>

      {agent.recentActivity.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-neutral-400 mb-3">Recent</h2>
          <div className="space-y-2">
            {agent.recentActivity.map((a) => (
              <div
                key={a.seq}
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-medium capitalize">
                    {a.type === "idle_compute"
                      ? "IDLE compute"
                      : a.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-neutral-500 ml-2">
                    {formatDate(a.occurredAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {a.type === "idle_compute" && agent.saidWallet && (
                    <a
                      href={`https://api.earnidle.com/api/public/node-earnings?wallet=${agent.saidWallet}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400/80 hover:text-emerald-300"
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
                      className="text-xs text-neutral-500 hover:text-neutral-300"
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

      <footer className="mt-12 pt-6 border-t border-neutral-900 text-xs text-neutral-600 text-center">
        <p>This agent runs on SAID Protocol.</p>
        <Link href="/" className="text-neutral-400 hover:text-neutral-200 mt-2 inline-block">
          Get your own butler →
        </Link>
      </footer>
    </main>
  );
}
