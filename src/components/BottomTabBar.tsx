"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { ChatIcon, SendIcon, WalletIcon, SettingsIcon } from "./NavIcons";

/** App surfaces where the mobile tab bar belongs (signed-in only). */
// NOTE: /calls is here so the tab bar RENDERS there (a deep link to Comms
// otherwise strands the user with no navigation), even though Comms has no
// tab of its own — six tabs would drop each below a comfortable width.
const APP_ROUTES = ["/home", "/chat", "/send", "/portfolio", "/activity", "/fund", "/calls", "/settings"];

// Agent-first: on a phone the product IS the agent, so Agent is home and the
// other two are the places you go to look at something. Everything else (send,
// comms, funding) is reached by asking, or from the rail above the composer.
// Five equal tabs read as five equal choices, which is why the old shape had
// no flow.
const TABS: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/chat", label: "Agent", icon: ChatIcon },
  // Send is the headline feature and the growth loop, so it earns a permanent
  // home rather than living behind a chip. Activity is NOT a tab: Wallet
  // already renders recent activity with a "View all" link, so a tab would
  // spend a quarter of the bar on a duplicate.
  { href: "/send", label: "Send", icon: SendIcon },
  { href: "/portfolio", label: "Wallet", icon: WalletIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

/**
 * Native-app-style bottom navigation for mobile. Replaces top-pill navigation
 * on the signed-in app surfaces so the core actions are thumb-reachable.
 * md:hidden — desktop keeps the top navbar. Hidden on public/marketing pages
 * and when signed out.
 */
export default function BottomTabBar() {
  const pathname = usePathname();
  const { ready, authenticated } = usePrivy();

  const onAppRoute = APP_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
  if (!ready || !authenticated || !onAppRoute) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-14 text-[11px] font-medium transition ${
              active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
