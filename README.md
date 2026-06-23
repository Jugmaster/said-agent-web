<div align="center">
  <h1>SAID Agent</h1>
  <p>
    <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white" alt="Next.js 16">
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind">
    <img src="https://img.shields.io/badge/Privy-Auth-667eea?logoColor=white" alt="Privy">
    <img src="https://img.shields.io/badge/Solana-Mainnet-9945FF?logo=solana&logoColor=white" alt="Solana">
    <img src="https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram&logoColor=white" alt="Telegram">
    <img src="https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white" alt="PWA">
  </p>
  <p>
    <a href="https://agent.saidprotocol.com"><img src="https://img.shields.io/badge/Live_App-agent.saidprotocol.com-9945FF?style=for-the-badge" alt="Live App"></a>
    &nbsp;
    <a href="https://t.me/saidinfrabot"><img src="https://img.shields.io/badge/Telegram-@saidinfrabot-26A5E4?logo=telegram&logoColor=white&style=for-the-badge" alt="Telegram Bot"></a>
  </p>
</div>

---

The web surface for SAID Agent — a personal AI agent on Solana that lives in Telegram and your browser. Each user gets their own on-chain identity, a custodial Solana wallet, and a chat-driven interface for swaps, transfers, send-by-handle, portfolio, and more. **Multi-platform (Telegram + PWA), one identity, one balance, one chat.** Auth via Privy; identity anchored on the SAID Protocol; agent execution via a butler runtime backed by OpenClaw.

## Features

| | Feature | What it does |
|---|---|---|
| 🪪 | **On-chain identity** | Every agent has a verified SAID identity (mainnet Solana) — name, wallet, reputation anchors |
| 💬 | **Chat surface** | One conversation across Telegram and the web — same agent, same history |
| 🔐 | **Privy auth** | Login with Telegram, X, email, Google, or wallet — session shared across surfaces |
| 📲 | **Telegram Mini App** | Funding flow launches inside Telegram with auto-auth via WebApp initData |
| 💰 | **Solana wallet** | Custodial Privy-managed wallet — swaps, transfers, send-by-handle, staking |
| 👤 | **Send by @handle** | "Send 0.5 SOL to @joe" — recipient pre-provisioned if not yet a user |
| 📊 | **Portfolio** | Live balances, recent activity, anchored receipts |
| 🎁 | **Invites** | One-tap claim of crypto sent before signup |

<details>
<summary><strong>Architecture</strong></summary>

<br>

```mermaid
graph LR
    User["User (Telegram / Web)"] -->|messages| PWA["Next.js PWA (agent.saidprotocol.com)"]
    PWA -->|JWT auth| Privy["Privy"]
    PWA -->|/api/chat, /api/balance| Butler["Butler HTTP API (butler.saidprotocol.com)"]
    Butler -->|spawn| Router["router.js subprocess"]
    Router -->|tool calls| Butler
    Butler -->|register, verify| Hosting["SAID Hosting (app.saidprotocol.com)"]
    Hosting -->|custodial wallet| PrivyWallet["Privy Wallet"]
    Butler -->|tx broadcast| Solana["Solana mainnet"]
```

**Stack**

```
Next.js 16 (Turbopack)              — App router, server components
TypeScript 5 / Tailwind 4            — Strict types, utility CSS
@privy-io/react-auth (root + solana) — Auth, embedded wallets, fundWallet
@solana/web3.js / @solana/kit (v5)   — Chain interactions
Telegram WebApp SDK                  — Mini App context, initData
```

**Pages**

```
src/app/
├─ page.tsx              — Marketing landing (unauthed)
├─ chat/                 — Per-user chat with the agent
├─ portfolio/            — Balance + activity
├─ send/                 — Send-by-handle UI
├─ fund/                 — Generic fund-via-Privy
├─ fund-onramp/          — Telegram Mini App fund flow (auto-auth)
├─ activity/             — On-chain receipts
├─ launches/             — X-launch directory (public)
├─ agents/[platformId]/  — Public agent profiles
├─ adopt/                — Pre-provisioned recipient claim
├─ invite/[token]/       — Invite-link landing
└─ stats/                — Protocol stats
```

</details>

## Quick Start

**Prerequisites:** Node 22+, npm

```bash
git clone https://github.com/Jugmaster/said-agent-web.git
cd said-agent-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Production:** `agent.saidprotocol.com` — Railway-hosted, auto-deploys from `main`.

## Configuration

Environment variables (`.env.local` for dev):

```bash
# Butler container HTTP API
NEXT_PUBLIC_BUTLER_API=https://butler.saidprotocol.com
# Solana RPC for client balance reads — set a real provider in prod; the public
# RPC default is rate-limited and can make balances read as empty/$0.
NEXT_PUBLIC_SOLANA_RPC=
# Server-side RPC for the /api/research route (falls back to the public RPC).
SOLANA_RPC=
```

The Privy app ID is currently hard-coded in `src/app/providers.tsx` (shared with `saidprotocol.com`).

## Companion Services

| Service | Repo | Role |
|---|---|---|
| **Butler API** | `Jugmaster/butler-container` | HTTP API, router subprocess, OpenClaw gateway, Telegram bot runtime |
| **SAID Hosting** | `SAID-Protocol/said-hosting` | Protocol API — register, verify, provision Privy wallets |
| **SAID Identity Program** | `SAID-Protocol/said` | On-chain Anchor program, mainnet |

## Important Notes

- **PWA + Telegram Mini App share the same Privy session** when launched from `@saidinfrabot`. The Mini App auto-authenticates via Telegram WebApp `initData` — no popup.
- **Agent wallets are custodial Privy wallets** provisioned by SAID Hosting. The PWA's logged-in Privy user is a separate identity that *owns* the agent via butler.db linkage.
- **Send-by-handle pre-provisions recipients** — if you send to `@bob` and Bob has never used the protocol, an agent is created for him and the funds are held in escrow until he claims.
- **AI agents can make mistakes.** Verify transactions before approving. Start with small amounts.

## Links

**Live App:** [agent.saidprotocol.com](https://agent.saidprotocol.com) · **Telegram:** [@saidinfrabot](https://t.me/saidinfrabot) · **Protocol:** [saidprotocol.com](https://www.saidprotocol.com) · **Twitter:** [@saidinfra](https://x.com/saidinfra)

---

<div align="center">
  <sub>Built on <a href="https://www.saidprotocol.com">SAID Protocol</a></sub>
</div>
