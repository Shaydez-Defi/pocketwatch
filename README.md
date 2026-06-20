# 🏔️ PocketWatch

> Track how much you've **lost to gas fees** across every chain — and exactly how much you'd have **saved on Sui**. Then prove it on-chain.

PocketWatch is a Web3 dashboard that reads your real transaction history across multiple blockchains, prices each gas fee in USD, and compares it against what the *same activity* would have cost on **Sui**. When the numbers hurt, you can save your analysis to the Sui blockchain — contributing to a live, shared **Community Savings Board** that aggregates how much everyone collectively would have saved.

Built for the Sui hackathon. The core on-chain logic is written in **Move**.

---

## ✨ Features

- **Multi-chain gas analysis** — paste any wallet address (or connect MetaMask/Rabby) and the app auto-detects the chain and pulls real gas history:
  - **EVM:** Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base
  - **Solana** (native SOL fees)
  - **Tron** (native TRX fees)
- **CSV upload** — already have an export? Drop in a CSV and we'll parse and price it.
- **Sui comparison** — every fee is converted to USD and stacked against Sui's near-zero gas, so you see *Total Paid*, *Sui Would've Charged*, and *You Would've Saved*.
- **Save to Sui** — connect a Sui wallet (via `@mysten/dapp-kit`) and write your analysis on-chain to a personal ledger.
- **Community Savings Board** — a single **shared object** on Sui that aggregates total savings across *all* users, updates live, and emits an event on every save.

---

## 🧱 How it works

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js dashboard (frontend)                                │
│                                                              │
│  Wallet address / CSV ──► detect chain ──► fetch gas history │
│         │                                                    │
│         ▼                                                    │
│  price each fee in USD (DefiLlama)  ──►  compare vs. Sui     │
│         │                                                    │
│         ▼                                                    │
│  "Save to Sui"  ──────────────────────────────┐             │
└────────────────────────────────────────────────┼────────────┘
                                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Move contract on Sui testnet  (fee_ledger)                  │
│                                                              │
│   FeeLedger   (owned)   ── your latest analysis              │
│   SavingsBoard (shared) ── community totals, updated by all  │
│   AnalysisSaved (event) ── emitted on every save             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⛓️ The Move smart contract

The `fee_ledger` package (module `yeti::fee_ledger`) showcases three core Sui Move concepts:

| Concept | Where |
| --- | --- |
| **Owned object** | `FeeLedger` — each user's personal, latest analysis |
| **Shared object** | `SavingsBoard` — one global object, written to by every user, created in `init` |
| **Events** | `AnalysisSaved` — emitted on each save for off-chain indexing |

**Key functions**

- `create_ledger(ctx)` — mints a personal `FeeLedger` owned by the caller.
- `save_analysis(ledger, board, total_paid, sui_equivalent, savings, ctx)` — records the analysis to the user's ledger **and** rolls it into the shared board (running total, biggest single save), then emits `AnalysisSaved`.

USD values are stored as integer **cents** (`u64`) on-chain — the frontend multiplies by 100 before sending and divides by 100 when reading.

### Deployment (Sui testnet)

| | |
| --- | --- |
| **Package ID** | `0xe625ad69966b5d108431b24090a17d8e8024957e60576328719a0b3797e92274` |
| **SavingsBoard (shared object)** | `0xc09ab88185533b830a99a83473cc2701f57ca43334d3f2293048bfb2a647d42f` |
| **Network** | Sui Testnet |

### Tests

The contract ships with a Move unit-test suite (`sui::test_scenario`) covering ledger creation, single/multiple saves, the running-max logic, and **cross-user aggregation** on the shared board.

```bash
cd fee_ledger
sui move test
# Test result: OK. Total tests: 4; passed: 4; failed: 0
```

---

## 🛠️ Tech stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, Recharts
- **Sui:** `@mysten/dapp-kit`, `@mysten/sui`, `@tanstack/react-query`
- **Smart contract:** Move (2024 edition), Sui framework `testnet-v1.73.1`
- **Pricing data:** DefiLlama; **gas history:** Etherscan V2 / Blockscout (EVM), Solana RPC, TronScan

---

## 🚀 Getting started

### Prerequisites
- Node.js 20+ (built on v24)
- A Sui wallet browser extension (e.g. [Slush](https://slush.app)) with **testnet SUI** for gas
- *(Optional)* an [Etherscan API key](https://etherscan.io/apis) for faster, more reliable EVM history

### Run the dashboard

```bash
cd yeti-gas-guardian-dashboard
npm install
npm run dev
```

Open **http://localhost:3000**.

Optional environment variables — create `yeti-gas-guardian-dashboard/.env`:

```
# Faster, more reliable EVM gas history (one key covers all 6 EVM chains via Etherscan V2)
ETHERSCAN_API_KEY=your_key_here

# Enables tap-to-connect EVM wallets on mobile via WalletConnect (free ID at cloud.reown.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

> **ETHERSCAN_API_KEY** — without it, the app falls back to keyless Blockscout (works, but slower/less reliable on some chains).
>
> **NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID** — on mobile browsers there's no wallet extension, so "Connect Wallet" uses WalletConnect (deep-links into wallet apps). Without this ID, mobile users are prompted to paste their address instead.

### Build & test the contract

```bash
cd fee_ledger
sui move build
sui move test
```

---

## 📖 How to use

1. **Analyze** — paste a wallet address (EVM `0x…`, Solana, or Tron `T…`) and hit *Analyze wallet gas*, or upload a CSV. The metric cards fill in.
2. **Connect Sui** — click *Connect Sui* in the top nav and approve in your wallet.
3. **Save to Sui** — hit *Save to Sui*. The first save creates your personal ledger; every save updates the shared **Community Savings Board** and emits an event.
4. **Watch it grow** — the board refreshes live as analyses are saved on-chain.

---

## 📁 Project structure

```
.
├── fee_ledger/                  # Move smart contract
│   ├── sources/fee_ledger.move  # FeeLedger + SavingsBoard + events
│   ├── tests/                   # Move unit tests
│   └── Move.toml
└── yeti-gas-guardian-dashboard/ # Next.js frontend
    ├── app/                     # routes + API (gas history, pricing)
    ├── components/              # UI (wallet panel, metric cards, savings board…)
    └── lib/                     # chains, explorers, pricing, Sui helpers
```

---

## 🧊 A note from the Yeti

Switching to Sui won't get your old gas back — but it'll stop the bleeding. The Yeti is watching over your fees.
