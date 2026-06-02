/**
 * Client for the butler-container HTTP API.
 *
 * Server lives in butler-container/said-butler/src/http/server.ts, deployed
 * on Hetzner at butler.saidprotocol.com (port 3102 behind nginx).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_BUTLER_API ?? "https://butler.saidprotocol.com";

/**
 * Builds an `Authorization: Bearer <privy-jwt>` header if the caller is logged in.
 * Lazy-loaded so server components and unauthenticated routes don't pull Privy.
 * Returns `{}` when no token is available — the API call still goes through; it's
 * up to butler to enforce auth on protected endpoints.
 */
async function authHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const { getPrivyAccessToken } = await import("@/hooks/useAgent");
    const token = await getPrivyAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

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
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
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
    `${API_BASE}/api/balance/${encodeURIComponent(platformId)}`,
    { headers: await authHeaders() }
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
    `${API_BASE}/api/activity/${encodeURIComponent(platformId)}`,
    { headers: await authHeaders() }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`activity failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export interface ConversationMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationsResponse {
  platformId: string;
  messages: ConversationMessage[];
}

/**
 * Recent conversation history with the user's butler agent. Returned in
 * chronological order (oldest first) so the chat page can render top-down
 * without reversing. Loaded once on mount of the /chat page so users see
 * their full Telegram conversation history when they log in on the web.
 */
export async function getConversations(
  platformId: string,
  limit: number = 50,
): Promise<ConversationsResponse> {
  const res = await fetch(
    `${API_BASE}/api/conversations/${encodeURIComponent(platformId)}?limit=${limit}`,
    { headers: await authHeaders() },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`conversations failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function getAgentProfile(
  platformId: string,
  options?: { signal?: AbortSignal; cache?: RequestCache }
): Promise<AgentProfileResponse> {
  const res = await fetch(
    `${API_BASE}/api/agents/${encodeURIComponent(platformId)}`,
    {
      signal: options?.signal,
      cache: options?.cache ?? "no-store",
      headers: await authHeaders(),
    }
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
  /** X handle (e.g. "bob_on_x") — used by butler to seed display_name when
   *  auto-creating an agent for a pre-provisioned recipient logging in for
   *  the first time. */
  xUsername?: string;
  /** Solana wallet from the Privy session — pre-provisioned recipients have
   *  this attached server-side; PWA forwards so butler can persist it on
   *  first claim. */
  walletAddress?: string;
}): Promise<ClaimResponse> {
  const res = await fetch(`${API_BASE}/api/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
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
  options?: { cache?: RequestCache; signal?: AbortSignal; revalidate?: number }
): Promise<InviteResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/invites/${encodeURIComponent(token)}`, {
      // Per-token, per-user — keep no-store so claim-state flips are seen instantly
      cache: options?.cache ?? "no-store",
      signal: options?.signal,
      next: typeof options?.revalidate === "number" ? { revalidate: options.revalidate } : undefined,
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
  options?: { cache?: RequestCache; revalidate?: number }
): Promise<LaunchListItem[]> {
  // Public, anonymous data — default revalidate=60s so crawlers + page hits
  // dedupe through Next's data cache instead of hitting butler every time.
  const revalidate = options?.revalidate ?? 60;
  const res = await fetch(
    `${API_BASE}/api/launches?limit=${encodeURIComponent(limit)}`,
    options?.cache
      ? { cache: options.cache }
      : { next: { revalidate } }
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
  options?: { cache?: RequestCache; revalidate?: number }
): Promise<PlatformStats | null> {
  // Public counters — 30s revalidate. "Live" enough; never hits butler more
  // than ~2/min per Next instance regardless of traffic.
  const revalidate = options?.revalidate ?? 30;
  try {
    const res = await fetch(
      `${API_BASE}/api/stats`,
      options?.cache
        ? { cache: options.cache }
        : { next: { revalidate } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getAgentsList(
  sort: "activity" | "recent" | "pro" = "activity",
  limit = 50,
  options?: { cache?: RequestCache; revalidate?: number }
): Promise<AgentListItem[]> {
  // Public directory — 60s revalidate. Each (sort, limit) tuple is its own
  // cache key, which is fine: only 3 sorts × 1 default limit = 3 entries.
  const revalidate = options?.revalidate ?? 60;
  const res = await fetch(
    `${API_BASE}/api/agents?sort=${sort}&limit=${limit}`,
    options?.cache
      ? { cache: options.cache }
      : { next: { revalidate } }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { agents?: AgentListItem[] };
  return data.agents ?? [];
}

export interface IdleLeaderboard {
  aggregate: { agents: number; jobsCompleted: number; earnedUsd: number };
  top: Array<{ rank: number; name: string; jobsCompleted: number; earnedUsd: number }>;
  source: string;
}

/**
 * Fleet IDLE-compute earnings — aggregate + top earners. Served by butler
 * (src/http/server.ts → /api/idle/leaderboard), fed by the idle-collector.
 * Returns null on any error so the agents page degrades gracefully.
 */
export async function getIdleLeaderboard(
  limit = 10,
  options?: { revalidate?: number }
): Promise<IdleLeaderboard | null> {
  const revalidate = options?.revalidate ?? 60;
  try {
    const res = await fetch(`${API_BASE}/api/idle/leaderboard?limit=${limit}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as IdleLeaderboard;
  } catch {
    return null;
  }
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
  // Route through butler's server-side failover RPC chain. Hitting
  // api.mainnet-beta.solana.com directly (the old behavior) rate-limited
  // aggressively → SaladBot's 0.0117 SOL showed as "empty" because the
  // 429 response defaulted to 0. butler's /api/wallet-balances uses its
  // QuickNode → publicnode failover so this is reliable + doesn't leak
  // RPC keys to client bundles.
  try {
    const res = await fetch(
      `${API_BASE}/api/wallet-balances/${encodeURIComponent(walletAddress)}`,
    );
    if (res.ok) {
      const data = (await res.json()) as { sol: number; usdc: number };
      return { sol: data.sol ?? 0, usdc: data.usdc ?? 0 };
    }
  } catch {
    // fall through to direct-RPC fallback
  }
  // Fallback: direct public RPC. Not great (rate-limited) but better than
  // showing nothing if butler is unreachable.
  const [solRes, tokenRes] = await Promise.all([
    fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [walletAddress] }),
    }).then((r) => r.json()).catch(() => ({})),
    fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "getTokenAccountsByOwner",
        params: [walletAddress, { mint: USDC_MINT }, { encoding: "jsonParsed" }],
      }),
    }).then((r) => r.json()).catch(() => ({})),
  ]);
  const lamports: number = solRes?.result?.value ?? 0;
  const usdc = (tokenRes?.result?.value ?? []).reduce(
    (sum: number, account: { account: { data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } } } }) => {
      const amount = account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      return sum + (typeof amount === "number" ? amount : 0);
    },
    0,
  );
  return { sol: lamports / 1e9, usdc };
}
