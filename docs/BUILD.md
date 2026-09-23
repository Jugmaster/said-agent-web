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
| 1.7 | Guard the five open money tools: `send_to_contact`, `bridge_usdc`, `purch_buy`, DCA/limit fills, launch | `src/agent/butler.ts` | [~] execute_swap, transfer_usdc, transfer_sol guarded; the five remain |
| 1.8 | Two-phase funding (pending, then confirm) so a crash never double-funds | `src/credits/funding.ts` | [ ] |
| 1.9 | Deposit detection wired to `recordDeposit` (on-ramp and wallet snapshot), net of claimed sends and cashback | `src/scheduler/deposit-monitor.ts` | [ ] |
| 1.10 | Sender funding bonus on recipient activation, capped per month | `src/credits/entry.ts` + funding | [ ] |
| 1.11 | Profit withdrawal at rung 2: realised gains above funded, split, monthly | `src/credits/guards.ts` `canWithdraw` | [ ] |
| 1.12 | Reclaim untouched credit after 14 days | `src/credits/funding.ts` | [ ] |
| 1.13 | Batched buy-and-stake of $ATCHA from fees at a threshold, public receipt | `src/scheduler/x-launch-sweep.ts` or new | [ ] |
| 1.14 | Ring test: six accounts, every extraction path, ends with zero withdrawable and nobody above rung 0 | `tests/credits.ring.test.ts` | [ ] |
| 1.15 | Read API for the app: level, funding, allowance, tasks, events, today's funding | `src/credits/api.ts`, `src/http/server.ts` | [x] (rename rung→level in payload: [ ]) |
| 1.16 | Independent review of 1.1–1.14 by someone who did not write it | — | [ ] (C) |

## 2. Butler: deploy

| # | Step | Status |
| --- | --- | --- |
| 2.1 | Pool wallet (hosting-signable) and team wallet created; env set: `CREDITS_ENABLED`, `CREDIT_POOL_*`, funding sizes | [ ] (C) |
| 2.2 | Surgical deploy of the credits module and routes to the box, dry-run on | [ ] |
| 2.3 | Five house accounts (the Fleet) at rung 1, `force`-funded, small, dry-run off for them only | [ ] |
| 2.4 | Dry-run off for everyone once 1.14 and 1.16 pass and the solicitor has answered | [ ] (C) |

## 3. App

| # | Step | Status |
| --- | --- | --- |
| 3.1 | Atcha design system, landing, motion, public pages, dashboard cards, icons | [x] |
| 3.2 | Vocabulary pass: rung → level, "reputation" off every user surface, every rule as a capability that grows | [ ] |
| 3.3 | Landing: capabilities-first hero and sections (trade anything, hold the S&P, pay anyone by name, buy things, DCA); "comes funded" as the promise; the counter | [ ] |
| 3.4 | Home: the level card (funding this month, allowance today, what the next level unlocks), the five-people progress at level 1 | [ ] |
| 3.5 | Recipient's first screen: "@name paid you $1. This is your Atcha. Pay five people and it gets funded." | [ ] |
| 3.6 | Public agent page `atcha.cash/@name`: level, months funded, P&L, who they've paid; the share card | [ ] |
| 3.7 | Fleet page: five house agents, leaderboard, live P&L | [ ] |
| 3.8 | Docs rewritten to the final mechanic in the level vocabulary; the paper-account decision reflected | [ ] |
| 3.9 | Mobile nav menu; remaining SAID references (`sw.js`, manifest start_url) | [ ] |
| 3.10 | Merge to main and point `atcha.cash` at the app, in one move, when 2.3 is live | [ ] (C) |

## 4. Token and launch

| # | Step | Status |
| --- | --- | --- |
| 4.1 | Solicitor paragraph sent (spec §10) | [ ] (C) |
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

1. Butler 1.4 tests → 1.5 → 1.6 → 1.7 → 1.14 (the ring must pass before anything moves).
2. App 3.2 → 3.3 → 3.4 → 3.5 (the vocabulary and the first screens).
3. Butler 1.8 → 1.9 → 1.10 → 1.11 → 1.12 → 1.13.
4. Deploy 2.1 → 2.2 → 2.3; app 3.6 → 3.7 → 3.8.
5. Launch 4.x; then 2.4 when cleared.
