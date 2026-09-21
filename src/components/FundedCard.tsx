"use client";

import Link from "next/link";
import type { CreditsSummary, CreditsToday } from "@/lib/api";

/*
 * The funded account, as the user sees it. One balance, two buckets:
 *   credit  ours until earned (trading-only, first-loss, locked until the top rung)
 *   own     theirs from the moment it lands (pay, buy, hire, card, always withdrawable)
 *
 *   summary undefined   loading
 *   summary null        the API predates credits, or credits are off
 *   funded false        signed up before funding switched on
 */

export function usd(v: number | null | undefined, dash = "$—"): string {
  if (v == null) return dash;
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function signed(v: number): string {
  const s = usd(Math.abs(v));
  return v > 0 ? `+${s}` : v < 0 ? `−${s}` : s;
}

export default function FundedCard({
  summary,
  today,
  onAddMoney,
}: {
  summary: CreditsSummary | null | undefined;
  today: CreditsToday | null;
  onAddMoney: () => void;
}) {
  if (summary === undefined) {
    return <div className="h-[188px] animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-900/40" />;
  }

  if (summary === null || !summary.funded) {
    const t = summary?.today ?? today;
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Funded</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {t?.live ? "Your Atcha isn't funded yet." : "Funding opens at launch."}
            </div>
            <p className="mt-1 max-w-[46ch] text-sm text-zinc-400">
              Every new Atcha comes with trading credit, sized by the chart. It takes the first loss so your
              money doesn&apos;t. Add your own to pay anyone.
            </p>
          </div>
          {t && (
            <div className="text-right">
              <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Today&apos;s funding</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{usd(t.fundingUsd)}</div>
              <div className="text-xs text-zinc-500">
                {t.agentsFunded.toLocaleString()} funded · {t.fundedLastHour} in the last hour
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  const s = summary;
  const tradeUsed = s.limits.trade - s.limits.tradeLeft;
  const spendUsed = s.limits.spend - s.limits.spendLeft;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Your Atcha</span>
            <Chip>{`Rung ${s.rung} · ${s.rungName}`}</Chip>
            {s.streak > 0 && <Chip>{`${s.streak}-day streak`}</Chip>}
            {s.tier > 0 && <Chip tone="good">{`$ATCHA tier ${s.tier}`}</Chip>}
            {s.paused && <Chip tone="warn">Paused</Chip>}
          </div>
          <div className="mt-1 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {s.balanceUsd == null ? <span className="text-zinc-700">$·····</span> : usd(s.balanceUsd)}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span>{usd(s.creditUsd)} credit</span>
            <span className="text-zinc-700">·</span>
            <span>{usd(s.ownUsd)} yours</span>
            {s.pnlUsd !== 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span className={s.pnlUsd > 0 ? "text-emerald-400" : "text-red-400"}>
                  {signed(s.pnlUsd)} since funded
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onAddMoney}
            className="rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-coral-deep"
          >
            Add money
          </button>
          <Link
            href={`/chat?prompt=${encodeURIComponent("Lock $ATCHA for a bigger agent")}`}
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
          >
            Lock $ATCHA
          </Link>
        </div>
      </div>

      {s.paused && (
        <p className="mt-4 rounded-lg border border-amber-900 bg-amber-950/30 px-3 py-2 text-sm text-amber-400">
          Paused after a drawdown. Trading and spending are off until two of today&apos;s tasks are done.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
        <Stat label="Yours to take out" value={usd(s.withdrawableUsd)} sub="Your deposits, any time" />
        <Stat label="Locked until you climb" value={usd(s.lockedUsd)} sub="Credit and gains, yours at Owner" />
        <Stat
          label="Trade today"
          value={`${usd(s.limits.tradeLeft)} left`}
          sub={`${usd(tradeUsed)} of ${usd(s.limits.trade)} used`}
        />
        <Stat
          label="Pay today"
          value={s.ownUsd > 0 ? `${usd(s.limits.spendLeft)} left` : "Add money"}
          sub={s.ownUsd > 0 ? `${usd(spendUsed)} of ${usd(s.limits.spend)} used` : "Paying takes your own money"}
        />
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Credit trades the majors. Losses come out of credit before your money. Cashback and gains on credit stay credit.
      </p>
    </section>
  );
}

function Chip({ children, tone }: { children: string; tone?: "good" | "warn" }) {
  const cls =
    tone === "good"
      ? "border-green-900 bg-green-950/30 text-green-300"
      : tone === "warn"
        ? "border-amber-900 bg-amber-950/30 text-amber-400"
        : "border-zinc-700 text-zinc-400";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] leading-4 ${cls}`}>{children}</span>;
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold tabular-nums text-white">{value}</div>
      <div className="truncate text-xs text-zinc-500">{sub}</div>
    </div>
  );
}
