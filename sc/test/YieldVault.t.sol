// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {YieldVault} from "../src/YieldVault.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {pUSD} from "../src/pUSD.sol";

contract YieldVaultTest is Test {
    YieldVault public vault;
    MockUSDC public usdc;
    pUSD public pusd;

    address public userA = address(1);
    address public userB = address(2);

    function setUp() public {
        usdc = new MockUSDC();
        pusd = new pUSD();
        vault = new YieldVault(usdc, pusd);
        
        // Transfer pUSD ownership to YieldVault so it can mint/burn
        pusd.transferOwnership(address(vault));

        // Fund users
        usdc.mint(userA, 1000 * 1e18);
        usdc.mint(userB, 1000 * 1e18);
        
        // Approvals
        vm.prank(userA);
        usdc.approve(address(vault), type(uint256).max);
        
        vm.prank(userB);
        usdc.approve(address(vault), type(uint256).max);
    }

    // 1. Deposit: User gets pUSD 1:1
    function test_Deposit() public {
        vm.prank(userA);
        vault.deposit(100 * 1e18);

        assertEq(pusd.balanceOf(userA), 100 * 1e18, "User A should get 100 pUSD");
        assertEq(vault.totalDeposits(), 100 * 1e18, "Total deposits should be 100");
    }

    // 2. Withdraw: Burning pUSD returns correct USDC
    function test_Withdraw() public {
        vm.prank(userA);
        vault.deposit(100 * 1e18);

        vm.prank(userA);
        vault.withdraw(100 * 1e18);

        assertEq(pusd.balanceOf(userA), 0, "User A pUSD should be burned");
        assertEq(usdc.balanceOf(userA), 1000 * 1e18, "User A should get USDC back");
        assertEq(vault.totalDeposits(), 0, "Total deposits should be 0");
    }

    // 3. Yield: simulateYield increases totalYield
    function test_YieldSimulation() public {
        vm.prank(userA);
        vault.deposit(100 * 1e18);

        vault.simulateYield(50 * 1e18);
        
        assertEq(vault.totalYield(), 50 * 1e18, "Total yield should increase");
    }

    // 4. Claim: Users claim proportional yield
    function test_Claim() public {
        vm.prank(userA);
        vault.deposit(100 * 1e18);

        vault.simulateYield(50 * 1e18);

        // Artificially fund the vault with the simulated yield so the transfer works
        usdc.mint(address(vault), 50 * 1e18);

        vm.prank(userA);
        vault.claimYield();

        assertEq(usdc.balanceOf(userA), 950 * 1e18, "User A should receive 50 yield on top of 900 remaining balance");
    }

    // 5. Multiple users: Fair distribution
    function test_MultipleUsersFairDistribution() public {
        // A deposits 100
        vm.prank(userA);
        vault.deposit(100 * 1e18);

        // 50 yield generated. A is the only depositor, so A should get all 50.
        vault.simulateYield(50 * 1e18);

        // B deposits 100. Total deposits now 200.
        vm.prank(userB);
        vault.deposit(100 * 1e18);

        // Another 100 yield generated. A (100) and B (100) split this 50/50.
        vault.simulateYield(100 * 1e18);

        // Total expected:
        // A: 50 + 50 = 100 yield
        // B: 50 yield

        usdc.mint(address(vault), 150 * 1e18);

        vm.prank(userA);
        vault.claimYield();

        vm.prank(userB);
        vault.claimYield();

        // A started with 1000, deposited 100 (900), claimed 100 -> 1000
        assertEq(usdc.balanceOf(userA), 1000 * 1e18, "A should have earned exactly 100 yield");
        
        // B started with 1000, deposited 100 (900), claimed 50 -> 950
        assertEq(usdc.balanceOf(userB), 950 * 1e18, "B should have earned exactly 50 yield");
    }
}
