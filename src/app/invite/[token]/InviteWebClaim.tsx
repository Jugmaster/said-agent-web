"use client";

import { useEffect, useState } from "react";
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
 *
 * Already-signed-in visitors are NOT auto-redirected: the sender checking
 * their own link, or a recipient signed into the wrong account, needs to SEE
 * the invite. Only a login initiated from this page navigates onward.
 */
export default function InviteWebClaim({ platform }: Props) {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const [loginStarted, setLoginStarted] = useState(false);

  // Navigate only after a login that STARTED here completes — where the
  // claim + settle runs and the receive celebration shows.
  useEffect(() => {
    if (loginStarted && ready && authenticated) router.replace("/chat");
  }, [loginStarted, ready, authenticated, router]);

  const label = platform === "telegram" ? "Telegram" : "X";

  if (ready && authenticated) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="w-full text-center text-sm px-4 py-3 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium transition"
        >
          Open my agent
        </button>
        <p className="text-xs text-zinc-500 text-center">
          You&apos;re already signed in. If this invite is for a different{" "}
          {label} account, sign out first, then sign back in with that account
          to claim it.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setLoginStarted(true);
        login();
      }}
      disabled={!ready}
      className="w-full text-center text-sm px-4 py-3 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium disabled:opacity-50 transition"
    >
      Claim here → sign in with {label}
    </button>
  );
}
