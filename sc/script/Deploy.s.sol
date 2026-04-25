// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {pUSD} from "../src/pUSD.sol";
import {YieldVault} from "../src/YieldVault.sol";

contract Deploy is Script {
    function run() public {
        vm.startBroadcast();

        // 1. Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();
        console2.log("MockUSDC deployed at:", address(usdc));

        // 2. Deploy pUSD
        pUSD pusdToken = new pUSD();
        console2.log("pUSD deployed at:", address(pusdToken));

        // 3. Deploy YieldVault
        YieldVault vault = new YieldVault(usdc, pusdToken);
        console2.log("YieldVault deployed at:", address(vault));

        // 4. Transfer ownership of pUSD to the Vault so it can mint/burn
        pusdToken.transferOwnership(address(vault));
        console2.log("Transferred pUSD ownership to YieldVault");

        // 5. Mint tokens to msg.sender
        uint256 initialMint = 1000 * 1e18;
        usdc.mint(msg.sender, initialMint);
        console2.log("Minted", initialMint / 1e18, "MockUSDC to", msg.sender);

        // 6. Approve vault
        uint256 depositAmount = 100 * 1e18;
        usdc.approve(address(vault), depositAmount);
        console2.log("Approved YieldVault to spend MockUSDC");

        // 7. Deposit initial liquidity
        vault.deposit(depositAmount);
        console2.log("Deposited", depositAmount / 1e18, "MockUSDC into YieldVault");
        console2.log("Received", pusdToken.balanceOf(msg.sender) / 1e18, "pUSD tokens");

        // 8. Fund the vault so it can pay out time-based yield later
        uint256 yieldFund = 1000000 * 1e18; // 1,000,000 USDC
        usdc.mint(address(vault), yieldFund);
        console2.log("Funded YieldVault with", yieldFund / 1e18, "MockUSDC to pay out future yield");

        vm.stopBroadcast();
    }
}
