// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title pUSD
 * @notice The user-facing 1:1 stablecoin for the Phantmo protocol.
 * Only the YieldVault (which will be set as the owner) can mint or burn.
 */
contract pUSD is ERC20, Ownable {
    constructor() ERC20("Phantom USD", "pUSD") Ownable(msg.sender) {}

    /**
     * @notice Mints pUSD tokens to the specified address.
     * @param to The address receiving the tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burns pUSD tokens from the specified address.
     * @param from The address losing the tokens.
     * @param amount The amount of tokens to burn.
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
