"use client";

import { useEffect, useState } from "react";

/**
 * Internal launch dashboard — lives on the `internal-stats` branch only
 * (Vercel preview URL), off the prod domain. Reads the aggregate-only
 * /api/launch-stats endpoint on butler. Refreshes every 60s.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_BUTLER_API ?? "https://butler.saidprotocol.com";

type Row = Record<string, string | number | null>;

interface Stats {
  generatedAt: string;
  last24h: {
    mentions: { n: number; actors: number };
    repliesPosted: { n: number };
    sends: Row[];
    fees: Row[];
    accruals: Row[];
    newUsers: Row[];
    chat: { msgs: number; users: number };
  };
  last7d: Stats["last24h"];
  allTime: {
    butlerUsers: { n: number };
    sendsExecuted: { n: number };
    feesCollected: Row[];
    referrals: { n: number };
  };
  unclaimed: Row[];
  reclaims: Row[];
  recentSends: Row[];
  dailySends: { day: string; n: number; executedVolume: number }[];
  dailyMentions: { day: string; n: number }[];
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Big({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function MiniTable({ rows, cols }: { rows: Row[]; cols: string[] }) {
  if (!rows?.length) return <p className="text-sm text-zinc-600">none</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-zinc-500 text-left">
          {cols.map((c) => (
            <th key={c} className="font-normal pb-1 pr-3">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-zinc-800">
            {cols.map((c) => (
              <td key={c} className="py-1 pr-3">{String(r[c] ?? "—")}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function LaunchStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`${API_BASE}/api/launch-stats`)
        .then((r) => r.json())
        .then((d) => alive && (setStats(d), setError(null)))
        .catch((e) => alive && setError(String(e)));
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <meta name="robots" content="noindex" />
      <header className="mb-8 flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold tracking-tight">SAID Agent — launch board</h1>
        <span className="text-xs text-zinc-500">
          {stats ? `updated ${new Date(stats.generatedAt).toLocaleTimeString()}` : "loading…"}
          {" · refreshes every 60s"}
        </span>
      </header>

      {error && (
        <p className="text-sm text-red-400 mb-6">stats fetch failed: {error}</p>
      )}

      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Last 24h">
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <Big value={stats.last24h.mentions.n} label={`X mentions (${stats.last24h.mentions.actors} accounts)`} />
              <Big value={stats.last24h.repliesPosted.n} label="replies posted" />
              <Big value={stats.last24h.chat.msgs} label={`chat msgs (${stats.last24h.chat.users} users)`} />
            </div>
          </Card>

          <Card title="All time">
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <Big value={stats.allTime.butlerUsers.n} label="agents w/ wallets" />
              <Big value={stats.allTime.sendsExecuted.n} label="sends executed" />
              <Big value={stats.allTime.referrals.n} label="referral links" />
            </div>
          </Card>

          <Card title="Sends — 24h">
            <MiniTable rows={stats.last24h.sends} cols={["outcome", "asset", "n", "volume"]} />
          </Card>

          <Card title="Revenue — 24h">
            <MiniTable rows={stats.last24h.fees} cols={["class", "currency", "n", "volume"]} />
          </Card>

          <Card title="Sends — 7d">
            <MiniTable rows={stats.last7d.sends} cols={["outcome", "asset", "n", "volume"]} />
          </Card>

          <Card title="Revenue — 7d">
            <MiniTable rows={stats.last7d.fees} cols={["class", "currency", "n", "volume"]} />
          </Card>

          <Card title="New users — 24h / 7d">
            <div className="grid grid-cols-2 gap-4">
              <MiniTable rows={stats.last24h.newUsers} cols={["surface", "n"]} />
              <MiniTable rows={stats.last7d.newUsers} cols={["surface", "n"]} />
            </div>
          </Card>

          <Card title="Flywheel accruals — 24h">
            <MiniTable rows={stats.last24h.accruals} cols={["tier", "currency", "n", "total"]} />
          </Card>

          <Card title="Unclaimed wallets (money waiting)">
            <MiniTable rows={stats.unclaimed} cols={["handle", "amount", "asset"]} />
            <p className="text-xs text-zinc-600 mt-2">
              reclaim ledger: {stats.reclaims.length ? JSON.stringify(stats.reclaims) : "empty (nothing 14d old)"}
            </p>
          </Card>

          <Card title="Recent sends">
            <MiniTable rows={stats.recentSends} cols={["recipient_handle", "amount", "asset", "outcome"]} />
          </Card>

          <Card title="Daily sends (14d)">
            <MiniTable rows={stats.dailySends as unknown as Row[]} cols={["day", "n", "executedVolume"]} />
          </Card>

          <Card title="Daily X mentions (14d)">
            <MiniTable rows={stats.dailyMentions as unknown as Row[]} cols={["day", "n"]} />
          </Card>
        </div>
      )}
    </main>
  );
}
