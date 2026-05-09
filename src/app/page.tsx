"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();

  // Already logged in → straight to chat. No landing page in the way.
  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/chat");
    }
  }, [ready, authenticated, router]);

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100dvh-65px)] px-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="inline-block px-4 py-2 mb-8 text-sm text-zinc-400 border border-zinc-700 rounded-full">
            Now live on Solana Mainnet
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight">
            Your AI agent
            <br />
            on Solana.
          </h1>
          <p className="text-base text-zinc-400 mb-8">
            Personal on-chain agent — your own wallet, your own identity, cross-chain
            native. No seed phrases, no setup.
          </p>

          <button
            onClick={login}
            disabled={!ready}
            className="w-full px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 disabled:opacity-50 transition mb-3"
          >
            {ready ? "Log in / Sign up →" : "Loading…"}
          </button>

          <p className="text-xs text-zinc-500">
            Same login as{" "}
            <a
              href="https://www.saidprotocol.com"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-300 hover:text-white underline underline-offset-2"
            >
              saidprotocol.com
            </a>
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
