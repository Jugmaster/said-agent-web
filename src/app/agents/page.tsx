import Link from "next/link";
import type { Metadata } from "next";
import { getAgentsList, type AgentListItem } from "@/lib/api";

interface PageProps {
  searchParams: Promise<{ sort?: string }>;
}

export const metadata: Metadata = {
  title: "Agents · SAID Agent",
  description:
    "All SAID agents — each one a personal AI agent on Solana with its own wallet, identity, and on-chain history.",
  openGraph: {
    title: "Agents · SAID Agent",
    description: "Every SAID agent. Each one personal, on-chain, persistent.",
    type: "website",
  },
};

function shortAddr(a: string | null): string {
  if (!a) return "—";
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function formatRelative(iso: string): string {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function AgentRow({ a }: { a: AgentListItem }) {
  const platformLabel = a.platform === "twitter" ? "X" : "Telegram";
  const handlePrefix = a.platform === "twitter" ? "@" : "";
  return (
    <Link
      href={`/agents/${a.platformId}`}
      className="block bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl px-4 py-3 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-semibold">
              {handlePrefix}
              {a.displayName ?? "Unnamed"}
            </span>
            <span className="text-xs text-neutral-500">{platformLabel}</span>
            {a.proTier && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-400 border border-yellow-900">
                Pro
              </span>
            )}
            {a.verified && !a.proTier && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-950 text-green-400 border border-green-900">
                verified
              </span>
            )}
          </div>
          <code className="text-xs text-neutral-500 block">
            {shortAddr(a.walletAddress)}
          </code>
        </div>
        <div className="text-right text-xs text-neutral-500 shrink-0">
          <div>{a.activity.total} actions</div>
          <div>{formatRelative(a.createdAt)}</div>
        </div>
      </div>
    </Link>
  );
}

const SORT_OPTIONS = [
  { key: "activity", label: "Most active" },
  { key: "recent", label: "Newest" },
  { key: "pro", label: "Pro tier" },
] as const;

export default async function AgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sortRaw = params.sort ?? "activity";
  const sort = (["activity", "recent", "pro"].includes(sortRaw) ? sortRaw : "activity") as
    | "activity"
    | "recent"
    | "pro";

  const agents = await getAgentsList(sort, 50);

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100 px-4 py-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← SAID Agent
        </Link>
      </header>

      <section className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Agents</h1>
        <p className="text-sm text-neutral-400">
          Every SAID agent. Each one personal — own wallet, own identity, own
          on-chain history. Pick a sort:
        </p>
      </section>

      <nav className="flex gap-2 mb-4">
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.key}
            href={`/agents?sort=${opt.key}`}
            className={`text-xs px-3 py-1.5 rounded-md border ${
              sort === opt.key
                ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                : "border-neutral-800 hover:border-neutral-700 text-neutral-400"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </nav>

      {agents.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-8 text-center text-neutral-500">
          <p className="text-sm">No agents in this slice yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {agents.map((a) => (
            <AgentRow key={a.platformId} a={a} />
          ))}
        </div>
      )}

      <footer className="mt-12 pt-6 border-t border-neutral-900 text-xs text-neutral-600 text-center">
        <p>
          To create your own:{" "}
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-300 hover:text-neutral-100"
          >
            message @saidinfrabot
          </a>{" "}
          on Telegram or tweet at{" "}
          <a
            href="https://x.com/saidagent"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-300 hover:text-neutral-100"
          >
            @saidagent
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
