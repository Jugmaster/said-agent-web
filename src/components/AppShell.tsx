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
import {
  ActivityIcon,
  ChatIcon,
  LogoutIcon,
  PlusIcon,
  SendIcon,
  WalletIcon,
} from "./NavIcons";

const NAV = [
  { href: "/chat", label: "Chat", icon: ChatIcon, key: "c" },
  { href: "/send", label: "Send", icon: SendIcon, key: "s" },
  { href: "/portfolio", label: "Wallet", icon: WalletIcon, key: "w" },
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
 * Mobile (<md) keeps the existing chrome untouched: floating pill Navbar on
 * top, BottomTabBar below. From md up the pill disappears and a fixed left
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
  // mounted chat screen via an event; elsewhere → navigate with the prompt.
  function askAgent(query: string): void {
    if (pathname === "/chat") {
      window.dispatchEvent(new CustomEvent("said:ask", { detail: query }));
    } else {
      router.push(`/chat?prompt=${encodeURIComponent(query)}`);
    }
  }

  return (
    <>
      {/* Mobile keeps the pill navbar; desktop drops it once the sidebar owns nav. */}
      <div className={authed ? "md:hidden" : ""}>
        <Navbar />
      </div>

      {authed && (
        <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-16 lg:w-64 flex-col border-r border-zinc-800/60 bg-zinc-950/70 backdrop-blur-md">
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
            <span className="hidden lg:inline text-sm font-bold tracking-wide">
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
                  className={`group flex items-center justify-center lg:justify-start gap-3 rounded-lg px-2.5 lg:px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-zinc-800/70 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="hidden lg:inline flex-1">{label}</span>
                  <span className="hidden lg:inline text-[10px] uppercase tracking-widest text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    g&thinsp;{key}
                  </span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden lg:flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-500 hover:text-white hover:bg-zinc-800/40 transition"
            >
              <span className="w-5 h-5 flex items-center justify-center text-base leading-none">
                ⌘
              </span>
              <span className="flex-1 text-left">Command</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-700">
                ⌘k
              </span>
            </button>
          </nav>

          <div className="flex-1" />

          {/* Live balance + top-up. Full card at lg; a bare "+" on the icon rail. */}
          {walletAddress && (
            <>
              <div className="hidden lg:block mx-3 mb-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="text-[11px] text-zinc-500 mb-1.5">Balance</div>
                {bal.error ? (
                  <div className="text-xs text-yellow-600">unavailable</div>
                ) : bal.loading ? (
                  <div className="text-xs text-zinc-600">loading…</div>
                ) : (
                  <div className="space-y-0.5 text-sm">
                    <div className="flex items-baseline justify-between">
                      <span className="text-zinc-200 font-medium">
                        {bal.sol.toFixed(4)}
                      </span>
                      <span className="text-xs text-zinc-500">SOL</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-zinc-200 font-medium">
                        {bal.usdc.toFixed(2)}
                      </span>
                      <span className="text-xs text-zinc-500">USDC</span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setFunding(true)}
                  className="mt-2.5 w-full rounded-lg bg-white text-black text-xs font-semibold py-2 hover:bg-zinc-200 transition"
                >
                  Add funds
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFunding(true)}
                title="Add funds"
                className="lg:hidden mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="border-t border-zinc-800/60 px-2 lg:px-3 py-3">
            <div className="flex items-center justify-center lg:justify-start gap-2.5 px-0.5 lg:px-1">
              <span
                title={agentName ?? undefined}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold"
              >
                {(agentName?.[0] ?? "•").toUpperCase()}
              </span>
              <div className="hidden lg:block min-w-0 flex-1">
                <div className="truncate text-sm text-zinc-200">
                  {agentName ?? "Your agent"}
                </div>
                {platformId && (
                  <Link
                    href={`/agents/${encodeURIComponent(platformId)}`}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                  >
                    Public profile →
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={agent.logout}
                title="Log out"
                className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 transition"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={agent.logout}
              title="Log out"
              className="lg:hidden mx-auto mt-2 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 transition"
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      <div
        className={`flex-1 flex flex-col min-w-0 ${
          authed ? "md:pl-16 lg:pl-64" : ""
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
          onFunded={() => bal.refetch()}
        />
      )}
    </>
  );
}
