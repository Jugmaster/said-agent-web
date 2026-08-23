/**
 * Which card on-ramp provider to hand a given user.
 *
 * There is no KYC-free fiat on-ramp. Converting fiat to crypto is regulated
 * money transmission, so every provider verifies identity; what differs is
 * friction (manual document upload vs checks run silently off the card data)
 * and the threshold at which the heavier check kicks in. The genuinely
 * KYC-free way to fund is depositing crypto to the address, which the fund UI
 * offers alongside this and which most crypto-native users will prefer.
 *
 * Coverage is not uniform, which is why this is per-user rather than one
 * global default:
 *   - MoonPay does not serve the UK at all.
 *   - Coinbase Onramp covers everywhere Coinbase operates EXCEPT Japan, and
 *     carries Apple Pay / Google Pay inside its widget.
 * Whatever we prefer, the Privy modal still lets the user switch to any other
 * provider enabled in the dashboard, so this only picks the opening move.
 */

export type CardProvider = "coinbase" | "moonpay";

/** MoonPay cannot serve these, so Coinbase is the only workable option. */
const NO_MOONPAY = new Set(["GB"]);

/** Coinbase Onramp does not operate here, so MoonPay is the fallback. */
const NO_COINBASE = new Set(["JP"]);

/** Best-effort ISO country from the browser. Never throws; unknown → null. */
export function guessCountry(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const locales = [
      ...(navigator.languages ?? []),
      navigator.language,
    ].filter(Boolean) as string[];
    for (const loc of locales) {
      const region = new Intl.Locale(loc).region;
      if (region) return region.toUpperCase();
    }
  } catch {
    /* fall through to timezone */
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (tz === "Europe/London") return "GB";
    if (tz.startsWith("Asia/Tokyo")) return "JP";
  } catch {
    /* unknown */
  }
  return null;
}

/**
 * Opening provider for this user. Coinbase is the default because its
 * footprint is wider and it carries wallet-pay, but a user in a region it
 * does not serve gets MoonPay instead, and vice versa. Unknown region keeps
 * the wider-coverage default.
 */
export function preferredCardProvider(
  country: string | null = guessCountry(),
): CardProvider {
  if (country && NO_COINBASE.has(country)) return "moonpay";
  if (country && NO_MOONPAY.has(country)) return "coinbase";
  return "coinbase";
}
