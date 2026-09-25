"use client";
import ActionIcon, { iconFor, type ActionIconName } from "@/components/ActionIcon";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import FundModal from "@/components/FundModal";
import FundedCard from "@/components/FundedCard";
import DailyTasks from "@/components/DailyTasks";
import CashbackCard from "@/components/CashbackCard";
import PositionsList from "@/components/token/PositionsList";
import TokenSearch from "@/components/token/TokenSearch";
import LevelUp from "@/components/LevelUp";
import { useAgent } from "@/hooks/useAgent";
import { usePrivy } from "@privy-io/react-auth";
import {
  getPortfolio,
  getActivity,
  getBalance,
  getCashback,
  getCredits,
  getCreditsToday,
  getPositions,
  type Position,
  type CashbackResponse,
  type CreditsSummary,
  type CreditsToday,
  type FullPortfolio,
  type ActivityReceipt,
  type BalanceResponse,
} from "@/lib/api";
import { timeAgo, actionLabel, truncMiddle } from "@/lib/format";

export default function HomePage() {
  return (
    <AuthGate>
      {(platformId) => (
        <>
          {/* Agent-first mobile: the dashboard is a DESKTOP surface. On a phone
              the agent is home, so anyone landing here (old link, back button,
              installed shortcut) is handed straight to it instead of getting a
              second, competing home screen. */}
          <MobileHandoff />
          <div className="hidden md:block">
            <Home platformId={platformId} />
          </div>
        </>
      )}
    </AuthGate>
  );
}

function MobileHandoff() {
  const router = useRouter();
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      router.replace("/chat");
    }
  }, [router]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center md:hidden">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
    </div>
  );
}

function fmtUsd(v: number | null | undefined): string {
  if (v == null) return "$—";
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function greeting(): string {
  // Deterministic across SSR/CSR isn't required (client component), but keep it
  // simple + friendly.
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Home({ platformId }: { platformId: string }) {
  const agent = useAgent();
  const walletAddress = agent.status === "ready" ? agent.walletAddress : null;
  const agentName = agent.status === "ready" ? agent.agentName : null;

  // Greet the USER (the human), not their agent — from whatever Privy account
  // they logged in with (X / Telegram / Google / email).
  const { user } = usePrivy();
  const userName =
    user?.twitter?.username ??
    user?.telegram?.username ??
    (user?.google as { name?: string } | undefined)?.name?.split(" ")[0] ??
    user?.email?.address?.split("@")[0] ??
    null;

  const [portfolio, setPortfolio] = useState<FullPortfolio | null>(null);
  const [portfolioErr, setPortfolioErr] = useState(false);
  const [receipts, setReceipts] = useState<ActivityReceipt[] | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [funding, setFunding] = useState(false);
  const [cashback, setCashback] = useState<CashbackResponse | null>(null);
  // undefined = loading, null = credits not available on this API
  const [credits, setCredits] = useState<CreditsSummary | null | undefined>(undefined);
  const [creditsToday, setCreditsToday] = useState<CreditsToday | null>(null);
  const [positions, setPositions] = useState<Position[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (walletAddress) {
      getPortfolio(walletAddress)
        .then((p) => !cancelled && setPortfolio(p))
        .catch(() => !cancelled && setPortfolioErr(true));
    }
    getActivity(platformId)
      .then((a) => !cancelled && setReceipts(a.receipts.slice(0, 8)))
      .catch(() => !cancelled && setReceipts([]));
    getBalance(platformId)
      .then((b) => !cancelled && setBalance(b))
      .catch(() => {});
    getCashback(platformId)
      .then((c) => !cancelled && setCashback(c))
      .catch(() => {});
    getCredits(platformId)
      .then((c) => !cancelled && setCredits(c))
      .catch(() => !cancelled && setCredits(null));
    getCreditsToday()
      .then((t) => !cancelled && setCreditsToday(t))
      .catch(() => {});
    getPositions(platformId)
      .then((p) => !cancelled && setPositions(p))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [walletAddress, platformId]);

  const total = portfolio?.totalUsdValue ?? null;
  const sol = portfolio?.solBalance ?? null;
  const tokens = portfolio?.tokens ?? [];
  // Non-SOL holdings with a real balance, biggest USD value first.
  const holdings = tokens
    .filter((t) => t.balance > 0)
    .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

  return (
    <div className="flex min-h-dvh">
      {/* MAIN — fills the width (no narrow centered column) */}
      <div className="min-w-0 flex-1 md:overflow-y-auto px-5 pt-[max(1.5rem,env(safe-area-inset-top))] md:px-8 md:pt-10 pb-[calc(var(--tabbar-h)+1.5rem)] md:pb-12">
        {/* Hero: the funded account. Falls back to the plain wallet total when
            this API predates credits, so nothing here depends on the deploy. */}
        <div className="mb-8">
          <p className="text-sm text-zinc-500">{greeting()}{userName ? `, ${userName}` : ""}</p>
          {credits !== null ? (
            <div className="mt-3">
              <FundedCard
                summary={credits === undefined ? undefined : { ...credits, balanceUsd: credits.balanceUsd ?? total }}
                today={creditsToday}
                onAddMoney={() => setFunding(true)}
              />
            </div>
          ) : (
          <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {portfolio == null && !portfolioErr ? (
                  <span className="text-zinc-700">$·····</span>
                ) : (
                  fmtUsd(total)
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-sm text-zinc-400">
                <span>{sol != null ? `${sol.toFixed(4)} SOL` : "— SOL"}</span>
                <span className="text-zinc-700">·</span>
                <span>{holdings.length} token{holdings.length === 1 ? "" : "s"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFunding(true)}
              className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-coral-deep"
            >
              Add money
            </button>
          </div>
          )}
        </div>

        {/* The ladder as a to-do list: what unlocks the next level and funding. */}
        {credits !== null && (
          <div className="mb-8">
            <LevelUp platformId={platformId} summary={credits} />
          </div>
        )}

        {/* Quick actions */}
        <div className="mb-9 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <ActionCard href="/send" title="Pay" sub="Anyone you can name" icon="pay" />
          <ActionCard href="/chat" title="Ask your Atcha" sub="It handles the rest" icon="ask" />
          <ActionCard href="/level" title="Level" sub="Record, page, the board" icon="level" />
          <ActionCard href="/portfolio" title="Wallet" sub="Balances & identity" icon="wallet" />
          <ActionCard href="/activity" title="Activity" sub="Receipts & history" icon="activity" />
        </div>

        {/* Positions: what the agent holds, with entry and P&L once the trade log is live. */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-zinc-300">Positions</h2>
            {/* The fast path on the web: paste a mint or a link, or type a symbol. */}
            <div className="flex items-center gap-3">
              <TokenSearch />
              <Link href="/portfolio" className="shrink-0 text-xs text-zinc-500 transition hover:text-zinc-300">
                Full wallet →
              </Link>
            </div>
          </div>
          {portfolio == null && !portfolioErr ? (
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse bg-card" />)}
            </div>
          ) : (
            <PositionsList holdings={portfolio?.tokens ?? []} positions={positions} solBalance={sol ?? 0} solUsd={portfolio?.solUsdValue ?? null} />
          )}
        </section>

        {/* Aside content inline on smaller screens (aside is xl-only) */}
        <div className="mt-9 space-y-6 xl:hidden">
          {credits && credits.funded && (
            <DailyTasks tasks={credits.tasks} ownUsd={credits.ownUsd} streak={credits.streak} />
          )}
          <CashbackCard balance={balance} cashback={cashback} level={credits?.funded ? credits.level : null} />
          <AgentIdentity agentName={agentName} walletAddress={walletAddress} balance={balance} />
          <RecentActivity receipts={receipts} />
        </div>
      </div>

      {/* RIGHT CONTEXT PANEL — like chat, fills the width on wide screens */}
      <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-line p-5 pt-10 xl:flex">
        {credits && credits.funded && (
          <DailyTasks tasks={credits.tasks} ownUsd={credits.ownUsd} streak={credits.streak} />
        )}
        <CashbackCard balance={balance} cashback={cashback} level={credits?.funded ? credits.level : null} />
        <AgentIdentity agentName={agentName} walletAddress={walletAddress} balance={balance} />
        <RecentActivity receipts={receipts} />
      </aside>

      {funding && walletAddress && (
        <FundModal
          walletAddress={walletAddress}
          onClose={() => setFunding(false)}
          onFunded={() => {
            setFunding(false);
            if (walletAddress) getPortfolio(walletAddress).then(setPortfolio).catch(() => {});
            getCredits(platformId).then(setCredits).catch(() => {});
          }}
        />
      )}
    </div>
  );
}

function ActionCard({ href, title, sub, icon }: { href: string; title: string; sub: string; icon: ActionIconName }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-line bg-card p-4 transition hover:border-zinc-600 hover:bg-zinc-900"
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-base text-zinc-200 transition group-hover:bg-zinc-700">
        <ActionIcon name={icon} />
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>
    </Link>
  );
}


function AgentIdentity({
  agentName,
  walletAddress,
  balance,
}: {
  agentName: string | null;
  walletAddress: string | null;
  balance: BalanceResponse | null;
}) {
  const verified = balance?.verified;
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-zinc-800 text-sm font-semibold text-white">
          {(agentName ?? "A").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{agentName ?? "Your Atcha"}</div>
          <div className="flex items-center gap-1.5 text-xs">
            {verified ? (
              <span className="text-emerald-400">● Verified</span>
            ) : balance ? (
              <span className="text-zinc-500">○ Not yet verified</span>
            ) : (
              <span className="text-zinc-600">…</span>
            )}
          </div>
        </div>
      </div>
      {walletAddress && (
        <div className="mt-3 rounded-lg border border-zinc-800/70 bg-zinc-950/50 px-3 py-2 font-mono text-xs text-zinc-500">
          {truncMiddle(walletAddress, 6, 6)}
        </div>
      )}
      <Link
        href="/portfolio"
        className="mt-3 block rounded-lg border border-zinc-800 py-2 text-center text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white"
      >
        View wallet & identity
      </Link>
    </section>
  );
}

function RecentActivity({ receipts }: { receipts: ActivityReceipt[] | null }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Recent activity</h2>
        <Link href="/activity" className="text-[11px] text-zinc-500 transition hover:text-zinc-300">
          View all →
        </Link>
      </div>
      {receipts === null ? (
        <p className="text-xs text-zinc-600">Loading…</p>
      ) : receipts.length === 0 ? (
        <p className="text-xs italic text-zinc-600">Nothing yet. Pay someone by name to start.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {receipts.map((r) => {
            const label = actionLabel(r.type);
            return (
              <div
                key={r.seq}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-card px-3 py-2"
              >
                <span className="text-grey"><ActionIcon name={iconFor(r.type)} /></span>
                <span className={`flex-1 text-sm font-medium ${label.color}`}>{label.text}</span>
                <span className="text-[11px] text-zinc-500">{timeAgo(r.occurredAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
