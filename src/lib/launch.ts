/**
 * Launch state, read on the server from the environment and nowhere else.
 *
 * The switch is the mint address. Before the token exists there is no mint,
 * so nothing in the source, the bundle or the served HTML can name it. Set
 * ATCHA_MINT (and ATCHA_TICKER for the copy) and the site is live; unset them
 * and it is back to the pre-launch state. No deploy either way.
 *
 * Pages that read this must render per request, or the pre-launch state is
 * baked into the HTML at build time and no environment change will move it.
 * The root layout is force-dynamic for exactly that reason.
 */
export interface Launch {
  /** The mint exists: the token, the ticker, the ledger and the buybacks are public. */
  launched: boolean;
  /** Credits are switched on: an agent can actually be funded today. Only ever true once launched. */
  fundingOpen: boolean;
  mint: string | null;
  ticker: string | null;
}

/**
 * Three stages, two variables. No mint: the product without the funded
 * story. Mint set: the token is real and the funded story is told as what
 * is coming. Mint set and ATCHA_FUNDING_OPEN=true: it is live. A site that
 * promised a funded account before one could be had would be lying, and a
 * judge would notice.
 */
export function getLaunch(): Launch {
  const mint = (process.env.ATCHA_MINT ?? "").trim();
  const ticker = (process.env.ATCHA_TICKER ?? "").trim();
  const launched = mint.length > 0;
  const fundingOpen = launched && process.env.ATCHA_FUNDING_OPEN === "true";
  return { launched, fundingOpen, mint: launched ? mint : null, ticker: launched && ticker ? ticker : null };
}
