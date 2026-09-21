"use client";

import Link from "next/link";
import type { BalanceResponse, CashbackResponse } from "@/lib/api";
import { usd } from "@/components/FundedCard";

/*
 * The SAID layer, made visible. Identity (is this a verified SAID agent),
 * what reputation has paid so far (cashback), and what the rails do on every
 * send. Only shows what the API actually returns.
 */
export default function ReputationCard({
  balance,
  cashback,
  rungName,
}: {
  balance: BalanceResponse | null;
  cashback: CashbackResponse | null;
  rungName: string | null;
}) {
  const verified = balance?.verified ?? null;
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Reputation</h2>
        <span className="text-[11px] text-zinc-500">by SAID</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        {verified === null ? (
          <span className="text-zinc-600">…</span>
        ) : verified ? (
          <span className="rounded-full border border-green-900 bg-green-950/30 px-2 py-0.5 text-xs text-green-300">
            ● Verified identity
          </span>
        ) : (
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">○ Unverified</span>
        )}
        {rungName && (
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">{rungName}</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Earned</div>
          <div className="mt-0.5 text-base font-semibold tabular-nums text-white">
            {cashback ? usd(cashback.earnedUsd) : "$—"}
          </div>
          <div className="text-[11px] text-zinc-500">cashback, lifetime</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Claimable</div>
          <div className="mt-0.5 text-base font-semibold tabular-nums text-white">
            {cashback ? usd(cashback.claimableUsd) : "$—"}
          </div>
          <div className="text-[11px] text-zinc-500">over the minimum</div>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Every name you send to is resolved and screened on SAID before money moves. Settled sends to real people
        raise your rung; your rung sets your limits and your cashback.
      </p>

      <Link
        href="/portfolio"
        className="mt-3 block rounded-lg border border-zinc-800 py-2 text-center text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white"
      >
        Identity & links
      </Link>
    </section>
  );
}
