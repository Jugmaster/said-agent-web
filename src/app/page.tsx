"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/Navbar";
import HomeBelowFold from "@/components/HomeBelowFold";

export default function HomePage() {
  const { ready, login } = usePrivy();

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100dvh-65px)] px-6 flex items-center justify-center">
        <div className="max-w-xl w-full text-center">
          <div className="inline-block px-4 py-2 mb-8 text-sm text-zinc-400 border border-zinc-700 rounded-full">
            Now live on Solana Mainnet
          </div>

          <h1
            className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight leading-tight"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.85), 0 0 60px rgba(102,126,234,0.15)" }}
          >
            Send money. Buy anything. Swap tokens.
          </h1>
          <p
            className="text-base sm:text-lg text-zinc-400 mb-8 max-w-md mx-auto"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
          >
            All from one chat — your own AI agent on Solana. No seed phrases, no
            setup.
          </p>

          {/* Telegram-first (one tap), web app secondary */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <a
              href="https://t.me/saidinfrabot"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto sm:px-10 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition"
            >
              Start in Telegram →
            </a>
            <button
              onClick={login}
              disabled={!ready}
              className="w-full sm:w-auto sm:px-8 px-6 py-3 border border-zinc-700 text-zinc-200 rounded-lg font-semibold hover:bg-zinc-800/50 disabled:opacity-50 transition"
            >
              {ready ? "Open web app" : "Loading…"}
            </button>
          </div>

          <p className="text-xs text-zinc-500">
            Non-custodial · keys secured by Privy · no seed phrase · no SOL to
            start
          </p>

          <div className="mt-12 flex items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">
            <Link href="/launches" className="hover:text-white transition">
              Launches
            </Link>
            <span className="text-zinc-700">·</span>
            <Link href="/agents" className="hover:text-white transition">
              Agents
            </Link>
            <span className="text-zinc-700">·</span>
            <a
              href="https://x.com/saidagent"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              @saidagent
            </a>
            <span className="text-zinc-700">·</span>
            <a
              href="https://t.me/saidinfrabot"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Telegram
            </a>
          </div>
        </div>
      </main>

      <HomeBelowFold />
    </>
  );
}
