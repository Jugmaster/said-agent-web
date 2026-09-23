"use client";

import Link from "next/link";
import type { BalanceResponse, CashbackResponse } from "@/lib/api";
import { usd } from "@/components/FundedCard";

/* What the agent has earned back, and whether its identity is verified. */
export default function CashbackCard({ balance, cashback, level }: { balance: BalanceResponse | null; cashback: CashbackResponse | null; level: number | null }) {
  const verified = balance?.verified ?? null;
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Cashback</h2>
        {level && <span className="text-[11px] text-zinc-500">level {level} rate</span>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Earned</div>
          <div className="mt-0.5 text-base font-semibold tabular-nums text-white">{cashback ? usd(cashback.earnedUsd) : "$—"}</div>
          <div className="text-[11px] text-zinc-500">on every trade, lifetime</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Claimable</div>
          <div className="mt-0.5 text-base font-semibold tabular-nums text-white">{cashback ? usd(cashback.claimableUsd) : "$—"}</div>
          <div className="text-[11px] text-zinc-500">ready now</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">Every trade earns a little back. Level up and the rate goes up with it.</p>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {verified === null ? <span className="text-zinc-600">…</span> : verified ? (
          <span className="rounded-full border border-green-900 bg-green-950/30 px-2 py-0.5 text-green-300">● Verified</span>
        ) : (
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400">○ Not verified yet</span>
        )}
        <Link href="/portfolio" className="text-zinc-400 underline underline-offset-2 hover:text-white">Identity &amp; links</Link>
      </div>
    </section>
  );
}
