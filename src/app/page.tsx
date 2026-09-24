"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import Preloader from "@/components/Preloader";
import { getCreditsToday, type CreditsToday } from "@/lib/api";
import s from "./landing.module.css";

const NAMES = ["@the_groupchat", "@that_plumber", "@renata_paints", "@little_bro", "@0xanalyst", "@anyone."];
const TG = "https://t.me/saidinfrabot";
const CHIPS: [string, string][] = [
  ["@little_bro", "got a funded Atcha"],
  ["@yourbarber", "got paid $25"],
  ["@the_groupchat", "split $180"],
  ["@renata_paints", "got tipped"],
  ["@0xanalyst", "got funded $25"],
  ["@sol_maxi", "reached level 3"],
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
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(sessionStorage.getItem('atcha-seen')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.setAttribute('data-seen','1')}catch(e){}",
        }}
      />
      <div data-preloader><Preloader /></div>
      <PublicMotion />
      <Navbar />

      <header className={`${s.hero} ${s.wrap}`} data-hero>
        <h1 className={s.h1} aria-label="Comes funded. Pays anyone you can name.">
          <span className={s.row}><span>Comes funded. Pays</span></span>
          <span className={s.row}><span><span className={s.swatch}><Rotator words={NAMES} /></span></span></span>
        </h1>
        <p className={s.sub}>
          It starts with <strong>money in it</strong> and it does everything: trades anything on Solana, holds the
          S&amp;P, pays anyone you can name, buys things, runs your DCA. <strong>Level up</strong> and it gets more to
          work with, every month.
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
          <p className={s.eyebrow}>What it does</p>
          <h2 className={s.big}>Our money first. All upside.</h2>
        </div>
        <div className={s.capGrid} data-stagger>
          <div className={s.cap}><span className={s.n}>01</span><h3>Comes funded</h3><p>Pay five people by name and your agent gets a monthly budget from the $ATCHA token. That budget is what&apos;s at risk, not your money.</p></div>
          <div className={s.cap}><span className={s.n}>02</span><h3>Trades anything</h3><p>SOL, BTC, ETH, memecoins, US stocks as tokens. Buy now, at a price, or a bit every day. Say it in plain English and it does the rest.</p></div>
          <div className={s.cap}><span className={s.n}>03</span><h3>Levels up</h3><p>Show up and the budget grows: a higher level means a bigger month. From level 2, 80% of what it makes on top is yours to take out.</p></div>
        </div>
      </section>

      <section className={s.stage} id="how" data-stage>
        <div className={s.pin}>
        <div className={`${s.wrap} ${s.demoCols}`}>
          <div className={s.demoCopy} data-reveal>
            <p className={s.eyebrow}>The send</p>
            <h2 className={s.big}>From said to settled. In seconds.</h2>
            <p>Type a name and the rest just happens: the check, the safe hold, the delivery. Pay five people and your agent gets funded.</p>
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
                <div className={s.who}><b>@renata</b><small>found on X · verified</small></div>
              </div>
              <div className={s.amt} data-amt>$40.00</div>
            </div>
            <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Name checked</p><p>Identity resolved, record checked</p></div><span className={`${s.pill} ${s.pb}`}>Verified</span></div>
            <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Money committed</p><p>Real funds, not a request</p></div><span className={`${s.pill} ${s.pm}`}>Held</span></div>
            <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Renata logs in</p><p>No seed phrase, no wallet homework</p></div><span className={`${s.pill} ${s.pg}`}>Claimed</span></div>
            <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Money lands</p><p>Hers to hold, spend, or send on</p></div><span className={`${s.pill} ${s.pg}`}>Settled</span></div>
            <div className={s.done} data-done><span className={s.check}>✓</span> Delivered to @renata · 2m 14s</div>
          </div>
        </div>
        </div>
      </section>

      <section className={`${s.acts} ${s.wrap}`} id="steps">
        <div className={s.act} data-reveal><span className={s.n}>01 / Enter</span><div><h3>Five names. That&apos;s the entry.</h3><p>Pay $1 or more to five people you can name, on X or Telegram. No form, no deposit, no waitlist. <strong>The fifth one lands and your agent is level 1.</strong></p></div></div>
        <div className={s.act} data-reveal><span className={s.n}>02 / Funded</span><div><h3>Same day, every month.</h3><p>Funding lands with everyone else&apos;s, sized by your level, paid by the $ATCHA token. Your agent trades it on anything Solana has: majors, memecoins, stocks. <strong>Your own money comes and goes whenever you like.</strong></p></div></div>
        <div className={s.act} data-reveal><span className={s.n}>03 / Level up</span><div><h3>Show up, get more.</h3><p>Keep the streak and the level climbs; the level sets next month&apos;s size. <strong>From level 2 you keep 80% of what your agent makes above what it was funded.</strong> Every funding is posted in public.</p></div></div>
      </section>


      <section className={s.closeOuter} id="claim">
        <div className={s.close} data-close>
          <div className={s.closeIn}>
            <p className={s.eyebrow}>Ready when you are</p>
            <h2>Get your <span className={s.hl}>funded</span> Atcha.</h2>
            <p className={s.csub}>Free, no seed phrase, funded once you&apos;ve paid five people. Sign in with X or Telegram and it&apos;s yours in one message.</p>
            <div className={s.ctas}>
              <button type="button" className={`${s.btn} ${s.btnCream}`} onClick={start} disabled={!ready}>
                {ready ? (authenticated ? "Open your Atcha" : "Get your funded Atcha") : "Loading…"}
              </button>
              <a className={`${s.btn} ${s.ghostCream}`} href={TG} target="_blank" rel="noreferrer">Start in Telegram</a>
            </div>
          </div>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <div className={s.fCols}>
            <div className={s.fBrand}><span className={s.mark}>@</span>atcha</div>
            <div className={s.fCol}><p>Product</p><a href="#funded">funded</a><a href="#how">how it works</a><Link href="/docs">docs</Link></div>
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
        <span>The first hundred to reach level 2 get the biggest month there will ever be.</span>
      )}
    </div>
  );
}
