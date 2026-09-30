# Cut — Phase 0

Film crowdfunding dapp shell on **Robinhood Chain** (chain ID `4663`).  
Ticker: **$CUT**. Cream / charcoal indie UI from the Phase 0 wireframes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- wagmi + viem + **ConnectKit** for wallet connect

## Install

```bash
cd web   # from the Cut repo root (/workspace/cut/web)
npm install
```

## Run (dev)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Connect wallet on Robinhood Chain

1. Click **Connect Wallet** in the top nav (ConnectKit).
2. Choose an injected wallet (e.g. MetaMask) or WalletConnect.
3. The app is configured for a single chain:
   - **Name:** Robinhood Chain
   - **Chain ID:** `4663`
   - **RPC:** `https://rpc.mainnet.chain.robinhood.com`
   - **Currency:** ETH
   - **Explorer:** [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com)
4. If your wallet is on another network, ConnectKit / wagmi will prompt you to switch / add chain `4663`.

### Optional WalletConnect project ID

For mobile WalletConnect sessions, copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_from_cloud.walletconnect.com
```

Local demo with browser-injected wallets works without this (a placeholder ID is used). No secrets are required to install or run locally.

## What’s in Phase 0

- Cut branding placeholders (`Cut`, `$CUT`, cream/charcoal)
- Top nav: logo, Hot / New, search (disabled), Upload, Connect Wallet
- Home: hero + static film card grid + trending rail
- Film detail pages (`/film/[id]`) with funding summary
- **Progress / BTS** feed on each film (localStorage MVP; filmmaker-only compose)
- `/upload` placeholder
- `/legal` experimental / not-financial-advice disclaimer
- No backend, no contracts, no secrets required to run locally

## Progress / BTS (MVP)

- Open a film (e.g. [A Place Between](/film/1)) — sample BTS posts are seeded.
- Everyone can read the chronological feed.
- Connect a wallet, then **Claim filmmaker (local demo)** (or match the mock owner wallet) to post notes, image URLs / file previews, or YouTube Shorts links; delete your own posts.
- Data lives in `localStorage` (`cut:bts:*`) via `src/lib/bts.ts` — swap for an API later without changing the UI.

## Key paths

| Path | Role |
|------|------|
| `src/lib/chain.ts` | Robinhood Chain (`4663`) definition |
| `src/lib/wagmi.ts` | ConnectKit / wagmi config |
| `src/lib/mock-films.ts` | Static film card data + owners |
| `src/lib/bts.ts` | BTS types, seed data, localStorage helpers |
| `src/components/BtsFeed.tsx` | Progress / BTS feed + composer |
| `src/components/Nav.tsx` | Top navigation + ConnectKitButton |
| `src/components/Providers.tsx` | Wagmi / React Query / ConnectKit |
| `src/app/page.tsx` | Home |
| `src/app/film/[id]/page.tsx` | Film detail + BTS |
| `src/app/legal/page.tsx` | Disclaimer |

## Disclaimer

Experimental product. Not financial advice. See [/legal](/legal).
