"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "./Navbar";
import FundModal from "./FundModal";
import CommandPalette, { type PaletteAction } from "./CommandPalette";
import { useAgent } from "@/hooks/useAgent";
import { useSendableBalance } from "@/hooks/useSendableBalance";
import { requestRefresh, onRefresh } from "@/lib/refresh";
import { getPortfolio } from "@/lib/api";
import {
  ActivityIcon,
  ChatIcon,
  HomeIcon,
  LogoutIcon,
  PhoneIcon,
  PlusIcon,
  SendIcon,
  WalletIcon,
} from "./NavIcons";

const NAV = [
  { href: "/home", label: "Home", icon: HomeIcon, key: "h" },
  { href: "/chat", label: "Chat", icon: ChatIcon, key: "c" },
  { href: "/send", label: "Send", icon: SendIcon, key: "s" },
  { href: "/portfolio", label: "Wallet", icon: WalletIcon, key: "w" },
  { href: "/calls", label: "Comms", icon: PhoneIcon, key: "l" },
  { href: "/activity", label: "Activity", icon: ActivityIcon, key: "a" },
] as const;

function isEditable(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * Shell for the signed-in app surfaces (chat / send / portfolio / activity /
 * fund), mounted once via the (app) route-group layout so it survives client
 * navigations.
 *
 * Signed in there is no pill at any size: mobile gets the BottomTabBar plus
 * each surface's own header, and from md up a fixed left
 * sidebar takes over — icon rail at md, full sidebar with labels, live
 * balance, and account footer at lg. Signed-out visitors get the plain
 * Navbar at every size so the login flow is unchanged.
 *
 * Desktop keyboard: ⌘K / Ctrl+K command palette, "g then c/s/w/a" navigation.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const agent = useAgent();
  const pathname = usePathname();
  const router = useRouter();

  const authed = ready && authenticated;
  const walletAddress = agent.status === "ready" ? agent.walletAddress : null;
  const agentName = agent.status === "ready" ? agent.agentName : null;
  const platformId = agent.status === "ready" ? agent.platformId : null;

  const bal = useSendableBalance(walletAddress, authed);
  const [funding, setFunding] = useState(false);
  // Total portfolio value (all holdings, USD) for the sidebar headline —
  // refreshed on the same bus that refreshes balances after money moves.
  const [totalUsd, setTotalUsd] = useState<number | null>(null);
  useEffect(() => {
    if (!authed || !walletAddress) return;
    let cancelled = false;
    const load = () =>
      void getPortfolio(walletAddress)
        .then((p) => {
          if (!cancelled) setTotalUsd(p.totalUsdValue);
        })
        .catch(() => {});
    load();
    const off = onRefresh(load);
    return () => {
      cancelled = true;
      off();
    };
  }, [authed, walletAddress]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Timestamp of the last bare "g" press for two-step nav chords.
  const gAt = useRef(0);

  useEffect(() => {
    if (!authed) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isEditable(e.target)) return;
      if (e.key === "g") {
        gAt.current = Date.now();
        return;
      }
      if (gAt.current && Date.now() - gAt.current < 1500) {
        const dest = NAV.find((n) => n.key === e.key)?.href;
        gAt.current = 0;
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authed, router]);

  const paletteActions = useMemo<PaletteAction[]>(() => {
    const nav: PaletteAction[] = NAV.map((n) => ({
      id: n.href,
      label: `Go to ${n.label}`,
      hint: `g ${n.key}`,
      icon: <n.icon className="w-4 h-4" />,
      run: () => router.push(n.href),
    }));
    if (walletAddress) {
      nav.push({
        id: "fund",
        label: "Add funds",
        icon: <PlusIcon className="w-4 h-4" />,
        run: () => setFunding(true),
      });
    }
    if (platformId) {
      nav.push({
        id: "profile",
        label: "View public profile",
        run: () => router.push(`/agents/${encodeURIComponent(platformId)}`),
      });
    }
    nav.push({
      id: "docs",
      label: "Open docs",
      run: () => router.push("/docs"),
    });
    return nav;
  }, [router, walletAddress, platformId]);

  // Palette free-text goes to the agent. Already on /chat → hand it to the
  // mounted chat screen via an event; elsewhere → stash the prompt in
  // sessionStorage and navigate. Never via URL: a ?prompt= that auto-executes
  // would let any external link run commands against a logged-in wallet.
  function askAgent(query: string): void {
    if (pathname === "/chat") {
      window.dispatchEvent(new CustomEvent("said:ask", { detail: query }));
    } else {
      try {
        sessionStorage.setItem("said-agent:pending-prompt", query);
      } catch {
        // storage unavailable — fall through, prompt is dropped
      }
      router.push("/chat");
    }
  }

  return (
    <>
      {/* Signed in, the pill is dropped at EVERY size: the sidebar owns nav on
          desktop, the tab bar + agent header own it on mobile, and the pill's
          mobile dropdown only duplicated the tabs while eating the top ~96px
          of the smallest screens. Signed-out visitors keep it so the login
          flow is unchanged. */}
      {!authed && <Navbar />}

      {authed && (
        <aside className="sa hidden md:flex fixed inset-y-0 left-0 z-40 w-16 lg:w-[264px] flex-col border-r border-[var(--line)] bg-[var(--card)]">
          <Link
            href="/"
            className="flex h-16 items-center justify-center lg:justify-start gap-2.5 px-3 lg:px-5 shrink-0"
          >
            {/* Intrinsic 354×370 — size via CSS with w-auto so the non-square
                logo isn't distorted (and Next doesn't warn about it). */}
            <Image
              src="/logo-dark.png"
              alt="SAID"
              width={354}
              height={370}
              className="h-[22px] w-auto"
              priority
            />
            <span className="hidden lg:inline text-[15px] font-bold">
              SAID Agent
            </span>
          </Link>

          <nav className="flex flex-col gap-1 px-2 lg:px-3 mt-2">
            {NAV.map(({ href, label, icon: Icon, key }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  title={`${label} — press g then ${key}`}
                  className={`group flex items-center justify-center lg:justify-start gap-3 rounded-full px-2.5 lg:px-[13px] py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-[rgba(128,128,128,.18)] text-[var(--ink)]"
                      : "text-[var(--dim)] hover:text-[var(--ink)] hover:bg-[rgba(128,128,128,.12)]"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="hidden lg:inline flex-1">{label}</span>
                  <span className="hidden lg:inline font-mono text-[10px] uppercase tracking-[.14em] text-[var(--faint)] opacity-0 group-hover:opacity-100 transition-opacity">
                    g&thinsp;{key}
                  </span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden lg:flex items-center gap-3 rounded-full px-[13px] py-2.5 text-sm text-[var(--faint)] hover:text-[var(--ink)] hover:bg-[rgba(128,128,128,.12)] transition"
            >
              <span className="w-5 h-5 flex items-center justify-center text-base leading-none">
                ⌘
              </span>
              <span className="flex-1 text-left">Command</span>
              <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[var(--faint)]">
                ⌘k
              </span>
            </button>
          </nav>

          <div className="flex-1" />

          {/* Live balance + top-up. Full card at lg; a bare "+" on the icon rail. */}
          {walletAddress && (
            <>
              <div className="hidden lg:block mx-3 mb-3 rounded-[20px] border border-[var(--line)] bg-[var(--bg)] p-4">
                <div className="font-mono text-[10.5px] uppercase tracking-[.16em] text-[var(--faint)]">Balance</div>
                {bal.error ? (
                  <div className="text-xs text-[var(--warn)]">unavailable</div>
                ) : bal.loading && totalUsd == null ? (
                  <div className="text-xs text-[var(--faint)]">loading…</div>
                ) : (
                  <>
                    {/* Headline = total portfolio value in USD (all holdings). */}
                    <div className="mt-1.5 text-[22px] font-medium tracking-[-.02em] tabular-nums text-[var(--ink)]">
                      {totalUsd != null
                        ? `$${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "$—"}
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-[var(--faint)]">
                      <div className="flex items-baseline justify-between">
                        <span>{bal.sol.toFixed(4)}</span>
                        <span>SOL</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span>{bal.usdc.toFixed(2)}</span>
                        <span>USDC</span>
                      </div>
                    </div>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setFunding(true)}
                  className="mt-3 w-full rounded-full bg-[var(--ink)] text-[var(--bg)] text-[12.5px] font-medium py-2.5 hover:opacity-85 transition"
                >
                  Add funds
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFunding(true)}
                title="Add funds"
                className="lg:hidden mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-[var(--dim)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="border-t border-[var(--line)] px-2 lg:px-4 py-3.5">
            <div className="flex items-center justify-center lg:justify-start gap-2.5 px-0.5 lg:px-1">
              <span
                title={agentName ?? undefined}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(128,128,128,.22)] text-xs font-semibold"
              >
                {(agentName?.[0] ?? "•").toUpperCase()}
              </span>
              <div className="hidden lg:block min-w-0 flex-1">
                <div className="truncate text-[13px] text-[var(--ink)]">
                  {agentName ?? "Your agent"}
                </div>
                {platformId && (
                  <Link
                    href={`/agents/${encodeURIComponent(platformId)}`}
                    className="text-[11px] text-[var(--faint)] hover:text-[var(--dim)] transition"
                  >
                    Public profile →
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={agent.logout}
                title="Log out"
                className="hidden lg:flex h-[30px] w-[30px] items-center justify-center rounded-[9px] text-[var(--faint)] hover:text-[#e06c5a] hover:bg-[rgba(128,128,128,.14)] transition"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={agent.logout}
              title="Log out"
              className="lg:hidden mx-auto mt-2 flex h-[30px] w-[30px] items-center justify-center rounded-[9px] text-[var(--faint)] hover:text-[#e06c5a] hover:bg-[rgba(128,128,128,.14)] transition"
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Signed-in mobile: pages scroll INSIDE this container, never the body.
          iOS Safari and Telegram's in-app browser detach position:fixed
          elements while the body scrolls, so any page long enough to
          body-scroll dragged the bottom tab bar with it (first seen on
          Comms). Locking the body here fixes it for every surface at once.
          Keyed by pathname so a scrolled page doesn't hand its scroll
          position to the next route. Desktop keeps body scroll (md:h-auto);
          signed-out keeps the plain flow so login/marketing are untouched. */}
      <div
        key={pathname}
        className={`sa flex-1 flex flex-col min-w-0 ${
          authed
            ? "h-dvh overflow-y-auto overscroll-contain md:h-auto md:overflow-visible md:pl-16 lg:pl-[264px]"
            : ""
        }`}
      >
        {children}
      </div>

      {authed && (
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          actions={paletteActions}
          onAsk={askAgent}
        />
      )}

      {funding && walletAddress && (
        <FundModal
          walletAddress={walletAddress}
          onClose={() => setFunding(false)}
          onFunded={requestRefresh}
        />
      )}
    </>
  );
}
