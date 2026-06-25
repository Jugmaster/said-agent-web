"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

/** App surfaces where the mobile tab bar belongs (signed-in only). */
const APP_ROUTES = ["/chat", "/send", "/portfolio", "/activity", "/fund"];

const TABS: { href: string; label: string; icon: () => ReactNode }[] = [
  { href: "/chat", label: "Chat", icon: ChatIcon },
  { href: "/send", label: "Send", icon: SendIcon },
  { href: "/portfolio", label: "Wallet", icon: WalletIcon },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
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
      {TABS.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-14 text-[11px] font-medium transition ${
              active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {icon()}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

const ICON =
  "w-[22px] h-[22px]" as const;

function ChatIcon() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
