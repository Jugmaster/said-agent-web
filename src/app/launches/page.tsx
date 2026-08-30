import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { getLaunches, type LaunchListItem } from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Launches · SAID Agent",
  description:
    "Every token launched via @saidagent on X — creator, fees earned, SAID treasury sweeps. Public ledger.",
  openGraph: {
    title: "Launches · SAID Agent",
    description: "Every token launched via @saidagent on X. Public ledger.",
    type: "website",
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function LaunchRow({ l }: { l: LaunchListItem }) {
  const symbolMatch = l.tweetExcerpt.match(/\$([A-Z0-9]{2,10})/);
  const ticker = symbolMatch?.[1] ?? l.tokenMint.slice(0, 6);

  return (
    <a
      href={l.pumpfunUrl}
      target="_blank"
      rel="noreferrer"
      className="block bg-[var(--card)] border border-[var(--line)] hover:border-[var(--line)] rounded-xl px-5 py-4 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold">${ticker}</span>
            <span className="text-sm text-[var(--dim)]">
              by{" "}
              <Link
                href={`/agents/${l.creator.platformId}`}
                className="text-[var(--ink)] hover:text-[var(--ink)]"
              >
                @{l.creator.xHandle}
              </Link>
            </span>
          </div>
          <p className="text-sm text-[var(--dim)] line-clamp-1">
            {l.tweetExcerpt.slice(0, 140)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm text-[var(--faint)]">{formatDate(l.launchedAt)}</span>
        </div>
      </div>

      {l.sweeps.count > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--line)] flex justify-between text-sm text-[var(--dim)]">
          <span>
            Creator earned{" "}
            <span className="text-[var(--ink)] font-semibold">
              {l.sweeps.totalUserKeptSol.toFixed(4)} SOL
            </span>
          </span>
          <span>
            SAID cut{" "}
            <span className="text-[var(--ink)] font-semibold">
              {l.sweeps.totalSaidCutSol.toFixed(4)} SOL
            </span>
          </span>
        </div>
      )}
    </a>
  );
}

export default async function LaunchesPage() {
  const launches = await getLaunches(50);

  return (
    <>
      <Navbar />
      <main className="px-4 md:px-8 pt-28 pb-12 max-w-3xl mx-auto">
        <header className="mb-10">
          <div className="inline-block px-4 py-2 mb-6 text-sm text-[var(--dim)] border border-[var(--line)] rounded-full">
            Public ledger
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">Launches</h1>
          <p className="text-lg text-[var(--dim)] max-w-2xl">
            Every token launched via{" "}
            <a
              href="https://x.com/saidagent"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--ink)] hover:text-[var(--ink)]"
            >
              @saidagent
            </a>{" "}
            on X. Creators keep 80% of pump.fun fees forever; 20% sweeps to SAID
            treasury. Auditable on-chain.
          </p>
        </header>

        {launches.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-6 py-12 text-center text-[var(--dim)]">
            <p className="text-base">No launches yet.</p>
            <p className="text-sm mt-3">
              Tweet{" "}
              <code className="px-2 py-0.5 rounded bg-[rgba(128,128,128,.18)] text-[var(--ink)] font-mono">
                @saidagent launch &lt;name&gt; $TICKER
              </code>{" "}
              to be the first.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {launches.map((l) => (
              <LaunchRow key={l.tokenMint} l={l} />
            ))}
          </div>
        )}

        <footer className="mt-16 pt-8 border-t border-[var(--line)] text-sm text-[var(--faint)] text-center">
          The agent is the on-chain creator on every launch. Fees flow direct to
          the user&apos;s agent wallet — SAID never custodies them.
        </footer>
      </main>
    </>
  );
}
