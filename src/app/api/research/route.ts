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

const SOLANA_RPC =
  process.env.SOLANA_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC ??
  "https://api.mainnet-beta.solana.com";

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
  let body: unknown = {};
  try {
    body = await request.json();
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
