import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { getInvite, type InviteResponse } from "@/lib/api";
import InviteWebClaim from "./InviteWebClaim";

interface PageProps {
  params: Promise<{ token: string }>;
}

// React cache(): generateMetadata + the page body both need the invite —
// dedupe to ONE butler call per request. "unavailable" = transport/5xx (the
// invite may well exist; never render not-found for it), null = real 404.
const fetchInvite = cache(
  async (token: string): Promise<InviteResponse | null | "unavailable"> => {
    try {
      return await getInvite(token, { cache: "no-store" });
    } catch {
      return "unavailable";
    }
  },
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const invite = await fetchInvite(token);
  if (invite === "unavailable") {
    return {
      title: "You've been sent crypto · SAID Agent",
      description: "Open the link to claim — sign in with the account it was sent to.",
    };
  }
  if (!invite) {
    return {
      title: "Invite not found · SAID Agent",
      description: "This invite link doesn't exist or has expired.",
    };
  }
  const senderName = invite.sender.displayName ?? "Someone";
  const ogTitle = `${senderName} sent you ${invite.amount} ${invite.asset} on SAID`;
  // Describes the CURRENT flow: open the link, log in with the account it was
  // sent to, and the money is already there. (The old copy sent people off to
  // DM a bot, which is a dead end now and cost conversions on the one link
  // every new user sees.)
  const ogDescription =
    "It's already waiting. Log in with the account it was sent to and it's yours.";
  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
    },
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function platformLabel(platform: "telegram" | "x"): string {
  return platform === "telegram" ? "Telegram" : "X";
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const invite = await fetchInvite(token);

  if (invite === "unavailable") {
    // Butler blip ≠ dead invite. A recipient clicking "someone sent you money"
    // must never see a 404 for a transient failure — that reads as a scam.
    return (
      <main className="min-h-dvh bg-[var(--bg)] text-[var(--ink)] px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-w-md mx-auto flex flex-col items-center justify-center text-center">
        <p className="text-3xl mb-4">⏳</p>
        <h1 className="text-xl font-bold mb-2">One moment…</h1>
        <p className="text-sm text-[var(--dim)] mb-6">
          We couldn&apos;t load this invite right now — your funds are safe and
          the link is still good. Refresh in a few seconds.
        </p>
        <a
          href=""
          className="px-5 py-2.5 rounded-lg bg-[var(--ink)] text-[var(--bg)] text-sm font-semibold hover:opacity-85"
        >
          Retry
        </a>
      </main>
    );
  }

  if (!invite) notFound();

  const senderName = invite.sender.displayName ?? "Someone";
  const recipientLabel = `@${invite.recipient.handle} on ${platformLabel(invite.recipient.platform)}`;

  if (invite.status === "claimed") {
    return (
      <main className="min-h-dvh bg-[var(--bg)] text-[var(--ink)] px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-w-md mx-auto">
        <header className="mb-6">
          <Link href="/" className="text-sm text-[var(--faint)] hover:text-[var(--ink)]">
            ← SAID Agent
          </Link>
        </header>
        <section className="bg-green-950/30 border border-green-900 rounded-xl px-4 py-6 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm font-medium text-green-300 mb-1">
            Already claimed
          </p>
          <p className="text-sm text-[var(--dim)] mb-3">
            {senderName} sent {invite.amount} {invite.asset} to {recipientLabel}.
            Claimed on {invite.claimedAt ? formatDate(invite.claimedAt) : "—"}.
          </p>
          {invite.claimTx && (
            <a
              href={`https://solscan.io/tx/${invite.claimTx}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--dim)] hover:text-[var(--ink)] underline break-all block mb-4"
            >
              View transaction
            </a>
          )}
          <Link
            href="/chat"
            className="inline-block text-sm px-4 py-2 rounded-lg bg-[var(--ink)] text-[var(--bg)] font-semibold hover:opacity-85"
          >
            Get your own agent →
          </Link>
        </section>
      </main>
    );
  }

  if (invite.status === "cancelled") {
    return (
      <main className="min-h-dvh bg-[var(--bg)] text-[var(--ink)] px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-w-md mx-auto">
        <header className="mb-6">
          <Link href="/" className="text-sm text-[var(--faint)] hover:text-[var(--ink)]">
            ← SAID Agent
          </Link>
        </header>
        <section className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-4 py-6 text-center">
          <p className="text-3xl mb-2">↩</p>
          <p className="text-sm font-medium mb-1">Cancelled</p>
          <p className="text-sm text-[var(--faint)]">
            {senderName} cancelled this send. Funds returned to their wallet.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm px-4 py-2 rounded-lg border border-[var(--line)] hover:border-[var(--ink)]"
          >
            Home
          </Link>
        </section>
      </main>
    );
  }

  if (invite.status === "expired") {
    return (
      <main className="min-h-dvh bg-[var(--bg)] text-[var(--ink)] px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-w-md mx-auto">
        <header className="mb-6">
          <Link href="/" className="text-sm text-[var(--faint)] hover:text-[var(--ink)]">
            ← SAID Agent
          </Link>
        </header>
        <section className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-4 py-6 text-center">
          <p className="text-3xl mb-2">⏰</p>
          <p className="text-sm font-medium mb-1">Expired</p>
          <p className="text-sm text-[var(--faint)]">
            This invite expired on {formatDate(invite.expiresAt)}. Funds returned to {senderName}.
          </p>
        </section>
      </main>
    );
  }

  // Pending — the meaningful state. Show the claim CTA.
  const tgDeepLink = `https://t.me/saidinfrabot?start=invite_${invite.token}`;
  const xDeepLink = `https://x.com/saidagent`;

  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--ink)] px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-w-md mx-auto">
      <header className="mb-6">
        <Link href="/" className="text-sm text-[var(--faint)] hover:text-[var(--ink)]">
          ← SAID Agent
        </Link>
      </header>

      <section className="mb-8">
        <p className="text-sm text-[var(--faint)] mb-2">
          {senderName} sent you crypto.
        </p>
        <h1 className="text-3xl font-semibold mb-1">
          {invite.amount} {invite.asset}
        </h1>
        <p className="text-sm text-[var(--dim)]">
          to <span className="text-[var(--ink)]">{recipientLabel}</span>
        </p>
      </section>

      <section className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-4 py-5 mb-6">
        <h2 className="text-sm font-medium mb-3">Claim your crypto</h2>
        <p className="text-sm text-[var(--faint)] mb-4">
          Sign in with the same {platformLabel(invite.recipient.platform)} account
          (@{invite.recipient.handle}) and your funds drop in automatically — no
          need to leave the web.
        </p>

        <div className="flex flex-col gap-2">
          <InviteWebClaim
            platform={invite.recipient.platform}
            handle={invite.recipient.handle}
          />
          <a
            href={tgDeepLink}
            className="w-full text-center text-sm px-4 py-3 rounded-lg border border-[var(--line)] hover:border-[var(--ink)]"
          >
            Or open Telegram → @saidinfrabot
          </a>
          {invite.recipient.platform === "x" && (
            <a
              href={xDeepLink}
              target="_blank"
              rel="noreferrer"
              className="w-full text-center text-sm px-4 py-3 rounded-lg border border-[var(--line)] hover:border-[var(--ink)]"
            >
              Or reply on X → @saidagent
            </a>
          )}
        </div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-4 py-3 text-xs text-[var(--faint)]">
        <div className="flex justify-between mb-1">
          <span>Sent on</span>
          <span className="text-[var(--ink)]">{formatDate(invite.createdAt)}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Expires</span>
          <span className="text-[var(--ink)]">{formatDate(invite.expiresAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Status</span>
          <span className="text-yellow-400">Pending claim</span>
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t border-[var(--line)] text-xs text-[var(--faint)] text-center">
        <p>
          Funds stay in {senderName}&apos;s wallet until you claim — no escrow,
          the money isn&apos;t parked anywhere. A name → wallet route through SAID Protocol.
        </p>
      </footer>
    </main>
  );
}
