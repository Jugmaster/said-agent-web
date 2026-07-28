import AppShell from "@/components/AppShell";

/**
 * Shared layout for the signed-in app surfaces (/chat, /send, /portfolio,
 * /activity, /fund). Mounts the AppShell once so the desktop sidebar, balance
 * fetch, and keyboard shortcuts persist across client navigations instead of
 * remounting per page. Route group — no URL segment.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
