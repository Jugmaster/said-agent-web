"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy, getAccessToken, type User } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { claimAgent, type ClaimResponse } from "@/lib/api";

/**
 * Derives the butler `platformId` from the Privy user's linked accounts.
 *
 * Priority:
 *  1. `tg_<telegramUserId>` — if Privy session has a Telegram account.
 *     Maps directly onto the agent the user has already been chatting with
 *     via @saidinfrabot. Same wallet, same history.
 *  2. `tw_<twitterSubject>` — if Privy session has an X (Twitter) account.
 *     For pre-provisioned recipients (someone sent crypto to their @handle
 *     before they ever logged in), Privy reconciles to the pre-existing
 *     user on first OAuth — meaning their pre-funded wallet is already
 *     attached when this hook fires.
 *  3. `pwa_<privyId>` fallback — for users who logged in with email / Google /
 *     wallet without linking either social. Butler creates a fresh agent on
 *     first claim.
 */
function derivePlatformId(user: User): string {
  const tgId = user.telegram?.telegramUserId;
  if (tgId) return `tg_${tgId}`;
  const xSubject = user.twitter?.subject;
  if (xSubject) return `tw_${xSubject}`;
  return `pwa_${user.id}`;
}

/**
 * Pull the Solana embedded wallet address out of the Privy user's linked
 * accounts. For pre-provisioned users this is the wallet that already has
 * funds in it from someone's send-by-handle.
 */
function findSolanaWalletAddress(user: User): string | null {
  const linked = (user.linkedAccounts ?? []) as Array<{
    type?: string;
    chainType?: string;
    address?: string;
    connectorType?: string;
  }>;
  const embedded = linked.find(
    (a) => a.chainType === "solana" && a.connectorType === "embedded" && a.address,
  );
  if (embedded?.address) return embedded.address;
  const external = linked.find((a) => a.chainType === "solana" && a.address);
  return external?.address ?? null;
}

/**
 * One-shot link between a Privy session and a butler agent.
 *
 *   not-ready    → Privy still hydrating
 *   guest        → no Privy session; show login
 *   linking      → calling /api/claim
 *   ready        → claim returned; platformId + walletAddress in hand
 *   error        → claim failed (string in `error`)
 */
export type AgentState =
  | { status: "not-ready" }
  | { status: "guest" }
  | { status: "linking" }
  | { status: "ready"; platformId: string; walletAddress: string | null; agentName: string | null }
  | { status: "error"; error: string };

const STORAGE_KEY = "said-agent:linked";

interface LinkedCache {
  privyId: string;
  platformId: string;
  walletAddress: string | null;
  agentName: string | null;
}

function readCache(privyId: string): LinkedCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LinkedCache;
    return parsed.privyId === privyId ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(c: LinkedCache) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    // localStorage full / disabled — non-fatal, will just re-claim next render
  }
}

function clearCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // non-fatal
  }
}

export function useAgent(): AgentState & { logout: () => void; refresh: () => void } {
  const { ready, authenticated, user, logout: privyLogout } = usePrivy();
  const { wallets: solanaWallets } = useWallets();
  const [state, setState] = useState<AgentState>({ status: "not-ready" });

  // Reactive Solana embedded-wallet address. Privy provisions the embedded
  // wallet asynchronously after login, so this hook is the reliable signal —
  // the snapshot in user.linkedAccounts can lag a beat behind, which is what
  // caused fresh email/wallet logins to claim before a wallet existed (→ 404).
  const solanaAddress =
    solanaWallets?.find((w) => w.address)?.address ??
    (user ? findSolanaWalletAddress(user) : null);

  const performClaim = useCallback(
    async (privyUser: User, walletAddress: string | undefined) => {
    setState({ status: "linking" });

    const platformId = derivePlatformId(privyUser);

    // For X (twitter) users we forward extra context so butler can auto-
    // create the agent record if the user was pre-provisioned (someone sent
    // them crypto by handle before they ever logged in). Butler verifies
    // verifiedXUserId === platformId.slice('tw_'.length) before trusting any
    // of this — same auth check that's been in place for adopting X-launched
    // agents.
    const verifiedXUserId = privyUser.twitter?.subject;
    const xUsername = privyUser.twitter?.username ?? undefined;

    try {
      const claim: ClaimResponse = await claimAgent({
        platformId,
        privyUserId: privyUser.id,
        verifiedXUserId,
        xUsername,
        walletAddress,
      });
      const cache: LinkedCache = {
        privyId: privyUser.id,
        platformId: claim.platformId,
        walletAddress: claim.walletAddress,
        agentName: claim.agentName,
      };
      writeCache(cache);
      setState({
        status: "ready",
        platformId: claim.platformId,
        walletAddress: claim.walletAddress,
        agentName: claim.agentName,
      });
    } catch (err) {
      setState({
        status: "error",
        error: err instanceof Error ? err.message : "Claim failed",
      });
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      setState({ status: "not-ready" });
      return;
    }
    if (!authenticated || !user) {
      clearCache();
      setState({ status: "guest" });
      return;
    }

    const cached = readCache(user.id);
    if (cached) {
      setState({
        status: "ready",
        platformId: cached.platformId,
        walletAddress: cached.walletAddress,
        agentName: cached.agentName,
      });
      return;
    }

    // Telegram agents already exist server-side (created by @saidinfrabot), so
    // claim just links the session — no web wallet needed. Every other login
    // provisions a pwa_/tw_ agent whose wallet IS the Privy embedded Solana
    // wallet, which Privy creates asynchronously. Wait for it before claiming,
    // otherwise butler gets no wallet and returns 404 (the broken-menus bug).
    const platformId = derivePlatformId(user);
    if (!platformId.startsWith("tg_") && !solanaAddress) {
      setState({ status: "linking" });
      const t = setTimeout(() => {
        setState((s) =>
          s.status === "linking"
            ? {
                status: "error",
                error: "Wallet is taking longer than usual — tap retry.",
              }
            : s,
        );
      }, 25000);
      return () => clearTimeout(t);
    }

    void performClaim(user, solanaAddress ?? undefined);
  }, [ready, authenticated, user, solanaAddress, performClaim]);

  const logout = useCallback(() => {
    clearCache();
    void privyLogout();
  }, [privyLogout]);

  const refresh = useCallback(() => {
    if (user) void performClaim(user, solanaAddress ?? undefined);
  }, [user, solanaAddress, performClaim]);

  return { ...state, logout, refresh };
}

/**
 * Pulled out so non-React API helpers can grab a fresh Privy access token
 * without subscribing to context. Returns null if the user isn't logged in.
 */
export async function getPrivyAccessToken(): Promise<string | null> {
  try {
    return await getAccessToken();
  } catch {
    return null;
  }
}
