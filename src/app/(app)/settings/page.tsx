"use client";

import { useState } from "react";
import Link from "next/link";
import ClaimHandle from "@/components/ClaimHandle";
import AppPage from "@/components/AppPage";
import ThemeToggle from "@/components/ThemeToggle";
import { usePrivy } from "@privy-io/react-auth";
import AuthGate from "@/components/AuthGate";
import { useAgent } from "@/hooks/useAgent";
import { truncMiddle } from "@/lib/format";

// Everything the old top-pill dropdown carried (who you are, public profile,
// sign out) plus the account details that had no home on a phone. Reachable
// from the bottom bar, so the top of every screen stays free.

export default function SettingsPage() {
  return <AuthGate>{(platformId) => <Settings platformId={platformId} />}</AuthGate>;
}

function Row({
  label,
  value,
  onClick,
  href,
  danger,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}) {
  const body = (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className={`text-sm ${danger ? "text-red-400" : "text-zinc-200"}`}>{label}</span>
      <span className="flex items-center gap-2 text-sm text-zinc-500">
        {value && <span className="truncate font-mono text-xs">{value}</span>}
        {(href || onClick) && !danger && <span className="text-zinc-600">›</span>}
      </span>
    </div>
  );
  const cls =
    "block w-full text-left border-b border-zinc-800/70 last:border-b-0 active:bg-zinc-800/40 transition";
  if (href) {
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {children}
      </div>
    </section>
  );
}

function Settings({ platformId }: { platformId: string }) {
  const agent = useAgent();
  const { user } = usePrivy();
  const [copied, setCopied] = useState(false);

  const agentName = agent.status === "ready" ? agent.agentName : null;
  const walletAddress = agent.status === "ready" ? agent.walletAddress : null;

  const loginLabel =
    (user?.twitter?.username && `@${user.twitter.username} on X`) ??
    (user?.telegram?.username && `@${user.telegram.username} on Telegram`) ??
    user?.email?.address ??
    (user?.google as { email?: string } | undefined)?.email ??
    "Connected";

  async function copyAddress() {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the address is visible above */
    }
  }

  return (
    <AppPage title="Settings" sub="Your Atcha, your name, how it looks, and your account." narrow>

      <Section title="Your Atcha">
        <Row label="Agent" value={agentName ?? "—"} />
        <div className="px-4 py-3"><div className="mb-1 text-xs text-grey">Your @name</div><ClaimHandle platformId={platformId} compact /></div>
        <Row
          label="Wallet"
          value={walletAddress ? truncMiddle(walletAddress, 4, 4) : "—"}
          onClick={copyAddress}
        />
        {copied && (
          <div className="px-4 pb-2 text-xs text-emerald-400">Address copied</div>
        )}
        <Row label="Public profile" href={`/agents/${encodeURIComponent(platformId)}`} />
        <Row label="Link an agent you already run" href="/settings/link-agent" />
      </Section>

      <Section title="Appearance">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-zinc-200">Theme</span>
          <ThemeToggle />
        </div>
      </Section>

      <Section title="Account">
        <Row label="Signed in as" value={loginLabel} />
        {/* Alerts reach you by Telegram push and, if the agent has an address,
            by email. Setting it is a sentence to the agent today, so link to
            the composer rather than ship a half-wired form. */}
        <Row
          label="Email me price alerts"
          href="/chat?prompt=remember%20alert-email%20%3D%20your%40email.com"
        />
        <Row label="Calls & email history" href="/calls" />
      </Section>

      <Section title="Session">
        <Row label="Sign out" onClick={agent.logout} danger />
      </Section>

      <p className="px-1 pb-2 text-center text-xs text-zinc-600">
        Atcha, by SAID · your keys are secured by Privy
      </p>
    </AppPage>
  );
}
