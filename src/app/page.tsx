"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/Navbar";

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

          <h1 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight leading-tight">
            One conversation.
            <br />
            One identity. One balance.
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 mb-3 max-w-lg mx-auto">
            <span className="text-zinc-200">Send your friend 20 bucks. Buy those Nikes. Swap your $PEPE for SOL.</span>
          </p>
          <p className="text-sm text-zinc-500 mb-10 max-w-lg mx-auto">
            All from one chat. Your own on-chain AI agent — its own wallet, its own
            identity, no seed phrases, no setup. Activated in one message.
          </p>

          <button
            onClick={login}
            disabled={!ready}
            className="w-full sm:w-auto sm:px-10 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 disabled:opacity-50 transition mb-3"
          >
            {ready ? "Get your agent →" : "Loading…"}
          </button>

          <p className="text-xs text-zinc-500">
            Free to start · sponsored onboarding · no SOL required
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
    </>
  );
}
