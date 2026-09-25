"use client";
import { useEffect, useState } from "react";

import { PrivyProvider } from "@privy-io/react-auth";
import { useSolanaFundingPlugin } from "@privy-io/react-auth/solana";
import { ReactNode } from "react";

// Shared with saidprotocol.com — single Privy session works across both surfaces.
const PRIVY_APP_ID = "cmlbxd3qu00jqi80c4pibohzv";

// Registers Privy's Solana funding machinery inside the provider tree.
// Required for fundWallet to work with Solana addresses — otherwise the
// chain resolution returns NaN and the modal fails to open.
function SolanaFundingBootstrap() {
  useSolanaFundingPlugin();
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  // Privy's modal follows the page theme as it was at mount.
  const [privyTheme, setPrivyTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    setPrivyTheme(t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light");
  }, []);
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Telegram is FIRST — most users come from @saidinfrabot, and logging in
        // with Telegram links the PWA session to the user's existing tg_<id> agent
        // automatically. Other methods provision a fresh pwa_<privyId> agent.
        loginMethods: ["telegram", "email", "wallet", "google", "twitter"],
        appearance: {
          theme: privyTheme,
          accentColor: "#E8542E",
          logo: "/logo.png",
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
