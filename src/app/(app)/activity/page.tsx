"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActivity, type ActivityResponse, type ActivityReceipt } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import { actionLabel, timeAgo } from "@/lib/format";
import { onRefresh } from "@/lib/refresh";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}

function ReceiptItem({ r }: { r: ActivityReceipt }) {
  const label = actionLabel(r.type);
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <span className="mt-0.5 text-xl leading-none">{label.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium ${label.color}`}>{label.text}</span>
          <span className="text-xs text-zinc-500">{timeAgo(r.occurredAt)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
          <span>#{r.seq}</span>
          {r.anchored ? <span className="text-emerald-500">⛓ anchored</span> : <span className="text-zinc-600">pending anchor</span>}
        </div>
        {r.onChainTx && (
          <a href={`https://solscan.io/tx/${r.onChainTx}`} target="_blank" rel="noreferrer" className="mt-1 block break-all text-xs text-zinc-500 hover:text-zinc-300">
            {r.onChainTx.slice(0, 16)}…{r.onChainTx.slice(-8)} ↗
          </a>
        )}
      </div>
    </div>
  );
}

function ReceiptTable({ receipts }: { receipts: ActivityReceipt[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900/80 text-left text-xs text-zinc-500">
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Receipt</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Transaction</th>
            <th className="px-4 py-3 text-right font-medium">Age</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/80">
          {receipts.map((r) => {
            const label = actionLabel(r.type);
            return (
              <tr key={r.seq} className="transition-colors hover:bg-zinc-900/50">
                <td className="px-4 py-3">
                  <span className="mr-2">{label.emoji}</span>
                  <span className={`font-medium ${label.color}`}>{label.text}</span>
                </td>
                <td className="px-4 py-3 text-zinc-400">#{r.seq}</td>
                <td className="px-4 py-3 text-xs">
                  {r.anchored ? <span className="text-emerald-500">⛓ anchored</span> : <span className="text-zinc-600">pending anchor</span>}
                </td>
                <td className="px-4 py-3">
                  {r.onChainTx ? (
                    <a href={`https://solscan.io/tx/${r.onChainTx}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-zinc-500 transition hover:text-zinc-200">
                      {r.onChainTx.slice(0, 8)}…{r.onChainTx.slice(-8)} ↗
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-700">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-zinc-500">{timeAgo(r.occurredAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ActivityScreen({ platformId }: { platformId: string }) {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getActivity(platformId)
        .then((d) => !cancelled && setData(d))
        .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "load failed"));
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
      <div className="min-w-0 flex-1 overflow-y-auto px-5 pt-24 md:px-8 md:pt-10 pb-[calc(var(--tabbar-h)+1.5rem)] md:pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Activity</h1>
          <p className="mt-1 text-sm text-zinc-400">Every on-chain receipt, verifiable on Solscan.</p>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Transactions" value={data ? data.feeStats.txCount : "—"} />
          <StatTile label="SAID fees paid" value={data ? data.feeStats.totalFee.toFixed(4) : "—"} />
          <StatTile label="Anchored" value={data ? anchored : "—"} />
          <StatTile label="Active DCA" value={data ? activeDca : "—"} />
        </div>

        {/* Receipts */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Recent receipts</h2>
          {data == null ? (
            <div className="h-40 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ) : data.receipts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-12 text-center text-sm text-zinc-500">
              No on-chain activity yet.{" "}
              <Link href="/send" className="text-zinc-300 underline underline-offset-2 hover:text-white">Make a send</Link> to get started.
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
      <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-zinc-800/60 p-5 pt-10 xl:flex">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Summary</h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Transactions" value={data ? String(data.feeStats.txCount) : "—"} />
            <Row label="Fees paid" value={data ? data.feeStats.totalFee.toFixed(4) : "—"} />
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
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium tabular-nums text-zinc-200">{value}</dd>
    </div>
  );
}

function DcaRules({ rules }: { rules: ActivityResponse["dcaRules"] }) {
  const active = rules.filter((r) => !r.paused).length;
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">DCA rules ({active} active)</h2>
      <div className="flex flex-col gap-2">
        {rules.map((r) => (
          <div key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                {r.amount} {r.fromToken} → {r.toMint.slice(0, 6)}…
              </span>
              {r.paused ? <span className="text-xs text-amber-400">paused</span> : <span className="text-xs text-emerald-500">active</span>}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
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
