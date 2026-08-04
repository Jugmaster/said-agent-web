import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getInvite, type InviteResponse } from "@/lib/api";
import InviteWebClaim from "./InviteWebClaim";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function fetchInvite(token: string): Promise<InviteResponse | null> {
  return getInvite(token, { cache: "no-store" });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const invite = await fetchInvite(token);
  if (!invite) {
    return {
      title: "Invite not found · SAID Agent",
      description: "This invite link doesn't exist or has expired.",
    };
  }
  const senderName = invite.sender.displayName ?? "Someone";
  const ogTitle = `${senderName} sent you ${invite.amount} ${invite.asset} on SAID`;
  return {
    title: ogTitle,
    description: `Claim by chatting with @saidinfrabot on Telegram or @saidagent on X.`,
    openGraph: {
      title: ogTitle,
      description: `Claim by chatting with @saidinfrabot on Telegram or @saidagent on X.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description: `Claim by chatting with @saidinfrabot on Telegram or @saidagent on X.`,
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

  if (!invite) notFound();

  const senderName = invite.sender.displayName ?? "Someone";
  const recipientLabel = `@${invite.recipient.handle} on ${platformLabel(invite.recipient.platform)}`;

  if (invite.status === "claimed") {
    return (
      <main className="min-h-dvh bg-zinc-950 text-zinc-100 px-4 py-6 max-w-md mx-auto">
        <header className="mb-6">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← SAID Agent
          </Link>
        </header>
        <section className="bg-green-950/30 border border-green-900 rounded-xl px-4 py-6 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm font-medium text-green-300 mb-1">
            Already claimed
          </p>
          <p className="text-xs text-zinc-400 mb-3">
            {senderName} sent {invite.amount} {invite.asset} to {recipientLabel}.
            Claimed on {invite.claimedAt ? formatDate(invite.claimedAt) : "—"}.
          </p>
          {invite.claimTx && (
            <a
              href={`https://solscan.io/tx/${invite.claimTx}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-200 underline break-all block mb-4"
            >
              View transaction
            </a>
          )}
          <Link
            href="/chat"
            className="inline-block text-sm px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200"
          >
            Get your own agent →
          </Link>
        </section>
      </main>
    );
  }

  if (invite.status === "cancelled") {
    return (
      <main className="min-h-dvh bg-zinc-950 text-zinc-100 px-4 py-6 max-w-md mx-auto">
        <header className="mb-6">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← SAID Agent
          </Link>
        </header>
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-6 text-center">
          <p className="text-3xl mb-2">↩</p>
          <p className="text-sm font-medium mb-1">Cancelled</p>
          <p className="text-xs text-zinc-500">
            {senderName} cancelled this send. Funds returned to their wallet.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500"
          >
            Home
          </Link>
        </section>
      </main>
    );
  }

  if (invite.status === "expired") {
    return (
      <main className="min-h-dvh bg-zinc-950 text-zinc-100 px-4 py-6 max-w-md mx-auto">
        <header className="mb-6">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← SAID Agent
          </Link>
        </header>
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-6 text-center">
          <p className="text-3xl mb-2">⏰</p>
          <p className="text-sm font-medium mb-1">Expired</p>
          <p className="text-xs text-zinc-500">
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
    <main className="min-h-dvh bg-zinc-950 text-zinc-100 px-4 py-6 max-w-md mx-auto">
      <header className="mb-6">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← SAID Agent
        </Link>
      </header>

      <section className="mb-8">
        <p className="text-sm text-zinc-500 mb-2">
          {senderName} sent you crypto.
        </p>
        <h1 className="text-3xl font-semibold mb-1">
          {invite.amount} {invite.asset}
        </h1>
        <p className="text-sm text-zinc-400">
          to <span className="text-zinc-200">{recipientLabel}</span>
        </p>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-5 mb-6">
        <h2 className="text-sm font-medium mb-3">Claim your crypto</h2>
        <p className="text-xs text-zinc-500 mb-4">
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
            className="w-full text-center text-sm px-4 py-3 rounded-lg border border-zinc-700 hover:border-zinc-500"
          >
            Or open Telegram → @saidinfrabot
          </a>
          {invite.recipient.platform === "x" && (
            <a
              href={xDeepLink}
              target="_blank"
              rel="noreferrer"
              className="w-full text-center text-sm px-4 py-3 rounded-lg border border-zinc-700 hover:border-zinc-500"
            >
              Or reply on X → @saidagent
            </a>
          )}
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-500">
        <div className="flex justify-between mb-1">
          <span>Sent on</span>
          <span className="text-zinc-300">{formatDate(invite.createdAt)}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Expires</span>
          <span className="text-zinc-300">{formatDate(invite.expiresAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Status</span>
          <span className="text-yellow-400">Pending claim</span>
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t border-zinc-900 text-xs text-zinc-600 text-center">
        <p>
          Funds stay in {senderName}&apos;s wallet until you claim. No custody, no
          escrow — just a name → wallet route through SAID Protocol.
        </p>
      </footer>
    </main>
  );
}
