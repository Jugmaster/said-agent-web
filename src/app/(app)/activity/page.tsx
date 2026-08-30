"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActivity, getCashback, type ActivityResponse, type ActivityReceipt, type CashbackResponse } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import { actionLabel, timeAgo } from "@/lib/format";
import { onRefresh } from "@/lib/refresh";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-4">
      <div className="text-xs text-[var(--faint)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ink)]">{value}</div>
    </div>
  );
}

function ReceiptItem({ r }: { r: ActivityReceipt }) {
  const label = actionLabel(r.type);
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3">
      <span className="mt-0.5 text-xl leading-none">{label.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium ${label.color}`}>{label.text}</span>
          <span className="text-xs text-[var(--faint)]">{timeAgo(r.occurredAt)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--faint)]">
          <span>#{r.seq}</span>
          {r.anchored ? <span className="text-[var(--good)]">⛓ anchored</span> : <span className="text-[var(--faint)]">pending anchor</span>}
        </div>
        {r.onChainTx && (
          <a href={`https://solscan.io/tx/${r.onChainTx}`} target="_blank" rel="noreferrer" className="mt-1 block break-all text-xs text-[var(--faint)] hover:text-[var(--ink)]">
            {r.onChainTx.slice(0, 16)}…{r.onChainTx.slice(-8)} ↗
          </a>
        )}
      </div>
    </div>
  );
}

function ReceiptTable({ receipts }: { receipts: ActivityReceipt[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--card)]/80 text-left text-xs text-[var(--faint)]">
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Receipt</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Transaction</th>
            <th className="px-4 py-3 text-right font-medium">Age</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {receipts.map((r) => {
            const label = actionLabel(r.type);
            return (
              <tr key={r.seq} className="transition-colors hover:bg-[var(--card)]">
                <td className="px-4 py-3">
                  <span className="mr-2">{label.emoji}</span>
                  <span className={`font-medium ${label.color}`}>{label.text}</span>
                </td>
                <td className="px-4 py-3 text-[var(--dim)]">#{r.seq}</td>
                <td className="px-4 py-3 text-xs">
                  {r.anchored ? <span className="text-[var(--good)]">⛓ anchored</span> : <span className="text-[var(--faint)]">pending anchor</span>}
                </td>
                <td className="px-4 py-3">
                  {r.onChainTx ? (
                    <a href={`https://solscan.io/tx/${r.onChainTx}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-[var(--faint)] transition hover:text-[var(--ink)]">
                      {r.onChainTx.slice(0, 8)}…{r.onChainTx.slice(-8)} ↗
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--faint)]">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-[var(--faint)]">{timeAgo(r.occurredAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function fmtUsd(v: number): string {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ActivityScreen({ platformId }: { platformId: string }) {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [cb, setCb] = useState<CashbackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getActivity(platformId)
        .then((d) => !cancelled && setData(d))
        .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "load failed"));
      getCashback(platformId)
        .then((c) => !cancelled && setCb(c))
        .catch(() => {}); // cashback is additive — never block the page on it
    };
    load();
    const offRefresh = onRefresh(load);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      offRefresh();
      window.removeEventListener("focus", load);
    };
  }, [platformId]);

  const activeDca = data?.dcaRules.filter((r) => !r.paused).length ?? 0;
  const anchored = data?.receipts.filter((r) => r.anchored).length ?? 0;
  const pending = (data?.receipts.length ?? 0) - anchored;

  return (
    <div className="flex min-h-dvh">
      {/* MAIN */}
      <div className="min-w-0 flex-1 overflow-y-auto px-5 pt-[max(1.5rem,env(safe-area-inset-top))] md:px-8 md:pt-10 pb-[calc(var(--tabbar-h)+1.5rem)] md:pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--ink)] md:text-3xl">Activity</h1>
          <p className="mt-1 text-sm text-[var(--dim)]">Every on-chain receipt, verifiable on Solscan.</p>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Transactions" value={data ? data.feeStats.txCount : "—"} />
          <StatTile label="Cashback earned" value={cb ? fmtUsd(cb.earnedUsd) : "—"} />
          <StatTile label="Anchored" value={data ? anchored : "—"} />
          <StatTile label="Active DCA" value={data ? activeDca : "—"} />
        </div>

        {/* Receipts */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--ink)]">Recent receipts</h2>
          {data == null ? (
            <div className="h-40 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--card)]" />
          ) : data.receipts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-12 text-center text-sm text-[var(--faint)]">
              No on-chain activity yet.{" "}
              <Link href="/send" className="text-[var(--ink)] underline underline-offset-2 hover:text-[var(--ink)]">Make a send</Link> to get started.
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <ReceiptTable receipts={data.receipts} />
              </div>
              <div className="space-y-2 md:hidden">
                {data.receipts.map((r) => <ReceiptItem key={r.seq} r={r} />)}
              </div>
            </>
          )}
        </section>

        {/* DCA inline on small screens */}
        {data && data.dcaRules.length > 0 && (
          <div className="mt-8 xl:hidden">
            <DcaRules rules={data.dcaRules} />
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-[var(--line)] p-5 pt-10 xl:flex">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--faint)]">Summary</h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Transactions" value={data ? String(data.feeStats.txCount) : "—"} />
            <Row label="Cashback earned" value={cb ? fmtUsd(cb.earnedUsd) : "—"} />
            <Row label="Cashback claimable" value={cb ? fmtUsd(cb.claimableUsd) : "—"} />
            <Row label="Anchored" value={data ? String(anchored) : "—"} />
            <Row label="Pending anchor" value={data ? String(pending) : "—"} />
          </dl>
        </section>
        {data && data.dcaRules.length > 0 && <DcaRules rules={data.dcaRules} />}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[var(--faint)]">{label}</dt>
      <dd className="font-medium tabular-nums text-[var(--ink)]">{value}</dd>
    </div>
  );
}

function DcaRules({ rules }: { rules: ActivityResponse["dcaRules"] }) {
  const active = rules.filter((r) => !r.paused).length;
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--faint)]">DCA rules ({active} active)</h2>
      <div className="flex flex-col gap-2">
        {rules.map((r) => (
          <div key={r.id} className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--ink)]">
                {r.amount} {r.fromToken} → {r.toMint.slice(0, 6)}…
              </span>
              {r.paused ? <span className="text-xs text-[var(--warn)]">paused</span> : <span className="text-xs text-[var(--good)]">active</span>}
            </div>
            <div className="mt-1 text-xs text-[var(--faint)]">
              every {r.cadenceSeconds >= 86400 ? `${Math.round(r.cadenceSeconds / 86400)}d` : `${Math.round(r.cadenceSeconds / 3600)}h`}
              {r.failureCount > 0 && ` · ${r.failureCount} failures`}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ActivityPage() {
  return <AuthGate>{(platformId) => <ActivityScreen platformId={platformId} />}</AuthGate>;
}
