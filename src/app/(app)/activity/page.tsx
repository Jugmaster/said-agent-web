"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DotSeam from "@/components/DotSeam";
import { getActivity, getCashback, type ActivityResponse, type ActivityReceipt, type CashbackResponse } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import { actionLabel, timeAgo } from "@/lib/format";
import { onRefresh } from "@/lib/refresh";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="tile">
      <div className="l">{label}</div>
      <div className="v">{value}</div>
    </div>
  );
}

function ReceiptItem({ r }: { r: ActivityReceipt }) {
  const label = actionLabel(r.type);
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-[var(--line)] px-4 py-3">
      <span className="tyglyph mt-0.5">{label.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{label.text}</span>
          <span className="text-xs text-[var(--faint)]">{timeAgo(r.occurredAt)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--faint)]">
          <span>#{r.seq}</span>
          {r.anchored ? <span className="anch">⛓ anchored</span> : <span className="pend">pending anchor</span>}
        </div>
        {r.onChainTx && (
          <a href={`https://solscan.io/tx/${r.onChainTx}`} target="_blank" rel="noreferrer" className="txl mt-1 block break-all">
            {r.onChainTx.slice(0, 16)}…{r.onChainTx.slice(-8)} ↗
          </a>
        )}
      </div>
    </div>
  );
}

function ReceiptTable({ receipts }: { receipts: ActivityReceipt[] }) {
  return (
    <div className="tbl">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Receipt</th>
            <th>Status</th>
            <th>Transaction</th>
            <th style={{ textAlign: "right" }}>Age</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((r) => {
            const label = actionLabel(r.type);
            return (
              <tr key={r.seq}>
                <td>
                  <span className="ty"><span className="tyglyph">{label.emoji}</span>{label.text}</span>
                </td>
                <td style={{ color: "var(--dim)" }}>#{r.seq}</td>
                <td>
                  {r.anchored ? <span className="anch">⛓ anchored</span> : <span className="pend">pending anchor</span>}
                </td>
                <td>
                  {r.onChainTx ? (
                    <a href={`https://solscan.io/tx/${r.onChainTx}`} target="_blank" rel="noreferrer" className="txl">
                      {r.onChainTx.slice(0, 8)}…{r.onChainTx.slice(-8)} ↗
                    </a>
                  ) : (
                    <span className="pend">—</span>
                  )}
                </td>
                <td className="age">{timeAgo(r.occurredAt)}</td>
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
    <div className="surface">
      {/* MAIN */}
      <div className="col min-w-0 flex-1 overflow-y-auto">
        <div className="head">
          <div>
            <div className="kickm">Activity · on-chain receipts</div>
            <div className="big">{data ? data.receipts.length : "—"}</div>
            <div className="subline">
              receipts settled<i>·</i>{data ? anchored : "—"} anchored on Solana
            </div>
          </div>
        </div>

        <DotSeam />

        {error && <div className="mt-6 rounded-[14px] border border-[rgba(224,108,90,.35)] bg-[rgba(224,108,90,.08)] px-4 py-3 text-sm text-[#e06c5a]">{error}</div>}

        {/* Stats */}
        <div className="tiles" style={{ marginTop: 0 }}>
          <StatTile label="Transactions" value={data ? data.feeStats.txCount : "—"} />
          <StatTile label="Cashback earned" value={cb ? fmtUsd(cb.earnedUsd) : "—"} />
          <StatTile label="Anchored" value={data ? anchored : "—"} />
          <StatTile label="Active DCA" value={data ? activeDca : "—"} />
        </div>

        {/* Receipts */}
        <section className="sect">
          <div className="head">
            <span className="h2">Recent receipts</span>
            <span className="lbl">Verifiable on Solscan</span>
          </div>
          {data == null ? (
            <div className="mt-3.5 h-40 animate-pulse rounded-[20px] border border-[var(--line)] bg-[var(--card)]" />
          ) : data.receipts.length === 0 ? (
            <div className="mt-3.5 rounded-[20px] border border-dashed border-[var(--line)] px-4 py-12 text-center text-sm text-[var(--faint)]">
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
      <aside className="rail hidden shrink-0 overflow-y-auto xl:flex">
        <section className="card">
          <span className="lbl">Summary</span>
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
