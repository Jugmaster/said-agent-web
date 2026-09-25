"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAgent } from "@/hooks/useAgent";
import { useSendableBalance } from "@/hooks/useSendableBalance";
import { applyTheme, readThemePref, type ThemePref } from "@/components/ThemeToggle";

function shortAddr(a: string | null | undefined): string {
  if (!a) return "—";
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

const LINK =
  "text-[15px] text-zinc-400 whitespace-nowrap transition-all duration-300 group-has-[a:hover]:opacity-35 group-has-[a:hover]:blur-[1px] hover:!opacity-100 hover:!blur-none hover:text-ink";
const CTA =
  "inline-flex items-center rounded-full px-[18px] py-[9px] text-[15px] text-ink shadow-[inset_0_0_0_1px_var(--color-ring)] transition hover:bg-ink hover:text-cream hover:shadow-none whitespace-nowrap";

export default function Navbar() {
  const { ready, authenticated, user, login } = usePrivy();
  const agent = useAgent();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  // Light / dark from the top bar: one tap flips between them (system stays the default until you touch it).
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const pref = readThemePref();
    setDark(pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));
  }, []);
  const flipTheme = () => {
    const next: ThemePref = dark ? "light" : "dark";
    try { localStorage.setItem("atcha:theme", next); } catch {}
    applyTheme(next);
    setDark(next === "dark");
  };
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
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
    if (!menuOpen && !navOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false);
    };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, [menuOpen, navOpen]);

  const NAV: Array<[string, string]> = [
    ["/#funded", "Funded"],
    ["/#how", "How it works"],
    ["/fleet", "Fleet"],
    ["/ledger", "Ledger"],
    ["/agents", "Agents"],
    ["/stats", "Stats"],
    ["/docs", "Docs"],
  ];

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
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className={LINK}>{label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={flipTheme}
            aria-label={dark ? "Switch to light" : "Switch to dark"}
            title={dark ? "Light" : "Dark"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink shadow-[inset_0_0_0_1px_var(--color-ring)] transition hover:shadow-[inset_0_0_0_1px_var(--color-ink)]"
          >
            {dark === null ? null : dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            )}
          </button>
          {/* Phone: the same links behind one button. */}
          <div className="relative md:hidden" ref={navRef}>
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_var(--color-ring)] transition hover:shadow-[inset_0_0_0_1px_var(--color-ink)]"
            >
              <span aria-hidden className="flex flex-col gap-[4px]">
                <span className={`block h-[1.5px] w-4 bg-ink transition ${navOpen ? "translate-y-[5.5px] rotate-45" : ""}`} />
                <span className={`block h-[1.5px] w-4 bg-ink transition ${navOpen ? "opacity-0" : ""}`} />
                <span className={`block h-[1.5px] w-4 bg-ink transition ${navOpen ? "-translate-y-[5.5px] -rotate-45" : ""}`} />
              </span>
            </button>
            {navOpen && (
              <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_18px_50px_-8px_rgba(23,22,19,0.12)]">
                {NAV.map(([href, label]) => (
                  <Link key={href} href={href} onClick={() => setNavOpen(false)} className="block px-4 py-3 text-sm transition hover:bg-card">
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm shadow-[inset_0_0_0_1px_var(--color-ring)] transition hover:shadow-[inset_0_0_0_1px_var(--color-ink)]"
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
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_18px_50px_-8px_rgba(23,22,19,0.12)]">
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
                    ["/settings", "Settings"],
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
