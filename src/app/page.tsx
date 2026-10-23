"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import Preloader from "@/components/Preloader";
import { useLaunch } from "@/components/LaunchProvider";
import s from "./landing.module.css";

// The desk is the headline: what it trades with, in rotation. Paying by @ is in the chips and the copy, not the hero.
const WORDS = ["with a thesis.", "for a reason.", "in public.", "on its own money.", "for you."];
const PRELAUNCH_WORDS = WORDS.filter((w) => !/own money/.test(w));
const TG = "https://t.me/atchacashbot";
const CHIPS: [string, string][] = [
  ["@little_bro", "got a funded Atcha"],
  ["@0xanalyst", "approved a thesis"],
  ["$FOUR", "passed: deployer record fails"],
  ["@yourbarber", "got paid $25"],
  ["@sol_maxi", "desk closed +31%, receipt: right"],
  ["@0xanalyst", "got tipped $20"],
  ["@renata_paints", "got tipped"],
  ["@0xanalyst", "got funded $25"],
  ["@sol_maxi", "reached level 3"],
  ["$SOL", "bought in one click"],
  ["@mum", "got flowers money"],
  ["@that_plumber", "got paid"],
  ["@new_here", "signed in, $5 waiting"],
];
// Before the mint exists the page cannot mention funding, so those chips sit out.
const PRELAUNCH_CHIPS = CHIPS.filter(([, what]) => !/funded|level/i.test(what));

export default function LandingPage() {
  const { ready, authenticated, login } = usePrivy();
  const { launched, fundingOpen, ticker } = useLaunch();
  const soon = launched && !fundingOpen;
  const tick = ticker ? `$${ticker.replace(/^\$/, "")}` : null;
  const router = useRouter();
  const [loginInitiated, setLoginInitiated] = useState(false);

  // Into the app only when the login started here, so a signed-in visitor can still browse.
  useEffect(() => {
    if (ready && authenticated && loginInitiated) router.replace("/home");
  }, [ready, authenticated, loginInitiated, router]);

  useEffect(() => {
  }, []);

  const start = () => {
    if (authenticated) router.push("/home");
    else {
      setLoginInitiated(true);
      login();
    }
  };

  const cta = !ready ? "Loading…" : authenticated ? "Open your Atcha" : fundingOpen ? "Get your funded Atcha" : "Get your Atcha";
  const chips = launched ? CHIPS : PRELAUNCH_CHIPS;
  const lead = launched ? "Comes funded. Trades" : "An agent that trades";
  const words = launched ? WORDS : PRELAUNCH_WORDS;

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
        <h1 className={s.h1} aria-label={`${lead} with a thesis.`}>
          <span className={s.row}><span>{lead}</span></span>
          <span className={s.row}><span><span className={s.swatch}><Rotator words={words} /></span></span></span>
        </h1>
        {launched ? (
          <p className={s.sub}>
            {soon ? <>It will start with <strong>money in it</strong>{tick ? <>, funded by {tick}</> : null}, once funding opens.</> : <>It starts with <strong>money in it</strong>{tick ? <>, funded by {tick}</> : null}.</>}{" "}
            Before every trade it <strong>writes why</strong>: what it sees, what has to happen, what gets it out. It holds the position to that, and every call is
            graded in public. Our money takes the first loss; <strong>80% of the upside is yours</strong>. It pays anyone you can name, too.
          </p>
        ) : (
          <p className={s.sub}>
            A trading desk in a chat, with its own wallet. Before every trade it <strong>writes why</strong>: what it sees, what has to happen,
            what gets it out. It holds the position to that, and every call is graded in public. It pays anyone you can name, too: type a handle and an amount.
          </p>
        )}
        <div className={s.ctas}>
          <button type="button" className={s.btn} onClick={start} disabled={!ready}>
            {cta}
          </button>
          <a className={`${s.btn} ${s.ghost}`} href={TG} target="_blank" rel="noreferrer">
            Start in Telegram
          </a>
        </div>
      </header>
      <div className={s.marquee} aria-hidden>
        <div className={s.track} data-marquee>
          {chips.map((c, i) => (
            <span key={i} className={s.chip}><b>{c[0]}</b> {c[1]}</span>
          ))}
        </div>
      </div>

      <section className={`${s.caps} ${s.wrap}`} id={launched ? "funded" : "what"}>
        <div className={s.capsHead} data-reveal>
          <p className={s.eyebrow}>What it does</p>
          <h2 className={s.big}>{launched ? "Our money first. A reason for every trade. 80% of the upside is yours." : "Writes the thesis. Trades it. Shows the record."}</h2>
          {soon && <p className={s.eyebrow} style={{ marginTop: 10 }}>Funding opens soon · pay your five now and be first in line</p>}
        </div>
        <div className={s.capGrid} data-stagger>
          {launched ? (
            <>
              <div className={s.cap}><span className={s.n}>01</span><h3>{soon ? "Comes funded, soon" : "Comes funded"}</h3><p>Pay five verified X accounts by name and your agent gets a monthly budget of its own{tick ? <>, paid for by {tick}</> : null}. That budget is what&apos;s at risk, not your money.{soon ? " The first budgets land when funding opens." : ""} Level up and it grows.</p></div>
              <div className={s.cap}><span className={s.n}>02</span><h3>Writes a thesis</h3><p>Before every trade: why now, what has to happen, the price and the hour that get it out. It checks who deployed the token, not just the chart. A pass is a normal answer.</p></div>
              <div className={s.cap}><span className={s.n}>03</span><h3>Graded in public</h3><p>Every thesis gets a receipt. Every account trading for real is on <Link href="/proof">the record</Link>, good week or bad, against just holding SOL. <Link href="/how-it-trades">How it trades</Link>.</p></div>
            </>
          ) : (
            <>
              <div className={s.cap}><span className={s.n}>01</span><h3>Writes a thesis</h3><p>Before every trade: why now, what has to happen, the price and the hour that get it out. It checks who deployed the token, not just the chart. A pass is a normal answer.</p></div>
              <div className={s.cap}><span className={s.n}>02</span><h3>Holds it to the numbers</h3><p>Its own stop, its own time limit, its own target. Paper first, live when you say. Or have it ask you before each trade, with the thesis attached.</p></div>
              <div className={s.cap}><span className={s.n}>03</span><h3>Graded in public</h3><p>Every thesis gets a receipt. Every account trading for real is on <Link href="/proof">the record</Link>, good week or bad, against just holding SOL. It pays anyone by @ and buys in one click, too. <Link href="/how-it-trades">How it trades</Link>.</p></div>
            </>
          )}
        </div>
      </section>

      {launched && (
        <>
          <section className={s.stage} id="how" data-stage>
            <div className={s.pin}>
            <div className={`${s.wrap} ${s.demoCols}`}>
              <div className={s.demoCopy} data-reveal>
                <p className={s.eyebrow}>The entry</p>
                <h2 className={s.big}>Five blue ticks. Then it&apos;s funded.</h2>
                <p>Pay five verified X accounts, a dollar or more each. The fifth one lands and your agent has a budget.</p>
                <div className={s.mini}>
                  <span><b>Real sends.</b> Each goes to a real, verified person, checked before it moves.</span>
                  <span><b>Any five with a tick.</b> Already on Atcha or not yet; they claim by logging in.</span>
                  <span><b>No deposit.</b> The budget is the network&apos;s money, not yours.</span>
                </div>
              </div>
              <div className={s.card} aria-label="Example first week" data-card>
                <div className={s.acTop}>
                  <div className={s.to}>
                    <div className={s.avatar}>@</div>
                    <div className={s.who}><b>@you</b><small>level 1 → 2</small></div>
                  </div>
                  <div className={s.amt} data-amt="25">$25.00</div>
                </div>
                <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Five people paid</p><p>@renata, @dan, @mo, @ivy, @kai</p></div><span className={`${s.pill} ${s.pb}`}>5 / 5</span></div>
                <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Level 2</p><p>Earned, not applied for</p></div><span className={`${s.pill} ${s.pm}`}>Unlocked</span></div>
                <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>Budget lands</p><p>Its own money, in SOL</p></div><span className={`${s.pill} ${s.pg}`}>Funded</span></div>
                <div className={s.step} data-step><span className={s.dot} /><div><p className={s.sh}>First trade</p><p>SOL, at market, on its own money</p></div><span className={`${s.pill} ${s.pg}`}>Trading</span></div>
                <div className={s.done} data-done><span className={s.check}>✓</span> {soon ? "Funded · when funding opens · posted in public" : "Funded · posted in public"}</div>
              </div>
            </div>
            </div>
          </section>

          <section className={`${s.acts} ${s.wrap}`} id="steps">
            <div className={s.act} data-reveal><span className={s.n}>01 / Enter</span><div><h3>Five blue ticks. That&apos;s the entry.</h3><p>Pay $1 or more to five verified X accounts. No form, no deposit, no waitlist. <strong>The fifth one lands and your agent is funded.</strong></p></div></div>
            <div className={s.act} data-reveal><span className={s.n}>02 / Funded</span><div><h3>Same day, every month.</h3><p>Funding lands with everyone else&apos;s, sized by your level. The desk trades it on anything Solana has, with a written thesis per trade and the position held to it. <strong>Your own money comes and goes whenever you like.</strong></p></div></div>
            <div className={s.act} data-reveal><span className={s.n}>03 / Level up</span><div><h3>Show up, get more.</h3><p>Keep the streak and the level climbs; the level sets next month&apos;s size. <strong>You keep 80% of what your agent makes above what it was funded, realised daily.</strong> Every funding is posted in public.</p></div></div>
          </section>
        </>
      )}

      <section className={s.closeOuter} id="claim">
        <div className={s.close} data-close>
          <div className={s.closeIn}>
            <p className={s.eyebrow}>Ready when you are</p>
            {fundingOpen ? (
              <h2>Get your <span className={s.hl}>funded</span> Atcha.</h2>
            ) : (
              <h2>Get your <span className={s.hl}>Atcha</span>.</h2>
            )}
            <p className={s.csub}>
              {fundingOpen
                ? "Free, no seed phrase, funded once you've paid five verified X accounts. Sign in with X or Telegram and it's yours in one message."
                : soon
                  ? "Free, no seed phrase. Pay five verified X accounts now and your budget lands the day funding opens. Sign in with X or Telegram and it's yours in one message."
                  : "Free, no seed phrase. Sign in with X or Telegram and it's yours in one message."}
            </p>
            <div className={s.ctas}>
              <button type="button" className={`${s.btn} ${s.btnCream}`} onClick={start} disabled={!ready}>
                {cta}
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
            <div className={s.fCol}>
              <p>Product</p>
              {launched ? (
                <>
                  <a href="#funded">funded</a>
                  <a href="#how">how it works</a>
                </>
              ) : (
                <a href="#what">what it does</a>
              )}
              <Link href="/proof">the record</Link>
              <Link href="/how-it-trades">how it trades</Link>
              <Link href="/docs">docs</Link>
              <Link href="/changelog">changelog</Link>
            </div>
            <div className={s.fCol}><p>Network</p><Link href="/agents">agents</Link><Link href="/stats">stats</Link><a href="https://www.saidprotocol.com" target="_blank" rel="noreferrer">SAID Protocol</a></div>
            <div className={s.fCol}><p>Socials</p><a href="https://x.com/atchacash" target="_blank" rel="noreferrer">x</a><a href={TG} target="_blank" rel="noreferrer">telegram</a></div>
          </div>
          <div className={s.legal}>
            <div className={s.lrow}><span>© 2026 Atcha, by SAID</span></div>
            Atcha is a financial technology product. Digital assets are not legal tender, are not backed by the government, and are not subject to FDIC or SIPC protections.{launched && " The budget your agent trades can lose value."} Send only to people you know and trust.
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
