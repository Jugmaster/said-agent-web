"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useSolanaFundingPlugin } from "@privy-io/react-auth/solana";
import { ReactNode } from "react";

// Shared with saidprotocol.com — single Privy session works across both surfaces.
const PRIVY_APP_ID = "cmlbxd3qu00jqi80c4pibohzv";

// Registers the Solana funding machinery inside the Privy provider tree so
// `useFundWallet` from @privy-io/react-auth/solana actually works (otherwise
// the funding modal can't open and throws chain-resolution errors).
function SolanaFundingBootstrap() {
  useSolanaFundingPlugin();
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Telegram is FIRST — most users come from @saidinfrabot, and logging in
        // with Telegram links the PWA session to the user's existing tg_<id> agent
        // automatically. Other methods provision a fresh pwa_<privyId> agent.
        loginMethods: ["telegram", "email", "wallet", "google", "twitter"],
        appearance: {
          theme: "dark",
          accentColor: "#667eea",
          // Canonical SAID brand logo — same asset used by saidprotocol.com
          // and app.saidprotocol.com in their Privy modals.
          logo: "/logo-dark.png",
        },
        embeddedWallets: {
          solana: { createOnLogin: "users-without-wallets" },
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <SolanaFundingBootstrap />
      {children}
    </PrivyProvider>
  );
}
