import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import { getLaunch } from "@/lib/launch";
import { getStats, getLedger } from "@/lib/api";
import s from "@/app/landing.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stats · Atcha",
  description: "Atcha, counted live: agents, on-chain actions, sends waiting under a name, and, once the token is live, what was funded and traded.",
  openGraph: { title: "Stats · Atcha", description: "Atcha, counted live.", type: "website" },
};

const usd = (v: number | null | undefined) => (v == null ? "$—" : `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

/** The platform's own numbers, from the butler. SAID's network-wide counters live on saidprotocol.com, not here. */
export default async function StatsPage() {
  const { launched, fundingOpen } = getLaunch();
  const [P, L] = await Promise.all([getStats({ revalidate: 60 }), launched ? getLedger() : Promise.resolve(null)]);
  const pct = P ? (P.agents.verified / Math.max(P.agents.total, 1)) * 100 : 0;

  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <main className={s.wrap}>
        <header className={s.pageHead} data-reveal>
          <p className={s.eyebrow}>Live · refreshes every minute</p>
          <h1 className={s.big}>Atcha, counted.</h1>
          <p className={s.pageSub}>
            Every Atcha has its own Solana wallet and an on-chain identity, and every action it takes has a signature. These are the platform&apos;s numbers, read live.{launched ? " The token's account is on " : ""}{launched ? <Link href="/atcha">the token page</Link> : null}{launched ? "." : ""}
          </p>
        </header>

        {!P ? (
          <div className={s.empty} style={{ marginTop: 44 }}>Couldn&apos;t fetch live stats right now. Try again in a minute.</div>
        ) : (
          <div className={s.tiles} data-stagger>
            <div className={s.tile}>
              <span className={s.eyebrow} style={{ margin: 0 }}>Atchas</span>
              <div className={s.val} data-count>{P.agents.total.toLocaleString()}</div>
              <div className={s.tsub}>agents with a wallet, across web, Telegram and X</div>
            </div>
            <div className={s.tile}>
              <span className={s.eyebrow} style={{ margin: 0 }}>Verified on-chain</span>
              <div className={s.val} data-count>{P.agents.verified.toLocaleString()}</div>
              <div className={s.tsub}>{pct.toFixed(1)}% of all Atchas · sponsored, nobody pays to be counted</div>
            </div>
            <div className={s.tile}>
              <span className={s.eyebrow} style={{ margin: 0 }}>On-chain actions</span>
              <div className={s.val} data-count>{P.activity.totalReceipts.toLocaleString()}</div>
              <div className={s.tsub}>swaps, sends, stakes and buys, each with a transaction signature</div>
            </div>
            <div className={s.tile}>
              <span className={s.eyebrow} style={{ margin: 0 }}>Sends waiting</span>
              <div className={s.val} data-count>{P.pendingSends.count.toLocaleString()}</div>
              <div className={s.tsub}>money held under a name whose owner hasn&apos;t signed in yet</div>
            </div>
            {launched && L && (
              <>
                <div className={s.tile}>
                  <span className={s.eyebrow} style={{ margin: 0 }}>Agents funded</span>
                  <div className={s.val} data-count>{L.agentsFunded.toLocaleString()}</div>
                  <div className={s.tsub}>{usd(L.fundedTotalUsd)} funded in total{fundingOpen ? "" : " · funding opens soon"}</div>
                </div>
                <div className={s.tile}>
                  <span className={s.eyebrow} style={{ margin: 0 }}>Traded on credit</span>
                  <div className={s.val}>{usd(L.tradedByFundedUsd)}</div>
                  <div className={s.tsub}>{usd(L.feesFromFundedUsd)} in fees back · {usd(L.gainsSettledUsd)} realised and settled</div>
                </div>
              </>
            )}
          </div>
        )}

        <section className={s.acts} style={{ marginTop: 40, paddingBottom: 0 }}>
          <div className={s.act} data-reveal>
            <span className={s.n}>01 / Atchas</span>
            <div>
              <h3>One agent per person, one wallet each.</h3>
              <p>Created the moment someone signs in with X or Telegram, or the moment someone sends money to their name. Counted across every surface: the web app, @atchacashbot, @atchacash on X.</p>
            </div>
          </div>
          <div className={s.act} data-reveal>
            <span className={s.n}>02 / Actions</span>
            <div>
              <h3>Receipts, not claims.</h3>
              <p>Every swap, send, stake and purchase an agent makes is a Solana transaction with a signature, recorded as it lands. <strong>If it isn&apos;t on the chain, it isn&apos;t counted.</strong></p>
            </div>
          </div>
          <div className={s.act} data-reveal>
            <span className={s.n}>03 / Funded</span>
            <div>
              <h3>Our money, their trades, in public.</h3>
              <p>Once the token is live, the pool funds agents that earn entry. What was funded, traded and settled is read from the ledger, never estimated. <strong>Zeros are shown as zeros.</strong></p>
            </div>
          </div>
        </section>

        <footer className={s.pageFoot}>
          Want to be counted? <Link href="/">Get your {launched && fundingOpen ? "funded " : ""}Atcha</Link>.
        </footer>
      </main>
    </div>
  );
}
