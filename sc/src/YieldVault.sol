// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {pUSD} from "./pUSD.sol";

/**
 * @title YieldVault
 * @notice The yield engine for the Phantmo dual-token protocol.
 * Users deposit USDC and receive 1:1 pUSD. Yield is tracked separately and accumulates over time.
 */
contract YieldVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingAsset;
    pUSD public immutable stableToken;

    uint256 public constant APY_BPS = 1250; // 12.5%
    uint256 public constant SECONDS_PER_YEAR = 31557600; // 365.25 days

    uint256 public totalDeposits;

    mapping(address => uint256) public userDeposits;
    mapping(address => uint256) public userPendingYield;
    mapping(address => uint256) public userLastUpdateTime;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event YieldClaimed(address indexed user, uint256 amount);

    constructor(IERC20 _underlyingAsset, pUSD _stableToken) {
        require(address(_underlyingAsset) != address(0), "Invalid asset");
        require(address(_stableToken) != address(0), "Invalid stable token");
        underlyingAsset = _underlyingAsset;
        stableToken = _stableToken;
    }

    /**
     * @notice Internal function to calculate and store yield earned since the last update.
     */
    function _updateYield(address user) internal {
        if (userDeposits[user] > 0) {
            uint256 timeElapsed = block.timestamp - userLastUpdateTime[user];
            uint256 earned = (userDeposits[user] * APY_BPS * timeElapsed) / (10000 * SECONDS_PER_YEAR);
            userPendingYield[user] += earned;
        }
        userLastUpdateTime[user] = block.timestamp;
    }

    /**
     * @notice Gets the total claimable yield for a user, including pending and newly earned.
     */
    function getClaimableYield(address user) public view returns (uint256) {
        if (userDeposits[user] == 0) return userPendingYield[user];
        uint256 timeElapsed = block.timestamp - userLastUpdateTime[user];
        uint256 earned = (userDeposits[user] * APY_BPS * timeElapsed) / (10000 * SECONDS_PER_YEAR);
        return userPendingYield[user] + earned;
    }

    /**
     * @notice Deposits USDC to receive 1:1 pUSD.
     * @param amount The amount of USDC to deposit.
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        // 1. Update yield BEFORE changing balances
        _updateYield(msg.sender);

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

        // 1. Update yield BEFORE changing balances
        _updateYield(msg.sender);

        totalDeposits -= amount;
        userDeposits[msg.sender] -= amount;

        // 2. Effects & Interactions
        stableToken.burn(msg.sender, amount);
        underlyingAsset.safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    /**
     * @notice Claims accrued time-based yield for the user.
     */
    function claimYield() external {
        _updateYield(msg.sender);
        
        uint256 claimable = userPendingYield[msg.sender];
        require(claimable > 0, "No yield to claim");

        // Effects
        userPendingYield[msg.sender] = 0;

        // Interactions
        // The vault must have enough MockUSDC to pay out this yield.
        underlyingAsset.safeTransfer(msg.sender, claimable);

        emit YieldClaimed(msg.sender, claimable);
    }
}
