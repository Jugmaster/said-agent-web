"use client";

import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { useState, useRef, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAgent } from "@/hooks/useAgent";
import { useSendableBalance } from "@/hooks/useSendableBalance";

function shortAddr(a: string | null | undefined): string {
  if (!a) return "—";
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

const NAV_LINK =
  "text-[13.5px] text-[var(--dim)] transition-colors hover:text-[var(--ink)] whitespace-nowrap";

export default function Navbar() {
  const { ready, authenticated, user, login } = usePrivy();
  const agent = useAgent();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Only fetch while the menu is open — no balance call on every page load.
  const bal = useSendableBalance(
    agent.status === "ready" ? agent.walletAddress : null,
    menuOpen,
  );
  // Which login the user is actually signed in with — shown in the dropdown so
  // it's obvious whether they're on Telegram / X / email / wallet.
  const signedIn = user
    ? user.telegram?.username
      ? { platform: "Telegram", handle: `@${user.telegram.username}` }
      : user.twitter?.username
        ? { platform: "X", handle: `@${user.twitter.username}` }
        : user.email?.address
          ? { platform: "Email", handle: user.email.address }
          : user.wallet?.address
            ? { platform: "Wallet", handle: shortAddr(user.wallet.address) }
            : { platform: "Account", handle: user.id }
    : { platform: "", handle: "" };

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    // pointerdown covers touch + mouse; mousedown alone left the menu stuck
    // open on a tap-outside on mobile.
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, [menuOpen]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]/85 backdrop-blur-md"
      // max(0, safe-area): in a PWA (no status bar) this keeps the bar below
      // the notch/Dynamic Island instead of riding up under the speaker.
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <nav className="flex items-center justify-between gap-4 px-[clamp(20px,4vw,48px)] py-[18px]">
        {/* Brand */}
        <Link href="/" className="-my-2 flex items-center gap-2.5 py-2 text-[15px] font-bold tracking-[.02em] text-[var(--ink)]">
          <span className="lswap h-6 w-6">
            <Image className="lb" src="/logo-black.png" alt="" width={24} height={24} priority />
            <Image className="lw" src="/logo-white.png" alt="" width={24} height={24} priority />
          </span>
          <span>SAID Agent</span>
        </Link>

        {/* Public links (hidden on mobile) */}
        <div className="ml-auto hidden items-center gap-[22px] md:flex">
          <Link href="/agents" className={NAV_LINK}>
            Agents
          </Link>
          <Link href="/stats" className={NAV_LINK}>
            Stats
          </Link>
          <Link href="/docs" className={NAV_LINK}>
            Docs
          </Link>
          <a
            href="https://www.saidprotocol.com"
            target="_blank"
            rel="noreferrer"
            className={NAV_LINK}
          >
            Protocol
          </a>
        </div>

        {/* Right cluster: telegram + auth */}
        <div className="flex items-center gap-[22px] md:ml-[22px]">
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            className={`${NAV_LINK} hidden sm:inline`}
          >
            Telegram
          </a>

          {!ready ? (
            <div className="w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--line)] animate-pulse" />
          ) : !authenticated ? (
            <button
              onClick={login}
              className="rounded-full bg-[var(--ink)] px-5 py-3 text-[13px] font-medium text-[var(--bg)] transition-opacity hover:opacity-75 whitespace-nowrap"
            >
              Log in
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="ml-1 flex items-center gap-2 pl-1 pr-3 py-1 border border-[var(--line)] hover:border-[var(--line)] rounded-full text-sm transition"
              >
                <span className="w-6 h-6 rounded-full bg-[rgba(128,128,128,.18)] flex items-center justify-center text-xs font-semibold">
                  {(user?.email?.address?.[0] ?? user?.wallet?.address?.[0] ?? "•").toUpperCase()}
                </span>
                <span className="hidden sm:inline text-[var(--ink)]">
                  {agent.status === "ready"
                    ? agent.agentName ?? shortAddr(agent.walletAddress)
                    : agent.status === "linking"
                      ? "linking…"
                      : agent.status === "error"
                        ? "error"
                        : "—"}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-[var(--card)]/95 backdrop-blur-md border border-[var(--line)] rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[var(--line)]">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-[var(--faint)]">signed in with</span>
                      {signedIn.platform && (
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[rgba(128,128,128,.18)] text-[var(--ink)]">
                          {signedIn.platform}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[var(--ink)] truncate">
                      {signedIn.handle}
                    </div>
                  </div>
                  {agent.status === "ready" && (
                    <div className="px-4 py-3 border-b border-[var(--line)]">
                      <div className="text-xs text-[var(--faint)]">agent wallet</div>
                      <code className="text-xs text-[var(--ink)] font-mono">
                        {shortAddr(agent.walletAddress)}
                      </code>
                      {agent.walletAddress && (
                        <div className="mt-1.5 text-xs">
                          {bal.error ? (
                            <span className="text-[var(--warn)]">balance unavailable</span>
                          ) : bal.loading ? (
                            <span className="text-[var(--faint)]">loading…</span>
                          ) : (
                            <span className="text-[var(--dim)]">
                              {bal.sol.toFixed(4)} SOL
                              <span className="text-[var(--faint)]"> · </span>
                              {bal.usdc.toFixed(2)} USDC
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <Link
                    href="/chat"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-[rgba(128,128,128,.18)] transition"
                  >
                    Chat
                  </Link>
                  <Link
                    href="/send"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-[rgba(128,128,128,.18)] transition"
                  >
                    Send
                  </Link>
                  <Link
                    href="/portfolio"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-[rgba(128,128,128,.18)] transition"
                  >
                    Portfolio
                  </Link>
                  <Link
                    href="/activity"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-[rgba(128,128,128,.18)] transition"
                  >
                    Activity
                  </Link>
                  <button
                    onClick={() => {
                      agent.logout();
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-sm text-[#e06c5a] hover:bg-[rgba(128,128,128,.18)] transition border-t border-[var(--line)]"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
}
