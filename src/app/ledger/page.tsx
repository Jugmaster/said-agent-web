import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import { notFound } from "next/navigation";
import { getLaunch } from "@/lib/launch";
import { getLedger, type Ledger } from "@/lib/api";
import s from "@/app/landing.module.css";

export const metadata: Metadata = {
  // Unlinked until there is real data: reachable by URL, not indexed, not in the nav.
  robots: { index: false, follow: false },
  title: "The Ledger · Atcha",
  description: "Where the token's money goes: creator fees in, agents funded, fees and buybacks back. Every month, in public.",
  openGraph: { title: "The Ledger · Atcha", description: "Where the token's money goes, every month, in public.", type: "website" },
};
export const revalidate = 60;

const usd = (v: number | null | undefined, d = 0) => (v == null ? "$—" : `$${v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`);
const sol = (v: number | null | undefined) => (v == null ? "— SOL" : `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`);
const short = (a: string | null) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "—");
const monthName = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });


export default async function LedgerPage() {
  // The Ledger is where the token's money goes. Before the mint exists there is nothing to show.
  const { launched, fundingOpen, ticker } = getLaunch();
  if (!launched) notFound();
  const real = await getLedger();
  // Never an example, never an estimate. If the API is down, say so; zeros are zeros.
  if (!real) {
    return (
      <div className={s.page}>
        <PublicMotion />
        <Navbar />
        <main className={s.wrap}>
          <header className={s.pageHead} data-reveal>
            <p className={s.eyebrow}>The ledger</p>
            <h1 className={s.big}>Where the money goes.</h1>
            <p className={s.pageSub}>The ledger is not reachable right now. Nothing on this page is ever an estimate; when the API is back, the real numbers are.</p>
          </header>
        </main>
      </div>
    );
  }
  const L = real;
  const flow = [
    { n: "01", label: "Creator wallet, now", value: L.creatorFeesSol != null ? sol(L.creatorFeesSol) : "—", sub: L.creatorWallet ? `balance right now, not fees to date · ${short(L.creatorWallet)}` : "read from the creator wallet once the token is live" },
    { n: "02", label: "The pool", value: usd(L.poolUsd), sub: `${sol(L.poolSol)} · topped up on demand · ${short(L.poolWallet)}` },
    { n: "03", label: "Agents funded", value: L.agentsFunded.toLocaleString(), sub: `${usd(L.fundedTotalUsd)} in total · ${usd(L.fundedThisMonthUsd)} this month to ${L.agentsFundedThisMonth}` },
    { n: "04", label: "They trade", value: usd(L.tradedByFundedUsd), sub: "volume on funded budgets" },
    { n: "05", label: "Comes back", value: usd(L.feesFromFundedUsd + L.shareKeptUsd), sub: `1% of trades ${usd(L.feesFromFundedUsd)} · our 20% of gains ${usd(L.shareKeptUsd)}` },
    { n: "06", label: "Bought \u0026 locked", value: `${(L.buyback.atchaBought / 1e6).toFixed(2)}M`, sub: `${L.buyback.buys} buys · ${sol(L.buyback.solSpent)} · never sold, by policy · ${short(L.buyback.lockWallet)}` },
  ];
  const pct = L.selfFundedPct;

  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <main className={s.wrap}>
        <header className={s.pageHead} data-reveal>
          <p className={s.eyebrow}>The ledger{ticker ? ` · $${ticker.replace(/^\$/, "")}` : ""} · {L.live && fundingOpen ? "live" : fundingOpen ? "dry run" : "funding opens soon"}</p>
          <h1 className={s.big}>Where the money goes.</h1>
          <p className={s.pageSub}>
            The token funds the agents. Nothing else. This page is the account: what the token earned, what the pool paid out, what came back, and what was bought and locked. Every month, every line, in public.
          </p>
          {L.notes && (
            <p className={s.pageSub} style={{ fontSize: "0.95rem", marginTop: 14 }}>
              What this page can and cannot prove: {L.notes.creatorWallet}. {L.notes.lock}. {L.notes.teamTrading}.
            </p>
          )}
        </header>

        {/* The flow, in order. */}
        <div className={s.tiles} data-stagger>
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
              ["Funds agents", "The pool funds every agent that earns entry, in SOL, into a house wallet. Sized by level, never by holdings. 80% of realised gains are the user's; a 40% equity drawdown stops the account and recycles the rest."],
              ["Buys and locks", "A share of fees buys the token in batches into a wallet that never sells. Every buy has a receipt."],
              ["Never pays holders", "No yield, no airdrops, no burn. Nothing is ever paid out in the token."],
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
