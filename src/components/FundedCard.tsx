"use client";

import type { CreditsSummary, CreditsToday } from "@/lib/api";

/*
 * The account, as the user sees it: a level, a balance, what the level lets
 * the agent do this month, and what the next level adds. Two kinds of money
 * inside the balance: credit (funded, trades) and cash (theirs).
 *
 *   summary undefined   loading
 *   summary null        the API predates credits
 *   funded false        level 1: unfunded until they pay five people
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
    const next = summary?.next ?? null;
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Your Atcha</span>
              <Chip>Level 1 · Started</Chip>
            </div>
            <div className="mt-1 text-lg font-semibold text-white">Pay five people and it gets funded.</div>
            <p className="mt-1 max-w-[46ch] text-sm text-zinc-400">
              Your agent already trades your money, anything on Solana. Pay five people by their @name, $1 or more each,
              and it gets money of its own to trade with every month.
            </p>
            {next && (
              <Progress have={next.have} need={next.need} label={`${next.have} of ${next.need} people paid`} sub={`Level 2: ${next.unlocks}`} />
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <button type="button" onClick={onAddMoney} className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-coral-deep">
              Add money
            </button>
            {t && t.live && (
              <div className="text-right text-xs text-zinc-500">
                {t.agentsFunded.toLocaleString()} funded · {t.fundedLastHour} in the last hour
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  const s = summary;
  const spendUsed = s.limits.spend - s.limits.spendLeft;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Your Atcha</span>
            <Chip>{`Level ${s.level} · ${s.levelName}`}</Chip>
            {s.streak > 0 && <Chip>{`${s.streak}-day streak`}</Chip>}
            {s.paused && <Chip tone="warn">Sitting out today</Chip>}
          </div>
          <div className="mt-1 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {s.balanceUsd == null ? <span className="text-zinc-700">$·····</span> : usd(s.balanceUsd)}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span>{usd(s.creditUsd)} credit</span>
            <span className="text-zinc-700">·</span>
            <span>{usd(s.ownUsd)} cash</span>
            {s.pnlUsd !== 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span className={s.pnlUsd > 0 ? "text-emerald-400" : "text-red-400"}>{signed(s.pnlUsd)} since funded</span>
              </>
            )}
          </div>
        </div>
        <button type="button" onClick={onAddMoney} className="shrink-0 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-coral-deep">
          Add money
        </button>
      </div>

      {s.paused && (
        <p className="mt-4 rounded-lg border border-amber-900 bg-amber-950/30 px-3 py-2 text-sm text-amber-400">
          Your agent is sitting out today after a rough run. Do two of today&apos;s things and it&apos;s back.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
        <Stat label="Funded this month" value={usd(s.funding.monthlyUsd)} sub={s.funding.fundedThisMonth ? "landed" : `lands on the ${ordinal(s.funding.fundingDay)}`} />
        <Stat label="Trades today" value={`${usd(s.limits.tradeLeft)} left`} sub={`of ${usd(s.limits.trade)} a day at level ${s.level}`} />
        <Stat
          label="Pays out today"
          value={s.ownUsd > 0 ? `${usd(s.limits.spendLeft)} left` : "Add cash"}
          sub={s.ownUsd > 0 ? `of ${usd(s.limits.spend)} a day · ${usd(spendUsed)} used` : "Paying people uses your cash"}
        />
        <Stat label="Yours to take out" value={usd(s.withdrawableUsd)} sub={s.level >= 3 ? "cash and your gains" : "your cash, any time"} />
      </div>

      {s.next && (
        <Progress
          have={s.next.have}
          need={s.next.need}
          label={s.next.unit === "people" ? `${s.next.have} of ${s.next.need} people paid` : `${s.next.have} of ${s.next.need} days`}
          sub={`Level ${s.next.level}: ${s.next.unlocks}`}
        />
      )}

      <p className="mt-3 text-xs text-zinc-500">
        Credit trades; your cash pays. Gains on credit stay in the account and compound until level 3.
      </p>
    </section>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function Progress({ have, need, label, sub }: { have: number; need: number; label: string; sub: string }) {
  const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 100;
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-zinc-300">{label}</span>
        <span className="text-zinc-500">{sub}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-coral transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Chip({ children, tone }: { children: string; tone?: "good" | "warn" }) {
  const cls = tone === "good" ? "border-green-900 bg-green-950/30 text-green-300" : tone === "warn" ? "border-amber-900 bg-amber-950/30 text-amber-400" : "border-zinc-700 text-zinc-400";
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
