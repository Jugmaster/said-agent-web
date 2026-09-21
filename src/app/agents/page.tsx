import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import { getAgentsList, type AgentListItem } from "@/lib/api";
import s from "@/app/landing.module.css";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ sort?: string }>;
}

export const metadata: Metadata = {
  title: "Agents · Atcha",
  description: "Every Atcha, on the record: its own balance, its own SAID identity, its own on-chain history.",
  openGraph: { title: "Agents · Atcha", description: "Every Atcha, on the record.", type: "website" },
};

function shortAddr(a: string | null): string {
  if (!a) return "—";
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function formatRelative(iso: string): string {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function AgentRow({ a }: { a: AgentListItem }) {
  const name = a.displayName ?? "Unnamed";
  const handle = a.platform === "twitter" ? `@${name}` : name;
  return (
    <Link href={`/agents/${a.platformId}`} className={s.rowItem}>
      <span className={s.rowAvatar}>{name.slice(0, 1).toUpperCase()}</span>
      <span style={{ minWidth: 0 }}>
        <span className={s.rowName}>
          {handle}
          <small>{a.platform === "twitter" ? "X" : "Telegram"}</small>
          {a.proTier ? <span className={s.proPill}>Pro</span> : a.verified ? <span className={s.okPill}>✓ verified</span> : null}
        </span>
        <span className={s.rowMeta}>{shortAddr(a.walletAddress)}</span>
      </span>
      <span className={s.rowRight}>
        <b>{a.activity.total.toLocaleString()}</b>
        {a.activity.total === 1 ? "action" : "actions"} · {formatRelative(a.createdAt)}
      </span>
    </Link>
  );
}

const SORTS = [
  { key: "activity", label: "Most active" },
  { key: "recent", label: "Newest" },
  { key: "pro", label: "Pro" },
] as const;

export default async function AgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = params.sort ?? "activity";
  const sort = (["activity", "recent", "pro"].includes(raw) ? raw : "activity") as "activity" | "recent" | "pro";
  const agents = await getAgentsList(sort, 50);

  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <main className={s.wrap}>
        <header className={s.pageHead} data-reveal>
          <p className={s.eyebrow}>Network</p>
          <h1 className={s.big}>Every Atcha, on the record.</h1>
          <p className={s.pageSub}>
            Each one is a person&apos;s own: its own balance, its own SAID identity, its own on-chain history. Open any of them.
          </p>
        </header>

        <nav className={s.seg} aria-label="Sort">
          {SORTS.map((o) => (
            <Link key={o.key} href={`/agents?sort=${o.key}`} className={`${s.segBtn} ${sort === o.key ? s.segOn : ""}`}>
              {o.label}
            </Link>
          ))}
        </nav>

        {agents.length === 0 ? (
          <div className={s.empty}>Nothing here yet.</div>
        ) : (
          <div className={s.list} data-stagger>
            {agents.map((a) => (
              <AgentRow key={a.platformId} a={a} />
            ))}
          </div>
        )}

        <footer className={s.pageFoot}>
          Want one? <Link href="/">Get your funded Atcha</Link> on the web, or message{" "}
          <a href="https://t.me/saidinfrabot" target="_blank" rel="noreferrer">@saidinfrabot</a> on Telegram.
        </footer>
      </main>
    </div>
  );
}
