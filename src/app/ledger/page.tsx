import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import { getLedger, type Ledger } from "@/lib/api";
import s from "@/app/landing.module.css";

export const metadata: Metadata = {
  title: "The Ledger · Atcha",
  description: "Where $ATCHA's money goes: creator fees in, agents funded, fees and buybacks back. Every month, in public.",
  openGraph: { title: "The Ledger · Atcha", description: "Where the token's money goes, every month, in public.", type: "website" },
};
export const revalidate = 60;

const usd = (v: number | null | undefined, d = 0) => (v == null ? "$—" : `$${v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`);
const sol = (v: number | null | undefined) => (v == null ? "— SOL" : `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`);
const short = (a: string | null) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "—");
const monthName = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Example numbers, shown until the pool is live. Marked as such on the page.
 * The shape is exactly what GET /api/credits/ledger returns, so the page
 * doesn't change when the real thing arrives.
 */
const EXAMPLE: Ledger = {
  live: false,
  asOf: new Date().toISOString(),
  creatorFeesSol: 412.6,
  creatorWallet: "ATCHAcreator1111111111111111111111111111111",
  poolWallet: "ATCHApool1111111111111111111111111111111111",
  poolSol: 38.2,
  poolUsd: 4470,
  agentsFunded: 312,
  agentsFundedThisMonth: 287,
  fundedTotalUsd: 21_450,
  fundedThisMonthUsd: 8_925,
  tradedByFundedUsd: 96_300,
  feesFromFundedUsd: 963,
  gainsSettledUsd: 2_140,
  shareKeptUsd: 535,
  buyback: { enabled: true, live: true, lockWallet: "ATCHAlock11111111111111111111111111111111111", buys: 9, solSpent: 21.4, usdSpent: 2_505, atchaBought: 1_920_000, lastAt: new Date(Date.now() - 6 * 3600e3).toISOString() },
  selfFundedPct: 43,
  months: [
    { month: "2026-11", agentsFunded: 287, fundedUsd: 8_925, feesUsd: 412, buybackSol: 8.1, buybackUsd: 948 },
    { month: "2026-10", agentsFunded: 154, fundedUsd: 4_650, feesUsd: 301, buybackSol: 7.9, buybackUsd: 910 },
    { month: "2026-09", agentsFunded: 61, fundedUsd: 1_525, feesUsd: 88, buybackSol: 5.4, buybackUsd: 647 },
  ],
  milestones: [
    { label: "agents funded", target: 100, have: 312, done: true },
    { label: "agents funded", target: 1_000, have: 312, done: false },
    { label: "funded, USD", target: 10_000, have: 21_450, done: true },
    { label: "a self-funded month", target: 100, have: 43, done: false },
  ],
};

export default async function LedgerPage() {
  const real = await getLedger();
  // Example numbers until the pool has actually funded someone; real zeros say nothing.
  const example = !real || (!real.live && real.agentsFunded === 0);
  const L = example ? EXAMPLE : real!;
  const flow = [
    { n: "01", label: "Creator fees in", value: L.creatorFeesSol != null ? sol(L.creatorFeesSol) : "—", sub: L.creatorWallet ? `the token's creator wallet · ${short(L.creatorWallet)}` : "read from the creator wallet once the token is live" },
    { n: "02", label: "The pool", value: usd(L.poolUsd), sub: `${sol(L.poolSol)} · topped up on demand · ${short(L.poolWallet)}` },
    { n: "03", label: "Agents funded", value: L.agentsFunded.toLocaleString(), sub: `${usd(L.fundedTotalUsd)} in total · ${usd(L.fundedThisMonthUsd)} this month to ${L.agentsFundedThisMonth}` },
    { n: "04", label: "They trade", value: usd(L.tradedByFundedUsd), sub: "volume on funded budgets" },
    { n: "05", label: "Comes back", value: usd(L.feesFromFundedUsd + L.shareKeptUsd), sub: `1% of trades ${usd(L.feesFromFundedUsd)} · 20% of gains ${usd(L.shareKeptUsd)}` },
    { n: "06", label: "$ATCHA bought & locked", value: `${(L.buyback.atchaBought / 1e6).toFixed(2)}M`, sub: `${L.buyback.buys} buys · ${sol(L.buyback.solSpent)} · never sold · ${short(L.buyback.lockWallet)}` },
  ];
  const pct = L.selfFundedPct;

  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <main className={s.wrap}>
        <header className={s.pageHead} data-reveal>
          <p className={s.eyebrow}>The ledger · {L.live ? "live" : example ? "example numbers" : "dry run"}</p>
          <h1 className={s.big}>Where the money goes.</h1>
          <p className={s.pageSub}>
            $ATCHA funds the agents. Nothing else. This page is the account: what the token earned, what the pool paid out, what came back, and what was bought and locked. Every month, every line, in public.
          </p>
          {example && (
            <p className={s.pageSub} style={{ fontSize: "0.95rem", marginTop: 14 }}>
              <span className={s.okPill} style={{ background: "var(--color-warn-soft)", color: "var(--color-warn)" }}>Example numbers</span>&nbsp; The real ledger switches on the day the token is live and the pool is funded. Nothing here is a claim.
            </p>
          )}
        </header>

        {/* The flow, in order. */}
        <div className={s.tiles} data-stagger style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {flow.map((f) => (
            <div key={f.n} className={s.tile}>
              <span className={s.eyebrow} style={{ margin: "0 0 10px" }}>{f.n} · {f.label}</span>
              <div className={s.val}>{f.value}</div>
              <div className={s.tsub}>{f.sub}</div>
            </div>
          ))}
        </div>

        {/* The mission: the pool pays for itself. */}
        <section style={{ marginTop: 56 }} data-reveal>
          <p className={s.eyebrow}>The mission</p>
          <h2 className={s.big} style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.4rem)" }}>The pool pays for itself.</h2>
          <p className={s.pageSub} style={{ marginTop: 12 }}>
            The month fees and the share of gains cover the funding without a top-up is the month the token stops subsidising and starts compounding. This month: <strong style={{ color: "var(--color-ink)" }}>{pct == null ? "no funding yet" : `${pct}% covered`}</strong>.
          </p>
          <div style={{ marginTop: 18, height: 10, borderRadius: 999, background: "var(--color-line)", overflow: "hidden", maxWidth: 640 }}>
            <div style={{ height: "100%", width: `${Math.min(100, pct ?? 0)}%`, background: (pct ?? 0) >= 100 ? "var(--color-up)" : "var(--color-coral)", borderRadius: 999 }} />
          </div>
          <div className={s.list} style={{ marginTop: 28, maxWidth: 640 }}>
            {L.milestones.map((m, i) => (
              <div key={i} className={s.rowItem}>
                <span className={s.rowAvatar} style={m.done ? { background: "var(--color-up)" } : undefined}>{m.done ? "✓" : String(i + 1)}</span>
                <span style={{ minWidth: 0 }}>
                  <span className={s.rowName}>{m.target.toLocaleString()}{m.label === "a self-funded month" ? "%" : ""} {m.label}</span>
                  <span className={s.rowMeta}>{m.done ? "done" : `${m.have.toLocaleString()}${m.label === "a self-funded month" ? "%" : ""} so far`}</span>
                </span>
                <span className={s.rowRight}>{m.done ? <span className={s.okPill}>reached</span> : `${Math.min(100, Math.round((m.have / m.target) * 100))}%`}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Month by month. */}
        <section style={{ marginTop: 56 }} data-reveal>
          <p className={s.eyebrow}>Month by month</p>
          {L.months.length === 0 ? (
            <div className={s.empty}>The first funding day writes the first row.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className={s.table}>
                <thead><tr><th>Month</th><th>Agents funded</th><th>Funded</th><th>Fees back</th><th>Bought &amp; locked</th><th>Covered</th></tr></thead>
                <tbody>
                  {L.months.map((m) => {
                    const covered = m.fundedUsd > 0 ? Math.round(((m.feesUsd + m.buybackUsd) / m.fundedUsd) * 100) : null;
                    return (
                      <tr key={m.month}>
                        <td>{monthName(m.month)}</td>
                        <td>{m.agentsFunded.toLocaleString()}</td>
                        <td>{usd(m.fundedUsd)}</td>
                        <td>{usd(m.feesUsd)}</td>
                        <td>{sol(m.buybackSol)} · {usd(m.buybackUsd)}</td>
                        <td>{covered == null ? "—" : `${covered}%`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* What the token never does. */}
        <section style={{ marginTop: 56, maxWidth: 640 }} data-reveal>
          <p className={s.eyebrow}>The rules</p>
          <div className={s.list}>
            {[
              ["Funds agents", "The pool pays every level-2-and-up agent its month, in SOL, on funding day. Sized by level, never by holdings."],
              ["Buys and locks", "A share of fees buys $ATCHA in batches into a wallet that never sells. Every buy has a receipt."],
              ["Never pays holders", "No yield, no airdrops, no burn. Nothing is ever paid out in $ATCHA."],
              ["Never touches your money", "Your cash is yours. The pool's money trades and never leaves."],
            ].map(([t, d]) => (
              <div key={t} className={s.rowItem}>
                <span className={s.rowAvatar}>@</span>
                <span style={{ minWidth: 0 }}><span className={s.rowName}>{t}</span><span className={s.rowMeta}>{d}</span></span>
                <span />
              </div>
            ))}
          </div>
        </section>

        <footer className={s.pageFoot}>
          Receipts: <Link href="/fleet">the board</Link> · every funding on each agent&apos;s page · buybacks at <code>/api/credits/buybacks</code>. Updated {new Date(L.asOf).toLocaleString("en-GB", { timeZone: "UTC" })} UTC.
        </footer>
      </main>
    </div>
  );
}
