"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCredits, type CreditsSummary } from "@/lib/api";

const usd = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function fundingDate(f: CreditsSummary["funding"]): string {
  if (f.nextFundingAt) {
    const d = new Date(f.nextFundingAt);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  }
  return `on the ${f.fundingDay}${["th", "st", "nd", "rd"][f.fundingDay % 10 > 3 || Math.floor((f.fundingDay % 100) / 10) === 1 ? 0 : f.fundingDay % 10]}`;
}

/**
 * The one line that tells a user where they are on the ladder: people paid out
 * of five before they're funded, level and next funding after. Rendered
 * wherever a send starts or ends, and above chat on phones. Quiet when the API
 * predates credits.
 *
 * `refreshKey` re-reads after a send; the counterparty lands a beat after the
 * send does, so it reads twice.
 */
export default function EntryProgress({
  platformId,
  refreshKey = 0,
  variant = "card",
  href = "/home",
}: {
  platformId: string;
  refreshKey?: number;
  variant?: "card" | "strip";
  href?: string;
}) {
  const [s, setS] = useState<CreditsSummary | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const load = () => getCredits(platformId).then((c) => alive && setS(c)).catch(() => alive && setS(null));
    load();
    const t = setTimeout(load, 2500);
    return () => { alive = false; clearTimeout(t); };
  }, [platformId, refreshKey]);

  if (!s) return null;

  const have = Math.min(s.next?.have ?? 0, s.next?.need ?? 5);
  const need = s.next?.need ?? 5;
  const pct = need > 0 ? Math.round((have / need) * 100) : 0;
  const left = Math.max(0, need - have);

  const headline = !s.funded
    ? `${have} of ${need} verified accounts paid`
    : `Level ${s.level} · ${s.levelName}`;
  const detail = !s.funded
    ? left === 0
      ? "That's five. Your agent is level 2."
      : `${left === 1 ? "One more" : `${left} more`} and your agent is funded.`
    : s.funding.monthlyUsd > 0
      ? `${usd(s.funding.monthlyUsd)} ${s.funding.fundedThisMonth ? "landed this month" : `lands ${fundingDate(s.funding)}`}`
      : s.next
        ? `${s.next.unlocks}: ${have} of ${need} ${s.next.unit}`
        : "";

  if (variant === "strip") {
    return (
      <Link href={href} className="flex items-center gap-3 border-b border-line bg-cream/90 px-4 py-2 text-[13px] backdrop-blur-md">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-coral text-[11px] font-semibold text-cream">{s.funded ? s.level : "@"}</span>
        <span className="min-w-0 flex-1 truncate">
          <b className="font-medium text-ink">{headline}</b>
          {detail && <span className="text-grey"> · {detail}</span>}
        </span>
        {!s.funded && (
          <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-line">
            <span className="block h-full rounded-full bg-coral transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link href={href} className="block rounded-2xl border border-line bg-card px-4 py-3 transition hover:border-ink/30">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{headline}</span>
        {!s.funded && <span className="text-xs text-grey">{pct}%</span>}
      </div>
      {!s.funded && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-coral transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}
      {detail && <p className="mt-1.5 text-xs text-grey">{detail}</p>}
    </Link>
  );
}
