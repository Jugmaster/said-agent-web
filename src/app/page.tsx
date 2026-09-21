"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import { getCreditsToday, type CreditsToday } from "@/lib/api";
import s from "./landing.module.css";

const NAMES = ["@the_groupchat", "@that_plumber", "@renata_paints", "@little_bro", "@0xanalyst", "@anyone."];
const TG = "https://t.me/saidinfrabot";
const CHIPS: [string, string][] = [
  ["@little_bro", "got a funded Atcha"],
  ["@yourbarber", "got paid $25"],
  ["@the_groupchat", "split $180"],
  ["@renata_paints", "got tipped"],
  ["@0xanalyst", "reached Trusted"],
  ["@sol_maxi", "locked $ATCHA, 2× funding"],
  ["@dinner_crew", "settled up"],
  ["@mum", "got flowers money"],
  ["@that_plumber", "got paid"],
  ["@weekend_five", "chipped in"],
];

export default function LandingPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const [loginInitiated, setLoginInitiated] = useState(false);
  const [today, setToday] = useState<CreditsToday | null | undefined>(undefined);

  // Into the app only when the login started here, so a signed-in visitor can still browse.
  useEffect(() => {
    if (ready && authenticated && loginInitiated) router.replace("/home");
  }, [ready, authenticated, loginInitiated, router]);

  useEffect(() => {
    getCreditsToday().then(setToday).catch(() => setToday(null));
  }, []);

  const start = () => {
    if (authenticated) router.push("/home");
    else {
      setLoginInitiated(true);
      login();
    }
  };

  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />

      <header className={`${s.hero} ${s.wrap}`} data-hero>
        <h1 className={s.h1} aria-label="Comes funded. Pays anyone you can name.">
          <span className={s.row}><span>Comes funded. Pays</span></span>
          <span className={s.row}><span><span className={s.swatch}><Rotator words={NAMES} /></span></span></span>
        </h1>
        <p className={s.sub}>
          It starts with <strong>trading credit in it</strong>: ours, sized by what the chart earned, first-loss so
          yours never is. Add your own money and pay any <strong>@name</strong> you can type, checked before a cent
          moves. Hold <strong>$ATCHA</strong> for a bigger one.
        </p>
        <div className={s.ctas}>
          <button type="button" className={s.btn} onClick={start} disabled={!ready}>
            {ready ? (authenticated ? "Open your Atcha" : "Get your funded Atcha") : "Loading…"}
          </button>
          <a className={`${s.btn} ${s.ghost}`} href={TG} target="_blank" rel="noreferrer">
            Start in Telegram
          </a>
        </div>
        <Counter today={today} />
      </header>
      <div className={s.marquee} aria-hidden>
        <div className={s.track} data-marquee>
          {CHIPS.map((c, i) => (
            <span key={i} className={s.chip}><b>{c[0]}</b> {c[1]}</span>
          ))}
        </div>
      </div>

      <section className={`${s.caps} ${s.wrap}`} id="funded">
        <div className={s.capsHead} data-reveal>
          <p className={s.eyebrow}>Funded</p>
          <h2 className={s.big}>It comes with credit in it. The chart sets the size.</h2>
        </div>
        <div className={s.capGrid} data-stagger>
          <div className={s.cap}><span className={s.n}>01</span><h3>Trading credit, day one</h3><p>Real credit we put in, not points. Trade the majors with it and watch it move. Real P&amp;L from your first swap.</p></div>
          <div className={s.cap}><span className={s.n}>02</span><h3>Sized by the chart</h3><p>Today&apos;s funding is set every hour by what $ATCHA earned. Loud chart, bigger accounts. Launch day is the biggest it will ever be.</p></div>
          <div className={s.cap}><span className={s.n}>03</span><h3>Ours goes first</h3><p>Our credit takes the first loss. Your money sits above it and is always yours to take back. Climb the rungs and the upside becomes yours too.</p></div>
        </div>
      </section>

      <section className={s.stage} id="how" data-stage>
        <div className={s.pin}>
        <div className={`${s.wrap} ${s.demoCols}`}>
          <div className={s.demoCopy} data-reveal>
            <p className={s.eyebrow}>The send</p>
            <h2 className={s.big}>From said to settled. In seconds.</h2>
            <p>Add money once and paying anyone is a sentence. Type a name and the rest just happens: the check on SAID, the safe hold, the delivery.</p>
            <div className={s.mini}>
              <span><b>Screened first.</b> Fakes and lookalikes never receive a cent.</span>
              <span><b>Held safely.</b> Not claimed? It comes back automatically.</span>
              <span><b>No app required.</b> They log in once; the money&apos;s theirs.</span>
            </div>
          </div>
          <div className={s.card} aria-label="Example transfer" data-card>
            <div className={s.acTop}>
              <div className={s.to}>
                <div className={s.avatar}>R</div>
                <div className={s.who}><b>@renata</b><small>found on X · verified on SAID</small></div>
              </div>
              <div className={s.amt} data-amt>$40.00</div>
            </div>
            <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Name checked</p><p>Identity resolved, reputation screened</p></div><span className={`${s.pill} ${s.pb}`}>Verified</span></div>
            <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Money committed</p><p>Real funds, not a request</p></div><span className={`${s.pill} ${s.pm}`}>Held</span></div>
            <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Renata logs in</p><p>No seed phrase, no wallet homework</p></div><span className={`${s.pill} ${s.pg}`}>Claimed</span></div>
            <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Money lands</p><p>Hers to hold, spend, or send on</p></div><span className={`${s.pill} ${s.pg}`}>Settled</span></div>
            <div className={s.done} data-done><span className={s.check}>✓</span> Delivered to @renata · 2m 14s</div>
          </div>
        </div>
        </div>
      </section>

      <section className={`${s.acts} ${s.wrap}`} id="steps">
        <div className={s.act} data-reveal><span className={s.n}>01 / Name</span><div><h3>Names, not addresses.</h3><p>The handle you&apos;d say out loud is the only address you need. No 44-character strings, no copy-paste roulette. <strong>If a name doesn&apos;t check out on SAID, your money never leaves.</strong></p></div></div>
        <div className={s.act} data-reveal><span className={s.n}>02 / Send</span><div><h3>Held until it&apos;s truly theirs.</h3><p>Every send is committed to the person, not the platform. If they haven&apos;t joined yet, the money waits under their name and <strong>returns to you automatically if they never show.</strong></p></div></div>
        <div className={s.act} data-reveal><span className={s.n}>03 / Claim</span><div><h3>They log in. It&apos;s done.</h3><p>Your person signs in with the account you named, and the money is already sitting there. <strong>That&apos;s the entire onboarding: receiving money.</strong></p></div></div>
      </section>

      <section className={s.identityOuter} id="identity">
        <div className={s.identity}>
          <p className={s.eyebrow}>Your name</p>
          <h2 className={s.big} data-reveal>One name. Every handle. All your money.</h2>
          <p className={s.lede} data-reveal>Claim your @name once, then link the accounts you already have: X, Telegram, and every social that comes next. They all resolve to you on SAID, so money sent to any of them lands in the same pocket.</p>
          <div className={s.idGrid}>
            <div className={s.bars} aria-hidden data-bars>
              <div className={`${s.bar} ${s.b1}`}><span className={s.bdot} />@renata_paints on X<span className={s.tag}>linked</span></div>
              <div className={`${s.bar} ${s.b2}`}><span className={s.bdot} />@renata on Telegram<span className={s.tag}>linked</span></div>
              <div className={`${s.bar} ${s.b3}`}><span className={s.bdot} />@renata<span className={s.tag}>one identity · one balance</span></div>
            </div>
            <p className={s.idNote} data-reveal>Each link is verified by logging in, never by trust. Your name and your reputation are yours: they aren&apos;t owned by any one platform, and everything you link strengthens the proof that you&apos;re you.</p>
          </div>
        </div>
      </section>

      <section className={`${s.claim} ${s.wrap}`} id="claim" data-reveal>
        <h2>Get your <span className={s.hl}>funded</span> Atcha.</h2>
        <p className={s.csub}>Free, funded on day one, no seed phrase. Sign in with X or Telegram and it&apos;s yours in one message.</p>
        <div className={s.ctas}>
          <button type="button" className={s.btn} onClick={start} disabled={!ready}>
            {ready ? (authenticated ? "Open your Atcha" : "Get your funded Atcha") : "Loading…"}
          </button>
          <a className={`${s.btn} ${s.ghost}`} href={TG} target="_blank" rel="noreferrer">Start in Telegram</a>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <div className={s.fCols}>
            <div className={s.fBrand}><span className={s.mark}>@</span>atcha</div>
            <div className={s.fCol}><p>Product</p><a href="#funded">funded</a><a href="#how">how it works</a><a href="#identity">your name</a><Link href="/docs">docs</Link></div>
            <div className={s.fCol}><p>Network</p><Link href="/agents">agents</Link><Link href="/stats">stats</Link><a href="https://www.saidprotocol.com" target="_blank" rel="noreferrer">SAID Protocol</a></div>
            <div className={s.fCol}><p>Socials</p><a href="https://x.com/saidagent" target="_blank" rel="noreferrer">x</a><a href={TG} target="_blank" rel="noreferrer">telegram</a></div>
          </div>
          <div className={s.legal}>
            <div className={s.lrow}><span>© 2026 Atcha, by SAID</span></div>
            Atcha is a financial technology product. Digital assets are not legal tender, are not backed by the government, and are not subject to FDIC or SIPC protections. Trading credit can lose value. Send only to people you know and trust.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Rotator({ words }: { words: string[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [i, setI] = useState(0);
  const [out, setOut] = useState<number | null>(null);
  useEffect(() => {
    const fit = () => {
      const el = ref.current;
      if (!el) return;
      const w = (el.children[i] as HTMLElement | undefined)?.offsetWidth;
      if (w) el.style.width = `${w}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [i]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setI((cur) => {
        setOut(cur);
        setTimeout(() => setOut(null), 550);
        return (cur + 1) % words.length;
      });
    }, 2400);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <span className={s.rot} ref={ref}>
      {words.map((w, k) => (
        <span key={w} className={k === i ? s.cur : k === out ? s.out : undefined}>{w}</span>
      ))}
    </span>
  );
}

function Counter({ today }: { today: CreditsToday | null | undefined }) {
  const off = !today || !today.live;
  const money = (v: number) => `$${Math.round(v).toLocaleString()}`;
  return (
    <div className={`${s.counter} ${off ? s.off : ""}`} aria-live="polite" data-reveal>
      {today ? (
        <>
          <span><b data-count>{today.agentsFunded.toLocaleString()}</b> Atchas funded</span>
          <span className={s.sep}>·</span>
          <span>today&apos;s funding <b>{money(today.fundingUsd)}</b></span>
          <span className={s.sep}>·</span>
          <span><b data-count>{today.fundedLastHour.toLocaleString()}</b> in the last hour</span>
        </>
      ) : (
        <span>The first hundred Atchas on launch day get the biggest funding there will ever be.</span>
      )}
    </div>
  );
}
