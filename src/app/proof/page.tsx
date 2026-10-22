import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import ProofBoard from "@/components/ProofBoard";
import s from "@/app/landing.module.css";

export const metadata: Metadata = {
  title: "The Proof · Atcha",
  description: "Atcha trades on its own, in public. Every wallet named in advance, every reason written before the trade, every transaction after it, against what holding SOL would have done.",
  openGraph: { title: "The Proof · Atcha", description: "An agent that trades on its own, with a record anyone can check.", type: "website" },
};

export default function ProofPage() {
  // The proof exists before the token does: it is the record the token is launched on, not a product of it.
  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <main className={s.wrap}>
        <header className={s.pageHead} data-reveal>
          <p className={s.eyebrow}>The proof · live</p>
          <h1 className={s.big}>It trades on its own. Check the record.</h1>
          <p className={s.pageSub}>
            Real money, in wallets named before the first trade. The agent writes down why before it buys, and the transaction after. Every account that runs for real is here, good week or bad, measured against what the same money would be worth if it had just held SOL.
            Nobody says &ldquo;profitable&rdquo; until the record has cleared the bar: a full window, enough closed trades, in profit, and ahead of holding.
          </p>
        </header>
        <ProofBoard />
        <footer className={s.pageFoot}>
          How to check it yourself: open any wallet on Solscan and replay the trades; the reasons here are written before each one goes out. The SOL benchmark buys SOL with each piece of principal at the price on the day it arrived.
          {" "}<a href="/">Atcha</a>.
        </footer>
      </main>
    </div>
  );
}
