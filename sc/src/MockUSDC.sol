// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice A mock ERC20 token for testing purposes.
 * Configured to use 18 decimals for simplicity in this MVP.
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("MockUSDC", "mUSDC") {}

    /**
     * @notice Mints tokens to the specified address.
     * @param to The address receiving the tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
