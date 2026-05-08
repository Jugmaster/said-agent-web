import Link from "next/link";
import type { Metadata } from "next";
import { getLaunches, type LaunchListItem } from "@/lib/api";

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
  const now = Date.now();
  const diff = now - d.getTime();
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
    <Link
      href={l.pumpfunUrl}
      target="_blank"
      rel="noreferrer"
      className="block bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl px-4 py-3 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-semibold">${ticker}</span>
            <span className="text-xs text-neutral-500">
              by{" "}
              <Link
                href={`/agents/${l.creator.platformId}`}
                className="text-neutral-300 hover:text-neutral-100"
                onClick={(e) => e.stopPropagation()}
              >
                @{l.creator.xHandle}
              </Link>
            </span>
          </div>
          <p className="text-xs text-neutral-500 line-clamp-1">
            {l.tweetExcerpt.slice(0, 140)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-neutral-500">
            {formatDate(l.launchedAt)}
          </span>
        </div>
      </div>

      {l.sweeps.count > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-between text-xs text-neutral-500">
          <span>
            Creator earned:{" "}
            <span className="text-neutral-300">
              {l.sweeps.totalUserKeptSol.toFixed(4)} SOL
            </span>
          </span>
          <span>
            SAID cut:{" "}
            <span className="text-neutral-300">
              {l.sweeps.totalSaidCutSol.toFixed(4)} SOL
            </span>
          </span>
        </div>
      )}
    </Link>
  );
}

export default async function LaunchesPage() {
  const launches = await getLaunches(50);

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100 px-4 py-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← SAID Agent
        </Link>
      </header>

      <section className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Launches</h1>
        <p className="text-sm text-neutral-400">
          Every token launched via{" "}
          <a
            href="https://x.com/saidagent"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-200 hover:text-white"
          >
            @saidagent
          </a>{" "}
          on X. Creators keep 80% of pump.fun fees forever; 20% sweeps to SAID treasury.
          Auditable on-chain.
        </p>
      </section>

      {launches.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-8 text-center text-neutral-500">
          <p className="text-sm">No launches yet.</p>
          <p className="text-xs mt-2">
            Tweet{" "}
            <code className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-300">
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

      <footer className="mt-12 pt-6 border-t border-neutral-900 text-xs text-neutral-600 text-center">
        <p>
          The agent is the on-chain creator on every launch. Fees flow direct
          to the user&apos;s agent wallet — SAID never custodies them.
        </p>
      </footer>
    </main>
  );
}
