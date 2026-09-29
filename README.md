<div align="center">
  <h1>atcha</h1>
  <p>Your AI comes funded. Pay anyone you can name.</p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white" alt="Next.js 16">
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind">
    <img src="https://img.shields.io/badge/Solana-Mainnet-9945FF?logo=solana&logoColor=white" alt="Solana">
  </p>
</div>

---

The web app for Atcha: an AI agent with a balance, funded every month by the $ATCHA token and sized by the agent's reputation. Pay anyone by their X or Telegram handle, checked before a cent moves. Trade with your credit, keep what it makes. Reputation, identity and every check underneath run on [SAID Protocol](https://www.saidprotocol.com).

## What's here

- **Landing** (`/`): the funded pitch, the send demo, the ladder.
- **Home**: the funded account (credit vs cash, limits, today's tasks), the reputation card.
- **Chat, Send, Wallet, Activity, Comms, Settings**: the agent surfaces.
- **Agents, Stats, Docs**: the public network pages.
- Installs as a PWA; runs as a Telegram Mini App.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind 4 with the Atcha token system in `src/app/globals.css`, Privy for login, GSAP + Lenis for the public-page motion. The app talks to the agent API over HTTP; it holds no keys and moves no money itself.

## Run it

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_BUTLER_API
npm run dev
```

## Design

The brand and app tokens are documented in the Atcha Brand canvas: cream ground, ink type, one coral accent, system type, pills and soft cards, one easing for all motion.

---

<div align="center"><sub>Atcha, by <a href="https://www.saidprotocol.com">SAID</a></sub></div>
