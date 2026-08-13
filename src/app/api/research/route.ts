/**
 * IDLE Protocol seller endpoint — SAID's "research" task.
 *
 * IDLE proxies a paid buyer request here (after x402 payment clears) and
 * returns our response to the buyer. The task: deterministic on-chain
 * analysis of a Solana wallet or mint — verifiable signals (account age,
 * activity, balance, token holdings) plus a clearly-PROVISIONAL v0 score.
 *
 * All inputs are public on-chain data, so the output is reproducible (anyone
 * can recompute it). The score is v0 — SAID's reputation model isn't finalised,
 * so we surface the raw signals as the durable layer and label the score
 * provisional. Read-only: no secrets, no funds, no writes.
 */

// Server-only. No NEXT_PUBLIC_ fallback — if that var were ever set, the keyed
// provider URL would ship in the client bundle for no benefit here.
const SOLANA_RPC = process.env.SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";

// Optional shared secret. When RESEARCH_API_KEY is set, callers must send it
// as `x-api-key` (configure the same value on the IDLE seller side). Unset →
// open, but still rate-limited below.
const API_KEY = process.env.RESEARCH_API_KEY;

// Each request fans out to 3 RPC calls against a possibly-metered provider, so
// an open endpoint needs a spend ceiling: per-IP and global token windows.
// In-memory is fine — prod is a single Railway instance.
const MAX_BODY_BYTES = 4096;
const WINDOW_MS = 60_000;
const PER_IP_LIMIT = 10;
// Global cap = spend ceiling only. Keep it well above PER_IP so one attacker
// exhausting their own bucket can't lock out every legitimate caller.
const GLOBAL_LIMIT = 300;
const ipHits = new Map<string, { count: number; resetAt: number }>();
let globalHits = { count: 0, resetAt: 0 };

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (now > globalHits.resetAt) globalHits = { count: 0, resetAt: now + WINDOW_MS };
  if (++globalHits.count > GLOBAL_LIMIT) return true;
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    if (ipHits.size > 10_000) ipHits.clear();
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  return ++entry.count > PER_IP_LIMIT;
}

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const B58 = /[1-9A-HJ-NP-Za-km-z]{32,44}/;

async function rpc<T = unknown>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`rpc ${method} ${res.status}`);
  const j = (await res.json()) as { result?: T; error?: { message: string } };
  if (j.error) throw new Error(`rpc ${method}: ${j.error.message}`);
  return j.result as T;
}

/** Pull a Solana address out of whatever shape IDLE/the buyer forwards. */
function extractAddress(body: unknown): string | null {
  const b = (body ?? {}) as Record<string, unknown>;
  for (const k of ["wallet", "address", "mint", "target", "input", "query", "prompt", "text"]) {
    const v = b[k];
    if (typeof v === "string") {
      const m = v.match(B58);
      if (m) return m[0];
    }
  }
  try {
    const m = JSON.stringify(body).match(B58);
    if (m) return m[0];
  } catch {}
  return null;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

async function analyze(address: string) {
  const nowSec = Math.floor(Date.now() / 1000);

  // Activity + age + recency from signature history (capped at 1000).
  const sigs = await rpc<Array<{ blockTime: number | null }>>(
    "getSignaturesForAddress",
    [address, { limit: 1000 }],
  ).catch(() => [] as Array<{ blockTime: number | null }>);
  const txCount = sigs.length;
  const newest = sigs.find((s) => s.blockTime)?.blockTime ?? null;
  const oldest = [...sigs].reverse().find((s) => s.blockTime)?.blockTime ?? null;
  const ageDays = oldest ? Math.floor((nowSec - oldest) / 86400) : 0;
  const lastActiveDays = newest ? Math.floor((nowSec - newest) / 86400) : null;

  // SOL balance.
  const lamports = await rpc<{ value: number }>("getBalance", [address])
    .then((r) => r.value)
    .catch(() => 0);
  const solBalance = lamports / 1e9;

  // Distinct SPL token holdings (nonzero).
  let tokenHoldings = 0;
  try {
    const accs = await rpc<{ value: unknown[] }>("getTokenAccountsByOwner", [
      address,
      { programId: TOKEN_PROGRAM },
      { encoding: "jsonParsed" },
    ]);
    tokenHoldings = (accs.value as Array<{ account?: { data?: { parsed?: { info?: { tokenAmount?: { uiAmount?: number } } } } } }>)
      .filter((a) => (a.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0) > 0).length;
  } catch {}

  // PROVISIONAL v0 score — transparent, recomputable. Not SAID's final model.
  const comp = {
    age: clamp((ageDays / 180) * 25, 0, 25),
    activity: clamp((Math.min(txCount, 1000) / 1000) * 25, 0, 25),
    recency: lastActiveDays == null ? 0 : clamp(20 - lastActiveDays, 0, 20),
    holdings: clamp(tokenHoldings * 3, 0, 15),
    balance: solBalance > 0.00089 ? 15 : solBalance > 0 ? 7 : 0,
  };
  const score = Math.round(comp.age + comp.activity + comp.recency + comp.holdings + comp.balance);

  return {
    address,
    signals: {
      accountAgeDays: ageDays,
      txCount: txCount >= 1000 ? "1000+" : txCount,
      lastActiveDays,
      solBalance: +solBalance.toFixed(6),
      tokenHoldings,
    },
    score: {
      value: clamp(score),
      version: "v0-provisional",
      note: "Provisional heuristic — SAID's reputation model is not finalised. Raw signals above are the durable, verifiable layer.",
      components: Object.fromEntries(Object.entries(comp).map(([k, v]) => [k, +v.toFixed(1)])),
    },
    evidence: { solscan: `https://solscan.io/account/${address}` },
    computedAt: new Date().toISOString(),
    methodology: "Recomputable from public Solana RPC: getSignaturesForAddress, getBalance, getTokenAccountsByOwner.",
  };
}

export async function POST(request: Request) {
  if (API_KEY && request.headers.get("x-api-key") !== API_KEY) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  // Trusted IP: platform-set x-real-ip, else the LAST x-forwarded-for entry —
  // proxies append the true client, the FIRST entry can be attacker-supplied.
  const xff = request.headers.get("x-forwarded-for");
  const ip =
    request.headers.get("x-real-ip")?.trim() ??
    (xff ? xff.split(",").pop()!.trim() : "unknown");
  if (rateLimited(ip)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }
  let body: unknown = {};
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return Response.json({ error: "body too large" }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {}
  const address = extractAddress(body);
  if (!address) {
    return Response.json(
      { error: "No Solana address found in request. Provide { wallet | address | mint | query } containing a base58 address." },
      { status: 400 },
    );
  }
  try {
    const result = await analyze(address);
    return Response.json({ ok: true, task: "research", ...result });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "analysis failed" },
      { status: 502 },
    );
  }
}

export async function GET() {
  return Response.json({
    service: "SAID Research Agent",
    task: "On-chain analysis of a Solana wallet/mint → verifiable signals + provisional reputation score.",
    usage: "POST { wallet | address | mint | query: '<base58 address>' }",
    provider: "SAID Protocol",
  });
}
