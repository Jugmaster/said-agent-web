"use client";

import { useEffect, useState } from "react";
import { getProof, type Proof, type ProofAccount, type ProofDecision, type ThesisRow } from "@/lib/api";
import s from "@/app/landing.module.css";

const usd = (v: number | null | undefined, d = 2) => (v == null ? "$—" : `$${v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`);
const signed = (v: number | null | undefined, d = 2) => (v == null ? "—" : `${v >= 0 ? "+" : "−"}${usd(Math.abs(v), d)}`);
const pct = (v: number | null | undefined) => (v == null ? "" : ` (${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%)`);
const short = (a: string | null) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "—");
const when = (at: string) => {
  const d = new Date(at.includes("T") ? at : at.replace(" ", "T") + "Z");
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
};
const upDown = (v: number | null | undefined) => ({ color: (v ?? 0) >= 0 ? "var(--color-up)" : "var(--color-down)" });

/* The record, refreshed every minute. Every account that runs for real is on it; none is
   left off for a bad week. The reason is written before the trade, the transaction after. */
export default function ProofBoard() {
  const [proof, setProof] = useState<Proof | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const load = () => getProof().then((p) => alive && setProof(p)).catch(() => alive && setProof(null));
    load();
    const t = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (proof === undefined) return <div className={s.empty} style={{ marginTop: 44 }}>Reading the record…</div>;
  if (proof === null) return <div className={s.empty} style={{ marginTop: 44 }}>The record is not reachable right now. Nothing on this page is ever an estimate; when the API is back, the real numbers are.</div>;
  if (proof.accounts.length === 0) return <div className={s.empty} style={{ marginTop: 44 }}>No account is trading for real yet. The record starts with the first one.</div>;

  const bar = proof.bar;
  const barLine = bar.met
    ? "Cleared: in profit, ahead of holding SOL, over the full window."
    : [
        bar.days < bar.minDays ? `${Math.floor(bar.days)} of ${bar.minDays} days` : null,
        bar.closedTrades < bar.minTrades ? `${bar.closedTrades} of ${bar.minTrades} closed trades` : null,
        bar.beatsSol === false ? "behind holding SOL" : null,
        bar.beatsSol && (proof.pnlUsd ?? 0) <= 0 ? "not in profit" : null,
      ].filter(Boolean).join(" · ") || "not yet";

  return (
    <>
      <div className={s.tiles}>
        <div className={s.tile}>
          <span className={s.eyebrow} style={{ margin: 0 }}>Now worth</span>
          <div className="val" style={upDown(proof.pnlUsd)}>{usd(proof.equityUsd, 0)}</div>
          <div className="tsub">{usd(proof.principalUsd, 0)} put in · {signed(proof.pnlUsd)}{pct(proof.pnlPct)} after every fee</div>
        </div>
        <div className={s.tile}>
          <span className={s.eyebrow} style={{ margin: 0 }}>Had it just held SOL</span>
          <div className="val">{usd(proof.solHoldUsd, 0)}</div>
          <div className="tsub">
            {proof.vsSolUsd == null ? "no benchmark yet" : <>{proof.vsSolUsd >= 0 ? "agent ahead by " : "agent behind by "}<b style={upDown(proof.vsSolUsd)}>{usd(Math.abs(proof.vsSolUsd))}</b></>}
            {pct(proof.solHoldPct) ? ` · SOL hold${pct(proof.solHoldPct)}` : ""}
          </div>
        </div>
        <div className={s.tile}>
          <span className={s.eyebrow} style={{ margin: 0 }}>The bar</span>
          <div className="val">{Math.floor(bar.days)}<span style={{ fontSize: "0.4em", color: "var(--color-grey)" }}> / {bar.minDays} days</span></div>
          <div className="tsub">{barLine}</div>
        </div>
      </div>

      <div className={s.list} style={{ marginTop: 24 }}>
        {proof.accounts.map((a) => <AccountRow key={a.id} a={a} />)}
      </div>

      {proof.scoreboard && (
        <>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 500, letterSpacing: "-0.02em", margin: "56px 0 16px" }}>Receipts</h2>
          <p className={s.pageSub} style={{ marginTop: 0, fontSize: "1rem" }}>Every thesis is graded after the fact by one printed rule: {proof.scoreboard.rule}.</p>
          <div className={s.tiles} style={{ marginTop: 24 }}>
            <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Buys right</span><div className="val">{proof.scoreboard.buys.hitRate == null ? "—" : `${proof.scoreboard.buys.hitRate}%`}</div><div className="tsub">{proof.scoreboard.buys.right} of {proof.scoreboard.buys.n} closed in profit{proof.scoreboard.buys.avgPnlPct != null ? ` · avg ${proof.scoreboard.buys.avgPnlPct >= 0 ? "+" : ""}${proof.scoreboard.buys.avgPnlPct}%` : ""}</div></div>
            <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Passes right</span><div className="val">{proof.scoreboard.passes.hitRate == null ? "—" : `${proof.scoreboard.passes.hitRate}%`}</div><div className="tsub">{proof.scoreboard.passes.right} of {proof.scoreboard.passes.n} declined tokens did not run</div></div>
            <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Open now</span><div className="val">{proof.scoreboard.open}</div><div className="tsub">positions held to a written thesis</div></div>
          </div>
        </>
      )}

      {proof.accounts.some((a) => (a.theses ?? []).length > 0) && (
        <>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 500, letterSpacing: "-0.02em", margin: "56px 0 16px" }}>The theses</h2>
          <p className={s.pageSub} style={{ marginTop: 0, fontSize: "1rem" }}>Written before the order, in a fixed shape: why now, what has to happen, the numbers that get it out, and later how it ended.</p>
          <div className={s.list} style={{ marginTop: 24, gap: 6 }}>
            {proof.accounts.flatMap((a) => (a.theses ?? []).map((t) => ({ a, t })))
              .sort((x, y) => (y.t.createdAt > x.t.createdAt ? 1 : -1))
              .slice(0, 30)
              .map(({ a, t }) => <ThesisLine key={`${a.id}-${t.id}`} a={a} t={t} />)}
          </div>
        </>
      )}

      <h2 style={{ fontSize: "1.3rem", fontWeight: 500, letterSpacing: "-0.02em", margin: "56px 0 16px" }}>Every decision, with its reason</h2>
      <p className={s.pageSub} style={{ marginTop: 0, fontSize: "1rem" }}>
        The reason is written before the order goes out. A refusal is written down too. Anything executed carries its transaction, so the record can be rebuilt from chain alone.
      </p>
      <div className={s.block} style={{ marginTop: 24, padding: "6px 18px" }}>
        <table className={s.table}>
          <thead><tr><th>When</th><th>Account</th><th>Did</th><th>Because</th><th>Tx</th></tr></thead>
          <tbody>
            {proof.accounts.flatMap((a) => a.decisions.map((d) => ({ a, d })))
              .sort((x, y) => (y.d.at > x.d.at ? 1 : -1))
              .slice(0, 60)
              .map(({ a, d }) => <DecisionRow key={`${a.id}-${d.id}`} a={a} d={d} />)}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--color-zinc-400)", fontSize: "0.85rem", marginTop: 14 }}>Read at {when(proof.generatedAt)}{proof.verdict ? " · deployer verdicts on" : " · deployer verdicts off"}.</p>
    </>
  );
}

function AccountRow({ a }: { a: ProofAccount }) {
  return (
    <div className={s.rowItem}>
      <span className={s.rowAvatar}>{a.risk.slice(0, 1).toUpperCase()}</span>
      <span style={{ minWidth: 0 }}>
        <span className={s.rowName}>
          {a.name}
          <small>{a.strategies.join(" · ")} · {a.risk}</small>
          {a.shadow && <span className={s.pill + " " + s.pm}>shadow</span>}
        </span>
        <span className={s.rowMeta}>
          {a.wallet ? <a href={`https://solscan.io/account/${a.wallet}`} target="_blank" rel="noreferrer" className={s.code}>{short(a.wallet)}</a> : "no wallet"}
          {" · "}{usd(a.principalUsd, 0)} put in · {a.trades.executed} orders · {a.trades.closed} closed · {a.trades.refused} refused
          {a.feesUsd != null ? ` · ${usd(a.feesUsd)} fees` : ""}
        </span>
      </span>
      <span className={s.rowRight}>
        <b style={upDown(a.pnlUsd)}>{signed(a.pnlUsd)}{pct(a.pnlPct)}</b>
        {a.vsSolUsd == null ? "no benchmark yet" : `${a.vsSolUsd >= 0 ? "ahead of" : "behind"} SOL by ${usd(Math.abs(a.vsSolUsd))}`}
      </span>
    </div>
  );
}

function DecisionRow({ a, d }: { a: ProofAccount; d: ProofDecision }) {
  const did = d.executed ? (d.action === "buy" ? "Bought" : "Sold") : d.action === "hold" ? "Held off" : d.error === "shadow" ? `Would ${d.action}` : `Tried to ${d.action}`;
  return (
    <tr>
      <td className="m" style={{ whiteSpace: "nowrap" }}>{when(d.at)}</td>
      <td style={{ whiteSpace: "nowrap" }}>{a.name}</td>
      <td style={{ whiteSpace: "nowrap" }}>{did}{d.symbol ? ` ${d.symbol}` : ""}{d.sizeUsd != null && d.action !== "hold" ? ` ${usd(d.sizeUsd, 0)}` : ""}</td>
      <td>{d.reason}{d.error && d.error !== "shadow" ? <span style={{ color: "var(--color-down)" }}> · {d.error}</span> : null}</td>
      <td>{d.tx ? <a href={`https://solscan.io/tx/${d.tx}`} target="_blank" rel="noreferrer" className={s.code}>{d.tx.slice(0, 6)}…</a> : <span className="m">—</span>}</td>
    </tr>
  );
}

const priceStr = (v: number | null | undefined) => (v == null ? "—" : v >= 1 ? `$${v.toFixed(2)}` : `$${v.toPrecision(3)}`);
function ThesisLine({ a, t }: { a: ProofAccount; t: ThesisRow }) {
  const th = t.thesis;
  const ended = t.status === "closed" ? `closed ${t.pnlPct != null ? `${t.pnlPct >= 0 ? "+" : ""}${t.pnlPct.toFixed(1)}%` : ""}` : t.status;
  const outIf = [
    th.invalidation.priceUnderUsd != null ? `price under ${priceStr(th.invalidation.priceUnderUsd)}` : null,
    th.invalidation.liquidityUnderUsd != null ? `liquidity under $${Math.round(th.invalidation.liquidityUnderUsd).toLocaleString()}` : null,
    `${Math.round(th.invalidation.hoursMax ?? th.horizonHours)}h pass`,
  ].filter(Boolean).join(", or ");
  return (
    <div style={{ padding: "12px 14px", borderTop: "1px solid var(--color-line)", fontSize: "0.92rem" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
        <b style={{ textTransform: "uppercase", fontSize: 12, color: t.call === "buy" ? "var(--color-up)" : "var(--color-grey)" }}>{t.call}</b>
        <b>{t.symbol ?? t.mint.slice(0, 6)}</b>
        {t.call === "buy" && t.sizeUsd != null && <span style={{ color: "var(--color-grey)" }}>${t.sizeUsd.toFixed(2)}</span>}
        <span className={s.pill + " " + (t.status === "closed" ? ((t.pnlPct ?? 0) >= 0 ? s.pg : s.pm) : s.pb)} style={{ padding: "2px 10px", fontSize: 12 }}>{ended}</span>
        {t.wasRight != null && <span className={s.pill + " " + (t.wasRight ? s.pg : s.pm)} style={{ padding: "2px 10px", fontSize: 12 }}>{t.wasRight ? "receipt: right" : "receipt: wrong"}</span>}
        <span style={{ color: "var(--color-grey)", fontSize: 12, marginLeft: "auto" }}>{a.name} · {when(t.createdAt)}</span>
      </div>
      <p style={{ margin: "6px 0 4px" }}>{th.headline}</p>
      <p style={{ margin: 0, color: "var(--color-zinc-400)" }}><b style={{ color: "var(--color-ink)", fontWeight: 500 }}>Why now:</b> {th.whyNow} <b style={{ color: "var(--color-ink)", fontWeight: 500 }}>Out if:</b> {outIf}. <b style={{ color: "var(--color-ink)", fontWeight: 500 }}>Target:</b> sell {Math.round(th.target.sellFraction * 100)}% at +{th.target.takeProfitPct}%{th.target.trailPct > 0 ? `, trail ${th.target.trailPct}%` : ""}.{t.exitReason ? <> <b style={{ color: "var(--color-ink)", fontWeight: 500 }}>Ended:</b> {t.exitReason}.</> : null}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-grey)" }}>
        {th.evidence.slice(0, 4).join(" · ")}
        {t.tx && <> · <a href={`https://solscan.io/tx/${t.tx}`} target="_blank" rel="noreferrer" className={s.code}>entry</a></>}
        {t.exitTx && <> · <a href={`https://solscan.io/tx/${t.exitTx}`} target="_blank" rel="noreferrer" className={s.code}>exit</a></>}
      </p>
    </div>
  );
}
