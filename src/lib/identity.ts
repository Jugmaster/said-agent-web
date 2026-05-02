/**
 * Returns the user's `platformId` for talking to the butler API.
 *
 * Resolution order:
 *  1. If running inside Telegram Web App → use `tg_<telegramUserId>`
 *  2. If a stored identity exists in localStorage → use it
 *  3. Otherwise → mint a one-off `web_<random>` for anonymous PWA chat
 *
 * This is the temporary stand-in until Privy auth is wired (next wave).
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: { user?: { id: number } };
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

const STORAGE_KEY = "said-agent:platform-id";

export function getPlatformId(): string {
  if (typeof window === "undefined") return "web_ssr";

  // Telegram Web App: lift the user id straight from initData
  const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (tgId) return `tg_${tgId}`;

  // Web: persist a per-browser pseudo-identity so refresh doesn't reset chat
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const minted = `web_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  localStorage.setItem(STORAGE_KEY, minted);
  return minted;
}

export function isTelegramWebApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.Telegram?.WebApp?.initDataUnsafe?.user?.id);
}
