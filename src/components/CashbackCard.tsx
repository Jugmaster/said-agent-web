"use client";

import { useState } from "react";
import Link from "next/link";
import { claimCashback, type BalanceResponse, type CashbackResponse } from "@/lib/api";
import { usd } from "@/components/FundedCard";
import { requestRefresh } from "@/lib/refresh";

/* What the agent has earned back, what's pending against the floor, and the claim. */
export default function CashbackCard({ balance, cashback, level, onClaimed }: { balance: BalanceResponse | null; cashback: CashbackResponse | null; level: number | null; onClaimed?: () => void }) {
  const verified = balance?.verified ?? null;
  const [claiming, setClaiming] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const claim = async () => {
    if (!cashback) return;
    setClaiming(true); setNote(null);
    const r = await claimCashback(cashback.platformId);
    if (!r) setNote("Couldn't reach the butler. Try again in a moment.");
    else if (r.status === "paid" || (r.paid && r.paid.length)) { setNote(`Paid ${r.paid?.map((p) => `${p.amount} ${p.currency}`).join(" + ") ?? ""}`); requestRefresh(); onClaimed?.(); }
    else if (r.status === "nothing_to_claim" || r.status === "below_minimum") setNote("Nothing over the floor yet.");
    else if (r.status === "disabled" || r.status === "pool_unconfigured") setNote("Payouts aren't switched on yet.");
    else setNote(r.message ?? `Not paid: ${r.status}`);
    setClaiming(false);
  };
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
          {cashback && cashback.claimableUsd > 0 ? (
            <button type="button" onClick={claim} disabled={claiming} className="mt-1 rounded-lg bg-ink px-3 py-1 text-xs font-semibold text-cream transition hover:bg-coral-deep disabled:opacity-40">{claiming ? "Claiming…" : "Claim"}</button>
          ) : (
            <div className="text-[11px] text-zinc-500">nothing over the floor yet</div>
          )}
        </div>
      </div>
      {/* Why it isn't claimable yet: the floor, per currency, and how far along the pending amount is. */}
      {cashback && (
        <div className="mt-3 rounded-xl border border-line bg-cream px-3 py-2 text-xs text-grey">
          <div className="flex items-baseline justify-between">
            <span>Pending</span>
            <span className="tabular-nums text-ink">{usd(cashback.pendingUsd)}</span>
          </div>
          {(["USDC", "SOL"] as const).map((cur) => {
            const pend = cashback.pending.find((x) => x.currency === cur)?.total ?? 0;
            const min = cashback.minClaim[cur];
            if (pend <= 0) return null;
            const ready = pend >= min;
            const pct = Math.min(100, Math.round((pend / min) * 100));
            return (
              <div key={cur} className="mt-2">
                <div className="flex items-baseline justify-between">
                  <span className="tabular-nums">{pend.toFixed(cur === "SOL" ? 4 : 2)} {cur}</span>
                  <span className={ready ? "text-[#157E4E]" : ""}>{ready ? "ready to claim" : `pays out from ${min} ${cur}`}</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                  <div className={`h-full rounded-full ${ready ? "bg-[#157E4E]" : "bg-coral"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {cashback.pending.some((x) => x.currency !== "USDC" && x.currency !== "SOL" && x.total > 0) && (
            <p className="mt-2">Some cashback is in other tokens and waits until it can be paid in USDC.</p>
          )}
          {cashback.pending.every((x) => x.total <= 0) && <p className="mt-1">Nothing pending. Pays out from {cashback.minClaim.USDC} USDC or {cashback.minClaim.SOL} SOL.</p>}
        </div>
      )}
      {note && <p className="mt-2 text-xs text-ink">{note}</p>}
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
