import Link from "next/link";
import {
  getStats,
  getLaunches,
  type PlatformStats,
  type LaunchListItem,
} from "@/lib/api";

export const dynamic = "force-dynamic";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function HowItWorksCard({
  step,
  title,
  example,
  cta,
  href,
}: {
  step: string;
  title: string;
  example: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-5">
      <div className="text-xs text-neutral-500 mb-2">{step}</div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-xs text-neutral-500 mb-3 font-mono break-words">{example}</p>
      <Link
        href={href}
        className="inline-block text-xs px-3 py-1.5 rounded-md border border-neutral-700 hover:border-neutral-500"
      >
        {cta}
      </Link>
    </div>
  );
}

function CapabilityRow({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-900 last:border-0">
      <span className="text-xl shrink-0 leading-tight">{emoji}</span>
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function RecentLaunchRow({ l }: { l: LaunchListItem }) {
  const tickerMatch = l.tweetExcerpt.match(/\$([A-Z0-9]{2,10})/);
  const ticker = tickerMatch?.[1] ?? l.tokenMint.slice(0, 6);
  return (
    <Link
      href={l.pumpfunUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg px-3 py-2 text-xs"
    >
      <span className="font-medium">${ticker}</span>
      <span className="text-neutral-500">@{l.creator.xHandle}</span>
    </Link>
  );
}

export default async function HomePage() {
  // Fetch in parallel — both have no-store caching so always fresh.
  // If butler is unreachable, we render a graceful no-data variant.
  const [stats, launches] = await Promise.all([
    getStats(),
    getLaunches(5),
  ]);

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100">
      {/* HERO */}
      <section className="px-6 pt-16 pb-10 max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-tight">
          your AI agent on Solana.
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 mb-8 max-w-xl mx-auto">
          Personal on-chain agent — own wallet, own identity, persistent
          across every surface. Cross-chain native. No signup.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/chat"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium"
          >
            Start chatting
          </Link>
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500"
          >
            Open on Telegram
          </a>
          <a
            href="https://x.com/saidagent"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500"
          >
            Tag on X
          </a>
        </div>
      </section>

      {/* LIVE STATS */}
      {stats && (
        <section className="px-6 pb-12 max-w-3xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile
              label="Agents"
              value={stats.agents.total.toLocaleString()}
              sub={`${stats.agents.pro} Pro · ${stats.agents.verified} verified`}
            />
            <StatTile
              label="Launches"
              value={stats.launches.total.toLocaleString()}
              sub="via @saidagent"
            />
            <StatTile
              label="On-chain actions"
              value={stats.activity.totalReceipts.toLocaleString()}
              sub="anchored receipts"
            />
            <StatTile
              label="Creator fees swept"
              value={`${stats.sweeps.totalClaimedSol.toFixed(2)} SOL`}
              sub={`${stats.sweeps.count} sweeps`}
            />
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="px-6 pb-12 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Three ways in.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <HowItWorksCard
            step="01"
            title="Tweet to launch a token"
            example='@saidagent launch FunnyCoin $FUNNY'
            cta="See launches →"
            href="/launches"
          />
          <HowItWorksCard
            step="02"
            title="Chat to do everything else"
            example='swap 0.1 SOL to USDC'
            cta="Open chat →"
            href="/chat"
          />
          <HowItWorksCard
            step="03"
            title="Send crypto by handle"
            example='send 5 USDC to @joe on X'
            cta="Browse agents →"
            href="/agents"
          />
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="px-6 pb-12 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-3">What your agent can do.</h2>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-1">
          <CapabilityRow
            emoji="⚡"
            title="Cross-chain aggregator"
            desc="One swap from any Solana asset to any EVM-chain asset. Routes via LiFi (30+ bridges, 20+ DEXs) — picks the cheapest path automatically."
          />
          <CapabilityRow
            emoji="📤"
            title="Send crypto by handle"
            desc="Send by @x_handle or @telegram_username. If they don't have an agent yet, they get an invite link and your funds stay safe in your wallet until they claim."
          />
          <CapabilityRow
            emoji="🔄"
            title="Solana DEX aggregation"
            desc="Best-price swaps across Raydium, Orca, Meteora, Phoenix, Lifinity, and 6 more — Jupiter under the hood."
          />
          <CapabilityRow
            emoji="🪙"
            title="One-tweet token launches"
            desc="Tweet @saidagent a launch and your agent mints the token on pump.fun. You're the on-chain creator. Keep 80% of every trading fee forever."
          />
          <CapabilityRow
            emoji="🔒"
            title="On-chain identity + reputation"
            desc="Each agent has its own SAID Protocol PDA. Activity, holdings, and reputation accrue to a persistent identity that travels across surfaces."
          />
          <CapabilityRow
            emoji="📅"
            title="DCA, staking, transfers"
            desc="Schedule recurring buys. Stake on the SAID program for Pro tier. Transfer SOL/USDC to addresses or contacts."
          />
        </div>
      </section>

      {/* RECENT LAUNCHES */}
      {launches.length > 0 && (
        <section className="px-6 pb-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Recent launches</h2>
            <Link
              href="/launches"
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              See all →
            </Link>
          </div>
          <div className="space-y-2">
            {launches.slice(0, 5).map((l) => (
              <RecentLaunchRow key={l.tokenMint} l={l} />
            ))}
          </div>
        </section>
      )}

      {/* CTA RAIL */}
      <section className="px-6 pb-12 max-w-3xl mx-auto">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-6 py-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            Your agent already exists.
          </h2>
          <p className="text-sm text-neutral-400 mb-4 max-w-md mx-auto">
            Tap below — we provision your wallet, your SAID identity, and your
            three sub-wallets the moment you start. No signup, no seed phrases.
          </p>
          <Link
            href="/chat"
            className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium"
          >
            Open your agent →
          </Link>
        </div>
      </section>

      {/* FOOTER NAV */}
      <footer className="border-t border-neutral-900 px-6 py-6 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-500">
          <Link href="/agents" className="hover:text-neutral-300">
            Agents
          </Link>
          <Link href="/launches" className="hover:text-neutral-300">
            Launches
          </Link>
          <a
            href="https://x.com/saidagent"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-300"
          >
            @saidagent
          </a>
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-300"
          >
            @saidinfrabot
          </a>
          <a
            href="https://www.saidprotocol.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-300"
          >
            SAID Protocol
          </a>
        </div>
      </footer>
    </main>
  );
}
