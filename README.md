# 👻 Phantmo (Phantom Monad)

**A dual-token yield-bearing DeFi protocol optimized for the Monad ecosystem.**

Phantmo introduces a highly efficient way for users to park their stablecoins and earn passive yield, separating the stable unit of account from the yield generation engine.

---

## 🌟 Overview

In the Phantmo dual-token architecture, your deposit balance and your generated yield are strictly separated to provide a robust and predictable DeFi experience:

1. **Deposit:** Users deposit an underlying asset (e.g., `USDC`) into the Phantmo YieldVault.
2. **Stablecoin (`pUSD`):** In return, users receive **`pUSD` (Phantom USD)** strictly on a 1:1 ratio. `pUSD` is a standard ERC20 stablecoin that does not fluctuate in price.
3. **Yield Engine:** The vault's pooled assets are utilized off-chain or across other DeFi protocols to generate yield.
4. **Separate Yield Tracking:** As yield is generated, it accumulates inside the vault's accounting system. This yield does **not** alter the `pUSD` price or supply.
5. **Fair Claiming:** Users can claim their exact proportional share of the yield at any time, calculated safely using industry-standard reward accumulator mechanics.

## 🚀 Key Features

- **Dual-Token System:** Strict 1:1 peg for `pUSD` combined with a separate `YieldVault` claiming mechanism.
- **Fair Distribution:** Utilizes the MasterChef-style accumulator (`accYieldPerShare`) to guarantee mathematically fair yield distribution, preventing late depositors from stealing early yield.
- **Fully Liquid:** Users can deposit `USDC` for `pUSD` or burn `pUSD` to withdraw `USDC` at any time.
- **Monad Optimized:** Built to leverage the extreme performance and EVM compatibility of the Monad blockchain.

## 🛠️ Core Mechanics

- **`deposit(amount)`**: Transfers `USDC` from the user to the vault, updates the user's yield debt, and mints `pUSD` strictly 1:1.
- **`withdraw(amount)`**: Burns the user's `pUSD`, proportionally reduces their yield debt, and returns `USDC` strictly 1:1.
- **`claimYield()`**: Calculates the user's proportional share of the accumulated `totalYield` and transfers the earned `USDC` directly to their wallet.
- **`simulateYield(amount)`**: (MVP Feature) Simulates external yield generation by accumulating pending yield into the global reward pool.

## 💻 Development & Setup

This project uses [Foundry](https://getfoundry.sh/) for compiling, testing, and deployment.

### Prerequisites
- Install [Foundry](https://getfoundry.sh/)

Navigate to the smart contract folder first:
```shell
cd sc
```

### Build
Compile the smart contracts:
```shell
forge build
```

### Test
Run the comprehensive test suite to verify the dual-token mechanics (1:1 minting, multi-user yield fairness, and withdrawal):
```shell
forge test -vvv
```

### Deploy
A deployment script is provided to deploy MockUSDC, pUSD, and the YieldVault simultaneously:
```shell
forge script script/Deploy.s.sol:Deploy --rpc-url <YOUR_RPC_URL> --private-key <YOUR_PRIVATE_KEY> --broadcast
```

---
*Built with 💜 for the Monad ecosystem.*
