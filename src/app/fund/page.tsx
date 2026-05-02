"use client";

import Link from "next/link";

export default function FundPage() {
  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100 px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Add funds</h1>
        <Link
          href="/portfolio"
          className="text-xs px-3 py-1 rounded-md border border-neutral-700 hover:border-neutral-500"
        >
          Back
        </Link>
      </header>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-6 text-center">
        <p className="text-sm text-neutral-300 mb-1">Funding flow coming online soon.</p>
        <p className="text-xs text-neutral-500">
          Apple Pay / card → USDC, distributed across your agent&apos;s wallets.
        </p>
        <p className="text-xs text-neutral-500 mt-3">
          (Wave 3: Privy onramp + Stripe Link agent SPT.)
        </p>
      </div>
    </main>
  );
}
