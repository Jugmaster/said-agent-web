"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getIdleLeaderboard, getStats } from "@/lib/api";
import PartnerTicker from "@/components/PartnerTicker";

/* ── icons (lucide paths, inline so no dep) ── */
const ic = "w-5 h-5";
const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={ic}>
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </svg>
);
const IconBag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={ic}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const IconSwap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={ic}>
    <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
);
const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={ic}>
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </svg>
);

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 min-w-[150px] text-center px-4 py-7 rounded-2xl border border-zinc-800/60 bg-zinc-900/30">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="text-[11px] text-zinc-500 mt-2 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-[10px] text-zinc-600 mt-1">{sub}</div>}
    </div>
  );
}

const CAPABILITIES: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <IconSend />, title: "Send by @handle", body: "Pay any friend by their X or Telegram handle — no 44-character addresses." },
  { icon: <IconBag />, title: "Buy real things", body: "Order from Amazon & Shopify right inside the chat. Crypto in, package out." },
  { icon: <IconSwap />, title: "Swap, limit & DCA", body: "Market-swap any Solana token via Jupiter — plus price alerts, limit orders, and DCA." },
  { icon: <IconBolt />, title: "Earns while idle", body: "Your agent picks up paid compute jobs on IDLE and gets paid in USDC." },
];

export default function HomeBelowFold() {
  const { ready, login } = usePrivy();
  const [agents, setAgents] = useState<number | null>(null);
  const [actions, setActions] = useState<number | null>(null);
  const [jobs, setJobs] = useState<number | null>(null);

  useEffect(() => {
    getStats()
      .then((s) => {
        if (s) {
          setAgents(s.agents.total);
          setActions(s.activity.totalReceipts);
        }
      })
      .catch(() => {});
    getIdleLeaderboard(1)
      .then((l) => {
        if (l) setJobs(l.aggregate.jobsCompleted);
      })
      .catch(() => {});
  }, []);

  const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString());

  return (
    <div className="pb-24">
      {/* Integrated partners ticker */}
      <PartnerTicker />

      {/* Live stats */}
      <section className="px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest">
              Live on Solana mainnet
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Stat label="Jobs completed" value={fmt(jobs)} sub="via IDLE compute" />
            <Stat label="Actions executed" value={fmt(actions)} sub="on-chain" />
            <Stat label="Agents" value={fmt(agents)} sub="and growing" />
          </div>
        </div>
      </section>

      {/* What your agent can do */}
      <section className="px-6 mt-24">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">What your agent can do</h2>
          <p className="text-sm text-zinc-500 mt-2">One chat. One wallet. No seed phrases.</p>
        </div>
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 px-5 py-5 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center mb-3">
                {c.icon}
              </div>
              <div className="font-semibold mb-1">{c.title}</div>
              <div className="text-sm text-zinc-400 leading-relaxed">{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-6 mt-24">
        <div className="max-w-2xl mx-auto text-center rounded-3xl border border-zinc-800/60 bg-zinc-900/40 px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Get your agent</h2>
          <p className="text-sm text-zinc-400 mb-7 max-w-md mx-auto">
            Free to start, sponsored onboarding, no SOL required. Activated in one message.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://t.me/saidinfrabot"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition"
            >
              Start in Telegram →
            </a>
            <button
              onClick={login}
              disabled={!ready}
              className="w-full sm:w-auto px-8 py-3 border border-zinc-700 rounded-lg font-semibold text-zinc-200 hover:bg-zinc-800/50 disabled:opacity-50 transition"
            >
              {ready ? "Open web app" : "Loading…"}
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 mt-5">
            Non-custodial · keys secured by Privy · no seed phrase
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 mt-24 border-t border-zinc-900 pt-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">SAID Agent</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs">on Solana</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/agents" className="hover:text-white transition">Agents</Link>
            <Link href="/stats" className="hover:text-white transition">Stats</Link>
            <Link href="/docs" className="hover:text-white transition">Docs</Link>
            <a href="https://x.com/saidagent" target="_blank" rel="noreferrer" className="hover:text-white transition">X</a>
            <a href="https://t.me/saidinfrabot" target="_blank" rel="noreferrer" className="hover:text-white transition">Telegram</a>
            <a href="https://www.saidprotocol.com" target="_blank" rel="noreferrer" className="hover:text-white transition">Protocol</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
