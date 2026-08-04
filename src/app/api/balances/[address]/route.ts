/**
 * Server-side balance fallback: SOL + USDC for one wallet.
 *
 * The client's primary balance source is the butler's /api/wallet-balances
 * (its own premium-RPC failover). When that fails, the client used to hit a
 * Solana RPC directly from the browser — which meant NEXT_PUBLIC_SOLANA_RPC
 * had to ship in the bundle. This route keeps the RPC server-side instead:
 * the provider URL stays in the server-only SOLANA_RPC env var (shared with
 * /api/research), and the browser only ever calls same-origin.
 */

const SOLANA_RPC =
  process.env.SOLANA_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC ??
  "https://api.mainnet-beta.solana.com";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

async function rpc<T = unknown>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`rpc ${method} ${res.status}`);
  const j = (await res.json()) as { result?: T; error?: { message: string } };
  if (j.error) throw new Error(`rpc ${method}: ${j.error.message}`);
  return j.result as T;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  if (!B58.test(address)) {
    return Response.json({ error: "invalid address" }, { status: 400 });
  }
  try {
    const [sol, tokens] = await Promise.all([
      rpc<{ value: number }>("getBalance", [address]),
      rpc<{
        value: Array<{
          account?: {
            data?: {
              parsed?: { info?: { tokenAmount?: { uiAmount?: number | null } } };
            };
          };
        }>;
      }>("getTokenAccountsByOwner", [
        address,
        { mint: USDC_MINT },
        { encoding: "jsonParsed" },
      ]),
    ]);
    const usdc = tokens.value.reduce((sum, a) => {
      const amount = a.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      return sum + (typeof amount === "number" ? amount : 0);
    }, 0);
    return Response.json({ sol: sol.value / 1e9, usdc });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "balance read failed" },
      { status: 502 },
    );
  }
}
