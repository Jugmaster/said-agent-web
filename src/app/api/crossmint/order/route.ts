/**
 * Crossmint Embedded Onramp — server-side order creation.
 *
 * Crossmint's Embedded Onramp does NOT support client-side order creation
 * ("Client-side order creation is not supported for Embedded Onramp"), so the
 * order MUST be minted here with a SERVER-side key (sk_…) before the browser
 * widget can render it. The client posts { walletAddress, amount, receiptEmail },
 * we create the order, and return only { orderId, clientSecret } for the
 * CrossmintEmbeddedCheckout component to consume in existing-order mode.
 *
 * CROSSMINT_SERVER_API_KEY is a SECRET — server-only, never NEXT_PUBLIC. It must
 * be the SAME environment (production/staging) as the client key the widget uses
 * (NEXT_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY), or the order won't render.
 */

// Solana mainnet USDC — the token delivered to the agent wallet.
const USDC_SOLANA = "solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const SERVER_KEY = process.env.CROSSMINT_SERVER_API_KEY;

// Base58 Solana address shape (no 0, O, I, l).
const ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Match the API host to the key's environment so a staging key never hits prod
// (or vice-versa). Crossmint keys are prefixed sk_staging_… / sk_production_….
function apiBase(key: string): string {
  return key.includes("staging")
    ? "https://staging.crossmint.com"
    : "https://www.crossmint.com";
}

export async function POST(request: Request): Promise<Response> {
  if (!SERVER_KEY) {
    return Response.json(
      { error: "Crossmint on-ramp isn't configured (CROSSMINT_SERVER_API_KEY unset)." },
      { status: 500 },
    );
  }

  let body: { walletAddress?: string; amount?: string | number; receiptEmail?: string } = {};
  try {
    body = JSON.parse(await request.text());
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const walletAddress = String(body.walletAddress ?? "").trim();
  if (!ADDRESS_RE.test(walletAddress)) {
    return Response.json({ error: "valid Solana walletAddress required" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  const receiptEmail = String(body.receiptEmail ?? "").trim();
  if (!receiptEmail || !receiptEmail.includes("@")) {
    return Response.json({ error: "receiptEmail required" }, { status: 400 });
  }

  let res: globalThis.Response;
  try {
    res = await fetch(`${apiBase(SERVER_KEY)}/api/2022-06-09/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": SERVER_KEY },
      body: JSON.stringify({
        lineItems: [
          {
            tokenLocator: USDC_SOLANA,
            executionParameters: { mode: "exact-in", amount: String(amount) },
          },
        ],
        payment: { method: "card", receiptEmail },
        recipient: { walletAddress },
      }),
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "network error reaching Crossmint" },
      { status: 502 },
    );
  }

  const data = (await res.json().catch(() => ({}))) as {
    order?: { orderId?: string };
    clientSecret?: string;
    message?: string;
  };

  if (!res.ok) {
    return Response.json(
      { error: data?.message || "Crossmint order creation failed" },
      { status: res.status },
    );
  }

  const orderId = data.order?.orderId;
  const clientSecret = data.clientSecret;
  if (!orderId || !clientSecret) {
    return Response.json(
      { error: "Crossmint order created but response was missing orderId/clientSecret" },
      { status: 502 },
    );
  }

  return Response.json({ orderId, clientSecret });
}
