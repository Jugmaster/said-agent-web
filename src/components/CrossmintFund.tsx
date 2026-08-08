"use client";

import { useState } from "react";
import { CrossmintProvider, CrossmintEmbeddedCheckout } from "@crossmint/client-sdk-react-ui";

/**
 * Crossmint fiat on-ramp — buy USDC with Apple Pay / Google Pay / card, delivered
 * straight to the AGENT's Solana wallet. Inline (new-order) mode: the client key
 * creates the order, no backend route needed. Works in the UK (unlike MoonPay).
 *
 * Needs NEXT_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY. Enable Apple Pay on the key in
 * the Crossmint dashboard too.
 */

// Solana mainnet USDC.
const USDC_SOLANA = "solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const CLIENT_KEY = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY;

export default function CrossmintFund({
  walletAddress,
  receiptEmail,
}: {
  walletAddress: string;
  receiptEmail: string;
}) {
  const [amount, setAmount] = useState("20");
  const [started, setStarted] = useState(false);
  const amt = parseFloat(amount);

  if (!CLIENT_KEY) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 text-sm text-zinc-400">
        Crossmint isn&apos;t configured yet — set{" "}
        <code className="text-zinc-300">NEXT_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY</code>.
      </div>
    );
  }

  if (!started) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
          <span className="text-sm text-zinc-500">$</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white focus:outline-none"
          />
          <span className="text-sm text-zinc-400">USDC</span>
        </div>
        <button
          type="button"
          disabled={!(amt > 0)}
          onClick={() => setStarted(true)}
          className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          Continue to payment
        </button>
        <p className="text-center text-xs text-zinc-600">
          Apple Pay, Google Pay, or card via Crossmint. USDC lands in your agent&apos;s wallet.
        </p>
      </div>
    );
  }

  return (
    <CrossmintProvider apiKey={CLIENT_KEY}>
      <CrossmintEmbeddedCheckout
        recipient={{ walletAddress }}
        lineItems={{
          tokenLocator: USDC_SOLANA,
          executionParameters: { mode: "exact-in", amount: String(amt) },
        }}
        payment={{
          receiptEmail,
          fiat: { enabled: true, allowedMethods: { card: true, applePay: true, googlePay: true } },
          crypto: { enabled: false },
          defaultMethod: "fiat",
        }}
      />
    </CrossmintProvider>
  );
}
