/**
 * Jupiter swap integration (client-side).
 *
 * Flow: getQuote() → getSwapTransaction() returns a base64 VersionedTransaction
 * built for the user's wallet → the caller hands the decoded bytes straight to
 * Privy's signAndSendTransaction (which takes a raw Uint8Array). No @solana/web3.js
 * needed — Privy deserializes, signs with the embedded wallet, and submits.
 *
 * This path is fully self-contained in the PWA: it never touches the butler box.
 * It only works for agents whose wallet IS the Privy embedded Solana wallet
 * (pwa_/tw_ agents) — custodial tg_ agents trade via the box instead.
 */

/** Well-known mints + decimals. Extend when custom-token support lands. */
export const TOKENS = {
  SOL: { mint: "So11111111111111111111111111111111111111112", decimals: 9, symbol: "SOL" },
  USDC: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, symbol: "USDC" },
} as const;

export type TokenKey = keyof typeof TOKENS;

// Jupiter swap API base. Override via NEXT_PUBLIC_JUP_API if the endpoint moves
// (Jupiter has migrated hosts before — keep this configurable).
const JUP_API = process.env.NEXT_PUBLIC_JUP_API ?? "https://lite-api.jup.ag/swap/v1";

export interface JupQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: unknown[];
  // Jupiter returns more fields; we keep the whole object to POST back to /swap.
  [k: string]: unknown;
}

async function readErr(res: Response): Promise<string> {
  return (await res.text().catch(() => "")).slice(0, 300);
}

/** Get a route quote. `amount` is in base units of the input mint. */
export async function getQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string | number;
  slippageBps?: number;
  platformFeeBps?: number;
}): Promise<JupQuote> {
  const qs = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: String(params.amount),
    slippageBps: String(params.slippageBps ?? 100),
  });
  if (params.platformFeeBps) qs.set("platformFeeBps", String(params.platformFeeBps));
  const res = await fetch(`${JUP_API}/quote?${qs.toString()}`);
  if (!res.ok) throw new Error(`Quote failed (${res.status}): ${await readErr(res)}`);
  return (await res.json()) as JupQuote;
}

/**
 * Build the swap transaction for `userPublicKey`. Returns the base64
 * VersionedTransaction Jupiter produced. `feeAccount` (a token account owned by
 * the treasury for the fee mint) enables the platform fee when set.
 */
export async function getSwapTransaction(params: {
  quote: JupQuote;
  userPublicKey: string;
  feeAccount?: string;
}): Promise<string> {
  const res = await fetch(`${JUP_API}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: params.quote,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      ...(params.feeAccount ? { feeAccount: params.feeAccount } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Swap build failed (${res.status}): ${await readErr(res)}`);
  const json = (await res.json()) as { swapTransaction?: string; error?: string };
  if (!json.swapTransaction) throw new Error(json.error ?? "No swapTransaction returned");
  return json.swapTransaction;
}

/** base64 → Uint8Array (browser-safe) for Privy's signAndSendTransaction. */
export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** UI amount (e.g. 1.5 SOL) → integer base units string for the quote API. */
export function toBaseUnits(amount: number, decimals: number): string {
  // Avoid float drift: work in string space via a scaled BigInt.
  if (!Number.isFinite(amount) || amount <= 0) return "0";
  const [whole, frac = ""] = amount.toString().split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${whole}${fracPadded}`.replace(/^0+/, "") || "0";
  return combined;
}

/** Base units → UI number for display. */
export function fromBaseUnits(amount: string | number, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

/** Encode bytes (e.g. a tx signature) to base58 — for Solscan links. Dep-free. */
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function bytesToBase58(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  return "1".repeat(zeros) + digits.reverse().map((d) => B58[d]).join("");
}
