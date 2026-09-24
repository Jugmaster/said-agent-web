"use client";

import Link from "next/link";
import type { Position, PortfolioToken } from "@/lib/api";
import { fmtPrice } from "./TokenChart";

const usd = (v: number | null | undefined) => (v == null ? "$—" : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const SOL = "So11111111111111111111111111111111111111112";

/**
 * What the agent holds, as positions: chain quantity and value, the average
 * entry and P&L from the trade log, and the instruction that opened it.
 * Tokens the log never saw (deposited, airdropped) still show, without a P&L.
 */
export default function PositionsList({
  holdings,
  positions,
  solBalance,
  solUsd,
  showClosed = false,
}: {
  holdings: PortfolioToken[];
  positions: Position[];
  solBalance: number;
  solUsd: number | null;
  showClosed?: boolean;
}) {
  const byMint = new Map(positions.map((p) => [p.mint, p]));
  const open = holdings
    .filter((h) => h.balance > 0)
    .map((h) => ({ h, p: byMint.get(h.mint) ?? null }))
    .sort((a, b) => (b.h.usdValue ?? 0) - (a.h.usdValue ?? 0));
  const closed = showClosed ? positions.filter((p) => p.closed) : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <Row href={`/token/${SOL}`} symbol="SOL" qty={solBalance} value={solUsd} sub="cash" pnl={null} />
      {open.map(({ h, p }) => {
        const value = h.usdValue;
        const pnl = p && p.avgEntryUsd != null && value != null ? value - p.costUsd : null;
        const pct = pnl != null && p && p.costUsd > 0 ? (pnl / p.costUsd) * 100 : null;
        return (
          <Row
            key={h.mint}
            href={`/token/${h.mint}`}
            symbol={h.symbol}
            qty={h.balance}
            value={value}
            sub={p ? `avg ${p.avgEntryUsd != null ? fmtPrice(p.avgEntryUsd) : "—"}${p.openedBy ? ` · "${p.openedBy.slice(0, 48)}${p.openedBy.length > 48 ? "…" : ""}"` : ""}` : "not bought by your agent"}
            pnl={pnl}
            pct={pct}
          />
        );
      })}
      {closed.map((p) => (
        <Row key={`c-${p.mint}`} href={`/token/${p.mint}`} symbol={p.mint.slice(0, 4)} qty={0} value={null} sub={`closed · ${p.sells} sell${p.sells === 1 ? "" : "s"}`} pnl={p.realizedUsd} pct={p.investedUsd > 0 ? (p.realizedUsd / p.investedUsd) * 100 : null} />
      ))}
      {open.length === 0 && solBalance === 0 && (
        <div className="px-4 py-6 text-center text-sm text-grey">Nothing here yet. Tell your agent to buy something.</div>
      )}
    </div>
  );
}

function Row({ href, symbol, qty, value, sub, pnl, pct }: { href: string; symbol: string; qty: number; value: number | null; sub: string; pnl: number | null; pct?: number | null }) {
  const tone = pnl == null ? "text-grey" : pnl >= 0 ? "text-[#157E4E]" : "text-[#B93A16]";
  return (
    <Link href={href} className="flex items-center gap-3 border-b border-line px-4 py-3 transition last:border-b-0 hover:bg-card">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold text-ink">{symbol.slice(0, 3).toUpperCase()}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{symbol} <span className="font-normal text-grey">{qty.toLocaleString(undefined, { maximumFractionDigits: qty < 1 ? 6 : 2 })}</span></span>
        <span className="block truncate text-xs text-grey">{sub}</span>
      </span>
      <span className="text-right">
        <span className="block text-sm font-medium text-ink">{usd(value)}</span>
        <span className={`block text-xs ${tone}`}>{pnl == null ? "" : `${pnl >= 0 ? "+" : "−"}${usd(Math.abs(pnl))}${pct != null ? ` · ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` : ""}`}</span>
      </span>
    </Link>
  );
}
