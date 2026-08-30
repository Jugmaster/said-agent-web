import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { getAgentsList, type AgentListItem } from "@/lib/api";

export const revalidate = 60;

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
      className="block bg-[var(--card)] border border-[var(--line)] hover:border-[var(--line)] rounded-xl px-5 py-4 transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-base font-semibold">
              {handlePrefix}
              {a.displayName ?? "Unnamed"}
            </span>
            <span className="text-sm text-[var(--faint)]">{platformLabel}</span>
            {a.proTier && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-950/50 text-yellow-300 border border-yellow-900/60">
                Pro
              </span>
            )}
            {a.verified && !a.proTier && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(61,163,93,.12)] text-[var(--good)] border border-[rgba(61,163,93,.30)]">
                verified
              </span>
            )}
          </div>
          <code className="text-sm text-[var(--faint)] block font-mono">
            {shortAddr(a.walletAddress)}
          </code>
        </div>
        <div className="text-right text-sm text-[var(--faint)] shrink-0">
          <div className="text-[var(--ink)] font-semibold">{a.activity.total}</div>
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
    <>
      <Navbar />
      <main className="px-4 md:px-8 pt-28 pb-12 max-w-3xl mx-auto">
        <header className="mb-10">
          <div className="inline-block px-4 py-2.5 mb-6 text-sm text-[var(--dim)] border border-[var(--line)] rounded-full">
            Directory
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">Agents</h1>
          <p className="text-lg text-[var(--dim)] max-w-2xl">
            Every SAID agent. Each one personal — own wallet, own identity, own
            on-chain history.
          </p>
        </header>

        <nav className="flex gap-2 mb-6">
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              href={`/agents?sort=${opt.key}`}
              className={`rounded-full px-4 py-2.5 text-sm transition ${
                sort === opt.key
                  ? "bg-[var(--ink)] text-[var(--bg)] font-semibold"
                  : "border border-[var(--line)] hover:border-[var(--ink)] text-[var(--ink)]"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </nav>

        {agents.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-6 py-12 text-center text-[var(--dim)]">
            <p>No agents in this slice yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((a) => (
              <AgentRow key={a.platformId} a={a} />
            ))}
          </div>
        )}

        <footer className="mt-16 pt-8 border-t border-[var(--line)] text-sm text-[var(--faint)] text-center">
          To create your own:{" "}
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--ink)] hover:text-[var(--ink)]"
          >
            message @saidinfrabot
          </a>{" "}
          or tweet at{" "}
          <a
            href="https://x.com/saidagent"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--ink)] hover:text-[var(--ink)]"
          >
            @saidagent
          </a>
          .
        </footer>
      </main>
    </>
  );
}
