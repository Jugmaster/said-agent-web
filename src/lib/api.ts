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
  proTier: number;
}

export interface ActivityReceipt {
  seq: number;
  type: string;
  onChainTx: string | null;
  occurredAt: string;
  anchored: boolean;
  anchorTx: string | null;
}

export interface ActivityDcaRule {
  id: number;
  name: string | null;
  fromToken: string;
  toMint: string;
  amount: number;
  cadenceSeconds: number;
  paused: boolean;
  failureCount: number;
  nextRunAt: string;
  lastRunAt: string | null;
}

export interface ActivityResponse {
  platformId: string;
  receipts: ActivityReceipt[];
  dcaRules: ActivityDcaRule[];
  feeStats: { txCount: number; totalFee: number };
}

export interface AgentProfileResponse {
  platformId: string;
  displayName: string | null;
  saidWallet: string | null;
  saidPda: string | null;
  verified: boolean;
  proTier: number;
  activityCounts: { total: number; swaps: number; stakes: number; anchored: number };
  recentActivity: Array<{
    seq: number;
    type: string;
    onChainTx: string | null;
    occurredAt: string;
    anchored: boolean;
  }>;
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

export async function getActivity(platformId: string): Promise<ActivityResponse> {
  const res = await fetch(
    `${API_BASE}/api/activity/${encodeURIComponent(platformId)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`activity failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function getAgentProfile(
  platformId: string,
  options?: { signal?: AbortSignal; cache?: RequestCache }
): Promise<AgentProfileResponse> {
  const res = await fetch(
    `${API_BASE}/api/agents/${encodeURIComponent(platformId)}`,
    { signal: options?.signal, cache: options?.cache ?? "no-store" }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`agent profile failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export interface ClaimResponse {
  ok: true;
  platformId: string;
  linkedPlatformIds: string[];
  agentName: string | null;
  walletAddress: string | null;
}

export async function claimAgent(input: {
  platformId: string;
  privyUserId: string;
  verifiedXUserId?: string;
}): Promise<ClaimResponse> {
  const res = await fetch(`${API_BASE}/api/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`claim failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export interface InviteResponse {
  token: string;
  status: "pending" | "claimed" | "cancelled" | "expired";
  sender: {
    platformId: string;
    displayName: string | null;
    walletAddress: string | null;
    platform: "telegram" | "twitter" | null;
  };
  recipient: {
    platform: "telegram" | "x";
    handle: string;
  };
  amount: number;
  asset: "SOL" | "USDC";
  sourceChain: string;
  destinationChain: string;
  createdAt: string;
  expiresAt: string;
  claimedAt: string | null;
  claimTx: string | null;
  claimedByPlatformId: string | null;
}

export async function getInvite(
  token: string,
  options?: { cache?: RequestCache; signal?: AbortSignal }
): Promise<InviteResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/invites/${encodeURIComponent(token)}`, {
      cache: options?.cache ?? "no-store",
      signal: options?.signal,
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`invite lookup failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    return null;
  }
}

export interface LaunchListItem {
  tokenMint: string;
  tweetId: string;
  replyTweetId: string | null;
  launchTx: string;
  creator: {
    xUserId: string;
    xHandle: string;
    platformId: string;
  };
  tweetExcerpt: string;
  launchedAt: string;
  sweeps: {
    count: number;
    totalClaimedSol: number;
    totalSaidCutSol: number;
    totalUserKeptSol: number;
    lastSweepAt: string | null;
  };
  pumpfunUrl: string;
  solscanUrl: string;
}

export async function getLaunches(
  limit = 50,
  options?: { cache?: RequestCache }
): Promise<LaunchListItem[]> {
  const res = await fetch(
    `${API_BASE}/api/launches?limit=${encodeURIComponent(limit)}`,
    { cache: options?.cache ?? "no-store" }
  );
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as { launches?: LaunchListItem[] };
  return data.launches ?? [];
}

export interface AgentListItem {
  platformId: string;
  platform: "telegram" | "twitter";
  displayName: string | null;
  walletAddress: string | null;
  saidPda: string | null;
  verified: boolean;
  proTier: boolean;
  createdAt: string;
  activity: { total: number; swaps: number; stakes: number; transfers: number };
}

export interface PlatformStats {
  agents: { total: number; verified: number; pro: number };
  launches: { total: number };
  activity: { totalReceipts: number };
  sweeps: {
    count: number;
    totalClaimedSol: number;
    totalSaidCutSol: number;
  };
  pendingSends: { count: number; totalAmount: number };
}

export async function getStats(
  options?: { cache?: RequestCache }
): Promise<PlatformStats | null> {
  try {
    const res = await fetch(`${API_BASE}/api/stats`, {
      cache: options?.cache ?? "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getAgentsList(
  sort: "activity" | "recent" | "pro" = "activity",
  limit = 50,
  options?: { cache?: RequestCache }
): Promise<AgentListItem[]> {
  const res = await fetch(
    `${API_BASE}/api/agents?sort=${sort}&limit=${limit}`,
    { cache: options?.cache ?? "no-store" }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { agents?: AgentListItem[] };
  return data.agents ?? [];
}

const SOLANA_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface OnChainBalances {
  sol: number;
  usdc: number;
}

export async function getOnChainBalances(
  walletAddress: string
): Promise<OnChainBalances> {
  // Two parallel JSON-RPC calls — native SOL and USDC SPL accounts
  const [solRes, tokenRes] = await Promise.all([
    fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [walletAddress],
      }),
    }).then((r) => r.json()),
    fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "getTokenAccountsByOwner",
        params: [
          walletAddress,
          { mint: USDC_MINT },
          { encoding: "jsonParsed" },
        ],
      }),
    }).then((r) => r.json()),
  ]);

  const lamports: number = solRes?.result?.value ?? 0;
  const usdc = (tokenRes?.result?.value ?? []).reduce(
    (sum: number, account: { account: { data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } } } }) => {
      const amount = account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      return sum + (typeof amount === "number" ? amount : 0);
    },
    0
  );

  return { sol: lamports / 1e9, usdc };
}
