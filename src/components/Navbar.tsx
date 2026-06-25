"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAgent } from "@/hooks/useAgent";
import { useSendableBalance } from "@/hooks/useSendableBalance";

function shortAddr(a: string | null | undefined): string {
  if (!a) return "—";
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

const NAV_LINK =
  "px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-800/50 whitespace-nowrap";

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
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4"
      // max(1rem, safe-area): in a PWA (no status bar) this drops the pill
      // below the notch/Dynamic Island instead of riding up under the speaker.
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
    >
      <nav
        className="
          flex items-center gap-1 rounded-full
          border border-zinc-800/60
          transition-all duration-500 ease-in-out
          px-3 py-2 bg-zinc-950/50 backdrop-blur-md
          max-w-full
        "
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 px-2">
          <Image
            src="/logo-dark.png"
            alt="SAID"
            width={20}
            height={20}
            priority
          />
          <span className="text-sm font-bold tracking-wide">SAID Agent</span>
        </Link>

        {/* Public links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/launches" className={NAV_LINK}>
            Launches
          </Link>
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
        <div className="flex items-center gap-1 ml-1">
          <a
            href="https://t.me/saidinfrabot"
            target="_blank"
            rel="noreferrer"
            className={`${NAV_LINK} hidden sm:inline-flex`}
          >
            Telegram
          </a>

          {!ready ? (
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800/60 animate-pulse" />
          ) : !authenticated ? (
            <button
              onClick={login}
              className="ml-1 px-4 py-1.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-zinc-200 transition whitespace-nowrap"
            >
              Log in
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="ml-1 flex items-center gap-2 pl-1 pr-3 py-1 border border-zinc-800/60 hover:border-zinc-700 rounded-full text-sm transition"
              >
                <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold">
                  {(user?.email?.address?.[0] ?? user?.wallet?.address?.[0] ?? "•").toUpperCase()}
                </span>
                <span className="hidden sm:inline text-zinc-300">
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
                <div className="absolute right-0 top-12 w-64 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-zinc-500">signed in with</span>
                      {signedIn.platform && (
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {signedIn.platform}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-200 truncate">
                      {signedIn.handle}
                    </div>
                  </div>
                  {agent.status === "ready" && (
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <div className="text-xs text-zinc-500">agent wallet</div>
                      <code className="text-xs text-zinc-300 font-mono">
                        {shortAddr(agent.walletAddress)}
                      </code>
                      {agent.walletAddress && (
                        <div className="mt-1.5 text-xs">
                          {bal.error ? (
                            <span className="text-yellow-600">balance unavailable</span>
                          ) : bal.loading ? (
                            <span className="text-zinc-600">loading…</span>
                          ) : (
                            <span className="text-zinc-400">
                              {bal.sol.toFixed(4)} SOL
                              <span className="text-zinc-600"> · </span>
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
                    className="block px-4 py-3 text-sm hover:bg-zinc-800 transition"
                  >
                    Chat
                  </Link>
                  <Link
                    href="/send"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-zinc-800 transition"
                  >
                    Send
                  </Link>
                  <Link
                    href="/portfolio"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-zinc-800 transition"
                  >
                    Portfolio
                  </Link>
                  <Link
                    href="/activity"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-zinc-800 transition"
                  >
                    Activity
                  </Link>
                  <button
                    onClick={() => {
                      agent.logout();
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition border-t border-zinc-800"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
