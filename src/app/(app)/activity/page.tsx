"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActivity, type ActivityResponse, type ActivityReceipt } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import { actionLabel, timeAgo } from "@/lib/format";
import { onRefresh } from "@/lib/refresh";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function ReceiptItem({ r }: { r: ActivityReceipt }) {
  const label = actionLabel(r.type);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-start gap-3">
      <span className="text-xl leading-none mt-0.5">{label.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium ${label.color}`}>{label.text}</span>
          <span className="text-xs text-zinc-500">{timeAgo(r.occurredAt)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
          <span>#{r.seq}</span>
          {r.anchored ? (
            <span className="text-green-500">⛓ anchored</span>
          ) : (
            <span className="text-zinc-600">pending anchor</span>
          )}
        </div>
        {r.onChainTx && (
          <a
            href={`https://solscan.io/tx/${r.onChainTx}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 text-xs text-zinc-500 hover:text-zinc-300 break-all block"
          >
            {r.onChainTx.slice(0, 16)}…{r.onChainTx.slice(-8)} ↗
          </a>
        )}
      </div>
    </div>
  );
}

/** Desktop receipts: a dense, scannable table instead of stacked cards. */
function ReceiptTable({ receipts }: { receipts: ActivityReceipt[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900/80 text-left text-xs text-zinc-500">
            <th className="px-4 py-2.5 font-medium">Type</th>
            <th className="px-4 py-2.5 font-medium">Receipt</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Transaction</th>
            <th className="px-4 py-2.5 font-medium text-right">Age</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/80">
          {receipts.map((r) => {
            const label = actionLabel(r.type);
            return (
              <tr key={r.seq} className="transition-colors hover:bg-zinc-900/50">
                <td className="px-4 py-2.5">
                  <span className="mr-2">{label.emoji}</span>
                  <span className={`font-medium ${label.color}`}>{label.text}</span>
                </td>
                <td className="px-4 py-2.5 text-zinc-400">#{r.seq}</td>
                <td className="px-4 py-2.5 text-xs">
                  {r.anchored ? (
                    <span className="text-green-500">⛓ anchored</span>
                  ) : (
                    <span className="text-zinc-600">pending anchor</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {r.onChainTx ? (
                    <a
                      href={`https://solscan.io/tx/${r.onChainTx}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-zinc-500 hover:text-zinc-200 transition"
                    >
                      {r.onChainTx.slice(0, 8)}…{r.onChainTx.slice(-8)} ↗
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-700">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-xs text-zinc-500 whitespace-nowrap">
                  {timeAgo(r.occurredAt)}
                </td>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getActivity(platformId)
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : "load failed");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    // Re-fetch when funds move anywhere (refresh bus) and when the tab
    // regains focus, so a swap done in chat shows up here without a reload.
    const offRefresh = onRefresh(load);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      offRefresh();
      window.removeEventListener("focus", load);
    };
  }, [platformId]);

  const activeDca = data?.dcaRules.filter((r) => !r.paused).length ?? 0;

  return (
    <main className="px-4 pt-24 md:px-8 md:pt-10 pb-[calc(var(--tabbar-h)+1rem)] md:pb-12 max-w-2xl md:max-w-5xl mx-auto w-full">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Activity</h1>
          <p className="text-xs text-zinc-500 mt-1">
            On-chain receipts and DCA rules
          </p>
        </div>
        <Link
          href="/chat"
          className="md:hidden text-xs px-3 py-1 rounded-md border border-zinc-700 hover:border-zinc-500"
        >
          Back to chat
        </Link>
      </header>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}

      {error && (
        <div className="bg-red-950/30 border border-red-900 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && (
        <>
          {data.feeStats.txCount > 0 && (
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile label="Total transactions" value={data.feeStats.txCount} />
              <StatTile
                label="SAID fees paid"
                value={data.feeStats.totalFee.toFixed(4)}
              />
              <StatTile label="Receipts" value={data.receipts.length} />
              <StatTile label="Active DCA rules" value={activeDca} />
            </div>
          )}

          {data.dcaRules.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-medium text-zinc-400 mb-2">
                DCA rules ({activeDca} active)
              </h2>
              <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-2">
                {data.dcaRules.map((r) => (
                  <div
                    key={r.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {r.amount} {r.fromToken} → {r.toMint.slice(0, 6)}…
                      </span>
                      {r.paused ? (
                        <span className="text-xs text-yellow-400">paused</span>
                      ) : (
                        <span className="text-xs text-green-500">active</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      every {r.cadenceSeconds >= 86400
                        ? `${Math.round(r.cadenceSeconds / 86400)}d`
                        : `${Math.round(r.cadenceSeconds / 3600)}h`}
                      {r.failureCount > 0 && ` · ${r.failureCount} failures`}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">
              Recent receipts
            </h2>
            {data.receipts.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">
                No on-chain activity yet. Try a swap from chat.
              </p>
            ) : (
              <>
                <div className="hidden md:block">
                  <ReceiptTable receipts={data.receipts} />
                </div>
                <div className="md:hidden space-y-2">
                  {data.receipts.map((r) => (
                    <ReceiptItem key={r.seq} r={r} />
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default function ActivityPage() {
  return (
    <AuthGate>{(platformId) => <ActivityScreen platformId={platformId} />}</AuthGate>
  );
}
