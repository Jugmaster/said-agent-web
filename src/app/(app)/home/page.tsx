"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import FundModal from "@/components/FundModal";
import DotSeam from "@/components/DotSeam";
import { useAgent } from "@/hooks/useAgent";
import { usePrivy } from "@privy-io/react-auth";
import {
  getPortfolio,
  getActivity,
  getBalance,
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
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--dim)]" />
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
      <div className="col min-w-0 flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="head">
          <div>
            <div className="kick">{greeting()}{userName ? `, ${userName}` : ""}</div>
            <div className="big">
              {portfolio == null && !portfolioErr ? (
                <span className="text-[var(--faint)]">$·····</span>
              ) : (
                fmtUsd(total)
              )}
            </div>
            <div className="subline">
              {sol != null ? `${sol.toFixed(4)} SOL` : "— SOL"}
              <i>·</i>
              {holdings.length} token{holdings.length === 1 ? "" : "s"}
            </div>
          </div>
          <button type="button" onClick={() => setFunding(true)} className="fill">
            Add funds
          </button>
        </div>

        <DotSeam />

        {/* Quick actions */}
        <div className="qa">
          <ActionCard href="/send" title="Send" sub="Pay anyone by handle" emoji="↗" />
          <ActionCard href="/chat" title="Ask your agent" sub="It handles the rest" emoji="✦" />
          <ActionCard href="/portfolio" title="Wallet" sub="Balances & identity" emoji="▢" />
          <ActionCard href="/calls" title="Comms" sub="Calls & email" emoji="☏" />
          <ActionCard href="/activity" title="Activity" sub="Receipts & history" emoji="≡" />
        </div>

        {/* Holdings */}
        <section className="sect">
          <div className="head">
            <span className="h2">Holdings</span>
            <Link href="/portfolio" className="more">Full wallet →</Link>
          </div>

          {portfolio == null && !portfolioErr ? (
            <div className="grid3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="hold animate-pulse" style={{ height: 73 }} />
              ))}
            </div>
          ) : (
            <div className="grid3">
              {/* SOL always first */}
              <HoldingCard symbol="SOL" balance={sol ?? 0} usd={portfolio?.solUsdValue ?? null} />
              {holdings.map((t) => (
                <HoldingCard key={t.mint} symbol={t.symbol} balance={t.balance} usd={t.usdValue} />
              ))}
              {holdings.length === 0 && (sol ?? 0) === 0 && (
                <button
                  type="button"
                  onClick={() => setFunding(true)}
                  className="hold justify-center text-sm text-[var(--faint)] transition hover:text-[var(--ink)]"
                >
                  + Add funds to get started
                </button>
              )}
            </div>
          )}
        </section>

        {/* Aside content inline on smaller screens (aside is xl-only) */}
        <div className="mt-9 space-y-6 xl:hidden">
          <AgentIdentity agentName={agentName} walletAddress={walletAddress} balance={balance} />
          <RecentActivity receipts={receipts} />
        </div>
      </div>

      {/* RIGHT CONTEXT PANEL — like chat, fills the width on wide screens */}
      <aside className="rail hidden shrink-0 overflow-y-auto xl:flex">
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
          }}
        />
      )}
    </div>
  );
}

function ActionCard({ href, title, sub, emoji }: { href: string; title: string; sub: string; emoji: string }) {
  return (
    <Link
      href={href}
      className="qcard"
    >
      <span className="ic">{emoji}</span>
      <b>{title}</b>
      <span>{sub}</span>
    </Link>
  );
}

function HoldingCard({ symbol, balance, usd }: { symbol: string; balance: number; usd: number | null }) {
  return (
    <div className="hold">
      <span className="tok">{symbol.slice(0, 3).toUpperCase()}</span>
      <span className="m">
        <b className="truncate">{symbol}</b>
        <span className="truncate">
          {balance.toLocaleString(undefined, { maximumFractionDigits: balance < 1 ? 6 : 4 })}
        </span>
      </span>
      <span className="usd">{usd != null ? fmtUsd(usd) : "—"}</span>
    </div>
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
    <section className="card">
      <div className="idrow">
        <span className="av">{(agentName ?? "A").slice(0, 1).toUpperCase()}</span>
        <span className="min-w-0 flex-1">
          <b className="truncate">{agentName ?? "Your agent"}</b>
          {verified ? (
            <span className="vchip">● Verified</span>
          ) : balance ? (
            <span className="text-xs text-[var(--faint)]">○ Unverified</span>
          ) : (
            <span className="text-xs text-[var(--faint)]">…</span>
          )}
        </span>
      </div>
      {walletAddress && (
        <div className="addr">{truncMiddle(walletAddress, 6, 6)}</div>
      )}
      <Link href="/portfolio" className="outline">
        View wallet &amp; identity
      </Link>
    </section>
  );
}

function RecentActivity({ receipts }: { receipts: ActivityReceipt[] | null }) {
  return (
    <section>
      <div className="head">
        <span className="lbl">Recent activity</span>
        <Link href="/activity" className="more">View all →</Link>
      </div>
      {receipts === null ? (
        <p className="mt-2 text-xs text-[var(--faint)]">Loading…</p>
      ) : receipts.length === 0 ? (
        <p className="mt-2 text-xs italic text-[var(--faint)]">Nothing on-chain yet. Try a swap or a send.</p>
      ) : (
        <div className="qlist">
          {receipts.map((r) => {
            const label = actionLabel(r.type);
            return (
              <div
                key={r.seq}
                className="actrow"
              >
                <span className="text-base leading-none">{label.emoji}</span>
                <span className="flex-1">{label.text}</span>
                <span className="when">{timeAgo(r.occurredAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
