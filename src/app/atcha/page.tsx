import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import FleetBoard from "@/components/FleetBoard";
import { getLaunch } from "@/lib/launch";
import { getLedger, getStats, getCreditsToday } from "@/lib/api";
import { loadTokenStats } from "@/app/api/token/[mint]/route";
import s from "@/app/landing.module.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { ticker } = getLaunch();
  const t = ticker ? `$${ticker.replace(/^\$/, "")}` : "The token";
  return {
    title: `${t} · Atcha`,
    description: `${t} in one page: the token, what funds what, how to get funded, the fleet, the platform's numbers and the logs. Every figure read live.`,
    openGraph: { title: `${t} · Atcha`, description: "The token, the pool, the fleet, the numbers, the logs.", type: "website" },
  };
}

const usd = (v: number | null | undefined, d = 0) => (v == null ? "$—" : `$${v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`);
const sol = (v: number | null | undefined) => (v == null ? "— SOL" : `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`);
const short = (a: string | null | undefined) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "—");
const monthName = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const compact = (v: number | null | undefined) => (v == null ? "—" : v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}K` : `$${v.toFixed(0)}`);

const SECTIONS: Array<[string, string]> = [["funded", "Funded"], ["how", "How it works"], ["fleet", "Fleet"], ["stats", "Stats"], ["logs", "Logs"]];

/**
 * The token's page: everything the token touches, in one place, every number
 * read live from the butler. Nothing here is an estimate; a zero is a zero.
 * Reachable only once the mint exists.
 */
export default async function AtchaPage() {
  const { launched, fundingOpen, mint, ticker } = getLaunch();
  if (!launched || !mint) notFound();
  const tick = `$${(ticker ?? "ATCHA").replace(/^\$/, "")}`;
  const [L, P, T, tok] = await Promise.all([getLedger(), getStats({ revalidate: 60 }), getCreditsToday(), loadTokenStats(mint).catch(() => null)]);

  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <main className={s.wrap}>
        <header className={s.pageHead} data-reveal>
          <p className={s.eyebrow}>{tick} · {fundingOpen ? "funding open" : "funding opens soon"} · live</p>
          <h1 className={s.big}>One token. It funds the agents.</h1>
          <p className={s.pageSub}>
            {tick} creator rewards fill a public pool. The pool funds agents that earn their way in. The agents trade, pay, and send fees back. This page is the whole loop, every figure read live.
          </p>
          <div className={s.ctas} style={{ marginTop: 18 }}>
            <Link href={`/token/${mint}`} className={s.btn}>Chart and buy</Link>
            <a href={`https://solscan.io/token/${mint}`} target="_blank" rel="noreferrer" className={`${s.btn} ${s.ghost}`}>{short(mint)} on Solscan ↗</a>
          </div>
          <nav aria-label="Sections" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }}>
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className={s.pill}>{label}</a>
            ))}
          </nav>
        </header>

        {/* Token, as traded right now. */}
        <div className={s.tiles} data-stagger style={{ marginTop: 32 }}>
          <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Price</span><div className={s.val}>{tok?.priceUsd != null ? `$${tok.priceUsd < 0.01 ? tok.priceUsd.toPrecision(3) : tok.priceUsd.toFixed(4)}` : "—"}</div><div className={s.tsub}>{tok?.change?.h24 != null ? `${tok.change.h24 >= 0 ? "+" : ""}${tok.change.h24.toFixed(1)}% today` : "no quote yet"}</div></div>
          <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Market cap</span><div className={s.val}>{compact(tok?.marketCapUsd)}</div><div className={s.tsub}>{tok?.liquidityUsd != null ? `${compact(tok.liquidityUsd)} liquidity` : ""}</div></div>
          <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Volume, 24h</span><div className={s.val}>{compact(tok?.volume24hUsd)}</div><div className={s.tsub}>{tok?.txns24h ? `${tok.txns24h.buys.toLocaleString()} buys · ${tok.txns24h.sells.toLocaleString()} sells` : ""}</div></div>
        </div>

        {/* Funded */}
        <section id="funded" style={{ marginTop: 64 }} data-reveal>
          <p className={s.eyebrow}>Funded</p>
          <h2 className={s.big} style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.4rem)" }}>Our money first. 80% of the upside is yours.</h2>
          <div className={s.tiles} data-stagger style={{ marginTop: 24 }}>
            <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>The pool</span><div className={s.val}>{usd(L?.poolUsd)}</div><div className={s.tsub}>{sol(L?.poolSol)} · {short(L?.poolWallet)} · fed by {tick} creator rewards</div></div>
            <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Agents funded</span><div className={s.val}>{(L?.agentsFunded ?? T?.agentsFunded ?? 0).toLocaleString()}</div><div className={s.tsub}>{usd(L?.fundedTotalUsd)} in total · {T?.fundedToday ?? 0} today</div></div>
            <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Bought &amp; locked</span><div className={s.val}>{L ? `${(L.buyback.atchaBought / 1e6).toFixed(2)}M` : "—"}</div><div className={s.tsub}>{L ? `${L.buyback.buys} buys · ${sol(L.buyback.solSpent)} · never sold, by policy` : ""}</div></div>
          </div>
          <div className={s.list} style={{ marginTop: 24, maxWidth: 720 }}>
            {[
              ["Creator rewards split", "60% to the pool, 20% buys and locks the token, 20% to the platform. Fixed, published, receipted."],
              ["What a funded agent gets", `$${T?.fundingUsd ?? 25} at level 1, paid in SOL into a house wallet. Any token the passport clears with $10K of liquidity, up to a quarter of the budget each, never ${tick}. It trades; it cannot be sent or withdrawn.`],
              ["What you keep", "80% of realised gains, settled daily and paid to your own wallet once the account is three days old. No withdrawal fee."],
              ["Losses", "Come out of the tranche first. A 40% drawdown on equity, positions marked to market, stops the account: everything is sold to SOL and what is left goes back to the pool the same day."],
            ].map(([t, d]) => (
              <div key={t} className={s.rowItem}><span className={s.rowAvatar}>@</span><span style={{ minWidth: 0 }}><span className={s.rowName}>{t}</span><span className={s.rowMeta}>{d}</span></span><span /></div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className={s.acts} style={{ marginTop: 64, paddingBottom: 0 }}>
          <div className={s.act} data-reveal><span className={s.n}>01 / Enter</span><div><h3>Five blue ticks. That&apos;s the entry.</h3><p>Pay $1 or more to five verified X accounts, five different people. No form, no deposit. <strong>The fifth one lands and your agent is funded.</strong> Every person you pay gets an Atcha with money already in it.</p></div></div>
          <div className={s.act} data-reveal><span className={s.n}>02 / Trade</span><div><h3>From the chart, one click.</h3><p>Paste a contract address or open any token page. The passport checks it first: an impersonator is refused with the reason, an unverified token asks once, a clean one goes straight through. <strong>Any token the passport clears; a 40% equity drawdown stops the account.</strong></p></div></div>
          <div className={s.act} data-reveal><span className={s.n}>03 / Settle</span><div><h3>Realised, daily, 80% yours.</h3><p>At 06:00 UTC the day&apos;s realised gains are split: 80% paid to your wallet, 20% stays with the pool. Paper gains never count. <strong>Keep showing up and the level, and next month&apos;s size, climbs.</strong></p></div></div>
        </section>

        {/* Fleet */}
        <section id="fleet" style={{ marginTop: 64 }} data-reveal>
          <p className={s.eyebrow}>Fleet · {fundingOpen ? "live" : "fills when funding opens"}</p>
          <h2 className={s.big} style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.4rem)" }}>Every funded agent, in public.</h2>
          <p className={s.pageSub} style={{ marginTop: 10 }}>Sorted by level, then months funded. The level is the score; the balance is the receipt. Never by P&amp;L.</p>
          <div style={{ marginTop: 20 }}><FleetBoard /></div>
        </section>

        {/* Stats: the platform, not the token */}
        <section id="stats" style={{ marginTop: 64 }} data-reveal>
          <p className={s.eyebrow}>Stats · the platform, live</p>
          <h2 className={s.big} style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.4rem)" }}>What the agents have done.</h2>
          {!P ? (
            <div className={s.empty} style={{ marginTop: 20 }}>Couldn&apos;t reach the platform counters right now.</div>
          ) : (
            <div className={s.tiles} data-stagger style={{ marginTop: 24 }}>
              <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Atchas</span><div className={s.val} data-count>{P.agents.total.toLocaleString()}</div><div className={s.tsub}>{P.agents.verified.toLocaleString()} verified on-chain</div></div>
              <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>On-chain actions</span><div className={s.val} data-count>{P.activity.totalReceipts.toLocaleString()}</div><div className={s.tsub}>swaps, sends, stakes, buys, each with a signature</div></div>
              <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Traded on credit</span><div className={s.val}>{usd(L?.tradedByFundedUsd)}</div><div className={s.tsub}>{usd(L?.feesFromFundedUsd)} in fees back · {usd(L?.gainsSettledUsd)} settled</div></div>
              <div className={s.tile}><span className={s.eyebrow} style={{ margin: 0 }}>Sends waiting</span><div className={s.val} data-count>{P.pendingSends.count.toLocaleString()}</div><div className={s.tsub}>money under a name whose owner hasn&apos;t signed in yet</div></div>
            </div>
          )}
        </section>

        {/* Logs */}
        <section id="logs" style={{ marginTop: 64 }} data-reveal>
          <p className={s.eyebrow}>Logs · month by month</p>
          <h2 className={s.big} style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.4rem)" }}>Where the money went.</h2>
          {!L || L.months.length === 0 ? (
            <div className={s.empty} style={{ marginTop: 20 }}>The first funding writes the first row.</div>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 20 }}>
              <table className={s.table}>
                <thead><tr><th>Month</th><th>Agents funded</th><th>Funded</th><th>Fees back</th><th>Bought &amp; locked</th><th>Covered</th></tr></thead>
                <tbody>
                  {L.months.map((m) => {
                    const covered = m.fundedUsd > 0 ? Math.round(((m.feesUsd + m.buybackUsd) / m.fundedUsd) * 100) : null;
                    return (<tr key={m.month}><td>{monthName(m.month)}</td><td>{m.agentsFunded.toLocaleString()}</td><td>{usd(m.fundedUsd)}</td><td>{usd(m.feesUsd)}</td><td>{sol(m.buybackSol)} · {usd(m.buybackUsd)}</td><td>{covered == null ? "—" : `${covered}%`}</td></tr>);
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className={s.pageSub} style={{ fontSize: "0.95rem", marginTop: 16 }}>
            Receipts: every funding on each agent&apos;s page, buybacks at <code>/api/credits/buybacks</code>, the full account on <Link href="/ledger">the Ledger</Link>.
            {L?.notes ? ` ${L.notes.lock}.` : ""}{L ? ` Updated ${new Date(L.asOf).toLocaleString("en-GB", { timeZone: "UTC" })} UTC.` : ""}
          </p>
        </section>

        <footer className={s.pageFoot}>
          Want one? <Link href="/">Get your {fundingOpen ? "funded " : ""}Atcha</Link>.
        </footer>
      </main>
    </div>
  );
}
