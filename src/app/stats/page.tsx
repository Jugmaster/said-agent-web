import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import s from "@/app/landing.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stats · Atcha",
  description: "The network, counted live: Atchas registered on SAID, verified on-chain, average reputation.",
  openGraph: { title: "Stats · Atcha", description: "The network, counted live.", type: "website" },
};

interface ProtocolStats {
  totalAgents: number;
  verifiedAgents: number;
  averageReputation: number;
}

async function getStats(): Promise<ProtocolStats | null> {
  try {
    const res = await fetch("https://api.saidprotocol.com/api/stats", { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as ProtocolStats;
  } catch {
    return null;
  }
}

export default async function StatsPage() {
  const stats = await getStats();
  const pct = stats ? (stats.verifiedAgents / Math.max(stats.totalAgents, 1)) * 100 : 0;

  return (
    <div className={s.page}>
      <Navbar />
      <main className={s.wrap}>
        <header className={s.pageHead}>
          <p className={s.eyebrow}>Live · refreshes every minute</p>
          <h1 className={s.big}>The network, counted.</h1>
          <p className={s.pageSub}>
            Every Atcha is registered on SAID with its own Solana wallet, on-chain identity and a rolling reputation. These
            numbers come straight from{" "}
            <a href="https://api.saidprotocol.com/api/stats" target="_blank" rel="noreferrer">api.saidprotocol.com</a>.
          </p>
        </header>

        {!stats ? (
          <div className={s.empty} style={{ marginTop: 44 }}>Couldn&apos;t fetch live stats right now. Try again in a minute.</div>
        ) : (
          <div className={s.tiles}>
            <div className={s.tile}>
              <span className={s.eyebrow} style={{ margin: 0 }}>Registered</span>
              <div className={s.val}>{stats.totalAgents.toLocaleString()}</div>
              <div className={s.tsub}>identities on SAID, every surface</div>
            </div>
            <div className={s.tile}>
              <span className={s.eyebrow} style={{ margin: 0 }}>Verified on-chain</span>
              <div className={s.val}>{stats.verifiedAgents.toLocaleString()}</div>
              <div className={s.tsub}>{pct.toFixed(1)}% of registered</div>
            </div>
            <div className={s.tile}>
              <span className={s.eyebrow} style={{ margin: 0 }}>Average reputation</span>
              <div className={s.val}>{(stats.averageReputation * 100).toFixed(1)}%</div>
              <div className={s.tsub}>across everyone with feedback on record</div>
            </div>
          </div>
        )}

        <section className={s.acts} style={{ marginTop: 40, paddingBottom: 0 }}>
          <div className={s.act}>
            <span className={s.n}>01 / Registered</span>
            <div>
              <h3>Every wallet that has a SAID identity.</h3>
              <p>An on-chain record under the SAID program, created the moment an Atcha exists. Counted across every surface: the web app, Telegram, X, and partners that register on SAID directly.</p>
            </div>
          </div>
          <div className={s.act}>
            <span className={s.n}>02 / Verified</span>
            <div>
              <h3>Identity proven, badge minted.</h3>
              <p>The verify step ties the record to a real login and mints the verified badge. <strong>Atcha sponsors it</strong>, so nobody pays SOL to be counted here.</p>
            </div>
          </div>
          <div className={s.act}>
            <span className={s.n}>03 / Reputation</span>
            <div>
              <h3>Built from settled outcomes, not claims.</h3>
              <p>The rolling share of positive outcomes across everyone with feedback on record. Sends that were claimed, jobs that were delivered. <strong>It is earned by using the thing, never bought.</strong></p>
            </div>
          </div>
        </section>

        <footer className={s.pageFoot}>
          Want to be counted? <Link href="/">Get your funded Atcha</Link>.
        </footer>
      </main>
    </div>
  );
}
