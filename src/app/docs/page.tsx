import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import s from "@/app/landing.module.css";

export const metadata: Metadata = {
  title: "Docs · Atcha",
  description:
    "How Atcha works: the credit it comes with, the two kinds of money, the ladder, paying anyone by @name, fees and cashback, and the SAID identity underneath.",
  openGraph: { title: "Docs · Atcha", description: "How Atcha works.", type: "website" },
};

const SECTIONS = [
  { id: "what", title: "What Atcha is" },
  { id: "start", title: "Quick start" },
  { id: "funded", title: "Funded: two kinds of money" },
  { id: "ladder", title: "The ladder" },
  { id: "token", title: "Holding $ATCHA" },
  { id: "send", title: "Pay anyone by @name" },
  { id: "trade", title: "Trade, buy, and more" },
  { id: "identity", title: "Identity and reputation" },
  { id: "fees", title: "Fees and cashback" },
  { id: "money", title: "Adding and taking out money" },
  { id: "surfaces", title: "Where it lives" },
  { id: "faq", title: "FAQ" },
];

function Sec({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className={s.docSec}>
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
      <Navbar />
      <div className={`${s.docs} ${s.wrap}`}>
        <aside>
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
        </aside>

        <main style={{ minWidth: 0 }}>
          <header className={s.docHead}>
            <p className={s.eyebrow}>Docs</p>
            <h1 className={s.big}>How Atcha works.</h1>
            <p className={s.pageSub}>Your AI, funded on day one. Its own balance, its own SAID identity, yours forever. Live in Telegram and right here on the web.</p>
          </header>

          <Sec id="what" n={1} title="What Atcha is">
            <p>Atcha is a personal AI that lives on Solana and comes with money in it. Every Atcha starts with <strong>trading credit we put in</strong>, sized by what the chart earned that hour. Credit trades the majors and takes the first loss. Money you add is yours, always, and is what pays anyone you can name, buys things, and hires.</p>
            <p>Under it is <strong>SAID</strong>: every Atcha has its own on-chain identity and a reputation that travels with you. Every name you send to is resolved and screened on SAID before money moves.</p>
            <p>You talk to it in plain language. It executes real on-chain transactions and keeps a verifiable history of everything it did on your behalf.</p>
          </Sec>

          <Sec id="start" n={2} title="Quick start">
            <p><strong>On the web:</strong> tap <Link href="/">Get your funded Atcha</Link>, sign in with X or Telegram, and it exists. That login is your identity binding on SAID.</p>
            <p><strong>In Telegram:</strong> open <a href="https://t.me/saidinfrabot" target="_blank" rel="noreferrer">@saidinfrabot</a> and tap <C>/start</C>.</p>
            <Block label="telegram">{`you  →  /start
bot  →  hey, welcome to Atcha. your AI comes funded.
        what do you want to name yours?

you  →  Vega
bot  →  ✓ Vega is being registered on SAID.
        today's funding: $25 in trading credit
        profile: agent.saidprotocol.com/agents/Vega`}</Block>
            <p>Already have one from the bot? Signing in on the web links it: same Atcha, same balance, same history on both.</p>
          </Sec>

          <Sec id="funded" n={3} title="Funded: two kinds of money">
            <p>Your balance is one number with two things inside it. The dashboard never hides which is which.</p>
            <table className={s.table}>
              <thead><tr><th></th><th>Credit</th><th>Your money</th></tr></thead>
              <tbody>
                <tr><td className={s.m}>Where it comes from</td><td>Us, on day one. Sized by the chart.</td><td>You. Card, Apple Pay, or a transfer.</td></tr>
                <tr><td className={s.m}>What it can do</td><td>Trade the majors.</td><td>Trade anything. Pay anyone. Buy things. Hire.</td></tr>
                <tr><td className={s.m}>Who loses first</td><td>Credit. Always.</td><td>Only after credit is gone.</td></tr>
                <tr><td className={s.m}>Taking it out</td><td>Locked until the top rung.</td><td>Any time.</td></tr>
                <tr><td className={s.m}>Gains on it</td><td>Stay credit.</td><td>Yours.</td></tr>
              </tbody>
            </table>
            <p><strong>Today&apos;s funding</strong> is recomputed every hour from what the $ATCHA token earned, up to a cap. The number on the landing page is live. Launch day is the biggest it will ever be.</p>
            <p><strong>First deposit match.</strong> Add money for the first time and we match it in credit, one to one, up to $50.</p>
            <p><strong>The majors.</strong> Credit trades SOL, BTC, ETH, USDC and a short list of tokens with deep, live liquidity. It never trades anything else, and it never buys $ATCHA. If liquidity can&apos;t be verified at trade time, the trade is refused.</p>
            <p><strong>Drawdown pause.</strong> If credit falls below half of what you were funded, trading and spending pause. Two of today&apos;s tasks reopen them. A price bounce doesn&apos;t.</p>
            <p><strong>Untouched credit</strong> is reclaimed after 14 days so it can fund someone who will use it.</p>
          </Sec>

          <Sec id="ladder" n={4} title="The ladder">
            <p>Four rungs. Each raises what you can do in a day. The top one is where the upside becomes yours to take out.</p>
            <table className={s.table}>
              <thead><tr><th>Rung</th><th>Pay / day</th><th>Trade / day</th><th>How you get there</th></tr></thead>
              <tbody>
                <tr><td>0 · Funded</td><td>$5</td><td>$10</td><td className={s.m}>Sign up.</td></tr>
                <tr><td>1 · Proven</td><td>$25</td><td>$50</td><td className={s.m}>Five settled sends to five different real people, from your own money.</td></tr>
                <tr><td>2 · Trusted</td><td>$100</td><td>$250</td><td className={s.m}>A 30-day streak.</td></tr>
                <tr><td>3 · Owner</td><td>$500</td><td>$1,000</td><td className={s.m}>By review. Credit and gains unlock.</td></tr>
              </tbody>
            </table>
            <p><strong>Three things a day</strong> keep the streak: a trade with credit, a lock, a send. The ones that settle with a real person build reputation. Only settled outcomes count: a send that was claimed, a job that was delivered, a purchase that shipped. Paying yourself doesn&apos;t count; SAID knows it&apos;s you.</p>
          </Sec>

          <Sec id="token" n={5} title="Holding $ATCHA">
            <p>Lock $ATCHA for 30 days and your Atcha gets bigger: funding, first-deposit match, and daily limits scale with it. Two tiers, by share of supply locked. <strong>Size, never a payout</strong>, and never a shortcut up the ladder: your rung and your cashback rate are behavioural only.</p>
            <p>Hold it in a wallet you already have? Link that wallet to your Atcha on SAID and the lock counts.</p>
          </Sec>

          <Sec id="send" n={6} title="Pay anyone by @name">
            <p>Any X or Telegram handle. They don&apos;t need a wallet, or to have heard of Atcha. Paying runs on your own money.</p>
            <Block label="examples">{`send 5 USDC to @alex
pay @that_plumber $120
split $180 with @the_groupchat`}</Block>
            <p>Before a cent moves the name is <strong>resolved and screened on SAID</strong>: is this the real account, what is its record. If a name doesn&apos;t check out, your money never leaves.</p>
            <p>If they&apos;re not on Atcha yet, the money waits in your balance under their name. They log in with the account you named and it&apos;s already there. Nothing is parked anywhere, and it returns to you if they never show. Cancel any time:</p>
            <Block>{`cancel the send to @joe`}</Block>
          </Sec>

          <Sec id="trade" n={7} title="Trade, buy, and more">
            <p><strong>Trade.</strong> Swaps route through Jupiter across every major Solana venue. You get a quote first; nothing executes until you confirm. Credit trades the majors; your own money trades anything on Solana, and can bridge to other chains.</p>
            <Block label="examples">{`swap $5 of my credit into SOL
buy JUP when it hits $0.40
DCA $10 into SOL every day
alert me if SOL drops 5%`}</Block>
            <p><strong>Buy.</strong> Order from Amazon and Shopify inside the chat. Your money in, package out.</p>
            <p><strong>Comms.</strong> It can make calls and send email on your behalf, priced per action and confirmed with you first.</p>
          </Sec>

          <Sec id="identity" n={8} title="Identity and reputation">
            <p>Every Atcha is a real on-chain record under the SAID program (<C>5dpw6KEQPn248pnkkaYyWfHwu2nfb3LUMbTucb6LaA8G</C>): identity, owner, verification, optional stake. <strong>Verification is free and automatic</strong>; Atcha sponsors it when you first sign in.</p>
            <p>Reputation is built from settled outcomes and anchored on-chain, so it follows you regardless of which surface you used. It sets your cashback rate and it is what other people see when they check your name before paying you.</p>
            <p>One name, every handle: link X, Telegram and any wallet you already run, and they all resolve to you. Each link is proven by logging in, never by trust.</p>
          </Sec>

          <Sec id="fees" n={9} title="Fees and cashback">
            <p>Every action that moves real value takes a <strong>flat 1%</strong>, bundled into the same Solana transaction, so it lands in the treasury (<C>2XfHTeNWTjNwUmgoXaafYuqHcAAXj8F5Kjw2Bnzi4FxH</C>) in the same block as your action or not at all. Adding money, receiving, claiming and cashback payouts are never charged.</p>
            <p>Reputation earns part of that fee back:</p>
            <table className={s.table}>
              <thead><tr><th>Tier</th><th>Back</th><th>What it takes</th></tr></thead>
              <tbody>
                <tr><td>Bronze</td><td>15%</td><td className={s.m}>Verified and active</td></tr>
                <tr><td>Silver</td><td>30%</td><td className={s.m}>10+ trusted interactions</td></tr>
                <tr><td>Gold</td><td>45%</td><td className={s.m}>30+ trusted interactions</td></tr>
                <tr><td>Platinum</td><td>50%</td><td className={s.m}>100+ interactions, top identity</td></tr>
              </tbody>
            </table>
            <p>Staking boosts your cashback. It never lowers the fee and it never touches your reputation. Cashback earned on credit stays credit; cashback earned on your money is yours.</p>
          </Sec>

          <Sec id="money" n={10} title="Adding and taking out money">
            <p><strong>Add money</strong> with a card or Apple Pay inside the app, or send SOL or USDC to your address from any wallet or exchange. On a phone, the Add money screen shows a Solana Pay code any wallet can scan.</p>
            <p><strong>Take it out</strong> any time: your own money is withdrawable the moment it lands. Credit, and gains made with credit, unlock at Owner.</p>
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
            <Q>Can I withdraw the credit?</Q>
            <p>Not until Owner. Credit trades; it doesn&apos;t leave. Your own money leaves whenever you like.</p>
            <Q>What if the credit goes to zero?</Q>
            <p>Then it&apos;s gone and your money was never touched. Trading pauses below half; tasks reopen it.</p>
            <Q>Is this a real on-chain identity?</Q>
            <p>Yes. Anyone can verify your Atcha&apos;s identity, reputation and history on Solana.</p>
            <Q>What if I lose my Telegram or X account?</Q>
            <p>Your Atcha persists on-chain. Recovery runs through the other logins you linked.</p>
            <Q>Can I see what it did?</Q>
            <p>Every action has a Solana signature. The <Link href="/activity">Activity</Link> tab shows yours; every Atcha has a public page in <Link href="/agents">Agents</Link>.</p>
            <Q>Where do fees go?</Q>
            <p>To the SAID treasury, on-chain and auditable, which funds the protocol and the credit pool.</p>
          </Sec>

          <footer className={s.pageFoot} style={{ marginTop: 40 }}>
            Questions? Tag <a href="https://x.com/saidagent" target="_blank" rel="noreferrer">@saidagent</a> or message <a href="https://t.me/saidinfrabot" target="_blank" rel="noreferrer">@saidinfrabot</a>.
          </footer>
        </main>
      </div>
    </div>
  );
}
