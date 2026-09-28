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
  launched: boolean;
  mint: string | null;
  ticker: string | null;
}

export function getLaunch(): Launch {
  const mint = (process.env.ATCHA_MINT ?? "").trim();
  const ticker = (process.env.ATCHA_TICKER ?? "").trim();
  const launched = mint.length > 0;
  return { launched, mint: launched ? mint : null, ticker: launched && ticker ? ticker : null };
}
