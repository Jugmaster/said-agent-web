"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import AuthGate from "@/components/AuthGate";
import FundModal from "@/components/FundModal";
import FundedCard from "@/components/FundedCard";
import DailyTasks from "@/components/DailyTasks";
import CashbackCard from "@/components/CashbackCard";
import FleetBoard from "@/components/FleetBoard";
import ClaimHandle from "@/components/ClaimHandle";
import AutopilotCard from "@/components/AutopilotCard";
import LevelUp from "@/components/LevelUp";
import { useAgent } from "@/hooks/useAgent";
import {
  getCredits,
  getCreditsToday,
  getHandle,
  getCashback,
  getBalance,
  getPortfolio,
  type CreditsSummary,
  type CreditsToday,
  type CashbackResponse,
  type BalanceResponse,
} from "@/lib/api";

const usd = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The Level page: the product in one place, on every screen size. The funded
 * card, what to do today, the funding record, your public @page, and the
 * board. Desktop Home keeps the card too; this is where phones get it.
 */
export default function LevelPage() {
  return <AuthGate>{(platformId) => <Level platformId={platformId} />}</AuthGate>;
}

function Level({ platformId }: { platformId: string }) {
  const agent = useAgent();
  const walletAddress = agent.status === "ready" ? agent.walletAddress : null;
  const { user } = usePrivy();
  const [atchaHandle, setAtchaHandle] = useState<string | null>(null);
  useEffect(() => { getHandle(platformId).then((h) => setAtchaHandle(h?.handle ?? null)).catch(() => {}); }, [platformId]);
  // Your page is your Atcha name; until you have one, your X or Telegram name works too.
  const handle = atchaHandle ?? user?.twitter?.username ?? user?.telegram?.username ?? null;

  const [credits, setCredits] = useState<CreditsSummary | null | undefined>(undefined);
  const [today, setToday] = useState<CreditsToday | null>(null);
  const [cashback, setCashback] = useState<CashbackResponse | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [funding, setFunding] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => {
      getCredits(platformId).then((c) => alive && setCredits(c)).catch(() => alive && setCredits(null));
      getCreditsToday().then((t) => alive && setToday(t)).catch(() => {});
      getCashback(platformId).then((c) => alive && setCashback(c)).catch(() => {});
      getBalance(platformId).then((b) => alive && setBalance(b)).catch(() => {});
      if (walletAddress) getPortfolio(walletAddress).then((p) => alive && setTotal(p.totalUsdValue ?? null)).catch(() => {});
    };
    load();
    return () => { alive = false; };
  }, [platformId, walletAddress]);

  const fundings = (credits?.recent ?? []).filter((e) => e.kind === "tranche");
  const publicUrl = handle ? `https://atcha.cash/@${handle}` : null;

  const share = async () => {
    if (!publicUrl) return;
    const text = credits?.funded ? `My Atcha is level ${credits.level}. ${publicUrl}` : publicUrl;
    try {
      if (navigator.share) { await navigator.share({ url: publicUrl, text }); return; }
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { /* dismissed */ }
  };

  return (
    <div className="flex min-h-dvh">
    <div className="min-w-0 flex-1 overflow-y-auto px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(var(--tabbar-h)+1.5rem)] md:px-8 md:pt-10 md:pb-12">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Level</h1>

      {credits === null ? (
        <div className="rounded-2xl border border-line bg-card p-5 text-sm text-grey">Levels arrive with the next update. Your balance is on Wallet.</div>
      ) : (
        <FundedCard
          summary={credits === undefined ? undefined : { ...credits, balanceUsd: credits.balanceUsd ?? total }}
          today={today}
          onAddMoney={() => setFunding(true)}
        />
      )}

      {credits !== null && (
        <div className="mt-6">
          <LevelUp platformId={platformId} summary={credits} />
        </div>
      )}

      {/* Autopilot: the agent trades the budget on its own. */}
      {credits !== null && (
        <div className="mt-6">
          <AutopilotCard platformId={platformId} funded={!!credits?.funded} />
        </div>
      )}

      {credits && credits.funded && (
        <div className="mt-6">
          <DailyTasks tasks={credits.tasks} ownUsd={credits.ownUsd} streak={credits.streak} />
        </div>
      )}



      {/* Narrow screens: the rail's content inline. */}
      <div className="mt-6 space-y-6 xl:hidden">
      {/* Your name, then your page: the link is the share card. */}
      <section className="rounded-2xl border border-line bg-card p-4">
        <div className="mb-3 border-b border-line pb-3">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-grey">Your name</div>
          <ClaimHandle platformId={platformId} onClaimed={setAtchaHandle} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-grey">Your page</div>
            <div className="mt-1 truncate text-sm text-ink">{publicUrl ? publicUrl.replace("https://", "") : "Link X or Telegram to get a page"}</div>
          </div>
          {publicUrl && (
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/@${handle}`} className="rounded-full px-3.5 py-2 text-xs font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-ring)] transition hover:bg-ink hover:text-cream">View</Link>
              <button type="button" onClick={share} className="rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-cream transition hover:bg-coral-deep">{copied ? "Copied" : "Share"}</button>
            </div>
          )}
        </div>
      </section>
      <div>
        <CashbackCard balance={balance} cashback={cashback} level={credits?.funded ? credits.level : null} />
      </div>
      </div>

      {/* Funding record: every month, with its receipt. */}
      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-grey">Funding record</h2>
          {credits?.funded && <span className="text-[11px] text-grey">posted in public</span>}
        </div>
        {fundings.length === 0 ? (
          <p className="text-sm text-grey">{credits?.funded ? "Your first funding lands on funding day." : "Pay five verified X accounts and the first one lands."}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {fundings.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral text-xs font-semibold text-cream">$</span>
                <span className="flex-1">{usd(f.amountUsd)} funded</span>
                <span className="text-xs text-grey">{new Date(f.at.endsWith("Z") ? f.at : f.at + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                {f.tx && <a href={`https://solscan.io/tx/${f.tx}`} target="_blank" rel="noreferrer" className="text-xs text-grey underline underline-offset-2 hover:text-ink">tx</a>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* The board: your level next to everyone else's. */}
      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-grey">The board</h2>
          <Link href="/fleet" className="text-[11px] text-grey transition hover:text-ink">Full board →</Link>
        </div>
        <FleetBoard />
      </section>

    </div>

    {/* Wide screens: your name and page, and cashback, in a rail. */}
    <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-line p-5 pt-10 xl:flex">
      {/* Your name, then your page: the link is the share card. */}
      <section className="rounded-2xl border border-line bg-card p-4">
        <div className="mb-3 border-b border-line pb-3">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-grey">Your name</div>
          <ClaimHandle platformId={platformId} onClaimed={setAtchaHandle} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-grey">Your page</div>
            <div className="mt-1 truncate text-sm text-ink">{publicUrl ? publicUrl.replace("https://", "") : "Link X or Telegram to get a page"}</div>
          </div>
          {publicUrl && (
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/@${handle}`} className="rounded-full px-3.5 py-2 text-xs font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-ring)] transition hover:bg-ink hover:text-cream">View</Link>
              <button type="button" onClick={share} className="rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-cream transition hover:bg-coral-deep">{copied ? "Copied" : "Share"}</button>
            </div>
          )}
        </div>
      </section>
      <div>
        <CashbackCard balance={balance} cashback={cashback} level={credits?.funded ? credits.level : null} />
      </div>
    </aside>

      {funding && walletAddress && (
        <FundModal
          walletAddress={walletAddress}
          onClose={() => setFunding(false)}
          onFunded={() => { setFunding(false); getCredits(platformId).then(setCredits).catch(() => {}); }}
        />
      )}
    </div>
  );
}
