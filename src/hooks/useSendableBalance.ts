"use client";

import { useCallback, useEffect, useState } from "react";
import { getOnChainBalances } from "@/lib/api";

export interface SendableBalanceState {
  /** On-chain SOL balance (already in SOL units, not lamports). */
  sol: number;
  /** On-chain USDC balance (already in UI units). */
  usdc: number;
  loading: boolean;
  /** True if the fetch failed outright (distinct from a real zero balance). */
  error: boolean;
  /** Re-run the fetch — call after a send/swap so the displayed number isn't stale. */
  refetch: () => void;
}

/**
 * Shared source of truth for the two sendable assets (SOL + USDC) so the send
 * page and the profile dropdown can't disagree. Routes through the same
 * `getOnChainBalances` → butler `/api/wallet-balances` failover RPC the
 * portfolio page uses, so all three surfaces show identical numbers.
 *
 * `enabled` lets a caller defer the fetch (e.g. the dropdown only fetches while
 * the menu is open) without violating the rules-of-hooks.
 */
export function useSendableBalance(
  walletAddress: string | null,
  enabled: boolean = true,
): SendableBalanceState {
  const [state, setState] = useState({
    sol: 0,
    usdc: 0,
    loading: false,
    error: false,
    loaded: false,
  });
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!walletAddress || !enabled) return;
    let cancelled = false;
    // Only show the "loading…" state before the FIRST successful load. A
    // refetch keeps the current numbers on screen and swaps them in quietly,
    // so refreshes don't flash/blank the balance.
    setState((s) => ({ ...s, loading: !s.loaded, error: false }));
    getOnChainBalances(walletAddress)
      .then((b) => {
        if (cancelled) return;
        setState({ sol: b.sol ?? 0, usdc: b.usdc ?? 0, loading: false, error: false, loaded: true });
      })
      .catch(() => {
        // Don't surface an error over already-good data — keep showing it.
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: !s.loaded }));
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress, enabled, nonce]);

  return { sol: state.sol, usdc: state.usdc, loading: state.loading, error: state.error, refetch };
}

/**
 * Max amount safely sendable for an asset. For SOL we hold back a small buffer
 * for the rent-exempt floor (~0.00089 SOL) plus tx + 1% treasury fee, so a
 * "Max" tap doesn't produce an InsufficientFundsForRent failure.
 */
export function maxSendable(asset: "SOL" | "USDC", sol: number, usdc: number): number {
  if (asset === "USDC") return usdc;
  return Math.max(0, sol - 0.002);
}
