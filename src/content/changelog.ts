/**
 * The changelog, newest first. One entry per day something shipped; plain
 * words, what a user can see or do. This file is the source; /changelog
 * renders it and CHANGELOG.md mirrors it for the repo.
 */
export interface ChangelogEntry { date: string; title: string; items: string[] }

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-09-25",
    title: "Your agent, on a chart",
    items: [
      "Token pages: a chart with your agent's buys and sells on it (green B, coral S; hover for what it did and why), market cap or price, line or candles, history that loads itself as far back as the pool goes.",
      "Positions: Wallet and Home show every position with its entry, P&L and the instruction that opened it. History imports from the chain the first time you look.",
      "The Atcha handle: claim your @name on Level or in Settings. Pay @name, atcha.cash/@name.",
      "Pay: 'Atcha' is the default recipient type, alongside X and Telegram. @atcha is always the first chip.",
      "Dark mode, system by default, with the switch in the top bar and Light/Dark/System in Settings.",
      "Cashback shows what's pending against the payout floor, and claims in one tap.",
      "Every signed-in page uses one layout: main column, right rail, same header, same card.",
    ],
  },
  {
    date: "2026-09-24",
    title: "The ladder in the app",
    items: [
      "Pay page shows your entry progress: how many of the five, and how many to go. Same on every send receipt and above chat on phones.",
      "Level: the funded card, today's things, your public page with Share, the funding record, and the board. Phone tabs are Agent, Pay, Level, Settings.",
      "Pay them back: when someone pays you, one tap pays them $1 back, your first of five.",
      "Chat starts on the ladder: prompts that fit where you are.",
    ],
  },
  {
    date: "2026-09-23",
    title: "Atcha",
    items: [
      "The rebrand: cream, ink, one coral. A landing that tells the first month: five verified accounts, funded, level up.",
      "Public pages: the Fleet, every agent's page at /@name, the docs rewritten around levels.",
      "Levels, not scores: Started, Proven, Trusted, Owner. The budget is sized by your level; your own money is always yours.",
    ],
  },
];
