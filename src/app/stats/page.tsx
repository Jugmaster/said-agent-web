import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const revalidate = 60; // re-fetch upstream stats every minute

export const metadata: Metadata = {
  title: "Stats · SAID Agent",
  description:
    "Live SAID Protocol ecosystem stats — total agents registered, verified on-chain, average reputation.",
  openGraph: {
    title: "Stats · SAID Agent",
    description: "Live SAID Protocol ecosystem stats.",
    type: "website",
  },
};

interface ProtocolStats {
  totalAgents: number;
  verifiedAgents: number;
  averageReputation: number;
}

async function getStats(): Promise<ProtocolStats | null> {
  try {
    const res = await fetch("https://api.saidprotocol.com/api/stats", {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ProtocolStats;
  } catch {
    return null;
  }
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-8">
      <div className="text-sm text-zinc-500 mb-2">{label}</div>
      <div className="text-4xl font-bold tracking-tight mb-1">{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

export default async function StatsPage() {
  const stats = await getStats();

  return (
    <>
      <Navbar />
      <main className="px-4 md:px-8 pt-28 pb-12 max-w-3xl mx-auto">
        <header className="mb-10">
          <div className="inline-block px-4 py-2 mb-6 text-sm text-zinc-400 border border-zinc-700 rounded-full">
            Live · refreshes every minute
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">Protocol stats</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Every agent registered on SAID Protocol has its own Solana wallet,
            on-chain identity, and rolling reputation. These numbers are pulled
            live from{" "}
            <a
              href="https://api.saidprotocol.com/api/stats"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-300 hover:text-white underline-offset-4 hover:underline"
            >
              api.saidprotocol.com/api/stats
            </a>
            .
          </p>
        </header>

        {!stats ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-12 text-center text-zinc-400">
            <p>Couldn&apos;t fetch live stats right now. Try again in a minute.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
              <StatCard
                label="Total agents"
                value={stats.totalAgents.toLocaleString()}
                sub="registered on SAID"
              />
              <StatCard
                label="Verified on-chain"
                value={stats.verifiedAgents.toLocaleString()}
                sub={`${(
                  (stats.verifiedAgents / Math.max(stats.totalAgents, 1)) *
                  100
                ).toFixed(1)}% of total`}
              />
              <StatCard
                label="Avg reputation"
                value={`${(stats.averageReputation * 100).toFixed(1)}%`}
                sub="across all agents"
              />
            </div>

            <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-6 text-sm text-zinc-400 leading-relaxed">
              <h2 className="text-base font-semibold text-zinc-200 mb-3">
                What this counts
              </h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <span className="text-zinc-200 font-medium">Total agents</span>{" "}
                  — every wallet that ever registered a SAID identity PDA
                  on-chain, across all integrations (butler, SAID Hosting,
                  Clawpump, direct API users).
                </li>
                <li>
                  <span className="text-zinc-200 font-medium">Verified</span> —
                  agents that completed the verify step (pays the 0.01 SOL
                  verification fee to treasury, gets the verified badge).
                  Sponsored end-to-end via butler so no user-side SOL required.
                </li>
                <li>
                  <span className="text-zinc-200 font-medium">
                    Avg reputation
                  </span>{" "}
                  — rolling positive-feedback ratio averaged across all agents
                  with any feedback recorded. Built from on-chain feedback
                  receipts.
                </li>
              </ul>
            </section>
          </>
        )}

        <footer className="mt-16 pt-8 border-t border-zinc-800 text-sm text-zinc-500 text-center">
          Want your own agent?{" "}
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-300 hover:text-white"
          >
            message @saidinfrabot
          </a>{" "}
          or tweet at{" "}
          <a
            href="https://x.com/saidagent"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-300 hover:text-white"
          >
            @saidagent
          </a>
          .
        </footer>
      </main>
    </>
  );
}
