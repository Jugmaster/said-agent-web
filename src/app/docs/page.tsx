import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Docs · SAID Agent",
  description:
    "How to use SAID Agent — your AI agent on Solana. Create one on the web or in Telegram, send crypto by @handle, swap tokens, earn on IDLE, call APIs, and more.",
  openGraph: {
    title: "Docs · SAID Agent",
    description: "How to use your SAID Agent on Solana.",
    type: "website",
  },
};

const SECTIONS = [
  { id: "what", title: "What is SAID Agent" },
  { id: "start", title: "Quick start" },
  { id: "send", title: "Send by @handle" },
  { id: "swap", title: "Swap & cross-chain" },
  { id: "agentcash", title: "AgentCash" },
  { id: "earn", title: "Earning · IDLE" },
  { id: "verify", title: "Verification" },
  { id: "funding", title: "Funding" },
  { id: "fees", title: "Fees" },
  { id: "cashback", title: "Cashback" },
  { id: "identity", title: "On-chain identity" },
  { id: "webapp", title: "Web app" },
  { id: "surfaces", title: "Surfaces" },
  { id: "faq", title: "FAQ" },
];

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
      <div className="space-y-4 text-[var(--ink)] leading-relaxed">{children}</div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-[rgba(128,128,128,.18)]/80 border border-[var(--line)] text-[var(--ink)] font-mono text-[0.9em]">
      {children}
    </code>
  );
}

function Block({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl overflow-hidden my-4">
      {label && (
        <div className="px-4 py-2 border-b border-[var(--line)] text-xs text-[var(--faint)] font-mono">
          {label}
        </div>
      )}
      <pre className="px-4 py-3 text-sm text-[var(--ink)] font-mono overflow-x-auto whitespace-pre-wrap break-words">
        {children}
      </pre>
    </div>
  );
}

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <div className="pt-28 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* SIDEBAR */}
          <aside className="md:w-56 shrink-0">
            <div className="md:sticky md:top-28 bg-[var(--card)]/70 backdrop-blur-md border border-[var(--line)] rounded-xl p-4 shadow-lg shadow-black/20">
              <div className="text-xs text-[var(--faint)] uppercase tracking-wider mb-3">
                Docs
              </div>
              <nav className="flex flex-col gap-0.5">
                {SECTIONS.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="group flex items-baseline gap-2 px-2 py-1.5 rounded-md text-sm text-[var(--dim)] hover:text-[var(--ink)] hover:bg-[rgba(128,128,128,.12)] transition"
                  >
                    <span className="text-[10px] text-[var(--faint)] font-mono tabular-nums w-4 text-right">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-tight">{s.title}</span>
                  </a>
                ))}
              </nav>

              <div className="hidden md:block mt-8 pt-6 border-t border-[var(--line)] text-xs text-[var(--faint)] space-y-2">
                <a
                  href="https://t.me/saidinfrabot"
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[var(--ink)] transition"
                >
                  @saidinfrabot →
                </a>
                <a
                  href="https://x.com/saidagent"
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[var(--ink)] transition"
                >
                  @saidagent →
                </a>
                <a
                  href="https://www.saidprotocol.com"
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[var(--ink)] transition"
                >
                  saidprotocol.com →
                </a>
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <main className="flex-1 min-w-0 max-w-3xl">
            <header className="mb-12">
              <div className="inline-block px-4 py-2 mb-6 text-sm text-[var(--dim)] border border-[var(--line)] rounded-full">
                Docs
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                SAID Agent.
              </h1>
              <p className="text-lg text-[var(--dim)] max-w-2xl">
                Your AI agent on Solana — its own wallet, its own identity,
                yours forever. Live in Telegram and right here on the web.
              </p>
            </header>

            <Section id="what" title="What is SAID Agent">
              <p>
                SAID Agent is a personal AI agent that lives on Solana. Every
                agent comes with its own Solana wallet, its own on-chain SAID
                Protocol identity (PDA), and persistent reputation that travels
                with you across every surface.
              </p>
              <p>
                You interact with your agent in natural language. Behind the
                scenes, it executes real on-chain transactions, talks to paid
                APIs through the x402 standard, and accrues a verifiable
                history of every action it takes on your behalf.
              </p>
              <p>
                It&apos;s free to start. You don&apos;t need a wallet, a seed
                phrase, or an account elsewhere. The bot provisions your agent
                and its wallet the moment you say hi.
              </p>
            </Section>

            <Section id="start" title="Quick start">
              <p>
                Open Telegram, find{" "}
                <a
                  href="https://t.me/saidinfrabot"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--ink)] underline underline-offset-2 hover:no-underline"
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
        profile: agent.saidprotocol.com/agents/Vega`}</Block>
              <p>
                That&apos;s it. Your agent exists. It has its own wallet, its
                own on-chain identity, and the full capability surface
                described below once verified.
              </p>
              <p>
                Prefer the web? You can create and claim an agent right here in
                the app — sign in with Telegram or X and your agent is
                provisioned the same way. If you already have one from the bot,
                signing in links it; the same agent, wallet, and history show
                up on both surfaces.
              </p>
            </Section>

            <Section id="send" title="Send crypto by @handle">
              <p>
                The differentiator. Send any token to anyone on Telegram by
                their username — no wallet address required. If the recipient
                doesn&apos;t have a SAID Agent yet, one is created for them
                when they accept the invite link.
              </p>
              <Block label="examples">{`send 5 USDC to @alex
send 0.1 SOL to @joe on telegram
send 25 JUP to @callum on x`}</Block>
              <p>
                For <Code>@username on x</Code>, the recipient gets an invite
                link you share with them. Funds stay in your wallet until they
                claim them — there&apos;s no escrow, the money isn&apos;t
                parked anywhere. Cancel an unclaimed invite any time:
              </p>
              <Block>{`cancel invite to @joe`}</Block>
            </Section>

            <Section id="swap" title="Swap & cross-chain">
              <p>
                Your agent routes Solana swaps through Jupiter (Raydium, Orca,
                Meteora, Phoenix, Lifinity, and 6 more under the hood). For
                cross-chain it uses LiFi (30+ bridges, 20+ DEXs) and deBridge
                for direct USDC.
              </p>
              <Block label="solana swaps">{`swap 0.5 SOL for JUP
swap 100 USDC to BONK`}</Block>
              <Block label="cross-chain">{`bridge 50 USDC to ethereum 0x...
swap 0.2 SOL on solana for ETH on base
swap 100 USDC for USDC on arbitrum`}</Block>
              <p>
                Routes are picked automatically based on price, speed, and
                fees. You get a quote first; nothing executes until you
                confirm.
              </p>
              <p>
                Beyond instant swaps, your agent can place{" "}
                <span className="text-[var(--ink)] font-medium">limit orders</span>{" "}
                (fill when a price is hit) and{" "}
                <span className="text-[var(--ink)] font-medium">recurring / DCA</span>{" "}
                buys. In a group chat, it can also run a{" "}
                <span className="text-[var(--ink)] font-medium">group swap</span> and
                tally everyone&apos;s positions.
              </p>
              <Block label="orders">{`buy JUP when it hits $0.40
dca 10 USDC into SOL every day
swap 5 USDC to BONK (in a group — everyone joins)`}</Block>
            </Section>

            <Section id="agentcash" title="AgentCash">
              <p>
                Your agent can pay for off-chain services via{" "}
                <a
                  href="https://x402.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--ink)] underline underline-offset-2 hover:no-underline"
                >
                  x402
                </a>{" "}
                — the HTTP 402 payment standard for AI agents. The agent has
                its own AgentCash sub-wallet that funds these calls.
              </p>
              <Block label="examples">{`call +1 (415) 555-0123 and ask if they're open tomorrow
email mike@example.com — "running 5 min late"
buy a 4-pack of LaCroix on amazon
research $JUP — top movers, sentiment, dev activity`}</Block>
              <p>
                Per-call pricing is shown before each action. Phone calls cost
                roughly $0.54 per minute; emails $0.02; research queries
                $0.01-0.05 depending on depth. The agent confirms the cost
                with you first.
              </p>
            </Section>

            <Section id="earn" title="Earning · IDLE">
              <p>
                Your agent doesn&apos;t only spend — it earns. Through{" "}
                <a
                  href="https://earnidle.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--ink)] underline underline-offset-2 hover:no-underline"
                >
                  IDLE
                </a>
                , a SAID partner, your agent picks up paid compute jobs while
                it&apos;s idle and is paid in USDC straight to its wallet.
              </p>
              <p>
                Jobs settle over x402, and each completed job is anchored to your
                agent&apos;s on-chain history — verifiable at the source, with
                every IDLE entry on your agent&apos;s profile linking to its
                earnings record on earnidle.com.
              </p>
              <p>
                This is how an agent starts to cover its own costs: the work it
                does while you&apos;re away helps fund the actions you ask of it.
              </p>
            </Section>

            <Section id="verify" title="Verification">
              <p>
                Activation is free and automatic. When you first sign in, SAID
                sponsors the on-chain verification that mints your agent&apos;s
                verified-badge NFT — no deposit required.
              </p>
              <p>Verification unlocks:</p>
              <ul className="list-disc pl-6 space-y-1 text-[var(--ink)]">
                <li>
                  The verified badge in the directory and on your agent&apos;s
                  public profile
                </li>
                <li>
                  Staking on the SAID program for Pro tier (0.5% fee instead
                  of 1%)
                </li>
                <li>Higher rate limits on AgentCash actions</li>
                <li>
                  Eligibility for SAID-Protocol-flagged features that gate on
                  verification
                </li>
              </ul>
              <p>
                Your agent can chat, look up prices, and explore before you
                fund it. Verification is just for actions that touch real
                money on or off chain.
              </p>
            </Section>

            <Section id="funding" title="Funding">
              <p>
                Your agent&apos;s wallet is a normal Solana wallet — fund it two
                ways:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-[var(--ink)]">
                <li>
                  <span className="text-[var(--ink)] font-medium">Buy with card</span> —
                  tap <span className="text-[var(--ink)]">Add funds</span> in the web app
                  to buy with a card or Apple Pay, right inside the app. The funds
                  land in your agent&apos;s wallet a couple of minutes after
                  payment confirms — no external wallet needed.
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">Crypto deposit</span>{" "}
                  — send SOL or any SPL token to your agent&apos;s wallet address
                  from any wallet or exchange.
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">Scan to pay</span> —
                  the Fund screen shows a Solana Pay QR any wallet app can scan
                  to top up your agent.
                </li>
              </ul>
              <p>
                Funding is yours to manage — your agent only ever spends what
                you put in its wallet, and you can withdraw any time by sending
                back out.
              </p>
            </Section>

            <Section id="fees" title="Fees">
              <p>
                Every action that moves real value takes a flat 1% fee. The fee
                is bundled into the same Solana transaction as your action —
                atomic, on-chain, and auditable on Solscan.
              </p>
              <p>Treasury address:</p>
              <Block>{`2XfHTeNWTjNwUmgoXaafYuqHcAAXj8F5Kjw2Bnzi4FxH`}</Block>
              <p>
                The fee itself is collected on-chain, atomically — it lands in
                the SAID treasury at the same block as your action, or neither
                does. Nothing is skimmed off-chain.
              </p>
              <p>
                Your agent&apos;s reputation — and staking — earn part of that
                fee back as cashback, so a good on-chain track record lowers your
                effective cost —{" "}
                <a
                  href="#cashback"
                  className="text-[var(--ink)] underline underline-offset-2 hover:text-[var(--ink)]"
                >
                  see Cashback
                </a>
                .
              </p>
              <p>
                Verification deposit, transaction fees, AgentCash per-call
                costs, and Jupiter routing fees are separate from the 1% SAID
                fee.
              </p>
            </Section>

            <Section id="cashback" title="Reputation cashback">
              <p>
                The more trusted your agent, the more of every fee it earns
                back. As your agent builds reputation through real, verified
                activity, it climbs tiers — and each tier rebates a bigger slice
                of the 1% fee straight into your wallet.
              </p>
              <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl overflow-hidden my-4 divide-y divide-[var(--line)]">
                {[
                  { tier: "New", back: "0%", req: "just getting started" },
                  { tier: "Bronze", back: "15%", req: "verified & active" },
                  { tier: "Silver", back: "30%", req: "10+ trusted interactions" },
                  { tier: "Gold", back: "45%", req: "30+ trusted interactions" },
                  {
                    tier: "Platinum",
                    back: "50%",
                    req: "100+ interactions · top identity",
                  },
                ].map((t) => (
                  <div
                    key={t.tier}
                    className="flex items-center gap-3 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-[var(--ink)] w-20">{t.tier}</span>
                    <span className="font-mono text-[var(--ink)] w-24">
                      {t.back} back
                    </span>
                    <span className="text-xs text-[var(--faint)] flex-1 text-right">
                      {t.req}
                    </span>
                  </div>
                ))}
              </div>
              <p>
                Cashback is paid from the fee you already paid — never out of
                pocket — so it&apos;s always a rebate, never a subsidy. It
                accrues as you trade and lands in your agent&apos;s wallet
                automatically.
              </p>
              <p>
                Reputation is earned, not bought. You build it by using your
                agent; it decays if the agent goes inactive or acts in bad
                faith. The cash you&apos;ve already earned is always yours —
                decay only affects your future rate.
              </p>
            </Section>

            <Section id="identity" title="On-chain identity">
              <p>
                Every SAID Agent is registered as a Solana PDA under the SAID
                Protocol program (
                <Code>5dpw6KEQPn248pnkkaYyWfHwu2nfb3LUMbTucb6LaA8G</Code>). The
                PDA holds your agent&apos;s identity, owner, optional stake,
                and verification status.
              </p>
              <p>
                Activity gets anchored on-chain via the SAID Protocol&apos;s{" "}
                <Code>SubmitAnchor</Code> instruction. Anchored receipts form
                a tamper-evident history that follows the agent regardless of
                which surface (Telegram, X, web) you used to issue the action.
              </p>
              <p>
                Read more about the protocol at{" "}
                <a
                  href="https://www.saidprotocol.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--ink)] underline underline-offset-2 hover:no-underline"
                >
                  saidprotocol.com
                </a>
                .
              </p>
            </Section>

            <Section id="webapp" title="Web app">
              <p>
                The web app is a full surface, not just a viewer. Sign in with
                Telegram or X and you get:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-[var(--ink)]">
                <li>
                  <span className="text-[var(--ink)] font-medium">Home</span> — your
                  dashboard: balance, holdings, recent activity, and one-tap
                  actions the moment you open the app.
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">Send</span> — pay
                  anyone by their Telegram or X handle; they don&apos;t need a
                  wallet or to have ever heard of SAID.
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">Chat</span> — talk to
                  your agent and run every action in natural language, same as
                  Telegram.
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">Wallet</span> — your
                  live balance and token holdings in one place. The agent&apos;s
                  service wallets are handled automatically, out of sight.
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">Activity</span> —
                  your agent&apos;s on-chain history (swaps, transfers, stakes),
                  each linkable to its Solana transaction.
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">Launches</span> —
                  tokens launched through the agent ecosystem.
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">Leaderboard</span> —
                  agents ranked by IDLE earnings (jobs completed, USDC earned).
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">Stats</span> — live
                  SAID Protocol numbers: agents registered, verified on-chain,
                  average reputation.
                </li>
              </ul>
              <p>
                It installs as a PWA, so you can add it to your home screen and
                it behaves like a native app.
              </p>
            </Section>

            <Section id="surfaces" title="Surfaces">
              <p>
                One agent, every platform. Same wallet, same identity, same
                on-chain history no matter where you reach it.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-[var(--ink)]">
                <li>
                  <span className="text-[var(--ink)] font-medium">Telegram</span> — live.{" "}
                  <a
                    href="https://t.me/saidinfrabot"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--ink)] underline underline-offset-2"
                  >
                    @saidinfrabot
                  </a>
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">Web app</span> — live.
                  Create or claim an agent and run everything in the browser;
                  sign in with Telegram or X.
                </li>
                <li>
                  <span className="text-[var(--ink)] font-medium">X</span> — used today
                  for send-by-handle and sign-in; broader in-app support is
                  expanding. Tag{" "}
                  <a
                    href="https://x.com/saidagent"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--ink)] underline underline-offset-2"
                  >
                    @saidagent
                  </a>{" "}
                  for updates.
                </li>
              </ul>
            </Section>

            <Section id="faq" title="FAQ">
              <h3 className="text-base font-semibold text-[var(--ink)] mt-6">
                Do I need a Solana wallet first?
              </h3>
              <p>
                No. Your agent gets its own custodial Privy wallet the moment
                you tap <Code>/start</Code>. You can later link an external
                wallet via the SAID Protocol&apos;s WalletLink instruction if
                you want, but it&apos;s not required.
              </p>

              <h3 className="text-base font-semibold text-[var(--ink)] mt-6">
                Is this an actual on-chain identity, or a database row?
              </h3>
              <p>
                On-chain. Each agent is a real Solana PDA under the SAID
                Protocol program. Anyone can verify your agent&apos;s
                identity, reputation, and activity history directly on the
                chain.
              </p>

              <h3 className="text-base font-semibold text-[var(--ink)] mt-6">
                What happens if I lose my Telegram account?
              </h3>
              <p>
                Your agent persists on-chain regardless of which Telegram
                account controls it. Account recovery flows are coming as
                part of the broader SAID Hosting platform.
              </p>

              <h3 className="text-base font-semibold text-[var(--ink)] mt-6">
                Can I see what my agent did?
              </h3>
              <p>
                Every action lands on Solana with a tx signature, then gets
                anchored into a Merkle-tree summary periodically. The{" "}
                <Link
                  href="/activity"
                  className="text-[var(--ink)] underline underline-offset-2 hover:no-underline"
                >
                  Activity
                </Link>{" "}
                tab shows your agent&apos;s history, and every agent has a public
                profile in the{" "}
                <Link
                  href="/agents"
                  className="text-[var(--ink)] underline underline-offset-2 hover:no-underline"
                >
                  directory
                </Link>
                .
              </p>

              <h3 className="text-base font-semibold text-[var(--ink)] mt-6">
                How does the agent know who to send to with @handle?
              </h3>
              <p>
                For Telegram, it resolves the username through the same
                identity graph the bot uses internally. For X, it stores a
                pending invite keyed to the handle — funds don&apos;t move
                until the recipient opens the invite and claims with their own
                agent.
              </p>

              <h3 className="text-base font-semibold text-[var(--ink)] mt-6">
                Where do the 1% fees go?
              </h3>
              <p>
                To the SAID Protocol treasury PDA at{" "}
                <Code>2XfHTeNW…4FxH</Code>. The treasury funds protocol
                development, ecosystem grants, and community programs. The
                accumulating balance is fully on-chain and auditable on
                Solscan.
              </p>
            </Section>

            <footer className="mt-20 pt-8 border-t border-[var(--line)] text-sm text-[var(--faint)]">
              <p>
                Questions? Tag{" "}
                <a
                  href="https://x.com/saidagent"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--ink)] hover:text-[var(--ink)]"
                >
                  @saidagent
                </a>{" "}
                on X or message{" "}
                <a
                  href="https://t.me/saidinfrabot"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--ink)] hover:text-[var(--ink)]"
                >
                  @saidinfrabot
                </a>{" "}
                directly — your agent will answer.
              </p>
              <p className="mt-2">
                <Link href="/" className="text-[var(--ink)] hover:text-[var(--ink)]">
                  ← back to SAID Agent
                </Link>
              </p>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}
