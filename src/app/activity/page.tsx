"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActivity, type ActivityResponse, type ActivityReceipt } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import Navbar from "@/components/Navbar";

function timeAgo(iso: string): string {
  const t = new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function actionLabel(type: string): { emoji: string; text: string; color: string } {
  switch (type) {
    case "swap":
      return { emoji: "🔄", text: "Swap", color: "text-blue-400" };
    case "stake":
      return { emoji: "🔒", text: "Stake", color: "text-green-400" };
    case "transfer":
      return { emoji: "📤", text: "Transfer", color: "text-purple-400" };
    case "test_action":
      return { emoji: "🧪", text: "Test", color: "text-neutral-500" };
    default:
      return { emoji: "•", text: type, color: "text-neutral-300" };
  }
}

function ReceiptItem({ r }: { r: ActivityReceipt }) {
  const label = actionLabel(r.type);
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-start gap-3">
      <span className="text-xl leading-none mt-0.5">{label.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium ${label.color}`}>{label.text}</span>
          <span className="text-xs text-neutral-500">{timeAgo(r.occurredAt)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
          <span>#{r.seq}</span>
          {r.anchored ? (
            <span className="text-green-500">⛓ anchored</span>
          ) : (
            <span className="text-neutral-600">pending anchor</span>
          )}
        </div>
        {r.onChainTx && (
          <a
            href={`https://solscan.io/tx/${r.onChainTx}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 text-xs text-neutral-500 hover:text-neutral-300 break-all block"
          >
            {r.onChainTx.slice(0, 16)}…{r.onChainTx.slice(-8)} ↗
          </a>
        )}
      </div>
    </div>
  );
}

function ActivityScreen({ platformId }: { platformId: string }) {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivity(platformId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"))
      .finally(() => setLoading(false));
  }, [platformId]);

  return (
    <main className="px-4 py-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Activity</h1>
          <p className="text-xs text-neutral-500 mt-1">
            On-chain receipts and DCA rules
          </p>
        </div>
        <Link
          href="/chat"
          className="text-xs px-3 py-1 rounded-md border border-neutral-700 hover:border-neutral-500"
        >
          Back to chat
        </Link>
      </header>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}

      {error && (
        <div className="bg-red-950/30 border border-red-900 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && (
        <>
          {data.feeStats.txCount > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
                <div className="text-xs text-neutral-500">Total transactions</div>
                <div className="text-lg font-semibold mt-1">{data.feeStats.txCount}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
                <div className="text-xs text-neutral-500">SAID fees paid</div>
                <div className="text-lg font-semibold mt-1">
                  {data.feeStats.totalFee.toFixed(4)}
                </div>
              </div>
            </div>
          )}

          {data.dcaRules.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-medium text-neutral-400 mb-2">
                DCA rules ({data.dcaRules.filter((r) => !r.paused).length} active)
              </h2>
              <div className="space-y-2">
                {data.dcaRules.map((r) => (
                  <div
                    key={r.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3"
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
                    <div className="text-xs text-neutral-500 mt-1">
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
            <h2 className="text-sm font-medium text-neutral-400 mb-2">
              Recent receipts
            </h2>
            {data.receipts.length === 0 ? (
              <p className="text-sm text-neutral-500 italic">
                No on-chain activity yet. Try a swap from chat.
              </p>
            ) : (
              <div className="space-y-2">
                {data.receipts.map((r) => (
                  <ReceiptItem key={r.seq} r={r} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default function ActivityPage() {
  return (
    <>
      <Navbar />
      <AuthGate>{(platformId) => <ActivityScreen platformId={platformId} />}</AuthGate>
    </>
  );
}
