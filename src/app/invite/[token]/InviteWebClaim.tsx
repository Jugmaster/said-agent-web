"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

interface Props {
  platform: "telegram" | "x";
  handle: string;
}

/**
 * Web-native claim path for a pending invite. The recipient signs in with the
 * same handle the funds were addressed to; useAgent's claim runs settle-on-
 * login server-side and releases the pending send automatically, then /chat
 * shows the receive celebration. No need to bounce a desktop recipient off to
 * Telegram/X. (Sign in with a different handle simply settles nothing — the
 * page tells them which account to use.)
 */
export default function InviteWebClaim({ platform }: Props) {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  // Already signed in (or just finished) → go where the claim + settle runs.
  useEffect(() => {
    if (ready && authenticated) router.replace("/chat");
  }, [ready, authenticated, router]);

  const label = platform === "telegram" ? "Telegram" : "X";

  return (
    <button
      type="button"
      onClick={login}
      disabled={!ready}
      className="w-full text-center text-sm px-4 py-3 rounded-lg bg-white text-black hover:bg-neutral-200 font-medium disabled:opacity-50 transition"
    >
      Claim here → sign in with {label}
    </button>
  );
}
