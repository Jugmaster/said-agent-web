"use client";

import Link from "next/link";
import type { ThesisRow } from "@/lib/api";
import { timeAgo } from "@/lib/format";

const price = (v: number | null | undefined) => (v == null ? "—" : v >= 1 ? `$${v.toFixed(2)}` : `$${v.toPrecision(3)}`);
const usd = (v: number | null | undefined) => (v == null ? "" : `$${v.toFixed(2)}`);

export function statusLabel(t: ThesisRow): { text: string; tone: string } {
  if (t.status === "proposed") return { text: "waiting for you", tone: "bg-warn-soft text-warn" };
  if (t.status === "open") return { text: "open", tone: "bg-up-soft text-up" };
  if (t.status === "closed") return { text: `closed ${t.pnlPct != null ? `${t.pnlPct >= 0 ? "+" : ""}${t.pnlPct.toFixed(1)}%` : ""}`, tone: (t.pnlPct ?? 0) >= 0 ? "bg-up-soft text-up" : "bg-down-soft text-down" };
  if (t.status === "passed") return { text: "passed", tone: "bg-btn text-grey" };
  if (t.status === "shadow") return { text: "shadow", tone: "bg-btn text-grey" };
  if (t.status === "skipped") return { text: "skipped", tone: "bg-btn text-grey" };
  return { text: t.status, tone: "bg-down-soft text-down" };
}

/**
 * One thesis, the way the desk wrote it before the trade: the call, why now, what has to happen,
 * what gets it out, and later how it ended and whether the receipt graded it right.
 */
export default function ThesisCard({ t, onAnswer, busy, compact }: { t: ThesisRow; onAnswer?: (approve: boolean) => void; busy?: boolean; compact?: boolean }) {
  const th = t.thesis;
  const st = statusLabel(t);
  const outIf = [
    th.invalidation.priceUnderUsd != null ? `price under ${price(th.invalidation.priceUnderUsd)}` : null,
    th.invalidation.liquidityUnderUsd != null ? `liquidity under $${Math.round(th.invalidation.liquidityUnderUsd).toLocaleString()}` : null,
    `${Math.round(th.invalidation.hoursMax ?? th.horizonHours)}h pass`,
  ].filter(Boolean).join(", or ");
  return (
    <article className="rounded-xl bg-paper px-3 py-2.5 text-xs">
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 rounded-md px-1.5 py-0.5 font-semibold uppercase ${t.call === "buy" ? "bg-up-soft text-up" : "bg-btn text-grey"}`}>{t.call}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-ink">
            {t.mint ? <Link href={`/token/${t.mint}`} className="font-medium underline underline-offset-2">{t.symbol ?? t.mint.slice(0, 6)}</Link> : t.symbol}
            {t.call === "buy" && t.sizeUsd != null ? <span className="text-grey"> · {usd(t.sizeUsd)}</span> : null}
            <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[11px] ${st.tone}`}>{st.text}</span>
            {t.wasRight != null && <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${t.wasRight ? "bg-up-soft text-up" : "bg-down-soft text-down"}`}>{t.wasRight ? "receipt: right" : "receipt: wrong"}</span>}
          </div>
          <p className="mt-1 text-ink">{th.headline}</p>
          {!compact && (
            <div className="mt-1.5 flex flex-col gap-1 text-grey">
              <p><span className="text-ink">Why now:</span> {th.whyNow}</p>
              <p><span className="text-ink">Expected:</span> {th.expected}</p>
              <p><span className="text-ink">Out if:</span> {outIf}{th.invalidation.note ? ` (${th.invalidation.note})` : ""}</p>
              <p><span className="text-ink">Target:</span> sell {Math.round(th.target.sellFraction * 100)}% at +{th.target.takeProfitPct}%{th.target.trailPct > 0 ? `, trail the rest ${th.target.trailPct}%` : ""} · confidence {th.confidence.toFixed(2)}</p>
              {th.evidence.length > 0 && <p><span className="text-ink">Evidence:</span> {th.evidence.join(" · ")}</p>}
              {th.risks.length > 0 && <p><span className="text-ink">Risks:</span> {th.risks.join("; ")}</p>}
              {t.exitReason && <p><span className="text-ink">Ended:</span> {t.exitReason}</p>}
            </div>
          )}
          <p className="mt-1 text-grey">
            {timeAgo(t.createdAt)}{t.model ? ` · ${t.model}` : ""}
            {t.tx && <> · <a href={`https://solscan.io/tx/${t.tx}`} target="_blank" rel="noreferrer" className="underline">entry tx</a></>}
            {t.exitTx && <> · <a href={`https://solscan.io/tx/${t.exitTx}`} target="_blank" rel="noreferrer" className="underline">exit tx</a></>}
          </p>
          {t.status === "proposed" && onAnswer && (
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={busy} onClick={() => onAnswer(true)} className="rounded-full bg-ink px-3 py-1 text-cream transition hover:opacity-90 disabled:opacity-40">Approve {usd(t.sizeUsd)}</button>
              <button type="button" disabled={busy} onClick={() => onAnswer(false)} className="rounded-full px-3 py-1 text-ink shadow-[inset_0_0_0_1px_var(--color-ring)] transition hover:bg-btn disabled:opacity-40">Skip</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
