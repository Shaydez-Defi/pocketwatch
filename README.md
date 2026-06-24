# PocketWatch

PocketWatch is a multi-chain Web3 dashboard that analyzes gas fee spending across wallets and blockchains, prices each fee in USD, and compares totals against estimated Sui costs. Users can optionally persist analysis results on Sui testnet through a Move smart contract and contribute to a shared community savings board.

**Live demo:** https://pocketwatch-app.vercel.app

Built for the Sui hackathon. Onchain logic is implemented in Move (`pocketwatch-contract`).

## Overview

PocketWatch answers a simple question: where did your onchain money go?

The app ingests wallet transaction history or CSV exports, enriches each row with historical token pricing, and produces a breakdown of total fees paid, estimated Sui equivalents, and potential savings. Beyond raw metrics, it generates narrative insights (personalities, regrets, calendars, alternate-chain estimates) and supports optional onchain storage of analysis summaries.

All chain comparisons are estimates. They are not financial advice or live quotes.

## Features

### Data input and analysis

- **Multi-wallet support:** Add and analyze multiple addresses in one session.
- **Wallet connection:** Connect EVM wallets via browser extension (MetaMask, Rabby) or WalletConnect on mobile.
- **Address paste:** Auto-detect and fetch history for EVM (`0x…`), Solana, and Tron (`T…`) addresses.
- **Supported chains:**
  - EVM: Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base
  - Solana (native SOL fees)
  - Tron (native TRX fees)
- **CSV upload:** Parse exports with `date` and `fee`/`gas` columns; rows are priced and compared like wallet data.
- **Historical pricing:** Fees are converted to USD using DefiLlama (per-date lookups for long histories).
- **Sui comparison:** Each transaction includes an estimated Sui gas cost for side-by-side comparison.

### Dashboard and insights

- **Shock hero:** Large total-fees-paid summary with transaction count and key comparison pills.
- **Metric cards:** Total fees paid, estimated Sui cost, and estimated difference.
- **Fee chart:** Area chart comparing paid fees vs estimated Sui cost over time.
- **Your gas story** (post-analysis insights):
  - Onchain personality badge (six detected types with confidence score)
  - Top regrets (highest single-transaction fees with contextual quips)
  - Monthly gas diet (heaviest and quietest months)
  - Fee calendar heatmap
  - Alternate reality simulator (estimated costs on Sui, Solana, Base, Polygon, Arbitrum)
  - Onchain analyst (rule-based Q&A over your analysis data)
  - PocketWatch Wrapped (shareable summary card: copy, download PNG, share to X)
- **Yeti tips:** Contextual commentary based on savings and analysis results.
- **Community Savings Board:** Live totals from the Sui testnet shared object (collective savings, analysis count, biggest single save).

### Sui integration

- Connect a Sui wallet via `@mysten/dapp-kit`.
- **Save to Sui (optional):** Write analysis totals to a personal `FeeLedger` owned object.
- Updates the global `SavingsBoard` shared object on each save.
- Emits an `AnalysisSaved` event for offchain indexing.

### User experience

- Deferred launch loader (only shown when initial page load exceeds ~450ms).
- Staged wallet analysis loader with progress stages and skeleton states.
- Smooth auto-scroll to results after successful wallet analysis.
- Animated result reveal with count-up values on key dollar metrics.

## Architecture

```
Wallet address / CSV
        |
        v
Next.js dashboard (React 19, App Router)
        |
        +--> POST /api/wallets/transactions   (multi-chain gas history)
        |
        +--> POST /api/prices/enrich          (DefiLlama USD pricing + Sui estimates)
        |
        v
Insights engine (lib/insights.ts)
        |
        v
Optional: Save to Sui (PTB via @mysten/dapp-kit)
        |
        v
Move package: pocketwatch-contract (Sui testnet)
  - FeeLedger (owned object, per user)
  - SavingsBoard (shared object, global totals)
  - AnalysisSaved (event)
```

### API routes

| Route | Method | Description |
| --- | --- | --- |
| `/api/wallets/transactions` | POST | Accepts `{ addresses: string[] }`, returns parsed gas rows across detected chains. |
| `/api/prices/enrich` | POST | Accepts `{ rows: [...] }`, returns USD-priced `FeeRow` data with Sui estimates. |

### Data sources

| Data | Source |
| --- | --- |
| EVM gas history | Etherscan API V2 (if key set) or Blockscout fallback |
| Solana gas history | Solana mainnet RPC |
| Tron gas history | TronScan API |
| Token USD prices | DefiLlama (`coins.llama.fi`) |

## Smart contract

Package: `pocketwatch-contract`  
Module: `pocketwatch::fee_ledger`

| Sui concept | Implementation |
| --- | --- |
| Owned object | `FeeLedger` stores each user's latest analysis |
| Shared object | `SavingsBoard` aggregates savings across all users (created in `init`) |
| Events | `AnalysisSaved` emitted on every save |

### Entry functions

- `create_ledger(ctx)` creates a `FeeLedger` owned by the sender.
- `save_analysis(ledger, board, total_paid, sui_equivalent, savings, ctx)` updates the user's ledger, rolls values into the shared board, and emits `AnalysisSaved`.

USD amounts are stored onchain as integer cents (`u64`). The frontend multiplies by 100 before submission and divides by 100 when reading.

### Testnet deployment

| Field | Value |
| --- | --- |
| Package ID | `0xe625ad69966b5d108431b24090a17d8e8024957e60576328719a0b3797e92274` |
| SavingsBoard (shared object) | `0xc09ab88185533b830a99a83473cc2701f57ca43334d3f2293048bfb2a647d42f` |
| Network | Sui Testnet |

### Contract tests

```bash
cd pocketwatch-contract
sui move test
```

The test suite covers ledger creation, single and multiple saves, running-max logic on the board, and cross-user aggregation.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts, shadcn/ui |
| Sui client | `@mysten/dapp-kit`, `@mysten/sui`, TanStack Query |
| EVM wallets | viem, WalletConnect Ethereum Provider |
| Smart contract | Move (2024 edition), Sui framework `testnet-v1.73.1` |
| Hosting | Vercel |

## Getting started

### Prerequisites

- Node.js 20 or later
- Sui wallet browser extension with testnet SUI (required only for Save to Sui)
- Optional: [Etherscan API key](https://etherscan.io/apis) for faster EVM history
- Optional: [WalletConnect project ID](https://cloud.reown.com) for mobile EVM wallet connect

### Run locally

```bash
cd pocketwatch
npm install
npm run dev
```

Open http://localhost:3000.

Alternatively, from the repository root on Windows:

```bat
start-localhost.bat
```

### Environment variables

Create `pocketwatch/.env`:

```env
# Optional. One key covers all supported EVM chains via Etherscan API V2.
ETHERSCAN_API_KEY=your_key_here

# Optional. Enables WalletConnect on mobile browsers.
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Without `ETHERSCAN_API_KEY`, EVM history falls back to Blockscout (slower on some chains).

Without `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, mobile users can still paste wallet addresses manually.

### Build for production

```bash
cd pocketwatch
npm run build
npm start
```

### Build and test the contract

```bash
cd pocketwatch-contract
sui move build
sui move test
```

## Usage

1. **Analyze gas history**
   - Paste one or more wallet addresses and click **Analyze wallet gas**, or upload a CSV.
   - Review total fees, Sui estimates, charts, and the insights section.

2. **Connect Sui (optional)**
   - Click **Connect Sui** in the top navigation.

3. **Save to Sui (optional)**
   - After analysis, click **Save to Sui**.
   - The first save creates a personal `FeeLedger`; subsequent saves update it and the shared `SavingsBoard`.

4. **Share results (optional)**
   - Use PocketWatch Wrapped to copy a summary, download a card image, or share to X.

## Project structure

```
.
├── pocketwatch/                        # Next.js dashboard
│   ├── app/
│   │   ├── api/wallets/transactions/   # Wallet history API
│   │   ├── api/prices/enrich/          # Pricing API
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                     # UI (dashboard, insights, loaders, wallet panels)
│   ├── hooks/                          # Client hooks (e.g. count-up animation)
│   └── lib/                            # chains, explorer, pricing, insights, Sui helpers
├── pocketwatch-contract/               # Move smart contract
│   ├── sources/fee_ledger.move
│   ├── tests/
│   └── Move.toml
└── start-localhost.bat               # Windows dev shortcut
```

## Disclaimer

PocketWatch provides estimated comparisons for educational and analytical purposes. Figures depend on historical price data, sampled transaction history, and approximate per-chain gas assumptions. They should not be treated as exact quotes, investment advice, or guarantees of future savings.