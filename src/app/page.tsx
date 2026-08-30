"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import HeroDots from "@/components/HeroDots";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Landing page — one screen, one sentence, one button.
 *
 * The design drops the old below-fold marketing and the secondary "Open web
 * app" button: Telegram is the single path in, and web login lives in the nav
 * pill. Two things the mock has no state for are kept, because losing them
 * would be a functional regression rather than a simplification:
 *
 *   - Signed-in visitors get "Open app" instead of being asked to start over
 *     in Telegram, in both the hero and the nav.
 *   - The login-initiated redirect: completing the Privy modal flips
 *     `authenticated`, and without this the user is left staring at the
 *     landing page they just logged in from. It only fires for a login
 *     started here, so an already-authed visitor can still browse.
 */
export default function HomePage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const [loginInitiated, setLoginInitiated] = useState(false);

  useEffect(() => {
    if (ready && authenticated && loginInitiated) router.replace("/home");
  }, [ready, authenticated, loginInitiated, router]);

  const authed = ready && authenticated;

  return (
    <div className="flex min-h-dvh flex-col">
      <HeroDots />

      <nav className="relative z-[1] flex items-center justify-between px-[clamp(20px,4vw,48px)] py-[22px]">
        <Link href="/" className="relative flex items-center gap-2.5 text-[15px] font-bold tracking-[.02em] text-[var(--ink)]">
          <span className="lswap h-6 w-6">
            <Image className="lb" src="/logo-black.png" alt="" width={24} height={24} />
            <Image className="lw" src="/logo-white.png" alt="" width={24} height={24} />
          </span>
          <span>SAID Agent</span>
        </Link>

        <div className="flex items-center gap-3 text-[13.5px] sm:gap-[22px]">
          <Link href="/agents" className="hidden text-[var(--dim)] transition-colors hover:text-[var(--ink)] sm:inline">Agents</Link>
          <Link href="/docs" className="hidden text-[var(--dim)] transition-colors hover:text-[var(--ink)] sm:inline">Docs</Link>
          <a href="https://saidprotocol.com" target="_blank" rel="noreferrer" className="hidden text-[var(--dim)] transition-colors hover:text-[var(--ink)] sm:inline">Protocol</a>
          {authed ? (
            <Link href="/home" className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-[13px] font-medium text-[var(--bg)] transition-opacity hover:opacity-75">
              Open app
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => { setLoginInitiated(true); login(); }}
              disabled={!ready}
              className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-[13px] font-medium text-[var(--bg)] transition-opacity hover:opacity-75 disabled:opacity-50"
            >
              {ready ? "Log in" : "…"}
            </button>
          )}
          <ThemeToggle />
        </div>
      </nav>

      <main className="relative z-[1] flex flex-1 flex-col items-center justify-center px-[clamp(20px,5vw,48px)] text-center">
        <span className="lswap hero-fade h-14 w-14">
          <Image className="lb" src="/logo-black.png" alt="" width={56} height={56} />
          <Image className="lw" src="/logo-white.png" alt="" width={56} height={56} priority />
        </span>

        <h1 className="hero-fade d1 mt-[34px] text-[clamp(30px,4.6vw,58px)] font-medium leading-[1.1] tracking-[-.03em] text-[var(--ink)]">
          Send money. Buy anything.
          <br />
          Swap tokens. From one chat.
        </h1>

        <p className="hero-fade d2 mt-[18px] max-w-[44ch] text-[clamp(15px,1.4vw,17px)] leading-[1.6] text-[var(--dim)]">
          Your own AI agent on Solana, living in Telegram. No seed phrases, no
          setup, no SOL to start.
        </p>

        {authed ? (
          <Link
            href="/home"
            className="hero-fade d3 mt-10 inline-block rounded-full bg-[var(--ink)] px-10 py-[17px] text-[15px] font-medium text-[var(--bg)] transition-opacity hover:opacity-80"
          >
            Open app
          </Link>
        ) : (
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            className="hero-fade d3 mt-10 inline-block rounded-full bg-[var(--ink)] px-10 py-[17px] text-[15px] font-medium text-[var(--bg)] transition-opacity hover:opacity-80"
          >
            Start in Telegram
          </a>
        )}

        <p className="hero-fade d4 mt-5 text-[12px] tracking-[.05em] text-[var(--faint)]">
          Free to start · keys secured by Privy · live on Solana mainnet
        </p>
      </main>

      <footer className="relative z-[1] flex flex-wrap items-center justify-between gap-5 px-[clamp(20px,4vw,48px)] py-[22px] text-[12.5px] text-[var(--faint)]">
        <span>SAID Agent · on Solana</span>
        <span className="flex gap-[22px]">
          <a href="https://x.com/saidagent" target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--ink)]">X</a>
          <a href="https://t.me/saidinfrabot" target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--ink)]">Telegram</a>
          <Link href="/docs" className="transition-colors hover:text-[var(--ink)]">Docs</Link>
          <a href="https://saidprotocol.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--ink)]">Protocol</a>
        </span>
      </footer>
    </div>
  );
}
