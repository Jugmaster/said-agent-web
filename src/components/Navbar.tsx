"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAgent } from "@/hooks/useAgent";
import { useSendableBalance } from "@/hooks/useSendableBalance";

function shortAddr(a: string | null | undefined): string {
  if (!a) return "—";
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

const LINK =
  "text-[15px] text-zinc-400 whitespace-nowrap transition-all duration-300 group-has-[a:hover]:opacity-35 group-has-[a:hover]:blur-[1px] hover:!opacity-100 hover:!blur-none hover:text-ink";
const CTA =
  "inline-flex items-center rounded-full px-[18px] py-[9px] text-[15px] text-ink shadow-[inset_0_0_0_1px_#D5D1C5] transition hover:bg-ink hover:text-cream hover:shadow-none whitespace-nowrap";

export default function Navbar() {
  const { ready, authenticated, user, login } = usePrivy();
  const agent = useAgent();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bal = useSendableBalance(agent.status === "ready" ? agent.walletAddress : null, menuOpen);
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, [menuOpen]);

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 bg-cream/85 backdrop-blur-md"
      data-nav
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <nav className="mx-auto flex h-[68px] max-w-[1140px] items-center justify-between gap-4 px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden className="inline-flex h-[24px] w-[24px] items-center justify-center rounded-[8px] bg-coral text-[14px] font-semibold leading-none text-cream">@</span>
          <span className="text-[19px] font-medium tracking-[-0.02em]">atcha</span>
        </Link>

        <div className="group hidden items-center gap-7 md:flex">
          <Link href="/#funded" className={LINK}>Funded</Link>
          <Link href="/#how" className={LINK}>How it works</Link>
          <Link href="/fleet" className={LINK}>Fleet</Link>
          <Link href="/agents" className={LINK}>Agents</Link>
          <Link href="/stats" className={LINK}>Stats</Link>
          <Link href="/docs" className={LINK}>Docs</Link>
        </div>

        <div className="flex items-center gap-3">
          {!ready ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-card" />
          ) : !authenticated ? (
            <button type="button" onClick={login} className={CTA}>
              Log in
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm shadow-[inset_0_0_0_1px_#D5D1C5] transition hover:shadow-[inset_0_0_0_1px_#171613]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral text-xs font-semibold text-cream">
                  {(agent.status === "ready" ? agent.agentName?.[0] : null) ?? user?.email?.address?.[0] ?? "•"}
                </span>
                <span className="hidden text-zinc-300 sm:inline">
                  {agent.status === "ready"
                    ? agent.agentName ?? shortAddr(agent.walletAddress)
                    : agent.status === "linking"
                      ? "opening…"
                      : agent.status === "error"
                        ? "error"
                        : "—"}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-line bg-[#FFFFFF] shadow-[0_18px_50px_-8px_rgba(23,22,19,0.12)]">
                  <div className="border-b border-line px-4 py-3">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-xs text-grey">signed in with</span>
                      {signedIn.platform && (
                        <span className="rounded bg-card px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">{signedIn.platform}</span>
                      )}
                    </div>
                    <div className="truncate text-sm text-ink">{signedIn.handle}</div>
                  </div>
                  {agent.status === "ready" && (
                    <div className="border-b border-line px-4 py-3">
                      <div className="text-xs text-grey">wallet</div>
                      <code className="font-mono text-xs text-zinc-300">{shortAddr(agent.walletAddress)}</code>
                      {agent.walletAddress && (
                        <div className="mt-1.5 text-xs">
                          {bal.error ? (
                            <span className="text-amber-400">balance unavailable</span>
                          ) : bal.loading ? (
                            <span className="text-grey">loading…</span>
                          ) : (
                            <span className="text-zinc-400">
                              {bal.sol.toFixed(4)} SOL<span className="text-grey"> · </span>{bal.usdc.toFixed(2)} USDC
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {[
                    ["/home", "Open your Atcha"],
                    ["/chat", "Chat"],
                    ["/send", "Send"],
                    ["/portfolio", "Wallet"],
                    ["/activity", "Activity"],
                  ].map(([href, label]) => (
                    <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm transition hover:bg-card">
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      agent.logout();
                      setMenuOpen(false);
                    }}
                    className="block w-full border-t border-line px-4 py-3 text-left text-sm text-coral-text transition hover:bg-card"
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
