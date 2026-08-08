"use client";

import { useState } from "react";
import { CrossmintProvider, CrossmintEmbeddedCheckout } from "@crossmint/client-sdk-react-ui";

/**
 * Crossmint fiat on-ramp — buy USDC with Apple Pay / Google Pay / card, delivered
 * straight to the AGENT's Solana wallet. Works in the UK (unlike MoonPay).
 *
 * Crossmint's Embedded Onramp requires the order to be created SERVER-side first
 * (client-side order creation is rejected), so this posts to /api/crossmint/order
 * (which uses the secret sk_ key) to mint { orderId, clientSecret }, then hands
 * those to CrossmintEmbeddedCheckout in existing-order mode.
 *
 * Needs NEXT_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY (widget) + CROSSMINT_SERVER_API_KEY
 * (server route). Enable Apple Pay on the key in the Crossmint dashboard too.
 */

const CLIENT_KEY = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY;

type Order = { orderId: string; clientSecret: string };

export default function CrossmintFund({
  walletAddress,
  receiptEmail,
}: {
  walletAddress: string;
  receiptEmail: string;
}) {
  const [amount, setAmount] = useState("20");
  const [order, setOrder] = useState<Order | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amt = parseFloat(amount);

  if (!CLIENT_KEY) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 text-sm text-zinc-400">
        Crossmint isn&apos;t configured yet — set{" "}
        <code className="text-zinc-300">NEXT_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY</code>.
      </div>
    );
  }

  async function startOrder() {
    if (!(amt > 0)) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/crossmint/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, amount: amt, receiptEmail }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<Order> & { error?: string };
      if (!res.ok || !data.orderId || !data.clientSecret) {
        setError(data.error ?? `Couldn't start payment (${res.status})`);
        return;
      }
      setOrder({ orderId: data.orderId, clientSecret: data.clientSecret });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start payment");
    } finally {
      setCreating(false);
    }
  }

  if (order) {
    return (
      <CrossmintProvider apiKey={CLIENT_KEY}>
        <CrossmintEmbeddedCheckout
          orderId={order.orderId}
          clientSecret={order.clientSecret}
          payment={{
            receiptEmail,
            crypto: { enabled: false },
            fiat: { enabled: true },
            defaultMethod: "fiat",
          }}
        />
      </CrossmintProvider>
    );
  }

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
        disabled={!(amt > 0) || creating}
        onClick={startOrder}
        className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        {creating ? "Starting…" : "Continue to payment"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-center text-xs text-zinc-600">
        Apple Pay, Google Pay, or card via Crossmint. USDC lands in your agent&apos;s wallet.
      </p>
    </div>
  );
}
