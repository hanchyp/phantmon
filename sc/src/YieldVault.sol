// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {pUSD} from "./pUSD.sol";

/**
 * @title YieldVault
 * @notice The yield engine for the Phantmon dual-token protocol.
 * Users deposit USDC and receive 1:1 pUSD. Yield is tracked separately and can be claimed.
 */
contract YieldVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingAsset;
    pUSD public immutable stableToken;

    uint256 public totalDeposits;
    uint256 public totalYield;

    // We use a standard accumulator for robust reward accounting
    // This prevents late depositors from stealing yield meant for early depositors
    uint256 public accYieldPerShare;

    mapping(address => uint256) public userDeposits;
    mapping(address => uint256) public userYieldDebt;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event YieldSimulated(uint256 amount);
    event YieldClaimed(address indexed user, uint256 amount);

    constructor(IERC20 _underlyingAsset, pUSD _stableToken) {
        require(address(_underlyingAsset) != address(0), "Invalid asset");
        require(address(_stableToken) != address(0), "Invalid stable token");
        underlyingAsset = _underlyingAsset;
        stableToken = _stableToken;
    }

    /**
     * @notice Deposits USDC to receive 1:1 pUSD.
     * @param amount The amount of USDC to deposit.
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        // 1. Accounting: Update debt for the new deposit amount to prevent claiming past yield
        userYieldDebt[msg.sender] += (amount * accYieldPerShare) / 1e18;
        
        totalDeposits += amount;
        userDeposits[msg.sender] += amount;

        // 2. Effects & Interactions
        underlyingAsset.safeTransferFrom(msg.sender, address(this), amount);
        stableToken.mint(msg.sender, amount);

        emit Deposit(msg.sender, amount);
    }

    /**
     * @notice Burns pUSD to withdraw deposited USDC 1:1.
     * @param amount The amount of pUSD to burn / USDC to withdraw.
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(userDeposits[msg.sender] >= amount, "Insufficient deposit");

        // 1. Accounting: Decrease debt proportionally so un-claimed yield remains intact
        userYieldDebt[msg.sender] -= (amount * accYieldPerShare) / 1e18;

        totalDeposits -= amount;
        userDeposits[msg.sender] -= amount;

        // 2. Effects & Interactions
        stableToken.burn(msg.sender, amount);
        underlyingAsset.safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    /**
     * @notice Simulates yield being accumulated by the vault.
     * @param amount The amount of yield to simulate.
     * @dev Does not transfer tokens. For users to successfully claim, the vault must actually possess the USDC.
     */
    function simulateYield(uint256 amount) external {
        require(amount > 0, "Yield must be > 0");
        require(totalDeposits > 0, "No deposits to earn yield");

        totalYield += amount;
        accYieldPerShare += (amount * 1e18) / totalDeposits;

        emit YieldSimulated(amount);
    }

    /**
     * @notice For the dual-token MVP, yield naturally accumulates in totalYield.
     * This function is a placeholder per specifications.
     */
    function compound() external {
        // In this dual-token model, yield is tracked separately via accYieldPerShare
        // and doesn't get compounded into the deposit principal (which would alter the 1:1 pUSD ratio).
    }

    /**
     * @notice Claims accrued yield for the user.
     */
    function claimYield() external {
        uint256 accumulated = (userDeposits[msg.sender] * accYieldPerShare) / 1e18;
        uint256 claimable = accumulated - userYieldDebt[msg.sender];

        require(claimable > 0, "No yield to claim");

        // Effects
        userYieldDebt[msg.sender] = accumulated;

        // Interactions
        underlyingAsset.safeTransfer(msg.sender, claimable);

        emit YieldClaimed(msg.sender, claimable);
    }
}
