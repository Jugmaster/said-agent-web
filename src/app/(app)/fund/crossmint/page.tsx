"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import AuthGate from "@/components/AuthGate";
import { useAgent } from "@/hooks/useAgent";
import CrossmintFund from "@/components/CrossmintFund";

export default function CrossmintFundPage() {
  return <AuthGate>{() => <Inner />}</AuthGate>;
}

function Inner() {
  const agent = useAgent();
  const walletAddress = agent.status === "ready" ? agent.walletAddress : null;
  const { user } = usePrivy();
  const privyEmail =
    user?.email?.address ??
    (user?.google as { email?: string } | undefined)?.email ??
    "";
  const [email, setEmail] = useState(privyEmail);

  return (
    <div className="mt-24 md:mt-0 md:pt-10 px-5 md:px-8 pb-[calc(var(--tabbar-h)+1.5rem)] md:pb-16 w-full max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-white">Add funds</h1>
      <p className="mt-1 mb-5 text-sm text-zinc-400">
        Buy USDC with Apple Pay — it lands in your agent&apos;s wallet.
      </p>

      {!walletAddress ? (
        <div className="text-sm text-zinc-500">Loading your agent…</div>
      ) : (
        <div className="space-y-4">
          {!privyEmail && (
            <div>
              <label className="text-xs text-zinc-500">Receipt email (for the on-ramp)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                placeholder="you@email.com"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
          )}
          {email ? (
            <CrossmintFund walletAddress={walletAddress} receiptEmail={email} />
          ) : (
            <p className="text-xs text-zinc-500">Enter an email to continue.</p>
          )}
        </div>
      )}
    </div>
  );
}
