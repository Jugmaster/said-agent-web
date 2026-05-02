import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold mb-3">Your AI butler on Solana.</h1>
        <p className="text-neutral-400 mb-8">
          Chat. Swap. Buy real things. One agent, three wallets, your own SAID identity.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/chat"
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium"
          >
            Open your butler
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
        <p className="mt-12 text-xs text-neutral-600">Powered by SAID Protocol</p>
      </div>
    </main>
  );
}
