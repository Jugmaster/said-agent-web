"use client";

import { APP_ROUTES } from "./BottomTabBar";

/**
 * Install nudge — a small, dismissable chip at the bottom of the viewport
 * that surfaces "Install to home screen" to users who haven't installed yet.
 *
 * Platform behavior:
 *   - Standalone (already installed)            → hidden
 *   - Android Chrome / Edge w/ beforeinstallprompt → "Install" button that
 *     calls prompt() directly (the real OS install dialog)
 *   - iOS Safari (no beforeinstallprompt API)   → expand to "Tap Share → Add
 *     to Home Screen" because iOS gives us no programmatic path
 *   - Everywhere else                            → hidden (don't nag)
 *
 * Dismissal persists in localStorage so we don't pester repeat visitors.
 * Renders nothing until 3s after mount so it doesn't fight first-paint LCP.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const DISMISS_KEY = "said-agent.install-nudge.dismissed-at";
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

type Platform = "android" | "ios" | "other";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // Android / desktop PWA
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari
  if ((navigator as unknown as { standalone?: boolean }).standalone) return true;
  return false;
}

function wasDismissedRecently(): boolean {
  if (typeof localStorage === "undefined") return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number.parseInt(raw, 10);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < DISMISS_TTL_MS;
}

export default function InstallNudge() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;
    const p = detectPlatform();
    if (p === "other") return;
    setPlatform(p);

    // Capture Android Chrome's beforeinstallprompt for direct install.
    function onBeforePrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforePrompt);

    // iOS has no programmatic install — surface the chip after a delay
    // regardless. 3s avoids first-paint jank.
    const t = p === "ios" ? setTimeout(() => setVisible(true), 3000) : null;

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforePrompt);
      if (t) clearTimeout(t);
    };
  }, []);

  function dismiss(): void {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
    setVisible(false);
  }

  async function install(): Promise<void> {
    if (!deferred) return;
    await deferred.prompt();
    const result = await deferred.userChoice;
    if (result.outcome === "accepted") {
      // User accepted; native dialog handles install. Stop showing the chip.
      setVisible(false);
    }
    setDeferred(null);
  }

  const pathname = usePathname();
  // Don't nag inside the app surfaces — it overlaps the chat composer / tab bar.
  // Never nag on the claim screen: it is the first thing a new user sees.
  const onInvite = pathname.startsWith("/invite");
  // Same list the tab bar uses. A private copy drifted once already and the
  // nudge ended up rendering underneath the bar on a newly added surface.
  const onAppRoute = APP_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
  if (!visible || onAppRoute || onInvite) return null;

  return (
    <div
      role="dialog"
      aria-label="Install SAID Agent to your home screen"
      style={{
        bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
      }}
      className="fixed left-1/2 -translate-x-1/2 z-50 w-[min(420px,calc(100vw-2rem))] px-4 py-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] backdrop-blur-md shadow-xl"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--ink)] flex-shrink-0 overflow-hidden">
          {/* Reuse the manifest icon — already in /public */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)] truncate">
            Install SAID Agent
          </p>
          <p className="text-xs text-[var(--dim)] truncate">
            {platform === "ios"
              ? "Add to Home Screen for the full app"
              : "One tap — fits on your home screen"}
          </p>
        </div>
        {platform === "android" && deferred ? (
          <button
            onClick={() => void install()}
            className="px-3 py-1.5 bg-[var(--ink)] text-[var(--bg)] text-xs font-semibold rounded-full hover:opacity-85 transition whitespace-nowrap"
          >
            Install
          </button>
        ) : platform === "ios" ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="px-3 py-1.5 border border-[var(--line)] text-[var(--ink)] text-xs font-semibold rounded-full hover:border-[var(--ink)] transition whitespace-nowrap"
          >
            {expanded ? "Got it" : "How"}
          </button>
        ) : null}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-[var(--faint)] hover:text-[var(--ink)] text-lg leading-none px-1"
        >
          ×
        </button>
      </div>
      {expanded && platform === "ios" && (
        <div className="mt-3 pt-3 border-t border-[var(--line)] text-xs text-[var(--dim)] space-y-1.5">
          <p>
            1. Tap the <span className="text-[var(--ink)]">Share</span> icon (square
            with up arrow) at the bottom of Safari.
          </p>
          <p>
            2. Scroll down and tap{" "}
            <span className="text-[var(--ink)]">Add to Home Screen</span>.
          </p>
          <p>3. Tap Add — done. SAID Agent will open like a native app.</p>
        </div>
      )}
    </div>
  );
}
