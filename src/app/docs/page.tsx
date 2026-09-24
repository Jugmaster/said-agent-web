import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import s from "@/app/landing.module.css";

export const metadata: Metadata = {
  title: "Docs · Atcha",
  description:
    "How Atcha works: the budget it comes with, the two kinds of money, the levels, paying anyone by @name, fees and cashback, and the SAID identity underneath.",
  openGraph: { title: "Docs · Atcha", description: "How Atcha works.", type: "website" },
};

const SECTIONS = [
  { id: "what", title: "What Atcha is" },
  { id: "start", title: "Quick start" },
  { id: "funded", title: "Funded: two kinds of money" },
  { id: "ladder", title: "Levels" },
  { id: "token", title: "What $ATCHA does" },
  { id: "send", title: "Pay anyone by @name" },
  { id: "trade", title: "Trade, buy, and more" },
  { id: "identity", title: "What's underneath" },
  { id: "fees", title: "Fees and cashback" },
  { id: "money", title: "Adding and taking out money" },
  { id: "surfaces", title: "Where it lives" },
  { id: "faq", title: "FAQ" },
];

function Sec({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className={s.docSec} data-reveal>
      <p className={s.eyebrow}>{String(n).padStart(2, "0")}</p>
      <h2>{title}</h2>
      <div className={s.docBody}>{children}</div>
    </section>
  );
}
const C = ({ children }: { children: ReactNode }) => <code className={s.code}>{children}</code>;
const Block = ({ label, children }: { label?: string; children: ReactNode }) => (
  <div className={s.block}>
    {label && <div className={s.bl}>{label}</div>}
    <pre>{children}</pre>
  </div>
);
const Q = ({ children }: { children: ReactNode }) => <p className={s.faqQ}>{children}</p>;

export default function DocsPage() {
  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <div className={`${s.docs} ${s.wrap}`}>
        <aside>
          <div className={s.tocWrap}>
          <nav className={s.toc} aria-label="Sections">
            {SECTIONS.map((x, i) => (
              <a key={x.id} href={`#${x.id}`}><i>{String(i + 1).padStart(2, "0")}</i>{x.title}</a>
            ))}
          </nav>
          <div className={s.tocFoot}>
            <a href="https://t.me/saidinfrabot" target="_blank" rel="noreferrer">@saidinfrabot →</a>
            <a href="https://x.com/saidagent" target="_blank" rel="noreferrer">@saidagent →</a>
            <a href="https://www.saidprotocol.com" target="_blank" rel="noreferrer">saidprotocol.com →</a>
          </div>
          </div>
        </aside>

        <main style={{ minWidth: 0 }}>
          <header className={s.docHead} data-reveal>
            <p className={s.eyebrow}>Docs</p>
            <h1 className={s.big}>How Atcha works.</h1>
            <p className={s.pageSub}>Your AI with a budget of its own, funded every month by the $ATCHA token. Its own SAID identity, yours forever. Live in Telegram and right here on the web.</p>
          </header>

          <Sec id="what" n={1} title="What Atcha is">
            <p>Atcha is a personal AI that lives on Solana. It trades anything on Solana, holds US stocks as tokens, pays anyone you can name, buys things, runs your DCA. Pay five people by name and it gets <strong>a budget of its own to trade with</strong>, every month, paid by the $ATCHA token. The budget takes the first loss. Money you add is yours, always.</p>
            <p>It has a <strong>level</strong>. The level goes up as you use it, and the level sets how much it gets and what it can do.</p>
            <p>You talk to it in plain language. It executes real on-chain transactions and keeps a verifiable history of everything it did on your behalf.</p>
          </Sec>

          <Sec id="start" n={2} title="Quick start">
            <p><strong>On the web:</strong> tap <Link href="/">Get your funded Atcha</Link>, sign in with X or Telegram, and it exists.</p>
            <p><strong>In Telegram:</strong> open <a href="https://t.me/saidinfrabot" target="_blank" rel="noreferrer">@saidinfrabot</a> and tap <C>/start</C>.</p>
            <Block label="telegram">{`you  →  /start
bot  →  hey, welcome to Atcha. your AI comes funded.
        what do you want to name yours?

you  →  Vega
bot  →  ✓ Vega is ready. Level 1.
        pay five people by @name and it gets funded.
        profile: atcha.cash/@Vega`}</Block>
            <p>Already have one from the bot? Signing in on the web links it: same Atcha, same balance, same history on both.</p>
          </Sec>

          <Sec id="funded" n={3} title="Funded: two kinds of money">
            <p>Your balance is one number with two things inside it. The dashboard never hides which is which.</p>
            <table className={s.table}>
              <thead><tr><th></th><th>The budget</th><th>Your money</th></tr></thead>
              <tbody>
                <tr><td className={s.m}>Where it comes from</td><td>The $ATCHA pool, monthly. Sized by your level.</td><td>You. Card, Apple Pay, or a transfer.</td></tr>
                <tr><td className={s.m}>What it can do</td><td>Trade anything with real liquidity.</td><td>Trade anything. Pay anyone. Buy things. Hire.</td></tr>
                <tr><td className={s.m}>Who loses first</td><td>The budget. Always.</td><td>Only after the budget is gone.</td></tr>
                <tr><td className={s.m}>Taking it out</td><td>Never. It trades; it doesn&apos;t leave.</td><td>Any time.</td></tr>
                <tr><td className={s.m}>Gains on it</td><td>80% yours from level 3.</td><td>Yours.</td></tr>
              </tbody>
            </table>
            <p><strong>Funding is monthly.</strong> Everyone is funded on the same day of the month, sized by their level, paid by the $ATCHA token. Reach level 1 mid-month and your first funding lands on the next funding day. Level 2 starts around $25 a month; level 3 more. Every funding is posted publicly.</p>
            <p><strong>What the budget trades:</strong> SOL, BTC, ETH, USDC, $ANSEM, $CLAW, the ClawPump ecosystem, and US stocks as tokens. Anything with real liquidity and a week of history. A quarter of the budget can sit in any one memecoin, and a quarter across all of them; your own cash has no cap. The budget never buys $ATCHA and never buys a token you created.</p>
            <p><strong>A rough day.</strong> If the budget falls below half of the month&apos;s funding, the agent sits out. Do two of today&apos;s things and it&apos;s back.</p>
            <p><strong>An untouched budget</strong> is reclaimed after 14 days so it can fund someone who will use it.</p>
          </Sec>

          <Sec id="ladder" n={4} title="Levels">
            <p>Four levels. Each one gives the agent more: more funding, bigger daily allowances, and from level 3, your share of the gains.</p>
            <table className={s.table}>
              <thead><tr><th>Level</th><th>Funding / month</th><th>Pays / day</th><th>Trades / day</th><th>How you get there</th></tr></thead>
              <tbody>
                <tr><td>1 · Started</td><td>your cash</td><td>$5</td><td>$10</td><td className={s.m}>Sign up.</td></tr>
                <tr><td>2 · Proven</td><td>$25</td><td>$25</td><td>$50</td><td className={s.m}>Pay five different people by @name, $1 or more each. They log in, they&apos;re in.</td></tr>
                <tr><td>3 · Trusted</td><td>$75</td><td>$100</td><td>$250</td><td className={s.m}>A 30-day streak. Your gains become yours to take out.</td></tr>
                <tr><td>4 · Owner</td><td>by invitation</td><td>$500</td><td>$1,000</td><td className={s.m}>The biggest months. We ask you.</td></tr>
              </tbody>
            </table>
            <p><strong>Three things a day</strong> keep the streak: a trade, a send, a stake. The ones that settle with a real person level you up. Only settled outcomes count: a send that was claimed, a job that was delivered, a purchase that shipped. Paying yourself doesn&apos;t count; the app knows it&apos;s you.</p>
          </Sec>

          <Sec id="token" n={5} title="What $ATCHA does">
            <p>$ATCHA funds the agents. The token&apos;s creator rewards top up the pool each month; the pool pays every level-2-and-up agent its monthly budget, in SOL. The agents trade; a share of their fees buys $ATCHA back and stakes it, in batches, with a public receipt each time.</p>
            <p>It never pays holders, never burns, never airdrops, and funding is never paid in the token itself. The token&apos;s job is to fund the agents, and the agents&apos; job is to buy the token.</p>
          </Sec>

          <Sec id="send" n={6} title="Pay anyone by @name">
            <p>Any X or Telegram handle. They don&apos;t need a wallet, or to have heard of Atcha. Paying runs on your own money.</p>
            <Block label="examples">{`send 5 USDC to @alex
pay @that_plumber $120
split $180 with @the_groupchat`}</Block>
            <p>Before a cent moves the name is <strong>checked</strong>: is this the real account, what is its record. If a name doesn&apos;t check out, your money never leaves.</p>
            <p>If they&apos;re not on Atcha yet, the money waits in your balance under their name. They log in with the account you named and it&apos;s already there. Nothing is parked anywhere, and it returns to you if they never show. Cancel any time:</p>
            <Block>{`cancel the send to @joe`}</Block>
          </Sec>

          <Sec id="trade" n={7} title="Trade, buy, and more">
            <p><strong>Trade.</strong> Swaps route through Jupiter across every major Solana venue. You get a quote first; nothing executes until you confirm. The budget trades anything with real liquidity; your own cash trades anything at all, and can bridge to other chains.</p>
            <Block label="examples">{`swap $5 of my budget into SOL
buy JUP when it hits $0.40
DCA $10 into SOL every day
alert me if SOL drops 5%`}</Block>
            <p><strong>Buy.</strong> Order from Amazon and Shopify inside the chat. Your money in, package out.</p>
            <p><strong>Comms.</strong> It can make calls and send email on your behalf, priced per action and confirmed with you first.</p>
          </Sec>

          <Sec id="identity" n={8} title="What&apos;s underneath">
            <p>Your level is a real on-chain record. Every Atcha is registered under the <a href="https://www.saidprotocol.com" target="_blank" rel="noreferrer">SAID</a> program (<C>5dpw6KEQPn248pnkkaYyWfHwu2nfb3LUMbTucb6LaA8G</C>): identity, owner, verification. <strong>Verification is free and automatic</strong>; Atcha sponsors it when you first sign in.</p>
            <p>The level is built from settled outcomes and anchored on-chain, so it follows you whichever surface you use, and it is what the funding formula reads every month. It is also what other people see when they check your name before paying you. Developers building on SAID can read it directly; that is the whole point of it being on-chain.</p>
            <p>One name, every handle: link X, Telegram and any wallet you already run, and they all resolve to you. Each link is proven by logging in, never by trust.</p>
          </Sec>

          <Sec id="fees" n={9} title="Fees and cashback">
            <p>Every action that moves real value takes a <strong>flat 1%</strong>, bundled into the same Solana transaction, so it lands in the treasury (<C>2XfHTeNWTjNwUmgoXaafYuqHcAAXj8F5Kjw2Bnzi4FxH</C>) in the same block as your action or not at all. Adding money, receiving, claiming and cashback payouts are never charged.</p>
            <p>Your level earns part of that fee back:</p>
            <table className={s.table}>
              <thead><tr><th>Tier</th><th>Back</th><th>What it takes</th></tr></thead>
              <tbody>
                <tr><td>Bronze</td><td>15%</td><td className={s.m}>Verified and active</td></tr>
                <tr><td>Silver</td><td>30%</td><td className={s.m}>10+ trusted interactions</td></tr>
                <tr><td>Gold</td><td>45%</td><td className={s.m}>30+ trusted interactions</td></tr>
                <tr><td>Platinum</td><td>50%</td><td className={s.m}>100+ interactions, top identity</td></tr>
              </tbody>
            </table>
            <p>Staking $SAID boosts your cashback. It never lowers the fee. Cashback earned on the budget stays in the budget; cashback earned on your cash is yours.</p>
          </Sec>

          <Sec id="money" n={10} title="Adding and taking out money">
            <p><strong>Add money</strong> with a card or Apple Pay inside the app, or send SOL or USDC to your address from any wallet or exchange. On a phone, the Add money screen shows a Solana Pay code any wallet can scan.</p>
            <p><strong>Take it out</strong> any time: your cash is withdrawable the moment it lands. From level 3, 80% of the gains made with the budget are yours too. The budget itself never leaves.</p>
          </Sec>

          <Sec id="surfaces" n={11} title="Where it lives">
            <ul>
              <li><strong>Web.</strong> The full thing: the funded dashboard, chat, send, wallet, activity. Installs to your home screen.</li>
              <li><strong>Telegram.</strong> <a href="https://t.me/saidinfrabot" target="_blank" rel="noreferrer">@saidinfrabot</a>, same Atcha, same balance.</li>
              <li><strong>X.</strong> Send and sign in by handle; tag <a href="https://x.com/saidagent" target="_blank" rel="noreferrer">@saidagent</a>.</li>
            </ul>
          </Sec>

          <Sec id="faq" n={12} title="FAQ">
            <Q>Do I need a wallet first?</Q>
            <p>No. Your Atcha has its own wallet, secured by Privy, from the moment it exists. Link an external one later if you want.</p>
            <Q>Can I withdraw the budget?</Q>
            <p>No. It trades; it doesn&apos;t leave. Your cash leaves whenever you like, and from level 3 so does your 80% of the gains.</p>
            <Q>What if the budget goes to zero?</Q>
            <p>Then it&apos;s gone and your cash was never touched. Next month funds again, if your level holds.</p>
            <Q>Is this a real on-chain identity?</Q>
            <p>Yes. Anyone can verify your Atcha&apos;s identity, level and history on Solana.</p>
            <Q>What if I lose my Telegram or X account?</Q>
            <p>Your Atcha persists on-chain. Recovery runs through the other logins you linked.</p>
            <Q>Can I see what it did?</Q>
            <p>Every action has a Solana signature. The <Link href="/activity">Activity</Link> tab shows yours; every Atcha has a public page at atcha.cash/@name.</p>
            <Q>Where do fees go?</Q>
            <p>To the SAID treasury, on-chain and auditable, which funds the protocol and the funding pool.</p>
          </Sec>

          <footer className={s.pageFoot} style={{ marginTop: 40 }}>
            Questions? Tag <a href="https://x.com/saidagent" target="_blank" rel="noreferrer">@saidagent</a> or message <a href="https://t.me/saidinfrabot" target="_blank" rel="noreferrer">@saidinfrabot</a>.
          </footer>
        </main>
      </div>
    </div>
  );
}
