"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

// Shared with saidprotocol.com — single Privy session works across both surfaces.
const PRIVY_APP_ID = "cmlbxd3qu00jqi80c4pibohzv";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "wallet", "google", "twitter"],
        appearance: {
          theme: "dark",
          accentColor: "#667eea",
          logo: "/icon-512.png",
        },
        embeddedWallets: {
          solana: { createOnLogin: "users-without-wallets" },
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
