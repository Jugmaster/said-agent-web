# Atcha: build plan, end to end

The product in one sentence: **an AI agent with a balance that the $ATCHA token funds every month, and the funding grows with the agent's level.** Users see a level; the level is an on-chain record underneath (SAID). This document is the order of work to ship it, across the two codebases, with what is done, what is next, and who owns each step.

Dates: register and tokenize on ClawPump by **1 October 24:00 EST**. Judging **28 September to 7 October**. Winner **8 October**.

Codebases:
- **app** (this repo, `atchacash/app`): the Next.js web app. Mirrored to `Jugmaster/said-agent-web` branch `atcha` until staging is repointed.
- **butler** (`said-butler`, private): the agent runtime and HTTP API. Credits live in `src/credits/`. Production runs on a hand-deployed box; nothing here is live until it is deployed there.

Status key: `[x]` done · `[ ]` to do · `[~]` in progress · `(C)` needs Callum

---

## 0. Decisions already made

- Entry: five sends by handle, $1 minimum each, from own money, to five distinct people who verify by claiming and then do one thing of their own. Unlocks level 2 (funding and the first trade allowance).
- Funding: monthly, in SOL, ledgered in dollars, sized by level. No lock tier (dropped 23 Sept on Bunny's feedback).
- Credit trades majors, $ANSEM, $CLAW, ClawPump-ecosystem tokens and xStocks. No whitelist; general rules for every token: liquidity floor, age floor, per-token cap, aggregate cap on non-majors, passport check on xStocks. Spot only.
- Money out: own money any time; realised profits above the funded amount at level 3, on a split; the funded principal never.
- Sender funding bonus in credit when a paid recipient activates.
- Token: creator rewards fund the pool; funding never pays in $ATCHA; agents' trading fees buy and stake $ATCHA in batches with a public receipt; no burn, no yield, no airdrops.
- Vocabulary: users see **level 1 / 2 / 3 / 4** (internally rung 0–3). "Reputation" is never on a user surface. "Credit" is the funded money; "cash" is theirs.
- Every rule is written as a capability that grows, never as a limit.

The full spec: the "Atcha Product Spec" doc (Claude Docs). The simulation behind the sizes is section 12 there.

---

## 1. Butler: the mechanic

| # | Step | Where | Status |
| --- | --- | --- | --- |
| 1.1 | Ledger, guards, daily tasks, ladder, drawdown pause, limits | `src/credits/{ledger,guards,tasks}.ts` | [x] |
| 1.2 | Entry rule: settled sends recorded in dollars at claim; distinct identity clusters; recipient activation; rung 1 on five | `src/credits/entry.ts`, claim hooks in `src/social/send.ts` | [x] ba12d23 |
| 1.3 | Signup no longer funds; first funding on reaching rung 1 | `src/identity/provisioning.ts`, `src/credits/tasks.ts` | [x] |
| 1.4 | Monthly funding: size table by rung, idempotent per month, pool budget with reserve, funding-day timer | `src/credits/funding.ts` | [x] 8cfa5d6 |
| 1.5 | Trading rules v2: per-token cap, aggregate non-major cap, liquidity and age floors, passport check on xStocks, no whitelist | `src/credits/guards.ts` | [x] (floor is $100K: $CLAW itself sits at ~$190K liquidity, so $250K would exclude the ecosystem token) |
| 1.6 | Spend guard: pays/buys/hires only from own money (amount ≤ withdrawable) | `src/credits/guards.ts` `canSpend` | [x] wired for transfer_usdc/transfer_sol by handle |
| 1.7 | One gate for every money path: swaps (chat, DCA fills, limit fills, staking), sends by handle, contacts, bridges, AgentCash, cross-chain, purchases | `src/credits/gate.ts`, `src/agent/butler.ts`, `src/dca/executor.ts`, `src/limit/executor.ts` | [x] (no launch tool exists in the chat agent; purchases are gated on having own money, since the price is only known after checkout: quote-before-buy is a follow-up) |
| 1.8 | Two-phase funding (pending, then confirm) so a crash never double-funds | `src/credits/funding.ts` | [x] `pendingFundings()` lists what needs a human |
| 1.9 | Deposit detection: a claimed send is the recipient's cash; daily snapshot deltas on days with no swap | `src/credits/deposits.ts`, `entry.ts`, `wallet-snapshot.ts` | [x] swap days are skipped, not guessed; on-ramp orders land as the next quiet day's delta |
| 1.10 | Sender funding bonus on recipient activation, capped per month | `src/credits/funding.ts` `activationBonusUsd` | [x] $10 per activated person, five a month, folded into next month's funding |
| 1.11 | Profit withdrawal at rung 2: gains above funded, split | `src/credits/ledger.ts` `computePosition(rung)` | [x] 80% of gains withdrawable from level 3; principal at level 4 |
| 1.12 | Reclaim untouched credit after 14 days | `src/credits/funding.ts` `reclaimUntouched` | [x] daily at 04:00 UTC behind the flag; only the last funding, only what is left, never cash |
| 1.13 | Batched buy-and-stake of $ATCHA from fees at a threshold, public receipt | new scheduler | [ ] blocked on the $ATCHA mint existing |
| 1.14 | Ring test: six accounts, every extraction path, ends with zero withdrawable and nobody above rung 0 | `tests/credits.ring.test.mts` (`npm run test:credits:ring`) | [x] passes; plus the ring that spends real money earns rung 1 and can take out only what it put in |
| 1.15 | Read API for the app: level, funding, allowance, tasks, events, today's funding | `src/credits/api.ts`, `src/http/server.ts` | [x] level, levelName, next, funding added (9f15064) |
| 1.16 | Independent review of 1.1–1.14 by someone who did not write it, brief in `docs/REVIEW.md` | — | [ ] (C) |
| 1.17 | One funding day for everyone: entry queues for the next funding day; `forecast()` = what is due, what the pool holds, the top-up in SOL; ops told at T-7/3/1; `GET /api/credits/forecast` | `funding.ts`, `tests/credits.funding.test.ts` | [x] 23 Sept |

## 2. Butler: deploy

| # | Step | Status |
| --- | --- | --- |
| 2.1 | Pool wallet (hosting-signable) and team wallet created; env set: `CREDITS_ENABLED`, `CREDIT_POOL_*`, funding sizes | [ ] (C) |
| 2.2 | Surgical deploy of the credits module and routes to the box, dry-run on | [ ] |
| 2.3 | Ops wired: `CREDIT_OPS_PLATFORM_IDS` (who gets the T-7/3/1 forecast), `CREDIT_OPS_TOKEN` (for `GET /api/credits/forecast`); first forecast read and the pool topped up to it | [ ] (C) |
| 2.4 | Dry-run off for everyone once 1.14 and 1.16 pass | [ ] (C) |

## 3. App

| # | Step | Status |
| --- | --- | --- |
| 3.1 | Atcha design system, landing, motion, public pages, dashboard cards, icons | [x] |
| 3.2 | Vocabulary pass: rung → level, "reputation" off every user surface, every rule as a capability that grows | [x] level card, cashback card, tasks, landing, Docs. Stats and link-agent (network/developer pages) still say reputation on purpose |
| 3.3 | Landing: capabilities-first hero and sections (trade anything, hold the S&P, pay anyone by name, buy things, DCA); "comes funded" as the promise; the counter | [x] |
| 3.4 | Home: the level card (funding this month, allowance today, what the next level unlocks), the five-people progress at level 1 | [x] reads `level`, `next`, `funding` from the API (butler 9f15064) |
| 3.5 | Recipient's first screen: "@name paid you $1. This is your Atcha. Pay five people and it gets funded." | [x] the invite claim page |
| 3.6 | Public agent page `atcha.cash/@name`: level, months funded, P&L, people paid, funding record; `/@name` rewrites to `/u/[handle]`; OG tags = the share card | [x] |
| 3.7 | Fleet page `/fleet`: the top funded real accounts (or `CREDIT_FLEET_IDS` if pinned), leaderboard by result, 30s refresh, Nav link | [x] |
| 3.8 | Docs rewritten to the final mechanic in the level vocabulary; the paper-account decision reflected | [x] levels, no lock tier, "What's underneath" names SAID for developers; paper account still open |
| 3.9 | Mobile nav menu; remaining SAID references (`sw.js`, manifest start_url) | [ ] |
| 3.10 | Merge to main and point `atcha.cash` at the app, in one move, when 2.4 is live | [ ] (C) |

## 4. Token and launch

| # | Step | Status |
| --- | --- | --- |
| 4.1 | Independent review of `src/credits/` against `docs/REVIEW.md` in said-butler, before the token launches | [ ] (C) |
| 4.2 | X account renamed to Atcha; keys audited; public sends by handle from the timeline through the same rules | [ ] (C) + butler |
| 4.3 | Stream slot with ClawPump in the judging window | [ ] (C) |
| 4.4 | Token live on ClawPump by 1 Oct; MM briefed on the mechanic (funds agents; bought by their trading; no lock tier) | [ ] (C) |
| 4.5 | Launch: Fleet live, first-hundred race announced, funding-day cadence set | [ ] |

## 5. Open decisions

- Rung 0 paper account: yes or no (changes 3.4 and 3.5).
- Exact size table after the first real month (spec §2 proposal: 25 / 75 / by review).
- Floors and caps: coded as $100K liquidity, 7 days, 25% per token, 25% aggregate non-major (env-overridable). The spec said $250K; $CLAW would fail that.
- Profit split and the level-3 threshold (proposal 80/20, 30-day streak).
- Sender bonus cap (proposal $10 per activated person, five a month).
- Buy-and-stake threshold (proposal $1,000 or monthly).

## 6. Order of work, from here

1. ~~Butler 1.4 → 1.5 → 1.6 → 1.7 → 1.14~~ done 23 Sept.
2. App 3.2 → 3.3 → 3.4 → 3.5 (the vocabulary and the first screens).
3. ~~Butler 1.8 → 1.9 → 1.10 → 1.11 → 1.12~~ done 23 Sept; 1.13 waits for the mint.
4. Deploy 2.1 → 2.2 → 2.3; app 3.6 → 3.7 → 3.8.
5. Launch 4.x; then 2.4 when cleared.
