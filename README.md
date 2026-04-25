# 👻 Phantmo

**A dual-token yield-bearing DeFi protocol optimized for the Monad ecosystem.**

Phantmo introduces a highly efficient way for users to park their stablecoins and earn passive yield, separating the stable unit of account from the yield generation engine.

---

## 🌟 Overview

In the Phantmo dual-token architecture, your deposit balance and your generated yield are strictly separated to provide a robust and predictable DeFi experience:

1. **Deposit:** Users deposit an underlying asset (e.g., `USDC`) into the Phantmo YieldVault.
2. **Stablecoin (`pUSD`):** In return, users receive **`pUSD` (Phantom USD)** strictly on a 1:1 ratio. `pUSD` is a standard ERC20 stablecoin that does not fluctuate in price.
3. **Yield Engine:** The vault's pooled assets automatically generate yield over time (12.5% APY).
4. **Separate Yield Tracking:** As yield is generated, it accumulates automatically per second. This yield does **not** alter the `pUSD` price or supply.
5. **Fair Claiming:** Users can claim their exact accrued yield at any time.

## 🚀 Key Features

- **Dual-Token System:** Strict 1:1 peg for `pUSD` combined with a separate `YieldVault` claiming mechanism.
- **Time-Based Yield:** Automatic yield accumulation per second based on a fixed 12.5% APY.
- **Fully Liquid:** Users can deposit `USDC` for `pUSD` or burn `pUSD` to withdraw `USDC` at any time.
- **Monad Optimized:** Built to leverage the extreme performance and EVM compatibility of the Monad blockchain.
- **Modern Web3 Frontend:** Built with Next.js, Tailwind CSS, shadcn/ui, Wagmi, and Privy for seamless wallet interactions.

## 🏗️ Project Structure

The repository is divided into two main parts:

- `/sc`: Smart Contracts (Foundry)
- `/fe`: Web3 Frontend (Next.js)

---

## 📜 Deployed Contracts (Monad Testnet)

- **MockUSDC**: [`0xBdA6fFc578B9E45e496A6ddd8a5Ee7DeDC72B9a1`](https://testnet.monadexplorer.com/address/0xBdA6fFc578B9E45e496A6ddd8a5Ee7DeDC72B9a1)
- **pUSD**: [`0xDd6C878DFD16bbE20b929a1c352381B2C7C09421`](https://testnet.monadexplorer.com/address/0xDd6C878DFD16bbE20b929a1c352381B2C7C09421)
- **YieldVault**: [`0x3AeCc6713bB2D948e469adbFA70Aaf8E9971ef23`](https://testnet.monadexplorer.com/address/0x3AeCc6713bB2D948e469adbFA70Aaf8E9971ef23)

---

## 💻 Smart Contracts (`/sc`)

This project uses [Foundry](https://getfoundry.sh/) for compiling, testing, and deployment.

### Prerequisites
- Install [Foundry](https://getfoundry.sh/)

Navigate to the smart contract folder:
```shell
cd sc
```

### Build
Compile the smart contracts:
```shell
forge build
```

### Test
Run the comprehensive test suite to verify the dual-token mechanics and yield accumulation:
```shell
forge test -vvv
```

### Deploy
A deployment script is provided to deploy MockUSDC, pUSD, and the YieldVault simultaneously:
```shell
forge script script/Deploy.s.sol:Deploy --rpc-url <YOUR_RPC_URL> --private-key <YOUR_PRIVATE_KEY> --broadcast
```

---

## 🖥️ Frontend (`/fe`)

The frontend is a modern Web3 application built with Next.js, React, Tailwind CSS, and integrates with Privy for easy wallet onboarding.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `pnpm` (or `npm`/`yarn`)

Navigate to the frontend folder:
```shell
cd fe
```

### Setup Environment
Create a `.env.local` file in the `/fe` directory and add the necessary environment variables, such as your Privy App ID and smart contract addresses:
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_YIELD_VAULT_ADDRESS=your_vault_address
NEXT_PUBLIC_USDC_ADDRESS=your_usdc_address
NEXT_PUBLIC_PUSD_ADDRESS=your_pusd_address
```

### Install Dependencies
```shell
pnpm install
```

### Run Locally
Start the development server:
```shell
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to interact with the dApp.

---
*Built with 💜 for the Monad ecosystem.*
