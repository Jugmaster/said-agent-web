"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy, getAccessToken, type User } from "@privy-io/react-auth";
import { claimAgent, type ClaimResponse } from "@/lib/api";

/**
 * Derives the butler `platformId` from the Privy user's linked accounts.
 *
 * Priority:
 *  1. `tg_<telegramUserId>` — if Privy session has a Telegram account.
 *     Maps directly onto the agent the user has already been chatting with
 *     via @saidinfrabot. Same wallet, same history.
 *  2. `pwa_<privyId>` fallback — for users who logged in with email / Google /
 *     X / wallet without linking Telegram. Butler creates a fresh agent on
 *     first claim.
 */
function derivePlatformId(user: User): string {
  const tgId = user.telegram?.telegramUserId;
  if (tgId) return `tg_${tgId}`;
  return `pwa_${user.id}`;
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
  const [state, setState] = useState<AgentState>({ status: "not-ready" });

  const performClaim = useCallback(async (privyUser: User) => {
    setState({ status: "linking" });

    const platformId = derivePlatformId(privyUser);

    try {
      const claim: ClaimResponse = await claimAgent({
        platformId,
        privyUserId: privyUser.id,
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

    void performClaim(user);
  }, [ready, authenticated, user, performClaim]);

  const logout = useCallback(() => {
    clearCache();
    void privyLogout();
  }, [privyLogout]);

  const refresh = useCallback(() => {
    if (user) void performClaim(user);
  }, [user, performClaim]);

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
