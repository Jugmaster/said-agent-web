import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Docs · SAID Agent",
  description:
    "How to use SAID Agent — your AI agent on Solana. Send crypto by Telegram handle, swap tokens, call APIs, and more.",
  openGraph: {
    title: "Docs · SAID Agent",
    description: "How to use your SAID Agent on Solana.",
    type: "website",
  },
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 mb-16">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
        {title}
      </h2>
      <div className="space-y-4 text-zinc-300 leading-relaxed">{children}</div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-800 text-zinc-200 font-mono text-[0.9em]">
      {children}
    </code>
  );
}

function Block({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden my-4">
      {label && (
        <div className="px-4 py-2 border-b border-zinc-800 text-xs text-zinc-500 font-mono">
          {label}
        </div>
      )}
      <pre className="px-4 py-3 text-sm text-zinc-200 font-mono overflow-x-auto whitespace-pre-wrap break-words">
        {children}
      </pre>
    </div>
  );
}

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 md:px-8 pt-28 pb-20 max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <div className="inline-block px-4 py-2 mb-6 text-sm text-zinc-400 border border-zinc-700 rounded-full">
            Docs
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            SAID Agent.
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Your AI agent on Solana — its own wallet, its own identity,
            yours forever. Lives in Telegram today; X and web app next.
          </p>
        </header>

        {/* Table of contents */}
        <nav className="mb-12 p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-sm">
          <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
            On this page
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
            <li>
              <a href="#what" className="text-zinc-300 hover:text-white">
                01 — What is SAID Agent
              </a>
            </li>
            <li>
              <a href="#start" className="text-zinc-300 hover:text-white">
                02 — Quick start
              </a>
            </li>
            <li>
              <a href="#send" className="text-zinc-300 hover:text-white">
                03 — Send by @handle
              </a>
            </li>
            <li>
              <a href="#swap" className="text-zinc-300 hover:text-white">
                04 — Swap &amp; cross-chain
              </a>
            </li>
            <li>
              <a href="#agentcash" className="text-zinc-300 hover:text-white">
                05 — AgentCash (calls, emails, shopping, research)
              </a>
            </li>
            <li>
              <a href="#verify" className="text-zinc-300 hover:text-white">
                06 — Verification
              </a>
            </li>
            <li>
              <a href="#fees" className="text-zinc-300 hover:text-white">
                07 — Fees
              </a>
            </li>
            <li>
              <a href="#identity" className="text-zinc-300 hover:text-white">
                08 — On-chain identity
              </a>
            </li>
            <li>
              <a href="#surfaces" className="text-zinc-300 hover:text-white">
                09 — Surfaces
              </a>
            </li>
            <li>
              <a href="#faq" className="text-zinc-300 hover:text-white">
                10 — FAQ
              </a>
            </li>
          </ul>
        </nav>

        <Section id="what" title="What is SAID Agent">
          <p>
            SAID Agent is a personal AI agent that lives on Solana. Every agent
            comes with its own Solana wallet, its own on-chain SAID Protocol
            identity (PDA), and persistent reputation that travels with you
            across every surface.
          </p>
          <p>
            You interact with your agent in natural language. Behind the scenes,
            it executes real on-chain transactions, talks to paid APIs through
            the x402 standard, and accrues a verifiable history of every action
            it takes on your behalf.
          </p>
          <p>
            It&apos;s free to start. You don&apos;t need a wallet, a seed phrase,
            or an account elsewhere. The bot provisions your agent and its
            wallet the moment you say hi.
          </p>
        </Section>

        <Section id="start" title="Quick start">
          <p>
            Open Telegram, find{" "}
            <a
              href="https://t.me/saidinfrabot"
              target="_blank"
              rel="noreferrer"
              className="text-white underline underline-offset-2 hover:no-underline"
            >
              @saidinfrabot
            </a>
            , and tap <Code>/start</Code>.
          </p>
          <Block label="telegram">{`you  →  /start
bot  →  hey — welcome to SAID Protocol. I create personal AI agents on Solana.
        your agent gets its own wallet, its own identity, and persists
        across every surface — yours forever.
        what do you want to name yours?

you  →  Vega
bot  →  ✓ Vega is being registered on-chain.
        wallet: 4Qnf...8vR3
        profile: saidprotocol.com/agent/Vega`}</Block>
          <p>
            That&apos;s it. Your agent exists. It has its own wallet, its own
            on-chain identity, and the full capability surface described below
            once verified.
          </p>
        </Section>

        <Section id="send" title="Send crypto by @handle">
          <p>
            The differentiator. Send any token to anyone on Telegram by their
            username — no wallet address required. If the recipient
            doesn&apos;t have a SAID Agent yet, one is created for them when
            they accept the invite link.
          </p>
          <Block label="examples">{`send 5 USDC to @alex
send 0.1 SOL to @joe on telegram
send 25 JUP to @callum on x`}</Block>
          <p>
            For <Code>@username on x</Code>, the recipient gets an invite link
            you share with them. Funds stay in your wallet until they claim
            them — there&apos;s no escrow, no custody, no risk of stuck money.
            Cancel an unclaimed invite any time:
          </p>
          <Block>{`cancel invite to @joe`}</Block>
        </Section>

        <Section id="swap" title="Swap & cross-chain">
          <p>
            Your agent routes Solana swaps through Jupiter (Raydium, Orca,
            Meteora, Phoenix, Lifinity, and 6 more under the hood). For
            cross-chain it uses LiFi (30+ bridges, 20+ DEXs) and deBridge for
            direct USDC.
          </p>
          <Block label="solana swaps">{`swap 0.5 SOL for JUP
swap 100 USDC to BONK`}</Block>
          <Block label="cross-chain">{`bridge 50 USDC to ethereum 0x...
swap 0.2 SOL on solana for ETH on base
swap 100 USDC for USDC on arbitrum`}</Block>
          <p>
            Routes are picked automatically based on price, speed, and fees.
            You get a quote first; nothing executes until you confirm.
          </p>
        </Section>

        <Section
          id="agentcash"
          title="AgentCash — calls, emails, shopping, research"
        >
          <p>
            Your agent can pay for off-chain services via{" "}
            <a
              href="https://x402.org"
              target="_blank"
              rel="noreferrer"
              className="text-white underline underline-offset-2 hover:no-underline"
            >
              x402
            </a>{" "}
            — the HTTP 402 payment standard for AI agents. The agent has its
            own AgentCash sub-wallet that funds these calls.
          </p>
          <Block label="examples">{`call +1 (415) 555-0123 and ask if they're open tomorrow
email mike@example.com — "running 5 min late"
buy a 4-pack of LaCroix on amazon
research $JUP — top movers, sentiment, dev activity`}</Block>
          <p>
            Per-call pricing is shown before each action. Phone calls cost
            roughly $0.54 per minute; emails $0.02; research queries $0.01-0.05
            depending on depth. The agent confirms the cost with you first.
          </p>
        </Section>

        <Section id="verify" title="Verification">
          <p>
            Activation is a one-time 0.015 SOL deposit to your agent&apos;s
            wallet. Of that, 0.01 SOL pays the on-chain verification fee
            (which mints your agent&apos;s verified-badge NFT and routes to the
            SAID treasury); the rest covers initial transaction fees.
          </p>
          <p>
            Verification unlocks:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-zinc-300">
            <li>The verified badge in the directory and on your agent&apos;s public profile</li>
            <li>Staking on the SAID program for Pro tier (0.5% fee instead of 1%)</li>
            <li>Higher rate limits on AgentCash actions</li>
            <li>Eligibility for SAID-Protocol-flagged features that gate on verification</li>
          </ul>
          <p>
            Your agent can chat, look up prices, and explore before you fund
            it. Verification is just for actions that touch real money on or
            off chain.
          </p>
        </Section>

        <Section id="fees" title="Fees">
          <p>
            Every action that moves real value takes a 1% fee (0.5% if your
            agent is staked Pro tier). The fee is bundled into the same Solana
            transaction as your action — atomic, on-chain, and auditable on
            Solscan.
          </p>
          <p>
            Treasury address:
          </p>
          <Block>{`2XfHTeNWTjNwUmgoXaafYuqHcAAXj8F5Kjw2Bnzi4FxH`}</Block>
          <p>
            Nothing is collected off-chain. Nothing accumulates in a database
            waiting to be swept. Each fee lands in the SAID treasury at the
            same block as the user-intended action — or neither does.
          </p>
          <p>
            Verification deposit, transaction fees, AgentCash per-call costs,
            and Jupiter routing fees are separate from the 1% SAID fee.
          </p>
        </Section>

        <Section id="identity" title="On-chain identity">
          <p>
            Every SAID Agent is registered as a Solana PDA under the SAID
            Protocol program (
            <Code>5dpw6KEQPn248pnkkaYyWfHwu2nfb3LUMbTucb6LaA8G</Code>). The PDA
            holds your agent&apos;s identity, owner, optional stake, and
            verification status.
          </p>
          <p>
            Activity gets anchored on-chain via the SAID Protocol&apos;s
            <Code>SubmitAnchor</Code> instruction. Anchored receipts form a
            tamper-evident history that follows the agent regardless of which
            surface (Telegram, X, web) you used to issue the action.
          </p>
          <p>
            Read more about the protocol at{" "}
            <a
              href="https://www.saidprotocol.com"
              target="_blank"
              rel="noreferrer"
              className="text-white underline underline-offset-2 hover:no-underline"
            >
              saidprotocol.com
            </a>
            .
          </p>
        </Section>

        <Section id="surfaces" title="Surfaces">
          <p>
            One agent, every platform. The Telegram bot is the first door;
            the web app and X surface are coming. Same wallet, same identity,
            same on-chain history across all of them.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-zinc-300">
            <li>
              <span className="text-white font-medium">Telegram</span> — live now.{" "}
              <a
                href="https://t.me/saidinfrabot"
                target="_blank"
                rel="noreferrer"
                className="text-white underline underline-offset-2"
              >
                @saidinfrabot
              </a>
            </li>
            <li>
              <span className="text-white font-medium">Web app</span> — currently
              in early access. Log in with Telegram to use your existing agent.
            </li>
            <li>
              <span className="text-white font-medium">X</span> — coming. Tag{" "}
              <a
                href="https://x.com/saidagent"
                target="_blank"
                rel="noreferrer"
                className="text-white underline underline-offset-2"
              >
                @saidagent
              </a>{" "}
              for launch updates.
            </li>
          </ul>
        </Section>

        <Section id="faq" title="FAQ">
          <h3 className="text-base font-semibold text-white mt-6">
            Do I need a Solana wallet first?
          </h3>
          <p>
            No. Your agent gets its own custodial Privy wallet the moment you
            tap <Code>/start</Code>. You can later link an external wallet via
            the SAID Protocol&apos;s WalletLink instruction if you want, but
            it&apos;s not required.
          </p>

          <h3 className="text-base font-semibold text-white mt-6">
            Is this an actual on-chain identity, or a database row?
          </h3>
          <p>
            On-chain. Each agent is a real Solana PDA under the SAID Protocol
            program. Anyone can verify your agent&apos;s identity, reputation,
            and activity history directly on the chain.
          </p>

          <h3 className="text-base font-semibold text-white mt-6">
            What happens if I lose my Telegram account?
          </h3>
          <p>
            Your agent persists on-chain regardless of which Telegram account
            controls it. Account recovery flows are coming as part of the
            broader SAID Hosting platform.
          </p>

          <h3 className="text-base font-semibold text-white mt-6">
            Can I see what my agent did?
          </h3>
          <p>
            Every action lands on Solana with a tx signature, then gets
            anchored into a Merkle-tree summary periodically. Your agent&apos;s
            public profile at{" "}
            <Code>saidprotocol.com/agent/&lt;your-wallet&gt;</Code> shows the
            verifiable history.
          </p>

          <h3 className="text-base font-semibold text-white mt-6">
            How does the agent know who to send to with @handle?
          </h3>
          <p>
            For Telegram, it resolves the username through the same identity
            graph the bot uses internally. For X, it stores a pending invite
            keyed to the handle — funds don&apos;t move until the recipient
            opens the invite and claims with their own agent.
          </p>

          <h3 className="text-base font-semibold text-white mt-6">
            Where do the 1% fees go?
          </h3>
          <p>
            To the SAID Protocol treasury PDA at{" "}
            <Code>2XfHTeNW…4FxH</Code>. The treasury funds protocol
            development, ecosystem grants, and {/* TODO: insert governance link when live */}
            community programs. The accumulating balance is fully on-chain and
            auditable on Solscan.
          </p>
        </Section>

        <footer className="mt-20 pt-8 border-t border-zinc-800 text-sm text-zinc-500">
          <p>
            Questions? Tag{" "}
            <a
              href="https://x.com/saidagent"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-300 hover:text-white"
            >
              @saidagent
            </a>{" "}
            on X or message{" "}
            <a
              href="https://t.me/saidinfrabot"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-300 hover:text-white"
            >
              @saidinfrabot
            </a>{" "}
            directly — your agent will answer.
          </p>
          <p className="mt-2">
            <Link href="/" className="text-zinc-300 hover:text-white">
              ← back to SAID Agent
            </Link>
          </p>
        </footer>
      </main>
    </>
  );
}
