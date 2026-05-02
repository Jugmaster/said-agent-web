/**
 * Client for the butler-container HTTP API.
 *
 * Server lives in butler-container/said-butler/src/http/server.ts, deployed
 * on Hetzner at butler.saidprotocol.com (port 3102 behind nginx).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_BUTLER_API ?? "https://butler.saidprotocol.com";

export interface ChatResponse {
  action: string;
  message: string;
  context?: {
    step?: string;
    isAgent?: boolean;
    agentName?: string;
    walletAddress?: string;
    agentcashAddress?: string;
  };
}

export interface BalanceResponse {
  platformId: string;
  platform: "telegram" | "twitter";
  displayName: string | null;
  verified: boolean;
  registered: boolean;
  saidWallet: string | null;
  saidPda: string | null;
  agentcashWallet: string | null;
  purchWallet: string | null;
}

export async function chat(
  platformId: string,
  message: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platformId, message }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`chat failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function getBalance(platformId: string): Promise<BalanceResponse> {
  const res = await fetch(
    `${API_BASE}/api/balance/${encodeURIComponent(platformId)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`balance failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
