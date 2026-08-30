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
    <div className="landing-page flex min-h-dvh flex-col">
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
        <span className="flex items-center gap-[22px]">
          <a
            href="https://x.com/saidagent"
            target="_blank"
            rel="noreferrer"
            aria-label="SAID Agent on X"
            title="X"
            className="transition-colors hover:text-[var(--ink)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            aria-label="SAID Agent on Telegram"
            title="Telegram"
            className="transition-colors hover:text-[var(--ink)]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21.94 4.6 18.9 19.02c-.23 1.01-.83 1.26-1.68.79l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73 8.6-7.77c.37-.33-.08-.52-.58-.19L7.13 13.2l-4.58-1.43c-1-.31-1.02-1 .21-1.48l17.9-6.9c.83-.3 1.56.2 1.28 1.21z" />
            </svg>
          </a>
          <Link
            href="/docs"
            aria-label="Documentation"
            title="Docs"
            className="transition-colors hover:text-[var(--ink)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2.5H7a1.5 1.5 0 0 0-1.5 1.5v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V7z" />
              <path d="M14 2.5V7h4.5" />
              <line x1="8.8" y1="12.2" x2="15.2" y2="12.2" />
              <line x1="8.8" y1="16" x2="13" y2="16" />
            </svg>
          </Link>
        </span>
      </footer>
    </div>
  );
}
