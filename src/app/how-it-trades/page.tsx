import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import s from "@/app/landing.module.css";

export const metadata: Metadata = {
  title: "How it trades · Atcha",
  description: "The desk, the mandate, the thesis every trade is written against, the rules that have the last word, and the record that grades it all in public.",
  openGraph: { title: "How it trades · Atcha", description: "A thesis before every trade. A record anyone can check.", type: "website" },
};

const SECTIONS = [
  { id: "desk", title: "The desk" },
  { id: "mandate", title: "Your mandate" },
  { id: "thesis", title: "The thesis" },
  { id: "rules", title: "The rules have the last word" },
  { id: "position", title: "Holding a position to its thesis" },
  { id: "record", title: "The record and the bar" },
  { id: "receipts", title: "Receipts" },
  { id: "not", title: "What it does not do" },
];

/* Written from the code, not from the pitch. Every number here is a default in the butler's
   autopilot: RISK in strategies.ts, the clamps in thesis.ts, the bar in proof.ts, the grading
   rule in receipts.ts. If the code changes, this page is wrong until it changes too. */
export default function HowItTradesPage() {
  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <main className={s.wrap}>
        <div className={s.docs}>
          <aside>
            <div className={s.tocWrap}>
              <nav className={s.toc}>
                {SECTIONS.map((sec, i) => <a key={sec.id} href={`#${sec.id}`}><i>{String(i + 1).padStart(2, "0")}</i>{sec.title}</a>)}
              </nav>
              <div className={s.tocFoot}>
                <Link href="/proof">The proof, live</Link>
                <Link href="/docs">The rest of the docs</Link>
              </div>
            </div>
          </aside>
          <main>
            <header className={s.docHead}>
              <p className={s.eyebrow}>How it trades</p>
              <h1 className={s.big}>A thesis before every trade. A record anyone can check.</h1>
              <p className={s.pageSub}>Atcha does not trade on a trigger. It writes why, in a fixed shape, before an order goes out, holds the position to that thesis, and is graded on it afterwards, in public. This page is the mechanism, written from the code.</p>
            </header>

            <section id="desk" className={s.docSec}>
              <h2>The desk</h2>
              <div className={s.docBody}>
                <p>Five parts, each with one job.</p>
                <ul>
                  <li><strong>Record</strong> checks the deployer, not just the token. It attributes the wallet behind a launch, walks that wallet&rsquo;s other launches, and stamps pass, caution or fail with a score and the flags that produced it. A snapshot checker sees the token in front of it; Record sees who made it and what they made before.</li>
                  <li><strong>Thesis</strong> writes the reason. For each candidate that clears the floors, the passport and Record, it assembles an evidence pack and asks Claude for a thesis in the shape below. A pass is a normal answer.</li>
                  <li><strong>Desk</strong> executes within your mandate and manages every open position against its own thesis: its stop, its liquidity floor, its time stop, its target, its trail.</li>
                  <li><strong>Receipts</strong> grades every thesis after the fact by one printed rule, and keeps the scoreboard public.</li>
                  <li><strong>Your Atcha</strong> is the agent you talk to. It can explain any decision, and in approve mode it asks you before each trade.</li>
                </ul>
              </div>
            </section>

            <section id="mandate" className={s.docSec}>
              <h2>Your mandate</h2>
              <div className={s.docBody}>
                <p>You set the terms; the desk works inside them.</p>
                <ul>
                  <li><strong>Budget.</strong> The funded credit in your house wallet, plus anything you add. The desk never touches your own wallet.</li>
                  <li><strong>Risk level.</strong> <span className={s.code}>Careful</span>: liquidity at least $250k, tokens at least 30 days old, stop at −12%, profit at +25%, 15% of the budget per position, no scouting. <span className={s.code}>Normal</span>: $100k and 7 days, stop −20%, profit +50%, 25% per position. <span className={s.code}>Degen</span>: $100k and 7 days, stop −35%, profit +100%, 25% per position.</li>
                  <li><strong>What may run.</strong> The desk (a thesis per trade) and exits are on by default. Trend and scout are older rule plays you can switch on; the deployer verdict still gates them.</li>
                  <li><strong>Paper first.</strong> On by default. The desk writes every thesis and decision and moves nothing. You switch it live.</li>
                  <li><strong>Ask me before each trade.</strong> Every buy becomes a proposal with the thesis attached. On Telegram it arrives with Approve and Skip buttons; in the app it waits on your Level page. Nothing moves until you say yes, and the allowance is re-checked when you do.</li>
                </ul>
              </div>
            </section>

            <section id="thesis" className={s.docSec}>
              <h2>The thesis</h2>
              <div className={s.docBody}>
                <p>Every thesis has the same fields, and every field is public.</p>
                <div className={s.block} style={{ padding: "18px 22px" }}>
                  <table className={s.table}>
                    <tbody>
                      <tr><td><strong>Call</strong></td><td>buy or pass</td></tr>
                      <tr><td><strong>Headline</strong></td><td>the thesis in one plain sentence, under 140 characters, no hype words</td></tr>
                      <tr><td><strong>Why now</strong></td><td>the specific condition in the evidence that makes this moment different from an hour ago; if there is none, the answer is pass</td></tr>
                      <tr><td><strong>Evidence</strong></td><td>only facts from the pack, each with its number, so anyone can check them</td></tr>
                      <tr><td><strong>Expected</strong></td><td>what has to happen, in price or flow terms, for the trade to pay inside the horizon</td></tr>
                      <tr><td><strong>Horizon</strong></td><td>1 to 168 hours</td></tr>
                      <tr><td><strong>Size</strong></td><td>conviction, 0 to 1 of the largest position the mandate allows</td></tr>
                      <tr><td><strong>Invalidation</strong></td><td>a price the position is sold under, a liquidity floor, a time stop, each a concrete number</td></tr>
                      <tr><td><strong>Target</strong></td><td>the gain at which part is sold, the fraction sold there, and the trail for the rest</td></tr>
                      <tr><td><strong>Confidence, risks</strong></td><td>a number from 0 to 1, and what could make it wrong</td></tr>
                    </tbody>
                  </table>
                </div>
                <p>The evidence pack the thesis is written from: live pool stats (price, liquidity, FDV, hourly and daily volume, buyers and sellers in the last hour, price change over five windows, age, venue), market cap and holders, the passport verdict, Record&rsquo;s deployer verdict with score, call and flags, the last 24 hourly candles, your mandate, what the account already holds, and the last thesis written on the same token.</p>
              </div>
            </section>

            <section id="rules" className={s.docSec}>
              <h2>The rules have the last word</h2>
              <div className={s.docBody}>
                <p>The model proposes. The mandate permits. In this order, before any order is built:</p>
                <ul>
                  <li>A candidate under the risk level&rsquo;s liquidity or age floor, or with no volume against its liquidity, is never written up.</li>
                  <li>A passport that reads impersonator never buys. A passport that could not be read waits.</li>
                  <li>A deployer record that fails never buys, and the refusal is written down with the score and the call. A pending verdict waits for the next tick.</li>
                  <li>The thesis&rsquo;s stop is never looser than the risk level&rsquo;s stop loss. Its horizon is never over 168 hours. Its size is capped by the position limit and by today&rsquo;s trading allowance.</li>
                  <li>No more than 25% of the budget in any one token. One new entry per tick. At most three theses written per tick, and no second thesis on the same token for six hours.</li>
                  <li>The credit gate runs last on every order, the same gate that governs trades from chat.</li>
                </ul>
              </div>
            </section>

            <section id="position" className={s.docSec}>
              <h2>Holding a position to its thesis</h2>
              <div className={s.docBody}>
                <p>Every five minutes, each open position is re-checked against the thesis that opened it, in this order:</p>
                <ul>
                  <li>Price at or under the stop: sell everything. The exit reason names the stop and the result.</li>
                  <li>Liquidity under the floor: sell everything.</li>
                  <li>Time stop reached: sell everything, whatever the price.</li>
                  <li>Target reached and not yet taken: sell the fraction the thesis set, then trail the rest below the running high.</li>
                  <li>Trail hit after the target: sell the rest.</li>
                </ul>
                <p>Positions the desk did not open (from chat, from a tap, from an older rule play) are managed by the risk level&rsquo;s generic stop and take-profit instead. The desk never widens a stop.</p>
              </div>
            </section>

            <section id="record" className={s.docSec}>
              <h2>The record and the bar</h2>
              <div className={s.docBody}>
                <p>The <Link href="/proof">proof page</Link> is every account trading for real, with its wallet named before the first trade. Each hour it marks what the money is worth and the SOL price. From that it shows what was put in, what it is worth now after every fee, and what the same money would be worth if it had just sat in SOL from the day each piece arrived.</p>
                <p>Nobody says <strong>profitable</strong> until the record clears the bar: at least 30 days, at least 50 closed trades, in profit, and ahead of holding SOL. All four at once. Until then the page says how far along it is.</p>
                <p>Accounts are never chosen for the page after the fact. An account is on it or it is not, good week or bad.</p>
              </div>
            </section>

            <section id="receipts" className={s.docSec}>
              <h2>Receipts</h2>
              <div className={s.docBody}>
                <p>Every thesis is graded by one rule, printed next to the number: a buy is right when it closed in profit; a pass is right unless the token gained 30% within 24 hours of the pass, or died. The scoreboard shows buys right, passes right, the average closed result and what is open now. Record&rsquo;s deployer verdicts are graded the same way at 24 hours and 7 days.</p>
              </div>
            </section>

            <section id="not" className={s.docSec}>
              <h2>What it does not do</h2>
              <div className={s.docBody}>
                <ul>
                  <li>It does not promise returns. The market decides the outcome; the record shows it.</li>
                  <li>It does not trade your own wallet. Only the funded budget in the house wallet, which takes the first loss.</li>
                  <li>It does not buy a token the passport or the deployer record refuses, whatever the chart looks like.</li>
                  <li>It does not hide a bad week. Every decision, every thesis and every exit is on the record with its reason.</li>
                </ul>
                <p className={s.faqQ}>Why Claude writes the thesis and rules do the rest</p>
                <p>A language model is good at reading a pack of evidence and saying what is going on and why. It is not good at sizing, stops or discipline. So the model writes the thesis and the rules clamp every number and hold the position to it. That split is the whole design.</p>
              </div>
            </section>
          </main>
        </div>
      </main>
    </div>
  );
}
