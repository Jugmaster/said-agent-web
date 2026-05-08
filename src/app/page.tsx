import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col bg-neutral-950 text-neutral-100">
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold mb-3">
            your AI agent on Solana.
          </h1>
          <p className="text-neutral-400 mb-8">
            Personal on-chain agent. Own wallet. Own identity. Cross-chain
            native. Tweet to launch tokens, chat to do everything else.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/chat"
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium"
            >
              Open your agent
            </Link>
            <a
              href="https://t.me/saidinfrabot"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500"
            >
              Use on Telegram
            </a>
          </div>
        </div>
      </section>

      <nav className="border-t border-neutral-900 px-6 py-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-500">
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
      </nav>
    </main>
  );
}
